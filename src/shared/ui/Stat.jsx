import React from "react";

export default function Stat({ value, label }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-3 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-pace-smoke">{label}</div>
    </div>
  );
}
