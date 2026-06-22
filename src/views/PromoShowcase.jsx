import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Layers, User, Bot, Volume2, Lock,
  ChevronLeft, HelpCircle, Eye, Video, Monitor, ShieldCheck, Check, Info,
  X, Compass, Moon, Camera, Link2, UserPlus, Archive, Heart, Zap,
  ChevronDown, ChevronUp
} from "lucide-react";

// ============================================================================
// TIMELINE — v2 · 13 SCENES · 60 SECONDS
// ============================================================================
const SCENES = [
  { id: 0,  name: "Scene 0: Cold Open",      start: 0,    end: 3,    label: "Pattern Interrupt" },
  { id: 1,  name: "Scene 1: Brand Reveal",   start: 3,    end: 7,    label: "Logo Reveal"       },
  { id: 2,  name: "Scene 2: Invite Flow",    start: 7,    end: 11,   label: "Private Link"      },
  { id: 3,  name: "Scene 3: Auth OTP",       start: 11,   end: 14,   label: "OTP Entry"         },
  { id: 4,  name: "Scene 4: Library of Eras",start: 14,   end: 18.5, label: "Home Dashboard"    },
  { id: 5,  name: "Scene 5: Capture & Drop", start: 18.5, end: 23,   label: "Camera Shutter"    },
  { id: 6,  name: "Scene 6: Pulse Drop",     start: 23,   end: 28,   label: "Daily Mood"        },
  { id: 7,  name: "Scene 7: Voice Memory",   start: 28,   end: 32,   label: "Interactive Audio" },
  { id: 8,  name: "Scene 8: AI Recap",       start: 32,   end: 37,   label: "Nostalgic Recap"   },
  { id: 9,  name: "Scene 9: Capsule Lock",   start: 37,   end: 41,   label: "Era Sealed"        },
  { id: 10, name: "Scene 10: Zero Metrics",  start: 41,   end: 44.5, label: "Zero Pressure"     },
  { id: 11, name: "Scene 11: Social Proof",  start: 44.5, end: 48.5, label: "2,847 Eras"        },
  { id: 12, name: "Scene 12: PH Outro",      start: 48.5, end: 60,   label: "Launch"            },
];
const TOTAL_DURATION = 60.0;

const audioWaves = [
  {id:1,height:18,delay:0.10},{id:2,height:26,delay:0.15},{id:3,height:38,delay:0.20},
  {id:4,height:48,delay:0.25},{id:5,height:34,delay:0.30},{id:6,height:22,delay:0.35},
  {id:7,height:30,delay:0.40},{id:8,height:44,delay:0.45},{id:9,height:56,delay:0.50},
  {id:10,height:60,delay:0.55},{id:11,height:48,delay:0.60},{id:12,height:32,delay:0.65},
  {id:13,height:20,delay:0.70},{id:14,height:28,delay:0.75},{id:15,height:42,delay:0.80},
  {id:16,height:52,delay:0.85},{id:17,height:58,delay:0.90},{id:18,height:46,delay:0.95},
  {id:19,height:30,delay:1.00},{id:20,height:24,delay:1.05},{id:21,height:38,delay:1.10},
  {id:22,height:48,delay:1.15},{id:23,height:54,delay:1.20},{id:24,height:40,delay:1.25},
  {id:25,height:26,delay:1.30},{id:26,height:18,delay:1.35},{id:27,height:12,delay:1.40},
  {id:28,height:8, delay:1.45},
];

const PULSE_EMOJIS = [
  {emoji:"🔥",label:"on fire"},{emoji:"🥹",label:"emotional"},{emoji:"⚡",label:"electric"},
  {emoji:"🌙",label:"low key"},{emoji:"💫",label:"dreamy"},{emoji:"😶‍🌫️",label:"zoning"},
  {emoji:"🫂",label:"need a hug"},{emoji:"🌊",label:"flowing"},{emoji:"💀",label:"gone"},
  {emoji:"✨",label:"glowing"},{emoji:"😴",label:"exhausted"},{emoji:"🤯",label:"overwhelmed"},
];

const FRIEND_PULSES = [
  {name:"Riya",  initial:"R",  emoji:"🥹",color:"#8f6b67"},
  {name:"Arjun", initial:"A",  emoji:"⚡",color:"#7d8577"},
  {name:"Aadhi", initial:"Ad", emoji:"🌙",color:"#cfc6ba"},
];

export default function PromoShowcase() {
  const [currentTime,     setCurrentTime]     = useState(0);
  const [isPlaying,       setIsPlaying]       = useState(true);
  const [playbackSpeed,   setPlaybackSpeed]   = useState(1);
  const [showGrain,       setShowGrain]       = useState(true);
  const [showHUD,         setShowHUD]         = useState(true);
  const [capturingMode,   setCapturingMode]   = useState(false);
  const [captureCountdown,setCaptureCountdown]= useState(0);
  const [showGuide,       setShowGuide]       = useState(false);
  const [isHUDMinimized,  setIsHUDMinimized]  = useState(false);
  const timerRef    = useRef(null);
  const lastTickRef = useRef(null);

  const currentScene = useMemo(() =>
    SCENES.find(s => currentTime >= s.start && currentTime < s.end) || SCENES[SCENES.length - 1],
  [currentTime]);

  // RAF timer loop
  useEffect(() => {
    if (!isPlaying) { if (timerRef.current) cancelAnimationFrame(timerRef.current); lastTickRef.current = null; return; }
    const tick = (ts) => {
      if (!lastTickRef.current) { lastTickRef.current = ts; timerRef.current = requestAnimationFrame(tick); return; }
      const dt = (ts - lastTickRef.current) / 1000;
      lastTickRef.current = ts;
      setCurrentTime(p => { const n = p + dt * playbackSpeed; return n >= TOTAL_DURATION ? 0 : n; });
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
    return () => { if (timerRef.current) cancelAnimationFrame(timerRef.current); };
  }, [isPlaying, playbackSpeed]);

  // Capture countdown
  const triggerCaptureStart = () => { setCaptureCountdown(3); setShowGuide(false); };
  useEffect(() => {
    if (captureCountdown <= 0) return;
    const t = setTimeout(() => setCaptureCountdown(p => { const n=p-1; if(n===0){setCurrentTime(0);setIsPlaying(true);setShowHUD(false);setCapturingMode(true);} return n; }), 1000);
    return () => clearTimeout(t);
  }, [captureCountdown]);
  useEffect(() => {
    const h = (e) => { if(e.key==="Escape"){setCapturingMode(false);setShowHUD(true);} };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const jumpToScene = (s) => { setCurrentTime(s.start); setIsPlaying(true); };

  // ============================================================================
  // COMPUTED HELPERS
  // ============================================================================
  const getCameraStyles = () => {
    const t = currentTime;
    const hidden = { transform:"translate3d(0,100px,-400px) rotateX(30deg) rotateY(-20deg)", opacity:0, transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 7 || (t >= 7 && t < 11) || t >= 44.5) return hidden;
    if (t < 14)   return { transform:"translate3d(0,-10px,120px) rotateX(0deg) rotateY(0deg)",            opacity:1, transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 18.5) return { transform:"translate3d(60px,0,-20px) rotateX(18deg) rotateY(-18deg) rotateZ(8deg)", opacity:1, transition:"all 1.5s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 23)   return { transform:"translate3d(0,15px,30px) rotateX(10deg) rotateY(-8deg) rotateZ(3deg)",   opacity:1, transition:"all 1.3s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 28)   return { transform:"translate3d(-40px,-5px,80px) rotateX(12deg) rotateY(12deg) rotateZ(-4deg)",opacity:1, transition:"all 1.3s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 32)   return { transform:"translate3d(-60px,-15px,110px) rotateX(16deg) rotateY(16deg) rotateZ(-6deg)",opacity:1,transition:"all 1.3s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 37)   return { transform:"translate3d(50px,-45px,130px) rotateX(14deg) rotateY(-14deg) rotateZ(6deg)",opacity:1,transition:"all 1.4s cubic-bezier(0.16,1,0.3,1)" };
    if (t < 41)   {
      if (t - 37 >= 1.8) return hidden;
      return { transform:"translate3d(0,0,90px) rotateX(0deg) rotateY(0deg)",                  opacity:1, transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)" };
    }
    if (t < 44.5) return { transform:"translate3d(0,0,70px) rotateX(0deg) rotateY(0deg)",                  opacity:1, transition:"all 1.2s cubic-bezier(0.16,1,0.3,1)" };
    return hidden;
  };

  const getOTP       = () => { const t=currentTime-11; if(t<0.8)return["","","",""]; if(t<1.6)return["8","","",""]; if(t<2.3)return["8","3","",""]; if(t<3.0)return["8","3","2",""]; return["8","3","2","1"]; };
  const getKeypad    = () => { const t=currentTime-11; if(t>=0.6&&t<0.9)return 8; if(t>=1.4&&t<1.7)return 3; if(t>=2.1&&t<2.4)return 2; if(t>=2.8&&t<3.1)return 1; return null; };
  const getRecapText = () => { const t=currentTime-32; const full="Kyoto in the Rain felt nostalgic and deep. The rainy day in Kyoto brought everyone together, and the midnight talks cemented the era as a core memory."; if(t<=0.5)return""; return full.slice(0,Math.floor((t-0.5)*35)); };

  // Scene-specific timing
  const coldT    = currentTime;
  const coldFlash= Math.min(Math.floor(coldT/0.35), 3);
  const coldSil  = coldT >= 1.5 && coldT < 2.0;
  const coldTag  = coldT >= 2.0;

  const inviteT  = currentTime - 7;
  const showArc  = inviteT >= 1.0;
  const showRcvd = inviteT >= 2.0;

  const pulseT   = currentTime - 23;
  const pulseSel = pulseT >= 0.8;
  const pulseDrp = pulseT >= 2.2;
  const pulseRev = pulseT < 3.0 ? 0 : pulseT < 3.5 ? 1 : pulseT < 4.0 ? 2 : 3;

  const lockT    = currentTime - 37;
  const lockConf = lockT >= 0.6;
  const lockSeal = lockT >= 1.3;
  const lockCap  = lockT >= 1.8;

  const sc = currentScene.id;
  const proofT   = currentTime - 44.5;
  const proofCnt = proofT < 0.5 ? 0 : Math.min(Math.floor(((proofT-0.5)/2.0)*2847), 2847);

  const relativeT4 = currentTime - 14.0;
  const isClickingKyotoCardS4 = sc === 4 && relativeT4 >= 2.6 && relativeT4 < 2.8;
  const isClickingCameraFAB = sc === 4 && relativeT4 >= 4.0 && relativeT4 < 4.2;

  const scrollYS4 = useMemo(() => {
    if (sc !== 4) return 0;
    const rt = currentTime - 14.0;
    if (rt < 3.4) return 0;
    const progress = Math.min(1, (rt - 3.4) / 0.6);
    return progress * -60;
  }, [currentTime, sc]);

  const relativeT5 = currentTime - 18.5;
  const isClickingShutterS5 = sc === 5 && relativeT5 >= 1.3 && relativeT5 < 1.6;

  const timelineT = currentTime - 18.5;
  const scrollT = timelineT < 3.2 ? 0 : Math.min(1, (timelineT - 3.2) / 1.1);
  const scrollY = scrollT * -105;

  const relativeT6 = currentTime - 23.0;
  const isClickingDropButtonS6 = sc === 6 && relativeT6 >= 1.6 && relativeT6 < 1.9;

  const cursorState = useMemo(() => {
    const t = currentTime;
    if (sc === 4) {
      const rt = t - 14.0;
      if (rt >= 2.6 && rt < 2.9) {
        return { x: 150, y: 155, opacity: 1, isClicking: true };
      }
      if (rt >= 4.0 && rt < 4.3) {
        return { x: 260, y: 510, opacity: 1, isClicking: true };
      }
    }
    if (sc === 5) {
      const rt = t - 18.5;
      if (rt >= 0.5 && rt < 0.8) {
        return { x: 65, y: 475, opacity: 1, isClicking: true };
      }
      if (rt >= 1.3 && rt < 1.6) {
        return { x: 150, y: 530, opacity: 1, isClicking: true };
      }
    }
    if (sc === 6) {
      const rt = t - 23.0;
      if (rt >= 0.7 && rt < 1.0) {
        return { x: 245, y: 195, opacity: 1, isClicking: true };
      }
      if (rt >= 1.6 && rt < 1.9) {
        return { x: 150, y: 350, opacity: 1, isClicking: true };
      }
    }
    return { x: 150, y: 300, opacity: 0, isClicking: false };
  }, [currentTime, sc]);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#080807] font-sans select-none text-pace-pearl">
      {showGrain && <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.08]" />}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#080807_100%)] opacity-90 pointer-events-none" />

      {/* Color orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute h-[500px] w-[500px] rounded-full blur-[140px] opacity-15"
          animate={{ x: sc===6?150:-50, y: sc===9?-150:100, background: sc===6?"#cfc6ba":"#8f6b67" }}
          transition={{ duration:3, ease:"easeInOut" }} />
        <motion.div className="absolute h-[600px] w-[600px] rounded-full blur-[160px] opacity-10 right-0 bottom-0"
          animate={{ x: sc===2?100:-100, y: sc===8?-50:200, background: sc===8?"#cfc6ba":"#7d8577" }}
          transition={{ duration:3, ease:"easeInOut" }} />
      </div>

      {/* ====================================================================
          SCENE 0 · COLD OPEN
      ==================================================================== */}
      <AnimatePresence>
        {sc === 0 && (
          <motion.div key="s0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.1}}
            className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden">
            {!coldSil && !coldTag && (
              <AnimatePresence mode="wait">
                {coldFlash === 0 && (
                  <motion.div key="f0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.08}}
                    className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-4">
                    <div className="grid grid-cols-3 gap-[2px] w-[260px]">
                      {[...Array(9)].map((_,i) => (
                        <div key={i} className="aspect-square" style={{background:`hsl(${i*40},55%,72%)`}} />
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm font-semibold tracking-wide">128,492 followers</p>
                  </motion.div>
                )}
                {coldFlash === 1 && (
                  <motion.div key="f1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.08}}
                    className="absolute inset-0 bg-black flex items-center justify-center">
                    <div className="w-[190px] h-[290px] bg-gray-900 rounded-xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
                      <div className="absolute bottom-4 left-4">
                        <p className="text-white text-xs font-bold">@trending_now</p>
                        <p className="text-white/60 text-[10px] mt-1">#fyp #viral</p>
                      </div>
                      <div className="absolute right-3 bottom-16 flex flex-col items-center gap-1">
                        <Heart size={20} className="text-white fill-white" />
                        <span className="text-white text-[9px]">2.4M</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                {coldFlash === 2 && (
                  <motion.div key="f2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.08}}
                    className="absolute inset-0 bg-[#1a1a2e] flex flex-col items-center justify-center">
                    <p className="text-white/40 text-xs tracking-widest uppercase">Followers</p>
                    <p className="text-white text-7xl font-black mt-2 tabular-nums">1,247,839</p>
                    <div className="mt-3 flex items-center gap-1 text-green-400 text-xs">
                      <Zap size={12} /><span>+12,340 today</span>
                    </div>
                  </motion.div>
                )}
                {coldFlash === 3 && (
                  <motion.div key="f3" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.08}}
                    className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center">
                    <div className="rounded-2xl bg-white/5 border border-white/10 px-8 py-6 flex flex-col items-center gap-3 max-w-xs text-center">
                      <Heart size={30} className="text-red-500 fill-red-500" />
                      <p className="text-white text-sm font-bold">1.2M people liked your post</p>
                      <p className="text-white/40 text-xs">But do any of them actually know you?</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            {coldSil && <div className="absolute inset-0 bg-[#080807]" />}
            {coldTag && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.6}}
                className="absolute inset-0 bg-[#080807] flex flex-col items-center justify-center px-12 text-center">
                <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.1}}
                  className="text-3xl font-display font-medium text-pace-pearl leading-tight italic">
                  "What if you stopped performing...
                </motion.p>
                <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.5}}
                  className="text-3xl font-display font-medium text-pace-wine leading-tight italic mt-2">
                  and started remembering?"
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SCENE 1 · BRAND REVEAL
      ==================================================================== */}
      <AnimatePresence>
        {sc === 1 && (
          <motion.div key="s1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.8}}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center bg-[#080807] pointer-events-none px-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#cfc6ba]/5 to-[#8f6b67]/10 blur-3xl opacity-80" />
            <div className="relative flex flex-col items-center">
              <div className="absolute -inset-10 rounded-full border border-white/5 scale-90 animate-ping opacity-25" style={{animationDuration:"3s"}} />
              <div className="absolute -inset-6 rounded-full border border-white/10 opacity-30 animate-pulse" />
              <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:1.2,ease:"easeOut"}}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-pace-pearl via-pace-bone to-[#ebdcb9] flex items-center justify-center shadow-glow z-10">
                <Moon size={32} className="text-pace-black fill-current" />
              </motion.div>
              <motion.h1 initial={{letterSpacing:"0.1em",opacity:0}} animate={{letterSpacing:"0.55em",opacity:1}}
                transition={{duration:2.2,ease:[0.16,1,0.3,1],delay:0.4}}
                className="mt-8 text-6xl font-semibold uppercase font-display text-pace-pearl drop-shadow-2xl leading-none pl-6 select-none">
                Pace
              </motion.h1>
              <motion.p initial={{opacity:0,y:15}} animate={{opacity:0.8,y:0}} transition={{duration:1,delay:1.4}}
                className="mt-6 text-sm text-pace-bone font-medium tracking-[0.18em]">
                Private rooms for your friendship eras.
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SCENE 2 · INVITE FLOW
      ==================================================================== */}
      <AnimatePresence>
        {sc === 2 && (
          <motion.div key="s2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.7}}
            className="absolute inset-0 z-30 flex items-center justify-center bg-[#080807] pointer-events-none">
            {/* Left HUD */}
            <motion.div initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:0.7}}
              className="absolute left-[6%] flex flex-col items-start max-w-xs space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Link2 size={12}/> Private invite</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Only friends<br/><span className="text-pace-wine italic font-medium">get in.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">One private link. No strangers. No public profiles. Your space is yours to share exactly as you choose.</p>
            </motion.div>

            {/* Two phones */}
            <div className="flex items-center gap-28 relative">
              {/* LEFT phone — sending */}
              <motion.div initial={{opacity:0,x:-50,rotate:-5}} animate={{opacity:1,x:0,rotate:-3}} transition={{type:"spring",stiffness:60,damping:15}}
                className="relative w-[175px] h-[350px] rounded-[34px] bg-[#0c0c0b] border-[7px] border-[#181816] shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[52px] h-[15px] bg-[#181816] rounded-full z-50" />
                <div className="bg-[#080807] w-full h-full p-3 pt-5 flex flex-col text-left">
                  <ChevronLeft size={10} className="text-pace-smoke mt-1" />
                  <p className="mt-2 text-[8px] uppercase tracking-wider text-pace-smoke font-bold">kyoto in the rain</p>
                  <h4 className="text-[11px] font-bold text-pace-pearl mt-0.5">Invite someone</h4>
                  <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
                    className="mt-3 rounded-xl border border-[#cfc6ba]/20 bg-[#cfc6ba]/5 p-2.5 relative overflow-hidden">
                    <motion.div animate={{x:["-100%","200%"]}} transition={{duration:2,repeat:Infinity,repeatDelay:1,ease:"easeInOut"}}
                      className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    <p className="text-[7px] font-bold text-pace-smoke uppercase tracking-wider">Private link</p>
                    <p className="text-[9px] font-mono text-pace-pearl mt-0.5 truncate">pace.app/join/kyoto-k2x9</p>
                  </motion.div>
                  <motion.div animate={inviteT>=0.5?{scale:[1,0.95,1]}:{}} transition={{duration:0.4}}
                    className="mt-2.5 rounded-xl bg-pace-pearl flex items-center justify-center py-2 gap-1">
                    <UserPlus size={9} className="text-pace-black"/><span className="text-[8px] font-bold text-pace-black">Send Invite</span>
                  </motion.div>
                  <AnimatePresence>
                    {inviteT >= 0.8 && (
                      <motion.div initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
                        className="mt-2 flex items-center gap-1 text-pace-moss text-[8px] font-semibold justify-center">
                        <Check size={9} strokeWidth={3}/><span>Link sent!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Arc connector */}
              <AnimatePresence>
                {showArc && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                    className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-1" style={{width:80}}>
                    <svg viewBox="0 0 80 36" width="80" height="36">
                      <motion.path d="M 0 18 Q 40 2 80 18" fill="none" stroke="rgba(210,197,177,0.35)" strokeWidth="1.5"
                        strokeDasharray="90" initial={{strokeDashoffset:90}} animate={{strokeDashoffset:0}} transition={{duration:0.9,ease:"easeInOut"}} />
                      <motion.circle cx="80" cy="18" r="3" fill="#cfc6ba" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.85}} />
                    </svg>
                    <p className="text-[7px] text-pace-smoke font-bold uppercase tracking-wider text-center">private bridge</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* RIGHT phone — receiving */}
              <motion.div initial={{opacity:0,x:50,rotate:5}} animate={{opacity:showRcvd?1:0.25,x:0,rotate:3}} transition={{type:"spring",stiffness:60,damping:15}}
                className="relative w-[175px] h-[350px] rounded-[34px] bg-[#0c0c0b] border-[7px] border-[#181816] shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[52px] h-[15px] bg-[#181816] rounded-full z-50" />
                <div className="bg-[#080807] w-full h-full p-3 pt-5 flex flex-col text-left">
                  {showRcvd ? (
                    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} transition={{duration:0.5}} className="flex flex-col h-full">
                      <div className="absolute inset-0 bg-[#8f6b67]/4 pointer-events-none" />
                      <div className="flex items-center gap-1.5 text-[7.5px] text-pace-smoke font-bold uppercase tracking-wider mt-1">
                        <Moon size={8} className="text-pace-bone" /> pace
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                        <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#8f6b67]/30 to-[#7d8577]/20 border border-white/10 flex items-center justify-center mb-2">
                          <span className="text-xl">🌧️</span>
                        </div>
                        <p className="text-[7.5px] text-pace-smoke font-bold uppercase tracking-wider">You're invited to</p>
                        <h4 className="text-[11px] font-bold text-pace-pearl mt-0.5 leading-tight">Kyoto in the Rain</h4>
                        <p className="text-[7.5px] text-pace-bone/60 mt-1">by Aarav · 3 members</p>
                        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.4,type:"spring"}}
                          className="mt-3 w-full rounded-xl bg-pace-pearl flex items-center justify-center py-2">
                          <span className="text-[9px] font-bold text-pace-black">Join this era →</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <Lock size={20} className="text-pace-smoke" />
                      <p className="text-[8px] text-pace-smoke mt-2 text-center">Waiting for invite...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SCENE 9 · CAPSULE LOCK CAPTION (overlays phone)
      ==================================================================== */}
      <AnimatePresence>
        {sc === 9 && lockCap && (
          <motion.div key="lock-cap" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.8}}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#080807] pointer-events-none">
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.6}}
              className="text-2xl font-display font-medium text-pace-pearl text-center leading-tight italic px-16">
              "Some eras are meant to end."
            </motion.p>
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.8,duration:0.6}}
              className="mt-4 text-sm text-pace-bone/70 text-center">
              Pace makes sure they're never forgotten.
            </motion.p>
            <motion.div initial={{scaleX:0,opacity:0}} animate={{scaleX:1,opacity:1}} transition={{delay:1.4,duration:0.5}}
              className="mt-6 h-px w-32 bg-pace-bone/20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SCENE 11 · SOCIAL PROOF MOSAIC
      ==================================================================== */}
      <AnimatePresence>
        {sc === 11 && (
          <motion.div key="s11" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.8}}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#080807] pointer-events-none px-6">
            <div className="flex items-end justify-center gap-5">
              {[
                {
                  title: "Graduation Week 🎓",
                  members: "6 members",
                  count: "42 memories",
                  img: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=300&q=60",
                  img2: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=150&q=60",
                  mood: "euphoric",
                  moodColor: "text-pace-wine",
                  avatars: [
                    { initial: "R", bg: "bg-[#8f6b67]" },
                    { initial: "A", bg: "bg-[#7d8577]" },
                    { initial: "N", bg: "bg-[#cfc6ba]" }
                  ],
                  plusCount: "+3",
                  rot: -6,
                  y: 20,
                  delay: 0
                },
                {
                  title: "Goa 2026 🌊",
                  members: "4 members",
                  count: "89 memories",
                  img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=60",
                  img2: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=150&q=60",
                  mood: "wild",
                  moodColor: "text-[#ff7954]",
                  avatars: [
                    { initial: "Ar", bg: "bg-[#7d8577]" },
                    { initial: "K", bg: "bg-[#8f6b67]" },
                    { initial: "M", bg: "bg-[#cfc6ba]" }
                  ],
                  plusCount: "+1",
                  rot: 0,
                  y: 0,
                  delay: 0.15
                },
                {
                  title: "3am Philosophy ☁️",
                  members: "2 members",
                  count: "17 memories",
                  img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=300&q=60",
                  img2: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=150&q=60",
                  mood: "nostalgic",
                  moodColor: "text-[#ebdcb9]",
                  avatars: [
                    { initial: "Ad", bg: "bg-[#cfc6ba]" },
                    { initial: "Me", bg: "bg-[#8f6b67]" }
                  ],
                  plusCount: null,
                  rot: 6,
                  y: 20,
                  delay: 0.3
                }
              ].map((p,i) => (
                <motion.div key={i} initial={{opacity:0,y:60,rotate:p.rot}} animate={{opacity:1,y:p.y,rotate:p.rot}}
                  transition={{type:"spring",stiffness:60,damping:15,delay:p.delay}}
                  className="w-[145px] h-[270px] rounded-[30px] bg-[#0c0c0b] border-[6px] border-[#181816] shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden relative">
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[48px] h-[13px] bg-[#181816] rounded-full z-50" />
                  <div className="bg-[#080807] w-full h-full p-2.5 pt-5 flex flex-col">
                    <div className="rounded-xl overflow-hidden aspect-[3/2] relative mb-1.5">
                      <img src={p.img} className="w-full h-full object-cover opacity-85" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                    <div className="mt-1 flex-1">
                      <span className={`text-[6.5px] uppercase tracking-wider font-bold ${p.moodColor}`}>{p.mood}</span>
                      <h5 className="text-[9.5px] font-bold text-pace-pearl mt-0.5 leading-tight">{p.title}</h5>
                      
                      {/* Avatars row */}
                      <div className="flex items-center -space-x-1 mt-1.5">
                        {p.avatars.map((av, idx) => (
                          <div key={idx} className={`w-3.5 h-3.5 rounded-full ${av.bg} border border-[#080807] flex items-center justify-center text-[5px] font-black text-pace-black`}>
                            {av.initial}
                          </div>
                        ))}
                        {p.plusCount && (
                          <div className="w-3.5 h-3.5 rounded-full bg-[#1e1d1c] border border-white/10 flex items-center justify-center text-[4px] font-black text-pace-bone">
                            {p.plusCount}
                          </div>
                        )}
                        <span className="text-[6.5px] text-pace-bone/50 font-semibold ml-2.5 truncate max-w-[60px]">{p.members}</span>
                      </div>

                      {/* Mini memories thumbnail gallery */}
                      <div className="mt-2.5">
                        <p className="text-[5.5px] uppercase tracking-wider text-pace-smoke font-bold mb-1">recent memories</p>
                        <div className="flex gap-1">
                          <div className="w-7 h-9 rounded bg-[#161514] border border-white/5 overflow-hidden">
                            <img src={p.img} className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div className="w-7 h-9 rounded bg-[#161514] border border-white/5 overflow-hidden">
                            <img src={p.img2} className="w-full h-full object-cover opacity-60" />
                          </div>
                          <div className="w-7 h-9 rounded bg-white/[0.02] border border-white/5 flex items-center justify-center text-[7px] font-mono text-pace-smoke font-bold">
                            +{(parseInt(p.count) - 2).toString()}
                          </div>
                        </div>
                      </div>

                    </div>
                    <div className="border-t border-white/5 pt-1.5 flex justify-between items-center mt-auto">
                      <span className="text-[7.5px] text-pace-smoke font-bold">{p.count}</span>
                      <Lock size={8} className="text-pace-smoke" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className="mt-10 text-center">
              <p className="text-4xl font-black font-display text-pace-pearl tabular-nums">{proofCnt.toLocaleString()}</p>
              <p className="text-xs text-pace-smoke font-semibold tracking-[0.2em] uppercase mt-1">eras created. counting.</p>
            </motion.div>
            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.0}}
              className="mt-8 text-xl font-display italic text-pace-bone/70">Your era is waiting.</motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          SCENE 12 · PH OUTRO
      ==================================================================== */}
      <AnimatePresence>
        {sc === 12 && (
          <motion.div key="s12" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.9}}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center bg-[#080807]/90 pointer-events-none px-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-[#8f6b67]/8 blur-3xl opacity-60" />
            <div className="relative flex flex-col items-center">
              <motion.div initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:1.2,type:"spring",stiffness:60}}
                className="w-20 h-20 rounded-full bg-pace-pearl flex items-center justify-center shadow-glow border border-white/20">
                <Moon size={38} className="text-pace-black fill-current" />
              </motion.div>
              <motion.h2 initial={{letterSpacing:"0.2em",opacity:0}} animate={{letterSpacing:"0.45em",opacity:1}} transition={{duration:1.6,delay:0.3}}
                className="mt-6 text-4xl font-bold uppercase text-pace-pearl pl-4 font-display">Pace Social</motion.h2>
              <motion.p initial={{opacity:0}} animate={{opacity:0.6}} transition={{duration:0.8,delay:0.8}}
                className="mt-3 text-xs tracking-[0.22em] uppercase text-pace-smoke font-semibold">Private rooms for your friendship eras</motion.p>
              {/* PH badge */}
              <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:1,type:"spring",delay:1.1}}
                className="mt-8 rounded-2xl bg-gradient-to-r from-[#da552f] to-[#ff7954] p-[1.5px] shadow-[0_20px_50px_rgba(218,85,47,0.25)] relative overflow-hidden">
                <div className="rounded-[15px] bg-[#0c0807] px-6 py-4 flex items-center gap-4 border border-white/5 relative overflow-hidden">
                  <motion.div animate={{x:["-100%","200%"]}} transition={{duration:2.2,repeat:Infinity,ease:"easeInOut",repeatDelay:1.5}}
                    className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#da552f] text-white font-extrabold text-2xl">P</div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-widest text-[#ff7954] font-bold">Featured on</p>
                    <p className="text-base font-extrabold text-white leading-none mt-1">Product Hunt</p>
                  </div>
                </div>
              </motion.div>
              {/* Cinematic closing tagline */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:2.0}} className="mt-12 text-center space-y-1">
                <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:2.2}} className="text-base text-pace-pearl font-display italic">"We live life in phases.</motion.p>
                <motion.p initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:3.0}} className="text-base text-pace-bone font-display italic">Hold them privately."</motion.p>
                <motion.p initial={{opacity:0}} animate={{opacity:0.4}} transition={{delay:4.0}} className="text-xs text-pace-smoke tracking-widest uppercase mt-3 font-semibold">— Pace</motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
          MAIN 3D PHONE STAGE (scenes 3–10)
      ==================================================================== */}
      <div className="relative z-10 flex h-full w-full max-w-[1920px] aspect-[16/9] items-center justify-center overflow-hidden px-8">

        {/* Left HUD typography */}
        <div className="absolute left-[7%] z-30 flex max-w-sm flex-col items-start text-left pointer-events-none">
          <AnimatePresence mode="wait">
            {sc===3&&<motion.div key="h3" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} transition={{duration:0.7}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Lock size={12}/> Privacy Sandbox</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Secure,<br/><span className="text-pace-wine italic font-medium">invite-only</span> entrance.</h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">No passwords to leak. A quick verification code connects you and your closest friends safely.</p>
            </motion.div>}
            {sc===4&&<motion.div key="h4" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Layers size={12}/> Custom curation</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">All your phases,<br/><span className="text-pace-moss">held beautifully.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">Trips, semesters, late-night coffee runs. Private folders styled with mood presets.</p>
            </motion.div>}
            {sc===5&&<motion.div key="h5" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Camera size={12}/> Tactile scrapbooks</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Snap & watch<br/><span className="text-pace-bone font-medium">memories drop.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">Your photo. Their photo. Same moment. Different eyes. Both polaroid-dropped onto the timeline.</p>
            </motion.div>}
            {sc===6&&<motion.div key="h6" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><span className="text-base">⚡</span> Daily ritual</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">One emoji.<br/><span className="text-pace-wine italic">Every day.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">Post yours. Unlock everyone else's. The most honest check-in you'll do all day.</p>
            </motion.div>}
            {sc===7&&<motion.div key="h7" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Volume2 size={12}/> Audio memories</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Keep the voice,<br/><span className="text-pace-wine">keep the laugh.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">Voice notes with an interactive pulsing spectrograph that ripples dynamically when played.</p>
            </motion.div>}
            {sc===8&&<motion.div key="h8" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Bot size={12}/> AI recap</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Aesthetic<br/><span className="text-[#d2c5b1] italic">emotional recaps.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">Pace parses your photos, dates, and captions to write poetic summaries of each era.</p>
            </motion.div>}
            {sc===9&&!lockCap&&<motion.div key="h9" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><Archive size={12}/> Memory capsule</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">Seal the era.<br/><span className="text-pace-bone italic font-medium">Keep it forever.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">When it's over, lock the Pace. It becomes a time capsule — sealed, but never lost.</p>
            </motion.div>}
            {sc===10&&<motion.div key="h10" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:30}} className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-pace-smoke uppercase tracking-[0.2em]"><ShieldCheck size={12}/> 100% Private</div>
              <h2 className="text-4xl font-bold leading-tight text-pace-pearl font-display">No public views.<br/><span className="text-pace-moss">No algorithms.</span></h2>
              <p className="text-xs text-pace-bone/70 leading-relaxed">0 followers. 0 likes. Just a quiet shared space for your closest friends.</p>
            </motion.div>}
          </AnimatePresence>
        </div>

        {/* Phone frame */}
        <div className="relative flex items-center justify-center select-none"
          style={{...getCameraStyles(),perspective:1400,marginLeft:"26%",transformStyle:"preserve-3d"}}>

          <div className="absolute rounded-[50px] blur-[40px] pointer-events-none transition-all duration-700"
            style={{width:"310px",height:"630px",background:sc===8?"rgba(210,197,177,0.25)":sc===9?"rgba(143,107,103,0.15)":"rgba(143,107,103,0.18)",transform:"translateY(20px) translateZ(-40px)"}} />

          {/* iPhone shell */}
          <div className="relative w-[320px] h-[645px] rounded-[52px] bg-[#0c0c0b] border-[10px] border-[#181816] shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden select-none border-t-[11px] border-b-[11px]">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[95px] h-[26px] bg-[#181816] rounded-full z-50 flex items-center justify-end px-3 gap-1 shadow-inner pointer-events-none">
              <div className="w-2 h-2 bg-[#090b10] rounded-full border border-neutral-900" />
              <div className="w-1.5 h-1.5 bg-[#030406] rounded-full" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 pointer-events-none z-40" />
            <div className="w-full h-full flex flex-col bg-pace-black relative text-pace-pearl overflow-hidden pt-7">
              {/* Status bar */}
              <div className="px-6 py-1.5 flex justify-between items-center text-[9px] text-pace-smoke font-bold absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#080807] to-transparent pointer-events-none select-none">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span className="text-[8px]">LTE</span>
                  <div className="w-3.5 h-2 bg-pace-smoke/60 rounded-sm flex items-center p-0.5"><div className="h-full w-full bg-pace-pearl rounded-xs"/></div>
                </div>
              </div>

              <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col text-left">
                <AnimatePresence mode="wait">

                  {/* SCREEN 3 · AUTH OTP */}
                  {sc===3&&(
                    <motion.div key="p3" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
                      className="absolute inset-0 flex flex-col justify-between p-5 bg-[#080807] z-10 text-left">
                      <div className="mt-5">
                        <ChevronLeft size={16} className="text-pace-smoke"/>
                        <h3 className="mt-4 text-2xl font-bold text-pace-pearl">Verification code</h3>
                        <p className="mt-1 text-[11px] text-pace-smoke">We sent a 4-digit key to your phone.</p>
                        <div className="mt-6 flex justify-between gap-3 px-2">
                          {getOTP().map((c,i)=>(
                            <div key={i} className={`w-12 h-14 rounded-xl border flex items-center justify-center text-lg font-bold transition-all duration-300 ${c!==""?"border-pace-pearl bg-white/5 shadow-glow":"border-white/10 bg-white/[0.01]"}`}>{c}</div>
                          ))}
                        </div>
                        <div className="mt-8 grid grid-cols-3 gap-2 px-1 text-center font-semibold text-pace-bone text-sm">
                          {[1,2,3,4,5,6,7,8,9].map(n=>{
                            const a=getKeypad()===n;
                            return <motion.div key={n} className="h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                              style={{backgroundColor:a?"rgba(245,241,234,0.15)":"transparent",scale:a?0.92:1,color:a?"#f5f1ea":"#cfc6ba"}}>{n}</motion.div>;
                          })}
                        </div>
                        <AnimatePresence>
                          {currentTime-11>=3.3&&(
                            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                              className="mt-6 flex items-center justify-center gap-2 border border-pace-moss/20 bg-pace-moss/5 rounded-2xl p-2.5 text-pace-moss text-xs font-semibold">
                              <div className="w-4 h-4 rounded-full bg-pace-moss flex items-center justify-center text-pace-black"><Check size={10} strokeWidth={3}/></div>
                              <span>Identity Verified</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 4 · HOME */}
                  {sc===4&&(
                    <motion.div key="p4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 justify-between overflow-hidden">
                      <AnimatePresence mode="wait">
                        {relativeT4 < 3.0 ? (
                          <motion.div key="dashboard" initial={{opacity:1, x: 0}} exit={{opacity:0, x: -180}} transition={{duration:0.35, ease:"easeInOut"}} className="flex-1 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex justify-between items-center mt-5">
                                <div>
                                  <span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">synced privately</span>
                                  <h3 className="text-xl font-bold text-pace-pearl leading-none mt-0.5">Pace</h3>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-pace-bone font-bold text-xs">H</div>
                              </div>
                              <p className="mt-3 text-[11px] text-pace-bone/70">Your active eras, held privately.</p>
                              <div className="mt-4 space-y-3">
                                {[
                                  {id:"kyoto",title:"Kyoto in the Rain 🌧️",mood:"nostalgic",snippet:"rain on temple roofs and vending machine coffee",cover:"https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75",color:"from-[#8f6b67]/25 via-neutral-900/40 to-neutral-950",active:true,badge:3},
                                  {id:"code", title:"Vaporwave Coding 💻",  mood:"chaotic",  snippet:"monitors glowing at 3:14 AM",                       cover:"https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=75",color:"from-purple-950/20 via-neutral-900/40 to-neutral-950",active:false,badge:0},
                                  {id:"chai", title:"Late Night Chai ☕",   mood:"soft",     snippet:"Marina wind and bad karaoke till sunrise",           cover:"https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=400&q=75",color:"from-[#7d8577]/25 via-neutral-900/40 to-neutral-950",active:false,badge:0},
                                ].map((item,idx)=>{
                                  const hov=item.active&&relativeT4>=1.8&&relativeT4<3.0;
                                  const isClicked = item.active && isClickingKyotoCardS4;
                                  return(
                                    <motion.div key={item.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0, scale: isClicked ? 0.96 : hov ? 1.03 : 1}} transition={{delay:idx*0.12}}
                                      className={`rounded-[20px] border p-3 bg-gradient-to-r ${item.color} relative overflow-hidden transition-all duration-300 ${hov?"border-pace-pearl/30 shadow-glow":"border-white/5"}`}>
                                      <div className="absolute right-3.5 top-3 flex flex-col items-end gap-0.5">
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-white/15"><img src={item.cover} className="w-full h-full object-cover"/></div>
                                        {item.badge>0&&<motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:1.5,type:"spring"}} className="w-4 h-4 bg-pace-wine rounded-full flex items-center justify-center text-[6px] font-black text-white">{item.badge}</motion.div>}
                                      </div>
                                      <span className="text-[7.5px] uppercase tracking-wider text-pace-smoke font-bold">{item.mood}</span>
                                      <h4 className="text-xs font-bold text-pace-pearl mt-0.5">{item.title}</h4>
                                      <p className="text-[9.5px] text-pace-bone/80 mt-1 max-w-[170px] truncate">{item.snippet}</p>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="h-12 border-t border-white/5 flex items-center justify-around text-pace-smoke bg-[#080807]/95 absolute bottom-0 left-0 right-0 px-3">
                              <div className="flex flex-col items-center text-pace-pearl"><Layers size={13}/><span className="text-[7.5px] font-bold mt-0.5">Spaces</span></div>
                              <div className="flex flex-col items-center"><Bot size={13}/><span className="text-[7.5px] font-bold mt-0.5">Recaps</span></div>
                              <div className="flex flex-col items-center"><User size={13}/><span className="text-[7.5px] font-bold mt-0.5">Profile</span></div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div key="eraFeed" initial={{opacity:0, x: 180}} animate={{opacity:1, x: 0}} transition={{duration:0.35, ease:"easeInOut"}} className="flex-1 flex flex-col h-full relative">
                            <div className="flex items-center gap-2 mt-5 mb-2">
                              <ChevronLeft size={16} className="text-pace-smoke"/>
                              <div>
                                <span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">private space</span>
                                <h3 className="text-[13px] font-bold text-pace-pearl leading-none mt-0.5">Kyoto in the Rain 🌧️</h3>
                              </div>
                            </div>
                            
                            <div className="flex-1 overflow-hidden mt-1.5 relative">
                              <motion.div animate={{ y: scrollYS4 }} transition={{ type: "tween", ease: "easeInOut" }} className="flex flex-col space-y-3 pb-24">
                                <div className="rounded-2xl border border-white/10 bg-[#ebdcb9] p-2.5 text-pace-black shadow-lg w-[85%] mx-auto">
                                  <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=75" className="w-full aspect-[4/3] rounded-lg object-cover opacity-90"/>
                                  <div className="pt-1.5 px-1">
                                    <p className="text-[10px] font-bold leading-tight">Midnight tea under lanterns.</p>
                                    <span className="text-[7px] text-pace-smoke font-bold block mt-0.5">Riya · 1 day ago</span>
                                  </div>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-[#f4eee3] p-2 text-pace-black shadow-md w-[80%] mx-auto">
                                  <img src="https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=400&q=70" className="w-full aspect-[4/3] rounded-lg object-cover opacity-90"/>
                                  <div className="pt-1 px-1">
                                    <p className="text-[9px] font-bold leading-tight">Rain started pouring down.</p>
                                    <span className="text-[7px] text-pace-smoke font-bold block mt-0.5">Arjun · 2 days ago</span>
                                  </div>
                                </div>
                              </motion.div>
                            </div>

                            <motion.div 
                              animate={{ scale: isClickingCameraFAB ? 0.88 : 1 }}
                              className="absolute right-4 bottom-4 w-11 h-11 bg-pace-wine rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(143,107,103,0.4)] border border-white/10 z-20"
                            >
                              <Camera size={18} className="text-pace-pearl" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* SCREEN 5 · CAMERA */}
                  {sc===5&&(
                    <motion.div key="p5" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-black text-pace-pearl overflow-hidden">
                      <div className="relative flex-1 w-full h-full flex flex-col justify-between p-4 pb-20 pt-6 text-left">
                        <AnimatePresence>
                          {currentTime>=20.5&&currentTime<21.0&&(
                            <motion.div key="flash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}} className="absolute inset-0 bg-white z-50 pointer-events-none"/>
                          )}
                        </AnimatePresence>
                        <div className="flex justify-between items-center text-white/80 text-[9px] uppercase tracking-widest font-bold z-10">
                          <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/5">
                            <Compass size={11} className="animate-spin text-pace-wine" style={{animationDuration:"5s"}}/><span>Kyoto Temple</span>
                          </div>
                          <span className="bg-red-500/25 border border-red-500/25 px-2 py-0.5 rounded-full text-red-200">live</span>
                        </div>
                        <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=75" className="absolute inset-0 w-full h-full object-cover opacity-80"/>
                        <div className="absolute inset-8 border border-white/10 rounded-2xl flex items-center justify-center pointer-events-none">
                          <div className="w-3 h-[1px] bg-white/40 absolute"/><div className="h-3 w-[1px] bg-white/40 absolute"/>
                        </div>
                        {/* Mood strip */}
                        <AnimatePresence>
                          {currentTime<20.5&&(
                            <motion.div key="mood" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}}
                              className="absolute bottom-20 left-4 right-4 z-20 flex items-center gap-2">
                              {["🌧️ nostalgic","✨ glowing","🌊 flowing"].map((m,i)=>(
                                <div key={i} className={`rounded-full px-2.5 py-1 text-[8px] font-bold border whitespace-nowrap ${i===0?"bg-white/15 border-white/30 text-white":"bg-black/30 border-white/10 text-white/60"}`}>{m}</div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <AnimatePresence>
                          {currentTime<20.5&&(
                            <motion.div key="shutter" initial={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
                              className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2 z-20 pointer-events-none">
                              <motion.div animate={isClickingShutterS5 ? {scale: 0.85} : {scale: [1, 1.1, 1]}} transition={isClickingShutterS5 ? {duration: 0.1} : {repeat:Infinity, duration: 1.2}}
                                className="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]"/>
                              </motion.div>
                              <span className="text-[8px] uppercase tracking-wider text-white bg-black/50 px-2 py-0.5 rounded">Capture Memory</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {currentTime>=20.7&&(
                          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}
                            className="absolute inset-0 bg-[#0d0d0c] z-30 flex flex-col p-4 overflow-hidden">
                            <div className="flex items-center gap-2 mb-3"><ChevronLeft size={15}/><span className="text-[8px] uppercase tracking-widest text-pace-smoke font-bold">Timeline</span></div>
                            
                            <motion.div animate={{ y: scrollY }} transition={{ type: "tween", ease: "easeInOut" }} className="flex flex-col space-y-2 mt-2">
                              {/* Polaroid 1 */}
                              <motion.div initial={{y:-300,rotate:-15,scale:0.95}} animate={{y:0,rotate:-1.2,scale:1}} transition={{type:"spring",stiffness:90,damping:13,delay:0.3}}
                                className="rounded-2xl border border-white/15 bg-[#f4eee3] p-2.5 text-pace-black shadow-2xl w-[85%] mx-auto flex-shrink-0">
                                <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75" className="w-full aspect-[4/3] rounded-lg object-cover"/>
                                <div className="pt-2 px-1">
                                  <motion.p className="text-xs font-bold leading-normal" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}}>Kyoto was a dream. The rain felt silent.</motion.p>
                                  <span className="text-[7.5px] text-pace-smoke font-bold block mt-1.5">Me · Just now · Kyoto</span>
                                </div>
                              </motion.div>
                              
                              {/* Polaroid 2 — friend's perspective */}
                              <motion.div initial={{y:-200,rotate:12,scale:0.9,x:40}} animate={{y:-30,rotate:5,scale:0.88,x:20}} transition={{type:"spring",stiffness:80,damping:13,delay:0.8}}
                                className="rounded-2xl border border-white/10 bg-[#f8f4eb] p-2 text-pace-black shadow-xl w-[72%] ml-auto -mt-4 flex-shrink-0">
                                <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=400&q=70" className="w-full aspect-[4/3] rounded-lg object-cover opacity-90"/>
                                <div className="pt-1.5 px-1"><span className="text-[7px] text-pace-smoke font-bold block">Aarav · Same moment</span></div>
                              </motion.div>

                              {/* Polaroid 3 — older memory Kyoto */}
                              <motion.div initial={{opacity:0,y:20,scale:0.8}} animate={scrollT > 0.15 ? {opacity:0.95,y:0,scale:0.85,rotate:-2} : {}} transition={{type:"spring",stiffness:60,damping:12}}
                                className="rounded-2xl border border-white/10 bg-[#ebdcb9] p-2.5 text-pace-black shadow-lg w-[78%] mx-auto -mt-6 flex-shrink-0">
                                <img src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=75" className="w-full aspect-[4/3] rounded-lg object-cover opacity-90"/>
                                <div className="pt-1.5 px-1">
                                  <p className="text-[9px] font-bold">Midnight tea under the lanterns.</p>
                                  <span className="text-[7px] text-pace-smoke font-bold block mt-0.5">Riya · 1 day ago · Kyoto</span>
                                </div>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 6 · PULSE */}
                  {sc===6&&(
                    <motion.div key="p6" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-[#080807] overflow-hidden">
                      <motion.div className="absolute inset-0 pointer-events-none" animate={{opacity:pulseDrp?0.15:0.05}} transition={{duration:0.5}}>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pace-wine blur-3xl"/>
                      </motion.div>
                      {!pulseDrp?(
                        <div className="flex flex-col h-full p-4 text-left">
                          <div className="mt-5">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pace-pearl animate-pulse"/><span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">daily ritual · pulse</span></div>
                            <h3 className="mt-2 text-base font-bold text-pace-pearl">How are you feeling today?</h3>
                            <p className="text-[10px] text-pace-smoke mt-0.5">Pick one emoji. That's it.</p>
                          </div>
                          <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 flex items-start gap-2">
                            <Lock size={11} className="text-pace-smoke mt-0.5 flex-shrink-0"/>
                            <p className="text-[9px] text-pace-smoke leading-relaxed">3 friends have dropped today. Post yours to reveal theirs.</p>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-1.5">
                            {PULSE_EMOJIS.map((item,i)=>{
                              const relativeT6 = currentTime - 23.0;
                              const isClickingThisEmoji = sc === 6 && relativeT6 >= 0.7 && relativeT6 < 0.9 && i === 3;
                              return (
                                <motion.div key={item.emoji} initial={{opacity:0,scale:0.8}} animate={{opacity:1, scale: isClickingThisEmoji ? 0.88 : 1}} transition={{delay:i*0.04}}
                                  className={`rounded-xl border py-2 flex flex-col items-center gap-0.5 ${i===3&&pulseSel?"border-white/30 bg-white/10":"border-white/5 bg-white/[0.03]"}`}>
                                  <span className="text-lg">{item.emoji}</span>
                                  <span className="text-[6px] font-bold text-pace-smoke uppercase">{item.label}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                          <AnimatePresence>
                            {pulseSel&&(
                              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0, scale: isClickingDropButtonS6 ? 0.92 : 1}} transition={{duration:0.15}} className="mt-3 rounded-xl bg-pace-pearl flex items-center justify-center gap-2 py-2.5">
                                <span className="text-lg">🌙</span><span className="text-[11px] font-bold text-pace-black">Drop my pulse</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ):(
                        <div className="flex flex-col h-full p-4 text-left">
                          <div className="mt-5 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pace-pearl animate-pulse"/><span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">daily ritual · pulse</span></div>
                          <div className="flex flex-col items-center mt-4">
                            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:200,damping:15}}
                              className="w-16 h-16 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                              <span className="text-3xl">🌙</span>
                            </motion.div>
                            <p className="text-[9px] text-pace-smoke mt-1.5 font-semibold">Your pulse today</p>
                          </div>
                          <div className="mt-4 border-b border-white/5 pb-2"><p className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">your crew today</p></div>
                          <div className="mt-3 space-y-2">
                            {FRIEND_PULSES.slice(0,pulseRev).map((f)=>(
                              <motion.div key={f.name} initial={{opacity:0,x:-20,rotateY:-90}} animate={{opacity:1,x:0,rotateY:0}} transition={{type:"spring",stiffness:150,damping:20}}
                                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-pace-black text-[8px] font-black" style={{background:f.color}}>{f.initial}</div>
                                  <div><p className="text-[10px] font-bold text-pace-pearl">{f.name}</p><p className="text-[7.5px] text-pace-smoke">just now</p></div>
                                </div>
                                <span className="text-2xl">{f.emoji}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* SCREEN 7 · VOICE */}
                  {sc===7&&(
                    <motion.div key="p7" initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-[#0d0d0c] overflow-hidden">
                      <div className="relative h-36 overflow-hidden flex flex-col justify-end p-4">
                        <img src="https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=400&q=75" className="absolute inset-0 w-full h-full object-cover opacity-60"/>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-[#0d0d0c]"/>
                        <ChevronLeft size={16} className="absolute left-3 top-5 text-pace-pearl"/>
                        <span className="text-[8px] uppercase tracking-wider text-pace-bone font-bold z-10">late-night</span>
                        <h4 className="text-lg font-bold text-pace-pearl mt-0.5 z-10">Late Night Chai</h4>
                      </div>
                      <div className="flex-1 p-4 space-y-4 text-left">
                        <span className="text-[8px] text-pace-smoke uppercase tracking-wider font-bold">playing audio memory</span>
                        <div className="rounded-[22px] border border-white/10 bg-[#161514] p-4 flex flex-col items-center relative overflow-hidden">
                          <div className="flex items-center gap-[2.5px] h-14 w-full justify-center px-1">
                            {audioWaves.map(bar=>(
                              <motion.div key={bar.id} className="w-[3px] rounded-full bg-pace-pearl/45" initial={{height:6}}
                                animate={{height:[6,bar.height,8,bar.height*0.7,6]}} transition={{duration:1.4,delay:bar.delay,repeat:Infinity,ease:"easeInOut"}}/>
                            ))}
                          </div>
                          <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 relative">
                            <span className="absolute -inset-1 rounded-full border border-white/10 scale-95 animate-ping opacity-45" style={{animationDuration:"2s"}}/>
                            <Volume2 size={12} className="text-pace-pearl animate-pulse"/>
                            <span className="text-[9px] font-bold text-pace-pearl uppercase tracking-wider">Aadhi voice memo</span>
                          </div>
                        </div>
                        <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:0.8}}
                          className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                          <p className="text-[11px] text-pace-bone leading-relaxed italic">"Aadhi at 1:08 AM — 'I told you this would become a core memory.'"</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 8 · AI RECAP */}
                  {sc===8&&(
                    <motion.div key="p8" initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5">
                      <div className="mt-5">
                        <div className="flex items-center gap-1"><ChevronLeft size={16} className="text-pace-smoke"/><span className="text-[8px] uppercase tracking-wider text-pace-smoke font-bold">recap summary</span></div>
                        <div className="mt-5 rounded-[24px] border border-[#d2c5b1]/20 bg-gradient-to-br from-white/5 to-[#1c1a18] p-5 text-left relative overflow-hidden shadow-glow">
                          <motion.div animate={{x:["-100%","200%"]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut",repeatDelay:1}}
                            className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[#d2c5b1]/8 to-transparent skew-x-12 pointer-events-none"/>
                          <div className="flex items-center gap-1.5 text-[8.5px] uppercase tracking-[0.2em] text-[#d2c5b1] font-semibold">
                            <Bot size={13} className="text-pace-bone"/> ai-generated recap
                          </div>
                          <p className="mt-4 text-xs font-semibold leading-relaxed text-pace-pearl min-h-[96px] relative">
                            {getRecapText()}
                            <span className="inline-block w-[2px] h-3.5 bg-pace-pearl ml-0.5 translate-y-[2px]" style={{animation:"cursor-blink 0.8s step-end infinite"}}/>
                          </p>
                          <AnimatePresence>
                            {currentTime-32>=3&&(
                              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mt-4 space-y-1.5">
                                <div className="flex justify-between text-[8px] text-pace-smoke"><span>nostalgic</span><span>deep</span></div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <motion.div initial={{width:"0%"}} animate={{width:"78%"}} transition={{duration:1,delay:0.2}}
                                    className="h-full bg-gradient-to-r from-pace-wine to-[#d2c5b1] rounded-full"/>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="mt-5 flex items-center justify-between text-[9px] text-pace-smoke border-t border-white/5 pt-3">
                            <span>Kyoto trip sentiment</span><span className="text-pace-pearl font-bold">nostalgic & deep</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* SCREEN 9 · CAPSULE LOCK */}
                  {sc===9&&(
                    <motion.div key="p9" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 text-left">
                      <div className="mt-5">
                        <Archive size={18} className="text-pace-bone mb-3"/>
                        <h3 className="text-xl font-bold text-pace-pearl leading-tight">Lock this era?</h3>
                        <p className="text-[10px] text-pace-smoke mt-1">Kyoto in the Rain · 3 members · 24 memories</p>
                      </div>
                      <motion.div animate={{borderColor:lockConf?"rgba(210,197,177,0.35)":"rgba(255,255,255,0.05)",boxShadow:lockConf?"0 0 30px rgba(210,197,177,0.08)":"none"}}
                        transition={{duration:0.6}} className="mt-5 rounded-[20px] border p-3 relative overflow-hidden bg-gradient-to-br from-[#8f6b67]/15 to-transparent">
                        <AnimatePresence>
                          {lockSeal&&<motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/50 z-10 rounded-[20px]"/>}
                        </AnimatePresence>
                        <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75" className="w-full aspect-video rounded-xl object-cover"/>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-pace-pearl">Kyoto in the Rain 🌧️</h4>
                            <p className="text-[8px] text-pace-smoke mt-0.5">April 2026 · 3 members</p>
                          </div>
                          <AnimatePresence>
                            {lockSeal&&(
                              <motion.div initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}} transition={{type:"spring",stiffness:200}}
                                className="flex items-center gap-1 text-[#d2c5b1] text-[8.5px] font-bold z-20">
                                <Lock size={10} className="fill-current"/><span>Sealed</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <AnimatePresence>
                          {lockSeal&&(
                            <motion.div initial={{opacity:0,scale:0.8,rotate:-5}} animate={{opacity:0.7,scale:1,rotate:-3}} transition={{delay:0.3,type:"spring"}}
                              className="absolute top-4 right-4 z-20 border border-[#d2c5b1]/30 rounded px-2 py-0.5 text-[7px] font-bold text-[#d2c5b1] uppercase tracking-wider bg-[#080807]/60">
                              Apr 2026
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      <AnimatePresence>
                        {!lockConf&&(
                          <motion.div initial={{opacity:1}} exit={{opacity:0,scale:0.9}} className="mt-5">
                            <motion.div animate={{scale:[1,0.97,1]}} transition={{duration:1.2,repeat:Infinity}}
                              className="w-full rounded-2xl bg-pace-pearl flex items-center justify-center gap-2 py-3">
                              <Lock size={13} className="text-pace-black"/><span className="text-xs font-bold text-pace-black">Lock this era</span>
                            </motion.div>
                            <p className="text-center text-[9px] text-pace-smoke mt-2">Members can still read it after locking.</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* SCREEN 10 · ZERO METRICS */}
                  {sc===10&&(
                    <motion.div key="p10" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                      className="absolute inset-0 flex flex-col bg-[#080807] p-5 text-left">
                      <div className="mt-5">
                        <div className="flex justify-between items-center">
                          <h4 className="text-base font-bold text-pace-pearl">Settings</h4>
                          <span className="rounded-full border border-pace-moss/20 bg-pace-moss/5 px-2 py-0.5 text-[8px] font-bold text-pace-moss">verified private</span>
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pace-moss to-[#8f6b67] flex items-center justify-center font-bold text-sm text-white">MH</div>
                          <div><h5 className="text-xs font-bold text-pace-pearl">Habib</h5><p className="text-[9px] text-pace-smoke">private curator since 2026</p></div>
                        </div>
                        <div className="mt-6 space-y-3">
                          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 flex justify-between items-center">
                            <span className="text-xs text-pace-bone">Paces Shared</span><span className="text-xs font-bold text-pace-pearl">3 spaces</span>
                          </div>
                          {[{label:"Follower Counts",val:"0 · Disabled"},{label:"Public View Metrics",val:"0 · Blocked"},{label:"Algorithm Feed",val:"N/A · None"}].map((item,i)=>(
                            <motion.div key={item.label} initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} transition={{delay:i*0.15}}
                              className="rounded-xl bg-white/[0.03] border border-red-500/10 p-3 flex justify-between items-center">
                              <span className="text-xs text-pace-bone">{item.label}</span>
                              <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs"><X size={12} strokeWidth={2.5}/><span>{item.val}</span></div>
                            </motion.div>
                          ))}
                        </div>
                        <div className="mt-5 border border-white/5 bg-white/[0.01] rounded-xl p-3 flex gap-2">
                          <Info size={14} className="text-pace-smoke flex-shrink-0 mt-0.5"/>
                          <p className="text-[9.5px] text-pace-smoke leading-normal">Pace has no follower hooks, likes, or view counts. A quiet sanctuary for your friendship eras.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
              {/* Simulated touch pointer overlay (Ripples Only) */}
              {cursorState.opacity > 0 && cursorState.isClicking && (
                <motion.div
                  style={{
                    position: "absolute",
                    left: cursorState.x,
                    top: cursorState.y,
                    x: "-50%",
                    y: "-50%",
                    pointerEvents: "none",
                    zIndex: 100,
                  }}
                  className="relative flex items-center justify-center"
                >
                  {/* Outer concentric water ripple */}
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0.9 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute w-10 h-10 rounded-full border border-white/60 bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  />
                  {/* Inner concentric water ripple */}
                  <motion.div
                    initial={{ scale: 0.1, opacity: 0.75 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute w-10 h-10 rounded-full border border-white/35 bg-white/5"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Floating assets */}
          <AnimatePresence>
            {(sc===4||sc===5)&&(
              <motion.div initial={{opacity:0,x:230,y:-70,rotate:15,scale:0.8}} animate={{opacity:1,x:195,y:-25,rotate:7,scale:0.95}} exit={{opacity:0,x:230,y:-70}} transition={{type:"spring",stiffness:60,damping:15}}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-[#f4eee3] p-2.5 text-pace-black shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none">
                <img src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=75" className="w-full aspect-square rounded-lg object-cover"/>
                <div className="pt-2 px-1"><p className="text-[10px] font-bold">Kyoto in the Rain 🌧️</p><span className="text-[7.5px] text-pace-smoke block mt-1 font-bold">April 18 · Aarav</span></div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {sc===6&&pulseDrp&&(
              <motion.div initial={{opacity:0,x:-220,y:-80,scale:0.8}} animate={{opacity:1,x:-190,y:-50,scale:0.95}} exit={{opacity:0,x:-220,y:-80}} transition={{type:"spring",stiffness:60,damping:15}}
                className="absolute z-30 w-48 rounded-2xl border border-white/10 bg-[#161514]/90 p-3.5 text-pace-pearl shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none text-left backdrop-blur-sm">
                <div className="flex items-center gap-1.5 mb-2"><div className="w-2 h-2 rounded-full bg-pace-wine animate-pulse"/><span className="text-[7px] uppercase tracking-wider text-pace-smoke font-bold">today's group pulse</span></div>
                <div className="flex items-center gap-3">
                  {["🌙","🥹","⚡"].map((e,i)=>(
                    <AnimatePresence key={e}>
                      {i<pulseRev+1&&<motion.span initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}} transition={{type:"spring",delay:i*0.15}} className="text-2xl">{e}</motion.span>}
                    </AnimatePresence>
                  ))}
                </div>
                <p className="text-[8.5px] text-pace-bone/60 mt-1.5">4 of 4 crew dropped today</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {sc===7&&(
              <motion.div initial={{opacity:0,x:220,y:-50,rotate:10,scale:0.8}} animate={{opacity:1,x:190,y:-10,rotate:-4,scale:0.95}} exit={{opacity:0,x:220,y:-50}} transition={{type:"spring",stiffness:60,damping:15}}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-[#f4eee3] p-2.5 text-pace-black shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none">
                <img src="https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=400&q=75" className="w-full aspect-square rounded-lg object-cover"/>
                <div className="pt-2 px-1"><p className="text-[10px] font-bold">Late Night Chai ☕</p><span className="text-[7.5px] text-pace-smoke block mt-1 font-bold">May 12 · Aadhi</span></div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {sc===10&&(
              <motion.div initial={{opacity:0,x:-220,y:-110,rotate:-15}} animate={{opacity:1,x:-185,y:-70,rotate:-5}} exit={{opacity:0,x:-220,y:-110}} transition={{type:"spring",stiffness:60,damping:15}}
                className="absolute z-30 w-44 rounded-2xl border border-white/10 bg-white/5 p-3.5 text-pace-bone backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.65)] pointer-events-none text-left">
                <div className="flex items-center gap-1 text-pace-moss"><ShieldCheck size={14}/><span className="text-[8.5px] uppercase tracking-wider font-bold">Encrypted Sandbox</span></div>
                <h5 className="text-xs font-bold mt-1 text-pace-pearl">Zero analytics</h5>
                <p className="text-[9.5px] text-pace-smoke mt-1 leading-normal">Your memories belong only to you and friends. No tracking or ads.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Foreground parallax blurs */}
        <AnimatePresence>
          {(sc===4||sc===5)&&(
            <motion.div initial={{opacity:0,x:-100,y:150,rotate:-12,scale:1.15}} animate={{opacity:0.95,x:-60,y:110,rotate:-6,scale:1.35}} exit={{opacity:0,x:-100,y:150}} transition={{duration:1.8,ease:"easeOut"}}
              className="absolute left-[8%] bottom-[8%] z-50 w-44 rounded-2xl border border-white/5 bg-[#f4eee3]/90 p-2.5 text-pace-black shadow-[0_30px_70px_rgba(0,0,0,0.75)] pointer-events-none filter blur-[2.5px] saturate-[1.15]">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=60" className="w-full aspect-square rounded-lg object-cover"/>
              <div className="pt-2 px-1"><p className="text-[10px] font-bold">Vaporwave coding 💻</p><span className="text-[7.5px] text-pace-smoke block mt-0.5">Kavin</span></div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(sc===7||sc===8)&&(
            <motion.div initial={{opacity:0,x:100,y:180,scale:1.2}} animate={{opacity:0.9,x:60,y:130,scale:1.35}} exit={{opacity:0,x:100,y:180}} transition={{duration:1.8,ease:"easeOut"}}
              className="absolute right-[8%] bottom-[12%] z-50 w-48 rounded-[24px] border border-white/10 bg-[#161514]/90 p-4 text-pace-pearl shadow-[0_30px_70px_rgba(0,0,0,0.75)] pointer-events-none filter blur-[2px] text-left">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-pace-pearl flex items-center justify-center text-pace-black text-[9px] font-black">R</div>
                <div><p className="text-[9.5px] text-pace-smoke">Riya</p><p className="text-xs font-bold text-pace-pearl mt-0.5">"bad karaoke was too good!"</p></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ====================================================================
          HUD
      ==================================================================== */}
      <AnimatePresence>
        {showHUD && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className={`absolute z-40 left-6 right-6 mx-auto bg-[#0d0d0c]/90 border border-white/10 backdrop-blur-xl shadow-2xl flex transition-all duration-300 max-w-4xl ${
              isHUDMinimized 
                ? "flex-row items-center gap-4 h-12 rounded-full bottom-4 p-2.5" 
                : "flex-col gap-3 rounded-3xl bottom-6 p-4"
            }`}
          >
            {isHUDMinimized ? (
              <>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-shrink-0 p-1.5 rounded-full bg-pace-pearl text-pace-black hover:scale-105 active:scale-95 transition"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
                </button>
                
                <span className="text-[10px] text-pace-smoke font-mono whitespace-nowrap min-w-[32px] text-right">
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
                    setIsPlaying(false);
                  }}
                  className="flex-1 accent-pace-pearl h-1 bg-white/15 rounded-lg appearance-none cursor-pointer"
                />
                
                <span className="text-[10px] text-pace-smoke font-mono whitespace-nowrap min-w-[32px] text-left">
                  {TOTAL_DURATION.toFixed(1)}s
                </span>

                <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap text-pace-bone select-none max-w-[150px] truncate">
                  <span className="w-1 h-1 bg-pace-wine rounded-full animate-pulse" />
                  <span>S{currentScene.id}: {currentScene.label}</span>
                </div>

                <button
                  onClick={() => setIsHUDMinimized(false)}
                  className="flex-shrink-0 p-2 rounded-full border border-white/20 text-pace-pearl hover:bg-white/10 active:scale-95 transition flex items-center justify-center w-8 h-8"
                  title="Expand Controls"
                >
                  <ChevronUp size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center pb-0.5">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-pace-smoke">Control Dashboard</span>
                  <button
                    onClick={() => setIsHUDMinimized(true)}
                    className="p-1.5 rounded-full border border-white/10 text-pace-smoke hover:bg-white/5 active:scale-95 transition flex items-center justify-center w-8 h-8"
                    title="Minimize"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full">
                  <span className="text-xs text-pace-smoke font-mono w-10 text-right">{currentTime.toFixed(1)}s</span>
                  <input type="range" min={0} max={TOTAL_DURATION} step={0.1} value={currentTime}
                    onChange={e=>{setCurrentTime(parseFloat(e.target.value));setIsPlaying(false);}}
                    className="flex-1 accent-pace-pearl h-1 bg-white/15 rounded-lg appearance-none cursor-pointer"/>
                  <span className="text-xs text-pace-smoke font-mono w-10 text-left">{TOTAL_DURATION.toFixed(1)}s</span>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setIsPlaying(!isPlaying)} className="p-2.5 rounded-full bg-pace-pearl text-pace-black hover:scale-105 active:scale-95 transition">
                      {isPlaying?<Pause size={15}/>:<Play size={15} className="ml-0.5"/>}
                    </button>
                    <button onClick={()=>{setCurrentTime(0);setIsPlaying(true);}} className="p-2.5 rounded-full border border-white/10 text-pace-bone hover:bg-white/5 active:scale-95 transition"><RotateCcw size={15}/></button>
                    <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 ml-2">
                      {[0.5,1,1.5,2].map(s=>(
                        <button key={s} onClick={()=>setPlaybackSpeed(s)} className={`px-2 py-1 text-[10px] font-mono rounded-full font-bold transition ${playbackSpeed===s?"bg-pace-pearl text-pace-black":"text-pace-bone hover:text-white"}`}>{s}x</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-pace-wine rounded-full animate-ping"/>
                    <span className="text-pace-bone">Active:</span>
                    <span className="text-pace-pearl font-bold truncate max-w-[150px]">{currentScene.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setShowGrain(!showGrain)} className={`p-2.5 rounded-full border transition ${showGrain?"border-pace-moss text-pace-moss bg-pace-moss/5":"border-white/10 text-pace-smoke hover:bg-white/5"}`} title="Film Grain"><Monitor size={15}/></button>
                    <button onClick={()=>setShowGuide(!showGuide)} className={`p-2.5 rounded-full border transition ${showGuide?"border-[#ff7954] text-[#ff7954] bg-[#da552f]/5":"border-white/10 text-pace-smoke hover:bg-white/5"}`} title="OBS Guide"><HelpCircle size={15}/></button>
                    <button onClick={triggerCaptureStart} className="flex items-center gap-1.5 rounded-full bg-pace-wine text-pace-pearl px-4 py-2 text-xs font-bold shadow-glow hover:scale-105 active:scale-95 transition">
                      <Video size={14} className="animate-pulse"/> Start Capture
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 flex items-center justify-start overflow-x-auto gap-2 no-scrollbar">
                  {SCENES.map(scene=>{
                    const active=currentScene.id===scene.id;
                    return(
                      <button key={scene.id} onClick={()=>jumpToScene(scene)}
                        className={`flex-shrink-0 min-w-[78px] text-left p-2 rounded-xl border transition ${active?"bg-white/5 border-pace-pearl/30 text-pace-pearl":"border-white/5 hover:border-white/10 text-pace-smoke"}`}>
                        <p className="text-[8px] uppercase tracking-wider font-bold">S{scene.id}</p>
                        <p className="text-[9px] font-bold mt-0.5 truncate">{scene.label}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {capturingMode&&(
        <div className="absolute top-6 left-6 z-40 flex items-center gap-2 rounded-full border border-red-500/20 bg-red-950/80 px-4 py-2 text-xs font-bold text-red-200 backdrop-blur-md shadow-lg">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"/><span>RECORDING · Press ESC to bring back HUD</span>
        </div>
      )}

      <AnimatePresence>
        {captureCountdown>0&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center text-center">
            <motion.span key={captureCountdown} initial={{scale:0.4,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:1.5,opacity:0}} transition={{duration:0.8}} className="text-9xl font-black font-display text-pace-wine">{captureCountdown}</motion.span>
            <p className="mt-4 text-xs tracking-widest text-pace-smoke uppercase font-semibold">Preparing stage. Press F11 for full screen now.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowGuide(false)} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-6">
            <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} onClick={e=>e.stopPropagation()}
              className="rounded-3xl border border-white/10 bg-[#0d0d0c] p-6 max-w-md text-left text-pace-pearl shadow-2xl">
              <h4 className="text-lg font-bold flex items-center gap-2 border-b border-white/5 pb-3"><Video size={18} className="text-pace-wine"/> OBS Studio Capture Guide</h4>
              <ul className="mt-4 space-y-3.5 text-xs text-pace-bone leading-relaxed">
                {["Set browser zoom to 100% and press F11 for full-screen coverage.",
                  "In OBS add a Window Capture source targeting your browser.",
                  "Set output to 60 FPS at 1080p or 4K (aspect ratio locked to 16:9).",
                  "Click Start Capture — 3-second countdown fires, HUD disappears. Video runs 60 seconds then loops.",
                  "Press ESC to restore the HUD controls at any time."]
                  .map((step,i)=>(
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-pace-smoke">{i+1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <button onClick={()=>setShowGuide(false)} className="mt-6 w-full rounded-xl bg-pace-pearl py-2.5 text-center text-xs font-bold text-pace-black active:scale-95 transition">Got it</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showHUD&&!capturingMode&&(
        <button onClick={()=>setShowHUD(true)} className="absolute bottom-6 right-6 z-40 p-3 rounded-full border border-white/10 bg-[#0d0d0c]/70 text-pace-bone hover:bg-black/90 active:scale-95 transition shadow-lg" title="Show HUD"><Eye size={15}/></button>
      )}
    </div>
  );
}
