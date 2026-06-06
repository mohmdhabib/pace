/**
 * ============================================================================
 * FILE NAME: ChatsView.jsx
 * TYPE: View Component
 * PURPOSE: Renders the active conversations list, split by Direct Messages and
 *          Pace Group chats. Features message indicators and memory thumbnails.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Users, MessageCircle } from "lucide-react";
import Avatar from "../../shared/ui/Avatar";

export default function ChatsView({
  conversations = [],
  setView,
  setActiveConversation,
  setModal
}) {
  const directChats = conversations.filter((c) => c.type === "direct");
  const groupChats = conversations.filter((c) => c.type === "pace_group");

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
              Inbox
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold leading-none text-pace-pearl">Chats</h1>
        </header>

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
          className="flex h-14 items-center gap-2 rounded-full border border-white/15 bg-pace-pearl px-5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98] hover:scale-[1.02]"
          onClick={() => setModal("new-chat")}
        >
          <MessageSquarePlus size={18} />
          New Chat
        </button>
      </div>
    </motion.div>
  );
}
