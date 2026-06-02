import { supabase } from "./supabase";

// Theme values used for pace cards and covers.
// These are just stylistic defaults; the actual data stored in Supabase can override them.
export const themeByMood = {
  chaotic: "from-[#8f6b67]/25 via-[#181716]/30 to-[#d7d5cf]/15",
  peaceful: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
  "late-night": "from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25",
  nostalgic: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
  soft: "from-[#d7d5cf]/18 via-[#27231f]/20 to-[#8f6b67]/16",
  adventure: "from-[#7d8577]/24 via-[#161615]/30 to-[#c9beb1]/16",
  "core-memory": "from-[#d2c5b1]/26 via-[#11100f]/25 to-[#8f6b67]/18"
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function relativeTime(value) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

// Convert the row returned from Supabase into the shape the app expects.
// This function also handles relationships joined from paces.
export function normalizePace(row) {
  const members = row.pace_members && row.pace_members.length > 0
    ? row.pace_members.map((member) => member.profiles?.display_name || "Friend")
    : ["Me"];
  const latest = row.memories?.[0];
  
  // Extract up to 3 actual photo memory media URLs to form a card preview collage
  const photoMemories = row.memories
    ? row.memories
        .filter((m) => m.type === "photo" && m.media_url)
        .map((m) => m.media_url)
        .slice(0, 3)
    : [];

  const collage = [row.cover_url, ...photoMemories].filter(Boolean);

  return {
    id: row.id,
    title: row.title,
    mood: row.mood,
    members,
    last: latest ? relativeTime(latest.created_at) : "New Pace",
    snippet: latest?.caption || row.description || "A private room for the moments that still glow.",
    color: row.color_theme || themeByMood[row.mood] || themeByMood.nostalgic,
    cover: row.cover_url,
    collage: collage.length > 0 ? collage : [row.cover_url].filter(Boolean),
    archivedAt: row.archived_at
  };
}

// Convert a memory row from Supabase into the shape the app expects.
export function normalizeMemory(row) {
  return {
    id: row.id,
    type: row.type,
    author: row.profiles?.display_name || "Me",
    time: formatTime(row.memory_at),
    date: formatDate(row.memory_at),
    caption: row.caption || row.ai_caption || "",
    image: row.media_url,
    mood: row.ai_mood || row.mood || "soft",
    lockedUntil: row.locked_until,
    location: row.location_name
  };
}

export async function ensureProfile(user) {
  if (!supabase || !user?.id) return null;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Pace friend";

  const { data: rpcData, error: rpcError } = await supabase.rpc("ensure_user_profile", {
    display_name_arg: displayName,
    avatar_url_arg: user.user_metadata?.avatar_url || null
  });

  if (!rpcError) return rpcData;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        avatar_url: user.user_metadata?.avatar_url || null
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch paces from Supabase.
// If RLS is enabled, this query will only return paces the current user is allowed to read.
export async function fetchPaces() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("paces")
    .select(
      "*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, type, media_url, created_at)"
    )
    .order("updated_at", { ascending: false })
    .order("created_at", { foreignTable: "memories", ascending: false })
    .limit(24);

  if (error) throw error;
  return data.map(normalizePace);
}

// Fetch memories for a specific pace.
// RLS must allow the current user to read memories for this pace.
export async function fetchMemories(paceId) {
  if (!supabase || !paceId) return [];
  const { data, error } = await supabase
    .from("memories")
    .select("*, profiles(display_name, avatar_url)")
    .eq("pace_id", paceId)
    .order("memory_at", { ascending: false });

  if (error) throw error;
  return data.map(normalizeMemory);
}

// Create a new pace in Supabase.
// This function now explicitly uses the current authenticated user id as owner_id
// so that the insert can satisfy RLS policies like `owner_id = auth.uid()`.
export async function createPace({ title, description, mood, coverUrl }) {
  if (!supabase) return null;

  console.log("createPace called", { title, mood, coverUrl });

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const user = sessionData?.session?.user;
  console.log("createPace session", { userId: user?.id, email: user?.email });
  if (!user?.id) {
    throw new Error("You must be signed in to create a Pace.");
  }

  const theme = themeByMood[mood] || themeByMood.nostalgic;

  // Attempt using the robust SQL RPC function first (bypasses RLS constraints using security definer)
  console.log("Attempting Pace creation via Supabase RPC...");
  const { data, error } = await supabase.rpc("create_pace", {
    title_arg: title,
    description_arg: description || null,
    mood_arg: mood,
    cover_url_arg: coverUrl || null,
    color_theme_arg: theme
  });

  if (error) {
    console.warn("createPace RPC failed or not found, attempting fallback direct insert...", error);
    
    await ensureProfile(user);
    
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("paces")
      .insert({
        owner_id: user.id,
        title,
        description: description || null,
        mood,
        cover_url: coverUrl || null,
        color_theme: theme
      })
      .select()
      .single();

    if (fallbackError) {
      console.error("createPace fallback direct insert error:", fallbackError);
      throw fallbackError;
    }

    console.log("createPace fallback direct insert succeeded", fallbackData);
    return normalizePace({ ...fallbackData, pace_members: [], memories: [] });
  }

  console.log("createPace RPC succeeded", data);
  return normalizePace({ ...data, pace_members: [], memories: [] });
}

// Create a new memory. This also relies on RLS for `author_id` and `pace_id`.
// If your `memories` insert policy requires author_id = auth.uid(), pass the signed-in user.
export async function createMemory({ paceId, authorId, type, caption, mood, mediaUrl, locationName, memoryAt, lockedUntil }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("memories")
    .insert({
      pace_id: paceId,
      author_id: authorId,
      type,
      caption,
      mood,
      media_url: mediaUrl,
      location_name: locationName,
      memory_at: memoryAt || new Date().toISOString(),
      locked_until: lockedUntil || null
    })
    .select("*, profiles(display_name, avatar_url)")
    .single();

  if (error) throw error;
  return normalizeMemory(data);
}

// Create a new invite. RLS for pace_invites usually requires invited_by = auth.uid()
// and that the current user is a member or owner of the pace.
export async function createInvite({ paceId, invitedBy, email }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("pace_invites")
    .insert({
      pace_id: paceId,
      invited_by: invitedBy,
      email: email || null
    })
    .select("token, expires_at")
    .single();

  if (error) throw error;
  return {
    token: data.token,
    expiresAt: data.expires_at,
    url: `${window.location.origin}?invite=${data.token}`
  };
}

// Upload a file to Supabase Storage. This is not directly controlled by the paces RLS policy,
// but storage bucket permissions still apply.
export async function uploadMemoryFile({ paceId, file }) {
  if (!supabase || !file) return null;
  const extension = file.name.split(".").pop() || "bin";
  const filePath = `${paceId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("pace-media").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) throw error;
  const { data } = supabase.storage.from("pace-media").getPublicUrl(filePath);
  return data.publicUrl;
}

// Subscribe to real-time memory inserts for a specific pace.
// This is a client-side realtime listener, not a direct DB insert/select call.
export function subscribeToMemories(paceId, onMemory) {
  if (!supabase || !paceId) return null;

  const channel = supabase
    .channel(`pace:${paceId}:memories`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "memories",
        filter: `pace_id=eq.${paceId}`
      },
      (payload) => onMemory(normalizeMemory(payload.new))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Update an existing Pace's metadata and settings.
export async function updatePace(paceId, updates) {
  if (!supabase || !paceId) return null;
  const { data, error } = await supabase
    .from("paces")
    .update(updates)
    .eq("id", paceId)
    .select(
      "*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, type, media_url, created_at)"
    )
    .single();

  if (error) throw error;
  return normalizePace(data);
}

// Soft archive an existing Pace by setting archived_at.
export async function archivePace(paceId) {
  if (!supabase || !paceId) return null;
  const { data, error } = await supabase
    .from("paces")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", paceId)
    .select(
      "*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, type, media_url, created_at)"
    )
    .single();

  if (error) throw error;
  return normalizePace(data);
}

// Unarchive a previously archived Pace by setting archived_at to null.
export async function unarchivePace(paceId) {
  if (!supabase || !paceId) return null;
  const { data, error } = await supabase
    .from("paces")
    .update({ archived_at: null })
    .eq("id", paceId)
    .select(
      "*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, type, media_url, created_at)"
    )
    .single();

  if (error) throw error;
  return normalizePace(data);
}

