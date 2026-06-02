import React, { useState, useEffect } from "react";
import { Lock, Clock } from "lucide-react";

export default function LockedMemoryOverlay({ lockedUntil, onUnlock }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const targetDate = new Date(lockedUntil);

    function updateTimer() {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsUnlocked(true);
        onUnlock?.();
        return;
      }

      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Format time string dynamically
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

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil, onUnlock]);

  if (isUnlocked) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[1.2rem] border border-white/10 bg-[#0d0d0c]/75 p-6 text-center backdrop-blur-xl transition duration-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pace-pearl/10 border border-pace-pearl/20 text-pace-pearl mb-3">
        <Lock size={20} className="animate-pulse" />
      </div>
      <h4 className="text-sm font-semibold tracking-wide text-pace-pearl">Locked in Memory Capsule</h4>
      <p className="mt-1.5 max-w-[200px] text-[11px] leading-relaxed text-pace-smoke">
        Held quietly. This moment will reveal itself when the lock expires.
      </p>
      
      {/* Real-time countdown badge */}
      <div className="mt-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-pace-bone backdrop-blur-md">
        <Clock size={13} className="text-pace-smoke" />
        <span>Unlocking in <strong>{timeLeft || "soon"}</strong></span>
      </div>
    </div>
  );
}
