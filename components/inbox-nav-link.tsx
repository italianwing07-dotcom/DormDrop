"use client";

import Link from "next/link";
import { ChatCircle } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ConversationRow, MessageRow } from "@/lib/supabase/types";

import { watchMessages } from "@/lib/supabase/messaging";

type ConversationReadState = Pick<
  ConversationRow,
  "id" | "buyer_id" | "seller_id" | "buyer_last_read_at" | "seller_last_read_at"
>;

type ReceivedMessage = Pick<
  MessageRow,
  "conversation_id" | "sender_id" | "receiver_id" | "created_at"
>;

function isUnreadForUser(
  conversation: ConversationReadState,
  message: ReceivedMessage,
  userId: string
) {
  if (message.receiver_id !== userId || message.sender_id === userId) {
    return false;
  }

  const lastReadAt =
    conversation.buyer_id === userId
      ? conversation.buyer_last_read_at
      : conversation.seller_last_read_at;

  return !lastReadAt || new Date(message.created_at) > new Date(lastReadAt);
}

export function InboxNavLink({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const supabase = getBrowserSupabaseClient();

    async function loadUnreadCount() {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const user = session.user;
        const { data: conversations, error: conversationsError } = await supabase
          .from("conversations")
          .select("id, buyer_id, seller_id, buyer_last_read_at, seller_last_read_at")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

        if (conversationsError) {
          throw conversationsError;
        }

        const conversationRows = (conversations ?? []) as ConversationReadState[];
        const conversationIds = conversationRows.map((conversation) => conversation.id);

        if (conversationIds.length === 0) {
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

        const { data: receivedMessages, error: messagesError } = await supabase
          .from("messages")
          .select("conversation_id, sender_id, receiver_id, created_at")
          .eq("receiver_id", user.id)
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (messagesError) {
          throw messagesError;
        }

        const conversationsById = new Map(
          conversationRows.map((conversation) => [conversation.id, conversation])
        );
        const unreadConversationIds = new Set<string>();

        for (const message of (receivedMessages ?? []) as ReceivedMessage[]) {
          const conversation = conversationsById.get(message.conversation_id);

          if (conversation && isUnreadForUser(conversation, message, user.id)) {
            unreadConversationIds.add(message.conversation_id);
          }
        }

        if (isMounted) {
          setUnreadCount(unreadConversationIds.size);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    const stop = watchMessages(supabase, loadUnreadCount, { readUpdates: true });
    return () => { isMounted = false; stop(); };
  }, [pathname]);

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);
  const unreadSuffix = unreadCount > 0 ? `, ${unreadCount} unread` : "";
  const active = pathname === "/inbox" || pathname.startsWith("/inbox/");

  if (compact) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        aria-label={`Inbox${unreadSuffix}`}
        className={
          "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition " +
          (active ? "text-campus-brand" : "text-campus-muted")
        }
        href="/inbox"
      >
        <span className="relative">
          <ChatCircle size={21} weight={active ? "fill" : "regular"} />
          {unreadCount > 0 ? (
            <span className="absolute -right-2 -top-1 flex min-w-4 items-center justify-center rounded-full bg-campus-danger px-1 text-[10px] font-semibold leading-4 text-white">
              {badgeLabel}
            </span>
          ) : null}
        </span>
        Inbox
      </Link>
    );
  }

  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={`Inbox${unreadSuffix}`}
      className={
        "relative flex min-h-10 shrink-0 items-center gap-1.5 rounded-ctl px-3 text-sm font-medium transition " +
        (active
          ? "bg-campus-soft text-campus-brand"
          : "text-campus-muted hover:bg-campus-surface hover:text-campus-ink")
      }
      href="/inbox"
    >
      Inbox
      {unreadCount > 0 ? (
        <span className="flex min-w-5 items-center justify-center rounded-full bg-campus-danger px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
          {badgeLabel}
        </span>
      ) : null}
    </Link>
  );
}
