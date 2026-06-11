/**
 * ============================================================================
 * FILE NAME: PulseView.jsx
 * TYPE: Feature View
 * PURPOSE: "The Pulse" — a daily emoji mood-drop that lets your close group
 *          silently check in with each other. You drop one emoji, then see
 *          everyone else's. Can't see theirs until you post yours (BeReal mechanic).
 *
 * FLOW:
 *   1. Not dropped today → shows emoji picker with ambient dark UI
 *   2. Emoji tapped → dramatic animation → reveals friends' drops
 *   3. History strip → last 7 days of collective moods
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Lock,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import Avatar from "../../shared/ui/Avatar";
import {
  getMyTodayDrop,
  dropTodaysPulse,
  fetchTodaysFriendPulses,
  fetchPulseHistory,
} from "../../lib/pulseApi";
import { isSupabaseConfigured } from "../../lib/supabase";

// ── The 12 mood emojis ──────────────────────────────────────────────────────
const PULSE_EMOJIS = [
  { emoji: "🔥", label: "on fire" },
  { emoji: "🥹", label: "emotional" },
  { emoji: "⚡", label: "electric" },
  { emoji: "🌙", label: "low key" },
  { emoji: "💫", label: "dreamy" },
  { emoji: "😶‍🌫️", label: "zoning out" },
  { emoji: "🫂", label: "need a hug" },
  { emoji: "🌊", label: "going with it" },
  { emoji: "💀", label: "dead inside" },
  { emoji: "✨", label: "glowing" },
  { emoji: "😴", label: "exhausted" },
  { emoji: "🤯", label: "overwhelmed" },
];

// ── Mock data shown in prototype / guest mode ────────────────────────────────
const MOCK_FRIEND_DROPS = [
  {
    userId: "u1",
    name: "Riya",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    emoji: "🥹",
    note: "",
    droppedAt: new Date().toISOString(),
  },
  {
    userId: "u2",
    name: "Arjun",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    emoji: "⚡",
    note: "",
    droppedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    userId: "u3",
    name: "Aadhi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    emoji: "🌙",
    note: "",
    droppedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
];

const MOCK_HISTORY = [
  {
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "⚡", isMe: true },
      { name: "Riya", emoji: "🔥", isMe: false },
      { name: "Arjun", emoji: "💫", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "🥹", isMe: true },
      { name: "Riya", emoji: "🌙", isMe: false },
      { name: "Arjun", emoji: "😴", isMe: false },
      { name: "Aadhi", emoji: "✨", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "🌊", isMe: true },
      { name: "Riya", emoji: "🫂", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "💀", isMe: true },
      { name: "Arjun", emoji: "💀", isMe: false },
      { name: "Aadhi", emoji: "🤯", isMe: false },
    ],
  },
  {
    date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    drops: [
      { name: "You", emoji: "✨", isMe: true },
      { name: "Riya", emoji: "🥹", isMe: false },
      { name: "Arjun", emoji: "🌊", isMe: false },
    ],
  },
];

function formatHistoryDate(dateStr) {
  const date = new Date(dateStr + "T12:00:00");
  const diff = Math.round((Date.now() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
}

// ── Sub-component: Dropped state ─────────────────────────────────────────────
function DroppedState({ myDrop, friendDrops, onReset, session }) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(MOCK_HISTORY);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    fetchPulseHistory().then((h) => { if (h.length) setHistory(h); });
  }, [session]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24 pt-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              className="h-2 w-2 rounded-full bg-pace-pearl"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
              Today's Pulse
            </p>
          </div>
          <h1 className="text-4xl font-semibold leading-none text-pace-pearl">Pulse</h1>
        </header>

        {/* My drop + friends cloud */}
        <section className="mb-8">
          {/* My emoji — big centered */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white/5 blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative text-5xl select-none">{myDrop.emoji}</span>
            </motion.div>
            <p className="mt-3 text-xs text-pace-smoke font-medium">Your drop for today</p>
          </div>

          {/* Friends' drops heading */}
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold flex items-center gap-1.5">
            <Activity size={12} />
            Your crew today
          </h3>

          {/* Friend cards */}
          <div className="space-y-3">
            {friendDrops.length === 0 ? (
              <div className="rounded-[1.5rem] border border-white/[0.05] bg-white/[0.02] p-6 text-center">
                <p className="text-sm text-pace-smoke">
                  No one else has dropped yet. Check back later 👀
                </p>
              </div>
            ) : (
              friendDrops.map((friend, i) => (
                <motion.div
                  key={friend.userId}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={friend.avatar} name={friend.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-pace-pearl">{friend.name}</p>
                      <p className="text-[10px] text-pace-smoke">
                        {new Date(friend.droppedAt).toLocaleTimeString("en", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <motion.span
                    className="text-3xl select-none"
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.12 + 0.15, type: "spring", stiffness: 180 }}
                  >
                    {friend.emoji}
                  </motion.span>
                </motion.div>
              ))
            )}
          </div>

          {/* Sync hint for authenticated mode with no real friends yet */}
          {isSupabaseConfigured && friendDrops.length === 0 && (
            <p className="mt-4 text-center text-[11px] text-pace-smoke/50">
              Invite your friends to a Pace — their drops will appear here
            </p>
          )}
        </section>

        {/* ── Mood History ─────────────────────────────────────────────────── */}
        <section>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mb-4 flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <RotateCcw size={12} />
              Mood History
            </span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-3 pb-4">
                  {history.map((day, i) => (
                    <motion.div
                      key={day.date}
                      className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <p className="text-xs font-semibold text-pace-smoke shrink-0 w-20">
                        {formatHistoryDate(day.date)}
                      </p>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {day.drops.map((d, j) => (
                          <div key={j} className="flex flex-col items-center gap-0.5">
                            <span className="text-xl select-none">{d.emoji}</span>
                            <span className={`text-[8px] font-medium ${d.isMe ? "text-pace-pearl" : "text-pace-smoke/60"}`}>
                              {d.isMe ? "you" : d.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Change drop (debug/dev convenience) */}
        <button
          onClick={onReset}
          className="mt-4 flex items-center gap-1.5 mx-auto text-[11px] text-pace-smoke/40 hover:text-pace-smoke/70 transition"
        >
          <RotateCcw size={10} />
          Change today's drop
        </button>
      </div>
    </div>
  );
}

// ── Sub-component: Picker state ───────────────────────────────────────────────
function PickerState({ onDrop, friendCount }) {
  const [selected, setSelected] = useState(null);
  const [dropping, setDropping] = useState(false);

  const handleSelect = (item) => {
    if (dropping) return;
    setSelected(item);
  };

  const handleConfirm = async () => {
    if (!selected || dropping) return;
    setDropping(true);
    await new Promise((r) => setTimeout(r, 600)); // dramatic pause
    onDrop(selected.emoji);
  };

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <header className="px-5 pt-8 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <motion.span
              className="h-2 w-2 rounded-full bg-pace-pearl"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
              Daily ritual
            </p>
          </div>
          <h1 className="text-4xl font-semibold leading-none text-pace-pearl">Pulse</h1>
        </header>

        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-[#c6b79d]/5 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-8 h-40 w-40 rounded-full bg-[#8f6b67]/8 blur-3xl" />

        {/* Lock / FOMO hint */}
        <div className="mx-5 mt-4 mb-8 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <Lock size={14} className="text-pace-smoke shrink-0 mt-0.5" />
          <p className="text-xs text-pace-smoke leading-relaxed">
            {friendCount > 0
              ? `${friendCount} ${friendCount === 1 ? "person has" : "people have"} already dropped today — drop yours to see theirs.`
              : "Drop your pulse first. Friends' drops reveal when you post."}
          </p>
        </div>

        {/* Big prompt */}
        <div className="px-5 mb-6 text-center">
          <h2 className="text-xl font-semibold text-pace-pearl leading-snug">
            How are you feeling today?
          </h2>
          <p className="mt-1 text-xs text-pace-smoke">One emoji. That's it.</p>
        </div>

        {/* Emoji grid */}
        <div className="px-5 grid grid-cols-4 gap-3">
          {PULSE_EMOJIS.map((item) => {
            const isSelected = selected?.emoji === item.emoji;
            return (
              <motion.button
                key={item.emoji}
                onClick={() => handleSelect(item)}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? "border-white/25 bg-white/[0.09] scale-105 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] active:scale-95"
                }`}
                whileTap={{ scale: 0.93 }}
              >
                <span className="text-3xl select-none leading-none">{item.emoji}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider leading-none ${isSelected ? "text-pace-pearl" : "text-pace-smoke"}`}>
                  {item.label}
                </span>
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border border-white/20"
                    layoutId="selected-ring"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Drop CTA */}
        <AnimatePresence>
          {selected && (
            <motion.div
              className="px-5 mt-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.button
                id="pulse-drop-btn"
                onClick={handleConfirm}
                disabled={dropping}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-pace-pearl py-4 text-sm font-bold text-pace-black shadow-glow transition active:scale-[0.97] disabled:opacity-70"
                animate={dropping ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 0.4 }}
              >
                {dropping ? (
                  <>
                    <motion.span
                      className="text-xl"
                      animate={{ scale: [1, 1.6, 0.8, 1.3, 1], rotate: [0, 10, -10, 5, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      {selected.emoji}
                    </motion.span>
                    Dropping your pulse...
                  </>
                ) : (
                  <>
                    <span className="text-xl">{selected.emoji}</span>
                    Drop my pulse
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main PulseView ────────────────────────────────────────────────────────────
export default function PulseView({ session, paces = [] }) {
  const [myDrop, setMyDrop] = useState(null);    // null = not dropped yet
  const [friendDrops, setFriendDrops] = useState([]);
  const [friendCount, setFriendCount] = useState(0); // blinded count before user drops
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false); // animation gate

  // Load today's state on mount
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Check my own drop
      const existing = await getMyTodayDrop();
      if (!isMounted) return;

      if (existing) {
        setMyDrop(existing);
        // Load friends since user already dropped
        const friends = isSupabaseConfigured
          ? await fetchTodaysFriendPulses()
          : MOCK_FRIEND_DROPS;
        if (isMounted) {
          setFriendDrops(friends);
          setRevealed(true);
        }
      } else {
        // Blind: just show the count (not the emojis)
        if (isSupabaseConfigured && session) {
          const friends = await fetchTodaysFriendPulses();
          if (isMounted) setFriendCount(friends.length);
        } else {
          if (isMounted) setFriendCount(MOCK_FRIEND_DROPS.length);
        }
      }

      if (isMounted) setLoading(false);
    }

    init();
    return () => { isMounted = false; };
  }, [session]);

  const handleDrop = async (emoji) => {
    const drop = await dropTodaysPulse(emoji);
    setMyDrop(drop);

    // Reveal friends after small delay for drama
    setTimeout(async () => {
      const friends = isSupabaseConfigured && session
        ? await fetchTodaysFriendPulses()
        : MOCK_FRIEND_DROPS;
      setFriendDrops(friends);
      setRevealed(true);
    }, 700);
  };

  const handleReset = () => {
    // Clear localStorage for today so user can re-drop (dev tool)
    const d = new Date();
    const key = `pace_pulse_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.removeItem(key);
    setMyDrop(null);
    setFriendDrops([]);
    setRevealed(false);
    setFriendCount(MOCK_FRIEND_DROPS.length);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          className="text-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🫀
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        {!myDrop ? (
          <motion.div
            key="picker"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <PickerState onDrop={handleDrop} friendCount={friendCount} />
          </motion.div>
        ) : (
          <motion.div
            key="dropped"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <DroppedState
              myDrop={myDrop}
              friendDrops={friendDrops}
              onReset={handleReset}
              session={session}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
