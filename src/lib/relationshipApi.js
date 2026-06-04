/**
 * ============================================================================
 * FILE NAME: relationshipApi.js
 * TYPE: Core API layer
 * PURPOSE: Exposes methods to compute and query friendship stats, shared Paces,
 *          milestone timelines, and emotional recap summaries.
 * ============================================================================
 */

import { mockRelationshipStats } from "../shared/constants";

// Helper checking if we're in Supabase mode or offline sandbox mode
const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * fetchRelationship
 * Computes relationship statistics between current user and target.
 */
export async function fetchRelationship(userId) {
  // Directly returns the mock relationship payload for now since it's an offline-first feature
  return mockRelationshipStats[userId] || mockRelationshipStats.user_arjun;
}

/**
 * generateFriendshipRecap
 * Computes recap client-side or queries RPCs.
 */
export async function generateFriendshipRecap(userId) {
  const relationship = mockRelationshipStats[userId] || mockRelationshipStats.user_arjun;
  return relationship.aiRecap;
}
