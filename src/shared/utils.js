/**
 * ============================================================================
 * FILE NAME: utils.js
 * TYPE: Shared Utility Library
 * PURPOSE: Houses general helper functions used throughout the application to
 *          perform ID checks and convert cryptic backend errors into clear,
 *          actionable visual logs for developers and users.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Exposes three crucial methods: `isLiveId`, `formatSyncError`, and `readableSupabaseError`.
 * 2. `isLiveId()` evaluates if a Pace or Memory ID represents a live Supabase database
 *    entry (UUID format) or falls back to standard mock/prototype offline demo strings.
 * 3. `formatSyncError()` translates network loading sync errors into clean visual logs.
 * 4. `readableSupabaseError()` intercepts complex PostgreSQL constraint messages (RLS, Foreign Keys, JWT timeouts)
 *    and tells the final-year CS student or developer exactly what SQL setup files to execute
 *    to repair their database schema!
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - No external imports. Pure modular Javascript utility helper.
 * ============================================================================
 */

/**
 * isLiveId
 * Detects if a given ID string represents a synced record from Supabase or an offline mockup.
 * @param {String} value - The ID string of a space or memory.
 * @returns {Boolean} - True if it is a live database UUID, false if offline mockup.
 */
export function isLiveId(value) {
  if (!value) return false;
  
  // Check against our standard static mock demo IDs in constants.js
  const demoIds = ["chennai", "semester", "sidegig"];
  if (demoIds.includes(value)) return false; // Offline mock data does not use Supabase sync
  
  return (
    // Regex matches the standard RFC 4122 UUID format (e.g. 123e4567-e89b-12d3-a456-426614174000)
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    value.length > 10 // Safe alternative matching for long randomized string generators
  );
}

/**
 * formatSyncError
 * Parses background sync connection errors.
 * @param {Object} error - Standard JavaScript error model.
 * @returns {String} - A clean, friendly summary.
 */
export function formatSyncError(error) {
  const message = error?.message || "";
  
  // Check if schema caching is stale (PGRST205 indicates server table structure missing)
  if (message.includes("schema cache") || message.includes("Could not find") || error?.code === "PGRST205") {
    return "Supabase schema pending";
  }
  return "Sync paused";
}

/**
 * readableSupabaseError
 * Deep analysis of database transaction failures, outputting friendly instructions.
 * @param {Object} error - Database error context object.
 * @returns {String} - A clear step-by-step guidance block.
 */
export function readableSupabaseError(error) {
  const message = error?.message || "";
  const details = error?.details ? ` ${error.details}` : "";
  const hint = error?.hint ? ` ${error.hint}` : "";

  // CASE: RLS tables/procedures not registered in database setup
  if (message.includes("create_pace") || error?.code === "PGRST202") {
    return "Run fix-auth-profile-rls.sql in Supabase, then refresh.";
  }
  
  // CASE: User profile doesn't exist on spaces creation (indicates trigger script failed)
  if (message.includes("violates foreign key constraint")) {
    return "Profile row missing. Run fix-auth-profile-rls.sql.";
  }
  
  // CASE: Row-Level Security (RLS) policy blocks the user's insert (permissions mismatch)
  if (message.includes("row-level security")) {
    return "Supabase denied the insert. Sign in again or check RLS.";
  }
  
  // CASE: Expired or dead JWT session authentication token
  if (message.includes("JWT") || message.includes("not authenticated") || message.includes("Auth session missing")) {
    return "Sign in again before creating a Pace.";
  }

  // Fallback: Prints standard system message log combined with details and hints
  return `${message}${details}${hint}`.trim() || "Failed to create Pace";
}
