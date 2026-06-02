import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ChevronLeft,
  ImagePlus,
  Lock,
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


function AIRecap() {
  return (
    <motion.section
      className="mb-5 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-pace-smoke">
        <Bot size={14} />
        AI recap
      </div>
      <p className="mt-3 text-lg font-medium leading-7">
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

function MemoryCard({ memory, index }) {
  const [isTimeLocked, setIsTimeLocked] = useState(
    memory.lockedUntil ? new Date(memory.lockedUntil) > new Date() : false
  );

  return (
    <motion.article
      className={`mb-6 ${index % 2 ? "pl-8" : "pr-8"}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
    >
      <div className="mb-3 flex items-center justify-between text-xs text-pace-smoke">
        <span>{memory.date}</span>
        <span>{memory.time}</span>
      </div>
      <div className="relative memory-card rounded-[1.4rem] border border-white/10 bg-[#f4eee3] p-2 text-pace-black shadow-soft overflow-hidden">
        {isTimeLocked && (
          <LockedMemoryOverlay
            lockedUntil={memory.lockedUntil}
            onUnlock={() => setIsTimeLocked(false)}
          />
        )}

        {memory.type === "photo" && (
          <img
            src={isTimeLocked ? "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=10&q=10" : memory.image}
            alt=""
            className="aspect-[4/5] w-full rounded-[1rem] object-cover"
          />
        )}
        {memory.type === "voice" && <VoiceNote />}
        {memory.type === "text" && (
          <div className="grid min-h-64 place-items-center rounded-[1rem] bg-[#191816] p-6 text-center text-pace-pearl">
            <p className="text-2xl font-medium leading-tight">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
        {memory.type !== "text" && (
          <div className="px-2 pb-2 pt-3">
            <p className="font-medium leading-6">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-pace-smoke">
        {memory.author} · {memory.mood}
      </p>
    </motion.article>
  );
}

function Home({ paces, syncStatus, session, setView, setModal, setActivePace }) {
  const [showArchived, setShowArchived] = useState(false);

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
        <header className="px-5 pb-3 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">{syncStatus}</p>
              <h1 className="mt-2 text-4xl font-semibold leading-none">Pace</h1>
              {session?.user?.email && (
                <p className="mt-2 max-w-[12rem] truncate text-xs text-pace-bone">{session.user.email}</p>
              )}
            </div>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-pace-bone backdrop-blur-xl hover:bg-white/[0.12] transition duration-200"
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

        {/* Active Paces horizontal list */}
        <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-8 pt-2">
          {activePaces.length > 0 ? (
            activePaces.map((pace) => (
              <PaceCard
                pace={pace}
                key={pace.id}
                onOpen={() => {
                  setActivePace(pace);
                  setView("timeline");
                }}
              />
            ))
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border border-white/5 bg-white/[0.02] rounded-[2rem] min-h-[30rem] w-full snaps-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-pace-pearl/10 border border-pace-pearl/20 text-pace-pearl mb-4">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h3 className="text-base font-semibold text-pace-pearl">Your first era awaits</h3>
              <p className="mt-2 text-xs leading-relaxed text-pace-smoke max-w-[200px]">
                Create a private shared room for a trip, a semester, or a late night phase.
              </p>
            </div>
          )}
        </div>

        {/* Soft Archival Hub Drawer */}
        {archivedPaces.length > 0 && (
          <div className="px-5 pb-8 pt-4 flex flex-col border-t border-white/[0.04] mt-4">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-pace-smoke hover:text-pace-pearl transition duration-200 active:scale-95"
            >
              <Archive size={12} />
              <span>{showArchived ? "Hide Archived Eras" : `Show Archived Eras (${archivedPaces.length})`}</span>
            </button>

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

      {/* Floating Create Pace Button */}
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

function Timeline({ pace, memories, setView, setModal }) {
  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative h-72 overflow-hidden">
        <img src={pace.cover} alt="" className="h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-[#0d0d0c]" />
        <button
          className="absolute left-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setView("home")}
          aria-label="Back home"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="absolute right-[8.5rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
          onClick={() => setModal("edit-pace")}
          aria-label="Edit Era Settings"
        >
          <Settings size={17} />
        </button>
        <button
          className="absolute right-[4.75rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setModal("invite")}
          aria-label="Invite friends"
        >
          <Users size={17} />
        </button>
        <button
          className="absolute right-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setModal("capsule")}
          aria-label="Open capsule"
        >
          <Lock size={17} />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs uppercase tracking-[0.22em] text-pace-bone/75">{pace.mood}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none">{pace.title}</h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-pace-bone">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {pace.members.join(", ")}
            </span>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24">
        <AIRecap />
        {memories.map((memory, index) => (
          <MemoryCard memory={memory} key={`${memory.type}-${index}`} index={index} />
        ))}
      </div>
      <button
        className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-pace-pearl text-pace-black shadow-glow transition active:scale-[0.98]"
        onClick={() => setModal("memory")}
        aria-label="Add memory"
      >
        <ImagePlus size={21} />
      </button>
    </motion.div>
  );
}

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
  onSignOut
}) {
  return (
    <PhoneChrome>
      <AnimatePresence mode="wait">
        {view === "home" && (
          <Home
            paces={paces}
            syncStatus={syncStatus}
            session={session}
            setView={setView}
            setModal={setModal}
            setActivePace={setActivePace}
            key="home"
          />
        )}
        {view === "timeline" && (
          <Timeline
            pace={activePace}
            memories={memories}
            setView={setView}
            setModal={setModal}
            key="timeline"
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
    </PhoneChrome>
  );
}
