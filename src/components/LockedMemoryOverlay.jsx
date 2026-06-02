/**
 * ============================================================================
 * FILE NAME: LockedMemoryOverlay.jsx
 * TYPE: Overlay UI Component
 * PURPOSE: Renders an elegant frosted-glass blurring overlay directly over a
 *          time-capsule memory post. It calculates and displays a real-time ticking
 *          countdown timer showing when the post will be unlocked and visible to space members.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives `lockedUntil` (the future ISO date target) and `onUnlock` (a success callback).
 * 2. It sets up an internal timer state `timeLeft`.
 * 3. Inside a React `useEffect`, a 1-second interval timer is created.
 * 4. Each second, it calculates the remaining milliseconds until the unlock date.
 *    - If the time has passed (`difference <= 0`), it fires `onUnlock()`, sets `isUnlocked(true)`,
 *      and removes itself by returning `null`.
 *    - Otherwise, it divides the milliseconds into human-readable Days, Hours, Minutes, and Seconds,
 *      updating `timeLeft` dynamically (e.g. "3d 4h 12m" or "5m 24s").
 * 5. While locked, it renders absolute positioned overlays featuring premium frosting blurs (`backdrop-blur-xl`),
 *    a pulsing padlock, and the ticking countdown badge.
 * 6. The `useEffect` returns a standard clearInterval hook to clean up system processes on unmount.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState, useEffect }` from "react": Required to run ticking timer side-effects and track state.
 * - Icons from "lucide-react": Lock and Clock vectors.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { Lock, Clock } from "lucide-react";

/**
 * LockedMemoryOverlay Component
 * @param {Object} props
 * @param {String} props.lockedUntil - The ISO timestamp indicating when the memory locks expire.
 * @param {Function} props.onUnlock - Callback routine triggered instantly when the timer hits zero.
 */
export default function LockedMemoryOverlay({ lockedUntil, onUnlock }) {
  // --- STATE HOOKS ---
  const [timeLeft, setTimeLeft] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  // --- INTERVAL EFFECT SIDE-EFFECT ---
  useEffect(() => {
    const targetDate = new Date(lockedUntil);

    // Dynamic tick callback recalculating remaining duration
    function updateTimer() {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      // CASE: Target date has officially passed!
      if (difference <= 0) {
        setIsUnlocked(true);
        onUnlock?.(); // Triggers feed refresh to reveal visual photos
        return;
      }

      // Calculate time components from milliseconds difference
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Formats the countdown text string dynamically based on remaining magnitudes
      let timeString = "";
      if (days > 0) {
        timeString = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        timeString = `${minutes}m ${seconds}s`;
      }

      setTimeLeft(timeString);
    }

    updateTimer(); // Fires instantly on component load to avoid 1s visual blank delays
    const interval = setInterval(updateTimer, 1000); // Registers tick intervals

    // Cleanup hook: Crucial in React! Clears the timer process when the overlay is unmounted,
    // preventing browser background memory leaks or intervals ticking against unmounted components.
    return () => clearInterval(interval);
  }, [lockedUntil, onUnlock]);

  // If the timer expires, render nothing (memory becomes fully visible)
  if (isUnlocked) return null;

  return (
    <div 
      // absolute inset-0: Fills the entire parent memory card.
      // bg-[#0d0d0c]/75 & backdrop-blur-xl: Creates a heavy frosted screen blocking visual contents underneath.
      className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[1.2rem] border border-white/10 bg-[#0d0d0c]/75 p-6 text-center backdrop-blur-xl transition duration-500"
    >
      {/* Padlock Icon wrapped in a glowing, pulsating ring container */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pace-pearl/10 border border-pace-pearl/20 text-pace-pearl mb-3">
        <Lock size={20} className="animate-pulse" />
      </div>
      
      <h4 className="text-sm font-semibold tracking-wide text-pace-pearl">Locked in Memory Capsule</h4>
      <p className="mt-1.5 max-w-[200px] text-[11px] leading-relaxed text-pace-smoke">
        Held quietly. This moment will reveal itself when the lock expires.
      </p>
      
      {/* Real-time countdown timer badge container */}
      <div className="mt-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-pace-bone backdrop-blur-md">
        <Clock size={13} className="text-pace-smoke" />
        <span>Unlocking in <strong>{timeLeft || "soon"}</strong></span>
      </div>
    </div>
  );
}
