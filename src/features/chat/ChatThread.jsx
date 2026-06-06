/**
 * ============================================================================
 * FILE NAME: ChatThread.jsx
 * TYPE: Feature View Component
 * PURPOSE: Implements the private messaging room. Renders the conversation log,
 *          supports special memory and Pace card embeddings, and contains the
 *          memory-aware attachment pickers.
 * ============================================================================
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Info, Send, Paperclip, Image, Mic, Layers, X } from "lucide-react";
import Avatar from "../../shared/ui/Avatar";
import MessageBubble from "./MessageBubble";

export default function ChatThread({
  conversation,
  setView,
  messages = {},
  setMessages,
  paces = [],
  memories = [],
  setActivePace,
  setSelectedUserId,
  onSendMessage,
  session
}) {
  // Current user ID for message alignment — UUID from Supabase session, or "me" for offline mode
  const currentUserId = session?.user?.id || "me";
  const [inputText, setInputText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showMemoryPicker, setShowMemoryPicker] = useState(false);
  const [showPacePicker, setShowPacePicker] = useState(false);
  
  const threadMessages = messages[conversation.id] || [];
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on load/new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const handleBack = () => {
    setView("chats");
  };

  const handleOpenRelationship = () => {
    if (conversation.userId) {
      setSelectedUserId(conversation.userId);
      setView("relationship");
    } else {
      alert("This is a group Pace chat. Relationship profiles are available for direct messages.");
    }
  };

  const handleSendMessage = (content, type = "text", extra = {}) => {
    if (!content.trim() && type === "text") return;

    if (onSendMessage) {
      onSendMessage(content, type, extra);
      setInputText("");
      setShowAttachments(false);
      return;
    }

    const newMsg = {
      id: `msg_new_${Date.now()}`,
      sender_id: "me",
      sender_name: "Me",
      type,
      content: type === "text" ? content : (type === "voice" ? "Voice note" : content),
      created_at: new Date().toISOString(),
      ...extra
    };

    setMessages((prev) => ({
      ...prev,
      [conversation.id]: [...(prev[conversation.id] || []), newMsg]
    }));

    setInputText("");
    setShowAttachments(false);
  };

  const handleAttachMemory = (memory) => {
    handleSendMessage(memory.caption, "memory_card", {
      reference_memory_id: memory.id,
      reference_memory: {
        id: memory.id,
        type: memory.type || "photo",
        author: memory.author,
        date: memory.date,
        caption: memory.caption,
        image: memory.image,
        pace_title: memory.pace_title || "Pace Moment"
      }
    });
    setShowMemoryPicker(false);
  };

  const handleAttachPace = (pace) => {
    handleSendMessage(pace.title, "pace_card", {
      reference_pace_id: pace.id,
      reference_pace: {
        id: pace.id,
        title: pace.title,
        members: pace.members,
        memoriesCount: pace.memoriesCount || 42,
        cover: pace.cover
      }
    });
    setShowPacePicker(false);
  };

  const handleSimulateVoice = () => {
    handleSendMessage("Voice note", "voice", {
      media_url: "mock-voice.mp3"
    });
  };

  return (
    <motion.div
      className="flex h-full flex-col bg-[#0d0d0c] text-pace-pearl relative"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 bg-[#0d0d0c]/90 p-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] border border-white/5 text-pace-bone active:scale-95 transition"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleOpenRelationship}>
            <Avatar src={conversation.avatar} name={conversation.title} size="sm" />
            <div className="text-left">
              <h2 className="text-sm font-semibold leading-tight">{conversation.title}</h2>
              <span className="text-[10px] text-pace-smoke">{conversation.stats}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenRelationship}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] border border-white/5 text-pace-bone active:scale-95 transition"
        >
          <Info size={18} />
        </button>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar">
        {threadMessages.length === 0 ? (
          <div className="text-center py-12 text-pace-smoke/60 text-sm">
            No memories shared here yet. Share a card to start the conversation.
          </div>
        ) : (
          threadMessages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserId || msg.sender_id === "me";
            const prevMsg = threadMessages[index - 1];
            const nextMsg = threadMessages[index + 1];
            
            const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-2.5 ${isMe ? "justify-end text-right" : "justify-start text-left"} ${
                  isFirstInGroup ? "mt-4" : "mt-1.5"
                }`}
              >
                {/* Avatar Column */}
                {!isMe && (
                  <div className="w-8 shrink-0 flex justify-center">
                    {isLastInGroup ? (
                      <Avatar src={msg.sender_avatar} name={msg.sender_name} size="sm" />
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}
                
                <div className="max-w-[78%] flex flex-col">
                  {/* Sender Name (above the bubble, only in group chats on the first message) */}
                  {!isMe && isFirstInGroup && conversation.type === "pace_group" && (
                    <span className="text-[10px] font-bold text-pace-bone/70 uppercase tracking-widest mb-1.5 pl-1 block">
                      {msg.sender_name}
                    </span>
                  )}
                  
                  <MessageBubble
                    message={msg}
                    isMe={isMe}
                    setView={setView}
                    setActivePace={setActivePace}
                  />
                  
                  {/* Timestamp below the bubble (only if last in group to avoid clutter) */}
                  {isLastInGroup && (
                    <div className={`px-1.5 mt-1.5 flex items-center gap-1.5 text-[9px] text-pace-smoke/45 font-medium ${
                      isMe ? "justify-end" : "justify-start"
                    }`}>
                      <span>
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="border-t border-white/5 bg-[#0d0d0c]/80 p-4 backdrop-blur-md relative z-30">
        <div className="flex items-center gap-3">
          {/* Attachment Button */}
          <button
            onClick={() => setShowAttachments(!showAttachments)}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/8 transition duration-200 active:scale-95 ${
              showAttachments ? "bg-white/10 text-pace-pearl" : "bg-white/[0.04] text-pace-smoke hover:bg-white/[0.08]"
            }`}
          >
            <Paperclip size={18} />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Send a memory-aware note..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
              className="w-full rounded-full border border-white/8 bg-white/[0.06] py-3 pl-4 pr-12 text-sm text-pace-pearl placeholder-pace-smoke/50 outline-none focus:border-white/20 transition"
            />

            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-pace-pearl text-pace-black disabled:opacity-40 transition active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Floating Attachments Drawer */}
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              className="absolute bottom-16 left-4 right-4 rounded-2xl border border-white/10 bg-[#121110]/95 p-3 shadow-glow backdrop-blur-xl flex justify-around gap-2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <button
                onClick={() => {
                  setShowMemoryPicker(true);
                  setShowAttachments(false);
                }}
                className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-white/[0.04] text-pace-bone active:scale-95 transition"
              >
                <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <Image size={18} />
                </div>
                <span className="text-[10px] font-semibold">Share Memory</span>
              </button>

              <button
                onClick={() => {
                  setShowPacePicker(true);
                  setShowAttachments(false);
                }}
                className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-white/[0.04] text-pace-bone active:scale-95 transition"
              >
                <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Layers size={18} />
                </div>
                <span className="text-[10px] font-semibold">Share Pace</span>
              </button>

              <button
                onClick={() => {
                  handleSimulateVoice();
                  setShowAttachments(false);
                }}
                className="flex flex-col items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-white/[0.04] text-pace-bone active:scale-95 transition"
              >
                <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
                  <Mic size={18} />
                </div>
                <span className="text-[10px] font-semibold">Voice Note</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Memory Attachment Picker Overlay */}
      <AnimatePresence>
        {showMemoryPicker && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#121110] border-t border-white/10 rounded-t-[2rem] p-5 max-h-[75%] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <h3 className="text-base font-semibold text-pace-pearl">Attach a Memory</h3>
                <button
                  onClick={() => setShowMemoryPicker(false)}
                  className="p-1 rounded-full bg-white/5 text-pace-smoke"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {memories.map((mem, i) => (
                  <div
                    key={mem.id || i}
                    onClick={() => handleAttachMemory(mem)}
                    className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.06] transition"
                  >
                    {mem.image ? (
                      <img
                        src={mem.image}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-white/[0.04] border border-white/5 flex items-center justify-center text-pace-smoke shrink-0">
                        {mem.type === "voice" ? <Mic size={16} /> : <span className="text-xs">Text</span>}
                      </div>
                    )}
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm text-pace-pearl font-medium truncate">
                        "{mem.caption}"
                      </p>
                      <p className="text-[10px] text-pace-smoke mt-0.5">
                        {mem.author} · {mem.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pace Attachment Picker Overlay */}
      <AnimatePresence>
        {showPacePicker && (
          <motion.div
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#121110] border-t border-white/10 rounded-t-[2rem] p-5 max-h-[75%] flex flex-col"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <h3 className="text-base font-semibold text-pace-pearl">Attach a Pace</h3>
                <button
                  onClick={() => setShowPacePicker(false)}
                  className="p-1 rounded-full bg-white/5 text-pace-smoke"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
                {paces.map((pace) => (
                  <div
                    key={pace.id}
                    onClick={() => handleAttachPace(pace)}
                    className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.06] transition"
                  >
                    <img
                      src={pace.cover}
                      alt=""
                      className="h-12 w-16 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-sm text-pace-pearl font-semibold truncate">
                        {pace.title}
                      </p>
                      <p className="text-[10px] text-pace-smoke mt-0.5">
                        {pace.members.length} members · {pace.mood}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
