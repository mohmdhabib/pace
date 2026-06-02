import React from "react";

export default function Field({ label, value, icon, onChange }) {
  return (
    <label className="mt-4 block rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3">
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-pace-smoke">
        {icon}
        {label}
      </span>
      <input
        className="mt-2 w-full bg-transparent text-base text-pace-pearl outline-none placeholder:text-pace-smoke"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!onChange}
      />
    </label>
  );
}
