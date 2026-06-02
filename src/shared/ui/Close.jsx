/**
 * ============================================================================
 * FILE NAME: Close.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A unified, beautifully styled closing button template rendering a
 *          clean glassmorphic 'X' icon. Fired to dismiss overlays and models.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives an `onClose` callback action trigger.
 * 2. It returns a circular button element (`<button>`) styled with standard HSL
 *    borders (`border-white/10`) and background fills (`bg-white/[0.06]`).
 * 3. Incorporates a hover blend shift animation (`hover:bg-white/[0.1]`) and reactive
 *    active spring scale down (`active:scale-95`) to feel tactile and premium.
 * 4. Incorporates strict accessibility tags (`aria-label="Close"`) for reader agents.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": Required for rendering.
 * - `X` from "lucide-react": Renders a modern, minimal close vector icon.
 * ============================================================================
 */

import React from "react";
import { X } from "lucide-react";

/**
 * Close Component
 * @param {Object} props
 * @param {Function} props.onClose - Action callback when dismisses.
 */
export default function Close({ onClose }) {
  return (
    <button
      // Tailwind styling layout details:
      // - grid place-items-center: Centers the Lucide icon perfectly inside the button.
      // - h-10 w-10 rounded-full: Forms a perfect 40x40px circle layout.
      // - hover:bg-white/[0.1]: Brightens the circular button background slightly on hover.
      // - active:scale-95: Shrinks the button on click/tap to simulate a physical push-button switch.
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/[0.1] active:scale-95"
      onClick={onClose}
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );
}
