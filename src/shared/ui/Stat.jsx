/**
 * ============================================================================
 * FILE NAME: Stat.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A simple, reusable container designed to render a beautiful metric card
 *          (e.g., number of active spaces, total memory posts, archived eras).
 *          It is used on the user profile view to summarize their activity.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Accepts props: `value` (the primary large numeric stat, e.g. "12") and `label`
 *    (the smaller description under the stat, e.g. "Memories").
 * 2. It wraps these details inside a clean, rounded container card with translucent white borders.
 * 3. Formats text sizing to emphasize the numeric value over the descriptive label text.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": Required for rendering.
 * ============================================================================
 */

import React from "react";

/**
 * Stat Component
 * @param {Object} props
 * @param {String|Number} props.value - The large highlight number or code.
 * @param {String} props.label - The small text description underneath.
 */
export default function Stat({ value, label }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-3 text-center">
      {/* The main large number statistic */}
      <div className="text-2xl font-semibold">{value}</div>
      
      {/* The small explanatory caption description */}
      <div className="mt-1 text-xs text-pace-smoke">{label}</div>
    </div>
  );
}
