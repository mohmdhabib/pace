/**
 * ============================================================================
 * FILE NAME: ChatsView.jsx
 * TYPE: View Component
 * PURPOSE: Renders the active conversations list, split by Direct Messages and
 *          Pace Group chats. Features message indicators and memory thumbnails.
 *          For new users with no conversations, shows a premium empty state.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Users, MessageCircle, Layers, ArrowRight, Feather } from "lucide-react";
import Avatar from "../../shared/ui/Avatar";

/**
 * ChatsEmptyState — Premium empty state for authenticated users with no chats yet.
 */
function ChatsEmptyState({ setModal, onWriteLetter }) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center px-8 pb-24 pt-4 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated icon cluster */}
      <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-[#d2c5b1]/5 animate-pulse" />
        <div className="absolute inset-2 rounded-full border border-white/[0.06] bg-white/[0.03]" />

        {/* Floating small icons */}
        <motion.div
          className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-pace-smoke"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Users size={13} />
        </motion.div>
        <motion.div
          className="absolute -bottom-1 -left-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-pace-smoke"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <MessageCircle size={11} />
        </motion.div>

        {/* Center icon */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone backdrop-blur-xl">
          <MessageSquarePlus size={22} />
        </div>
      </div>

      {/* Text content */}
      <h2 className="text-xl font-semibold text-pace-pearl leading-snug mb-3">
        Your first conversation starts with a Pace
      </h2>
      <p className="text-sm text-pace-smoke leading-relaxed max-w-[240px] mb-8">
        Create a Pace and invite a friend — your group chat appears here automatically.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-[260px]">
        <button
          id="chats-empty-create-pace"
          onClick={() => setModal("create")}
          className="flex items-center justify-center gap-2.5 rounded-2xl bg-pace-pearl px-5 py-3.5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.97] hover:scale-[1.02]"
        >
          <Layers size={16} />
          Create a Pace
        </button>
        <button
          id="chats-empty-new-chat"
          onClick={() => setModal("new-chat")}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-sm font-semibold text-pace-bone backdrop-blur-xl transition active:scale-[0.97] hover:bg-white/[0.09]"
        >
          <MessageSquarePlus size={16} />
          Start a Chat
        </button>
        <button
          id="chats-empty-write-letter"
          onClick={onWriteLetter}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3.5 text-sm font-semibold text-pace-bone backdrop-blur-xl transition active:scale-[0.97] hover:bg-white/[0.09]"
        >
          <Feather size={16} />
          Write a Living Letter
        </button>
      </div>

      {/* Small hint */}
      <p className="mt-6 flex items-center gap-1.5 text-[11px] text-pace-smoke/50">
        <ArrowRight size={10} />
        Group chats are created automatically when you invite someone
      </p>
    </motion.div>
  );
}

export default function ChatsView({
  conversations = [],
  setView,
  setActiveConversation,
  setModal,
  onWriteLetter,
  sentLetters = [],
  onViewLetterResponses
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const directChats = conversations.filter((c) => c.type === "direct");
  const groupChats = conversations.filter((c) => c.type === "pace_group");
  const isEmpty = conversations.length === 0;

  const handleOpenChat = (chat) => {
    setActiveConversation(chat);
    setView("chat-thread");
  };

  const renderChatCard = (chat) => {
    return (
      <motion.div
        key={chat.id}
        onClick={() => handleOpenChat(chat)}
        className="flex items-center justify-between border-b border-white/[0.04] py-4 cursor-pointer active:bg-white/[0.02] transition"
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar / Icon */}
          <Avatar
            src={chat.avatar}
            name={chat.title}
            online={chat.online}
            size="md"
          />

          {/* Details */}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-pace-pearl truncate">
                {chat.title}
              </h3>
              <span className="text-[10px] text-pace-smoke font-medium ml-2 shrink-0">
                {chat.timestamp}
              </span>
            </div>

            <p className="text-sm text-pace-smoke truncate mt-0.5">
              {chat.lastMessage}
            </p>

            <span className="text-[11px] text-pace-bone/50 block mt-1">
              {chat.stats}
            </span>
          </div>
        </div>

        {/* Right side: Badge or Thumbnail */}
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {chat.unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pace-pearl px-1.5 text-xs font-bold text-pace-black">
              {chat.unreadCount}
            </span>
          )}

          {chat.recentMemoryImage ? (
            <img
              src={chat.recentMemoryImage}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-pace-smoke shrink-0">
              {chat.type === "pace_group" ? <Users size={14} /> : <MessageCircle size={14} />}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header — always visible */}
      <div className="px-5 pb-0 pt-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pace-pearl animate-pulse" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
            Inbox
          </p>
        </div>
        <h1 className="mt-2 mb-6 text-4xl font-semibold leading-none text-pace-pearl">Chats</h1>
      </div>

      {isEmpty ? (
        /* Premium empty state */
        <ChatsEmptyState setModal={setModal} onWriteLetter={onWriteLetter} />
      ) : (
        /* Full conversations list */
        <>
          <div className="no-scrollbar flex-1 overflow-y-auto pb-24 px-5">
            {/* Living Letter CTA card */}
            <button
              onClick={onWriteLetter}
              className="mb-6 flex w-full items-center gap-3 rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06] active:scale-[0.99]"
            >
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-pace-bone">
                <Feather size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-pace-pearl">Write a Living Letter</p>
                <p className="mt-0.5 text-[11px] text-pace-smoke leading-4 truncate">Craft an interactive letter with questions &amp; photos</p>
              </div>
              <span className="text-xs text-white/20">✦</span>
            </button>

            {/* Sent Letters Section */}
            {sentLetters.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold border-b border-white/5 pb-2 mb-3">
                  Sent Letters
                </h2>
                <div className="flex flex-col gap-2">
                  {sentLetters.map(({ letter, pace }) => {
                    const isResponded = letter.status === "responded";
                    return (
                      <motion.div
                        key={letter.id}
                        onClick={() => onViewLetterResponses?.(letter.id)}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition"
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border ${
                            isResponded 
                              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" 
                              : "border-white/10 bg-white/[0.04] text-pace-smoke"
                          }`}>
                            <Feather size={13} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between">
                              <h3 className="text-sm font-semibold text-pace-pearl truncate">
                                {letter.title || (pace?.title ? `Invite to ${pace.title}` : "Living Letter")}
                              </h3>
                              <span className="text-[10px] text-pace-smoke ml-2 shrink-0">
                                {formatDate(letter.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                isResponded ? "bg-emerald-400" : "bg-amber-400"
                              }`} />
                              <p className="text-[11px] text-pace-smoke truncate">
                                {isResponded ? "Recipient responded ✦ Click to read" : "Awaiting response..."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Direct Messages Section */}
            {directChats.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold border-b border-white/5 pb-2 mb-2">
                  Direct Messages
                </h2>
                <div className="flex flex-col">
                  {directChats.map(renderChatCard)}
                </div>
              </section>
            )}

            {/* Pace Groups Section */}
            {groupChats.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold border-b border-white/5 pb-2 mb-2">
                  Pace Groups
                </h2>
                <div className="flex flex-col">
                  {groupChats.map(renderChatCard)}
                </div>
              </section>
            )}
          </div>

          {/* Floating Create Chat Button — positioned above the BottomNav */}
          <div className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 w-max">
            <button
              id="chats-new-chat-btn"
              className="flex h-14 items-center gap-2 rounded-full border border-white/15 bg-pace-pearl px-5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98] hover:scale-[1.02]"
              onClick={() => setModal("new-chat")}
            >
              <MessageSquarePlus size={18} />
              New Chat
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
