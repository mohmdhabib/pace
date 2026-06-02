/**
 * ============================================================================
 * FILE NAME: paceApi.js
 * TYPE: Core Application API Layer / Database Services
 * PURPOSE: Serves as the primary transaction layer managing all operations on Paces
 *          (spaces) and Memories (posts). It coordinates data queries, writes, media file uploads
 *          to cloud storage buckets, and registers active WebSocket listeners for instant real-time
 *          feed updates.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Exports visual mood configuration gradients (`themeByMood`).
 * 2. Provides standard datetime formatter helpers (`formatDate`, `formatTime`, and a reactive `relativeTime`
 *    relative offset calculator).
 * 3. Builds essential normalizing adapters (`normalizePace` and `normalizeMemory`) that ingest complex,
 *    relational PostgreSQL tables with deep nested relationships (membership joins, profiles, covers)
 *    and flattens them into clean JSON objects ready for React states.
 * 4. Exposes core transactional APIs:
 *    - `ensureProfile()`: Syncs auth profiles down into our user display table.
 *    - `fetchPaces()` & `fetchMemories()`: Loads dashboard contents.
 *    - `createPace()`: Launches transactional insertions (tries robust SECURITY DEFINER RPC functions first to bypass RLS,
 *      falling back to direct client inserts).
 *    - `createMemory()`: Registers new posts (supports photos, note texts, voice notes, video streams).
 *    - `uploadMemoryFile()`: Uploads raw media files to Supabase S3-equivalent cloud storage buckets, returning static public URLs.
 *    - `subscribeToMemories()`: Opens active real-time WebSockets to push new memory posts instantly to other connected users!
 *    - `updatePace()`, `archivePace()`, and `unarchivePace()`: Updates configurations and soft-archiving toggles.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `{ supabase }` from "./supabase": The active client executing relational database queries.
 * ============================================================================
 */

import { supabase } from "./supabase";

// --- VISUAL PALETTES ---
// Maps visual mood key names to premium, curated Tailwind CSS CSS gradient styles
export const themeByMood = {
  chaotic: "from-[#8f6b67]/25 via-[#181716]/30 to-[#d7d5cf]/15",
  peaceful: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
  "late-night": "from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25",
  nostalgic: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
  soft: "from-[#d7d5cf]/18 via-[#27231f]/20 to-[#8f6b67]/16",
  adventure: "from-[#7d8577]/24 via-[#161615]/30 to-[#c9beb1]/16",
  "core-memory": "from-[#d2c5b1]/26 via-[#11100f]/25 to-[#8f6b67]/18"
};

// --- DATETIME FORMATTING HELPERS ---

/**
 * formatDate
 * Converts dates into aesthetic representations: e.g. "April 18"
 */
function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric" }).format(new Date(value));
}

/**
 * formatTime
 * Converts dates into 12-hour clock layouts: e.g. "11:42 PM"
 */
function formatTime(value) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

/**
 * relativeTime
 * Calculates dynamic time differences between system now and action timestamp.
 * Outputs strings: e.g., "12 min ago", "3 hr ago", "Yesterday", or "4 days ago".
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

// --- NORMALIZING ADAPTERS (DATA CLEANERS) ---

/**
 * normalizePace
 * Flattens relational, nested database response structures into clean Pace models.
 * Also extracts up to 3 actual photo memory media URLs to form a card preview collage
 * @param {Object} row - The database row returned from PostgreSQL paces.
 */
export function normalizePace(row) {
  // Map members profile array or fallback to single user
  const members = row.pace_members && row.pace_members.length > 0
    ? row.pace_members.map((member) => member.profiles?.display_name || "Friend")
    : ["Me"];
  const latest = row.memories?.[0];
  
  // Scrapes the space's memories to find the latest 3 photo uploads for the cards collage preview
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

/**
 * normalizeMemory
 * Flattens nested database response rows into simplified Memory schemas.
 */
export function normalizeMemory(row) {
  return {
    id: row.id,
    type: row.type,
    author: row.profiles?.display_name || "Me",
    time: formatTime(row.memory_at),
    date: formatDate(row.memory_at),
    caption: row.caption || row.ai_caption || "",
    image: row.media_url,
    mediaUrl: row.media_url,
    mood: row.ai_mood || row.mood || "soft",
    lockedUntil: row.locked_until,
    location: row.location_name
  };
}

// --- CORE API SERVICES ---

/**
 * ensureProfile
 * Upserts a display name and avatar inside the `profiles` table to guarantee
 * relational queries succeed. Tries secure SQL procedures before direct inserts.
 */
export async function ensureProfile(user) {
  if (!supabase || !user?.id) return null;

  // Resolves friendly username handles from user authentication metadata
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Pace friend";

  // 1. Tries Remote Procedure Call (RPC) SQL procedure
  const { data: rpcData, error: rpcError } = await supabase.rpc("ensure_user_profile", {
    display_name_arg: displayName,
    avatar_url_arg: user.user_metadata?.avatar_url || null
  });

  if (!rpcError) return rpcData;

  // 2. Client Fallback: Executes direct UPSERT statement (insert if missing, update if conflict)
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

/**
 * fetchPaces
 * Retrieves all Pace spaces associated with the logged-in user session,
 * performing joins on pace_members profiles and recent memories.
 */
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
  return data.map(normalizePace); // normalizes each raw Postgres row
}

/**
 * fetchMemories
 * Retrieves all memory posts for a specific space ID, ordered by date.
 */
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

/**
 * createPace
 * Inserts a new Pace space. Expressly handles RLS (Row-Level Security)
 * constraints by assigning current session auth IDs as owners.
 */
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

  // 1. Attempts insertion via a database Remote Procedure Call (RPC).
  // Inside the Supabase Postgres schema, the 'create_pace' function handles
  // both creating the pace and adding the owner into `pace_members` inside a single TRANSACTION block.
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
    
    // Ensure profile row exists prior to insert to satisfy PostgreSQL foreign keys
    await ensureProfile(user);
    
    // 2. Client Fallback: direct INSERT write
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

/**
 * createMemory
 * Saves a new Memory post row inside the `memories` table database.
 */
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

/**
 * createInvite
 * Generates an invitation token inside `pace_invites` table, returning a landing page URL.
 */
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

/**
 * uploadMemoryFile
 * Uploads a physical binary file to the `pace-media` Supabase Storage bucket.
 * Generates and returns a static public URL for card renders.
 * @param {Object} payload
 * @param {String} payload.paceId - Sub-folder mapping space files.
 * @param {File} payload.file - Raw browser file upload object.
 */
export async function uploadMemoryFile({ paceId, file }) {
  if (!supabase || !file) return null;
  const extension = file.name.split(".").pop() || "bin";
  const filePath = `${paceId}/${crypto.randomUUID()}.${extension}`; // Prevents file collision using UUID names
  
  // Uploads raw file binary
  const { error } = await supabase.storage.from("pace-media").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false
  });

  if (error) throw error;
  
  // Returns clean static public URL path
  const { data } = supabase.storage.from("pace-media").getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * subscribeToMemories
 * Real-time listener: Establishes a raw WebSocket connection checking for database modifications.
 * Receives callbacks whenever a new row is INSERTED into target space memories.
 * @param {String} paceId - Filter target space ID.
 * @param {Function} onMemory - Callback receiving normalized memory rows.
 */
export function subscribeToMemories(paceId, onMemory) {
  if (!supabase || !paceId) return null;

  // Hooks into the WebSocket connection pool channel
  const channel = supabase
    .channel(`pace:${paceId}:memories`)
    .on(
      "postgres_changes",
      {
        event: "INSERT", // Trigger specifically for new inserts
        schema: "public",
        table: "memories",
        filter: `pace_id=eq.${paceId}` // Restricted specifically to this Pace ID
      },
      (payload) => onMemory(normalizeMemory(payload.new))
    )
    .subscribe();

  // Returns standard React subscription cleanup function to close active channel
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * updatePace
 * Updates space fields: e.g. titles, mood, custom covers.
 */
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

/**
 * archivePace
 * Soft-archives a Pace by logging the archived_at timestamp.
 */
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

/**
 * unarchivePace
 * Un-archives a Pace by resetting archived_at to null.
 */
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

