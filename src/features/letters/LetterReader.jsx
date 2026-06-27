/**
 * ============================================================================
 * FILE NAME: LetterReader.jsx
 * TYPE: Feature Component — Full-Screen Interactive Experience
 * PURPOSE: The recipient's cinematic, TRULY interactive experience of a Living Letter.
 *
 * CORE MECHANIC — "One block at a time, unlock by answering":
 * 1. Only ONE block is visible (sharp, focused) at any time.
 * 2. All future blocks are blurred and locked behind a frosted glass overlay.
 * 3. For TEXT blocks — reader taps "Continue" to unlock the next block.
 * 4. For QUESTION blocks — the reader MUST type an answer before the next block unlocks.
 *    The "Continue" button only appears after they've written something.
 * 5. For PHOTO blocks — reader sees the image, taps "Continue".
 * 6. For DIVIDER blocks — auto-advance with a brief pause.
 * 7. After ALL blocks are unlocked, the "Join [Pace]" CTA appears.
 *
 * STAGES:
 * - envelope  — wax seal intro, "Break the seal"
 * - reading   — block-by-block interactive reveal
 * - joining   — auth + join CTA
 * - success   — "You're in" confirmation
 *
 * KEY IMPORTS & DEPENDENCIES:
 * - React, { useState, useEffect, useRef } from "react"
 * - motion, AnimatePresence from "framer-motion"
 * - Icons from "lucide-react"
 * - fetchLetterByToken, submitLetterResponses, joinPaceViaLetter from "../../lib/letterApi"
 * - LetterBlock from "./LetterBlock"
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Mail, Lock, LogIn, UserPlus, ChevronDown, ArrowDown
} from "lucide-react";
import { fetchLetterByToken, submitLetterResponses, joinPaceViaLetter } from "../../lib/letterApi";
import LetterBlock from "./LetterBlock";

// ─── Mood ambient colors ──────────────────────────────────────────────────────
const MOOD_AMBIENTS = {
  nostalgic: { glow: "rgba(198,169,125,0.12)", accent: "#c6a97d" },
  tender:    { glow: "rgba(183,157,176,0.12)", accent: "#b79db0" },
  wild:      { glow: "rgba(143,176,157,0.12)", accent: "#8fb09d" },
  electric:  { glow: "rgba(136,145,192,0.12)", accent: "#8891c0" }
};

/**
 * LetterReader Component
 */
export default function LetterReader({
  token,
  session,
  onClose,
  onSuccess,
  onSigninPassword,
  onSignup
}) {
  // ── Fetch state ────────────────────────────────────────────────────────────
  const [letterData, setLetterData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // ── Experience stages ─────────────────────────────────────────────────────
  const [stage, setStage] = useState("envelope"); // envelope | reading | joining | success

  // ── Active block index — THIS is the core mechanic ────────────────────────
  // Only `activeIndex` block is fully visible. Everything after is blurred.
  const [activeIndex, setActiveIndex] = useState(0);

  // ── Answers ───────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState({}); // { blockId: answer }

  // ── Auth form ─────────────────────────────────────────────────────────────
  const [authMode, setAuthMode]     = useState("signin");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [name, setName]             = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [isJoining, setIsJoining]   = useState(false);

  // ── Scroll ref for auto-scrolling to active block ─────────────────────────
  const activeBlockRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // ── Fetch letter on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    let mounted = true;

    async function load() {
      try {
        const data = await fetchLetterByToken(token);
        if (mounted) {
          setLetterData(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setFetchError(err.message || "Could not load this letter.");
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [token]);

  // ── Auto-scroll to active block when it changes ───────────────────────────
  useEffect(() => {
    if (activeBlockRef.current && stage === "reading") {
      setTimeout(() => {
        activeBlockRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 300);
    }
  }, [activeIndex, stage]);

  // ── Auto-advance divider blocks ───────────────────────────────────────────
  useEffect(() => {
    if (stage !== "reading" || !letterData?.blocks) return;
    const currentBlock = letterData.blocks[activeIndex];
    if (currentBlock?.type === "divider") {
      const timer = setTimeout(() => advanceBlock(), 800);
      return () => clearTimeout(timer);
    }
  }, [activeIndex, stage, letterData]);

  // ── Check if current question is answered ─────────────────────────────────
  function isCurrentBlockAnswered() {
    if (!letterData?.blocks) return true;
    const block = letterData.blocks[activeIndex];
    if (!block) return true;
    if (block.type === "question") {
      return (answers[block.id] || "").trim().length > 0;
    }
    return true; // text, photo, divider don't need answers
  }

  // ── Advance to next block ─────────────────────────────────────────────────
  function advanceBlock() {
    if (!letterData?.blocks) return;
    const nextIndex = activeIndex + 1;
    if (nextIndex >= letterData.blocks.length) {
      // All blocks done — transition to join stage
      setStage("joining");
    } else {
      setActiveIndex(nextIndex);
    }
  }

  // ── Auth handler ──────────────────────────────────────────────────────────
  async function handleAuth(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setAuthStatus("Please fill in all fields.");
      return;
    }
    setAuthStatus(authMode === "signup" ? "Creating account..." : "Signing in...");
    try {
      if (authMode === "signup") {
        await onSignup(email.trim(), password, { full_name: name || undefined });
      } else {
        await onSigninPassword(email.trim(), password);
      }
    } catch (err) {
      setAuthStatus(err.message || "Authentication failed. Try again.");
    }
  }

  // ── Join handler ──────────────────────────────────────────────────────────
  async function handleJoin() {
    if (!session?.user?.id) {
      setAuthStatus("Sign in first to join this Pace.");
      return;
    }

    setIsJoining(true);
    setAuthStatus("Joining the era...");

    try {
      // 1. Submit all question answers
      const questionBlocks = letterData.blocks.filter((b) => b.type === "question");
      const responses = questionBlocks
        .filter((b) => answers[b.id]?.trim())
        .map((b) => ({ blockId: b.id, answer: answers[b.id] }));

      if (responses.length > 0) {
        await submitLetterResponses({
          letterId: letterData.letter.id,
          respondentId: session?.user?.id || "proto-respondent",
          responses
        });
      }

      // 2. Join the Pace
      if (letterData.pace?.id) {
        const paceId = await joinPaceViaLetter({
          paceId: letterData.pace.id,
          userId: session?.user?.id || "proto-respondent",
          letterId: letterData.letter.id
        });

        setStage("success");
        setTimeout(() => {
          onSuccess?.(paceId);
        }, 1800);
      } else {
        setStage("success");
        setTimeout(() => {
          onSuccess?.(null);
        }, 1800);
      }
    } catch (err) {
      setAuthStatus(err.message || "Failed to join. Try again.");
      setIsJoining(false);
    }
  }

  // ── Ambient theme ─────────────────────────────────────────────────────────
  const mood    = letterData?.letter?.mood || "nostalgic";
  const ambient = MOOD_AMBIENTS[mood] || MOOD_AMBIENTS.nostalgic;

  // ─────────────────────────────────────────────────────────────────────────
  // ── LOADING STATE ─────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0906]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xs tracking-[0.25em] text-white/30 uppercase">Opening letter</p>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── ERROR STATE ───────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  if (fetchError || !letterData) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0906] px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="text-center">
          <p className="text-2xl">✉️</p>
          <p className="mt-3 font-serif text-lg text-pace-pearl">Letter not found</p>
          <p className="mt-2 text-sm text-white/40">
            {fetchError || "This letter may have expired or the link is invalid."}
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-full border border-white/10 px-5 py-2 text-sm text-pace-bone transition hover:bg-white/[0.06]"
          >
            Go back
          </button>
        </div>
      </motion.div>
    );
  }

  const { letter, blocks, pace, sender } = letterData;

  // ── Progress calculation ──────────────────────────────────────────────────
  const totalBlocks = blocks.length;
  const progress = totalBlocks > 0 ? Math.min((activeIndex + 1) / totalBlocks, 1) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  // ── SUCCESS STAGE ─────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────
  if (stage === "success") {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0906]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ background: `radial-gradient(circle, ${ambient.glow} 0%, transparent 70%)` }}
          >
            ✦
          </div>
          <p className="font-serif text-2xl text-pace-pearl">
            {pace?.title ? "You're in." : "Sent."}
          </p>
          <p className="text-sm text-white/40">
            {pace?.title ? `Welcome to ${pace.title}` : "Your answers have been shared."}
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-[#0b0906]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient glow layer */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${ambient.glow}, transparent)`
        }}
      />

      {/* Top bar: close + progress */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 text-white/40 backdrop-blur-sm transition hover:text-white/70"
          aria-label="Close letter"
        >
          <X size={16} />
        </button>

        {/* Progress bar — only in reading stage */}
        {(stage === "reading" || stage === "joining") && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/25 tabular-nums">
              {Math.min(activeIndex + 1, totalBlocks)}/{totalBlocks}
            </span>
            <div className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: ambient.accent }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ENVELOPE STAGE ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {stage === "envelope" && (
          <motion.div
            key="envelope"
            className="flex h-full flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Wax seal */}
            <motion.div
              className="mb-8 flex h-20 w-20 items-center justify-center rounded-full text-3xl"
              style={{
                background: `radial-gradient(circle at 40% 35%, #3a1a1a, #1a0a0a)`,
                boxShadow: `0 0 40px 8px rgba(150, 50, 50, 0.18), inset 0 2px 4px rgba(255,255,255,0.06)`
              }}
              animate={{
                boxShadow: [
                  `0 0 30px 5px rgba(150, 50, 50, 0.12), inset 0 2px 4px rgba(255,255,255,0.06)`,
                  `0 0 55px 14px rgba(180, 60, 60, 0.24), inset 0 2px 4px rgba(255,255,255,0.08)`,
                  `0 0 30px 5px rgba(150, 50, 50, 0.12), inset 0 2px 4px rgba(255,255,255,0.06)`
                ]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              ✦
            </motion.div>

            <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">
              A letter from
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-pace-pearl">
              {sender.display_name}
            </h2>
            <p className="mt-1.5 text-sm text-white/35">
              {pace?.title ? (
                <>inviting you to <strong className="text-pace-bone font-medium">{pace.title}</strong></>
              ) : (
                <>sharing a private note with you</>
              )}
            </p>

            {letter.title && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/[0.04] px-5 py-3"
              >
                <p className="font-serif text-base text-pace-bone/80 italic">"{letter.title}"</p>
              </motion.div>
            )}

            <motion.button
              onClick={() => setStage("reading")}
              className="mt-10 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-7 py-3 text-sm font-medium text-pace-pearl backdrop-blur-sm transition hover:bg-white/[0.12] active:scale-[0.97]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              Break the seal
              <ChevronDown size={15} className="text-white/50" />
            </motion.button>

            <p className="mt-4 text-[10px] text-white/20">Tap to read the full letter</p>
          </motion.div>
        )}

        {/* ── READING STAGE — the core interactive experience ──────────── */}
        {(stage === "reading" || stage === "joining") && (
          <motion.div
            key="reading"
            ref={scrollContainerRef}
            className="h-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mx-auto max-w-[560px] px-5 pb-32 pt-16">

              {/* Letter header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                {letter.title && (
                  <h1 className="font-serif text-2xl font-semibold text-pace-pearl/90">
                    {letter.title}
                  </h1>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: ambient.accent }}
                  />
                  <p className="text-xs text-white/30">
                    from <span className="text-white/50">{sender.display_name}</span>
                    {pace?.title && (
                      <> · <span className="text-white/50">{pace.title}</span></>
                    )}
                  </p>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </motion.div>

              {/* ── Blocks — ONE at a time, rest blurred ─────────────────── */}
              <div className="flex flex-col gap-6">
                {blocks.map((block, idx) => {
                  const isPast    = idx < activeIndex;
                  const isActive  = idx === activeIndex && stage === "reading";
                  const isFuture  = idx > activeIndex;
                  const isLastBlock = idx === blocks.length - 1;

                  return (
                    <div
                      key={block.id}
                      ref={isActive ? activeBlockRef : undefined}
                      className="relative"
                    >
                      {/* ── PAST BLOCKS: shown clearly, answered ──────── */}
                      {isPast && (
                        <motion.div
                          initial={{ opacity: 0.5 }}
                          animate={{ opacity: 0.6 }}
                          className="opacity-60"
                        >
                          <LetterBlock
                            block={block}
                            mode="read"
                            revealed={true}
                            answer={answers[block.id] || ""}
                          />
                          {/* Show the submitted answer for question blocks */}
                          {block.type === "question" && answers[block.id] && (
                            <div className="mt-2 ml-4 border-l-2 border-white/10 pl-3">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-1">Your answer</p>
                              <p className="font-serif text-sm text-pace-bone/60 italic">
                                {answers[block.id]}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* ── ACTIVE BLOCK: fully visible, interactive ──── */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 24 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        >
                          {/* Glowing highlight border for active block */}
                          <div
                            className="rounded-[1.6rem] p-[1px]"
                            style={{
                              background: `linear-gradient(135deg, ${ambient.accent}30, transparent 60%, ${ambient.accent}15)`
                            }}
                          >
                            <div className="rounded-[1.5rem] bg-[#0e0b08] p-5">
                              <LetterBlock
                                block={block}
                                mode="read"
                                revealed={true}
                                answer={answers[block.id] || ""}
                                onAnswer={(val) =>
                                  setAnswers((prev) => ({ ...prev, [block.id]: val }))
                                }
                              />

                              {/* Continue button — for text/photo blocks, always visible.
                                  For question blocks, only visible after answer is typed. */}
                              {block.type !== "divider" && (
                                <motion.div
                                  className="mt-5 flex justify-end"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.4 }}
                                >
                                  <button
                                    onClick={advanceBlock}
                                    disabled={block.type === "question" && !isCurrentBlockAnswered()}
                                    className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-[0.97] ${
                                      block.type === "question" && !isCurrentBlockAnswered()
                                        ? "border border-white/5 bg-white/[0.03] text-white/15 cursor-not-allowed"
                                        : "border border-white/15 bg-white/[0.08] text-pace-pearl hover:bg-white/[0.14]"
                                    }`}
                                  >
                                    {isLastBlock ? "Finish" : "Continue"}
                                    <ArrowDown size={13} className={
                                      block.type === "question" && !isCurrentBlockAnswered()
                                        ? "text-white/10" : "text-white/50"
                                    } />
                                  </button>
                                </motion.div>
                              )}

                              {/* Hint for question blocks */}
                              {block.type === "question" && !isCurrentBlockAnswered() && (
                                <motion.p
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 1 }}
                                  className="mt-3 text-center text-[10px] text-white/20"
                                >
                                  Answer to unlock the next part ↓
                                </motion.p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── FUTURE BLOCKS: blurred and locked ─────────── */}
                      {isFuture && (
                        <div className="relative select-none">
                          {/* Blurred block preview */}
                          <div className="blur-[8px] opacity-30 pointer-events-none">
                            <LetterBlock
                              block={block}
                              mode="read"
                              revealed={true}
                              answer=""
                            />
                          </div>
                          {/* Frosted lock overlay */}
                          <div className="absolute inset-0 flex items-center justify-center rounded-[1.2rem] bg-[#0b0906]/60 backdrop-blur-sm">
                            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2">
                              <Lock size={11} className="text-white/20" />
                              <span className="text-[10px] tracking-[0.15em] text-white/20 uppercase">
                                {block.type === "question" ? "Answer above to unlock" : "Continue to reveal"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── JOIN CTA — appears after all blocks completed ─────── */}
              <AnimatePresence>
                {stage === "joining" && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                    className="mt-10"
                  >
                    {/* Decorative end */}
                    <div className="mb-8 flex flex-col items-center gap-2">
                      <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="text-[10px] tracking-[0.4em] text-white/20 uppercase">fin</span>
                    </div>

                    {/* Pace preview card */}
                    {pace && pace.title ? (
                      <div className="relative mb-6 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                        {pace.cover_url && (
                          <div className="absolute inset-0 z-0">
                            <img src={pace.cover_url} alt="" className="h-full w-full object-cover opacity-25" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
                          </div>
                        )}
                        <div className="relative z-10">
                          <span className="rounded-full border border-white/12 bg-white/[0.08] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-pace-bone backdrop-blur-xl">
                            {pace.mood || "Intimate"}
                          </span>
                          <h3 className="mt-3 font-serif text-2xl font-semibold text-pace-pearl">
                            {pace.title}
                          </h3>
                          {pace.description && (
                            <p className="mt-1.5 text-xs leading-5 text-pace-bone/70">{pace.description}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative mb-6 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5">
                        <div className="relative z-10">
                          <span className="rounded-full border border-white/12 bg-white/[0.08] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-pace-bone backdrop-blur-xl">
                            Private Note
                          </span>
                          <h3 className="mt-3 font-serif text-2xl font-semibold text-pace-pearl">
                            Interactive Response
                          </h3>
                          <p className="mt-1.5 text-xs leading-5 text-pace-bone/70">
                            Your answers will be sent securely to {sender?.display_name || "the sender"}.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Auth + join */}
                    <AnimatePresence mode="wait">
                      {!session ? (
                        <motion.div
                          key="auth"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <p className="mb-4 text-center text-xs text-white/40">
                            {pace?.title ? `Sign in or create an account to join ${pace.title}.` : "Sign in or create an account to read this letter."}
                          </p>
                          <form onSubmit={handleAuth} className="grid gap-3">
                            {authMode === "signup" && (
                              <div className="flex rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                                <input
                                  className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                                  placeholder="full name (optional)"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                />
                              </div>
                            )}
                            <div className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                              <Mail size={14} className="text-pace-smoke" />
                              <input
                                type="email"
                                className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                                placeholder="you@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/[0.05] px-3.5 py-2.5">
                              <Lock size={14} className="text-pace-smoke" />
                              <input
                                type="password"
                                className="w-full bg-transparent text-sm text-pace-pearl outline-none placeholder:text-pace-smoke"
                                placeholder="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                              />
                            </div>
                            <button
                              type="submit"
                              className="mt-1 flex h-13 items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98]"
                            >
                              {authMode === "signup" ? <UserPlus size={15} /> : <LogIn size={15} />}
                              {authMode === "signup" ? "Create Account & Join" : "Sign In & Join"}
                            </button>
                          </form>
                          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                            <span className="text-white/30">
                              {authMode === "signup" ? "Have an account?" : "Need an account?"}
                            </span>
                            <button
                              onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setAuthStatus(""); }}
                              className="font-medium text-pace-bone underline hover:text-pace-pearl"
                            >
                              {authMode === "signup" ? "Sign in" : "Create one"}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="join"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="grid gap-3"
                        >
                          <div className="rounded-[1.2rem] border border-white/5 bg-white/[0.04] p-3 text-center text-xs">
                            <span className="text-white/30">Signed in as </span>
                            <span className="font-medium text-pace-bone">{session.user?.email}</span>
                          </div>
                          <button
                            onClick={handleJoin}
                            disabled={isJoining}
                            className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                          >
                            <Sparkles size={16} className={isJoining ? "animate-spin" : ""} />
                            {isJoining ? "Joining..." : (pace?.title ? `Join ${pace.title}` : "Read Letter")}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {authStatus && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 text-center text-xs text-pace-bone/60"
                      >
                        {authStatus}
                      </motion.p>
                    )}

                    <div className="h-8" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
