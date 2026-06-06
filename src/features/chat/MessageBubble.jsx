/**
 * ============================================================================
 * FILE NAME: MessageBubble.jsx
 * TYPE: Sub-Component
 * PURPOSE: Renders chat message payloads. Formats text, handles voice simulation
 *          waveforms, and builds glassmorphic cards for memory/pace references.
 * ============================================================================
 */

import React, { useState } from "react";
import { Play, Pause, ExternalLink, Calendar, Users, Layers } from "lucide-react";

export default function MessageBubble({ message, isMe, setView, setActivePace }) {
  const { type, content, reference_memory, reference_pace } = message;

  // Voice player mockup state
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOpenPace = (paceId) => {
    if (paceId && setActivePace) {
      // Mock finding pace by ID or just use reference pace details
      const matchedPace = reference_pace || { id: paceId, title: "Pace Space", cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=75", members: ["Me"] };
      setActivePace(matchedPace);
      setView("timeline");
    }
  };

  // Text message bubble styling
  if (type === "text") {
    return (
      <div
        className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed tracking-wide backdrop-blur-md ${
          isMe
            ? "bg-gradient-to-br from-[#8f6b67]/22 to-[#cfc6ba]/5 border border-white/10 text-pace-pearl rounded-tr-sm shadow-[0_4px_16px_rgba(245,241,234,0.02)]"
            : "bg-gradient-to-br from-[#191816]/90 to-[#10100f]/85 border border-white/[0.05] text-pace-bone rounded-tl-sm shadow-sm"
        }`}
      >
        <p className="leading-relaxed">{content}</p>
      </div>
    );
  }

  // Voice message bubble styling
  if (type === "voice") {
    return (
      <div
        className={`rounded-2xl p-3 flex items-center gap-3 min-w-[210px] backdrop-blur-md ${
          isMe
            ? "bg-gradient-to-br from-[#8f6b67]/22 to-[#cfc6ba]/5 border border-white/10 text-pace-pearl rounded-tr-sm shadow-sm"
            : "bg-gradient-to-br from-[#191816]/90 to-[#10100f]/85 border border-white/[0.05] text-pace-pearl rounded-tl-sm shadow-sm"
        }`}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-pace-pearl hover:bg-white/20 active:scale-95 transition"
        >
          {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} className="ml-0.5" fill="currentColor" />}
        </button>

        {/* Mock Waveform Lines */}
        <div className="flex items-center gap-0.5 flex-1 h-6">
          {[4, 10, 8, 14, 18, 12, 6, 8, 16, 20, 14, 10, 8, 12, 6, 4].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full transition-colors duration-300 ${
                isPlaying ? "bg-pace-pearl" : "bg-pace-smoke/40"
              }`}
              style={{
                height: `${h}px`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        <span className="text-[10px] text-pace-smoke font-medium">0:12</span>
      </div>
    );
  }

  // Memory Card message styling
  if (type === "memory_card" && reference_memory) {
    return (
      <div
        className="rounded-[1.4rem] overflow-hidden border border-white/10 bg-[#121110]/90 text-left max-w-[280px] shadow-glow"
      >
        {reference_memory.image && (
          <div className="relative aspect-[4/3] w-full">
            <img
              src={reference_memory.image}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121110] to-transparent" />
          </div>
        )}
        <div className="p-3.5">
          <p className="text-sm font-medium text-pace-pearl leading-relaxed">
            "{reference_memory.caption}"
          </p>
          
          <div className="mt-3 flex items-center justify-between text-[10px] text-pace-smoke border-t border-white/5 pt-2">
            <span className="flex items-center gap-1 font-semibold">
              <Layers size={10} />
              {reference_memory.pace_title}
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Calendar size={10} />
              {reference_memory.date}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Pace Card message styling
  if (type === "pace_card" && reference_pace) {
    return (
      <div
        onClick={() => handleOpenPace(reference_pace.id)}
        className="rounded-[1.4rem] overflow-hidden border border-white/10 bg-[#121110]/95 text-left max-w-[280px] cursor-pointer hover:border-white/20 active:scale-[0.98] transition shadow-glow"
      >
        <div className="relative h-24 w-full">
          <img
            src={reference_pace.cover}
            alt=""
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/30 to-black/20" />
          
          <div className="absolute bottom-2 left-3">
            <h4 className="text-base font-semibold text-pace-pearl">{reference_pace.title}</h4>
          </div>
        </div>
        
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-[11px] text-pace-smoke font-medium">
              <Users size={12} />
              {reference_pace.members?.length || 2} members
            </span>
            <span className="text-[10px] text-pace-smoke/60">
              {reference_pace.memoriesCount || 0} shared memories
            </span>
          </div>
          
          <span className="flex items-center gap-1 text-xs font-bold text-pace-pearl">
            Open
            <ExternalLink size={12} />
          </span>
        </div>
      </div>
    );
  }

  // Fallback for unrecognized types
  return (
    <div className="rounded-[1.2rem] px-4 py-2.5 bg-white/[0.03] text-pace-smoke text-sm">
      Unsupported message type.
    </div>
  );
}
