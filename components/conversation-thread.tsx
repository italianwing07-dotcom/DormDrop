"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getCampusDisplayName } from "@/lib/campuses";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ConversationRow, ListingRow, MessageRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

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

function formatMessageTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function ConversationThread() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;
  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] = useState<ConversationRow | null>(null);
  const [listing, setListing] = useState<ListingRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadThread() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user: currentUser },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setUser(currentUser);

        if (!currentUser) {
          return;
        }

        const { data: conversationData, error: conversationError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (conversationError) {
          throw conversationError;
        }

        setConversation(conversationData);

        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", conversationData.listing_id)
          .maybeSingle();

        if (listingError) {
          throw listingError;
        }

        setListing(listingData);

        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (messagesError) {
          throw messagesError;
        }

        setMessages(messagesData ?? []);

        const readPayload =
          conversationData.buyer_id === currentUser.id
            ? { buyer_last_read_at: new Date().toISOString() }
            : { seller_last_read_at: new Date().toISOString() };

        const { error: readError } = await supabase
          .from("conversations")
          .update(readPayload)
          .eq("id", conversationId);

        if (readError) {
          console.error("[DormDrop messaging] Could not mark conversation as read", readError);
        } else {
          window.dispatchEvent(new Event("dormdrop:messages-read"));
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load this conversation."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadThread();
  }, [conversationId]);

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !user || !conversation) {
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { data: verifiedConversation, error: verifyConversationError } = await supabase
        .from("conversations")
        .select("id, buyer_id, seller_id, listing_id")
        .eq("id", conversation.id)
        .maybeSingle();

      if (verifyConversationError) {
        console.error(
          "[DormDrop messaging] Reply conversation verification failed",
          verifyConversationError
        );
        throw new Error(formatSupabaseError(verifyConversationError));
      }

      if (!verifiedConversation) {
        throw new Error(
          `Conversation ${conversation.id} does not exist or is not readable before reply insert.`
        );
      }

      const sentAt = new Date().toISOString();
      const receiverId =
        verifiedConversation.buyer_id === user.id
          ? verifiedConversation.seller_id
          : verifiedConversation.buyer_id;

      if (!receiverId || receiverId === user.id) {
        throw new Error("Could not determine a valid receiver_id for this reply.");
      }

      const messagePayload = {
        conversation_id: conversation.id,
        sender_id: user.id,
        receiver_id: receiverId,
        content: trimmedMessage,
        created_at: sentAt
      };

      console.log("[DormDrop messaging] Reply current user", user);
      console.log("[DormDrop messaging] Reply verified conversation", verifiedConversation);
      console.log("[DormDrop messaging] Reply insert payload", messagePayload);

      const { data: newMessage, error: messageError } = await supabase
        .from("messages")
        .insert(messagePayload)
        .select("id, conversation_id, sender_id, receiver_id, content, created_at")
        .single();

      if (messageError) {
        console.error("[DormDrop messaging] Reply insert failed", {
          payload: messagePayload,
          error: messageError
        });
        throw new Error(formatSupabaseError(messageError));
      }

      const readPayload =
        conversation.buyer_id === user.id
          ? { last_message_at: sentAt, buyer_last_read_at: sentAt }
          : { last_message_at: sentAt, seller_last_read_at: sentAt };

      const { error: updateError } = await supabase
        .from("conversations")
        .update(readPayload)
        .eq("id", conversation.id);

      if (updateError) {
        console.error("[DormDrop messaging] Reply conversation update failed", updateError);
        throw new Error(formatSupabaseError(updateError));
      }

      setMessages((currentMessages) => [...currentMessages, newMessage]);
      setConversation((currentConversation) =>
        currentConversation
          ? { ...currentConversation, ...readPayload, last_message_at: sentAt }
          : currentConversation
      );
      setMessage("");
    } catch (caughtError) {
      console.error("[DormDrop messaging] Reply send failed", caughtError);
      setError(
        caughtError instanceof Error ? caughtError.message : String(caughtError)
      );
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-5 w-28 rounded-full bg-campus-mint" />
          <div className="h-28 rounded-3xl bg-white shadow-soft" />
          <div className="h-80 rounded-3xl bg-white shadow-soft" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Login required</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to view messages</h1>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
            href="/login"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  if (error || !conversation) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Conversation unavailable</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Could not open this thread</h1>
          <p className="mt-3 text-sm leading-6 text-campus-ink/70">
            {error ?? "You may not have access to this conversation."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
            href="/inbox"
          >
            Back to inbox
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-5">
        <Link className="text-sm font-semibold text-campus-green" href="/inbox">
          Back to inbox
        </Link>

        <div className="flex gap-4 rounded-3xl border border-campus-ink/10 bg-white p-4 shadow-soft">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-campus-mint sm:size-24">
            {listing?.image_url ? (
              <Image
                alt={listing.title}
                className="h-full w-full object-cover"
                height={160}
                src={listing.image_url}
                width={160}
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-campus-green">Message thread</p>
            <h1 className="truncate text-2xl font-bold tracking-tight">
              {listing?.title ?? "DormDrop listing"}
            </h1>
            <p className="mt-1 text-sm text-campus-ink/60">
              {getCampusDisplayName(listing?.campus)}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-campus-ink/10 bg-white p-4 shadow-soft sm:p-5">
          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {messages.length > 0 ? (
              messages.map((threadMessage) => {
                const isMine = threadMessage.sender_id === user.id;
                const senderLabel = isMine
                  ? "You"
                  : threadMessage.sender_id === conversation.seller_id
                    ? "Seller"
                    : "Buyer";

                return (
                  <div
                    className={`rounded-2xl p-4 ${
                      isMine ? "bg-campus-mint" : "bg-campus-paper"
                    }`}
                    key={threadMessage.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-campus-ink">{senderLabel}</p>
                      <p className="text-xs font-semibold text-campus-ink/50">
                        {formatMessageTime(threadMessage.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-campus-ink/75">
                      {threadMessage.content}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-campus-paper p-5 text-center">
                <p className="text-sm font-semibold text-campus-ink/70">
                  No messages yet.
                </p>
              </div>
            )}
          </div>

          <label className="block space-y-2 border-t border-campus-ink/10 pt-4">
            <span className="text-sm font-semibold">Reply</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-campus-ink/15 px-4 py-3 text-sm outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message..."
              value={message}
            />
          </label>
          {error ? (
            <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {error}
            </div>
          ) : null}
          <button
            className="min-h-12 w-full rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            disabled={isSending || !message.trim()}
            onClick={handleSend}
            type="button"
          >
            {isSending ? "Sending..." : "Send reply"}
          </button>
        </div>
      </section>
    </main>
  );
}
