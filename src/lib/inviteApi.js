import { supabase } from "./supabase";

export async function fetchInviteDetails(token) {
  if (!supabase || !token) return null;

  if (token.startsWith("prototype-")) {
    console.log("fetchInviteDetails prototype token shortcut activated");
    return {
      id: token,
      paceId: "chennai",
      invitedBy: "prototype",
      isAccepted: false,
      pace: {
        id: "chennai",
        title: "Chennai Nights",
        coverUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
        mood: "late-night",
        description: "auto rides, bad karaoke, and the sea looking like a secret"
      },
      inviter: {
        displayName: "Riya"
      }
    };
  }

  console.log("fetchInviteDetails called with token:", token);

  // 1. Attempt using secure RPC function (runs as security definer to bypass guest RLS constraints)
  const { data: rpcData, error: rpcError } = await supabase.rpc("fetch_invite_details", {
    token_arg: token
  });

  if (!rpcError && rpcData) {
    console.log("fetchInviteDetails RPC success:", rpcData);
    return rpcData;
  }

  console.warn("fetch_invite_details RPC failed or not found, using client-side fallback...", rpcError);

  // 2. Client-side Fallback
  const { data, error } = await supabase
    .from("pace_invites")
    .select(`
      id,
      pace_id,
      invited_by,
      expires_at,
      accepted_by,
      paces (
        id,
        title,
        cover_url,
        mood,
        description
      ),
      profiles:invited_by (
        display_name,
        avatar_url
      )
    `)
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("fetchInviteDetails error:", error);
    throw error;
  }

  if (!data) return null;

  // Format the returned data to be cleaner
  return {
    id: data.id,
    paceId: data.pace_id,
    invitedBy: data.invited_by,
    expiresAt: data.expires_at,
    isAccepted: Boolean(data.accepted_by),
    pace: {
      id: data.paces?.id,
      title: data.paces?.title || "Shared Pace",
      coverUrl: data.paces?.cover_url,
      mood: data.paces?.mood,
      description: data.paces?.description
    },
    inviter: {
      displayName: data.profiles?.display_name || "A friend"
    }
  };
}

/**
 * Joins the authenticated user to a Pace using an invite token.
 * Tries the SQL RPC function first, then falls back to direct insert if RLS permits.
 */
export async function acceptInvite(token, paceId, userId) {
  if (!supabase || !token) return null;

  if (token.startsWith("prototype-")) {
    console.log("acceptInvite prototype token shortcut activated");
    return paceId || "chennai";
  }

  console.log("acceptInvite called for token:", token);

  // 1. Attempt using a secure RPC function (runs as security definer)
  const { data: rpcData, error: rpcError } = await supabase.rpc("accept_pace_invite", {
    token_arg: token
  });

  if (!rpcError) {
    console.log("acceptInvite RPC success, joined pace:", rpcData);
    return rpcData; // returns the pace_id
  }

  console.warn("accept_pace_invite RPC not found or failed, using client-side fallback...", rpcError);

  // 2. Client-side Fallback (direct table insert)
  if (!paceId || !userId) {
    throw new Error("Missing Pace ID or User ID for fallback joining.");
  }

  // Insert into pace_members
  const { error: joinError } = await supabase
    .from("pace_members")
    .insert({
      pace_id: paceId,
      user_id: userId,
      role: "member"
    });

  if (joinError) {
    console.error("Fallback pace join failed:", joinError);
    throw joinError;
  }

  // Mark the invite as accepted if we successfully joined
  await supabase
    .from("pace_invites")
    .update({ accepted_by: userId })
    .eq("token", token);

  console.log("Fallback client-side join success for pace:", paceId);
  return paceId;
}
