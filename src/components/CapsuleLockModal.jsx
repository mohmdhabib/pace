/**
 * ============================================================================
 * FILE NAME: CapsuleLockModal.jsx
 * TYPE: Modal Overlay Component
 * PURPOSE: A high-fidelity instructional overlay designed to explain the concept
 *          and mechanics of the "Time-Lock Capsule" feature to the user. It warns
 *          them of the secure/permanent locking mechanics and details the presets.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives an `onClose` callback and details about the `activePace`.
 * 2. It wraps itself in standard animated blur backdrops using Framer Motion overlay settings.
 * 3. Shows a premium interactive lock badge that grows, shrinks, and shines infinitely
 *    using keyframed box-shadow glows.
 * 4. Highlights a warning alert clarifying that locking is absolute and irreversible
 *    until the time limit is reached.
 * 5. Iterates through 4 potential presets (1 minute, graduation, next summer, 1 year)
 *    to explain how they can lock posts during creation.
 * 6. Includes a final confirmation button that dismisses the explainer.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": Required for functional components.
 * - `motion` from "framer-motion": Handles smooth bouncing spring scales and glowing shadow indicators.
 * - Icons from "lucide-react": Lock, Clock, Calendar, Check, AlertCircle.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { Lock, Clock, Calendar, Check, AlertCircle } from "lucide-react";

/**
 * CapsuleLockModal Component
 * @param {Object} props
 * @param {Function} props.onClose - Action callback when dismisses modal.
 * @param {Object} props.activePace - The active Space model info context.
 */
export default function CapsuleLockModal({ onClose, activePace, maxWidth = "max-w-[485px]" }) {
  // Pre-configured list of mock capsule locking options mapped out as explanations
  const presets = [
    { label: "Open in 1 minute", duration: "1m", desc: "Perfect for testing countdowns and real-time unlocks!" },
    { label: "Open after graduation", duration: "grad", desc: "Time-lock memories until you finish the era." },
    { label: "Open next summer", duration: "summer", desc: "Unlock next summer for the ultimate emotional throwback." },
    { label: "Open in 1 year", duration: "year", desc: "Hide away the moments to experience them as a retro memory." }
  ];

  return (
    <motion.div
      // Frosted backdrop overlay container
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        // Central glassmorphic modal box
        className={`w-full ${maxWidth} overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/90 p-6 shadow-glow backdrop-blur-2xl text-left`}
        initial={{ scale: 0.94, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 30 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        onClick={(e) => e.stopPropagation()} // Prevents overlay click from closing this card immediately
      >
        {/* Header Title block */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Time Capsule</p>
            <h2 className="mt-1 text-3xl font-semibold text-pace-pearl">Lock It For Later</h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone active:scale-95"
            onClick={onClose}
            aria-label="Close"
          >
            <Lock size={16} />
          </button>
        </div>

        {/* Lock Animation Hero:
            Animates the lock button infinitely using spring parameters */}
        <div className="my-5 flex flex-col items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.03] py-8 text-center">
          <motion.div
            className="grid h-20 w-20 place-items-center rounded-full bg-pace-pearl text-pace-black shadow-glow"
            // Infinite looping scale and glowing box shadow transitions
            animate={{ 
              scale: [1, 1.06, 1], 
              boxShadow: [
                "0 0 0 rgba(245,241,234,0)", 
                "0 0 50px rgba(245,241,234,0.3)", 
                "0 0 0 rgba(245,241,234,0)"
              ] 
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Lock size={28} />
          </motion.div>
          <h3 className="mt-4 text-base font-semibold text-pace-pearl">Active Capsule: {activePace?.title || "Your Pace"}</h3>
          <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-pace-smoke">
            Locking memories hides them behind a beautiful blurred glass screen with a real-time countdown timer.
          </p>
        </div>

        {/* Permanent Warning Warning Block:
            Styled warning tag (amber-500/10 background) matching strict design requirements */}
        <div className="rounded-[1.2rem] border border-amber-500/10 bg-amber-500/[0.04] p-3 text-[11px] leading-5 text-amber-200/80 flex items-start gap-2.5">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <span>
            <strong>Locking is permanent until the date passes.</strong> Even you will not be able to read or view the captions and images of locked memories.
          </span>
        </div>

        {/* Guide Cards presets list */}
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wider text-pace-smoke mb-3 font-semibold">How to Time-Lock Memories</p>
          <div className="grid gap-3">
            {presets.map((preset) => (
              <div
                key={preset.duration}
                className="flex items-start gap-3 rounded-[1.2rem] border border-white/5 bg-white/[0.03] p-3.5"
              >
                <Clock size={16} className="mt-0.5 text-pace-bone" />
                <div>
                  <h4 className="text-xs font-semibold text-pace-pearl">{preset.label}</h4>
                  <p className="mt-1 text-[11px] text-pace-smoke leading-relaxed">{preset.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss trigger */}
        <button
          onClick={onClose}
          className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-pace-pearl text-sm font-semibold text-pace-black active:scale-[0.98]"
        >
          Got it, lock memories during upload!
        </button>
      </motion.div>
    </motion.div>
  );
}
