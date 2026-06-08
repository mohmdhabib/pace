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

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import Stat from "../shared/ui/Stat";
import Avatar from "../shared/ui/Avatar";
import { supabase } from "../lib/supabase";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80"
];

/**
 * Profile Component
 * @param {Object} props
 * @param {Function} props.setView - State router function setting active views (e.g. 'home', 'timeline').
 * @param {Object} props.session - The active Supabase authenticated session context.
 * @param {Function} props.onSignOut - Callback executing backend auth session terminations.
 */
export default function Profile({ setView, session, onSignOut, onProfileUpdate }) {
  // --- STATE HOOKS ---
  const [status, setStatus] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [stats, setStats] = useState({ active: 7, archived: 19, memories: 143 });
  const [recap, setRecap] = useState("Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.");

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

  // --- EDITING STATES ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editAvatarUrl, setEditAvatarUrl] = useState(avatarUrl);
  const [loading, setLoading] = useState(false);

  const handleStartEdit = () => {
    setEditName(name);
    setEditAvatarUrl(avatarUrl);
    setIsEditing(true);
    setStatus("");
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
      if (onProfileUpdate) {
        await onProfileUpdate({ displayName: editName.trim(), avatarUrl: editAvatarUrl.trim() });
      }
      setIsEditing(false);
      setStatus("Profile updated successfully.");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setStatus(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <motion.div
        className="flex flex-1 flex-col px-5 pb-7 pt-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
      >
        {/* Back button to cancel */}
        <button
          className="mb-6 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] active:scale-95 transition"
          onClick={() => setIsEditing(false)}
          aria-label="Cancel editing"
        >
          <ChevronLeft size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Customize Profile</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar Preview & URL Input */}
          <div className="flex flex-col items-center gap-4">
            <Avatar src={editAvatarUrl} name={editName} size="xl" />
            
            <div className="w-full text-left">
              <label className="text-xs uppercase tracking-wider text-pace-smoke font-semibold block mb-2">
                Avatar Image URL
              </label>
              <input
                type="text"
                placeholder="https://example.com/avatar.jpg"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 text-pace-pearl placeholder-pace-smoke/40 transition text-sm"
              />
            </div>
          </div>

          {/* Preset Visuals Row */}
          <div className="text-left">
            <label className="text-xs uppercase tracking-wider text-pace-smoke font-semibold block mb-2">
              Or Select Preset Portrait
            </label>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditAvatarUrl(url)}
                  className={`relative h-12 w-12 rounded-full overflow-hidden border shrink-0 transition active:scale-90 ${
                    editAvatarUrl === url ? "border-pace-pearl scale-105 shadow-[0_0_8px_rgba(245,241,234,0.3)]" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div className="text-left">
            <label className="text-xs uppercase tracking-wider text-pace-smoke font-semibold block mb-2">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Display Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-white/10 bg-white/[0.04] focus:outline-none focus:border-white/20 text-pace-pearl placeholder-pace-smoke/40 transition text-sm"
              maxLength={25}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 mt-4">
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
      </motion.div>
    );
  }

  return (
    <motion.div
      // Layout wrapper: stretches vertically to fill remaining space
      className="flex flex-1 flex-col px-5 pb-7 pt-8"
      
      // Page slide animation settings:
      // - initial: Offset to the right by 24px and hidden (opacity: 0).
      // - animate: Slides to natural position (x:0) while fading in.
      // - exit: Slides out to the left (x:-16) during component exit.
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      {/* Back button returning users to Home screen */}
      <button
        className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] active:scale-95 transition"
        onClick={() => setView("home")}
        aria-label="Back home"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Circular avatar displaying the profile image or initial */}
      <Avatar src={avatarUrl} name={name} size="xl" className="mx-auto" />

      {/* User information headers */}
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

      {/* Philosophy Caption: Highlights the anti-competition/privacy core values of the Pace project */}
      <p className="mx-auto mt-6 max-w-64 text-center text-sm leading-6 text-pace-bone/75">
        No followers. No performance. Just the rooms that still mean something.
      </p>

      {/* Grid displaying three reusable metric Stat components */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value={stats.active.toString()} label="active" />
        <Stat value={stats.archived.toString()} label="archived" />
        <Stat value={stats.memories.toString()} label="memories" />
      </div>

      {/* Emotional AI Recap Highlights Card */}
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-left shadow-soft">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Sparkles size={16} />
          Recap history
        </div>
        <p className="mt-3 text-xl font-medium leading-7">
          {recap}
        </p>
      </div>

      {/* Dynamic Session Actions */}
      {session ? (
        // CASE 1: USER LOGGED IN
        // Render secure signout trigger
        <button
          className="mt-4 h-12 rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone active:bg-white/[0.1] active:scale-[0.99] transition"
          onClick={async () => {
            setIsSigningOut(true);
            setStatus("Signing out...");
            try {
              await onSignOut(); // Calls parent's signOut handler clearing supabase cache
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
        // CASE 2: USER IS A LOCAL GUEST
        // Guides them to register to access cloud syncing
        <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-center text-sm leading-6 text-pace-bone">
          Sign in from the welcome screen to store Paces and memories in Supabase.
        </div>
      )}
      
      {/* Logs statuses or warnings */}
      {status && <p className="mt-3 text-center text-xs text-pace-bone">{status}</p>}
    </motion.div>
  );
}
