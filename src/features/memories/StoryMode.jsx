/**
 * ============================================================================
 * FILE NAME: StoryMode.jsx
 * TYPE: Feature Component — Cinematic Slideshow Player
 * PURPOSE: Transforms a Pace's memories into a full-screen, immersive, auto-playing
 *          cinematic slideshow experience. Features Ken Burns zoom/pan on photos,
 *          typewriter caption animations, Instagram Stories-style progress bars,
 *          and floating ambient particle effects.
 *
 * WHAT HAPPENS IN THIS FILE:
 * 1. Renders a full-screen fixed overlay (`z-50`) above all other content.
 * 2. Cycles through memory slides with smooth crossfade transitions.
 * 3. Photo memories display with randomized Ken Burns CSS animations (4 presets).
 * 4. Text memories render centered on a deep gradient backdrop with glow effects.
 * 5. Voice memories show an abstract waveform visualization.
 * 6. Each slide features a TypewriterCaption that types out characters one-by-one.
 * 7. A segmented StoryProgressBar at the top shows position and auto-fill timing.
 * 8. Users can tap left/right halves to navigate, tap X to close, or hold to pause.
 * 9. AmbientParticles float upward in the background for cinematic atmosphere.
 *
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState, useEffect, useCallback, useRef, useMemo }`: State, timers, refs.
 * - `motion`, `AnimatePresence` from "framer-motion": Crossfade slide transitions.
 * - Icons from "lucide-react": X close, Pause, Play, MapPin, ChevronLeft/Right.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, MapPin, Volume2 } from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Duration each photo slide is displayed (milliseconds) */
const PHOTO_DURATION = 6000;

/** Duration each text slide is displayed (milliseconds) */
const TEXT_DURATION = 8000;

/** Duration each voice slide is displayed (milliseconds) */
const VOICE_DURATION = 7000;

/** Typewriter character reveal interval (milliseconds) */
const TYPEWRITER_SPEED = 35;

/** Delay before typewriter starts after slide enters (milliseconds) */
const TYPEWRITER_DELAY = 500;

/** Number of ambient floating particles */
const PARTICLE_COUNT = 14;

/** Ken Burns animation CSS class names — randomly assigned per photo slide */
const KENBURNS_PRESETS = [
  "kenburns-zoom-in",
  "kenburns-zoom-out",
  "kenburns-pan-right",
  "kenburns-pan-up"
];

// ============================================================================
// SUB-COMPONENT: StoryProgressBar
// ============================================================================

/**
 * StoryProgressBar
 * Renders an Instagram Stories-style segmented progress bar at the top of the screen.
 * Each segment represents one memory slide. The active segment fills over time.
 *
 * @param {Object} props
 * @param {Number} props.total - Total number of slides.
 * @param {Number} props.current - Current active slide index (0-based).
 * @param {Boolean} props.isPaused - Whether the slideshow is currently paused.
 * @param {Number} props.duration - Duration of the current slide in ms.
 * @param {String} props.slideKey - Unique key that resets the fill animation on slide change.
 */
function StoryProgressBar({ total, current, isPaused, duration, slideKey }) {
  return (
    <div className="absolute left-0 right-0 top-0 z-30 flex gap-1 px-3 pt-3">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/20"
        >
          {i < current ? (
            /* Completed segments: fully filled */
            <div className="absolute inset-0 rounded-full bg-white/90" />
          ) : i === current ? (
            /* Active segment: animated fill */
            <div
              key={slideKey}
              className="absolute inset-y-0 left-0 rounded-full bg-white/90"
              style={{
                animation: isPaused
                  ? "none"
                  : `story-fill ${duration}ms linear forwards`,
                animationPlayState: isPaused ? "paused" : "running"
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: AmbientParticles
// ============================================================================

/**
 * AmbientParticles
 * Renders floating translucent circles that drift upward, creating a cinematic
 * "dust in light" atmosphere. Each particle has randomized size, position, and delay.
 */
function AmbientParticles() {
  // Memoize particle configs so they don't regenerate on every render
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 12,
      opacity: 0.2 + Math.random() * 0.35
    })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-pace-pearl/40"
          style={{
            left: p.left,
            bottom: `-${p.size}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particle-drift ${p.duration}s ${p.delay}s linear infinite`,
            opacity: p.opacity
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: TypewriterCaption
// ============================================================================

/**
 * TypewriterCaption
 * Animates caption text character-by-character with a blinking cursor.
 * After the text completes, the author and mood badge fade in below.
 *
 * @param {Object} props
 * @param {String} props.caption - The caption text to type out.
 * @param {String} props.author - Memory author name.
 * @param {String} props.mood - Mood label badge.
 * @param {String} props.location - Optional location name.
 * @param {Boolean} props.isPaused - Pauses the typing animation.
 */
function TypewriterCaption({ caption, author, mood, location, isPaused }) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showMeta, setShowMeta] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Reset and start typing when caption changes
  useEffect(() => {
    setDisplayedChars(0);
    setShowMeta(false);

    // Clear any existing timers
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (!caption) return;

    // Delay before starting to type
    timeoutRef.current = setTimeout(() => {
      let charIndex = 0;
      intervalRef.current = setInterval(() => {
        charIndex++;
        setDisplayedChars(charIndex);
        if (charIndex >= caption.length) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          // Show meta info after caption finishes
          setTimeout(() => setShowMeta(true), 300);
        }
      }, TYPEWRITER_SPEED);
    }, TYPEWRITER_DELAY);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [caption]);

  // Pause/resume typing
  useEffect(() => {
    // Note: We can't truly pause/resume setInterval easily,
    // so we let typing complete naturally. The pause mainly affects auto-advance.
  }, [isPaused]);

  const visibleText = caption ? caption.slice(0, displayedChars) : "";
  const isTyping = displayedChars < (caption?.length || 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-10">
      {/* Gradient fade behind caption text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Caption text with cursor */}
        {caption && (
          <p className="text-lg font-medium leading-7 text-white drop-shadow-lg">
            {visibleText}
            {isTyping && (
              <span
                className="ml-0.5 inline-block h-5 w-[2px] translate-y-[2px] bg-pace-pearl"
                style={{ animation: "cursor-blink 0.8s step-end infinite" }}
              />
            )}
          </p>
        )}

        {/* Author + mood metadata */}
        <motion.div
          className="mt-3 flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showMeta ? 1 : 0, y: showMeta ? 0 : 8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {author && (
            <span className="text-xs font-semibold text-pace-bone/90 tracking-wide">
              {author}
            </span>
          )}
          {mood && (
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-pace-pearl/80 backdrop-blur-sm">
              {mood}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1 text-[10px] text-pace-smoke/80">
              <MapPin size={10} />
              {location}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: KenBurnsImage
// ============================================================================

/**
 * KenBurnsImage
 * Renders a full-screen photo with a randomized Ken Burns zoom/pan animation.
 * Includes gradient overlays for the progress bar (top) and caption (bottom).
 *
 * @param {Object} props
 * @param {String} props.src - Image source URL.
 * @param {Number} props.duration - Animation duration in ms.
 * @param {String} props.preset - Which Ken Burns animation to use.
 */
function KenBurnsImage({ src, duration, preset }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* The image with Ken Burns animation */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover will-change-transform"
        style={{
          animation: `${preset} ${duration}ms ease-in-out forwards`
        }}
      />

      {/* Top gradient for progress bar legibility */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[5]" />

      {/* Subtle vignette overlay for cinematic feel */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)"
        }}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: TextSlide
// ============================================================================

/**
 * TextSlide
 * Renders text/note memories as a centered large quote on a deep cinematic gradient.
 * Features a subtle glow pulse animation on the text.
 */
function TextSlide({ caption }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Deep cinematic gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 40%, rgba(143,107,103,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(125,133,119,0.15) 0%, transparent 50%), linear-gradient(160deg, #0d0d0c 0%, #141311 50%, #0d0d0c 100%)"
        }}
      />

      {/* Top gradient for progress bar */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[5]" />

      {/* Centered quote text */}
      <div className="relative z-10 max-w-[85%] px-6">
        <p
          className="text-center text-3xl font-semibold leading-snug text-pace-pearl"
          style={{ animation: "text-glow 4s ease-in-out infinite" }}
        >
          "{caption}"
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: VoiceSlide
// ============================================================================

/**
 * VoiceSlide
 * Renders voice memory slides with an abstract waveform visualization.
 * Uses animated bars to simulate a playing audio waveform.
 */
function VoiceSlide() {
  // Generate random bar heights for the waveform
  const bars = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      height: 20 + Math.random() * 60,
      delay: i * 0.05
    })),
    []
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(207,198,186,0.06) 0%, transparent 50%), linear-gradient(180deg, #0d0d0c 0%, #111110 100%)"
        }}
      />

      {/* Top gradient for progress bar */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-[5]" />

      {/* Waveform visualization */}
      <div className="relative z-10 flex items-center gap-[3px] px-8">
        {bars.map((bar) => (
          <motion.div
            key={bar.id}
            className="w-[4px] rounded-full bg-pace-bone/50"
            initial={{ height: 8 }}
            animate={{
              height: [8, bar.height, 12, bar.height * 0.7, 8],
            }}
            transition={{
              duration: 2,
              delay: bar.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Voice label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 backdrop-blur-md z-10">
        <Volume2 size={14} className="text-pace-bone" />
        <span className="text-xs font-medium text-pace-bone tracking-wide">voice note</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: StoryMode
// ============================================================================

/**
 * StoryMode Component
 * The full-screen cinematic slideshow player.
 *
 * @param {Object} props
 * @param {Array} props.memories - Array of memory objects to display.
 * @param {Object} props.pace - The active pace object (title, mood, cover).
 * @param {Function} props.onClose - Callback to close the story player.
 * @param {Number} [props.startIndex=0] - Optional starting slide index.
 */
export default function StoryMode({ memories, pace, onClose, startIndex = 0 }) {
  // --- STATE ---
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [slideKey, setSlideKey] = useState(0); // Forces progress bar reset on slide change

  // Ref for tracking the auto-advance timer
  const timerRef = useRef(null);
  const holdRef = useRef(null);

  // Assign a random Ken Burns preset to each photo memory (stable across renders)
  const kenburnsMap = useMemo(() =>
    memories.map(() => KENBURNS_PRESETS[Math.floor(Math.random() * KENBURNS_PRESETS.length)]),
    [memories]
  );

  // Current memory being displayed
  const currentMemory = memories[currentIndex];
  const isLastSlide = currentIndex >= memories.length - 1;

  // Determine slide duration based on memory type
  const getDuration = useCallback((memory) => {
    if (!memory) return PHOTO_DURATION;
    switch (memory.type) {
      case "text": return TEXT_DURATION;
      case "voice": return VOICE_DURATION;
      default: return PHOTO_DURATION;
    }
  }, []);

  const currentDuration = getDuration(currentMemory);

  // --- SLIDE NAVIGATION ---
  const goToNext = useCallback(() => {
    if (isLastSlide) {
      onClose(); // End of story
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSlideKey((prev) => prev + 1);
  }, [isLastSlide, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSlideKey((prev) => prev + 1);
    }
  }, [currentIndex]);

  // --- AUTO-ADVANCE TIMER ---
  useEffect(() => {
    if (isPaused || !currentMemory) return;

    timerRef.current = setTimeout(() => {
      goToNext();
    }, currentDuration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, currentDuration, goToNext, currentMemory]);

  // --- TAP NAVIGATION HANDLER ---
  const handleTap = useCallback((e) => {
    // Get the click position relative to the screen width
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width * 0.35; // Left 35% = prev, right 65% = next

    if (x < threshold) {
      goToPrev();
    } else {
      goToNext();
    }
  }, [goToPrev, goToNext]);

  // --- HOLD-TO-PAUSE HANDLERS ---
  const handleHoldStart = useCallback(() => {
    holdRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 200); // 200ms threshold to distinguish tap from hold
  }, []);

  const handleHoldEnd = useCallback(() => {
    if (holdRef.current) {
      clearTimeout(holdRef.current);
      holdRef.current = null;
    }
    setIsPaused(false);
  }, []);

  // --- KEYBOARD NAVIGATION ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goToNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goToPrev();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // If there are no memories to show, close immediately
  if (!memories?.length) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* === PROGRESS BAR === */}
      <StoryProgressBar
        total={memories.length}
        current={currentIndex}
        isPaused={isPaused}
        duration={currentDuration}
        slideKey={`slide-${slideKey}`}
      />

      {/* === CLOSE BUTTON === */}
      <button
        className="absolute right-4 top-8 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/30 border border-white/10 text-white/80 backdrop-blur-md hover:bg-black/50 transition active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close story"
      >
        <X size={18} />
      </button>

      {/* === PAUSE INDICATOR === */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40 border border-white/15 backdrop-blur-xl">
              <Pause size={24} className="text-white/90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === PACE TITLE BADGE (top left) === */}
      <div className="absolute left-4 top-10 z-30 flex items-center gap-2">
        {pace?.cover && (
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20">
            <img src={pace.cover} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-white/90 tracking-wide leading-none">
            {pace?.title || "Story"}
          </p>
          <p className="mt-0.5 text-[10px] text-white/50 uppercase tracking-wider">
            {pace?.mood || "memory"}
          </p>
        </div>
      </div>

      {/* === SLIDE COUNTER (top right, below close) === */}
      <div className="absolute right-4 top-20 z-30">
        <span className="text-[10px] font-medium text-white/40 tracking-wider">
          {currentIndex + 1} / {memories.length}
        </span>
      </div>

      {/* === AMBIENT PARTICLES === */}
      <AmbientParticles />

      {/* === SLIDE CONTENT === */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`slide-${currentIndex}`}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Render the appropriate slide type */}
          {currentMemory?.type === "photo" && currentMemory?.image && (
            <KenBurnsImage
              src={currentMemory.image}
              duration={currentDuration}
              preset={kenburnsMap[currentIndex]}
            />
          )}

          {currentMemory?.type === "text" && (
            <TextSlide caption={currentMemory.caption} />
          )}

          {currentMemory?.type === "voice" && (
            <VoiceSlide />
          )}

          {/* Fallback for memories with mediaUrl but no image field */}
          {currentMemory?.type === "photo" && !currentMemory?.image && currentMemory?.mediaUrl && (
            <KenBurnsImage
              src={currentMemory.mediaUrl}
              duration={currentDuration}
              preset={kenburnsMap[currentIndex]}
            />
          )}

          {/* === TYPEWRITER CAPTION (rendered for all slide types) === */}
          <TypewriterCaption
            caption={currentMemory?.type === "text" ? null : currentMemory?.caption}
            author={currentMemory?.author}
            mood={currentMemory?.mood}
            location={currentMemory?.location || currentMemory?.location_name || currentMemory?.locationName}
            isPaused={isPaused}
          />
        </motion.div>
      </AnimatePresence>

      {/* === TAP ZONES FOR NAVIGATION === */}
      <div
        className="absolute inset-0 z-20"
        onClick={handleTap}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      />
    </motion.div>
  );
}
