"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ConversationRow, MessageRow } from "@/lib/supabase/types";

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

export function InboxNavLink() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
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
          if (isMounted) {
            setUnreadCount(0);
          }
          return;
        }

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

          if (
            conversation &&
            isUnreadForUser(conversation, message, user.id)
          ) {
            unreadConversationIds.add(message.conversation_id);
          }
        }

        if (isMounted) {
          setUnreadCount(unreadConversationIds.size);
        }
      } catch (caughtError) {
        console.error("[DormDrop inbox] Could not load unread count", caughtError);
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    function handleMessagesRead() {
      loadUnreadCount();
    }

    window.addEventListener("dormdrop:messages-read", handleMessagesRead);
    window.addEventListener("focus", handleMessagesRead);

    return () => {
      isMounted = false;
      window.removeEventListener("dormdrop:messages-read", handleMessagesRead);
      window.removeEventListener("focus", handleMessagesRead);
    };
  }, [pathname]);

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Link
      className="relative rounded-full px-3 py-2 text-sm font-semibold text-campus-ink/70 transition hover:bg-white hover:text-campus-ink"
      href="/inbox"
    >
      <span className="inline-flex items-center gap-1.5">
        Inbox
        {unreadCount > 0 ? (
          <span className="flex min-w-5 items-center justify-center rounded-full bg-campus-coral px-1.5 py-0.5 text-[10px] font-black leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
