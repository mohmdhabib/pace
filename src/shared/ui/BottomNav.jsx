/**
 * ============================================================================
 * FILE NAME: BottomNav.jsx
 * TYPE: Shared UI Component
 * PURPOSE: Premium glassmorphic bottom navigation bar with cinematic glow effects.
 *          Serves as the main routing interface for the mobile experience.
 * ============================================================================
 */

import React from "react";
import { Compass, Layers, MessageCircle, HeartPulse, User } from "lucide-react";

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
    { id: "home",    label: "Home",    icon: Compass },
    { id: "paces",   label: "Paces",   icon: Layers },
    { id: "chats",   label: "Chats",   icon: MessageCircle, badge: unreadChatsCount },
    { id: "pulse",   label: "Pulse",   icon: HeartPulse,    badge: hasNewActivity },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0d0d0c]/90 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-[430px] items-end justify-between px-4 pt-2 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-[5px] px-3 py-1 transition-all duration-300 active:scale-90 ${
                isActive ? "text-pace-pearl" : "text-pace-smoke/50 hover:text-pace-smoke/80"
              }`}
            >
              {/* Icon with glow when active */}
              <div className="relative">
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.1 : 1.6}
                  className={
                    isActive
                      ? "drop-shadow-[0_0_10px_rgba(244,238,227,0.55)] transition-all duration-300"
                      : "transition-all duration-300"
                  }
                />

                {/* Chats unread badge */}
                {tab.id === "chats" && tab.badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#ff4a4a] px-[3px] text-[8px] font-bold text-white shadow-[0_0_6px_rgba(255,74,74,0.55)]">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}

                {/* Pulse drop dot — amber when friends have dropped and you haven't */}
                {tab.id === "pulse" && tab.badge && (
                  <span className="absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[9px] font-semibold tracking-[0.12em] uppercase transition-all duration-300 ${
                  isActive ? "text-pace-pearl/90" : "text-pace-smoke/40"
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator dot */}
              <span
                className={`h-[3px] w-[3px] rounded-full transition-all duration-300 ${
                  isActive ? "bg-pace-pearl/80 shadow-[0_0_4px_rgba(244,238,227,0.6)]" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
