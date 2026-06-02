import React from "react";
import { motion } from "framer-motion";
import { Mic2, Headphones } from "lucide-react";

export default function VoiceNote() {
  return (
    <div className="rounded-[1rem] bg-[#191816] p-5 text-pace-pearl">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm">
          <Mic2 size={16} />
          0:42
        </span>
        <Headphones size={17} className="text-pace-bone" />
      </div>
      <div className="flex h-28 items-center gap-1">
        {Array.from({ length: 34 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-pace-bone"
            animate={{ height: [18, 72 - (i % 9) * 4, 24 + (i % 6) * 7] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.035 }}
          />
        ))}
      </div>
    </div>
  );
}
