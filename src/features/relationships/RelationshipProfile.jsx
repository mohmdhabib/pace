/**
 * ============================================================================
 * FILE NAME: RelationshipProfile.jsx
 * TYPE: View Feature Component
 * PURPOSE: The friendship-centered profile view. Features overlapping avatars,
 *          AI recap insights, friendship milestones timeline, and shared memories filterable grid.
 * ============================================================================
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Sparkles,
  Layers,
  Heart,
  Image,
  Mic,
  Video,
  MapPin,
  Calendar,
  Compass
} from "lucide-react";
import Avatar from "../../shared/ui/Avatar";
import { mockRelationshipStats } from "../../shared/constants";

export default function RelationshipProfile({
  userId = "user_arjun",
  setView,
  paces = [],
  setActivePace
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Get data for target user from mock stats or default to Arjun
  const profileData = mockRelationshipStats[userId] || mockRelationshipStats.user_arjun;
  const friendName = profileData.name;

  const handleBack = () => {
    // Return to chat thread (conv_arjun or conv_riya)
    setView("chats");
  };

  const handleOpenPace = (paceId) => {
    const matchedPace = paces.find((p) => p.id === paceId);
    if (matchedPace) {
      setActivePace(matchedPace);
      setView("timeline");
    }
  };

  // Icon mapping for stats
  const iconMap = {
    Layers: <Layers size={14} className="text-pace-smoke" />,
    Heart: <Heart size={14} className="text-pace-smoke" />,
    Image: <Image size={14} className="text-pace-smoke" />,
    Mic: <Mic size={14} className="text-pace-smoke" />,
    Video: <Video size={14} className="text-pace-smoke" />,
    MapPin: <MapPin size={14} className="text-pace-smoke" />
  };

  // Filtering shared memories
  const filteredMemories = profileData.sharedMemories.filter((mem) => {
    if (activeFilter === "all") return true;
    return mem.type === activeFilter;
  });

  return (
    <motion.div
      className="flex h-full flex-col bg-[#0d0d0c] text-pace-pearl relative text-left"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header Bar */}
      <header className="flex items-center justify-between p-4 sticky top-0 z-20 bg-[#0d0d0c]/80 backdrop-blur-md">
        <button
          onClick={handleBack}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.05] border border-white/5 text-pace-bone active:scale-95 transition"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-pace-smoke">Relationship Profile</h2>
        <div className="w-9 h-9" /> {/* Spacer */}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pb-12 px-5 space-y-8 no-scrollbar">
        
        {/* Avatars Section with Overlapping Visuals */}
        <div className="relative pt-6 flex flex-col items-center text-center">
          {/* Overlapping Circles */}
          <div className="flex items-center justify-center -space-x-6">
            <div className="rounded-full border-4 border-[#0d0d0c] z-10 shadow-glow">
              <Avatar
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                name="Me"
                size="xl"
              />
            </div>
            <div className="rounded-full border-4 border-[#0d0d0c] shadow-glow">
              <Avatar
                src={userId === "user_riya" 
                  ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                  : "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"}
                name={friendName}
                size="xl"
              />
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight text-pace-pearl">
            Me × {friendName}
          </h1>
          <p className="mt-1 text-xs text-pace-smoke uppercase tracking-widest font-semibold">
            {profileData.friendshipDuration}
          </p>
        </div>

        {/* Stats Grid (3x2) */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            {profileData.stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-[1.2rem] border border-white/10 bg-white/[0.04] p-3 text-center flex flex-col items-center justify-center"
              >
                <div className="flex items-center gap-1.5 justify-center mb-1">
                  {iconMap[stat.icon]}
                </div>
                <div className="text-xl font-bold text-pace-pearl leading-none mt-1">
                  {stat.value}
                </div>
                <div className="text-[10px] text-pace-smoke font-semibold uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Recap Highlight */}
        {profileData.aiRecap && (
          <section className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-[#121110] p-4 shadow-glow">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-pace-smoke font-bold">
              <Sparkles size={13} className="text-amber-400" />
              Friendship Recap
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-pace-bone">
              {profileData.aiRecap.text}
            </p>
          </section>
        )}

        {/* Friendship Timeline */}
        <section>
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
            Friendship Timeline
          </h3>
          <div className="relative border-l border-white/10 ml-4 pl-6 space-y-6">
            {profileData.timeline.map((item) => (
              <div key={item.id} className="relative">
                {/* Connector Dot */}
                <span className="absolute -left-[31px] top-1 flex h-2.5 w-2.5 rounded-full bg-pace-pearl border border-[#0d0d0c]" />
                
                {/* Content Box */}
                <div className="rounded-[1.2rem] border border-white/5 bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-pace-smoke font-bold">
                      {item.date}
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[8px] font-bold text-pace-bone uppercase tracking-wider">
                      {item.type}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-pace-pearl">{item.label}</h4>
                  <p className="text-xs text-pace-smoke mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shared Paces Grid */}
        <section>
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
            Shared Paces
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            {paces
              .filter((p) => p.members.includes(friendName) || p.members.includes("Me"))
              .map((pace) => (
                <div
                  key={pace.id}
                  onClick={() => handleOpenPace(pace.id)}
                  className="relative aspect-[4/3] w-48 shrink-0 overflow-hidden rounded-[1.3rem] border border-white/10 bg-white/[0.03] cursor-pointer hover:border-white/20 active:scale-95 transition"
                >
                  <img
                    src={pace.cover}
                    alt=""
                    className="h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <p className="text-[10px] text-pace-smoke uppercase tracking-wider font-semibold">
                      {pace.mood}
                    </p>
                    <h4 className="text-base font-bold text-pace-pearl mt-0.5">{pace.title}</h4>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Shared Memories Gallery with Filters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold">
              Shared Gallery
            </h3>

            {/* Gallery Filters */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {["all", "photo", "voice"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                    activeFilter === filter
                      ? "bg-pace-pearl text-pace-black"
                      : "bg-white/[0.04] text-pace-smoke hover:text-pace-pearl"
                  }`}
                >
                  {filter}s
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {filteredMemories.length === 0 ? (
              <div className="col-span-2 text-center py-6 text-xs text-pace-smoke">
                No items match this filter.
              </div>
            ) : (
              filteredMemories.map((mem) => (
                <div
                  key={mem.id}
                  className="rounded-[1.2rem] border border-white/5 bg-white/[0.02] overflow-hidden text-left"
                >
                  {mem.image ? (
                    <img
                      src={mem.image}
                      alt=""
                      className="aspect-square w-full object-cover border-b border-white/5"
                    />
                  ) : (
                    <div className="aspect-square w-full bg-white/[0.04] border-b border-white/5 flex items-center justify-center text-pace-smoke">
                      <Mic size={24} />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-pace-pearl leading-relaxed line-clamp-2">
                      "{mem.caption}"
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-pace-smoke font-bold">
                      <span>{mem.author}</span>
                      <span>{mem.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </motion.div>
  );
}
