/**
 * ============================================================================
 * FILE NAME: ActivityView.jsx
 * TYPE: View Component
 * PURPOSE: Activity Feed displaying recent reactions ("Echoes"), friendship
 *          milestones, and a cinematic "On This Day" flashback memory.
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bell, Clock, Heart, Eye } from "lucide-react";
import Avatar from "../../shared/ui/Avatar";
import { fetchRecentActivities, fetchFlashback, subscribeToActivity } from "../../lib/activityApi";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function ActivityView({
  memories = [],
  paces = [],
  setView,
  setActivePace
}) {
  const [revealOnThisDay, setRevealOnThisDay] = useState(false);
  const [activities, setActivities] = useState([]);
  const [milestonesState, setMilestonesState] = useState([]);
  const [flashback, setFlashback] = useState(null);

  // Fallback Mock Data
  const mockActivities = [
    {
      id: "act-1",
      user: { name: "Riya", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" },
      text: "reacted ❤️‍🔥 to your memory",
      detail: '"Marina was louder than all of us tonight."',
      time: "12 min ago",
      type: "reaction"
    },
    {
      id: "act-2",
      user: { name: "Arjun", avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80" },
      text: "echoed 🥹 on your photo",
      detail: '"Chai break at 2 AM"',
      time: "1 hr ago",
      type: "reaction"
    },
    {
      id: "act-3",
      user: { name: "Aadhi", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
      text: "joined your new Pace",
      detail: '"The SideGig Era"',
      time: "3 days ago",
      type: "milestone"
    }
  ];

  const mockMilestones = [
    {
      id: "mile-1",
      title: "100 Shared Memories! 🎉",
      description: "You and Arjun just hit 100 shared memories together.",
      time: "Yesterday"
    },
    {
      id: "mile-2",
      title: "1 Year Anniversary",
      description: "It has been 1 year since Chennai Nights Pace was created.",
      time: "May 2"
    }
  ];

  // Fetch Live Data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!isSupabaseConfigured) {
        setActivities(mockActivities);
        setMilestonesState(mockMilestones);
        setFlashback(memories.find((m) => m.type === "photo") || memories[0]);
        return;
      }

      const fetchedActivities = await fetchRecentActivities();
      const paceIds = paces.map(p => p.id);
      const fetchedFlashback = await fetchFlashback(paceIds);

      if (isMounted) {
        setActivities(fetchedActivities.length ? fetchedActivities : mockActivities);
        setMilestonesState(mockMilestones); // Keep mock milestones until backend engine is built
        setFlashback(fetchedFlashback || (memories.find((m) => m.type === "photo") || memories[0]));
      }
    }

    loadData();

    // Subscribe to new real-time reactions
    const unsubscribe = subscribeToActivity((newActivity) => {
      if (isMounted) {
        setActivities((prev) => [newActivity, ...prev].slice(0, 20)); // keep last 20
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [paces, memories]);

  const flashbackMemory = flashback;

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-24 px-5 pt-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-pace-pearl animate-pulse" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-pace-smoke font-semibold">
              Updates
            </p>
          </div>
          <h1 className="mt-2 text-4xl font-semibold leading-none text-pace-pearl">Activity</h1>
        </header>

        {/* On This Day Flashback */}
        {flashbackMemory && (
          <section className="mb-8">
            <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold flex items-center gap-1.5">
              <Clock size={12} />
              On This Day
            </h3>
            
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#121110] p-4 shadow-glow">
              {/* Flashback Cover (Blurred until revealed) */}
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
                <img
                  src={flashbackMemory.image || "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=75"}
                  alt=""
                  className={`h-full w-full object-cover transition-all duration-1000 ${
                    revealOnThisDay ? "blur-0 scale-100 opacity-90" : "blur-xl scale-110 opacity-40"
                  }`}
                />
                
                {/* Reveal Overlay */}
                <AnimatePresence>
                  {!revealOnThisDay && (
                    <motion.div
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-sm"
                      exit={{ opacity: 0 }}
                    >
                      <button
                        onClick={() => setRevealOnThisDay(true)}
                        className="flex items-center gap-2 rounded-full bg-pace-pearl px-5 py-2.5 text-xs font-bold text-pace-black shadow-glow active:scale-95 transition"
                      >
                        <Eye size={14} />
                        Reveal 1 Year Ago
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Memory details, visible after reveal */}
              {revealOnThisDay && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 border-t border-white/5 pt-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-pace-smoke font-bold">
                    One year ago today in Chennai Nights
                  </p>
                  <h4 className="mt-1.5 text-base font-medium leading-relaxed text-pace-pearl">
                    "{flashbackMemory.caption}"
                  </h4>
                  <p className="mt-2 text-xs text-pace-smoke">
                    Shared by {flashbackMemory.author} · {flashbackMemory.mood}
                  </p>
                </motion.div>
              )}
            </div>
          </section>
        )}

        {/* Recent Reactions / Echoes */}
        <section className="mb-8">
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold flex items-center gap-1.5">
            <Heart size={12} />
            Echoes & Activity
          </h3>

          <div className="space-y-4">
            {activities.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between border-b border-white/[0.04] pb-4"
              >
                <div className="flex gap-3 min-w-0">
                  <Avatar src={act.user.avatar} name={act.user.name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-pace-pearl leading-snug">
                      <span className="font-bold">{act.user.name}</span> {act.text}
                    </p>
                    <p className="text-xs text-pace-smoke truncate mt-0.5 max-w-[240px]">
                      {act.detail}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-pace-smoke/60 shrink-0 ml-3 font-medium">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Milestones */}
        <section className="mb-4">
          <h3 className="mb-4 text-xs uppercase tracking-[0.2em] text-pace-smoke font-semibold flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            Milestones
          </h3>

          <div className="space-y-3">
            {milestonesState.map((mile) => (
              <div
                key={mile.id}
                className="rounded-[1.2rem] border border-white/5 bg-white/[0.02] p-4 flex justify-between items-start"
              >
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-pace-pearl">{mile.title}</h4>
                  <p className="text-xs text-pace-smoke leading-relaxed mt-1">
                    {mile.description}
                  </p>
                </div>
                <span className="text-[10px] text-pace-smoke shrink-0 ml-4 font-semibold uppercase tracking-wider">
                  {mile.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
