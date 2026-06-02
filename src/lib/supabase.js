import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true
        }
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

export async function signInWithProvider(provider) {
  if (!supabase) return null;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return true;
}

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

export async function signInWithPassword(email, password) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthChange(callback) {
  if (!supabase) return () => {};
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return () => subscription.unsubscribe();
}
