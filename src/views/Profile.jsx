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

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import Stat from "../shared/ui/Stat";

/**
 * Profile Component
 * @param {Object} props
 * @param {Function} props.setView - State router function setting active views (e.g. 'home', 'timeline').
 * @param {Object} props.session - The active Supabase authenticated session context.
 * @param {Function} props.onSignOut - Callback executing backend auth session terminations.
 */
export default function Profile({ setView, session, onSignOut }) {
  // --- STATE HOOKS ---
  const [status, setStatus] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  // --- IDENTITY PROCESSING ---
  const email = session?.user?.email;
  
  // Scrapes name values through diverse fallback chains
  const name =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    email?.split("@")[0] ||
    "Mohammed";
    
  // Extracts first letter for avatar circular badge
  const initial = name[0]?.toUpperCase() || "M";

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

      {/* Large circular avatar with the user's name initial */}
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-pace-pearl text-3xl font-semibold text-pace-black shadow-soft">
        {initial}
      </div>

      {/* User information headers */}
      <h1 className="mt-5 text-center text-3xl font-semibold">{name}</h1>
      <p className="mt-2 truncate text-center text-xs text-pace-smoke">
        {email || "Not signed in yet"}
      </p>

      {/* Philosophy Caption: Highlights the anti-competition/privacy core values of the Pace project */}
      <p className="mx-auto mt-2 max-w-64 text-center text-sm leading-6 text-pace-bone/75">
        No followers. No performance. Just the rooms that still mean something.
      </p>

      {/* Grid displaying three reusable metric Stat components */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value="7" label="active" />
        <Stat value="19" label="archived" />
        <Stat value="143" label="memories" />
      </div>

      {/* Emotional AI Recap Highlights Card */}
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 text-left shadow-soft">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Sparkles size={16} />
          Recap history
        </div>
        <p className="mt-3 text-xl font-medium leading-7">
          Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.
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
      
      {/* Logs signout statuses or warnings */}
      {status && <p className="mt-3 text-center text-xs text-pace-bone">{status}</p>}
    </motion.div>
  );
}
