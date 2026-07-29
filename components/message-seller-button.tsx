"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function isVerifiedUser(user: User) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

function getFriendlyMessagingError(caughtError: unknown) {
  const message = caughtError instanceof Error ? caughtError.message.toLowerCase() : String(caughtError).toLowerCase();

  if (message.includes("row-level security") || message.includes("42501")) {
    return "We couldn't start that conversation. Please refresh, sign in again, and try once more.";
  }

  if (message.includes("network") || message.includes("failed to fetch")) {
    return "We couldn't connect to DormDrop right now. Please check your connection and try again.";
  }

  if (message.includes("your own listing") || message.includes("message yourself")) {
    return "You can't message yourself about your own listing.";
  }

  return "Could not send this message. Please try again.";
}

export function MessageSellerButton({
  listingId,
  listingTitle,
  sellerId
}: {
  listingId: string;
  listingTitle: string;
  sellerId?: string | null;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function getSignedInVerifiedUser() {
    const supabase = getBrowserSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
      throw new Error("sign-in-required");
    }

    if (!isVerifiedUser(user)) {
      throw new Error("email-not-verified");
    }

    return { supabase, user };
  }

  async function handleOpen() {
    setError(null);

    try {
      const { user } = await getSignedInVerifiedUser();

      if (user.id === sellerId) {
        setCurrentUserId(user.id);
        return;
      }

      setCurrentUserId(user.id);
      setIsOpen(true);
    } catch (caughtError) {
      const messageText = caughtError instanceof Error ? caughtError.message : String(caughtError);

      if (messageText === "sign-in-required") {
        setError("Sign in with your verified school email to message this seller.");
        return;
      }

      if (messageText === "email-not-verified") {
        setError("Please verify your school email before messaging sellers.");
        return;
      }

      setError(getFriendlyMessagingError(caughtError));
    }
  }

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !sellerId) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const { supabase, user } = await getSignedInVerifiedUser();

      if (user.id === sellerId) {
        throw new Error("You cannot message yourself about your own listing.");
      }

      const { data: existingConversation, error: existingError } = await supabase
        .from("conversations")
        .select("*")
        .eq("listing_id", listingId)
        .eq("buyer_id", user.id)
        .eq("seller_id", sellerId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      let conversationId = existingConversation?.id;

      if (!conversationId) {
        const { data: newConversation, error: conversationError } = await supabase
          .from("conversations")
          .insert({
            listing_id: listingId,
            buyer_id: user.id,
            seller_id: sellerId,
            buyer_last_read_at: new Date().toISOString(),
            seller_last_read_at: null
          })
          .select("*")
          .single();

        if (conversationError) {
          throw conversationError;
        }

        conversationId = newConversation.id;
      }

      if (!conversationId) {
        throw new Error("No valid conversation was available before sending.");
      }

      const { data: verifiedConversation, error: verifyConversationError } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, listing_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (verifyConversationError) {
        throw verifyConversationError;
      }

      if (!verifiedConversation) {
        throw new Error("Could not open the conversation before sending.");
      }

      const sentAt = new Date().toISOString();
      const receiverId = verifiedConversation.seller_id;

      if (!receiverId || receiverId === user.id) {
        throw new Error("Could not determine a valid message recipient.");
      }

      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          receiver_id: receiverId,
          content: trimmedMessage,
          created_at: sentAt
        })
        .select("id, conversation_id, sender_id, receiver_id, content, created_at")
        .single();

      if (messageError) {
        throw messageError;
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message_at: sentAt,
          buyer_last_read_at: sentAt
        })
        .eq("id", conversationId);

      if (updateError) {
        throw updateError;
      }

      setMessage("");
      router.push("/inbox/" + conversationId);
      router.refresh();
    } catch (caughtError) {
      const messageText = caughtError instanceof Error ? caughtError.message : String(caughtError);

      if (messageText === "sign-in-required") {
        setError("Sign in with your verified school email to message this seller.");
      } else if (messageText === "email-not-verified") {
        setError("Please verify your school email before messaging sellers.");
      } else {
        setError(getFriendlyMessagingError(caughtError));
      }
    } finally {
      setIsSending(false);
    }
  }

  if (!sellerId) {
    return (
      <p className="mt-4 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-semibold text-campus-muted">
        Messaging unavailable
      </p>
    );
  }

  if (currentUserId === sellerId) {
    return (
      <p className="mt-4 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-semibold text-campus-muted">
        This is your listing
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {!isOpen ? (
        <button
          className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
          onClick={handleOpen}
          type="button"
        >
          Message Seller
        </button>
      ) : (
        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-campus-ink">
              Message seller about {listingTitle}
            </span>
            <textarea
              className="min-h-28 w-full rounded-[14px] border border-campus-border px-4 py-3 text-sm outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hi, is this still available?"
              value={message}
            />
          </label>
          <button
            className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSending || !message.trim()}
            onClick={handleSend}
            type="button"
          >
            {isSending ? "Sending..." : "Send message"}
          </button>
        </div>
      )}
      {error ? (
        <p className="text-sm font-medium leading-6 text-campus-coral">{error}</p>
      ) : null}
    </div>
  );
}
