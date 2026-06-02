import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export default function PaceCard({ pace, onOpen, isArchived = false }) {
  const memoriesPhotos = pace.collage ? pace.collage.slice(1, 4) : [];

  return (
    <motion.button
      className={`relative h-[34rem] min-w-[92%] snap-center overflow-hidden rounded-[2rem] border text-left shadow-soft transition-all duration-300 ${isArchived
          ? "border-pace-wine/20 bg-[#120a09]/40 opacity-75 saturate-[0.3] hover:saturate-[0.8] hover:opacity-95"
          : "border-white/10 bg-white/[0.055] hover:border-white/20"
        }`}
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
    >
      <img src={pace.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className={`absolute inset-0 bg-gradient-to-b ${pace.color}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/90" />

      {/* Scrapbook Polaroid Collage Stack in Card Background */}
      {memoriesPhotos.length > 0 && (
        <div className="absolute inset-x-0 top-14 flex items-center justify-center h-44 select-none pointer-events-none">
          {memoriesPhotos.map((imgUrl, i) => {
            const rot = i === 0 ? "rotate-[-7deg]" : i === 1 ? "rotate-[6deg]" : "rotate-[-2deg]";
            const scale = i === 0 ? "scale-90 -translate-x-6 z-10" : i === 1 ? "scale-95 translate-x-6 z-20" : "scale-[0.8] z-0 opacity-40 translate-y-2";
            return (
              <div
                key={imgUrl}
                className={`absolute w-28 h-28 rounded-lg border-2 border-white bg-white/10 p-1 shadow-soft transition-transform ${rot} ${scale}`}
              >
                <img src={imgUrl} alt="" className="h-full w-full object-cover rounded-md" />
              </div>
            );
          })}
        </div>
      )}

      {isArchived && (
        <div className="absolute left-4 top-4 rounded-full border border-pace-wine/30 bg-pace-wine/25 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-pace-wine backdrop-blur-xl animate-pulse">
          Archived Era
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
        {pace.last}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="mb-4 flex -space-x-2">
          {pace.members.slice(0, 4).map((member, index) => (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-black/30 bg-pace-pearl text-[10px] font-semibold text-pace-black"
              key={`${member}-${index}`}
              style={{ transform: `translateY(${index % 2 ? 4 : 0}px)` }}
            >
              {member[0]}
            </span>
          ))}
        </div>
        <h2 className="text-4xl font-semibold leading-none">{pace.title}</h2>
        <p className="mt-3 text-sm leading-6 text-pace-bone/82 line-clamp-2">{pace.snippet}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
            {pace.mood}
          </span>
          <span className="flex items-center gap-1 text-xs text-pace-bone">
            <Users size={14} />
            {pace.members.length}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
