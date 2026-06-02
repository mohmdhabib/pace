/**
 * ============================================================================
 * FILE NAME: Modal.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A premium, animateable overlay modal (bottom-sheet style) that serves
 *          as the modular base layout for all pop-ups in the application
 *          (e.g., Create Pace, Edit Pace, Add Memory, Join Pace).
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives `children` (the modal contents) and an `onClose` callback function.
 * 2. It renders a fixed, full-screen overlay backdrop (`motion.div`) with background dimming and blur effects.
 * 3. It triggers `onClose` if the user clicks/taps directly on the backdrop (outside the modal box).
 * 4. Nested inside is the main modal card container which uses premium spring transitions
 *    (slide up from y:80 and scale from 0.96) to enter, and slide down to exit.
 * 5. It uses `event.stopPropagation()` to ensure clicks *inside* the modal box don't close it by accident.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": Required for JSX syntax and element rendering.
 * - `motion` from "framer-motion": Essential for executing high-fidelity fluid entry/exit transition animations.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";

/**
 * Modal Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The inner form, message, or interactive content of the modal.
 * @param {Function} props.onClose - Action function to close/dismiss the modal.
 */
export default function Modal({ children, onClose, maxWidth = "max-w-[485px]" }) {
  return (
    <motion.div
      // Backdrop Background Wrapper:
      // - fixed inset-0: Spans the entire screen.
      // - z-40: Places it above the dashboard elements but behind notch content.
      // - bg-black/55 & backdrop-blur-md: Elegant translucent dimming and frosted-glass blur.
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-4 backdrop-blur-md"
      
      // Backdrop Animation States (Framer Motion):
      // - initial: Start completely transparent.
      // - animate: Fade in to opacity: 1.
      // - exit: Fade out back to opacity: 0.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      
      // Dismisses modal if user clicks outside of the main box
      onClick={onClose}
    >
      <motion.div
        // Modal Card Container:
        // - max-h-[88vh]: Caps height to 88% of vertical viewport, preventing overflow.
        // - w-full: Spans full width.
        // - maxWidth: Clamps modal size dynamically (defaults to 485px, can match wider screens).
        // - rounded-[2rem]: Matches the rounded aesthetics of the phone frame.
        // - border-white/10 & bg-[#11100f]/95: Glassmorphic borders and deep, premium background.
        // - shadow-soft: Strong, organic drop shadow.
        className={`max-h-[88vh] w-full ${maxWidth} overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11100f]/95 p-5 shadow-soft`}
        
        // Modal Card Animation States:
        // - initial: Offset down by 80px and scaled down to 96% to make it appear to spring from the bottom.
        // - animate: Slide to natural position (y:0) and scale to 100%.
        // - exit: Slide down slightly (y:60) and scale to 98% during dismiss.
        initial={{ y: 80, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60, scale: 0.98 }}
        
        // Custom easing cubic-bezier and duration for a professional, buttery-smooth transition feel
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        
        // Stop Propagation: Critical! Prevents clicks inside the modal from bubbling up
        // to the outer backdrop div and triggering the `onClose` callback by mistake.
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
