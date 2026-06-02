/**
 * ============================================================================
 * FILE NAME: supabase.js
 * TYPE: Core Database Configuration Library
 * PURPOSE: Configures the core Supabase client connection to enable cloud database syncing
 *          and user authentication. It exports helper wrapper functions for logging in,
 *          signing up, logging out, listening to session changes, and checking if the cloud
 *          backend VITE credentials are set up.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Pulls the Supabase Project URL (`VITE_SUPABASE_URL`) and Anon Publishable API Key
 *    (`VITE_SUPABASE_PUBLISHABLE_KEY`) from environment configuration files (`import.meta.env`).
 * 2. If the keys are configured, it initializes and caches a single `supabase` client instance,
 *    configuring automatic login caching (`persistSession: true`) and JWT token refreshes.
 * 3. If VITE keys are omitted, `supabase` is created as `null`. This acts as a robust self-healing
 *    design: the entire app is built to automatically detect `null` and fall back to local offline
 *    mock mockup modes so developers can run and test the app with zero backend setup.
 * 4. Exposes standardized, simplified async wrappers to manage Magic Link sign-ins,
 *    OAuth integrations, traditional password registration, and real-time auth change event listeners.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `createClient` from "@supabase/supabase-js": The standard official SDK client initializer.
 * ============================================================================
 */

import { createClient } from "@supabase/supabase-js";

// --- backend ENVIRONMENT KEYS ---
// Vite binds system environment variables under import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- CLIENT INITIALIZATION ---
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,      // Tells SDK to securely cache login sessions inside browser localStorage
          detectSessionInUrl: true,  // Automatically processes email verification or OAuth tokens found in landing URLs
          autoRefreshToken: true     // Automatically refreshes the 1-hour JWT tokens in the background
        }
      })
    : null;

// Helper boolean exported globally so frontend components can toggle UI indicators
// (e.g. "Prototype Mode" vs "Synced Privately" badges)
export const isSupabaseConfigured = Boolean(supabase);

// --- AUTH WRAPPERS ---

/**
 * getSession
 * Fetches the currently cached user session.
 * @returns {Promise<Object|null>} - Active session profile details or null if signed out.
 */
export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

/**
 * signInWithProvider
 * Triggers secure OAuth sign-in popups or redirects (e.g., Google, Apple, GitHub).
 * @param {String} provider - Provider key name (e.g. 'google').
 */
export async function signInWithProvider(provider) {
  if (!supabase) return null;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin // Returns users to home page post-oauth
    }
  });
  if (error) throw error;
  return true;
}

/**
 * signInWithEmail
 * Dispatches passwordless Magic Link login verification emails to recipient addresses.
 * @param {String} email - User login email address.
 */
export async function signInWithEmail(email) {
  if (!supabase) return null;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return true;
}

/**
 * signUpWithEmail
 * Registers new user accounts using standard email and password credentials.
 * @param {String} email
 * @param {String} password
 * @param {Object} [userMetadata] - Optional metadata (like display_name) saved in auth database rows.
 */
export async function signUpWithEmail(email, password, userMetadata = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

/**
 * signInWithPassword
 * Signs in existing users with email and password credentials.
 */
export async function signInWithPassword(email, password) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

/**
 * signOut
 * Destroys current localStorage tokens, logging the user out.
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * onAuthChange
 * Registers a real-time reactive auth observer. Fired when users log in, sign out, or refresh tokens.
 * @param {Function} callback - Callback function receiving the updated session object.
 * @returns {Function} - A cleanup function that closes the active listener connection.
 */
export function onAuthChange(callback) {
  if (!supabase) return () => {}; // Returns a dummy cleanup function if offline mockup is active
  
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  // Return standard unsubscribe cleanup routine to prevent memory leaks when components dismount
  return () => subscription.unsubscribe();
}
