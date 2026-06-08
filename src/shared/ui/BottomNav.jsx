/**
 * ============================================================================
 * FILE NAME: BottomNav.jsx
 * TYPE: Shared UI Component
 * PURPOSE: Premium glassmorphic bottom navigation bar with cinematic glow effects.
 *          Serves as the main routing interface for the mobile experience.
 * ============================================================================
 */

import React from "react";
import { Compass, Layers, MessageCircle, Bell, User, Camera } from "lucide-react";

/**
 * BottomNav Component
 * @param {Object} props
 * @param {String} props.activeTab - Currently selected tab id.
 * @param {Function} props.setActiveTab - State setter to switch tabs.
 * @param {Number} props.unreadChatsCount - Unread messages badge count.
 * @param {Boolean} props.hasNewActivity - Flag to display activity notification indicator.
 */
export default function BottomNav({
  activeTab,
  setActiveTab,
  unreadChatsCount = 0,
  hasNewActivity = false
}) {
  const tabs = [
    { id: "home", label: "Home", icon: Compass },
    { id: "paces", label: "Paces", icon: Layers },
    { id: "chats", label: "Chats", icon: MessageCircle, badge: unreadChatsCount },
    { id: "activity", label: "Activity", icon: Bell, badge: hasNewActivity },
    { id: "profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0d0d0c]/85 backdrop-blur-2xl pb-[safe-area-inset-bottom] pt-2">
      <div className="mx-auto flex max-w-[430px] items-center justify-between px-6 py-1 relative">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 transition-all duration-300 active:scale-95 ${
                isActive ? "text-pace-pearl scale-105" : "text-pace-smoke/60 hover:text-pace-smoke/80"
              }`}
            >
              <Icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(244,238,227,0.5)]" : ""} />
              <span className="text-[10px] font-semibold tracking-wider uppercase">{tab.label}</span>
            </button>
          );
        })}

        {/* Central Oversized Camera Button */}
        <button
          onClick={() => setActiveTab("camera")}
          className="absolute left-1/2 -top-6 -translate-x-1/2 h-16 w-16 bg-pace-pearl rounded-full shadow-[0_4px_24px_rgba(244,238,227,0.4)] flex items-center justify-center text-pace-black transition-transform active:scale-90 hover:scale-105"
        >
          <Camera size={26} className="fill-pace-black" />
        </button>

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 transition-all duration-300 active:scale-95 ${
                isActive ? "text-pace-pearl scale-105" : "text-pace-smoke/60 hover:text-pace-smoke/80"
              }`}
            >
              <div className="relative">
                <Icon size={20} className={isActive ? "drop-shadow-[0_0_8px_rgba(244,238,227,0.5)]" : ""} />
                {tab.id === "chats" && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ff4a4a] px-1 text-[9px] font-bold text-white shadow-[0_0_6px_rgba(255,74,74,0.5)]">
                    {tab.badge}
                  </span>
                )}
                {tab.id === "activity" && tab.badge && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                )}
              </div>
              <span className="text-[10px] font-semibold tracking-wider uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
