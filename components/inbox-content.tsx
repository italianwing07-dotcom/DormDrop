"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingImagePlaceholder, isPlaceholderImageUrl } from "@/components/listing-image-placeholder";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { getCampusDisplayName } from "@/lib/campuses";
import type { ConversationRow, ListingRow, MessageRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

type ConversationPreview = {
  conversation: ConversationRow;
  listing?: ListingRow;
  lastMessage?: MessageRow;
  isUnread: boolean;
};

function formatThreadTime(dateValue?: string) {
  if (!dateValue) {
    return "No messages yet";
  }

  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function InboxContent() {
  const [user, setUser] = useState<User | null>(null);
  const [previews, setPreviews] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInbox() {
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
          setPreviews([]);
          return;
        }

        const { data: conversations, error: conversationsError } = await supabase
          .from("conversations")
          .select("*")
          .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
          .order("last_message_at", { ascending: false });

        if (conversationsError) {
          throw conversationsError;
        }

        const conversationRows = conversations ?? [];
        const listingIds = Array.from(
          new Set(conversationRows.map((conversation) => conversation.listing_id))
        );
        const conversationIds = conversationRows.map((conversation) => conversation.id);

        const { data: listings, error: listingsError } = listingIds.length
          ? await supabase.from("listings").select("*").in("id", listingIds)
          : { data: [], error: null };

        if (listingsError) {
          throw listingsError;
        }

        const { data: messages, error: messagesError } = conversationIds.length
          ? await supabase
              .from("messages")
              .select("*")
              .in("conversation_id", conversationIds)
              .order("created_at", { ascending: false })
          : { data: [], error: null };

        if (messagesError) {
          throw messagesError;
        }

        const listingsById = new Map(
          (listings ?? []).map((listing) => [listing.id, listing])
        );
        const lastMessagesByConversation = new Map<string, MessageRow>();

        for (const message of messages ?? []) {
          if (!lastMessagesByConversation.has(message.conversation_id)) {
            lastMessagesByConversation.set(message.conversation_id, message);
          }
        }

        setPreviews(
          conversationRows.map((conversation) => {
            const lastMessage = lastMessagesByConversation.get(conversation.id);
            const lastReadAt =
              conversation.buyer_id === currentUser.id
                ? conversation.buyer_last_read_at
                : conversation.seller_last_read_at;
            const isUnread = Boolean(
              lastMessage &&
                lastMessage.sender_id !== currentUser.id &&
                (!lastReadAt || new Date(lastMessage.created_at) > new Date(lastReadAt))
            );

            return {
              conversation,
              listing: listingsById.get(conversation.listing_id),
              lastMessage,
              isUnread
            };
          })
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : "Could not load inbox."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInbox();
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="h-9 w-40 rounded-[14px] bg-slate-50" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="h-28 rounded-[20px] border border-campus-border bg-campus-card shadow-soft" key={index} />
          ))}
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[20px] border border-campus-border bg-campus-card p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Login required</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Sign in to view your inbox</h1>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
            href="/login"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-campus-green">Inbox</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Messages
          </h1>
        </div>
        {error ? (
          <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
            {error}
          </div>
        ) : null}
        {previews.length > 0 ? (
          <div className="space-y-3">
            {previews.map(({ conversation, listing, lastMessage, isUnread }) => (
              <Link
                className={`flex gap-3 rounded-[20px] border p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-campus-green/30 sm:gap-4 sm:p-4 ${
                  isUnread
                    ? "border-campus-green/40 bg-slate-50"
                    : "border-campus-border bg-campus-card"
                }`}
                href={`/inbox/${conversation.id}`}
                key={conversation.id}
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-slate-50 sm:size-24">
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold tracking-tight">
                        {listing?.title ?? "DormDrop listing"}
                      </h2>
                      <p className="mt-1 text-sm text-campus-muted">
                        {getCampusDisplayName(listing?.campus)}
                      </p>
                    </div>
                    {isUnread ? (
                      <span className="w-fit shrink-0 rounded-[14px] bg-campus-green px-3 py-1 text-xs font-bold text-white">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-campus-muted sm:mt-3">
                    {lastMessage
                      ? `${lastMessage.sender_id === user.id ? "You" : "Them"}: ${lastMessage.content}`
                      : "No messages yet."}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-campus-muted">
                    {formatThreadTime(lastMessage?.created_at ?? conversation.last_message_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-campus-border bg-campus-card p-8 text-center shadow-soft">
            <p className="text-sm font-semibold text-campus-green">No messages yet</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">Conversations will appear here.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-muted">
              Message a seller from a listing page to start a conversation.
            </p>
            <Link
              className="mt-5 inline-flex min-h-12 items-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover"
              href="/browse"
            >
              Browse listings
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
