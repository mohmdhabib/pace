/**
 * ============================================================================
 * FILE NAME: PaceCard.jsx
 * TYPE: Space Feature Component
 * PURPOSE: Displays an individual Pace (space/room) as a beautiful, high-fidelity
 *          scrapbook-style card. It acts as the interactive portal for users to
 *          enter a specific shared memory timeline.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives details about a `pace` (its cover, title, description,
 *    collage photos, active mood, and members list) along with an `onOpen` action trigger.
 * 2. It renders a touch-friendly card (`motion.button`) styled with modern visual aesthetics
 *    (glassmorphism, color gradients, grain textures, and smooth spring scaling on tap).
 * 3. It dynamically renders a layered polaroid collage of the latest photos to create a nostalgic,
 *    physical scrapbooking feel.
 * 4. It shows space metadata such as active membership avatars, member counts, relative update
 *    timestamps (e.g., "Just now"), and mood tags.
 * 5. It supports rendering archived spaces in a muted, desaturated aesthetic to signify past memories.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": The core React library required to write component JSX structures.
 * - `motion` from "framer-motion": A powerful animation engine. We use it to animate the tap interaction (`whileTap`)
 *   for premium responsiveness.
 * - `Users` from "lucide-react": A high-quality SVG icon used to display the group membership count.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

/**
 * PaceCard Component
 * @param {Object} props
 * @param {Object} props.pace - The space data object containing details about the Pace.
 * @param {Function} props.onOpen - Callback triggered when the user taps/clicks the card to enter the space.
 * @param {Boolean} props.isArchived - Flags if this space is frozen/archived. If true, adds desaturation.
 */
export default function PaceCard({ pace, onOpen, isArchived = false }) {
  // Extract up to 3 photos from the pace's collage array (excluding the primary cover image at index 0)
  // to build the physical polaroid collage inside the card.
  const memoriesPhotos = pace.collage ? pace.collage.slice(1, 4) : [];

  return (
    <motion.button
      // Tailwind classes define high-fidelity glassmorphism and spacing.
      // - h-[34rem] sets a fixed height optimal for mobile layouts.
      // - snap-center ensures the card snaps perfectly into view when scrolling horizontally.
      // - border-white/10 and bg-white/[0.055] create the glassmorphic backdrop.
      // - if archived, we apply desaturation (saturate-[0.3]) and a reddish-wine border border-pace-wine/20.
      className={`relative h-[34rem] min-w-[92%] snap-center overflow-hidden rounded-[2rem] border text-left shadow-soft transition-all duration-300 ${
        isArchived
          ? "border-pace-wine/20 bg-[#120a09]/40 opacity-75 saturate-[0.3] hover:saturate-[0.8] hover:opacity-95"
          : "border-white/10 bg-white/[0.055] hover:border-white/20"
      }`}
      // Tap micro-animation: scales down slightly to 98.5% of its size when pressed to feel extremely responsive.
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
    >
      {/* Background Image: The primary cover picture of the space, styled to blend with the card background */}
      <img src={pace.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      
      {/* Color Overlay Gradient: Infuses the card with the specific colors of the space's active mood (e.g., peaceful, energetic) */}
      <div className={`absolute inset-0 bg-gradient-to-b ${pace.color}`} />
      
      {/* Contrast Overlay Gradient: Dark gradient at the bottom ensures text is crisp, legible, and passes contrast checks */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/90" />

      {/* Scrapbook Polaroid Collage Stack in Card Background */}
      {memoriesPhotos.length > 0 && (
        <div className="absolute inset-x-0 top-14 flex items-center justify-center h-44 select-none pointer-events-none">
          {memoriesPhotos.map((imgUrl, i) => {
            // Give each polaroid image a distinct rotation and translation to look hand-placed
            const rot = i === 0 ? "rotate-[-7deg]" : i === 1 ? "rotate-[6deg]" : "rotate-[-2deg]";
            const scale = i === 0 
              ? "scale-90 -translate-x-6 z-10" 
              : i === 1 
                ? "scale-95 translate-x-6 z-20" 
                : "scale-[0.8] z-0 opacity-40 translate-y-2";
            
            return (
              <div
                key={imgUrl}
                // Custom white border with thin p-1 padding simulates the retro physical polaroid border
                className={`absolute w-28 h-28 rounded-lg border-2 border-white bg-white/10 p-1 shadow-soft transition-transform ${rot} ${scale}`}
              >
                <img src={imgUrl} alt="" className="h-full w-full object-cover rounded-md" />
              </div>
            );
          })}
        </div>
      )}

      {/* Archive Indicator Badge: Displayed if the space is locked/archived */}
      {isArchived && (
        <div className="absolute left-4 top-4 rounded-full border border-pace-wine/30 bg-pace-wine/25 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-pace-wine backdrop-blur-xl animate-pulse">
          Archived Era
        </div>
      )}

      {/* Relative Timestamp Badge: Shows when the last update happened (e.g., "3h ago") */}
      <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
        {pace.last}
      </div>

      {/* Card Content Area (pinned to the bottom) */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        
        {/* Members Avatar Row: Renders circular badges showing the first initial of each member name */}
        <div className="mb-4 flex -space-x-2">
          {pace.members.slice(0, 4).map((member, index) => (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-black/30 bg-pace-pearl text-[10px] font-semibold text-pace-black"
              key={`${member}-${index}`}
              // A subtle vertical offset (stagger) is applied to every other avatar to create an organic scrapbook feel
              style={{ transform: `translateY(${index % 2 ? 4 : 0}px)` }}
            >
              {member[0]}
            </span>
          ))}
        </div>
        
        {/* Title of the Pace */}
        <h2 className="text-4xl font-semibold leading-none">{pace.title}</h2>
        
        {/* Short description or memory snippet, capped to a maximum of 2 lines */}
        <p className="mt-3 text-sm leading-6 text-pace-bone/82 line-clamp-2">{pace.snippet}</p>
        
        {/* Card Footer Info */}
        <div className="mt-5 flex items-center justify-between">
          {/* Mood Badge */}
          <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
            {pace.mood}
          </span>
          
          {/* Members Count Badge */}
          <span className="flex items-center gap-1 text-xs text-pace-bone">
            <Users size={14} />
            {pace.members.length}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
