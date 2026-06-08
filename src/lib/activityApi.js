/**
 * ============================================================================
 * FILE NAME: activityApi.js
 * TYPE: Application API Layer
 * PURPOSE: Fetches real-time activity metrics like reactions (echoes),
 *          milestones, and flashbacks.
 * ============================================================================
 */

import { supabase } from "./supabase";

/**
 * Calculates dynamic time differences between system now and action timestamp.
 */
function relativeTime(value) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

/**
 * Normalizes raw reaction rows into a standardized activity object for the feed.
 */
function normalizeReactionActivity(row) {
  return {
    id: `react-${row.id}`,
    user: {
      name: row.profiles?.display_name || "Someone",
      avatar: row.profiles?.avatar_url
    },
    text: `reacted ${row.emoji} to your memory`,
    detail: row.memories?.caption ? `"${row.memories.caption}"` : "A memory from your pace",
    time: relativeTime(row.created_at),
    type: "reaction",
    memoryId: row.memory_id,
    paceId: row.memories?.pace_id,
    timestamp: new Date(row.created_at).getTime()
  };
}

/**
 * fetchRecentActivities
 * Retrieves recent reactions left by other users on memories that the current user authored.
 * In a fully featured version, this could also fetch pace_member joins.
 */
export async function fetchRecentActivities() {
  if (!supabase) return [];
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    // We want to find reactions on memories that the current user authored
    // Since Supabase doesn't easily let us filter by grand-child relationships in a single query reliably,
    // we fetch memories authored by user first, then reactions.
    
    const { data: userMemories, error: memError } = await supabase
      .from('memories')
      .select('id')
      .eq('author_id', user.id);
      
    if (memError || !userMemories?.length) return [];
    
    const memoryIds = userMemories.map(m => m.id);

    const { data: reactions, error: reactError } = await supabase
      .from('reactions')
      .select('id, emoji, created_at, memory_id, profiles(display_name, avatar_url), memories(caption, pace_id)')
      .in('memory_id', memoryIds)
      .neq('user_id', user.id) // Don't show user's own reactions to themselves
      .order('created_at', { ascending: false })
      .limit(10);

    if (reactError) throw reactError;
    
    return reactions.map(normalizeReactionActivity);
  } catch (err) {
    console.error("Failed to fetch recent activities:", err);
    return [];
  }
}

/**
 * fetchFlashback
 * Retrieves an old photo memory for the "On This Day" flashback.
 */
export async function fetchFlashback(paceIds) {
  if (!supabase || !paceIds?.length) return null;

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*, profiles(display_name)')
      .in('pace_id', paceIds)
      .eq('type', 'photo')
      .not('media_url', 'is', null)
      .order('memory_at', { ascending: true }) // Oldest memory
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    
    return {
      id: data.id,
      caption: data.caption,
      image: data.media_url,
      author: data.profiles?.display_name || "Someone",
      mood: data.mood || "Nostalgic"
    };
  } catch (err) {
    console.error("Failed to fetch flashback:", err);
    return null;
  }
}

/**
 * subscribeToActivity
 * Real-time listener for new reactions.
 */
export function subscribeToActivity(onNewActivity) {
  if (!supabase) return () => {};

  // Subscribe to all insertions on reactions, we will filter them in the client or fetch details.
  const channel = supabase
    .channel('global-activity')
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "reactions" },
      async (payload) => {
        // Fetch the full detail of the reaction to normalize it
        const { data } = await supabase
          .from('reactions')
          .select('id, emoji, created_at, memory_id, profiles(display_name, avatar_url), memories(caption, pace_id, author_id)')
          .eq('id', payload.new.id)
          .single();
          
        if (data) {
          const { data: { user } } = await supabase.auth.getUser();
          // Notify only if it's a reaction to the current user's memory, by someone else
          if (user && data.memories?.author_id === user.id && data.user_id !== user.id) {
            onNewActivity(normalizeReactionActivity(data));
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
