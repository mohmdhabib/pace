import React from "react";

export default function PhoneChrome({ children }) {
  return (
    <div className="relative flex min-h-[calc(100vh-2.25rem)] md:min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/80 shadow-soft backdrop-blur-2xl mx-auto w-full max-w-[485px] md:my-8">
      <div className="absolute left-1/2 top-3 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/18" />
      {children}
    </div>
  );
}
