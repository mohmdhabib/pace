/**
 * ============================================================================
 * FILE NAME: VoiceNote.jsx
 * TYPE: Memory Feature Component
 * PURPOSE: Renders an ultra-premium visual playback card for voice note posts.
 *          It simulates an active audio voice recording with an organic, bouncing
 *          spectrograph waveform animation and a working audio engine.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component accepts a `url` prop to dynamically play uploaded audio files.
 * 2. It falls back to a gorgeous public ambient audio track if no file was uploaded.
 * 3. Connects standard HTML5 Audio event listeners to sync play/pause states, time updates,
 *    and track completion indicators.
 * 4. Animates the height of 28 vertical wave bars in real-time based on `isPlaying`.
 * 5. Integrates a scrubbable input slider for custom audio seeking.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState, useEffect, useRef }` from "react": Manages HTML5 audio references.
 * - `motion` from "framer-motion": Standard animation framework driving the wave bars height.
 * - Icons from "lucide-react": Mic2, Headphones, Play, Pause.
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Mic2, Headphones, Play, Pause } from "lucide-react";

/**
 * VoiceNote Component
 * @param {Object} props
 * @param {String} props.url - The secure URL to the audio file uploaded in Supabase or Sandbox.
 */
export default function VoiceNote({ url }) {
  // Use standard royalty-free acoustic sample if no custom recording was uploaded
  const audioSource = url || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);

  // --- AUDIO SETUP EFFECT ---
  useEffect(() => {
    // Create new HTML5 Audio element instance
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // Allow Supabase storage CORS
    audio.preload = "metadata";
    audio.src = audioSource;
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    // Some browsers only report duration after enough data is buffered
    const handleCanPlayThrough = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.warn("Audio failed to load:", audioSource);
      setIsPlaying(false);
    };

    // Attach event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Cleanup: stops track, unbinds events to prevent memory leaks when dismounted
    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioSource]);

  // --- PLAYBACK CONTROLLER ---
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio playback failed: ", err);
          setIsPlaying(false);
        });
    }
  };

  // --- SCRUBBER CONTROLLER ---
  const handleScrub = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // --- TIMESTAMP FORMATTER ---
  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="rounded-[1rem] bg-[#191816] p-5 text-pace-pearl">
      {/* Audio Header Metadata Block */}
      <div className="mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold text-pace-bone uppercase tracking-wider">
          <Mic2 size={14} className="text-pace-pearl" />
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <Headphones size={15} className="text-pace-smoke" />
      </div>
      
      {/* Bouncing Audio Waveform Spectrograph */}
      <div className="flex h-20 items-center justify-center gap-[3px] px-2 mb-4">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.span
            key={i}
            className={`w-[3px] rounded-full transition-colors duration-300 ${
              isPlaying ? "bg-pace-pearl shadow-glow" : "bg-pace-smoke/40"
            }`}
            // Dynamic Bouncing Height:
            // - If playing: bounces sequentially to dynamic keyframe heights.
            // - If paused: rests beautifully at a flat 8px height.
            animate={isPlaying ? { height: [8, 56 - (i % 6) * 5, 12 + (i % 4) * 8, 8] } : { height: 8 }}
            transition={
              isPlaying 
                ? { duration: 1.5, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" } 
                : { duration: 0.3 }
            }
          />
        ))}
      </div>

      {/* Playback Controls & Timeline Slider */}
      <div className="flex items-center gap-3">
        {/* Tactile Play/Pause Trigger */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-pace-pearl backdrop-blur-md transition hover:bg-white/[0.15] active:scale-90"
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
        </button>

        {/* Timeline Progress Slider */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleScrub}
          className="w-full accent-pace-pearl bg-white/10 h-1 rounded-lg cursor-pointer outline-none focus:accent-pace-bone"
        />
      </div>
    </div>
  );
}
