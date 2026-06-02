export function isLiveId(value) {
  if (!value) return false;
  const demoIds = ["chennai", "semester", "sidegig"];
  if (demoIds.includes(value)) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    value.length > 10
  );
}

export function formatSyncError(error) {
  const message = error?.message || "";
  if (message.includes("schema cache") || message.includes("Could not find") || error?.code === "PGRST205") {
    return "Supabase schema pending";
  }
  return "Sync paused";
}

export function readableSupabaseError(error) {
  const message = error?.message || "";
  const details = error?.details ? ` ${error.details}` : "";
  const hint = error?.hint ? ` ${error.hint}` : "";

  if (message.includes("create_pace") || error?.code === "PGRST202") {
    return "Run fix-auth-profile-rls.sql in Supabase, then refresh.";
  }
  if (message.includes("violates foreign key constraint")) {
    return "Profile row missing. Run fix-auth-profile-rls.sql.";
  }
  if (message.includes("row-level security")) {
    return "Supabase denied the insert. Sign in again or check RLS.";
  }
  if (message.includes("JWT") || message.includes("not authenticated") || message.includes("Auth session missing")) {
    return "Sign in again before creating a Pace.";
  }

  return `${message}${details}${hint}`.trim() || "Failed to create Pace";
}
