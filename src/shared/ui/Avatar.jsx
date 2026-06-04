/**
 * ============================================================================
 * FILE NAME: Avatar.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A premium circular avatar component supporting online indicator dots,
 *          fallback initials, and multiple visual sizing configurations.
 * ============================================================================
 */

import React from "react";

/**
 * Avatar Component
 * @param {Object} props
 * @param {String} props.src - Image URL source.
 * @param {String} props.name - User's name for initials fallback.
 * @param {Boolean} props.online - Whether to render green online indicator dot.
 * @param {String} props.size - Size variant ('sm', 'md', 'lg', 'xl').
 * @param {String} props.className - Custom style overrides.
 */
export default function Avatar({
  src,
  name = "User",
  online = false,
  size = "md",
  className = ""
}) {
  // Size classes dictionary
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl"
  };

  const dotSizes = {
    sm: "h-2 w-2 right-0 bottom-0",
    md: "h-3 w-3 right-0.5 bottom-0.5",
    lg: "h-4.5 w-4.5 right-1 bottom-1 border-2",
    xl: "h-6 w-6 right-1.5 bottom-1.5 border-3"
  };

  // Generate fallback initials
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      <div
        className={`flex items-center justify-center rounded-full border border-white/10 bg-white/[0.07] font-semibold text-pace-pearl overflow-hidden ${sizeClasses[size]}`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover transition-opacity duration-300"
            onError={(e) => {
              // Fallback to initials if image fails
              e.target.style.display = "none";
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Online indicator dot */}
      {online && (
        <span
          className={`absolute rounded-full border border-[#0d0d0c] bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)] ${dotSizes[size]}`}
        />
      )}
    </div>
  );
}
