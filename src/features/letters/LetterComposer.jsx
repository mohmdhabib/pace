/**
 * ============================================================================
 * FILE NAME: LetterComposer.jsx
 * TYPE: Feature Component — Full-Screen Modal
 * PURPOSE: The writing experience for a Living Letter. A block-based editor
 *          where the sender crafts an interactive invitation letter for a
 *          specific Pace. Blocks can be: text, question, photo, or divider.
 *
 * WHAT HAPPENS IN THIS FILE:
 * 1. Writer gives the letter a title and picks a mood.
 * 2. Writer adds blocks using the "+" add-block menu (text/question/photo/divider).
 * 3. Each block is editable in-place with auto-resize textareas.
 * 4. Writer can reorder blocks with up/down arrows, or delete any block.
 * 5. "Preview" mode switches to LetterReader display so writer sees recipient view.
 * 6. "Seal & Send" calls createLetter() API → returns a shareable token URL.
 * 7. Copy card shows the URL with a one-click copy button.
 *
 * KEY IMPORTS & DEPENDENCIES:
 * - React, { useState, useRef } from "react"
 * - motion, AnimatePresence from "framer-motion"
 * - Icons from "lucide-react"
 * - createLetter from "../../lib/letterApi"
 * - LetterBlock from "./LetterBlock"
 * ============================================================================
 */

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Type, HelpCircle, Image, Minus, Copy, Check,
  Eye, EyeOff, Send, Feather, ChevronLeft
} from "lucide-react";
import { createLetter } from "../../lib/letterApi";
import LetterBlock from "./LetterBlock";

// ─── Mood themes ─────────────────────────────────────────────────────────────
const MOODS = [
  { id: "nostalgic",  label: "Nostalgic",  color: "#c6a97d", bg: "from-[#c6a97d]/15" },
  { id: "tender",     label: "Tender",     color: "#b79db0", bg: "from-[#b79db0]/15" },
  { id: "wild",       label: "Wild",       color: "#8fb09d", bg: "from-[#8fb09d]/15" },
  { id: "electric",   label: "Electric",   color: "#8891c0", bg: "from-[#8891c0]/15" }
];

// ─── Block type definitions ───────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: "text",    label: "Text",      icon: <Type size={15} />,        desc: "Write a paragraph" },
  { type: "question",label: "Question",  icon: <HelpCircle size={15} />,  desc: "Ask something" },
  { type: "photo",   label: "Photo",     icon: <Image size={15} />,       desc: "Add a memory" },
  { type: "divider", label: "Divider",   icon: <Minus size={15} />,       desc: "Scene break" }
];

// ─── Block factory ────────────────────────────────────────────────────────────
function makeBlock(type, orderIndex) {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    content: "",
    photo_url: null,
    photo_file: null,
    order_index: orderIndex
  };
}

/**
 * LetterComposer Component
 * @param {Object}   props
 * @param {Object}   props.pace     - The active Pace { id, title, mood }
 * @param {Object}   props.session  - The authenticated Supabase session
 * @param {Function} props.onClose  - Dismiss callback
 * @param {Function} props.onSent   - Called with { letter, url } after sealing
 */
import { Layers } from "lucide-react";

export default function LetterComposer({ pace, session, onClose, onSent, paces = [] }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [title, setTitle]       = useState("");
  const [mood, setMood]         = useState(pace?.mood || "nostalgic");
  const [blocks, setBlocks]     = useState([makeBlock("text", 0)]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [status, setStatus]     = useState("idle"); // idle | sending | sent | error
  const [sentUrl, setSentUrl]   = useState(null);
  const [copied, setCopied]     = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [linkToSpace, setLinkToSpace] = useState(!!pace);
  const [selectedPaceId, setSelectedPaceId] = useState(pace?.id || paces[0]?.id || "");

  const activeMood = MOODS.find((m) => m.id === mood) || MOODS[0];

  // ── Block CRUD helpers ─────────────────────────────────────────────────────
  function addBlock(type) {
    setBlocks((prev) => [...prev, makeBlock(type, prev.length)]);
    setShowAddMenu(false);
  }

  function deleteBlock(id) {
    setBlocks((prev) => prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, order_index: i })));
  }

  function updateBlock(id, field, value) {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  }

  function moveBlock(id, direction) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((b, i) => ({ ...b, order_index: i }));
    });
  }

  // ── Seal & Send ────────────────────────────────────────────────────────────
  async function handleSeal() {
    if (blocks.length === 0) {
      setStatusMsg("Add at least one block to your letter.");
      return;
    }

    setStatus("sending");
    setStatusMsg("Sealing your letter...");

    try {
      const result = await createLetter({
        paceId: linkToSpace ? selectedPaceId : null,
        senderId: session?.user?.id,
        title: title.trim() || null,
        mood,
        blocks: blocks.map(({ id, type, content, photo_url, order_index }) => ({
          type,
          content,
          photo_url,
          order_index
        }))
      });

      setSentUrl(result.url);
      setStatus("sent");
      setStatusMsg("Your letter is sealed. Share this link.");
      onSent?.(result);
    } catch (err) {
      console.error("LetterComposer seal error:", err);
      setStatus("error");
      setStatusMsg(err.message || "Could not seal the letter. Try again.");
    }
  }

  async function copyUrl() {
    if (!sentUrl) return;
    await navigator.clipboard.writeText(sentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0906] text-pace-pearl overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
    >
      {/* Ambient mood glow */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${activeMood.bg} to-transparent opacity-60`}
        style={{ "--mood-color": activeMood.color }}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone transition active:scale-95"
            aria-label="Close composer"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
              Living Letter · {pace?.title || "Pace"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Feather size={13} className="text-white/40" />
              <span className="text-sm font-medium text-pace-pearl/80">Compose</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button
            onClick={() => setPreviewMode((p) => !p)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              previewMode
                ? "border-white/25 bg-white/10 text-pace-pearl"
                : "border-white/10 bg-white/[0.04] text-pace-bone"
            }`}
          >
            {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {previewMode ? "Edit" : "Preview"}
          </button>

          {/* Seal & Send button */}
          {status !== "sent" && (
            <button
              onClick={handleSeal}
              disabled={status === "sending"}
              className="flex items-center gap-1.5 rounded-full bg-pace-pearl px-4 py-1.5 text-xs font-semibold text-pace-black shadow-glow transition active:scale-95 disabled:opacity-60"
            >
              <Send size={13} />
              {status === "sending" ? "Sealing..." : "Seal & Send"}
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Body ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 py-6">
        <div className="mx-auto max-w-[560px]">

          {/* ── Title input ────────────────────────────────────────────────── */}
          {!previewMode && (
            <div className="mb-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Letter title (optional)"
                className="w-full bg-transparent font-serif text-2xl font-semibold text-pace-pearl/90 outline-none placeholder:text-white/20"
              />

              {/* Mood selector */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
                      mood === m.id
                        ? "border-white/25 bg-white/10 text-pace-pearl"
                        : "border-white/10 bg-transparent text-white/30 hover:text-white/50"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full inline-block"
                      style={{ background: m.color }}
                    />
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Space Selection Control */}
              {!pace && paces.length > 0 && (
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-white/40" />
                      <span className="text-xs font-medium text-pace-bone">Link to a Space</span>
                    </div>
                    <button
                      onClick={() => setLinkToSpace(!linkToSpace)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                        linkToSpace ? "bg-pace-pearl" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-pace-black transition-transform duration-200 ${
                          linkToSpace ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {linkToSpace && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden text-left"
                      >
                        <p className="text-[11px] text-white/30 mb-2 leading-relaxed">
                          Choose which Pace this letter will invite the recipient to join:
                        </p>
                        <div className="relative">
                          <select
                            value={selectedPaceId}
                            onChange={(e) => setSelectedPaceId(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-white/10 bg-[#0e0b08] px-4 py-2.5 text-sm text-pace-pearl outline-none focus:border-white/20"
                          >
                            {paces.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-white/40">
                            ▼
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="mt-5 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          )}

          {/* ── Preview mode header ─────────────────────────────────────────── */}
          {previewMode && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">Preview — as seen by recipient</p>
              {title && (
                <h1 className="mt-2 font-serif text-2xl font-semibold text-pace-pearl/90">{title}</h1>
              )}
              <p className="mt-1 text-xs text-white/25">
                From {session?.user?.user_metadata?.full_name || "You"}
                {linkToSpace && (pace?.title || paces.find((p) => p.id === selectedPaceId)?.title) && (
                  <> · {pace?.title || paces.find((p) => p.id === selectedPaceId)?.title}</>
                )}
              </p>
              <div className="mt-4 h-px bg-gradient-to-r from-white/10 to-transparent" />
            </div>
          )}

          {/* ── Blocks ─────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            <AnimatePresence>
              {blocks.map((block, idx) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <LetterBlock
                    block={block}
                    mode={previewMode ? "read" : "edit"}
                    revealed={true}
                    onChange={(field, value) => updateBlock(block.id, field, value)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, "up")}
                    onMoveDown={() => moveBlock(block.id, "down")}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* ── Add block bar (edit mode only) ──────────────────────────────── */}
          {!previewMode && status !== "sent" && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu((p) => !p)}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/50 transition hover:border-white/25 hover:text-white/80"
                  aria-label="Add a block"
                >
                  <Plus size={14} />
                  Add block
                </button>

                <AnimatePresence>
                  {showAddMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#151210]/95 shadow-soft backdrop-blur-xl min-w-[200px]"
                    >
                      {BLOCK_TYPES.map((bt, i) => (
                        <button
                          key={bt.type}
                          onClick={() => addBlock(bt.type)}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/[0.06] ${
                            i < BLOCK_TYPES.length - 1 ? "border-b border-white/[0.06]" : ""
                          }`}
                        >
                          <span className="text-pace-bone">{bt.icon}</span>
                          <div className="text-left">
                            <p className="text-pace-pearl text-[13px] font-medium">{bt.label}</p>
                            <p className="text-white/35 text-[11px]">{bt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ── Sent state: URL copy card ─────────────────────────────────── */}
          <AnimatePresence>
            {status === "sent" && sentUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Your letter is sealed ✦</p>
                <p className="mt-1.5 text-base font-semibold text-pace-pearl">Share this link</p>
                <p className="mt-1 text-xs text-white/40">The link expires in 14 days.</p>

                <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/25 p-3 text-[11px] leading-5 text-pace-bone break-all">
                  {sentUrl}
                </div>

                <button
                  onClick={copyUrl}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-pace-pearl py-3 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98]"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Status message ───────────────────────────────────────────────── */}
          {statusMsg && status !== "sent" && (
            <p className="mt-4 text-center text-xs text-white/40">{statusMsg}</p>
          )}

          {/* Bottom padding for scroll */}
          <div className="h-16" />
        </div>
      </div>
    </motion.div>
  );
}
