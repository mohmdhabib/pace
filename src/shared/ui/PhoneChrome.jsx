/**
 * ============================================================================
 * FILE NAME: PhoneChrome.jsx
 * TYPE: Shared UI Component
 * PURPOSE: A container component that acts as a physical mobile device mockup.
 *          It simulates a high-end smartphone screen frame ("chrome") on desktop browsers
 *          while rendering natively as a responsive full-screen experience on actual mobile devices.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives any nested React elements through the `children` prop.
 * 2. It wraps these elements in a styled `div` that features elegant glassmorphism
 *    (rounded corners, subtle borders, background translucent blurring, and drop shadows).
 * 3. It places a simulated physical speaker/camera "notch" pill shape at the top of the container.
 * 4. This creates a visually premium, cohesive showcase environment for the mobile-first application layout.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React` from "react": The core library to build functional React components.
 * ============================================================================
 */

import React from "react";

/**
 * PhoneChrome Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - The inner pages or views to render within the simulated phone frame.
 */
export default function PhoneChrome({ children, maxWidth = "max-w-[485px]", fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0d0d0c] w-full">
        {children}
      </div>
    );
  }

  return (
    <div 
      // Tailwind styling breakdowns:
      // - relative: Allows absolute positioning of nested elements (like the status pill/notch).
      // - flex flex-col: Stacks the inner content vertically.
      // - min-h-[calc(100vh-2.25rem)] & md:min-h-[calc(100vh-4rem)]: Dynamic height ensuring it fits beautifully in the browser.
      // - rounded-[2.2rem]: Rounded screen corners standard in modern high-end phones.
      // - border border-white/10: A fine, translucent white boundary simulating light catching on a glass edge.
      // - bg-[#0d0d0c]/80 & backdrop-blur-2xl: Standard high-end glassmorphism blurring the background elements behind it.
      // - shadow-soft: A deep, rich, soft shadow elevating the phone mockup off the page.
      // - mx-auto w-full: Centers the frame on desktop screens.
      // - maxWidth: Clamps the phone width dynamically (defaults to 485px, can be scaled wider).
      className={`relative flex min-h-[calc(100vh-2.25rem)] md:min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/80 shadow-soft backdrop-blur-2xl mx-auto w-full ${maxWidth} md:my-8`}
    >
      {/* Phone Notch/Speaker Simulating Bar:
          Placed absolutely at the top center of the phone container */}
      <div className="absolute left-1/2 top-3 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/18" />
      
      {/* Render the actual views (e.g. Onboarding, Shell) nested inside the chrome */}
      {children}
    </div>
  );
}
