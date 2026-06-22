/**
 * ============================================================================
 * FILE NAME: JoinPaceModal.jsx
 * TYPE: Modal Overlay Component
 * PURPOSE: Manages the onboarding and entry flow for a user who arrives via a secure,
 *          dynamic invitation link. It allows new users to create accounts or existing
 *          users to sign in, and immediately joins them as a member of that specific private Pace.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Checks if the invite details are still loading from the database (`invite.loading`).
 *    - If loading, it displays a gorgeous skeleton loader using Tailwind's `animate-pulse` classes
 *      to simulate the loading card, text blocks, and buttons.
 * 2. Once invite details are loaded, it shows a card showcasing the Pace details: cover photo,
 *    mood style, title, description, and who invited them (the inviter).
 * 3. It checks if there is an active logged-in user (`session`):
 *    - IF NOT SIGNED IN: Shows an elegant local credential form supporting both
 *      "Sign In" and "Create Account" tab switches to authenticate the user first.
 *    - IF SIGNED IN: Shows a pill indicating they are authenticated, and a primary "Join Era" button.
 * 4. Tapping "Join" calls `acceptInvite()` from `inviteApi.js` to insert a membership connection
 *    in Supabase, then triggers `onSuccess()` to redirect the user to the freshly unlocked Pace space.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Required to build the component and track local inputs
 *   (email, password, display names, tabs, join button locks, and error text statuses).
 * - `motion`, `AnimatePresence` from "framer-motion": Handles smooth visual fades and slide animations
 *   when switching between Sign In and Sign Up states.
 * - Icons from "lucide-react": Provides premium, clean vector icons for the user interfaces.
 * - `acceptInvite` from "../lib/inviteApi": The backend database wrapper executing the invite insertion.
 * ============================================================================
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Sparkles, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { acceptInvite } from "../lib/inviteApi";

/**
 * JoinPaceModal Component
 * @param {Object} props
 * @param {Object} props.invite - The invite object containing token info, load state, target Pace details, and inviter profile.
 * @param {Object} props.session - The active Supabase session (null if signed out).
 * @param {Function} props.onClose - Action callback when clicking the closing 'X' button.
 * @param {Function} props.onSuccess - Callback triggered after successfully joining the pace (receives space ID).
 * @param {Function} props.onSigninPassword - Parent auth handler for signing in.
 * @param {Function} props.onSignup - Parent auth handler for email registration.
 * @param {String} props.syncStatus - Description text indicating the database sync state.
 */
export default function JoinPaceModal({
  invite,
  session,
  onClose,
  onSuccess,
  onSigninPassword,
  onSignup,
  syncStatus
}) {
  // --- STATE HOOKS ---
  // Tracks user text inputs for credential forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Tracks whether the active tab is 'signin' or 'signup'
  const [authMode, setAuthMode] = useState("signin");
  
  // Displays processing states, errors, or guidance to the user (e.g. "Signing in...")
  const [authStatus, setAuthStatus] = useState("");
  
  // A lock toggle preventing multiple clicks/inserts during invite resolution
  const [isJoining, setIsJoining] = useState(false);

  // --- SKELETON LOADING STATE ---
  // If the invite details are still querying from Supabase, show a premium layout placeholder
  // that mirrors the card structure to minimize layout shifts when loaded.
  if (invite.loading) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-[485px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/90 p-6 shadow-glow backdrop-blur-2xl text-left"
          initial={{ scale: 0.94, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 30 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        >
          {/* Header Skeleton */}
          <div className="flex items-center justify-between pb-3">
            <div>
              <div className="h-3 w-32 rounded bg-white/10 animate-pulse" />
              <div className="mt-2 h-7 w-48 rounded-lg bg-white/10 animate-pulse" />
            </div>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone active:scale-95" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Pace Card Skeleton */}
          <div className="mt-4 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 min-h-[140px] flex flex-col justify-between">
            <div>
              <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
              <div className="mt-4 h-6 w-3/4 rounded bg-white/10 animate-pulse" />
              <div className="mt-2.5 h-3 w-5/6 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="mt-5 h-3.5 w-1/2 rounded bg-white/10 animate-pulse" />
          </div>

          {/* Onboarding Actions Skeleton */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="h-3 w-48 rounded bg-white/10 animate-pulse" />
            <div className="w-full h-11 rounded-[1rem] bg-white/5 animate-pulse" />
            <div className="w-full h-11 rounded-[1rem] bg-white/5 animate-pulse" />
            <div className="w-full h-13 rounded-full bg-white/10 animate-pulse" />
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // --- COMPONENT DATA DESTUCTURING ---
  // Once details are loaded, extract the space details and host profile
  const { pace, inviter } = invite;

  // --- AUTHENTICATION HANDLER ---
  // Submits email + password registration or login directly through supabase api
  async function handleLocalSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthStatus("Please fill in all credentials.");
      return;
    }

    setAuthStatus(authMode === "signup" ? "Creating your account..." : "Signing in...");
    try {
      if (authMode === "signup") {
        // Creates account and logs the user in
        await onSignup(email.trim(), password, { full_name: name || undefined });
      } else {
        // Logs in the user with password
        await onSigninPassword(email.trim(), password);
      }
    } catch (err) {
      setAuthStatus(err.message || "Authentication failed. Try again.");
    }
  }

  // --- JOIN SPACE MEMBERSHIP HANDLER ---
  // Connects the authenticated user account to the Pace space row using the token
  async function handleJoinPace() {
    if (!session?.user?.id) {
      setAuthStatus("You must be logged in to join a Pace.");
      return;
    }

    setIsJoining(true);
    setAuthStatus("Joining the era...");
    try {
      // Calls invite acceptance API. If invite token is missing, falls back to parsing URL query string.
      const tokenStr = invite.token || window.location.search.split("invite=")[1];
      const paceId = await acceptInvite(tokenStr, pace.id, session.user.id);
      
      setAuthStatus("Successfully joined! Redirecting...");
      onSuccess(paceId); // Triggers success callback to redirect dashboard shell view
    } catch (err) {
      setAuthStatus(err.message || "Failed to join this space.");
      setIsJoining(false); // Releases input button lock on error
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-[485px] overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/90 p-6 shadow-glow backdrop-blur-2xl"
        initial={{ scale: 0.94, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 30 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Invitation Received</p>
            <h2 className="mt-1 text-2xl font-semibold">Unlock Private Era</h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone active:scale-95"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invited Pace details Card */}
        <div className="relative mt-2 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-left shadow-soft">
          {pace.coverUrl && (
            <div className="absolute inset-0 z-0">
              <img src={pace.coverUrl} alt="" className="h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/60 to-black" />
            </div>
          )}
          
          <div className="relative z-10">
            {/* Space Mood tag */}
            <span className="rounded-full border border-white/12 bg-white/[0.08] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-pace-bone backdrop-blur-xl">
              {pace.mood || "Nostalgic"}
            </span>
            
            {/* Space Title */}
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-pace-pearl">{pace.title}</h3>
            
            {/* Optional space description */}
            {pace.description && (
              <p className="mt-1.5 text-xs leading-5 text-pace-bone/75">{pace.description}</p>
            )}
            
            {/* Inviter Info */}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-pace-smoke">
              <Users size={13} />
              <span>Invited by <strong>{inviter.displayName}</strong></span>
            </p>
          </div>
        </div>

        {/* Dynamic Actions based on Auth State */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {!session ? (
              // CASE 1: USER IS NOT LOGGED IN
              // Present registration / login credential panel
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-center text-xs leading-5 text-pace-smoke">
                  Sign in or create an account to unlock this private era.
                </p>

                <form onSubmit={handleLocalSubmit} className="mt-4 grid gap-3">
                  {/* Name field (Only shown for Sign Up registrations) */}
                  {authMode === "signup" && (
                    <div className="flex rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                      <input
                        className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                        placeholder="full name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {/* Email Input */}
                  <div className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                    <Mail size={15} className="text-pace-smoke" />
                    <input
                      type="email"
                      className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Password Input */}
                  <div className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                    <Lock size={15} className="text-pace-smoke" />
                    <input
                      type="password"
                      className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  {/* Submit Trigger */}
                  <button
                    type="submit"
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow active:scale-[0.98]"
                  >
                    {authMode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />}
                    {authMode === "signup" ? "Create Account & Join Era" : "Sign In & Join Era"}
                  </button>
                </form>

                {/* Switch tab buttons */}
                <div className="mt-4 flex items-center justify-center gap-3 text-xs">
                  <span className="text-pace-smoke">
                    {authMode === "signup" ? "Have an account?" : "Need an account?"}
                  </span>
                  <button
                    onClick={() => {
                      setAuthMode(authMode === "signup" ? "signin" : "signup");
                      setAuthStatus("");
                    }}
                    className="font-medium text-pace-bone underline hover:text-pace-pearl"
                  >
                    {authMode === "signup" ? "Sign in instead" : "Create one instead"}
                  </button>
                </div>
              </motion.div>
            ) : (
              // CASE 2: USER IS ALREADY LOGGED IN
              // Display simple authentication confirm card + primary join button
              <motion.div
                key="authenticated"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4"
              >
                <div className="rounded-[1.2rem] bg-white/[0.04] p-3 text-center text-xs border border-white/5">
                  <span className="text-pace-smoke">Authenticated as </span>
                  <span className="font-semibold text-pace-bone truncate max-w-[200px] inline-block align-bottom">
                    {session.user?.email}
                  </span>
                </div>

                <button
                  onClick={handleJoinPace}
                  disabled={isJoining}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition duration-300 hover:scale-[1.01] active:scale-[0.98]"
                >
                  <Sparkles size={17} className={isJoining ? "animate-spin" : ""} />
                  {isJoining ? "Joining era..." : "Join this Era"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback & status message log */}
          {authStatus && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-center text-xs leading-5 text-pace-bone"
            >
              {authStatus}
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
