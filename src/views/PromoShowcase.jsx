import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  Sparkles,
  User,
  Users,
  Bot,
  Volume2,
  Lock,
  ChevronLeft,
  HelpCircle,
  Eye,
  Video,
  Monitor,
  ShieldCheck,
  Check,
  Info,
  Calendar,
  X,
  Compass,
  ArrowRight,
  Moon,
  Camera
} from "lucide-react";

// ============================================================================
// TIMELINE SCENES & SETTINGS
// ============================================================================
const SCENES = [
  { id: 1, name: "Scene 1: Brand Reveal", start: 0, end: 5.5, label: "Logo Reveal" },
  { id: 2, name: "Scene 2: Phone Authentication", start: 5.5, end: 9.5, label: "OTP Entry" },
  { id: 3, name: "Scene 3: Library of Eras", start: 9.5, end: 14.5, label: "Home Dashboard" },
  { id: 4, name: "Scene 4: Capture & Polaroid Drop", start: 14.5, end: 20.0, label: "Camera Shutter" },
  { id: 5, name: "Scene 5: Voice Wave close-up", start: 20.0, end: 25.0, label: "Interactive Audio" },
  { id: 6, name: "Scene 6: Poetic AI recap", start: 25.0, end: 30.5, label: "Nostalgic Recap" },
  { id: 7, name: "Scene 7: Zero Social Pressure", start: 30.5, end: 34.5, label: "Zero Metrics" },
  { id: 8, name: "Scene 8: Product Hunt Launch", start: 34.5, end: 40.0, label: "PH Outro" }
];

const TOTAL_DURATION = 40.0; // seconds

// Mock audio wave visual pattern for Scene 5
const audioWaves = [
  { id: 1, height: 18, delay: 0.1 },
  { id: 2, height: 26, delay: 0.15 },
  { id: 3, height: 38, delay: 0.2 },
  { id: 4, height: 48, delay: 0.25 },
  { id: 5, height: 34, delay: 0.3 },
  { id: 6, height: 22, delay: 0.35 },
  { id: 7, height: 30, delay: 0.4 },
  { id: 8, height: 44, delay: 0.45 },
  { id: 9, height: 56, delay: 0.5 },
  { id: 10, height: 60, delay: 0.55 },
  { id: 11, height: 48, delay: 0.6 },
  { id: 12, height: 32, delay: 0.65 },
  { id: 13, height: 20, delay: 0.7 },
  { id: 14, height: 28, delay: 0.75 },
  { id: 15, height: 42, delay: 0.8 },
  { id: 16, height: 52, delay: 0.85 },
  { id: 17, height: 58, delay: 0.9 },
  { id: 18, height: 46, delay: 0.95 },
  { id: 19, height: 30, delay: 1.0 },
  { id: 20, height: 24, delay: 1.05 },
  { id: 21, height: 38, delay: 1.1 },
  { id: 22, height: 48, delay: 1.15 },
  { id: 23, height: 54, delay: 1.2 },
  { id: 24, height: 40, delay: 1.25 },
  { id: 25, height: 26, delay: 1.3 },
  { id: 26, height: 18, delay: 1.35 },
  { id: 27, height: 12, delay: 1.4 },
  { id: 28, height: 8, delay: 1.45 }
];

export default function PromoShowcase() {
  // --- STATE CONTROLLERS ---
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showGrain, setShowGrain] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [capturingMode, setCapturingMode] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  // References
  const timerRef = useRef(null);
  const lastTickRef = useRef(null);

  // Calculate current scene
  const currentScene = useMemo(() => {
    return SCENES.find(s => currentTime >= s.start && currentTime < s.end) || SCENES[SCENES.length - 1];
  }, [currentTime]);

  // --- AUTOMATED TICK TIMER LOOP ---
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      lastTickRef.current = null;
      return;
    }

    const tick = (timestamp) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
        timerRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsedSec = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + elapsedSec * playbackSpeed;
        if (next >= TOTAL_DURATION) {
          return 0; // loop
        }
        return next;
      });

      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Handle countdown triggers
  const triggerCaptureStart = () => {
    setCaptureCountdown(3);
    setShowGuide(false);
  };

  useEffect(() => {
    if (captureCountdown <= 0) return;
    const t = setTimeout(() => {
      setCaptureCountdown((prev) => {
        const next = prev - 1;
        if (next === 0) {
          setCurrentTime(0);
          setIsPlaying(true);
          setShowHUD(false);
          setCapturingMode(true);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [captureCountdown]);

  // Keyboard shortcut ESC to return HUD
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setCapturingMode(false);
        setShowHUD(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const jumpToScene = (scene) => {
    setCurrentTime(scene.start);
    setIsPlaying(true);
  };

  // ============================================================================
  // CAMERA DIRECTION ORCHESTRATION (ZOOM, TILT, PERSPECTIVE)
  // ============================================================================
  const getCameraStyles = () => {
    // Returns 3D transform properties based on the current timeline time
    const t = currentTime;

    if (t < 5.5) {
      // Scene 1: Brand Logo Reveal
      // Phone is placed deep back, hidden in opacity, floating
      return {
        transform: "translate3d(0, 80px, -300px) rotateX(25deg) rotateY(-20deg) rotateZ(5deg)",
        opacity: 0,
        transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 9.5) {
      // Scene 2: Onboarding OTP Verification (Close up, Flat)
      // Zoomed in, straight angle to highlight digits entering
      return {
        transform: "translate3d(0, -10px, 120px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
        opacity: 1,
        transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 14.5) {
      // Scene 3: Home Dashboard (Isometric Left perspective view)
      // Pull back camera, show context 3D
      return {
        transform: "translate3d(60px, 0, -20px) rotateX(18deg) rotateY(-18deg) rotateZ(8deg)",
        opacity: 1,
        transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 20.0) {
      // Scene 4: Camera viewfinder and photo flash drop (Flat zoom)
      // Straight, slightly tilted up to watch polaroid slide down
      return {
        transform: "translate3d(0, 15px, 30px) rotateX(10deg) rotateY(-8deg) rotateZ(3deg)",
        opacity: 1,
        transition: "all 1.3s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 25.0) {
      // Scene 5: Voice Wave close-up (Isometric Right, high zoom)
      // Focuses directly on the voice player card
      return {
        transform: "translate3d(-60px, -15px, 110px) rotateX(16deg) rotateY(16deg) rotateZ(-6deg)",
        opacity: 1,
        transition: "all 1.3s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 30.5) {
      // Scene 6: Poetic AI recap (Close-up, focused on top recap text)
      return {
        transform: "translate3d(50px, -45px, 130px) rotateX(14deg) rotateY(-14deg) rotateZ(6deg)",
        opacity: 1,
        transition: "all 1.4s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else if (t < 34.5) {
      // Scene 7: Zero Social metrics (Flat, clean review)
      return {
        transform: "translate3d(0, 0, 70px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
        opacity: 1,
        transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    } else {
      // Scene 8: PH launch Outro (Phone exits right, rotates flat)
      return {
        transform: "translate3d(240px, 80px, -150px) rotateX(25deg) rotateY(-22deg) rotateZ(10deg)",
        opacity: 0.3,
        transition: "all 1.6s cubic-bezier(0.16, 1, 0.3, 1)"
      };
    }
  };

  // Helper to simulate OTP digits typing in Scene 2
  const getSimulatedOTP = () => {
    const t = currentTime - 5.5; // offset
    if (t < 0.8) return ["", "", "", ""];
    if (t < 1.6) return ["8", "", "", ""];
    if (t < 2.3) return ["8", "3", "", ""];
    if (t < 3.0) return ["8", "3", "2", ""];
    return ["8", "3", "2", "1"];
  };

  // Helper to determine active highlighted key on onboarding keypad
  const getActiveKeypadKey = () => {
    const t = currentTime - 5.5;
    if (t >= 0.6 && t < 0.9) return 8;
    if (t >= 1.4 && t < 1.7) return 3;
    if (t >= 2.1 && t < 2.4) return 2;
    if (t >= 2.8 && t < 3.1) return 1;
    return null;
  };

  // Helper to animate typewriter caption in AI recap Scene 6
  const getAIRecapTypewriter = () => {
    const t = currentTime - 25.0; // offset
    const fullText = "Kyoto in the Rain felt nostalgic and deep. The rainy day in Kyoto brought everyone together, and the midnight talks cemented the era as a core memory.";
    if (t <= 0.5) return "";
    const charsToShow = Math.floor((t - 0.5) * 35); // 35 chars per second
    return fullText.slice(0, charsToShow);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#080807] font-sans select-none text-pace-pearl">
      
      {/* 1. Cinematic overlays */}
      {showGrain && <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.08]" />}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080807_100%)] opacity-90 pointer-events-none" />

      {/* 2. Color blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute h-[500px] w-[500px] rounded-full blur-[140px] opacity-15"
          animate={{
            x: currentScene.id === 1 ? -100 : currentScene.id === 4 ? 200 : -50,
            y: currentScene.id === 1 ? 50 : currentScene.id === 5 ? -150 : 100,
            background: currentScene.id === 5 ? "#8f6b67" : currentScene.id === 3 ? "#7d8577" : "#8f6b67"
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute h-[600px] w-[600px] rounded-full blur-[160px] opacity-10 right-0 bottom-0"
          animate={{
            x: currentScene.id === 2 ? 100 : -100,
            y: currentScene.id === 6 ? -50 : 200,
            background: currentScene.id === 6 ? "#cfc6ba" : "#7d8577"
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
        />
      </div>

      {/* ============================================================================
          SCENE 1: DETAILED LOGO REVEAL (Rendered directly in the main stage)
          ============================================================================ */}
      <AnimatePresence>
        {currentTime < 5.5 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center bg-[#080807] pointer-events-none px-6"
          >
            {/* Shimmering Lens Flare background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#cfc6ba]/5 to-[#8f6b67]/10 blur-3xl opacity-80" />

            <div className="relative flex flex-col items-center">
              
              {/* Pulsing visual circles */}
              <div className="absolute -inset-10 rounded-full border border-white/5 bg-white/[0.01] scale-90 animate-ping opacity-25" style={{ animationDuration: "3s" }} />
              <div className="absolute -inset-6 rounded-full border border-white/10 opacity-30 animate-pulse" />

              {/* Shimmering logo */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-pace-pearl via-pace-bone to-[#ebdcb9] flex items-center justify-center shadow-glow z-10"
              >
                <Moon size={32} className="text-pace-black fill-current" />
              </motion.div>

              {/* Serif Kinetic typography tracking letters */}
              <motion.h1 
                initial={{ letterSpacing: "0.1em", opacity: 0 }}
                animate={{ letterSpacing: "0.55em", opacity: 1 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="mt-8 text-6xl font-semibold uppercase font-display text-pace-pearl drop-shadow-2xl leading-none pl-6 select-none"
              >
                Pace
              </motion.h1>

              {/* Cinematic text slide-in */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 1, delay: 1.4 }}
                className="mt-6 text-sm text-pace-bone font-medium tracking-[0.18em]"
              >
                We live life in phases. Hold them privately.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================================
          SCENE 8: PRODUCT HUNT OUTRO REVEAL
          ============================================================================ */}
      <AnimatePresence>
        {currentTime >= 34.5 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center bg-[#080807]/90 pointer-events-none px-6"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#8f6b67]/8 blur-3xl opacity-60" />

            <div className="relative flex flex-col items-center">
              
              {/* Shimmering logo */}
              <motion.div 
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, type: "spring", stiffness: 60 }}
                className="w-20 h-20 rounded-full bg-pace-pearl flex items-center justify-center shadow-glow border border-white/20"
              >
                <Moon size={38} className="text-pace-black fill-current" />
              </motion.div>

              <motion.h2 
                initial={{ letterSpacing: "0.2em", opacity: 0 }}
                animate={{ letterSpacing: "0.45em", opacity: 1 }}
                transition={{ duration: 1.6, delay: 0.3 }}
                className="mt-6 text-4xl font-bold uppercase text-pace-pearl pl-4 font-display"
              >
                Pace Social
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="mt-3 text-xs tracking-[0.22em] uppercase text-pace-smoke font-semibold"
              >
                Private rooms for your friendship eras
              </motion.p>

              {/* Product Hunt Shimmer badge sweep */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, type: "spring", delay: 1.1 }}
                className="mt-10 rounded-2xl bg-gradient-to-r from-[#da552f] to-[#ff7954] p-[1.5px] shadow-[0_20px_50px_rgba(218,85,47,0.25)] relative overflow-hidden"
              >
                <div className="rounded-[15px] bg-[#0c0807] px-6 py-4 flex items-center gap-4 border border-white/5 relative overflow-hidden">
                  
                  {/* Sweep highlight effect */}
                  <motion.div 
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                    className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                  />

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#da552f] text-white font-extrabold text-2xl">
                    P
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-[#ff7954] font-bold">Featured on</p>
                    <p className="text-base font-extrabold text-white leading-none mt-1">Product Hunt</p>
                  </div>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.8 }}
                className="mt-12 text-[10px] tracking-widest text-pace-smoke uppercase font-semibold flex items-center gap-1.5"
              >
                <span>Hold your memories</span>
                <span className="w-1 h-1 bg-pace-smoke rounded-full" />
                <span>Join the movement</span>
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================================
          MAIN 3D GRAPHICS PLATFORM CONTAINER (Camera zoomed / panned dynamically)
          ============================================================================ */}
      <div 
        className="relative z-10 flex h-full w-full max-w-[1920px] aspect-[16/9] items-center justify-center overflow-hidden px-8"
      >
        
        {/* Left HUD Panel: Dynamic typography explaining active scenes */}
        <div className="absolute left-[7%] z-30 flex max-w-sm flex-col items-start text-left pointer-events-none">
          <AnimatePresence mode="wait">
            {currentScene.id === 2 && (
              <motion.div
                key="typography-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <Lock size={12} /> Privacy Sandbox
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  Secure, <br />
                  <span className="text-pace-wine italic font-medium">invite-only</span> entrance.
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  No passwords to leak. A quick, pass-free verification code connects you and your closest friends safely.
                </p>
              </motion.div>
            )}

            {currentScene.id === 3 && (
              <motion.div
                key="typography-3"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <Layers size={12} /> Custom curation
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  All your phases, <br />
                  <span className="text-pace-moss">held beautifully.</span>
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  trips, college terms, Late-night coffee runs. Organize your moments in private folders styled with harmonized colors.
                </p>
              </motion.div>
            )}

            {currentScene.id === 4 && (
              <motion.div
                key="typography-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <Camera size={12} /> Tactile scrapbooks
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  Snap & watch <br />
                  <span className="text-pace-bone font-medium">memories drop.</span>
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  Take a photo inside the app. Screen flashes, and a tactile, angled polaroid drop-slides directly onto your grid.
                </p>
              </motion.div>
            )}

            {currentScene.id === 5 && (
              <motion.div
                key="typography-5"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <Volume2 size={12} /> Audio memories
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  Keep the voice, <br />
                  <span className="text-pace-wine">keep the laugh.</span>
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  Voice notes feature an interactive, pulsing spectrograph that ripples dynamically when played.
                </p>
              </motion.div>
            )}

            {currentScene.id === 6 && (
              <motion.div
                key="typography-6"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <Bot size={12} /> AI recap
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  Aesthetic <br />
                  <span className="text-[#d2c5b1] italic">emotional recaps.</span>
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  Pace parses your photos, dates, and captions to write a poetic, nostalgic summaries of the entire era.
                </p>
              </motion.div>
            )}

            {currentScene.id === 7 && (
              <motion.div
                key="typography-7"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]">
                  <ShieldCheck size={12} /> 100% PRIVATE
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-pace-pearl font-display">
                  No public views. <br />
                  <span className="text-pace-moss">No algorithms.</span>
                </h2>
                <p className="text-xs text-pace-bone/70 leading-relaxed">
                  0 followers. 0 likes. Just a quiet shared space for your closest friends, exactly where you left it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center Canvas housing the dynamic, moving phone container */}
        <div 
          className="relative flex items-center justify-center select-none"
          style={{
            ...getCameraStyles(),
            perspective: 1400,
            marginLeft: "26%",
            transformStyle: "preserve-3d"
          }}
        >
          
          {/* Backdrop Radial Shadow Glow */}
          <div 
            className="absolute rounded-[50px] blur-[40px] pointer-events-none transition-all duration-700"
            style={{
              width: "310px",
              height: "630px",
              background: currentScene.id === 6 ? "rgba(210,197,177,0.25)" : "rgba(143,107,103,0.18)",
              transform: "translateY(20px) translateZ(-40px)"
            }}
          />

          {/* PHYSICAL IPHONE FRAME (UPGRADED STYLING) */}
          <div className="relative w-[320px] h-[645px] rounded-[52px] bg-[#0c0c0b] border-[10px] border-[#181816] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden select-none border-t-[11px] border-b-[11px]">
            
            {/* Dynamic island screen notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[95px] h-[26px] bg-[#181816] rounded-full z-50 flex items-center justify-end px-3 gap-1 shadow-inner pointer-events-none">
              <div className="w-2 h-2 bg-[#090b10] rounded-full border border-neutral-900" />
              <div className="w-1.5 h-1.5 bg-[#030406] rounded-full" />
            </div>

            {/* Simulated Glass Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 pointer-events-none z-40" />

            {/* SCREEN VIEWPORT CONTAINER */}
            <div className="w-full h-full flex flex-col bg-pace-black relative text-pace-pearl overflow-hidden pt-7">
              
              {/* Top status bar details */}
              <div className="px-6 py-1.5 flex justify-between items-center text-[9px] text-pace-smoke font-bold absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#080807] to-transparent pointer-events-none select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]">LTE</span>
                  <div className="w-3.5 h-2 bg-pace-smoke/60 rounded-sm scale-90 flex items-center p-0.5">
                    <div className="h-full w-full bg-pace-pearl rounded-xs" />
                  </div>
                </div>
              </div>

              {/* View Router implementation */}
              <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col text-left">
                <AnimatePresence mode="wait">

                  {/* SCREEN 2: AUTH OTP KEYPAD INPUT */}
                  {currentScene.id === 2 && (
                    <motion.div
                      key="phone-auth-scene"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 flex flex-col justify-between p-5 bg-[#080807] z-10 select-none text-left"
                    >
                      <div className="mt-5">
                        <ChevronLeft size={16} className="text-pace-smoke" />
                        <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-pace-pearl">
                          Verification code
                        </h3>
                        <p className="mt-1 text-[11px] text-pace-smoke leading-relaxed">
                          We sent a 4-digit temporary verification key to your phone.
                        </p>

                        {/* Code digits boxes */}
                        <div className="mt-6 flex justify-between gap-3 px-2">
                          {getSimulatedOTP().map((char, index) => {
                            const isCurrent = char !== "";
                            return (
                              <div 
                                key={index}
                                className={`w-12 h-14 rounded-xl border flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                                  isCurrent ? "border-pace-pearl bg-white/5 shadow-glow" : "border-white/10 bg-white/[0.01]"
                                }`}
                              >
                                {char}
                              </div>
                            );
                          })}
                        </div>

                        {/* Numeric keyboard simulator */}
                        <div className="mt-8 grid grid-cols-3 gap-2 px-1 text-center font-semibold text-pace-bone text-sm">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                            const isActive = getActiveKeypadKey() === num;
                            return (
                              <motion.div 
                                key={num}
                                className="h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                                style={{
                                  backgroundColor: isActive ? "rgba(245,241,234,0.15)" : "transparent",
                                  scale: isActive ? 0.92 : 1,
                                  color: isActive ? "#f5f1ea" : "#cfc6ba"
                                }}
                              >
                                {num}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Spinner Check shield validation trigger */}
                        <AnimatePresence>
                          {currentTime - 5.5 >= 3.3 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="mt-6 flex items-center justify-center gap-2 border border-pace-moss/20 bg-pace-moss/5 rounded-2xl p-2.5 text-pace-moss text-xs font-semibold"
                            >
                              <div className="w-4 h-4 rounded-full bg-pace-moss flex items-center justify-center text-pace-black">
                                <Check size={10} strokeWidth={3} />
                              </div>
                              <span>Identity Verified</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 3: HOME DASHBOARD DECK */}
                  {currentScene.id === 3 && (
                    <motion.div
                      key="phone-home-scene"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between select-none"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex justify-between items-center mt-5">
                          <div>
                            <span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">synced privately</span>
                            <h3 className="text-xl font-bold text-pace-pearl leading-none mt-0.5">Pace</h3>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-pace-bone font-bold text-xs">
                            H
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-3 text-[11px] text-pace-bone/70 leading-relaxed">
                          Your active eras, held privately with your closest circle.
                        </p>

                        {/* List of high-resonance spaces */}
                        <div className="mt-5 space-y-3.5">
                          {[
                            {
                              id: "kyoto",
                              title: "Kyoto in the Rain 🌧️",
                              mood: "nostalgic",
                              snippet: "rain on temple roofs and buying hot coffee at vending machines",
                              cover: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75",
                              color: "from-[#8f6b67]/25 via-neutral-900/40 to-neutral-950",
                              active: true
                            },
                            {
                              id: "coding",
                              title: "Vaporwave Coding 💻",
                              mood: "chaotic",
                              snippet: "monitors glowing at 3:14 AM and one very dramatic git merge",
                              cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=75",
                              color: "from-purple-950/20 via-neutral-900/40 to-neutral-950",
                              active: false
                            },
                            {
                              id: "chai",
                              title: "Late Night Chai ☕",
                              mood: "soft",
                              snippet: " Marina wind and bad karaoke till sunrise",
                              cover: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=75",
                              color: "from-[#7d8577]/25 via-neutral-900/40 to-neutral-950",
                              active: false
                            }
                          ].map((item, idx) => {
                            // First card animates hover states
                            const hoverActive = item.active && currentTime - 9.5 >= 1.8 && currentTime - 9.5 < 3.8;
                            return (
                              <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.12 }}
                                className={`rounded-[20px] border p-3 bg-gradient-to-r ${item.color} relative overflow-hidden transition-all duration-300 ${
                                  hoverActive ? "border-pace-pearl/30 scale-[1.03] shadow-glow" : "border-white/5"
                                }`}
                              >
                                <div className="absolute right-3.5 top-3.5 w-6 h-6 rounded-full overflow-hidden border border-white/15">
                                  <img src={item.cover} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[7.5px] uppercase tracking-wider text-pace-smoke font-bold">{item.mood}</span>
                                <h4 className="text-xs font-bold text-pace-pearl mt-0.5">{item.title}</h4>
                                <p className="text-[9.5px] text-pace-bone/80 mt-1 max-w-[170px] truncate leading-normal">{item.snippet}</p>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom navigation */}
                      <div className="h-12 border-t border-white/5 flex items-center justify-around text-pace-smoke bg-[#080807]/95 absolute bottom-0 left-0 right-0 px-3 select-none">
                        <div className="flex flex-col items-center text-pace-pearl">
                          <Layers size={13} />
                          <span className="text-[7.5px] font-bold mt-0.5">Spaces</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Bot size={13} />
                          <span className="text-[7.5px] font-bold mt-0.5">Recaps</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <User size={13} />
                          <span className="text-[7.5px] font-bold mt-0.5">Profile</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 4: CAMERA FINDER & POLAROID DROP */}
                  {currentScene.id === 4 && (
                    <motion.div
                      key="phone-camera-scene"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-black text-pace-pearl overflow-hidden select-none"
                    >
                      {/* Viewfinder block */}
                      <div className="relative flex-1 w-full h-full flex flex-col justify-between p-4 pb-20 pt-6 text-left">
                        
                        {/* Shutter White Flash overlay */}
                        <AnimatePresence>
                          {currentTime >= 16.0 && currentTime < 16.5 && (
                            <motion.div 
                              key="camera-shutter-flash"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="absolute inset-0 bg-white z-50 pointer-events-none"
                            />
                          )}
                        </AnimatePresence>

                        {/* Top banner parameters */}
                        <div className="flex justify-between items-center text-white/80 text-[9px] uppercase tracking-widest font-bold z-10">
                          <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5">
                            <Compass size={11} className="animate-spin text-pace-wine" style={{ animationDuration: "5s" }} />
                            <span>Kyoto Temple</span>
                          </div>
                          <span className="bg-red-500/25 border border-red-500/25 px-2 py-0.5 rounded-full text-red-200">live</span>
                        </div>

                        {/* Camera finder frame background */}
                        <img 
                          src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=75" 
                          className="absolute inset-0 w-full h-full object-cover opacity-80" 
                        />

                        {/* Viewfinder crosshairs */}
                        <div className="absolute inset-8 border border-white/10 rounded-2xl flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-[1px] bg-white/40 absolute" />
                          <div className="h-3 w-[1px] bg-white/40 absolute" />
                        </div>

                        {/* Click indicator on red button */}
                        <AnimatePresence>
                          {currentTime < 16.0 && (
                            <motion.div 
                              key="shutter-button-indicator"
                              initial={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.25 }}
                              className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none"
                            >
                              <motion.div 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.2 }}
                                className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center bg-transparent"
                              >
                                <div className="w-10 h-10 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]" />
                              </motion.div>
                              <span className="text-[8px] uppercase tracking-wider text-white bg-black/50 px-2 py-0.5 rounded">Capture Memory</span>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* POST-SHUTTER: Feed and drop-in memory simulation */}
                        {currentTime >= 16.2 && (
                          <motion.div 
                            key="timeline-feed-post-shutter"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-[#0d0d0c] z-30 flex flex-col p-4 overflow-hidden"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <ChevronLeft size={15} />
                              <span className="text-[8px] uppercase tracking-widest text-pace-smoke font-bold">Timeline</span>
                            </div>

                            {/* Dropping Polaroid with spring bounce */}
                            <motion.div
                              initial={{ y: -300, rotate: -15, scale: 0.95 }}
                              animate={{ y: 0, rotate: -1.2, scale: 1 }}
                              transition={{ type: "spring", stiffness: 90, damping: 13, delay: 0.3 }}
                              className="rounded-2xl border border-white/15 bg-[#f4eee3] p-2.5 text-pace-black shadow-2xl mt-4 w-full"
                            >
                              <img 
                                src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75" 
                                className="w-full aspect-[4/3] rounded-lg object-cover" 
                              />
                              <div className="pt-2 px-1 text-left">
                                <motion.p 
                                  className="text-xs font-bold leading-normal"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.8 }}
                                >
                                  Kyoto was a dream. The rain on the temple roof felt silent.
                                </motion.p>
                                <span className="text-[7.5px] text-pace-smoke font-bold block mt-1.5">Me · Just now · Kyoto</span>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 5: AUDIO INTERACTIVE WAVE FORM */}
                  {currentScene.id === 5 && (
                    <motion.div
                      key="phone-audio-scene"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-[#0d0d0c] overflow-hidden select-none"
                    >
                      {/* Timeline header */}
                      <div className="relative h-36 overflow-hidden text-left flex flex-col justify-end p-4">
                        <img src="https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=75" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-[#0d0d0c]" />
                        <ChevronLeft size={16} className="absolute left-3 top-5 text-pace-pearl" />
                        
                        <span className="text-[8px] uppercase tracking-wider text-pace-bone font-bold z-10">late-night</span>
                        <h4 className="text-lg font-bold text-pace-pearl mt-0.5 z-10">Late Night Chai</h4>
                      </div>

                      {/* Content panel focus on voice memo */}
                      <div className="flex-1 p-4 space-y-4 text-left">
                        <span className="text-[8px] text-pace-smoke uppercase tracking-wider font-bold">playing audio memory</span>

                        {/* Upgraded layout with concentric circles ripple */}
                        <div className="rounded-[22px] border border-white/10 bg-[#161514] p-4 flex flex-col items-center relative overflow-hidden">
                          
                          {/* Floating waves overlay */}
                          <div className="flex items-center gap-[2.5px] h-14 w-full justify-center px-1">
                            {audioWaves.map((bar) => (
                              <motion.div
                                key={bar.id}
                                className="w-[3px] rounded-full bg-pace-pearl/45"
                                initial={{ height: 6 }}
                                animate={{
                                  height: [6, bar.height, 8, bar.height * 0.7, 6]
                                }}
                                transition={{
                                  duration: 1.4,
                                  delay: bar.delay,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </div>

                          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 relative">
                            {/* Visual concentric ripple ring */}
                            <span className="absolute -inset-1 rounded-full border border-white/10 scale-95 animate-ping opacity-45" style={{ animationDuration: "2s" }} />
                            
                            <Volume2 size={12} className="text-pace-pearl animate-pulse" />
                            <span className="text-[9px] font-bold text-pace-pearl uppercase tracking-wider">Aadhi voice memo</span>
                          </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-[11px] text-pace-bone leading-relaxed">
                            "A voice note that starts as gossip and ends as absolute life advice at 1:08 AM."
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 6: SHIMMER POETIC AI RECAP */}
                  {currentScene.id === 6 && (
                    <motion.div
                      key="phone-recap-scene"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between select-none"
                    >
                      <div className="mt-5">
                        <div className="flex items-center gap-1">
                          <ChevronLeft size={16} className="text-pace-smoke" />
                          <span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">recap summary</span>
                        </div>

                        {/* Gold gradient sweep Recap Card */}
                        <div className="mt-5 rounded-[24px] border border-[#d2c5b1]/20 bg-gradient-to-br from-white/5 to-[#1c1a18] p-5 text-left relative overflow-hidden shadow-glow">
                          
                          {/* Sweeping shimmer effect */}
                          <motion.div 
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                            className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[#d2c5b1]/8 to-transparent skew-x-12 pointer-events-none"
                          />

                          <div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.2em] text-[#d2c5b1] font-semibold">
                            <Bot size={13} className="text-pace-bone" />
                            ai-generated recap
                          </div>

                          {/* Typewritten summary */}
                          <p className="mt-4 text-xs font-semibold leading-relaxed text-pace-pearl min-h-[96px] relative">
                            {getAIRecapTypewriter()}
                            <span 
                              className="inline-block w-[2px] h-3.5 bg-pace-pearl ml-0.5 translate-y-[2px]"
                              style={{ animation: "cursor-blink 0.8s step-end infinite" }}
                            />
                          </p>

                          <div className="mt-5 flex items-center justify-between text-[9px] text-pace-smoke border-t border-white/5 pt-3">
                            <span>Kyoto trip sentiment</span>
                            <span className="text-pace-pearl font-bold">nostalgic & deep</span>
                          </div>
                        </div>
                      </div>

                      <div className="pb-3 text-center text-[10px] text-pace-smoke font-medium">
                        Hold to expand details
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 7: ZERO SOCIAL SETTINGS PROFILE */}
                  {currentScene.id === 7 && (
                    <motion.div
                      key="phone-profile-scene"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between select-none text-left"
                    >
                      <div className="mt-5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-bold text-pace-pearl">Settings</h4>
                          <span className="rounded-full border border-pace-moss/20 bg-pace-moss/5 px-2 py-0.5 text-[8px] font-bold text-pace-moss">
                            verified private
                          </span>
                        </div>

                        {/* Profile layout */}
                        <div className="mt-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pace-moss to-[#8f6b67] flex items-center justify-center font-bold text-sm text-white">
                            MH
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-pace-pearl">Habib</h5>
                            <p className="text-[9px] text-pace-smoke">private curator since 2026</p>
                          </div>
                        </div>

                        {/* Zero Metrics Counters with X badges */}
                        <div className="mt-6 space-y-3.5">
                          
                          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex justify-between items-center relative overflow-hidden">
                            <span className="text-xs text-pace-bone">Paces Shared</span>
                            <span className="text-xs font-bold text-pace-pearl">3 spaces</span>
                          </div>

                          <div className="rounded-xl bg-white/[0.03] border border-red-500/10 p-3 flex justify-between items-center relative overflow-hidden">
                            <span className="text-xs text-pace-bone">Follower Counts</span>
                            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                              <X size={12} strokeWidth={2.5} />
                              <span>0 · Disabled</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-white/[0.03] border border-red-500/10 p-3 flex justify-between items-center relative overflow-hidden">
                            <span className="text-xs text-pace-bone">Public View Metrics</span>
                            <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">
                              <X size={12} strokeWidth={2.5} />
                              <span>0 · Blocked</span>
                            </div>
                          </div>

                        </div>

                        <div className="mt-5 border border-white/5 bg-white/[0.01] rounded-xl p-3 flex gap-2">
                          <Info size={14} className="text-pace-smoke flex-shrink-0 mt-0.5" />
                          <p className="text-[9.5px] text-pace-smoke leading-normal">
                            Pace is built without follower hooks, likes, or view counts. It is a quiet sanctuary for your friendship eras.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* ============================================================================
              TACTILE FLOATING SCRAPBOOK ASSETS (Zoom and Parallax depth)
              ============================================================================ */}
          
          {/* Floating Polaroid Image 1 (Kyoto Shrine) */}
          <AnimatePresence>
            {(currentScene.id === 3 || currentScene.id === 4) && (
              <motion.div
                initial={{ opacity: 0, x: 230, y: -70, rotate: 15, scale: 0.8 }}
                animate={{ opacity: 1, x: 195, y: -25, rotate: 7, scale: 0.95 }}
                exit={{ opacity: 0, x: 230, y: -70 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-[#f4eee3] p-2.5 text-pace-black shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none"
              >
                <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75" className="w-full aspect-square rounded-lg object-cover" />
                <div className="pt-2 px-1 text-left">
                  <p className="text-[10px] font-bold leading-tight">Kyoto in the Rain 🌧️</p>
                  <span className="text-[7.5px] text-pace-smoke block mt-1 font-bold">April 18 · Aarav</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Polaroid Image 2 (Late Night sunset) */}
          <AnimatePresence>
            {currentScene.id === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 220, y: -50, rotate: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 190, y: -10, rotate: -4, scale: 0.95 }}
                exit={{ opacity: 0, x: 220, y: -50 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-[#f4eee3] p-2.5 text-pace-black shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none"
              >
                <img src="https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=75" className="w-full aspect-square rounded-lg object-cover" />
                <div className="pt-2 px-1 text-left">
                  <p className="text-[10px] font-bold leading-tight">Late Night Chai ☕</p>
                  <span className="text-[7.5px] text-pace-smoke block mt-1 font-bold">May 12 · Aadhi</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Private Crypt Tag (Scene 7) */}
          <AnimatePresence>
            {currentScene.id === 7 && (
              <motion.div
                initial={{ opacity: 0, x: -220, y: -110, rotate: -15 }}
                animate={{ opacity: 1, x: -185, y: -70, rotate: -5 }}
                exit={{ opacity: 0, x: -220, y: -110 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-pace-bone backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none text-left"
              >
                <div className="flex items-center gap-1 text-pace-moss">
                  <ShieldCheck size={14} />
                  <span className="text-[8.5px] uppercase tracking-wider font-bold">Encrypted Sandbox</span>
                </div>
                <h5 className="text-xs font-bold mt-1 text-pace-pearl">Zero analytics</h5>
                <p className="text-[9.5px] text-pace-smoke mt-1 leading-normal">
                  Your memories belong only to you and friends. No tracking scripts or ads.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* ============================================================================
            4. FOREGROUND DEPTH-OF-FIELD BLURRED FLOATING MEMORIES (PARALLAX LAYER)
            ============================================================================ */}
        
        {/* Floating Blurred Foreground Polaroid (Scene 3 & 4) */}
        <AnimatePresence>
          {(currentScene.id === 3 || currentScene.id === 4) && (
            <motion.div
              initial={{ opacity: 0, x: -100, y: 150, rotate: -12, scale: 1.15 }}
              animate={{ opacity: 0.95, x: -60, y: 110, rotate: -6, scale: 1.35 }}
              exit={{ opacity: 0, x: -100, y: 150 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute left-[8%] bottom-[8%] z-50 w-44 rounded-2xl border border-white/5 bg-[#f4eee3]/90 p-2.5 text-pace-black shadow-[0_30px_70px_rgba(0,0,0,0.75)] pointer-events-none filter blur-[2.5px] saturate-[1.15]"
            >
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=60" className="w-full aspect-square rounded-lg object-cover" />
              <div className="pt-2 px-1 text-left">
                <p className="text-[10px] font-bold leading-tight">Vaporwave coding 💻</p>
                <span className="text-[7.5px] text-pace-smoke block mt-0.5">Kavin</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Blurred Foreground Chat Bubble (Scene 5 & 6) */}
        <AnimatePresence>
          {(currentScene.id === 5 || currentScene.id === 6) && (
            <motion.div
              initial={{ opacity: 0, x: 100, y: 180, scale: 1.2 }}
              animate={{ opacity: 0.9, x: 60, y: 130, scale: 1.35 }}
              exit={{ opacity: 0, x: 100, y: 180 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
              className="absolute right-[8%] bottom-[12%] z-50 w-48 rounded-[24px] border border-white/10 bg-[#161514]/90 p-4 text-pace-pearl shadow-[0_30px_70px_rgba(0,0,0,0.75)] pointer-events-none filter blur-[2px] text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-pace-pearl flex items-center justify-center text-pace-black text-[9px] font-black">R</div>
                <div>
                  <p className="text-[9.5px] text-pace-smoke">Riya</p>
                  <p className="text-xs font-bold text-pace-pearl mt-0.5">"bad karaoke was too good!"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ============================================================================
          INTERACTIVE CONTROL HUD (FLOATING DASHBOARD)
          ============================================================================ */}
      <AnimatePresence>
        {showHUD && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-6 left-6 right-6 z-40 flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0d0d0c]/85 p-4 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl transition-all duration-300"
          >
            
            {/* Scrubber slider bar */}
            <div className="flex items-center gap-4 w-full">
              <span className="text-xs text-pace-smoke font-mono w-10 text-right">
                {currentTime.toFixed(1)}s
              </span>
              <input
                type="range"
                min={0}
                max={TOTAL_DURATION}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  setCurrentTime(parseFloat(e.target.value));
                  setIsPlaying(false); // Pause on manual edit
                }}
                className="flex-1 accent-pace-pearl h-1 bg-white/15 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-pace-smoke font-mono w-10 text-left">
                {TOTAL_DURATION.toFixed(1)}s
              </span>
            </div>

            {/* Main HUD Row layout */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
              
              {/* Play buttons group */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2.5 rounded-full bg-pace-pearl text-pace-black hover:scale-105 active:scale-95 transition"
                  title={isPlaying ? "Pause Timeline" : "Play Timeline"}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                  className="p-2.5 rounded-full border border-white/10 text-pace-bone hover:bg-white/5 active:scale-95 transition"
                  title="Restart Sequence"
                >
                  <RotateCcw size={15} />
                </button>

                {/* Speed indicator */}
                <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 ml-2">
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-full font-bold transition ${
                        playbackSpeed === speed ? "bg-pace-pearl text-pace-black" : "text-pace-bone hover:text-white"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Status and Active Scene info badge */}
              <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-pace-wine rounded-full animate-ping" />
                <span className="text-pace-bone">Active Scene:</span>
                <span className="text-pace-pearl font-bold truncate max-w-[150px]">{currentScene.name}</span>
              </div>

              {/* Utility and capture keys */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrain(!showGrain)}
                  className={`p-2.5 rounded-full border transition ${
                    showGrain ? "border-pace-moss text-pace-moss bg-pace-moss/5" : "border-white/10 text-pace-smoke hover:bg-white/5"
                  }`}
                  title="Toggle Film Grain overlay"
                >
                  <Monitor size={15} />
                </button>

                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-2.5 rounded-full border transition ${
                    showGuide ? "border-[#ff7954] text-[#ff7954] bg-[#da552f]/5" : "border-white/10 text-pace-smoke hover:bg-white/5"
                  }`}
                  title="OBS Recording Guide"
                >
                  <HelpCircle size={15} />
                </button>

                <button
                  onClick={triggerCaptureStart}
                  className="flex items-center gap-1.5 rounded-full bg-pace-wine text-pace-pearl px-4 py-2 text-xs font-bold shadow-glow hover:scale-102 active:scale-98 transition"
                >
                  <Video size={14} className="animate-pulse" />
                  Start Capture
                </button>
              </div>

            </div>

            {/* Mini scene selectors jump cards */}
            <div className="border-t border-white/5 pt-3 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
              {SCENES.map((scene) => {
                const isActive = currentScene.id === scene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => jumpToScene(scene)}
                    className={`flex-1 min-w-[95px] text-left p-2 rounded-xl border transition ${
                      isActive ? "bg-white/5 border-pace-pearl/30 text-pace-pearl" : "border-white/5 hover:border-white/10 text-pace-smoke"
                    }`}
                  >
                    <p className="text-[9px] uppercase tracking-wider font-bold">Scene {scene.id}</p>
                    <p className="text-[10px] font-bold mt-0.5 truncate">{scene.label}</p>
                  </button>
                );
              })}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Indicator Banner */}
      {capturingMode && (
        <div className="absolute top-6 left-6 z-40 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/80 px-4 py-2 text-xs font-bold text-red-200 backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          <span>RECORDING CAMERA STAGE · Press ESC to bring back control HUD</span>
        </div>
      )}

      {/* Record Countdown Modal screen */}
      <AnimatePresence>
        {captureCountdown > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center text-pace-pearl"
          >
            <motion.span 
              key={captureCountdown}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-9xl font-black font-display text-pace-wine"
            >
              {captureCountdown}
            </motion.span>
            <p className="mt-4 text-xs tracking-widest text-pace-smoke uppercase font-semibold">
              Preparing stage. Press F11 for full screen browser view now.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Info Dialog overlay */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGuide(false)}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl border border-white/10 bg-[#0d0d0c] p-6 max-w-md text-left text-pace-pearl shadow-2xl relative overflow-hidden"
            >
              <h4 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3">
                <Video size={18} className="text-pace-wine" />
                OBS Studio Capture Guide
              </h4>
              
              <ul className="mt-4 space-y-3.5 text-xs text-pace-bone leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">1</span>
                  <span>Set browser zoom to <strong>100%</strong> and click <strong>F11</strong> to toggle full-screen window coverage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">2</span>
                  <span>In OBS (or screen recorder), add a <strong>Window Capture</strong> source targeting your browser. Enable hardware acceleration for hardware performance.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">3</span>
                  <span>Set your output encoding recording format to <strong>60 FPS</strong> at <strong>1080p</strong> or <strong>4K</strong> (aspect ratio is locked to 16:9).</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">4</span>
                  <span>Click <strong>Start Capture</strong> in the HUD. A 3-second countdown will start, then the HUD will fade completely out of the frame. The video will cycle through all scenes in a loop.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">5</span>
                  <span>Press <strong>ESC</strong> at any point to show the HUD controls and return to normal editing.</span>
                </li>
              </ul>

              <button
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full rounded-xl bg-pace-pearl py-2.5 text-center text-xs font-bold text-pace-black active:scale-95 transition"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden toggle HUD key when clean capture plays */}
      {!showHUD && !capturingMode && (
        <button
          onClick={() => setShowHUD(true)}
          className="absolute bottom-6 right-6 z-40 p-3 rounded-full border border-white/10 bg-[#0d0d0c]/70 text-pace-bone hover:bg-black/90 active:scale-95 transition shadow-lg"
          title="Show HUD dashboard"
        >
          <Eye size={15} />
        </button>
      )}

    </div>
  );
}
