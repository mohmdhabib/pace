/**
 * ============================================================================
 * FILE NAME: relationshipApi.js
 * TYPE: Core API layer
 * PURPOSE: Exposes methods to compute and query friendship stats, shared Paces,
 *          milestone timelines, and emotional recap summaries.
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import { mockRelationshipStats } from "../shared/constants";
import { isLiveId } from "../shared/utils";

/**
 * fetchRelationship
 * Computes relationship statistics between current user and target user.
 */
export async function fetchRelationship(targetUserId) {
  if (!isSupabaseConfigured || !targetUserId || !isLiveId(targetUserId)) {
    return mockRelationshipStats[targetUserId] || mockRelationshipStats.user_arjun;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mockRelationshipStats.user_arjun;

    // 1. Fetch profile details of the target user
    const { data: targetProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileErr) throw profileErr;
    const friendName = targetProfile?.display_name || "Friend";

    // 2. Fetch the shared Paces (spaces both users belong to)
    const { data: myMemberships, error: myMemErr } = await supabase
      .from("pace_members")
      .select("pace_id")
      .eq("user_id", user.id);

    if (myMemErr) throw myMemErr;
    const myPaceIds = myMemberships?.map((m) => m.pace_id) || [];

    if (myPaceIds.length === 0) {
      return emptyRelationship(friendName, targetProfile?.avatar_url);
    }

    const { data: sharedPacesData, error: sharedErr } = await supabase
      .from("pace_members")
      .select(`
        pace_id,
        created_at,
        paces(*)
      `)
      .in("pace_id", myPaceIds)
      .eq("user_id", targetUserId);

    if (sharedErr) throw sharedErr;
    const sharedPaceIds = sharedPacesData?.map((p) => p.pace_id) || [];
    const sharedPaces = sharedPacesData?.map((p) => p.paces).filter(Boolean) || [];

    if (sharedPaceIds.length === 0) {
      return emptyRelationship(friendName, targetProfile?.avatar_url);
    }

    // 3. Fetch shared memories inside those Paces
    const { data: memories, error: memErr } = await supabase
      .from("memories")
      .select(`
        *,
        profiles:author_id(display_name)
      `)
      .in("pace_id", sharedPaceIds)
      .order("memory_at", { ascending: false });

    if (memErr) throw memErr;

    // 4. Calculate metrics
    const photosCount = memories?.filter((m) => m.type === "photo").length || 0;
    const voiceCount = memories?.filter((m) => m.type === "voice").length || 0;
    const videoCount = memories?.filter((m) => m.type === "video").length || 0;
    const locations = [...new Set(memories?.map((m) => m.location_name).filter(Boolean))];

    // Build timeline milestones dynamically
    const timeline = [];
    if (sharedPacesData && sharedPacesData.length > 0) {
      const oldestJoin = [...sharedPacesData].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )[0];
      
      timeline.push({
        id: "t-join",
        date: new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(oldestJoin.created_at)),
        type: "pace",
        label: "First Pace Shared",
        detail: `Joined "${oldestJoin.paces?.title || "a space"}" together`
      });
    }

    if (memories && memories.length > 0) {
      const oldestMemory = memories[memories.length - 1];
      timeline.push({
        id: "t-mem",
        date: new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(oldestMemory.memory_at)),
        type: "memory",
        label: "First Memory Shared",
        detail: oldestMemory.caption || "Added first scrap"
      });
    }

    // Calculate friendship duration
    let durationStr = "1 month";
    if (sharedPacesData && sharedPacesData.length > 0) {
      const oldestJoin = [...sharedPacesData].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      )[0];
      const diffTime = Math.abs(new Date() - new Date(oldestJoin.created_at));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        const diffMonths = Math.floor(diffDays / 30);
        durationStr = `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
      } else {
        durationStr = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      }
    }

    return {
      name: friendName,
      avatarUrl: targetProfile?.avatar_url,
      friendshipDuration: `Friends for ${durationStr}`,
      stats: [
        { label: "Shared Paces", value: sharedPaceIds.length, icon: "Layers" },
        { label: "Shared Memories", value: memories?.length || 0, icon: "Heart" },
        { label: "Photos", value: photosCount, icon: "Image" },
        { label: "Voice Notes", value: voiceCount, icon: "Mic" },
        { label: "Videos", value: videoCount, icon: "Video" },
        { label: "Locations", value: locations.length, icon: "MapPin" }
      ],
      aiRecap: {
        text: `You and ${friendName} have captured ${memories?.length || 0} moments together. Most of your memories are in ${sharedPaces[0]?.title || "shared spaces"}.`,
        sparkles: true
      },
      timeline,
      sharedMemories: memories?.map((m) => ({
        id: m.id,
        type: m.type,
        author: m.profiles?.display_name || "Friend",
        date: new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date(m.memory_at)),
        caption: m.caption || "",
        image: m.media_url,
        mood: m.mood || "soft"
      })) || []
    };
  } catch (err) {
    console.warn("Failed to fetch relationship details from Supabase, using mock:", err);
    return mockRelationshipStats[targetUserId] || mockRelationshipStats.user_arjun;
  }
}

/**
 * generateFriendshipRecap
 * Computes recap client-side or queries RPCs.
 */
export async function generateFriendshipRecap(targetUserId) {
  try {
    const data = await fetchRelationship(targetUserId);
    return data.aiRecap;
  } catch (err) {
    const relationship = mockRelationshipStats[targetUserId] || mockRelationshipStats.user_arjun;
    return relationship.aiRecap;
  }
}

function emptyRelationship(friendName, avatarUrl = null) {
  return {
    name: friendName,
    avatarUrl,
    friendshipDuration: "Just connected",
    stats: [
      { label: "Shared Paces", value: 0, icon: "Layers" },
      { label: "Shared Memories", value: 0, icon: "Heart" },
      { label: "Photos", value: 0, icon: "Image" },
      { label: "Voice Notes", value: 0, icon: "Mic" },
      { label: "Videos", value: 0, icon: "Video" },
      { label: "Locations", value: 0, icon: "MapPin" }
    ],
    aiRecap: {
      text: `No memories shared yet with ${friendName}. Add a post to a shared Pace to start capturing memories!`,
      sparkles: false
    },
    timeline: [],
    sharedMemories: []
  };
}

/**
 * fetchCloseConnections
 * Fetches other profiles from the database to display in the Close Connections feed.
 * Falls back to mock profiles if offline or if no other profiles exist.
 */
export async function fetchCloseConnections() {
  if (!isSupabaseConfigured) {
    return Object.keys(mockRelationshipStats).map((key) => ({
      id: key,
      name: mockRelationshipStats[key].name,
      avatar_url: key === "user_arjun" 
        ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    }));
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Object.keys(mockRelationshipStats).map((key) => ({
        id: key,
        name: mockRelationshipStats[key].name,
        avatar_url: key === "user_arjun" 
          ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
          : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
      }));
    }

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .neq("id", user.id)
      .limit(10);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return Object.keys(mockRelationshipStats).map((key) => ({
        id: key,
        name: mockRelationshipStats[key].name,
        avatar_url: key === "user_arjun" 
          ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
          : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
      }));
    }

    return profiles.map(p => ({
      id: p.id,
      name: p.display_name || "Friend",
      avatar_url: p.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
    }));
  } catch (err) {
    console.warn("Failed to fetch close connections from Supabase, using mock:", err);
    return Object.keys(mockRelationshipStats).map((key) => ({
      id: key,
      name: mockRelationshipStats[key].name,
      avatar_url: key === "user_arjun" 
        ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
        : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
    }));
  }
}
