import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import Stat from "../shared/ui/Stat";

export default function Profile({ setView, session, onSignOut }) {
  const [status, setStatus] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const email = session?.user?.email;
  const name =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    email?.split("@")[0] ||
    "Mohammed";
  const initial = name[0]?.toUpperCase() || "M";

  return (
    <motion.div
      className="flex flex-1 flex-col px-5 pb-7 pt-8"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      <button
        className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07]"
        onClick={() => setView("home")}
        aria-label="Back home"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-pace-pearl text-3xl font-semibold text-pace-black">
        {initial}
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold">{name}</h1>
      <p className="mt-2 truncate text-center text-xs text-pace-smoke">
        {email || "Not signed in yet"}
      </p>
      <p className="mx-auto mt-2 max-w-64 text-center text-sm leading-6 text-pace-bone/75">
        No followers. No performance. Just the rooms that still mean something.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value="7" label="active" />
        <Stat value="19" label="archived" />
        <Stat value="143" label="memories" />
      </div>
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Sparkles size={16} />
          Recap history
        </div>
        <p className="mt-3 text-xl font-medium leading-7">
          Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.
        </p>
      </div>
      {session ? (
        <button
          className="mt-4 h-12 rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone"
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
        <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-center text-sm leading-6 text-pace-bone">
          Sign in from the welcome screen to store Paces and memories in Supabase.
        </div>
      )}
      {status && <p className="mt-3 text-center text-xs text-pace-bone">{status}</p>}
    </motion.div>
  );
}
