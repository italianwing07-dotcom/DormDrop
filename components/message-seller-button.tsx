"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function formatSupabaseError(error: {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
}) {
  return JSON.stringify(
    {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    },
    null,
    2
  );
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

  async function handleOpen() {
    setError(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);
      setIsOpen(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not start a message."
      );
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
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        router.push("/login");
        return;
      }

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
        console.error("[DormDrop messaging] Existing conversation lookup failed", existingError);
        throw new Error(formatSupabaseError(existingError));
      }

      let conversationId = existingConversation?.id;

      console.log("[DormDrop messaging] Current user", user);
      console.log("[DormDrop messaging] Existing conversation", existingConversation);

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
          console.error("[DormDrop messaging] Conversation insert failed", conversationError);
          throw new Error(formatSupabaseError(conversationError));
        }

        conversationId = newConversation.id;
        console.log("[DormDrop messaging] New conversation", newConversation);
      }

      if (!conversationId) {
        throw new Error("No valid conversation_id was available before message insert.");
      }

      const { data: verifiedConversation, error: verifyConversationError } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, listing_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (verifyConversationError) {
        console.error(
          "[DormDrop messaging] Conversation verification failed",
          verifyConversationError
        );
        throw new Error(formatSupabaseError(verifyConversationError));
      }

      if (!verifiedConversation) {
        throw new Error(
          `Conversation ${conversationId} does not exist or is not readable before message insert.`
        );
      }

      const sentAt = new Date().toISOString();
      const receiverId = verifiedConversation.seller_id;

      if (!receiverId || receiverId === user.id) {
        throw new Error("Could not determine a valid receiver_id for this message.");
      }

      const messagePayload = {
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmedMessage,
        created_at: sentAt
      };

      console.log("[DormDrop messaging] Verified conversation", verifiedConversation);
      console.log("[DormDrop messaging] Message insert payload", messagePayload);

      const { error: messageError } = await supabase
        .from("messages")
        .insert(messagePayload)
        .select("id, conversation_id, sender_id, receiver_id, content, created_at")
        .single();

      if (messageError) {
        console.error("[DormDrop messaging] Message insert failed", {
          payload: messagePayload,
          error: messageError
        });
        throw new Error(formatSupabaseError(messageError));
      }

      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message_at: sentAt,
          buyer_last_read_at: sentAt
        })
        .eq("id", conversationId);

      if (updateError) {
        console.error("[DormDrop messaging] Conversation update failed", updateError);
        throw new Error(formatSupabaseError(updateError));
      }

      setMessage("");
      router.push(`/inbox/${conversationId}`);
      router.refresh();
    } catch (caughtError) {
      console.error("[DormDrop messaging] Send message failed", caughtError);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError)
      );
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
