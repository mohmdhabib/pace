/**
 * ============================================================================
 * FILE NAME: NewChatModal.jsx
 * TYPE: Dialog Component
 * PURPOSE: Renders a list of Pace contacts to start direct messages. Uses
 *          glassmorphic dark design tokens and animations.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Sparkles } from "lucide-react";
import Avatar from "../shared/ui/Avatar";
import { getOrCreateDMConversation } from "../lib/chatApi";

export default function NewChatModal({
  paces = [],
  session = null,
  onClose,
  onChatStarted
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract unique members from all paces, excluding the current logged-in user
    const currentUserId = session?.user?.id;
    const map = new Map();

    paces.forEach((pace) => {
      if (pace.membersDetails && pace.membersDetails.length > 0) {
        pace.membersDetails.forEach((member) => {
          if (member.id && member.id !== currentUserId) {
            map.set(member.id, member);
          }
        });
      }
    });

    const uniqueContacts = Array.from(map.values());
    setContacts(uniqueContacts);
  }, [paces, session]);

  const filteredContacts = contacts.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async (contact) => {
    setLoading(true);
    try {
      const convId = await getOrCreateDMConversation(contact.id);
      if (onChatStarted && convId) {
        // Construct basic conversation representation
        onChatStarted({
          id: convId,
          type: "direct",
          title: contact.displayName,
          avatar: contact.avatarUrl,
          userId: contact.id,
          online: true,
          stats: "Direct Message"
        });
      }
    } catch (err) {
      console.error("Failed to start DM chat:", err);
      alert("Failed to start direct message conversation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-full max-w-[430px] rounded-t-[2rem] border border-white/10 bg-[#121110]/95 p-6 shadow-glow backdrop-blur-xl flex flex-col max-h-[85vh]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-pace-smoke font-bold">
              <Sparkles size={12} className="text-pace-bone animate-pulse" />
              Start Messaging
            </div>
            <h3 className="text-xl font-semibold text-pace-pearl mt-1">New Chat</h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] border border-white/5 text-pace-bone active:scale-95 transition"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </header>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-3.5 text-pace-smoke/60" />
          <input
            type="text"
            placeholder="Search close friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            className="w-full rounded-full border border-white/8 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-pace-pearl placeholder-pace-smoke/40 outline-none focus:border-white/20 transition"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-pace-smoke">
              <span className="h-5 w-5 rounded-full border-2 border-pace-pearl border-t-transparent animate-spin mb-3" />
              <p className="text-xs uppercase tracking-wider">Establishing connection</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-pace-smoke text-sm">
              {searchQuery ? "No contacts match search query" : "No contacts available. Invite friends to your Pace first!"}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                onClick={() => handleStartChat(contact)}
                className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.99] transition text-left"
                whileTap={{ scale: 0.99 }}
              >
                <Avatar
                  src={contact.avatarUrl}
                  name={contact.displayName}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-pace-pearl truncate">
                    {contact.displayName}
                  </h4>
                  <p className="text-[10px] text-pace-smoke uppercase tracking-wider font-medium mt-0.5">
                    Close Connection
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
