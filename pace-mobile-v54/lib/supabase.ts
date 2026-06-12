import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// --- backend ENVIRONMENT KEYS ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// --- CLIENT INITIALIZATION ---
export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Disables web-specific URL check for mobile native redirects
        },
      })
    : null;

// Helper indicating if database keys are present
export const isSupabaseConfigured = Boolean(supabase);

// --- AUTH WRAPPERS ---

/**
 * getSession
 * Fetches the currently cached user session.
 */
export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

/**
 * signInWithEmail
 * Dispatches passwordless Magic Link login verification emails.
 */
export async function signInWithEmail(email: string) {
  if (!supabase) return null;
  const { error } = await supabase.auth.signInWithOtp({
    email,
  });
  if (error) throw error;
  return true;
}

/**
 * signUpWithEmail
 * Registers new user accounts using traditional credentials.
 */
export async function signUpWithEmail(email: string, password: string, userMetadata: Record<string, any> = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userMetadata,
    },
  });
  if (error) throw error;
  return data;
}

/**
 * signInWithPassword
 * Signs in existing users with traditional credentials.
 */
export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * signOut
 * Destroys cached token sessions.
 */
export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * onAuthChange
 * Registers a real-time reactive auth observer.
 */
export function onAuthChange(callback: (session: any) => void) {
  if (!supabase) return () => {};
  
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return () => subscription.unsubscribe();
}
