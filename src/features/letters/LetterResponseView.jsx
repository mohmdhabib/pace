/**
 * ============================================================================
 * FILE NAME: LetterResponseView.jsx
 * TYPE: Feature Component — Sent Letter & Responses Viewer
 * PURPOSE: Allows the sender/writer to view a sent letter and the inline
 *          answers submitted by the recipient, styled with Pace's cinematic branding.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Eye, CheckCircle, Copy, Check } from "lucide-react";
import { fetchLetterWithResponses } from "../../lib/letterApi";
import LetterBlock from "./LetterBlock";

const MOOD_AMBIENTS = {
  nostalgic: { glow: "rgba(198,169,125,0.12)", accent: "#c6a97d" },
  tender:    { glow: "rgba(183,157,176,0.12)", accent: "#b79db0" },
  wild:      { glow: "rgba(143,176,157,0.12)", accent: "#8fb09d" },
  electric:  { glow: "rgba(136,145,192,0.12)", accent: "#8891c0" }
};

export default function LetterResponseView({ letterId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!letterId) return;
    let mounted = true;

    async function load() {
      try {
        const res = await fetchLetterWithResponses(letterId);
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load responses.");
          setLoading(false);
        }
      }
    }

    load();
    return () => { mounted = false; };
  }, [letterId]);

  const handleCopyLink = () => {
    if (!data?.letter?.token) return;
    const token = data.letter.token;
    const url = `${window.location.origin}?letter=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0906]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xs tracking-[0.2em] text-white/30 uppercase">Loading responses</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0906] px-6">
        <div className="text-center">
          <p className="text-2xl">✉️</p>
          <p className="mt-3 font-serif text-lg text-pace-pearl">Could not find letter details</p>
          <p className="mt-2 text-sm text-white/40">{error || "This letter was not found."}</p>
          <button
            onClick={onClose}
            className="mt-6 rounded-full border border-white/10 px-5 py-2 text-sm text-pace-bone transition hover:bg-white/[0.06]"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { letter, blocks, pace, sender, responses, respondent } = data;
  const mood = letter.mood || "nostalgic";
  const ambient = MOOD_AMBIENTS[mood] || MOOD_AMBIENTS.nostalgic;
  const isResponded = Object.keys(responses || {}).length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0906] pb-24 text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Ambient glow layer */}
      <div
        className="pointer-events-none absolute inset-0 h-full"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${ambient.glow}, transparent)`
        }}
      />

      {/* Top Header Navigation */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.04] bg-[#0b0906]/85 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/40 text-white/60 backdrop-blur-sm transition hover:text-white/90"
            aria-label="Back to inbox"
          >
            <X size={16} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-pace-smoke font-medium">
              Sent Letter
            </p>
            <h1 className="text-sm font-semibold text-pace-pearl truncate max-w-[200px]">
              {letter.title || "Untitled Letter"}
            </h1>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase border ${
            isResponded
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-amber-500/20 bg-amber-500/10 text-amber-400"
          }`}
        >
          {isResponded ? "Responded ✦" : "Sent"}
        </span>
      </div>

      <div className="mx-auto max-w-[560px] px-5 pt-8">
        {/* Letter Metadata Info Card */}
        <div className="mb-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <h2 className="font-serif text-xl font-medium text-pace-pearl">
            {pace && pace.title ? `Invitation to ${pace.title}` : "Living Letter Details"}
          </h2>
          <p className="mt-1 text-xs text-pace-smoke leading-relaxed">
            {pace && pace.title ? "Sent to join the private space." : "Self-contained interactive note."}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-xs text-pace-smoke">
              <Calendar size={13} className="text-white/20" />
              <span>
                {new Date(letter.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-pace-smoke">
              <User size={13} className="text-white/20" />
              <span>
                {isResponded ? `Respondent: ${respondent?.display_name || "Friend"}` : "Awaiting reply..."}
              </span>
            </div>
          </div>

          {!isResponded && (
            <div className="mt-5 border-t border-white/5 pt-4">
              <p className="text-[11px] text-pace-smoke leading-relaxed mb-3">
                Your friend hasn't submitted their answers yet. Copy the link below to share it with them.
              </p>
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-pace-bone transition active:scale-[0.98] hover:bg-white/[0.08]"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? "Link Copied" : "Copy Invitation Link"}
              </button>
            </div>
          )}
        </div>

        {/* Cinematic separator */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-[10px] tracking-[0.3em] text-white/20 uppercase font-serif">The Letter</span>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
        </div>

        {/* Letter Canvas */}
        <div className="flex flex-col gap-6">
          {blocks.map((block) => {
            const blockAnswer = responses?.[block.id] || "";

            return (
              <div key={block.id} className="relative">
                {/* Render the core letter block as a display view */}
                <LetterBlock
                  block={block}
                  mode="view"
                  revealed={true}
                  answer=""
                />

                {/* Render the response overlay if the block type is question */}
                {block.type === "question" && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2 text-emerald-400/70">
                      <CheckCircle size={12} />
                      <span className="text-[9px] uppercase tracking-widest font-semibold">
                        {respondent?.display_name || "Respondent"}'s Answer
                      </span>
                    </div>
                    {blockAnswer ? (
                      <p className="font-serif text-sm leading-relaxed text-pace-pearl italic pl-1 border-l-2 border-emerald-500/20">
                        "{blockAnswer}"
                      </p>
                    ) : (
                      <p className="text-xs text-white/20 italic pl-1">
                        Not answered yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
