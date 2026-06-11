/**
 * ============================================================================
 * FILE NAME: pulseApi.js
 * TYPE: Feature API Layer
 * PURPOSE: Manages all database operations for The Pulse — the daily emoji
 *          mood drop feature. Stores drops, fetches friends' pulses, and
 *          builds the 7-day mood history.
 * ============================================================================
 */

import { supabase } from "./supabase";

// Today's date string (YYYY-MM-DD) in local timezone
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = todayStr();
const LS_KEY = `pace_pulse_${TODAY}`;

/**
 * getMyTodayDrop
 * Returns the current user's emoji for today (null if not dropped yet).
 * Falls back to localStorage in prototype / guest mode.
 */
export async function getMyTodayDrop() {
  // 1. Check localStorage first (works for both modes)
  const cached = localStorage.getItem(LS_KEY);
  if (cached) return JSON.parse(cached);

  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("pulse_drops")
      .select("emoji, note, dropped_at")
      .eq("user_id", user.id)
      .eq("date", TODAY)
      .maybeSingle();

    if (error) return null;
    if (data) {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    }
    return data || null;
  } catch {
    return null;
  }
}

/**
 * dropTodaysPulse
 * Saves the user's emoji drop for today. Returns the saved drop object.
 */
export async function dropTodaysPulse(emoji, note = "") {
  const drop = { emoji, note, dropped_at: new Date().toISOString() };

  // Always write to localStorage (instant + offline)
  localStorage.setItem(LS_KEY, JSON.stringify(drop));

  if (!supabase) return drop;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return drop;

    await supabase.from("pulse_drops").upsert(
      { user_id: user.id, emoji, note: note || null, date: TODAY, dropped_at: drop.dropped_at },
      { onConflict: "user_id,date" }
    );
  } catch (err) {
    console.warn("Failed to sync pulse to Supabase:", err);
  }

  return drop;
}

/**
 * fetchTodaysFriendPulses
 * Returns today's drops from all users in the same Paces as the current user.
 * Excludes the current user's own drop.
 */
export async function fetchTodaysFriendPulses() {
  if (!supabase) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get pace IDs the user belongs to
    const { data: memberships } = await supabase
      .from("pace_members")
      .select("pace_id")
      .eq("user_id", user.id);

    if (!memberships?.length) return [];

    const paceIds = memberships.map((m) => m.pace_id);

    // Get all users in those paces
    const { data: paceMembers } = await supabase
      .from("pace_members")
      .select("user_id, profiles(display_name, avatar_url)")
      .in("pace_id", paceIds)
      .neq("user_id", user.id);

    if (!paceMembers?.length) return [];

    const friendIds = [...new Set(paceMembers.map((m) => m.user_id))];
    const profileMap = {};
    paceMembers.forEach((m) => {
      if (m.profiles) profileMap[m.user_id] = m.profiles;
    });

    // Get today's drops from those friends
    const { data: drops } = await supabase
      .from("pulse_drops")
      .select("user_id, emoji, note, dropped_at")
      .in("user_id", friendIds)
      .eq("date", TODAY);

    return (drops || []).map((d) => ({
      userId: d.user_id,
      name: profileMap[d.user_id]?.display_name || "Friend",
      avatar: profileMap[d.user_id]?.avatar_url || null,
      emoji: d.emoji,
      note: d.note,
      droppedAt: d.dropped_at,
    }));
  } catch (err) {
    console.warn("Failed to fetch friend pulses:", err);
    return [];
  }
}

/**
 * fetchPulseHistory
 * Returns the last 7 days of pulse summaries (date, emojis from everyone).
 */
export async function fetchPulseHistory() {
  if (!supabase) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    const { data } = await supabase
      .from("pulse_drops")
      .select("user_id, emoji, date, profiles(display_name)")
      .gte("date", cutoff)
      .order("date", { ascending: false });

    if (!data?.length) return [];

    // Group by date
    const byDate = {};
    data.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push({
        userId: d.user_id,
        name: d.profiles?.display_name || "Friend",
        emoji: d.emoji,
        isMe: d.user_id === user.id,
      });
    });

    return Object.entries(byDate).map(([date, drops]) => ({ date, drops }));
  } catch {
    return [];
  }
}
