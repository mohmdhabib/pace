import React from "react";
import { X } from "lucide-react";

export default function Close({ onClose }) {
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] transition hover:bg-white/[0.1] active:scale-95"
      onClick={onClose}
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );
}
