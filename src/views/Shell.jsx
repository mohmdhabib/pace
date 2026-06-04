/**
 * ============================================================================
 * FILE NAME: Shell.jsx
 * TYPE: View Layout Shell Orchestrator
 * PURPOSE: Acts as the primary router and dashboard shell within the simulated mobile environment.
 *          It swaps between three core views (Home dashboard list, individual Space Timelines,
 *          and User Profile settings) while driving cohesive spring slide-and-fade page transitions.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Defines helper components:
 *    - `AIRecap`: Renders a premium, aesthetic summarizing block indicating emotional AI recaps of the era.
 *    - `MemoryCard`: Generates memory articles (Photo, Voice note, Text quotes). It checks if a memory
 *      is locked (`lockedUntil` timestamp compared against `now`). If locked, it layers `LockedMemoryOverlay`
 *      on top and muting content text.
 *    - `Home`: Standard dashboard listing active spaces horizontally. Supports a toggleable archived drawer
 *      housing dormant spaces, and a floating create button.
 *    - `Timeline`: Individual space layouts rendering deep backdrop covers, active group list badges, and the
 *      feed scroll containing recap cards and memory posts.
 * 2. Shell (Main Entry Component) acts as the high-level conditional switch, wrapping these components
 *    in `<AnimatePresence>` to trigger premium transitions.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Manages toggles (archived drawer, active countdowns).
 * - `motion`, `AnimatePresence` from "framer-motion": Essential for horizontal page slides, drawer expansions,
 *   and entry fades.
 * - Icons from "lucide-react": Renders clean interface buttons.
 * - Sub-features: `PaceCard` album grids, `VoiceNote` waveforms, and `LockedMemoryOverlay` screens.
 * ============================================================================
 */

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ChevronLeft,
  ImagePlus,
  Lock,
  Play,
  Plus,
  Settings,
  Sparkles,
  Users,
  Bot
} from "lucide-react";
import { covers } from "../shared/constants";
import PaceCard from "../features/spaces/PaceCard";
import VoiceNote from "../features/memories/VoiceNote";
import LockedMemoryOverlay from "../components/LockedMemoryOverlay";
import PhoneChrome from "../shared/ui/PhoneChrome";
import Profile from "./Profile";

// New components and views for V2
import BottomNav from "../shared/ui/BottomNav";
import HomeDiscover from "./HomeDiscover";
import ChatsView from "../features/chat/ChatsView";
import ChatThread from "../features/chat/ChatThread";
import RelationshipProfile from "../features/relationships/RelationshipProfile";
import ActivityView from "../features/activity/ActivityView";
import Avatar from "../shared/ui/Avatar";

/**
 * AIRecap Sub-Component
 * Renders a stylish summary card explaining overall memory moods.
 */
function AIRecap() {
  return (
    <motion.section
      className="mb-5 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl text-left"
      // Viewport scroll triggered animations: slides up slightly when scrolled into view
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
        <Bot size={14} />
        AI recap
      </div>
      <p className="mt-3 text-lg font-medium leading-7 text-pace-pearl">
        April felt chaotic, loud, unforgettable, and strangely beautiful.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-pace-bone">
        <span className="rounded-full bg-white/[0.07] px-2 py-2">top photos</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-2">mood drift</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-2">story book</span>
      </div>
    </motion.section>
  );
}

/**
 * MemoryCard Sub-Component
 * Renders an individual memory item (Photo, Voice note spectrograph, Text card) in a feed.
 * @param {Object} props
 * @param {Object} props.memory - The parsed memory item details.
 * @param {Number} props.index - Row index in list, used to stagger elements left/right organically.
 */
function MemoryCard({ memory, index, reactions = {}, setReactions, onToggleReaction }) {
  // Evaluates if the memory post should be locked under time-lock parameters
  const [isTimeLocked, setIsTimeLocked] = useState(
    memory.lockedUntil ? new Date(memory.lockedUntil) > new Date() : false
  );

  // Reaction-specific animations state
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  const memoryReactions = reactions[memory.id] || [];

  const triggerFloatingEmoji = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 800);
  };

  const handleToggleReaction = (emoji) => {
    const hasReacted = memoryReactions.some((r) => r.user_id === "me" && r.emoji === emoji);
    if (!hasReacted) {
      triggerFloatingEmoji(emoji);
    }

    if (onToggleReaction) {
      onToggleReaction(memory.id, emoji);
      return;
    }

    if (!setReactions) return;
    setReactions((prev) => {
      const current = prev[memory.id] || [];
      const isReacted = current.some((r) => r.user_id === "me" && r.emoji === emoji);

      let next;
      if (isReacted) {
        next = current.filter((r) => !(r.user_id === "me" && r.emoji === emoji));
      } else {
        next = [...current, { user_id: "me", user_name: "Me", emoji }];
      }
      return {
        ...prev,
        [memory.id]: next
      };
    });
  };

  const formatReactionText = (reacts) => {
    const names = reacts.map((r) => (r.user_id === "me" ? "You" : r.user_name));
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} reacted`;
    if (names.length === 2) return `${names[0]} and ${names[1]} reacted`;
    return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]} reacted`;
  };

  return (
    <motion.article
      // Alternates paddings (pl-8 or pr-8) based on odd/even indices to simulate an organic, hand-placed scrapbooking layout
      className={`mb-6 ${index % 2 ? "pl-8 text-left" : "pr-8 text-left"}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }} // Triggers slightly before fully scrolled in
      transition={{ duration: 0.55 }}
    >
      {/* Date metadata banner */}
      <div className="mb-3 flex items-center justify-between text-xs text-pace-smoke uppercase tracking-wider font-semibold">
        <span>{memory.date}</span>
        <span>{memory.time}</span>
      </div>
      
      {/* Primary Visual Content box */}
      <div className="relative memory-card rounded-[1.4rem] border border-white/10 bg-[#f4eee3] p-2 text-pace-black shadow-soft overflow-hidden">
        {/* If locked, overlay standard frosted lock screen blocking visual contents */}
        {isTimeLocked && (
          <LockedMemoryOverlay
            lockedUntil={memory.lockedUntil}
            onUnlock={() => setIsTimeLocked(false)} // Callback unlocks visually in real time!
          />
        )}

        {/* PHOTO memories rendering */}
        {memory.type === "photo" && (
          <img
            // If locked, swap image src for a low-res blurred thumbnail preset
            src={isTimeLocked ? "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=10&q=10" : memory.image}
            alt=""
            className="aspect-[4/5] w-full rounded-[1rem] object-cover"
          />
        )}
        
        {/* VOICE notes rendering */}
        {memory.type === "voice" && <VoiceNote url={memory.mediaUrl} />}
        
        {/* NOTE text memories rendering */}
        {memory.type === "text" && (
          <div className="grid min-h-64 place-items-center rounded-[1rem] bg-[#191816] p-6 text-center text-pace-pearl">
            <p className="text-2xl font-medium leading-tight">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
        
        {/* Render text descriptions beneath non-text uploads (Photo, Voice, Video) */}
        {memory.type !== "text" && (
          <div className="px-2 pb-2 pt-3">
            <p className="font-medium leading-6">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
      </div>
      
      {/* Reactions ("Echoes") Bar */}
      {!isTimeLocked && (
        <div className="relative mt-2.5 flex flex-col gap-1.5 bg-white/[0.04] border border-white/5 rounded-xl p-2 max-w-xs">
          {/* Row of 5 emojis */}
          <div className="flex gap-2.5 relative">
            {["❤️‍🔥", "🥹", "🫂", "✨", "🔥"].map((emoji) => {
              const hasReacted = memoryReactions.some((r) => r.user_id === "me" && r.emoji === emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={`text-sm p-1 rounded-lg active:scale-75 transition duration-200 ${
                    hasReacted ? "bg-white/10 scale-110 border border-white/10" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>

          {/* Floating Emoji animations */}
          <div className="absolute right-6 top-2 overflow-visible pointer-events-none">
            <AnimatePresence>
              {floatingEmojis.map((item) => (
                <motion.span
                  key={item.id}
                  className="absolute text-base pointer-events-none"
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.4 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                >
                  {item.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          {/* List of who reacted */}
          {memoryReactions.length > 0 && (
            <p className="text-[10px] text-pace-smoke font-medium pl-1 leading-none">
              {formatReactionText(memoryReactions)}
            </p>
          )}
        </div>
      )}

      {/* Creator metadata */}
      <p className="mt-3 text-xs text-pace-smoke font-medium">
        {memory.author} · {memory.mood}
      </p>
    </motion.article>
  );
}

/**
 * Home Sub-Component
 * Renders the main dashboard containing all active Spaces.
 */
function Home({ paces, syncStatus, session, setView, setModal, setActivePace }) {
  const [showArchived, setShowArchived] = useState(false); // Archive drawer state

  const activePaces = paces.filter((p) => !p.archivedAt);
  const archivedPaces = paces.filter((p) => p.archivedAt);

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-24">
        {/* Dashboard Header banner */}
        <header className="px-5 pb-3 pt-8 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-pace-smoke font-semibold">{syncStatus}</p>
              <h1 className="mt-2 text-4xl font-semibold leading-none">Pace</h1>
              {session?.user?.email && (
                <p className="mt-2 max-w-[12rem] truncate text-xs text-pace-bone font-medium">{session.user.email}</p>
              )}
            </div>
            {/* Navigates users to User Settings & archived stats */}
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-pace-bone backdrop-blur-xl hover:bg-white/[0.12] transition duration-200 active:scale-95"
              onClick={() => setView("profile")}
              aria-label="Open profile"
            >
              <Archive size={18} />
            </button>
          </div>
          <p className="mt-5 max-w-[18rem] text-sm leading-6 text-pace-bone/75">
            Your active eras, held quietly with the people who were there.
          </p>
        </header>

        {/* Horizontal Scrolling Active Spaces Grid */}
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-8 pt-2">
          {activePaces.length > 0 ? (
            activePaces.map((pace) => (
              <PaceCard
                pace={pace}
                key={pace.id}
                onOpen={() => {
                  setActivePace(pace);
                  setView("timeline"); // Switch active tab views
                }}
              />
            ))
          ) : (
            // Placeholder shown if users have no active spaces
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border border-white/5 bg-white/[0.02] rounded-[2rem] min-h-[30rem] w-full snap-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pace-pearl/10 border border-pace-pearl/20 text-pace-pearl mb-4">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-pace-pearl">Your first era awaits</h3>
              <p className="mt-2 text-xs leading-relaxed text-pace-smoke max-w-[200px]">
                Create a private shared room for a trip, a semester, or a late night phase.
              </p>
            </div>
          )}
        </div>

        {/* Archived Spaces segment (Hidden if empty) */}
        {archivedPaces.length > 0 && (
          <div className="px-5 pb-8 pt-4 flex flex-col border-t border-white/[0.04] mt-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-pace-smoke hover:text-pace-pearl transition duration-200 active:scale-95"
            >
              <Archive size={12} />
              <span>{showArchived ? "Hide Archived Eras" : `Show Archived Eras (${archivedPaces.length})`}</span>
            </button>

            {/* smooth collapsible frame displaying archived card streams */}
            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="no-scrollbar flex snap-x gap-4 overflow-x-auto py-2"
                >
                  {archivedPaces.map((pace) => (
                    <PaceCard
                      pace={pace}
                      key={pace.id}
                      isArchived={true}
                      onOpen={() => {
                        setActivePace(pace);
                        setView("timeline");
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Plus Button to trigger Space Creator overlays */}
      <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 w-max">
        <button
          className="flex h-14 items-center gap-2 rounded-full border border-white/15 bg-pace-pearl px-5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98] hover:scale-[1.02]"
          onClick={() => setModal("create")}
        >
          <Plus size={18} />
          Create Pace
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Timeline Sub-Component
 * Renders the vertical feed scrolls for a specific selected space.
 */
function Timeline({ pace, memories, setView, setModal, hasStoryContent, reactions, setReactions, onToggleReaction }) {
  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      // Slides in from the right to represent pushing details in mobile transitions
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Large header cover graphic segment */}
      <div className="relative h-72 overflow-hidden text-left">
        <img src={pace.cover} alt="" className="h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-[#0d0d0c]" />
        
        {/* Navigation back home */}
        <button
          className="absolute left-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl active:scale-95 transition"
          onClick={() => setView("paces")}
          aria-label="Back home"
        >
          <ChevronLeft size={20} />
        </button>
        
        {/* Play Story cinematic slideshow trigger */}
        {hasStoryContent && (
          <button
            className="absolute left-[4.5rem] top-8 flex h-11 items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-4 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
            onClick={() => setModal("story")}
            aria-label="Play story"
          >
            <Play size={14} className="fill-current" />
            <span className="text-xs font-semibold tracking-wide">Story</span>
          </button>
        )}
        
        {/* Settings button to manage space Row details */}
        <button
          className="absolute right-[8.5rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
          onClick={() => setModal("edit-pace")}
          aria-label="Edit Era Settings"
        >
          <Settings size={17} />
        </button>
        
        {/* Invite friends overlay trigger */}
        <button
          className="absolute right-[4.75rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
          onClick={() => setModal("invite")}
          aria-label="Invite friends"
        >
          <Users size={17} />
        </button>
        
        {/* Explainer modal for capsule locks */}
        <button
          className="absolute right-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
          onClick={() => setModal("capsule")}
          aria-label="Open capsule"
        >
          <Lock size={17} />
        </button>
        
        {/* Space Title texts pinned to the bottom of the header */}
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs uppercase tracking-[0.22em] text-pace-bone/75 font-semibold">{pace.mood}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none text-pace-pearl">{pace.title}</h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-pace-bone">
            <span className="flex items-center gap-1 font-semibold">
              <Users size={14} className="text-pace-smoke" />
              {pace.members.join(", ")}
            </span>
          </div>
        </div>
      </div>
      
      {/* Scrollable list mapping memories */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24">
        <AIRecap />
        {memories.map((memory, index) => (
          <MemoryCard
            memory={memory}
            key={`${memory.type}-${index}`}
            index={index}
            reactions={reactions}
            setReactions={setReactions}
            onToggleReaction={onToggleReaction}
          />
        ))}
      </div>
      
      {/* Add new memory floating pill */}
      <button
        className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-pace-pearl text-pace-black shadow-glow transition active:scale-[0.98] hover:scale-[1.02]"
        onClick={() => setModal("memory")}
        aria-label="Add memory"
      >
        <ImagePlus size={21} />
      </button>
    </motion.div>
  );
}

/**
 * Shell main router wrapper
 */
export default function Shell({
  paces,
  memories,
  activePace,
  setActivePace,
  view,
  setView,
  setModal,
  syncStatus,
  session,
  onSignOut,
  // new props for V2
  conversations,
  setConversations,
  activeConversation,
  setActiveConversation,
  reactions,
  setReactions,
  messages,
  setMessages,
  onSendMessage,
  onToggleReaction
}) {
  const [selectedUserId, setSelectedUserId] = useState("user_arjun");

  return (
    <PhoneChrome maxWidth="max-w-[430px]">
      {/* AnimatePresence triggers exit fades on keyed sub-components as they unmount */}
      <AnimatePresence mode="wait">
        {view === "home" && (
          <HomeDiscover
            paces={paces}
            memories={memories}
            setView={setView}
            setActivePace={setActivePace}
            setActiveConversation={setActiveConversation}
            setSelectedUserId={setSelectedUserId}
            key="discover"
          />
        )}
        {view === "paces" && (
          <Home
            paces={paces}
            syncStatus={syncStatus}
            session={session}
            setView={setView}
            setModal={setModal}
            setActivePace={setActivePace}
            key="paces"
          />
        )}
        {view === "timeline" && (
          <Timeline
            pace={activePace}
            memories={memories}
            setView={setView}
            setModal={setModal}
            reactions={reactions}
            setReactions={setReactions}
            onToggleReaction={onToggleReaction}
            key="timeline"
            hasStoryContent={memories && memories.length > 0}
          />
        )}
        {view === "chats" && (
          <ChatsView
            conversations={conversations}
            setView={setView}
            setActiveConversation={setActiveConversation}
            setModal={setModal}
            key="chats"
          />
        )}
        {view === "chat-thread" && (
          <ChatThread
            conversation={activeConversation}
            setView={setView}
            messages={messages}
            setMessages={setMessages}
            paces={paces}
            memories={memories}
            setActivePace={setActivePace}
            setSelectedUserId={setSelectedUserId}
            onSendMessage={onSendMessage}
            key="chat-thread"
          />
        )}
        {view === "relationship" && (
          <RelationshipProfile
            userId={selectedUserId}
            setView={setView}
            paces={paces}
            setActivePace={setActivePace}
            key="relationship"
          />
        )}
        {view === "activity" && (
          <ActivityView
            memories={memories}
            paces={paces}
            setView={setView}
            setActivePace={setActivePace}
            key="activity"
          />
        )}
        {view === "profile" && (
          <Profile
            setView={setView}
            session={session}
            onSignOut={onSignOut}
            key="profile"
          />
        )}
      </AnimatePresence>

      {/* Render BottomNav on main tabs */}
      {["home", "paces", "chats", "activity", "profile"].includes(view) && (
        <BottomNav
          activeTab={view}
          setActiveTab={setView}
          unreadChatsCount={conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
          hasNewActivity={true}
        />
      )}
    </PhoneChrome>
  );
}
