"use client";

import Image from "next/image";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { Button, textareaClass } from "@/components/ui";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ListingImagePlaceholder, isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { getCampusDisplayName } from "@/lib/campuses";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ConversationRow, ListingRow, MessageRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

import { mergeMessages, sendMessage, watchMessages, MAX_MESSAGE_LENGTH } from "@/lib/supabase/messaging";

function getFriendlyConversationError(caughtError: unknown) {
  const message = caughtError instanceof Error ? caughtError.message.toLowerCase() : String(caughtError).toLowerCase();

  if (message.includes("row-level security") || message.includes("42501")) {
    return "You do not have access to this conversation.";
  }

  if (message.includes("network") || message.includes("failed to fetch")) {
    return "We couldn't connect to DormLoot right now. Please check your connection and try again.";
  }

  return "Could not load this conversation. Please try again.";
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
  const [sendError, setSendError] = useState<string | null>(null);
  const sending = useRef(false);
  const attempt = useRef<{ id: string; content: string; sender: string; conversationId: string } | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const followLatest = useRef(true);

  useEffect(() => {
    let active = true;
    let loadedUserId: string | null = null;
    const supabase = getBrowserSupabaseClient();
    setIsLoading(true);
    setConversation(null);
    setMessages([]);
    setMessage("");
    setSendError(null);
    attempt.current = null;
    followLatest.current = true;
    async function loadThread() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (loadedUserId !== (currentUser?.id ?? null)) {
          setMessages([]);
          setConversation(null);
          setMessage("");
          attempt.current = null;
        }
        loadedUserId = currentUser?.id ?? null;
        if (!currentUser) { setError(null); return; }
        const { data: conversationData, error: conversationError } = await supabase
          .from("conversations").select("*").eq("id", conversationId).single();
        if (conversationError) throw conversationError;
        const [listingResult, messageResult] = await Promise.all([
          supabase.from("listings").select("*").eq("id", conversationData.listing_id).maybeSingle(),
          supabase.from("messages").select("*").eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
        ]);
        if (listingResult.error) throw listingResult.error;
        if (messageResult.error) throw messageResult.error;
        if (!active) return;
        setConversation(conversationData);
        setListing(listingResult.data);
        setMessages((current) => mergeMessages(current, messageResult.data ?? []));
        setError(null);
        // Only acknowledge messages that were actually fetched while the tab was visible.
        const received = (messageResult.data ?? []).filter((item) => item.receiver_id === currentUser.id);
        const lastSeen = received.at(-1)?.created_at;
        const readColumn = conversationData.buyer_id === currentUser.id ? "buyer_last_read_at" : "seller_last_read_at";
        const previousRead = conversationData[readColumn];
        if (lastSeen && (!previousRead || lastSeen > previousRead) && document.visibilityState !== "hidden") {
          const { error: readError } = await supabase.from("conversations")
            .update(readColumn === "buyer_last_read_at" ? { buyer_last_read_at: lastSeen } : { seller_last_read_at: lastSeen })
            .eq("id", conversationId);
          if (!readError && active) window.dispatchEvent(new Event("dormloot:messages-read"));
        }
      } catch (caughtError) {
        if (active) setError(getFriendlyConversationError(caughtError));
      } finally {
        if (active) setIsLoading(false);
      }
    }
    const stop = watchMessages(supabase, loadThread, { conversationId });
    return () => { active = false; stop(); };
  }, [conversationId]);

  useEffect(() => {
    if (followLatest.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  async function handleSend() {
    const content = message.trim();
    if (!content || !user || !conversation || sending.current) return;
    sending.current = true;
    setIsSending(true);
    setSendError(null);
    try {
      if (!attempt.current || attempt.current.content !== content || attempt.current.sender !== user.id ||
          attempt.current.conversationId !== conversationId) {
        attempt.current = { id: crypto.randomUUID(), content, sender: user.id, conversationId };
      }
      const sent = await sendMessage(getBrowserSupabaseClient(), {
        id: attempt.current.id, conversation_id: conversationId, sender_id: user.id,
        receiver_id: conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id,
        content
      });
      followLatest.current = true;
      setMessages((current) => mergeMessages(current, [sent]));
      setMessage("");
      attempt.current = null;
    } catch {
      setSendError("We couldn't confirm that your message was sent. Check your connection and try again.");
    } finally {
      sending.current = false;
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-5 w-28 rounded-ctl bg-campus-surface" />
          <div className="h-28 rounded-card bg-campus-card shadow-card" />
          <div className="h-80 rounded-card bg-campus-card shadow-card" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-card border border-campus-border bg-campus-card p-6 shadow-card">
          <p className="text-sm font-semibold text-campus-danger">Login required</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to view messages</h1>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white transition hover:bg-campus-brandHover"
            href="/login"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  if (!conversation) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-card border border-campus-border bg-campus-card p-6 shadow-card">
          <p className="text-sm font-semibold text-campus-danger">Conversation unavailable</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Could not open this thread</h1>
          <p className="mt-3 text-sm leading-6 text-campus-muted">
            {error ?? "You may not have access to this conversation."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white transition hover:bg-campus-brandHover"
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
        <Link className="text-sm font-semibold text-campus-brand" href="/inbox">
          Back to inbox
        </Link>

        <Link
          className="flex items-center gap-3 rounded-card border border-campus-border bg-campus-card p-3 shadow-card transition hover:border-campus-borderStrong"
          href={listing ? `/listings/${listing.id}` : "/browse"}
        >
          <div className="relative size-14 shrink-0 overflow-hidden rounded-ctl bg-campus-surface">
            {listing && !isPlaceholderImageUrl(listing.image_url) ? (
              <Image
                alt={listing.title}
                className="h-full w-full object-cover"
                height={160}
                src={listing.image_url}
                width={160}
              />
            ) : listing ? (
              <ListingImagePlaceholder
                category={listing.category}
                className="p-2"
                title={listing.title}
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold tracking-tight text-campus-ink">
              {listing?.title ?? "This listing is no longer available"}
            </h1>
            <p className="mt-0.5 text-xs text-campus-muted">
              {getCampusDisplayName(listing?.campus)} · View listing
            </p>
          </div>
        </Link>

        <div className="space-y-4 rounded-card border border-campus-border bg-campus-card p-3 shadow-card sm:p-5">
          {error ? <p role="status" className="text-sm text-campus-danger">Messages could not refresh. Reconnecting automatically…</p> : null}
          <div ref={scroller} role="log" aria-label="Conversation messages" aria-live="polite"
            onScroll={() => { const el = scroller.current; if (el) followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; }}
            className="max-h-[52svh] space-y-3 overflow-y-auto pr-1 sm:max-h-[55vh]">
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
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    key={threadMessage.id}
                  >
                    <div
                      className={`max-w-[85%] rounded-card px-3.5 py-2.5 sm:max-w-[75%] ${
                        isMine
                          ? "bg-campus-brand text-white"
                          : "border border-campus-border bg-campus-surface text-campus-ink"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                        {threadMessage.content}
                      </p>
                    </div>
                    <p className="mt-1 px-1 text-[11px] text-campus-subtle">
                      <span className="sr-only">{senderLabel}, </span>
                      {formatMessageTime(threadMessage.created_at)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-ctl bg-campus-surface p-6 text-center">
                <p className="text-sm text-campus-muted">
                  No messages yet. Say hello and ask if the item is still available.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-campus-border pt-4">
            <label className="sr-only" htmlFor="reply">
              Write a reply
            </label>
            <textarea
              className={textareaClass}
              disabled={isSending}
              id="reply"
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write a message"
              value={message}
            />
            <p className="text-right text-xs text-campus-subtle">
              {message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
          {sendError ? (
            <div role="alert" className="rounded-ctl bg-campus-danger/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {sendError}
            </div>
          ) : null}
          <Button
            className="w-full sm:w-auto"
            disabled={isSending || !message.trim()}
            onClick={handleSend}
            size="lg"
            type="button"
          >
            <PaperPlaneTilt size={17} weight="fill" />
            {isSending ? "Sending" : "Send reply"}
          </Button>
        </div>
      </section>
    </main>
  );
}
