/**
 * ============================================================================
 * FILE NAME: HomeDiscover.jsx
 * TYPE: View Component
 * PURPOSE: The premium, cinematic landing and discover screen. Renders featured
 *          memories, recent moments across paces, and shortcuts to connection profiles.
 * ============================================================================
 */

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, ArrowRight, Heart } from "lucide-react";
import Avatar from "../shared/ui/Avatar";
import { mockRelationshipStats } from "../shared/constants";

export default function HomeDiscover({
  paces,
  memories,
  setView,
  setActivePace,
  setActiveConversation,
  setSelectedUserId
}) {
  // Find a featured memory (use the first one, or one marked core-memory)
  const featuredMemory = memories.find((m) => m.mood === "core-memory") || memories[0];

  // Get active connections based on mock data keys
  const connections = Object.keys(mockRelationshipStats).map((key) => ({
    id: key,
    ...mockRelationshipStats[key]
  }));

  // Filter photos for the recent moments stream
  const recentPhotos = memories.filter((m) => m.type === "photo");

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
              Discover
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold leading-none text-pace-pearl">Pace</h1>
        </header>

        {/* Featured Moment (Large cinematic glassmorphic card) */}
        {featuredMemory && (
          <motion.section
            className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d0d0c] shadow-glow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-[4/3] w-full">
              <img
                src={featuredMemory.image || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=75"}
                alt=""
                className="h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0c] via-[#0d0d0c]/30 to-black/20" />
              
              {/* Highlight badge */}
              <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-pace-pearl backdrop-blur-md border border-white/10">
                <Sparkles size={10} className="text-amber-400" />
                Featured Moment
              </span>
            </div>
            
            <div className="p-5">
              <p className="text-sm font-semibold text-pace-smoke uppercase tracking-wider">
                {featuredMemory.author} · {featuredMemory.date}
              </p>
              <h2 className="mt-2 text-xl font-medium text-pace-pearl leading-snug">
                "{featuredMemory.caption}"
              </h2>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-white/[0.07] px-3 py-1.5 text-xs text-pace-bone">
                  {featuredMemory.mood}
                </span>
                
                {featuredMemory.type === "voice" && (
                  <button className="flex items-center gap-1.5 rounded-full bg-pace-pearl px-4 py-2 text-xs font-bold text-pace-black transition active:scale-95">
                    <Play size={12} className="fill-current" />
                    Listen
                  </button>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* Close Connections Section */}
        <section className="mb-8">
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
            Close Connections
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {connections.map((conn) => {
              // Map connection id to avatar URL (based on mockConversations details)
              const avatarUrl = conn.id === "user_arjun" 
                ? "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
                : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80";

              return (
                <button
                  key={conn.id}
                  onClick={() => {
                    setSelectedUserId(conn.id);
                    setView("relationship");
                  }}
                  className="flex flex-col items-center gap-2 focus:outline-none transition active:scale-95"
                >
                  <div className="rounded-full p-0.5 bg-gradient-to-tr from-[#d2c5b1]/60 via-transparent to-[#8f6b67]/60 shadow-[0_0_8px_rgba(210,197,177,0.15)]">
                    <Avatar
                      src={avatarUrl}
                      name={conn.name}
                      online={true}
                      size="lg"
                    />
                  </div>
                  <span className="text-xs font-semibold text-pace-pearl">
                    {conn.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Moments Horizontal Stream */}
        <section className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
              Recent Moments
            </h3>
            <button
              onClick={() => setView("paces")}
              className="flex items-center gap-1 text-xs font-semibold text-pace-bone/70 hover:text-pace-pearl transition"
            >
              All Paces
              <ArrowRight size={12} />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            {recentPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-[1.2rem] border border-white/5 bg-white/[0.03] transition-transform active:scale-95"
              >
                <img
                  src={photo.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-[10px] font-bold text-white/90 truncate">
                    {photo.caption}
                  </p>
                  <p className="text-[8px] uppercase tracking-wider text-pace-smoke mt-0.5">
                    {photo.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
