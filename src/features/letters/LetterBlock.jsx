/**
 * ============================================================================
 * FILE NAME: LetterBlock.jsx
 * TYPE: Feature Shared Component
 * PURPOSE: Renders a single content block inside a Living Letter, supporting
 *          both edit mode (LetterComposer) and read mode (LetterReader).
 *          Block types: text | question | photo | divider.
 *
 * PROPS:
 * - block      {Object}   - The block data object { id, type, content, photo_url, order_index }
 * - mode       {String}   - "edit" or "read"
 * - answer     {String}   - Reader's current answer for question blocks (read mode)
 * - onAnswer   {Function} - Callback(answer) when reader types an answer (read mode)
 * - onChange   {Function} - Callback(field, value) when writer edits content (edit mode)
 * - onDelete   {Function} - Callback() to remove this block (edit mode)
 * - onMoveUp   {Function} - Callback() to move block up (edit mode)
 * - onMoveDown {Function} - Callback() to move block down (edit mode)
 * - isFirst    {Boolean}  - Hides move-up arrow on first block
 * - isLast     {Boolean}  - Hides move-down arrow on last block
 * ============================================================================
 */

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, ChevronUp, ChevronDown, HelpCircle, Type, Image, Minus } from "lucide-react";

// ─── Block type icon map ─────────────────────────────────────────────────────
const BLOCK_ICONS = {
  text: <Type size={12} />,
  question: <HelpCircle size={12} />,
  photo: <Image size={12} />,
  divider: <Minus size={12} />
};

// ─── Auto-resize textarea hook ───────────────────────────────────────────────
function useAutoResize(ref, value) {
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value, ref]);
}

/**
 * LetterBlock Component
 */
export default function LetterBlock({
  block,
  mode = "read",
  answer = "",
  onAnswer,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  revealed = true
}) {
  const textRef = useRef(null);
  const questionRef = useRef(null);
  const answerRef = useRef(null);

  useAutoResize(textRef, block.content);
  useAutoResize(questionRef, block.content);
  useAutoResize(answerRef, answer);

  // ── DIVIDER BLOCK ──────────────────────────────────────────────────────────
  if (block.type === "divider") {
    return (
      <motion.div
        initial={mode === "read" ? { opacity: 0, scaleX: 0.4 } : false}
        animate={revealed ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.4 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative my-4 flex items-center justify-center gap-3 py-2"
      >
        {/* Edit mode controls */}
        {mode === "edit" && (
          <BlockControls
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
            type={block.type}
          />
        )}
        {/* Ornamental divider */}
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-[10px] tracking-[0.4em] text-white/20 uppercase select-none">✦</span>
        <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-white/20 to-transparent" />
      </motion.div>
    );
  }

  // ── TEXT BLOCK ─────────────────────────────────────────────────────────────
  if (block.type === "text") {
    return (
      <motion.div
        initial={mode === "read" ? { opacity: 0, y: 18 } : false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative group"
      >
        {mode === "edit" && (
          <BlockControls
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
            type={block.type}
          />
        )}
        {mode === "edit" ? (
          <textarea
            ref={textRef}
            value={block.content || ""}
            onChange={(e) => onChange?.("content", e.target.value)}
            placeholder="Write something beautiful..."
            className="w-full resize-none overflow-hidden bg-transparent font-serif text-[17px] leading-[1.85] text-pace-pearl/90 outline-none placeholder:text-white/20 pr-8"
            rows={3}
          />
        ) : (
          <p className="font-serif text-[17px] leading-[1.85] text-pace-pearl/90 whitespace-pre-wrap">
            {block.content}
          </p>
        )}
      </motion.div>
    );
  }

  // ── QUESTION BLOCK ─────────────────────────────────────────────────────────
  if (block.type === "question") {
    return (
      <motion.div
        initial={mode === "read" ? { opacity: 0, y: 18 } : false}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative group"
      >
        {mode === "edit" && (
          <BlockControls
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
            type={block.type}
          />
        )}

        <div className="rounded-[1.4rem] border border-[#c6b79d]/25 bg-[#c6b79d]/[0.06] p-4 backdrop-blur-sm">
          {/* Question indicator */}
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle size={13} className="text-[#c6b79d]/60" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#c6b79d]/50">Question</span>
          </div>

          {/* Question text */}
          {mode === "edit" ? (
            <textarea
              ref={questionRef}
              value={block.content || ""}
              onChange={(e) => onChange?.("content", e.target.value)}
              placeholder="Ask something meaningful..."
              className="w-full resize-none overflow-hidden bg-transparent font-serif text-[16px] leading-[1.7] text-pace-pearl outline-none placeholder:text-white/20 pr-6"
              rows={2}
            />
          ) : (
            <p className="font-serif text-[16px] leading-[1.7] text-pace-pearl">
              {block.content}
            </p>
          )}

          {/* Answer area (read mode only) */}
          {mode === "read" && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <textarea
                ref={answerRef}
                value={answer}
                onChange={(e) => onAnswer?.(e.target.value)}
                placeholder="Your answer..."
                className="w-full resize-none overflow-hidden bg-transparent font-serif text-[15px] leading-[1.7] text-pace-bone/80 outline-none placeholder:text-white/20 min-h-[48px]"
                rows={2}
              />
            </div>
          )}

          {/* Composer preview (edit mode — shows reader's answer placeholder) */}
          {mode === "edit" && (
            <div className="mt-2.5 border-t border-white/10 pt-2.5">
              <p className="font-serif text-[14px] text-white/20 italic">
                Reader answers here...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── PHOTO BLOCK ────────────────────────────────────────────────────────────
  if (block.type === "photo") {
    return (
      <motion.div
        initial={mode === "read" ? { opacity: 0, scale: 0.97 } : false}
        animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative group"
      >
        {mode === "edit" && (
          <BlockControls
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            isFirst={isFirst}
            isLast={isLast}
            type={block.type}
          />
        )}

        <div className="overflow-hidden rounded-[1.4rem]">
          {block.photo_url ? (
            <div className="relative">
              <img
                src={block.photo_url}
                alt="Letter photo"
                className="w-full object-cover rounded-[1.4rem]"
                style={{ maxHeight: "360px" }}
              />
              {/* Vignette overlay */}
              <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none" />

              {/* Edit mode: remove photo button */}
              {mode === "edit" && (
                <button
                  onClick={() => onChange?.("photo_url", null)}
                  className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm hover:bg-black/80 transition"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ) : mode === "edit" ? (
            // Upload prompt in edit mode
            <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-white/20 bg-white/[0.03] text-white/30 transition hover:border-white/30 hover:bg-white/[0.05]">
              <Image size={24} />
              <span className="text-xs tracking-wider">Upload photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  onChange?.("photo_url", url);
                  onChange?.("photo_file", file);
                }}
              />
            </label>
          ) : null}
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── Block Controls (edit mode only) ─────────────────────────────────────────
function BlockControls({ onDelete, onMoveUp, onMoveDown, isFirst, isLast, type }) {
  return (
    <div className="absolute -right-1 -top-1 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Block type badge */}
      <span className="flex items-center gap-1 rounded-full border border-white/10 bg-[#11100f] px-2 py-0.5 text-[9px] text-white/30 uppercase tracking-wider">
        {BLOCK_ICONS[type]}
        {type}
      </span>

      {/* Move controls */}
      {!isFirst && (
        <button
          onClick={onMoveUp}
          className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#11100f] text-white/40 hover:text-white/80 transition"
        >
          <ChevronUp size={11} />
        </button>
      )}
      {!isLast && (
        <button
          onClick={onMoveDown}
          className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[#11100f] text-white/40 hover:text-white/80 transition"
        >
          <ChevronDown size={11} />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={onDelete}
        className="grid h-6 w-6 place-items-center rounded-full border border-red-500/20 bg-[#11100f] text-red-400/60 hover:text-red-400 transition"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
