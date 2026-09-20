"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

import { getOrCreateConversation, sendMessage, MAX_MESSAGE_LENGTH } from "@/lib/supabase/messaging";

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
  const sending = useRef(false);
  const attempt = useRef<{ id: string; content: string; sender: string } | null>(null);
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

    if (!trimmedMessage || !sellerId || sending.current) {
      return;
    }

    setError(null);
    sending.current = true;
    setIsSending(true);

    try {
      const { supabase, user } = await getSignedInVerifiedUser();

      if (user.id === sellerId) {
        throw new Error("You cannot message yourself about your own listing.");
      }

      const conversation = await getOrCreateConversation(supabase, listingId, user.id, sellerId);
      if (!attempt.current || attempt.current.content !== trimmedMessage || attempt.current.sender !== user.id) {
        attempt.current = { id: crypto.randomUUID(), content: trimmedMessage, sender: user.id };
      }
      await sendMessage(supabase, {
        id: attempt.current.id, conversation_id: conversation.id,
        sender_id: user.id, receiver_id: sellerId, content: trimmedMessage
      });
      attempt.current = null;
      const conversationId = conversation.id;
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
      sending.current = false;
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
              disabled={isSending}
              maxLength={MAX_MESSAGE_LENGTH}
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
        <p role="alert" className="text-sm font-medium leading-6 text-campus-coral">{error}</p>
      ) : null}
    </div>
  );
}
