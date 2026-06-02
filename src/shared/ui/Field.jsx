/**
 * ============================================================================
 * FILE NAME: Field.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A high-fidelity modular text input component featuring premium spacing,
 *          rounded corners, sub-labels, inline vector icons, and transparent borders.
 *          It is reused across all forms in the application.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Accepts props: `label` (title text above input), `value` (active value string),
 *    `icon` (optional SVG vector), and `onChange` (input update handler).
 * 2. Wraps the input elements inside an interactive glassmorphic `<label>` box.
 * 3. Renders the label text at the top using fine uppercase tracking styling classes.
 * 4. Renders a native `<input>` element underneath. If `onChange` is omitted, the input automatically
 *    toggles to a safe read-only (`readOnly`) element to prevent warning loops.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": Required for functional elements.
 * ============================================================================
 */

import React from "react";

/**
 * Field Component
 * @param {Object} props
 * @param {String} props.label - Small uppercase indicator label shown above input.
 * @param {String} props.value - Active value inside input block.
 * @param {React.ReactNode} [props.icon] - Optional Lucide SVG icon rendered beside the label.
 * @param {Function} [props.onChange] - Callback fired when value changes. If omitted, input behaves read-only.
 */
export default function Field({ label, value, icon, onChange }) {
  return (
    <label className="mt-4 block rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3">
      {/* Label Title Row */}
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-pace-smoke">
        {icon}
        {label}
      </span>
      
      {/* Native Text Input */}
      <input
        className="mt-2 w-full bg-transparent text-base text-pace-pearl outline-none placeholder:text-pace-smoke"
        value={value}
        onChange={(event) => onChange?.(event.target.value)} // Safe optional chaining call
        readOnly={!onChange} // Safe fallback read-only handler when input is descriptive
      />
    </label>
  );
}
