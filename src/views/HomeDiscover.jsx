/**
 * ============================================================================
 * FILE NAME: HomeDiscover.jsx
 * TYPE: View Component
 * PURPOSE: The premium, cinematic landing and discover screen. Renders featured
 *          memories, recent moments across paces, and shortcuts to connection profiles.
 *          For new users (no content), renders a premium welcome / onboarding hero.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, ArrowRight, Plus, UserPlus, ImagePlus, Layers, Moon } from "lucide-react";
import Avatar from "../shared/ui/Avatar";
import { fetchCloseConnections } from "../lib/relationshipApi";
import { covers } from "../shared/constants";

// Stagger animation config reused across cards
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }
  })
};

/**
 * WelcomeState — shown to a freshly signed-in user with no paces/memories yet.
 * Premium, animated, warm, and actionable.
 */
function WelcomeState({ setModal, session }) {
  const firstName = session?.user?.user_metadata?.full_name?.split(" ")[0]
    || session?.user?.email?.split("@")[0]
    || "there";

  const actions = [
    {
      id: "create",
      icon: Layers,
      label: "Create a Pace",
      sub: "Start a private room for your next era",
      gradient: "from-[#d2c5b1]/20 via-[#8f6b67]/15 to-[#62594d]/20",
      border: "border-[#d2c5b1]/20",
      glow: "shadow-[0_0_30px_rgba(210,197,177,0.08)]",
      onClick: () => setModal("create")
    },
    {
      id: "invite",
      icon: UserPlus,
      label: "Invite a Friend",
      sub: "Share a link — they join your Pace instantly",
      gradient: "from-[#7d8577]/20 via-[#4a5040]/15 to-[#8f6b67]/10",
      border: "border-[#7d8577]/20",
      glow: "shadow-[0_0_30px_rgba(125,133,119,0.08)]",
      onClick: () => setModal("invite")
    },
    {
      id: "memory",
      icon: ImagePlus,
      label: "Add a Memory",
      sub: "Drop a photo, voice note, or a moment in text",
      gradient: "from-[#8f6b67]/20 via-[#6b4f4e]/15 to-[#d2c5b1]/10",
      border: "border-[#8f6b67]/20",
      glow: "shadow-[0_0_30px_rgba(143,107,103,0.08)]",
      onClick: () => setModal("memory")
    }
  ];

  const moodPreviews = [
    { mood: "nostalgic", cover: covers[0], caption: "Final Semester" },
    { mood: "late-night", cover: covers[1], caption: "Chennai Nights" },
    { mood: "adventure", cover: covers[2], caption: "Mountain Trip" },
  ];

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28 px-5 pt-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-pace-pearl animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
              Welcome
            </p>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-pace-pearl">
            Hey {firstName} 👋
          </h1>
          <p className="mt-2 text-sm text-pace-bone/70 leading-relaxed max-w-[260px]">
            Your first era is ready to be written. Start below.
          </p>
        </header>

        {/* Hero Welcome Card */}
        <motion.div
          className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Animated ambient glow orbs */}
          <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-[#c6b79d]/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#8f6b67]/15 blur-3xl" />

          {/* Collage grid of covers */}
          <div className="relative grid grid-cols-3 gap-0.5 h-48 overflow-hidden">
            {covers.slice(0, 3).map((src, i) => (
              <motion.div
                key={i}
                className="relative overflow-hidden"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.7 }}
              >
                <img src={src} alt="" className="h-full w-full object-cover opacity-60" />
              </motion.div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d0d0c]/60 to-[#0d0d0c]" />
          </div>

          <div className="relative px-5 pb-5 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon size={14} className="text-pace-bone/60" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-pace-smoke font-semibold">
                Pace · Private Memory Rooms
              </span>
            </div>
            <p className="text-xl font-semibold text-pace-pearl leading-snug">
              Capture eras with the people who were there.
            </p>
            <p className="mt-2 text-sm text-pace-bone/60 leading-relaxed">
              Photos, voice notes, quotes — all in one private, cinematic scrapbook.
            </p>
          </div>
        </motion.div>

        {/* 3 Action Cards */}
        <div className="mb-8 flex flex-col gap-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-pace-smoke font-semibold mb-1">
            Get Started
          </p>
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                id={`welcome-action-${action.id}`}
                onClick={action.onClick}
                className={`group relative flex items-center gap-4 rounded-[1.4rem] border ${action.border} bg-gradient-to-br ${action.gradient} ${action.glow} p-4 text-left backdrop-blur-xl transition-all duration-300 active:scale-[0.98] hover:border-white/20 hover:bg-white/[0.07]`}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                whileTap={{ scale: 0.97 }}
              >
                {/* Icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-pace-bone transition-all duration-200 group-hover:bg-white/[0.12] group-hover:text-pace-pearl">
                  <Icon size={20} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-pace-pearl">{action.label}</p>
                  <p className="mt-0.5 text-xs text-pace-smoke leading-relaxed">{action.sub}</p>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={16}
                  className="shrink-0 text-pace-smoke/40 transition-all duration-200 group-hover:text-pace-pearl group-hover:translate-x-0.5"
                />
              </motion.button>
            );
          })}
        </div>

        {/* Mood Preview Strip */}
        <section className="mb-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-pace-smoke font-semibold">
            Era Vibes
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {moodPreviews.map((item, i) => (
              <motion.div
                key={i}
                className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-[1.2rem] border border-white/5 cursor-default"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
              >
                <img src={item.cover} alt="" className="h-full w-full object-cover opacity-55" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c]/85 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-pace-smoke font-semibold">{item.mood}</p>
                  <p className="text-[11px] font-semibold text-pace-pearl/90 leading-tight truncate">{item.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/**
 * ContentState — shown when user has paces and memories (the full discover experience).
 */
function ContentState({ paces, memories, setView, setActivePace, setActiveConversation, setSelectedUserId }) {
  const featuredMemory = memories.find((m) => m.mood === "core-memory") || memories[0];
  const recentPhotos = memories.filter((m) => m.type === "photo");

  const [connections, setConnections] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadConnections() {
      try {
        const data = await fetchCloseConnections();
        if (isMounted) setConnections(data);
      } catch (err) {
        console.warn("Failed to load close connections:", err);
      }
    }
    loadConnections();
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-24 px-5 pt-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pace-pearl animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
              Discover
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold leading-none text-pace-pearl">Pace</h1>
        </header>

        {/* Featured Moment */}
        {featuredMemory && (
          <motion.section
            className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0c] shadow-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-[4/3] w-full">
              <img
                src={featuredMemory.image || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=75"}
                alt=""
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c] via-[#0d0d0c]/30 to-black/20" />
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-pace-pearl backdrop-blur-md border border-white/10">
                <Sparkles size={10} className="text-amber-400" />
                Featured Moment
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-pace-smoke uppercase tracking-wider">
                {featuredMemory.author} · {featuredMemory.date}
              </p>
              <h2 className="mt-2 text-xl font-medium text-pace-pearl leading-snug">
                "{featuredMemory.caption}"
              </h2>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs text-pace-bone">
                  {featuredMemory.mood}
                </span>
                {featuredMemory.type === "voice" && (
                  <button className="flex items-center gap-1.5 rounded-full bg-pace-pearl px-4 py-2 text-xs font-bold text-pace-black transition active:scale-95">
                    <Play size={12} className="fill-current" />
                    Listen
                  </button>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Close Connections Section */}
        <section className="mb-8">
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
            Close Connections
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {connections.length > 0 ? connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => {
                  setSelectedUserId(conn.id);
                  setView("relationship");
                }}
                className="flex flex-col items-center gap-2 focus:outline-none transition active:scale-95 shrink-0"
              >
                <div className="rounded-full p-0.5 bg-gradient-to-tr from-[#d2c5b1]/60 via-transparent to-[#8f6b67]/60 shadow-[0_0_8px_rgba(210,197,177,0.15)]">
                  <Avatar src={conn.avatar_url} name={conn.name} online={true} size="lg" />
                </div>
                <span className="text-xs font-semibold text-pace-pearl">{conn.name}</span>
              </button>
            )) : (
              <p className="text-xs text-pace-smoke/60 italic py-2">
                Invite friends to a Pace and they'll appear here.
              </p>
            )}
          </div>
        </section>

        {/* Recent Moments Horizontal Stream */}
        {recentPhotos.length > 0 && (
          <section className="mb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
                Recent Moments
              </h3>
              <button
                onClick={() => setView("paces")}
                className="flex items-center gap-1 text-xs font-semibold text-pace-bone/70 hover:text-pace-pearl transition"
              >
                All Paces
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
              {recentPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-[1.2rem] border border-white/5 bg-white/[0.03] transition-transform active:scale-95"
                >
                  <img src={photo.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="text-[10px] font-bold text-white/90 truncate">{photo.caption}</p>
                    <p className="text-[8px] uppercase tracking-wider text-pace-smoke mt-0.5">{photo.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
}

/**
 * HomeDiscover — Top-level router that picks between WelcomeState and ContentState.
 */
export default function HomeDiscover({
  paces,
  memories,
  session,
  setModal,
  setView,
  setActivePace,
  setActiveConversation,
  setSelectedUserId
}) {
  const hasContent = memories.length > 0 || paces.length > 0;

  // For authenticated users with no content, show the premium welcome state
  // For guest mode (session null + content exists from mocks) or users with content, show ContentState
  const showWelcome = session && !hasContent;

  return (
    <AnimatePresence mode="wait">
      {showWelcome ? (
        <WelcomeState key="welcome" session={session} setModal={setModal} />
      ) : (
        <ContentState
          key="content"
          paces={paces}
          memories={memories}
          setView={setView}
          setActivePace={setActivePace}
          setActiveConversation={setActiveConversation}
          setSelectedUserId={setSelectedUserId}
        />
      )}
    </AnimatePresence>
  );
}
