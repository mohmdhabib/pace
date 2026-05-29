import { supabase } from "./supabase";

const themeByMood = {
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

export function normalizePace(row) {
  const members = row.pace_members?.map((member) => member.profiles?.display_name || "Friend") || ["Me"];
  const latest = row.memories?.[0];
  return {
    id: row.id,
    title: row.title,
    mood: row.mood,
    members,
    last: latest ? relativeTime(latest.created_at) : "New Pace",
    snippet: latest?.caption || row.description || "A private room for the moments that still glow.",
    color: row.color_theme || themeByMood[row.mood] || themeByMood.nostalgic,
    cover: row.cover_url,
    collage: [row.cover_url].filter(Boolean)
  };
}

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

export async function fetchPaces() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("paces")
    .select(
      "*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, created_at)"
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(12);

  if (error) throw error;
  return data.map(normalizePace);
}

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

export async function createPace({ title, description, mood, coverUrl, ownerId }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("paces")
    .insert({
      owner_id: ownerId,
      title,
      description,
      mood,
      cover_url: coverUrl,
      color_theme: themeByMood[mood] || themeByMood.nostalgic
    })
    .select()
    .single();

  if (error) throw error;
  return normalizePace({ ...data, pace_members: [], memories: [] });
}

export async function createMemory({ paceId, authorId, type, caption, mood, mediaUrl, locationName, memoryAt }) {
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
      memory_at: memoryAt || new Date().toISOString()
    })
    .select("*, profiles(display_name, avatar_url)")
    .single();

  if (error) throw error;
  return normalizeMemory(data);
}
