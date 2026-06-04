/**
 * ============================================================================
 * FILE NAME: chatApi.js
 * TYPE: Core API layer
 * PURPOSE: Exposes conversation, messaging, and reaction actions. Supports both
 *          direct database queries and local offline mockup fallbacks.
 * ============================================================================
 */

import { supabase } from "./supabase";
import { mockConversations, mockMessages, mockReactions } from "../shared/constants";

// Helper checking if we're in Supabase mode or offline sandbox mode
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * fetchConversations
 * Lists all conversations. Falls back to mockConversations.
 */
export async function fetchConversations() {
  if (!isSupabaseConfigured) {
    return mockConversations;
  }
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_members(user_id, profiles(display_name, avatar_url))
      `)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Failed to fetch conversations from Supabase, using mock:", err);
    return mockConversations;
  }
}

/**
 * fetchMessages
 * Fetches all messages for a conversation.
 */
export async function fetchMessages(conversationId) {
  if (!isSupabaseConfigured) {
    return mockMessages[conversationId] || [];
  }
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("Failed to fetch messages, using mock:", err);
    return mockMessages[conversationId] || [];
  }
}

/**
 * sendMessage
 * Sends a message.
 */
export async function sendMessage({
  conversationId,
  type = "text",
  content = "",
  mediaUrl = null,
  referenceMemoryId = null,
  referencePaceId = null
}) {
  if (!isSupabaseConfigured) {
    return {
      id: `local-msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: "me",
      type,
      content,
      media_url: mediaUrl,
      reference_memory_id: referenceMemoryId,
      reference_pace_id: referencePaceId,
      created_at: new Date().toISOString()
    };
  }
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        type,
        content,
        media_url: mediaUrl,
        reference_memory_id: referenceMemoryId,
        reference_pace_id: referencePaceId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
}

/**
 * subscribeToMessages
 * Registers WebSocket subscription.
 */
export function subscribeToMessages(conversationId, onMessage) {
  if (!isSupabaseConfigured) {
    return () => {};
  }
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * markAsRead
 * Marks a conversation as read.
 */
export async function markAsRead(conversationId) {
  if (!isSupabaseConfigured) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .match({ conversation_id: conversationId, user_id: user.id });
  } catch (err) {
    console.warn("Failed to mark conversation as read:", err);
  }
}

/**
 * addReaction
 * Adds an emoji reaction to a memory.
 */
export async function addReaction({ memoryId, emoji }) {
  if (!isSupabaseConfigured) {
    return { id: `local-react-${Date.now()}`, memory_id: memoryId, emoji, user_id: "me" };
  }
  try {
    const { data, error } = await supabase
      .from("reactions")
      .insert({ memory_id: memoryId, emoji })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error adding reaction:", err);
    throw err;
  }
}

/**
 * removeReaction
 * Removes an emoji reaction.
 */
export async function removeReaction({ memoryId, emoji }) {
  if (!isSupabaseConfigured) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("reactions")
      .delete()
      .match({ memory_id: memoryId, emoji, user_id: user.id });
  } catch (err) {
    console.error("Error removing reaction:", err);
  }
}
