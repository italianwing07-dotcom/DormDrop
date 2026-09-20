import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MessageRow, NewMessage } from "@/lib/supabase/types";

type Client = SupabaseClient<Database>;
export const MAX_MESSAGE_LENGTH = 4000;

export async function getOrCreateConversation(client: Client, listingId: string, buyerId: string, sellerId: string) {
  if (buyerId === sellerId) throw new Error("You can't message yourself.");
  const find = () => client.from("conversations").select("*")
    .eq("listing_id", listingId).eq("buyer_id", buyerId).eq("seller_id", sellerId).maybeSingle();
  const existing = await find();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;
  const created = await client.from("conversations").insert({
    listing_id: listingId, buyer_id: buyerId, seller_id: sellerId
  }).select("*").single();
  if (!created.error && created.data) return created.data;
  // Another tab may have started this conversation while this request ran.
  const raced = await find();
  if (raced.data) return raced.data;
  throw created.error ?? new Error("Could not start this conversation.");
}

export async function sendMessage(client: Client, payload: NewMessage & { id: string }): Promise<MessageRow> {
  const content = payload.content.trim();
  if (!content || content.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Messages must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`);
  }
  const message = { ...payload, content };
  const result = await client.from("messages").insert(message).select("*").single();
  if (!result.error && result.data) return result.data;
  // Reusing the same ID on retry also recovers an insert whose response was lost.
  const existing = await client.from("messages").select("*").eq("id", payload.id).maybeSingle();
  if (existing.data && existing.data.sender_id === payload.sender_id &&
      existing.data.receiver_id === payload.receiver_id &&
      existing.data.conversation_id === payload.conversation_id && existing.data.content === content) {
    return existing.data;
  }
  throw result.error ?? new Error("Could not send this message. Please try again.");
}

export function mergeMessages(current: MessageRow[], incoming: MessageRow[]) {
  const byId = new Map([...current, ...incoming].map((message) => [message.id, message]));
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

// Serialize refreshes so a slower response cannot replace a newer snapshot.
// Realtime is supplemented by focus/reconnect refresh and a visible-tab fallback.
export function watchMessages(client: Client, refresh: () => Promise<void>, options: {
  conversationId?: string; readUpdates?: boolean;
} = {}) {
  let stopped = false;
  let running = false;
  let queued = false;
  async function refreshNow() {
    if (stopped) return;
    if (running) { queued = true; return; }
    running = true;
    try {
      do {
        queued = false;
        await refresh();
      } while (queued && !stopped);
    } finally { running = false; }
  }
  const requestRefresh = () => { void refreshNow().catch(() => { /* View displays its fetch error. */ }); };
  const visibleRefresh = () => { if (document.visibilityState !== "hidden") requestRefresh(); };
  const channel = client.channel(`messages:${options.conversationId ?? "inbox"}:${crypto.randomUUID()}`)
    .on("postgres_changes", {
      event: "INSERT", schema: "public", table: "messages",
      ...(options.conversationId ? { filter: `conversation_id=eq.${options.conversationId}` } : {})
    }, requestRefresh);
  if (options.readUpdates) {
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations" }, requestRefresh);
    window.addEventListener("dormdrop:messages-read", requestRefresh);
  }
  channel.subscribe((status) => { if (status === "SUBSCRIBED") requestRefresh(); });
  // Keep the auth callback synchronous; do Supabase work after it releases its lock.
  const auth = client.auth.onAuthStateChange(() => queueMicrotask(requestRefresh));
  const timer = window.setInterval(visibleRefresh, 15000);
  window.addEventListener("focus", visibleRefresh);
  window.addEventListener("online", visibleRefresh);
  document.addEventListener("visibilitychange", visibleRefresh);
  requestRefresh();
  return () => {
    stopped = true;
    window.clearInterval(timer);
    window.removeEventListener("focus", visibleRefresh);
    window.removeEventListener("online", visibleRefresh);
    window.removeEventListener("dormdrop:messages-read", requestRefresh);
    document.removeEventListener("visibilitychange", visibleRefresh);
    auth.data.subscription.unsubscribe();
    void client.removeChannel(channel);
  };
}
