/**
 * ============================================================================
 * FILE NAME: Profile.jsx
 * TYPE: Dashboard View Page
 * PURPOSE: Renders the active user's profile and settings dashboard inside the phone mockup.
 *          It displays key statistics (active spaces, archived eras, total memories), a
 *          hand-curated emotional AI recap highlight card, and provides access to log out
 *          safely of the active Supabase session.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Component receives `setView` routing hooks, user `session` auth context, and the
 *    `onSignOut` parent trigger handler.
 * 2. It parses metadata inside `session` (like full names, user display avatars, or email prefixes)
 *    and extracts the uppercase first initial to display as a bold visual profile avatar.
 * 3. Incorporates Framer Motion to slide the screen in from the right (`x: 24`) for cohesive,
 *    premium mobile transitions.
 * 4. Provides a tactile back navigation button to return users home (`setView("home")`).
 * 5. Uses three reusable `<Stat>` modules to display mock CS/personal milestones.
 * 6. Includes the custom "Recap History" card which summarizes their overall mood in a nostalgic paragraph.
 * 7. Renders the interactive "Sign out" button if session is authenticated, executing logouts safely.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Tracks local logouts states and error display messaging.
 * - `motion` from "framer-motion": Standard animation wrapper driving clean horizontal page slide entries.
 * - Icons from "lucide-react": ChevronLeft (for back actions) and Sparkles symbols.
 * - Unified reusable block: `Stat` card component.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, Camera } from "lucide-react";
import Stat from "../shared/ui/Stat";
import Avatar from "../shared/ui/Avatar";
import { supabase } from "../lib/supabase";

/**
 * Uploads a profile image file to Supabase Storage and returns the public URL.
 */
async function uploadAvatarFile(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `avatars/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("pace-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from("pace-media").getPublicUrl(path);
  return data.publicUrl;
}



/**
 * Profile Component
 * @param {Object} props
 * @param {Function} props.setView - State router function setting active views (e.g. 'home', 'timeline').
 * @param {Object} props.session - The active Supabase authenticated session context.
 * @param {Function} props.onSignOut - Callback executing backend auth session terminations.
 */
export default function Profile({ setView, session, onSignOut, onProfileUpdate }) {
  const [status, setStatus] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [stats, setStats] = useState({ active: 7, archived: 19, memories: 143 });
  const [recap, setRecap] = useState("Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.");

  // --- EDITING STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);   // raw File object from picker
  const [avatarPreview, setAvatarPreview] = useState(""); // local blob URL for instant preview
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      if (!session) return;
      try {
        const [activeData, archivedData, memoriesData, recapsData] = await Promise.all([
          supabase.from('paces').select('id', { count: 'exact', head: true }).is('archived_at', null).eq('owner_id', session.user.id),
          supabase.from('paces').select('id', { count: 'exact', head: true }).not('archived_at', 'is', null).eq('owner_id', session.user.id),
          supabase.from('memories').select('id', { count: 'exact', head: true }).eq('author_id', session.user.id),
          supabase.from('ai_recaps').select('summary').order('created_at', { ascending: false }).limit(1)
        ]);
        if (isMounted) {
          setStats({
            active: activeData.count || 0,
            archived: archivedData.count || 0,
            memories: memoriesData.count || 0
          });
          if (recapsData.data && recapsData.data.length > 0) {
            setRecap(recapsData.data[0].summary);
          }
        }
      } catch (err) {
        console.error("Failed to load profile stats:", err);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, [session]);

  // --- IDENTITY & LOCAL PROCESSING ---
  const email = session?.user?.email;
  const guestName = localStorage.getItem("pace_guest_name") || "Mohammed";
  const guestAvatar = localStorage.getItem("pace_guest_avatar") || "";

  const name = session
    ? (session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || email?.split("@")[0] || "Pace user")
    : guestName;

  const avatarUrl = session
    ? (session.user?.user_metadata?.avatar_url || "")
    : guestAvatar;

  const handleStartEdit = () => {
    setEditName(name);
    setEditAvatarUrl(avatarUrl);
    setAvatarFile(null);
    setAvatarPreview("");
    setIsEditing(true);
    setStatus("");
  };

  // File picker handler — creates instant blob preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setStatus("Display name cannot be empty.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      let finalAvatarUrl = editAvatarUrl;
      // If the user picked a new file, upload it first
      if (avatarFile && session) {
        finalAvatarUrl = await uploadAvatarFile(avatarFile);
      }
      if (onProfileUpdate) {
        await onProfileUpdate({ displayName: editName.trim(), avatarUrl: finalAvatarUrl.trim() });
      }
      // Clean up blob URL
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setIsEditing(false);
      setStatus("Profile updated.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setStatus(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    // The preview to show: picked file blob > existing avatar url > initials fallback
    const previewSrc = avatarPreview || editAvatarUrl;

    return (
      <motion.div
        className="flex flex-1 flex-col overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
      >
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-8">
          {/* Back button */}
          <button
            className="mb-6 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] active:scale-95 transition"
            onClick={() => setIsEditing(false)}
            aria-label="Cancel editing"
          >
            <ChevronLeft size={20} />
          </button>

          <h2 className="text-2xl font-semibold mb-8">Customize Profile</h2>

          <form onSubmit={handleSave} className="flex flex-col gap-6">

            {/* ── Tap-to-upload avatar ── */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs uppercase tracking-wider text-pace-smoke font-semibold">Profile Photo</p>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Tappable avatar circle */}
              <button
                type="button"
                id="profile-avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-28 w-28 rounded-full overflow-hidden border-2 border-white/15 hover:border-white/30 transition-all duration-200 active:scale-95 focus:outline-none"
                aria-label="Choose profile photo"
              >
                {/* Photo or initials */}
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/[0.07] text-4xl font-semibold text-pace-pearl">
                    {editName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {/* Camera badge overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex flex-col items-center gap-1">
                    <Camera size={22} className="text-white" />
                    <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">Change</span>
                  </div>
                </div>
              </button>

              <p className="text-[11px] text-pace-smoke/60 text-center">
                {avatarFile ? `✓ ${avatarFile.name}` : "Tap to choose a photo from your device"}
              </p>
            </div>

            {/* ── Display Name ── */}
            <div className="text-left">
              <label className="text-xs uppercase tracking-wider text-pace-smoke font-semibold block mb-2">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/25 text-pace-pearl placeholder-pace-smoke/40 transition text-sm"
                maxLength={25}
                required
              />
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-pace-pearl text-pace-black font-semibold text-sm transition active:scale-[0.98] disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-12 w-full rounded-full border border-white/10 bg-white/[0.04] text-sm text-pace-bone font-semibold transition hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </form>

          {status && <p className="mt-4 text-center text-xs text-pace-bone">{status}</p>}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      {/* Scrollable content area — clears the BottomNav */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-8">

        {/* Back button */}
        <button
          className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] active:scale-95 transition"
          onClick={() => setView("home")}
          aria-label="Back home"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Avatar */}
        <div className="flex justify-center">
          <Avatar src={avatarUrl} name={name} size="xl" />
        </div>

        {/* Name & email */}
        <h1 className="mt-5 text-center text-3xl font-semibold">{name}</h1>
        <p className="mt-2 truncate text-center text-xs text-pace-smoke">
          {email || "Not signed in yet"}
        </p>

        {/* Customize Profile Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleStartEdit}
            className="text-xs font-semibold px-4 py-2 rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.1] text-pace-bone active:scale-95 transition"
          >
            Customize Profile
          </button>
        </div>

        {/* Philosophy */}
        <p className="mx-auto mt-6 max-w-64 text-center text-sm leading-6 text-pace-bone/75">
          No followers. No performance. Just the rooms that still mean something.
        </p>

        {/* Stats grid */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat value={stats.active.toString()} label="active" />
          <Stat value={stats.archived.toString()} label="archived" />
          <Stat value={stats.memories.toString()} label="memories" />
        </div>

        {/* AI Recap card */}
        <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-left shadow-soft">
          <div className="flex items-center gap-2 text-sm text-pace-bone">
            <Sparkles size={16} />
            Recap history
          </div>
          <p className="mt-3 text-xl font-medium leading-7">
            {recap}
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-white/[0.06]" />

        {/* Session actions */}
        {session ? (
          <button
            className="h-12 w-full rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone active:bg-white/[0.1] active:scale-[0.99] transition"
            onClick={async () => {
              setIsSigningOut(true);
              setStatus("Signing out...");
              try {
                await onSignOut();
              } catch (error) {
                setStatus(error?.message || "Could not sign out.");
                setIsSigningOut(false);
              }
            }}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-center text-sm leading-6 text-pace-bone">
            Sign in from the welcome screen to store Paces and memories in Supabase.
          </div>
        )}

        {status && <p className="mt-3 text-center text-xs text-pace-bone">{status}</p>}
      </div>
    </motion.div>
  );
}
