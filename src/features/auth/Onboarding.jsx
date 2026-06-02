/**
 * ============================================================================
 * FILE NAME: Onboarding.jsx
 * TYPE: Auth Feature Component / Screen Page
 * PURPOSE: Renders the multi-step landing presentation and credential portal for the app.
 *          It introduces the user to the app's emotional brand core values before offering
 *          a comprehensive sign-in panel (supporting password registration, Magic Email OTP,
 *          Google/Apple OAuth, and offline guest Sandbox modes).
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Initializes brand narrative slide models detailing anti-competition features.
 * 2. Connects form states (email, password, display names, segmentation tabs, loading flags,
 *    and system alert logs).
 * 3. Mounts inside our high-fidelity `PhoneChrome` visual wrap.
 * 4. Renders a Ken Burns style zoomed Unsplash photo carousel that switches photos to match
 *    the active narrative slide, fading and scale-focusing.
 * 5. Narrative Panel:
 *    - Displays progress bars updating as users step through slides.
 *    - Click triggers advance narrative index, eventually revealing the auth form on completion.
 * 6. Auth Form Panel:
 *    - Implements a tab slider allowing clean switches between Magic Link OTP, Password Sign In,
 *      and email Signup. Leverages Framer Motion's `layoutId="auth-tab-capsule"` for fluid spring motions.
 *    - Runs standard form validations and triggers parents Supabase wrappers, displaying success alerts
 *      or detailed lints directly.
 *    - Integrates Google & Apple SSO vectors.
 *    - Includes "Offline Sandbox" bypass switch, making it easy to run without any server setup.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Drives page switches and text inputs.
 * - `motion`, `AnimatePresence` from "framer-motion": Handles Ken Burns imagery transitions, form switches,
 *   tab slider capsules, and popup alerts.
 * - Icons from "lucide-react": Apple, Lock, Mail, Moon, Sparkles, Users.
 * - Constants and API libraries: covers preset lists, active session fetches, and profile upsert hooks.
 * - Shared UI wrapper: `PhoneChrome`.
 * ============================================================================
 */

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Users
} from "lucide-react";
import { covers } from "../../shared/constants";
import { getSession } from "../../lib/supabase";
import { ensureProfile } from "../../lib/paceApi";
import PhoneChrome from "../../shared/ui/PhoneChrome";

/**
 * Onboarding Component
 * @param {Object} props
 * @param {Function} props.onBegin - Action routine to launch the dashboard timeline.
 * @param {Function} props.onAuth - Parent OAuth authentication handle (provider).
 * @param {Function} props.onEmailAuth - Parent Magic Link OTP login trigger.
 * @param {Function} props.onSignup - Parent email + password registration trigger.
 * @param {Function} props.onSigninPassword - Parent email + password login trigger.
 * @param {Function} props.setSession - Caches active session globally.
 * @param {Function} props.setStarted - Bypasses narrative to active timeline dashboard.
 * @param {Object} props.session - Active Supabase session context (null if signed out).
 * @param {String} props.syncStatus - Description text indicating the database sync state.
 */
export default function Onboarding({
  onBegin,
  onAuth,
  onEmailAuth,
  onSignup,
  onSigninPassword,
  setSession,
  setStarted,
  session,
  syncStatus
}) {
  // Brand storytelling slides containing copy that explains the app's focus
  const slides = [
    {
      title: "Some moments deserve more than disappearing chats.",
      desc: "A private place for the small circles, the late nights, and the inside jokes that shaped who you are."
    },
    {
      title: "People come and go. Memories stay.",
      desc: "Keep the ticket stubs, the messy voice notes, and the blur of photos in a space that doesn't expire."
    },
    {
      title: "Create private spaces for the phases that mattered.",
      desc: "An archived era, a wild semester, or just a quiet evening by the sea. Shared only with those who were there."
    }
  ];

  // --- STATE HOOKS ---
  const [index, setIndex] = useState(0); // Active slide slide index
  const [showAuth, setShowAuth] = useState(false); // Flags if Auth Panel is visible or Narrative slides
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  // Segmentation slider states ('magic', 'password', or 'signup')
  const [authMode, setAuthMode] = useState("magic");
  
  // Status operational strings and spinner states
  const [authStatus, setAuthStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Computes active progress percentage for narrative progress bar
  const progress = ((index + 1) / slides.length) * 100;

  // --- ACTION METHODS ---

  // Dispatches passwordless OTP verification email
  async function handleEmailAuth() {
    if (!email.trim()) {
      setAuthStatus("Enter your email to get a private sign-in link.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onEmailAuth(email.trim());
      setAuthStatus("Check your email for the Pace sign-in link.");
    } catch (error) {
      setAuthStatus(error.message || "Email sign-in is not ready yet.");
    } finally {
      setLoading(false);
    }
  }

  // Integrates Google/Apple SSO logins
  async function handleProviderAuth(provider) {
    setLoading(true);
    setAuthStatus("");
    try {
      setAuthStatus(`Opening ${provider} sign-in...`);
      await onAuth(provider);
    } catch (error) {
      setAuthStatus(error.message || `${provider} sign-in is not enabled in Supabase.`);
    } finally {
      setLoading(false);
    }
  }

  // Registers new account + creates database profile record
  async function handleSignup() {
    if (!email.trim() || !password) {
      setAuthStatus("Provide email and password to create an account.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onSignup(email.trim(), password, { full_name: name || undefined });
      const currentSession = await getSession(); // Verifies if user logged in
      
      // Auto-upserts username profile records
      if (currentSession?.user) await ensureProfile(currentSession.user);
      setSession(currentSession);
      
      if (currentSession) {
        setAuthStatus("Account created and signed in.");
        onBegin(); // Bypasses to shell
      } else {
        setAuthStatus("Account created. Check email if confirmation is enabled.");
      }
    } catch (error) {
      setAuthStatus(error.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  // Password-based authentication
  async function handleSigninPassword() {
    if (!email.trim() || !password) {
      setAuthStatus("Enter email and password to sign in.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onSigninPassword(email.trim(), password);
      const currentSession = await getSession();
      
      // Syncs database profiles
      if (currentSession?.user) await ensureProfile(currentSession.user);
      setSession(currentSession);
      
      if (currentSession) {
        setAuthStatus("Signed in.");
        onBegin();
      } else {
        setAuthStatus("Sign-in started, but no session returned yet.");
      }
    } catch (error) {
      setAuthStatus(error.message || "Password sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneChrome fullScreen={true}>
      {/* Background Image Carousel:
          Ken Burns scale style zooms and fades images seamlessly inside AnimatePresence */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={covers[index + 1] || covers[0]}
            alt=""
            className="h-full w-full object-cover opacity-45"
            // Slide entry zoom parameters
            initial={{ scale: 1.12, opacity: 0, filter: "blur(5px)" }}
            animate={{ scale: 1.02, opacity: 0.45, filter: "blur(0px)" }}
            exit={{ scale: 0.98, opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>
        
        {/* Contrast Overlay Gradient: Dark gradient ensuring page overlay text blocks are highly readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/30 via-[#080807]/65 to-[#080807]" />
      </div>

      {/* Main Container content area */}
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto no-scrollbar justify-between px-5 pb-8 pt-8 min-h-[calc(100vh-6rem)] md:min-h-0 max-w-[485px] mx-auto w-full">
        
        {/* Top brand header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-pace-pearl tracking-wide">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md">
              <Moon size={13} className="text-pace-pearl" />
            </div>
            <span>Pace</span>
          </div>
          
          {/* Quick toggle swapping auth view and storytelling narrative */}
          <button
            onClick={() => {
              if (showAuth) {
                setShowAuth(false);
                setAuthStatus("");
              } else {
                setShowAuth(true);
              }
            }}
            className="rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-1.5 text-xs font-medium text-pace-bone backdrop-blur-xl transition active:scale-95"
          >
            {showAuth ? "Narrative" : "Sign In"}
          </button>
        </div>

        {/* Narrative Carousel or Authentication Form Panel */}
        <div className="my-auto py-10">
          <AnimatePresence mode="wait">
            {!showAuth ? (
              // PANEL 1: NARRATIVE story slides
              <motion.div
                key="narrative"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col text-left"
              >
                {/* Horizontal Progress bar indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-pace-smoke mb-2.5">
                    <span>A Private Memory Network</span>
                    <span>{index + 1} of 3</span>
                  </div>
                  <div className="h-[2px] w-full rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-pace-pearl"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                {/* Narrative Slide content fading and blurring */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -16, opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-normal text-pace-pearl select-none">
                      {slides[index].title}
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-pace-bone/70 select-none">
                      {slides[index].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Continue Advancing trigger */}
                <div className="mt-10">
                  <button
                    className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow transition duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    onClick={() => {
                      if (index < slides.length - 1) {
                        setIndex(index + 1); // step slides forward
                      } else {
                        setShowAuth(true); // reveals authentication forms
                      }
                    }}
                  >
                    <span>{index < slides.length - 1 ? "Continue" : "Begin Sharing"}</span>
                    <Sparkles size={14} className="opacity-70 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : (
              // PANEL 2: AUTHENTICATION PORTAL CARD
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 25, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-soft backdrop-blur-2xl text-left"
              >
                {/* Auth Panel Title headers */}
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold tracking-tight text-pace-pearl">Welcome to Pace</h2>
                  <p className="mt-1.5 text-xs text-pace-smoke">Sign in privately to protect your era’s memory box.</p>
                </div>

                {/* Segmented Sliding Tab Control:
                    Uses layoutId="auth-tab-capsule" to perform premium spring switches */}
                <div className="relative flex rounded-full bg-white/[0.04] p-1 border border-white/5 mb-6">
                  {[
                    { id: "magic", label: "Magic Link" },
                    { id: "password", label: "Sign In" },
                    { id: "signup", label: "Register" }
                  ].map((tab) => {
                    const active = authMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setAuthMode(tab.id);
                          setAuthStatus("");
                        }}
                        className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-300 ${
                          active ? "text-pace-black" : "text-pace-smoke hover:text-pace-pearl"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="auth-tab-capsule" // Magic layout driving organic spring stretching across tabs
                            className="absolute inset-0 rounded-full bg-pace-pearl"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-20">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Responsive Form text input fields */}
                <div className="grid gap-3.5">
                  {/* Name field (Only shown for Sign Up registrations) */}
                  {authMode === "signup" && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                        <Users size={16} />
                      </div>
                      <input
                        className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                        placeholder="Your display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}

                  {/* Email Input Field */}
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {/* Password Input (Hidden during passwordless OTP flows) */}
                  {authMode !== "magic" && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                {/* Animated status alert feedback box */}
                <AnimatePresence>
                  {authStatus && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      className={`mt-4 overflow-hidden rounded-xl border p-3 text-xs leading-relaxed ${
                        authStatus.includes("Check your email") || authStatus.includes("Signed in")
                          ? "border-pace-moss/20 bg-pace-moss/5 text-pace-moss"
                          : "border-pace-wine/20 bg-pace-wine/5 text-pace-wine"
                      }`}
                    >
                      {authStatus}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary Submit Action Trigger */}
                <button
                  type="button"
                  className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow hover:scale-[1.01] active:scale-[0.98] transition duration-200"
                  onClick={
                    authMode === "magic"
                      ? handleEmailAuth
                      : authMode === "signup"
                      ? handleSignup
                      : handleSigninPassword
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-pace-black border-t-transparent" />
                  ) : authMode === "magic" ? (
                    "Send Access Token"
                  ) : authMode === "signup" ? (
                    "Register Era Access"
                  ) : (
                    "Unlock Vault"
                  )}
                </button>

                {/* SSO Provider integrations */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute h-[1px] w-full bg-white/10" />
                  <span className="relative bg-black/45 px-3 text-[10px] uppercase tracking-widest text-pace-smoke select-none">
                    Or secure credentials via
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Google OAuth Login */}
                  <button
                    onClick={() => handleProviderAuth("google")}
                    disabled={loading}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-pace-bone active:scale-95 transition-all"
                  >
                    <svg className="h-4 w-4 fill-current text-pace-bone" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 12 5.92 1 12s4.92 11 11.24 11c6.59 0 11-4.63 11-11.2 0-.756-.08-1.333-.18-1.515H12.24z" />
                    </svg>
                    Google
                  </button>

                  {/* Apple OAuth Login */}
                  <button
                    onClick={() => handleProviderAuth("apple")}
                    disabled={loading}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-pace-bone active:scale-95 transition-all"
                  >
                    <Apple size={15} />
                    Apple
                  </button>
                </div>

                {/* Sandbox guest offline access:
                    Crucial fallback check keeping prototype operations running smoothly instantly */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={onBegin}
                    className="text-xs text-pace-smoke hover:text-pace-pearl font-medium underline underline-offset-4 transition"
                  >
                    Launch local Sandbox (Offline Mode)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sync Status Banner */}
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-pace-smoke pt-4 select-none">
          {syncStatus}
        </p>
      </div>
    </PhoneChrome>
  );
}
