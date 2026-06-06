/**
 * ============================================================================
 * FILE NAME: chatApi.js
 * TYPE: Core API layer
 * PURPOSE: Exposes conversation, messaging, and reaction actions. Supports both
 *          direct database queries and local offline mockup fallbacks.
 * ============================================================================
 */

import { supabase } from "./supabase";
import { mockConversations, mockMessages } from "../shared/constants";

// Helper checking if we're in Supabase mode or offline sandbox mode
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

// Selection query for detailed message fetching (sender profiles + reference cards)
const MESSAGE_SELECT = `
  id,
  conversation_id,
  sender_id,
  type,
  content,
  media_url,
  created_at,
  profiles:sender_id(
    display_name,
    avatar_url
  ),
  reference_memory:reference_memory_id(
    id,
    type,
    caption,
    media_url,
    memory_at,
    profiles:author_id(display_name),
    paces:pace_id(title)
  ),
  reference_pace:reference_pace_id(
    id,
    title,
    cover_url,
    mood,
    pace_members(profiles(display_name)),
    memories(id)
  )
`;

// Helper to normalize message payloads returned from Supabase
function normalizeMessage(msg) {
  if (!msg) return null;
  return {
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    sender_name: msg.profiles?.display_name || "Friend",
    sender_avatar: msg.profiles?.avatar_url,
    type: msg.type,
    content: msg.content,
    media_url: msg.media_url,
    created_at: msg.created_at,
    reference_memory: msg.reference_memory ? {
      id: msg.reference_memory.id,
      type: msg.reference_memory.type,
      caption: msg.reference_memory.caption,
      image: msg.reference_memory.media_url,
      date: new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date(msg.reference_memory.memory_at)),
      author: msg.reference_memory.profiles?.display_name || "Friend",
      pace_title: msg.reference_memory.paces?.title || "Pace Moment"
    } : null,
    reference_pace: msg.reference_pace ? {
      id: msg.reference_pace.id,
      title: msg.reference_pace.title,
      cover: msg.reference_pace.cover_url,
      mood: msg.reference_pace.mood,
      members: msg.reference_pace.pace_members?.map(m => m.profiles?.display_name || "Friend") || [],
      memoriesCount: msg.reference_pace.memories?.length || 0
    } : null
  };
}

/**
 * fetchConversations
 * Lists all conversations. Falls back to mockConversations.
 */
export async function fetchConversations() {
  if (!isSupabaseConfigured) {
    return mockConversations;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockConversations;

    // First, get conversation IDs where the current user is a member
    const { data: memberRows, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (memberError) throw memberError;
    if (!memberRows || memberRows.length === 0) return [];

    const userConvIds = memberRows.map((m) => m.conversation_id);

    // Fetch only conversations the user is a member of
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        paces(
          id,
          title,
          cover_url,
          mood,
          pace_members(profiles(display_name))
        ),
        conversation_members(
          user_id,
          profiles(id, display_name, avatar_url)
        ),
        messages(
          id,
          content,
          type,
          created_at,
          media_url,
          sender_id
        )
      `)
      .in("id", userConvIds)
      .order("created_at", { foreignTable: "messages", ascending: false })
      .limit(1, { foreignTable: "messages" })
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return data.map((conv) => {
      const lastMsg = conv.messages?.[0];

      let title = conv.title;
      let avatar = null;
      let userId = null;
      let online = false;
      let stats = "";

      if (conv.type === "direct") {
        const otherMember = conv.conversation_members?.find(m => m.user_id !== user.id);
        if (otherMember) {
          title = otherMember.profiles?.display_name || "Pace Friend";
          avatar = otherMember.profiles?.avatar_url;
          userId = otherMember.profiles?.id;
          online = true;
        } else {
          title = "Pace Friend";
        }
        stats = "Direct Message";
      } else if (conv.type === "pace_group") {
        title = conv.paces?.title || conv.title || "Group Chat";
        avatar = conv.paces?.cover_url;
        const memberCount = conv.paces?.pace_members?.length || conv.conversation_members?.length || 0;
        stats = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
      }

      let lastMsgText = "No messages yet";
      if (lastMsg) {
        if (lastMsg.type === "text") {
          lastMsgText = lastMsg.content;
        } else if (lastMsg.type === "voice") {
          lastMsgText = "Sent a voice note";
        } else if (lastMsg.type === "memory_card") {
          lastMsgText = "Shared a memory";
        } else if (lastMsg.type === "pace_card") {
          lastMsgText = "Shared a Pace";
        }
      }

      let relativeTimeStr = "New chat";
      const referenceTime = lastMsg?.created_at || conv.updated_at || conv.created_at;
      if (referenceTime) {
        const diff = Date.now() - new Date(referenceTime).getTime();
        const minutes = Math.max(1, Math.round(diff / 60000));
        if (minutes < 60) relativeTimeStr = `${minutes} min ago`;
        else {
          const hours = Math.round(minutes / 60);
          if (hours < 24) relativeTimeStr = `${hours} hr ago`;
          else {
            const days = Math.round(hours / 24);
            relativeTimeStr = days === 1 ? "Yesterday" : `${days} days ago`;
          }
        }
      }

      return {
        id: conv.id,
        type: conv.type,
        title,
        avatar,
        userId,
        online,
        lastMessage: lastMsgText,
        timestamp: relativeTimeStr,
        unreadCount: 0,
        stats,
        recentMemoryImage: (lastMsg?.type === "memory_card" && lastMsg.media_url) ? lastMsg.media_url : null
      };
    });
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
      .select(MESSAGE_SELECT)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(normalizeMessage);
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User session not found.");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        type,
        content,
        media_url: mediaUrl,
        reference_memory_id: referenceMemoryId,
        reference_pace_id: referencePaceId
      })
      .select(MESSAGE_SELECT)
      .single();

    if (error) throw error;
    return normalizeMessage(data);
  } catch (err) {
    console.error("Error sending message:", err);
    throw err;
  }
}

/**
 * subscribeToMessages
 * Registers WebSocket subscription and fetches joined profiles for realtime rendering.
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
      async (payload) => {
        // Fetch full message details with relation joins to display sender details
        try {
          const { data, error } = await supabase
            .from("messages")
            .select(MESSAGE_SELECT)
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            onMessage(normalizeMessage(data));
          } else {
            onMessage(normalizeMessage(payload.new));
          }
        } catch (err) {
          console.warn("Failed to fetch full realtime message:", err);
          onMessage(normalizeMessage(payload.new));
        }
      }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No session found");

    const { data, error } = await supabase
      .from("reactions")
      .insert({ memory_id: memoryId, emoji, user_id: user.id })
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

/**
 * getOrCreateDMConversation
 * Creates or retrieves a 1:1 chat between the current user and the target user.
 */
export async function getOrCreateDMConversation(targetUserId) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No session found");

    // Query memberships of current user
    const { data: myMembers, error: myErr } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myErr) throw myErr;

    if (myMembers && myMembers.length > 0) {
      const convIds = myMembers.map((m) => m.conversation_id);

      // Find if any of these conversations is a 'direct' chat containing targetUserId
      const { data: dmMembers, error: dmErr } = await supabase
        .from("conversation_members")
        .select(`
          conversation_id,
          conversations!inner(type)
        `)
        .in("conversation_id", convIds)
        .eq("user_id", targetUserId)
        .eq("conversations.type", "direct");

      if (dmErr) throw dmErr;

      if (dmMembers && dmMembers.length > 0) {
        // Return existing DM conversation id
        return dmMembers[0].conversation_id;
      }
    }

    // Generate UUID client-side to bypass RLS select limitations on insert
    const convId = crypto.randomUUID();
    const { error: convErr } = await supabase
      .from("conversations")
      .insert({ id: convId, type: "direct" });

    if (convErr) throw convErr;

    // Add members
    const { error: membersErr } = await supabase
      .from("conversation_members")
      .insert([
        { conversation_id: convId, user_id: user.id },
        { conversation_id: convId, user_id: targetUserId }
      ]);

    if (membersErr) throw membersErr;

    return convId;
  } catch (err) {
    console.error("Error getting/creating DM:", err);
    throw err;
  }
}

/**
 * getOrCreatePaceGroupChat
 * Creates or retrieves a group conversation for a Pace.
 */
export async function getOrCreatePaceGroupChat(paceId, title) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No session found");

    // Check if group chat already exists
    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("id")
      .eq("pace_id", paceId)
      .eq("type", "pace_group")
      .maybeSingle();

    if (findError) throw findError;
    if (existing) return existing.id;

    // Generate UUID client-side to bypass RLS select limitations on insert
    const groupConvId = crypto.randomUUID();
    const { error: createError } = await supabase
      .from("conversations")
      .insert({
        id: groupConvId,
        pace_id: paceId,
        type: "pace_group",
        title: title
      });

    if (createError) throw createError;

    // Add current user as member of the conversation
    const { error: memberError } = await supabase
      .from("conversation_members")
      .insert({
        conversation_id: groupConvId,
        user_id: user.id
      });

    if (memberError) throw memberError;

    return groupConvId;
  } catch (err) {
    console.error("Error getting/creating group chat:", err);
    throw err;
  }
}

/**
 * joinPaceGroupChat
 * Joins the group conversation for a specific Pace ID.
 */
export async function joinPaceGroupChat(paceId) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Find the group conversation for this pace
    const { data: conv, error: findError } = await supabase
      .from("conversations")
      .select("id, title")
      .eq("pace_id", paceId)
      .eq("type", "pace_group")
      .maybeSingle();

    if (findError) throw findError;

    let convId = conv?.id;

    if (!convId) {
      // Get pace title
      const { data: pace } = await supabase
        .from("paces")
        .select("title")
        .eq("id", paceId)
        .single();
      
      convId = await getOrCreatePaceGroupChat(paceId, pace?.title || "Group Chat");
    } else {
      // Add the user to the conversation
      await supabase
        .from("conversation_members")
        .insert({
          conversation_id: convId,
          user_id: user.id
        })
        .select();
    }

    return convId;
  } catch (err) {
    console.warn("Failed to join pace group chat on client:", err);
    return null;
  }
}
