import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Sparkles, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { acceptInvite } from "../lib/inviteApi";

export default function JoinPaceModal({
  invite,
  session,
  onClose,
  onSuccess,
  onSigninPassword,
  onSignup,
  syncStatus
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authMode, setAuthMode] = useState("signin"); // 'signin' or 'signup'
  const [authStatus, setAuthStatus] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  if (invite.loading) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/90 p-6 shadow-glow backdrop-blur-2xl text-left"
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

  const { pace, inviter } = invite;

  async function handleLocalSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthStatus("Please fill in all credentials.");
      return;
    }

    setAuthStatus(authMode === "signup" ? "Creating your account..." : "Signing in...");
    try {
      if (authMode === "signup") {
        await onSignup(email.trim(), password, { full_name: name || undefined });
      } else {
        await onSigninPassword(email.trim(), password);
      }
    } catch (err) {
      setAuthStatus(err.message || "Authentication failed. Try again.");
    }
  }

  async function handleJoinPace() {
    if (!session?.user?.id) {
      setAuthStatus("You must be logged in to join a Pace.");
      return;
    }

    setIsJoining(true);
    setAuthStatus("Joining the era...");
    try {
      const paceId = await acceptInvite(invite.token || window.location.search.split("invite=")[1], pace.id, session.user.id);
      setAuthStatus("Successfully joined! Redirecting...");
      onSuccess(paceId);
    } catch (err) {
      setAuthStatus(err.message || "Failed to join this space.");
      setIsJoining(false);
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
        className="relative w-full max-w-md overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/90 p-6 shadow-glow backdrop-blur-2xl"
        initial={{ scale: 0.94, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 30 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Invitation Received</p>
            <h2 className="mt-1 text-2xl font-semibold">Join Shared Space</h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone active:scale-95"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pace details Card */}
        <div className="relative mt-2 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-left shadow-soft">
          {pace.coverUrl && (
            <div className="absolute inset-0 z-0">
              <img src={pace.coverUrl} alt="" className="h-full w-full object-cover opacity-35" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/60 to-black" />
            </div>
          )}
          <div className="relative z-10">
            <span className="rounded-full border border-white/12 bg-white/[0.08] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-pace-bone backdrop-blur-xl">
              {pace.mood || "Nostalgic"}
            </span>
            <h3 className="mt-3 text-2xl font-semibold leading-tight text-pace-pearl">{pace.title}</h3>
            {pace.description && (
              <p className="mt-1.5 text-xs leading-5 text-pace-bone/75">{pace.description}</p>
            )}
            <p className="mt-4 flex items-center gap-1.5 text-xs text-pace-smoke">
              <Users size={13} />
              <span>Invited by <strong>{inviter.displayName}</strong></span>
            </p>
          </div>
        </div>

        {/* Actions based on Authentication */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {!session ? (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-center text-xs leading-5 text-pace-smoke">
                  Sign in or create an account to unlock this private Pace.
                </p>

                <form onSubmit={handleLocalSubmit} className="mt-4 grid gap-3">
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

                  <button
                    type="submit"
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow active:scale-[0.98]"
                  >
                    {authMode === "signup" ? <UserPlus size={16} /> : <LogIn size={16} />}
                    {authMode === "signup" ? "Create Account & Join" : "Sign In & Join"}
                  </button>
                </form>

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
                  {isJoining ? "Joining space..." : `Join ${pace.title}`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
