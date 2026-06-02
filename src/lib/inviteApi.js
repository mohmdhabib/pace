/**
 * ============================================================================
 * FILE NAME: inviteApi.js
 * TYPE: API Library File
 * PURPOSE: Manages the secure transactions for invitation codes. It allows guest
 *          users to verify invitation details (such as the target space name and who invited them)
 *          prior to signing in, and registers their membership row when they accept.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Exposes two main async methods: `fetchInviteDetails` and `acceptInvite`.
 * 2. It integrates a "Prototype Mode" check (if token begins with "prototype-") returning offline
 *    mock data immediately. This ensures the app is fully functional even without a backend!
 * 3. `fetchInviteDetails()`:
 *    - Launches database queries to identify the token.
 *    - First attempts an RPC (Remote Procedure Call) database function (`fetch_invite_details`). RPCs are
 *      crucial here because they run as SECURITY DEFINER on Postgres, allowing unregistered guest users
 *      to see basic invitation metadata that standard Row-Level Security (RLS) would normally block.
 *    - Falls back to normal table queries joining `paces` and inviter `profiles` if RPC is missing.
 * 4. `acceptInvite()`:
 *    - Connects the user account to the Pace membership table.
 *    - Attempts execution via an RPC SQL routine (`accept_pace_invite`) to perform security validations.
 *    - Falls back to direct inserts into `pace_members` table and updates `accepted_by` on the invite row.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `{ supabase }` from "./supabase": The core configured Supabase client executing queries.
 * ============================================================================
 */

import { supabase } from "./supabase";

/**
 * fetchInviteDetails
 * Resolves an invitation token to reveal Pace names and host display profiles.
 * @param {String} token - The unique invitation key string (UUID or prototype mock token).
 * @returns {Promise<Object|null>} - Formatted object containing space details and inviter profile info.
 */
export async function fetchInviteDetails(token) {
  // If Supabase client failed configuration or token is missing, return null
  if (!supabase || !token) return null;

  // --- PROTOTYPE OFFLINE FALLBACK SHORTCUT ---
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

  // 1. Attempt using secure Remote Procedure Call (RPC) database function.
  // Stored SQL functions running with SECURITY DEFINER privileges allow guest/unregistered
  // visitors to securely bypass Row-Level Security (RLS) filters to fetch specific invite details.
  const { data: rpcData, error: rpcError } = await supabase.rpc("fetch_invite_details", {
    token_arg: token
  });

  if (!rpcError && rpcData) {
    console.log("fetchInviteDetails RPC success:", rpcData);
    return rpcData;
  }

  console.warn("fetch_invite_details RPC failed or not found, using client-side fallback...", rpcError);

  // 2. Client-side Fallback (direct table queries with inner table joins)
  // Queries `pace_invites` table, performing relational joins:
  // - joins `paces` to retrieve space titles, cover arts, and descriptions.
  // - joins `profiles` using the `invited_by` foreign key to find the host display name.
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
    .maybeSingle(); // Returns a single record or null without throwing index errors

  if (error) {
    console.error("fetchInviteDetails error:", error);
    throw error;
  }

  if (!data) return null;

  // Format and translate complex relational DB nested structures into a clean unified frontend JSON payload
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
 * acceptInvite
 * Adds the authenticated user as a member of a Pace using the unique token.
 * @param {String} token - The unique invitation key string.
 * @param {String} paceId - The target Space ID (used for client-side queries).
 * @param {String} userId - The authenticated user ID joining.
 * @returns {Promise<String|null>} - Returns the resolved Pace ID.
 */
export async function acceptInvite(token, paceId, userId) {
  if (!supabase || !token) return null;

  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (token.startsWith("prototype-")) {
    console.log("acceptInvite prototype token shortcut activated");
    return paceId || "chennai";
  }

  console.log("acceptInvite called for token:", token);

  // 1. Attempt accepting invitation via database Remote Procedure Call (RPC)
  // Recommends SQL operations in transaction blocks inside backend Postgres to ensure
  // that membership joins and invite token status updates are atomic (succeed or fail together).
  const { data: rpcData, error: rpcError } = await supabase.rpc("accept_pace_invite", {
    token_arg: token
  });

  if (!rpcError) {
    console.log("acceptInvite RPC success, joined pace:", rpcData);
    return rpcData; // Returns the target pace_id
  }

  console.warn("accept_pace_invite RPC not found or failed, using client-side fallback...", rpcError);

  // 2. Client-side Fallback (direct insertion queries)
  if (!paceId || !userId) {
    throw new Error("Missing Pace ID or User ID for fallback joining.");
  }

  // First step: Insert a membership link inside the `pace_members` join table
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

  // Second step: Mark the invite as accepted by logging the user ID in the registry table
  await supabase
    .from("pace_invites")
    .update({ accepted_by: userId })
    .eq("token", token);

  console.log("Fallback client-side join success for pace:", paceId);
  return paceId;
}
