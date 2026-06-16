import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Layers,
  Sparkles,
  User,
  Users,
  Bot,
  Volume2,
  Lock,
  MapPin,
  ChevronLeft,
  Settings,
  HelpCircle,
  Eye,
  EyeOff,
  Video,
  Monitor,
  Heart,
  ChevronRight,
  ShieldCheck,
  Send,
  MessageCircle,
  Moon
} from "lucide-react";
import { covers, paces, memories } from "../shared/constants";

// ============================================================================
// CONFIG & SCENE TIMELINE CONFIGURATION
// ============================================================================
const SCENES = [
  { id: 1, name: "Scene 1: Hook Intro", start: 0, end: 4.5, label: "Brand Hook" },
  { id: 2, name: "Scene 2: Onboarding", start: 4.5, end: 8.5, label: "Auth Flow" },
  { id: 3, name: "Scene 3: Home Dashboard", start: 8.5, end: 13.5, label: "Your Eras" },
  { id: 4, name: "Scene 4: Chennai Timeline", start: 13.5, end: 18.5, label: "Spaces" },
  { id: 5, name: "Scene 5: Voice Note Wave", start: 18.5, end: 23.5, label: "Interactive" },
  { id: 6, name: "Scene 6: Poetic AI Recap", start: 23.5, end: 28.5, label: "AI Recaps" },
  { id: 7, name: "Scene 7: No Metrics Profile", start: 28.5, end: 32.5, label: "Zero Pressure" },
  { id: 8, name: "Scene 8: Outro & PH CTA", start: 32.5, end: 37.0, label: "PH Launch" }
];

const TOTAL_DURATION = 37.0; // seconds

export default function PromoShowcase() {
  // --- STATE ---
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [tiltAngle, setTiltAngle] = useState("isometric-left"); // flat, isometric-left, isometric-right, extreme
  const [glowIntensity, setGlowIntensity] = useState("medium"); // none, low, medium, high
  const [showGrain, setShowGrain] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [capturingMode, setCapturingMode] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  
  // Audio waveforms mock state
  const [audioWaves, setAudioWaves] = useState([]);

  // Refs for tracking playback loop
  const timerRef = useRef(null);
  const lastTickRef = useRef(null);

  // Generate audio waves elements
  useEffect(() => {
    setAudioWaves(
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        height: 10 + Math.random() * 55,
        delay: i * 0.04
      }))
    );
  }, []);

  // Calculate current scene object
  const currentScene = useMemo(() => {
    return SCENES.find(s => currentTime >= s.start && currentTime < s.end) || SCENES[SCENES.length - 1];
  }, [currentTime]);

  // --- ANIMATION / TIMELINE TICK LOOP ---
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
          // Loop around
          return 0;
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

  // --- CAPTURE TRIGGER helper ---
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
          // Start capturing
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

  // Keyboard controls listener (press ESC to exit capture mode)
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

  // Helpers to jump to scene
  const jumpToScene = (scene) => {
    setCurrentTime(scene.start);
    setIsPlaying(true);
  };

  // --- TILT ANGLE CSS MAP ---
  const getTiltStyles = () => {
    switch (tiltAngle) {
      case "isometric-left":
        return {
          transform: "rotateX(20deg) rotateY(-20deg) rotateZ(10deg)",
          transformStyle: "preserve-3d"
        };
      case "isometric-right":
        return {
          transform: "rotateX(20deg) rotateY(20deg) rotateZ(-10deg)",
          transformStyle: "preserve-3d"
        };
      case "extreme":
        return {
          transform: "rotateX(40deg) rotateY(-35deg) rotateZ(20deg) scale(0.9)",
          transformStyle: "preserve-3d"
        };
      case "flat":
      default:
        return {
          transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
          transformStyle: "preserve-3d"
        };
    }
  };

  // --- GLOW INTENSITY MAP ---
  const getGlowStyles = () => {
    switch (glowIntensity) {
      case "low":
        return "rgba(214, 198, 176, 0.05)";
      case "high":
        return "rgba(214, 198, 176, 0.28)";
      case "none":
        return "rgba(0,0,0,0)";
      case "medium":
      default:
        return "rgba(214, 198, 176, 0.16)";
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-pace-black font-sans select-none">
      
      {/* Cinematic Film Grain */}
      {showGrain && <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.08]" />}

      {/* Dynamic Background Blur Radial Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div 
          className="absolute -left-10 top-1/4 h-[40rem] w-[40rem] rounded-full blur-[160px] opacity-15 transition-all duration-1000 ease-in-out"
          style={{
            background: currentScene.id === 1 ? "#8f6b67" :
                        currentScene.id === 4 ? "#7d8577" :
                        currentScene.id === 6 ? "#cfc6ba" : "#8f6b67",
            transform: `translate(${Math.sin(currentTime) * 50}px, ${Math.cos(currentTime) * 30}px)`
          }}
        />
        <div 
          className="absolute -right-20 bottom-1/4 h-[45rem] w-[45rem] rounded-full blur-[180px] opacity-10 transition-all duration-1000 ease-in-out"
          style={{
            background: currentScene.id === 3 ? "#7d8577" :
                        currentScene.id === 5 ? "#8f6b67" :
                        currentScene.id === 8 ? "#cfc6ba" : "#7d8577",
            transform: `translate(${Math.cos(currentTime) * -40}px, ${Math.sin(currentTime) * 60}px)`
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080807_100%)] opacity-85" />
      </div>

      {/* ============================================================================
          MAIN GRAPHICS STAGE
          ============================================================================ */}
      <div className="relative z-10 flex h-full w-full max-w-[1920px] aspect-[16/9] items-center justify-center overflow-hidden px-8">
        
        {/* Left Side: Cinematic Typography Overlay */}
        <div className="absolute left-[8%] z-30 flex max-w-lg flex-col items-start text-left pointer-events-none">
          <AnimatePresence mode="wait">
            {currentScene.id === 1 && (
              <motion.div
                key="text-scene-1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  friendship eras
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Every era has <br />
                  <span className="text-pace-wine italic text-6xl">its own vibe.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Trip to Kyoto, semester rooms, late-night karaoke. Pace keeps them held quietly with friends.
                </p>
              </motion.div>
            )}

            {currentScene.id === 2 && (
              <motion.div
                key="text-scene-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  cinematic onboarding
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Enter your <br />
                  <span className="text-pace-moss">private space.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Sign in instantly. OTP passwordless verification ensures your scrapbook belongs only to your inner circle.
                </p>
              </motion.div>
            )}

            {currentScene.id === 3 && (
              <motion.div
                key="text-scene-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  dashboard list
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Active eras, <br />
                  <span className="text-pace-bone font-medium">held quietly.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Organize memory albums dynamically with customizable card structures, cover templates, and ambient color moods.
                </p>
              </motion.div>
            )}

            {currentScene.id === 4 && (
              <motion.div
                key="text-scene-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  scrapbook feed
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Immersive <br />
                  <span className="text-pace-wine">timelines.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Drop photos, notes, and coordinates. Cascades fall in randomly angled layouts for a tactile, print-look feel.
                </p>
              </motion.div>
            )}

            {currentScene.id === 5 && (
              <motion.div
                key="text-scene-5"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  interactive voice
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Listen to the <br />
                  <span className="text-pace-pearl font-normal">moments glow.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Interactive voice note modules record and display audio spectrographs dynamically as friends click and play.
                </p>
              </motion.div>
            )}

            {currentScene.id === 6 && (
              <motion.div
                key="text-scene-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  ai recaps
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Aesthetic <br />
                  <span className="text-pace-wine italic text-6xl">emotional recaps.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Our custom model captures the emotional tone of your memories and writes beautiful, nostalgic summaries.
                </p>
              </motion.div>
            )}

            {currentScene.id === 7 && (
              <motion.div
                key="text-scene-7"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  no social pressure
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Zero metrics. <br />
                  <span className="text-pace-moss">Just memories.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  No view counts. No likes. No algorithm. Just a private sandbox shared with the people who were there.
                </p>
              </motion.div>
            )}

            {currentScene.id === 8 && (
              <motion.div
                key="text-scene-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-4"
              >
                <span className="rounded-full border border-pace-pearl/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-pace-bone/80 backdrop-blur-md">
                  launching soon
                </span>
                <h2 className="text-5xl font-bold leading-tight text-pace-pearl tracking-tight font-display">
                  Pace on <br />
                  <span className="text-pace-pearl font-normal">Product Hunt.</span>
                </h2>
                <p className="text-base text-pace-smoke leading-relaxed max-w-sm">
                  Support our private social scrapbook. Code your eras, hold your friendships.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Center: Device Mockup Platform */}
        <div 
          className="relative z-20 flex items-center justify-center transition-all duration-700 ease-out"
          style={{
            ...getTiltStyles(),
            perspective: 1200,
            marginLeft: "24%"
          }}
        >
          {/* Soft Shadow Base */}
          <div 
            className="absolute rounded-[42px] blur-[35px] transition-all duration-500 pointer-events-none"
            style={{
              width: "300px",
              height: "610px",
              background: getGlowStyles(),
              transform: "translateY(25px) translateZ(-50px)"
            }}
          />

          {/* CSS iPhone Frame */}
          <div className="relative w-[310px] h-[630px] rounded-[48px] bg-pace-black border-[9px] border-pace-coal shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden select-none">
            
            {/* iPhone Camera Notch Area */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[25px] bg-pace-coal rounded-b-[16px] z-50 flex items-center justify-center gap-1.5 px-3">
              {/* Speaker pill */}
              <div className="w-8 h-1 bg-[#101010] rounded-full" />
              {/* Camera dot */}
              <div className="w-2.5 h-2.5 bg-[#090b10] rounded-full border border-neutral-900" />
            </div>

            {/* iPhone Screen Content Screen Switcher */}
            <div className="w-full h-full flex flex-col bg-[#080807] relative text-pace-pearl overflow-hidden pt-6">
              
              {/* Dynamic status bar */}
              <div className="px-5 py-1.5 flex justify-between items-center text-[10px] text-pace-smoke font-semibold absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#080807] to-transparent pointer-events-none">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-pace-smoke rounded-full scale-75" />
                  <div className="w-3.5 h-2 bg-pace-smoke rounded-sm scale-75" />
                </div>
              </div>

              {/* VIEW SWITCHER INSIDE PHONE */}
              <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col text-left">
                <AnimatePresence mode="wait">
                  
                  {/* SCREEN 1: SPLASH STORY BRAND */}
                  {currentScene.id === 1 && (
                    <motion.div
                      key="phone-splash"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#141312] to-pace-black"
                    >
                      {/* Ambient blur orb inside phone */}
                      <div className="absolute top-1/3 h-32 w-32 rounded-full bg-[#8f6b67]/10 blur-2xl" />
                      
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center z-10"
                      >
                        <Moon size={36} className="text-pace-pearl animate-pulse" />
                        <h3 className="mt-4 text-3xl font-bold tracking-tight font-display text-pace-pearl">
                          Pace
                        </h3>
                        <p className="mt-2 text-[10px] tracking-[0.25em] text-pace-smoke uppercase font-semibold">
                          private memory app
                        </p>
                      </motion.div>

                      {/* Sliding visual indicators */}
                      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-pace-pearl rounded-full" />
                        <span className="w-1.5 h-1.5 bg-pace-smoke/30 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-pace-smoke/30 rounded-full" />
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 2: ONBOARDING LOGIN FLOW */}
                  {currentScene.id === 2 && (
                    <motion.div
                      key="phone-auth"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="absolute inset-0 flex flex-col p-5 bg-[#080807] justify-between z-10"
                    >
                      <div className="mt-8">
                        <ChevronLeft size={16} className="text-pace-smoke" />
                        <h3 className="mt-6 text-2xl font-semibold leading-tight text-pace-pearl">
                          Unlocking <br />your memories
                        </h3>
                        <p className="mt-2 text-xs text-pace-smoke">
                          We will text a temporary verification code to verify your phone number.
                        </p>

                        {/* Input simulator */}
                        <div className="mt-8 border border-white/10 rounded-2xl bg-white/[0.04] p-4 text-left">
                          <p className="text-[10px] uppercase tracking-wider text-pace-smoke font-semibold">phone number</p>
                          <div className="mt-1 flex items-center gap-1 text-sm font-semibold">
                            <span className="text-pace-bone">+1 (555)</span>
                            <motion.span 
                              className="text-pace-pearl border-r-2 border-pace-pearl pr-0.5"
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ repeat: Infinity, duration: 0.9 }}
                            >
                              019-2834
                            </motion.span>
                          </div>
                        </div>

                        {/* Action buttons simulator */}
                        <div className="mt-4 rounded-2xl bg-pace-pearl p-3.5 text-center text-xs font-bold text-pace-black cursor-pointer shadow-glow">
                          Send verification code
                        </div>
                      </div>

                      <div className="pb-4 text-center text-[10px] text-pace-smoke">
                        By signing in, you agree to our private terms.
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 3: HOME DASHBOARD LIST */}
                  {currentScene.id === 3 && (
                    <motion.div
                      key="phone-home"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex justify-between items-center mt-6">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-pace-smoke font-bold">synced privately</span>
                            <h3 className="text-2xl font-semibold text-pace-pearl leading-none mt-1">Pace</h3>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-pace-bone">
                            <User size={14} />
                          </div>
                        </div>

                        {/* Description */}
                        <p className="mt-4 text-xs text-pace-bone/70 leading-relaxed">
                          Your active eras, held quietly with the people who were there.
                        </p>

                        {/* Spaces deck simulation (vertical list/cards scroll) */}
                        <div className="mt-6 space-y-4">
                          {paces.map((p, idx) => (
                            <motion.div 
                              key={p.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.15 }}
                              className={`rounded-2xl border border-white/10 p-3 bg-gradient-to-r ${p.color} relative overflow-hidden`}
                            >
                              <div className="absolute right-3 top-3 overflow-hidden rounded-full border border-white/10 w-6 h-6">
                                <img src={p.cover} className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[8px] uppercase tracking-wider text-pace-bone font-semibold">{p.mood}</span>
                              <h4 className="text-sm font-semibold text-pace-pearl mt-1">{p.title}</h4>
                              <p className="text-[10px] text-pace-bone/80 mt-1.5 max-w-[170px] truncate">{p.snippet}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom navigation layout mockup */}
                      <div className="h-12 border-t border-white/5 flex items-center justify-around text-pace-smoke bg-[#080807]/90 absolute bottom-0 left-0 right-0 px-2">
                        <div className="flex flex-col items-center text-pace-pearl">
                          <Layers size={14} />
                          <span className="text-[8px] mt-0.5">Spaces</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Bot size={14} />
                          <span className="text-[8px] mt-0.5">Recaps</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <User size={14} />
                          <span className="text-[8px] mt-0.5">Profile</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 4: CHENNAI TIMELINE VIEW */}
                  {currentScene.id === 4 && (
                    <motion.div
                      key="phone-timeline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-[#0d0d0c] overflow-hidden"
                    >
                      {/* Timeline cover image header */}
                      <div className="relative h-44 overflow-hidden text-left flex flex-col justify-end p-4">
                        <img src={covers[1]} className="absolute inset-0 w-full h-full object-cover opacity-65" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0d0d0c]" />
                        
                        <ChevronLeft size={16} className="absolute left-3 top-6 text-pace-pearl bg-black/30 rounded-full p-0.5 w-6 h-6" />

                        <span className="text-[8px] uppercase tracking-wider text-pace-bone z-10 font-bold">late-night</span>
                        <h4 className="text-xl font-bold text-pace-pearl leading-none mt-1 z-10">Chennai Nights</h4>
                        <span className="text-[9px] text-pace-bone/85 mt-2 z-10 flex items-center gap-1 font-medium">
                          <Users size={10} /> Me, Riya, Aadhi, Noor
                        </span>
                      </div>

                      {/* Scrollable feed mock */}
                      <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-16">
                        
                        {/* Mini recap preview */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-left">
                          <div className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-pace-smoke font-bold">
                            <Bot size={11} /> AI Recap
                          </div>
                          <p className="text-xs text-pace-pearl mt-1.5 font-medium leading-relaxed">
                            "April felt chaotic, loud, and strangely beautiful."
                          </p>
                        </div>

                        {/* Polaroid mockup card */}
                        <motion.div 
                          initial={{ opacity: 0, rotate: -3, y: 15 }}
                          animate={{ opacity: 1, rotate: -1.5, y: 0 }}
                          className="rounded-2xl border border-white/15 bg-[#f4eee3] p-2 text-pace-black shadow-lg"
                        >
                          <img src={covers[1]} className="w-full aspect-[4/3] rounded-lg object-cover" />
                          <div className="pt-2 px-1 text-left">
                            <p className="text-xs font-semibold leading-snug">Marina beach was louder than all of us tonight.</p>
                            <span className="text-[8px] text-pace-smoke font-bold mt-1.5 block">Riya · 11:42 PM</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 5: AUDIO WAVE VISUALIZATION */}
                  {currentScene.id === 5 && (
                    <motion.div
                      key="phone-audio"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 flex flex-col bg-[#0d0d0c] overflow-hidden"
                    >
                      {/* Timeline cover image header */}
                      <div className="relative h-44 overflow-hidden text-left flex flex-col justify-end p-4">
                        <img src={covers[1]} className="absolute inset-0 w-full h-full object-cover opacity-65" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-[#0d0d0c]" />
                        <ChevronLeft size={16} className="absolute left-3 top-6 text-pace-pearl" />

                        <span className="text-[8px] uppercase tracking-wider text-pace-bone z-10 font-bold">late-night</span>
                        <h4 className="text-xl font-bold text-pace-pearl leading-none mt-1 z-10">Chennai Nights</h4>
                      </div>

                      {/* Timeline Content - Focused Voice note play */}
                      <div className="flex-1 p-4 space-y-4 text-left">
                        <span className="text-[9px] text-pace-smoke uppercase tracking-wider font-bold">playing audio memory</span>
                        
                        {/* Audio Wave Play Card */}
                        <div className="rounded-2xl border border-white/10 bg-[#161514] p-4 relative overflow-hidden flex flex-col items-center">
                          
                          {/* Animated voice wave spectrograph */}
                          <div className="flex items-center gap-[2.5px] h-16 w-full justify-center px-1">
                            {audioWaves.map((bar) => (
                              <motion.div
                                key={bar.id}
                                className="w-[3px] rounded-full bg-pace-pearl/50"
                                initial={{ height: 6 }}
                                animate={{
                                  height: [6, bar.height, 8, bar.height * 0.6, 6],
                                  backgroundColor: ["rgba(245,241,234,0.3)", "rgba(245,241,234,0.8)", "rgba(245,241,234,0.3)"]
                                }}
                                transition={{
                                  duration: 1.6,
                                  delay: bar.delay,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </div>

                          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                            <Volume2 size={12} className="text-pace-bone animate-pulse" />
                            <span className="text-[9px] font-semibold text-pace-pearl uppercase tracking-wider">Aadhi voice note</span>
                          </div>
                        </div>

                        <p className="text-xs text-pace-smoke leading-relaxed pl-1">
                          "A voice note that starts as gossip and ends as a life advice conversation at 1:08 AM."
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 6: POETIC AI RECAP */}
                  {currentScene.id === 6 && (
                    <motion.div
                      key="phone-recap"
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between"
                    >
                      <div className="mt-6">
                        <div className="flex items-center gap-2">
                          <ChevronLeft size={16} className="text-pace-smoke" />
                          <span className="text-[9px] uppercase tracking-wider text-pace-smoke font-bold">era summation</span>
                        </div>

                        {/* Gold gradient AI Card */}
                        <div className="mt-6 rounded-[24px] border border-pace-pearl/10 bg-gradient-to-br from-white/5 to-[#1c1a18] p-5 text-left relative overflow-hidden shadow-glow">
                          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#8f6b67]/15 blur-xl" />
                          
                          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] text-[#d2c5b1] font-semibold">
                            <Bot size={13} className="text-pace-bone" />
                            ai-generated recap
                          </div>

                          {/* Shimmering Poetic text */}
                          <motion.p 
                            className="mt-4 text-sm font-semibold leading-relaxed text-pace-pearl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                          >
                            "Chennai Nights felt chaotic, loud, and unforgettable. The Marina sunset was quieter than your bad karaoke, and the midnight chai breaks cemented the era as a core memory."
                          </motion.p>

                          <div className="mt-6 grid grid-cols-2 gap-2 text-center text-[9px] text-pace-bone">
                            <span className="rounded-xl bg-white/[0.04] py-2 border border-white/5">late-night mood</span>
                            <span className="rounded-xl bg-white/[0.04] py-2 border border-white/5">4 friends</span>
                          </div>
                        </div>
                      </div>

                      <div className="pb-2 text-center text-[10px] text-pace-smoke font-medium">
                        Tap any segment to reveal detail
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 7: PROFILE SCENE */}
                  {currentScene.id === 7 && (
                    <motion.div
                      key="phone-profile"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between"
                    >
                      <div className="mt-6 text-left">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-pace-pearl">Settings</h4>
                          <span className="text-[8px] uppercase tracking-wider text-pace-smoke bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">active guest</span>
                        </div>

                        {/* Profile header */}
                        <div className="mt-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pace-moss to-pace-wine flex items-center justify-center font-bold text-lg text-pace-pearl border border-white/10">
                            ME
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-pace-pearl">Habib</h5>
                            <p className="text-[10px] text-pace-smoke">friendship curator since 2026</p>
                          </div>
                        </div>

                        {/* Highlight metric cards (No social counts) */}
                        <div className="mt-8 space-y-3">
                          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex justify-between items-center">
                            <span className="text-xs text-pace-bone">Paces Shared</span>
                            <span className="text-xs font-bold text-pace-pearl">6 Eras</span>
                          </div>
                          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex justify-between items-center">
                            <span className="text-xs text-pace-bone">Followers</span>
                            <span className="text-xs font-bold text-pace-wine">0 · Not supported</span>
                          </div>
                          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex justify-between items-center">
                            <span className="text-xs text-pace-bone">Public Views</span>
                            <span className="text-xs font-bold text-pace-smoke">0 · Private only</span>
                          </div>
                        </div>

                        <p className="mt-4 text-[10px] text-pace-smoke/70 leading-relaxed pl-1 text-center">
                          Pace has no public profiles, followers, or algorithms. Your data is stored securely and privately.
                        </p>
                      </div>

                      <div className="pb-4 text-center text-xs font-semibold text-pace-wine cursor-pointer">
                        Sign Out
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 8: OUTRO PH LAUNCH */}
                  {currentScene.id === 8 && (
                    <motion.div
                      key="phone-outro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-pace-black via-[#0d0d0c] to-[#161514] p-5 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-pace-pearl flex items-center justify-center text-pace-black shadow-glow">
                          <Moon size={22} className="fill-current text-pace-black" />
                        </div>
                        <h4 className="text-xl font-bold mt-4 tracking-tight">Pace Social</h4>
                        <p className="text-[9px] text-pace-bone tracking-widest uppercase mt-1">private rooms for eras</p>

                        <div className="mt-8 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl px-4 py-2 border border-red-500/20 shadow-lg flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform duration-200">
                          <span className="text-[10px] text-white uppercase font-bold tracking-wider">Product Hunt</span>
                          <span className="text-xs text-white font-black">#1</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

          </div>

          {/* ============================================================================
              SURROUNDING FLOATING ASSETS (Pop out of Phone Canvas)
              ============================================================================ */}
          
          {/* Floating Polaroid Image (Scene 4 & 5) */}
          <AnimatePresence>
            {(currentScene.id === 4 || currentScene.id === 5) && (
              <motion.div
                initial={{ opacity: 0, x: 220, y: -80, rotate: 12, scale: 0.7 }}
                animate={{ opacity: 1, x: 190, y: -40, rotate: 7, scale: 0.9 }}
                exit={{ opacity: 0, x: 220, y: -80, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute z-30 w-40 rounded-2xl border border-white/10 bg-[#f4eee3] p-2.5 text-pace-black shadow-[0_20px_50px_rgba(0,0,0,0.55)] pointer-events-none"
              >
                <img src={covers[3]} className="w-full aspect-[1/1] rounded-lg object-cover" />
                <div className="pt-2 px-1 text-left">
                  <p className="text-[10px] font-bold leading-tight">Marina beach sunset 🌅</p>
                  <span className="text-[8px] text-pace-smoke block mt-1">April 20 · Noor</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Voice Wave HUD Card (Scene 5) */}
          <AnimatePresence>
            {currentScene.id === 5 && (
              <motion.div
                initial={{ opacity: 0, x: -220, y: 120, rotate: -8 }}
                animate={{ opacity: 1, x: -185, y: 80, rotate: -4 }}
                exit={{ opacity: 0, x: -220, y: 120 }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-[#161514]/90 p-3 text-pace-pearl backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.55)] pointer-events-none text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-pace-pearl flex items-center justify-center text-pace-black">
                    <Volume2 size={10} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold">"Late Night Gossip"</p>
                    <p className="text-[8px] text-pace-smoke">Aadhi voice memo</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating AI Insights Box (Scene 6) */}
          <AnimatePresence>
            {currentScene.id === 6 && (
              <motion.div
                initial={{ opacity: 0, x: 210, y: 80, scale: 0.8 }}
                animate={{ opacity: 1, x: 180, y: 40, scale: 1 }}
                exit={{ opacity: 0, x: 210, y: 80 }}
                transition={{ type: "spring", stiffness: 65, damping: 15 }}
                className="absolute z-30 w-44 rounded-2xl border border-pace-pearl/10 bg-[#1c1a18]/90 p-3.5 text-pace-pearl backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.55)] pointer-events-none text-left"
              >
                <span className="text-[8px] text-[#d2c5b1] uppercase tracking-wider font-bold">era sentiment</span>
                <h5 className="text-xs font-bold mt-1 text-pace-pearl">nostalgic & warm</h5>
                <div className="mt-2 text-[9px] text-pace-smoke leading-relaxed">
                  Most active hours: <span className="text-pace-pearl">10 PM - 2 AM</span>. Primary emoji: <span className="text-pace-pearl">☕</span>.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Private Verification Seal (Scene 7) */}
          <AnimatePresence>
            {currentScene.id === 7 && (
              <motion.div
                initial={{ opacity: 0, x: -210, y: -100, rotate: -10 }}
                animate={{ opacity: 1, x: -180, y: -60, rotate: -5 }}
                exit={{ opacity: 0, x: -210, y: -100 }}
                transition={{ type: "spring", stiffness: 70, damping: 16 }}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-pace-bone backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.55)] pointer-events-none text-left"
              >
                <div className="flex items-center gap-1.5 text-pace-moss">
                  <ShieldCheck size={14} />
                  <span className="text-[9px] uppercase tracking-wider font-bold">End-to-End Crypt</span>
                </div>
                <h5 className="text-xs font-bold mt-1.5 text-pace-pearl">Privacy First</h5>
                <p className="text-[9px] text-pace-smoke mt-1 leading-normal">
                  Your metadata, coordinates, and memories are encrypted. No tracking analytics.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

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
            className="absolute bottom-6 left-6 right-6 z-40 flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#0d0d0c]/80 p-4 backdrop-blur-xl max-w-4xl mx-auto shadow-2xl transition-all duration-300"
          >
            
            {/* Timeline slider row */}
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
                  setIsPlaying(false); // Pause on scrub
                }}
                className="flex-1 accent-pace-pearl h-1 bg-white/15 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-pace-smoke font-mono w-10 text-left">
                {TOTAL_DURATION.toFixed(1)}s
              </span>
            </div>

            {/* Controls panel main content */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
              
              {/* Play / Speed Group */}
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
                  title="Restart Animation"
                >
                  <RotateCcw size={15} />
                </button>

                {/* Speed selector */}
                <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 ml-2">
                  {[0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`px-2 py-1 text-[10px] font-mono rounded-full font-bold transition ${
                        playbackSpeed === s ? "bg-pace-pearl text-pace-black" : "text-pace-bone hover:text-white"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* View options selectors */}
              <div className="flex items-center gap-3">
                
                {/* 3D angle selector */}
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-pace-smoke font-semibold">phone angle</span>
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 text-[10px] font-semibold text-pace-bone">
                    {["flat", "isometric-left", "isometric-right", "extreme"].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setTiltAngle(angle)}
                        className={`px-2 py-1 rounded-full transition capitalize ${
                          tiltAngle === angle ? "bg-pace-pearl text-pace-black" : "hover:text-white"
                        }`}
                      >
                        {angle.replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shadow glow selector */}
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-pace-smoke font-semibold">glow intensity</span>
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 text-[10px] font-semibold text-pace-bone">
                    {["none", "low", "medium", "high"].map((glow) => (
                      <button
                        key={glow}
                        onClick={() => setGlowIntensity(glow)}
                        className={`px-2 py-1 rounded-full transition capitalize ${
                          glowIntensity === glow ? "bg-pace-pearl text-pace-black" : "hover:text-white"
                        }`}
                      >
                        {glow}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Recording helpers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowGrain(!showGrain)}
                  className={`p-2.5 rounded-full border transition ${
                    showGrain ? "border-pace-moss text-pace-moss bg-pace-moss/5" : "border-white/10 text-pace-smoke hover:bg-white/5"
                  }`}
                  title="Toggle Film Grain"
                >
                  <Monitor size={15} />
                </button>

                <button
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-2.5 rounded-full border transition ${
                    showGuide ? "border-pace-wine text-pace-wine bg-pace-wine/5" : "border-white/10 text-pace-smoke hover:bg-white/5"
                  }`}
                  title="Recording Guide"
                >
                  <HelpCircle size={15} />
                </button>

                <button
                  onClick={triggerCaptureStart}
                  className="flex items-center gap-1.5 rounded-full bg-pace-wine text-pace-pearl px-4 py-2 text-xs font-semibold shadow-glow hover:scale-102 active:scale-98 transition"
                >
                  <Video size={14} className="animate-pulse" />
                  Start Capture
                </button>
              </div>

            </div>

            {/* Scene jumpers cards */}
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
                    <p className="text-[10px] font-semibold mt-0.5 truncate">{scene.label}</p>
                  </button>
                );
              })}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Mode Overlay / Esc instructions */}
      {capturingMode && (
        <div className="absolute top-6 left-6 z-40 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/80 px-4 py-2 text-xs font-semibold text-red-200 backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          <span>RECORDING LIVE CAPTURE STAGE · Press ESC to show HUD dashboard</span>
        </div>
      )}

      {/* Countdown modal overlay */}
      <AnimatePresence>
        {captureCountdown > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-center text-pace-pearl"
          >
            <motion.span 
              key={captureCountdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-8xl font-bold font-display text-pace-wine"
            >
              {captureCountdown}
            </motion.span>
            <p className="mt-4 text-xs tracking-widest text-pace-smoke uppercase font-semibold">
              Preparing capture stage. Press F11 for full screen now.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Info Modal Dialog overlay */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGuide(false)}
            className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-3xl border border-white/10 bg-[#0d0d0c] p-6 max-w-md text-left text-pace-pearl shadow-2xl relative overflow-hidden"
            >
              <h4 className="text-lg font-bold flex items-center gap-2">
                <Video size={18} className="text-pace-wine" />
                OBS Studio Screen Capture Guide
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

      {/* Hidden toggle HUD trigger when in clean capture mode */}
      {!showHUD && !capturingMode && (
        <button
          onClick={() => setShowHUD(true)}
          className="absolute bottom-6 right-6 z-40 p-3 rounded-full border border-white/10 bg-[#0d0d0c]/70 text-pace-bone hover:bg-black/90 active:scale-95 transition shadow-lg"
          title="Show HUD controls"
        >
          <Eye size={15} />
        </button>
      )}

    </div>
  );
}
