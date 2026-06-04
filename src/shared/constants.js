/**
 * ============================================================================
 * FILE NAME: constants.js
 * TYPE: Shared Configuration / Static Data Constants
 * PURPOSE: Centralizes all static fallback mock datasets, aesthetic pre-curated
 *          cover images, and global configuration values (mood lists) utilized by
 *          the frontend before database synchronization is active.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Exports four key variables: `covers`, `paces`, `memories`, and `moods`.
 * 2. `covers` holds high-quality Unsplash image URLs optimal for background displays.
 * 3. `paces` provides three pre-designed mockup Spaces (e.g. Chennai Nights, Final Semester)
 *    so a final-year CS student or beginner running the app locally can instantly test the
 *    visual layout without connecting to Supabase storage tables first.
 * 4. `memories` holds mock scrapbook items (Photo notes, Voice recordings, Text quotes)
 *    to pre-hydrate the horizontal dashboard timeline.
 * 5. `moods` acts as the single source of truth for the list of visual mood badge themes.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - Pure Javascript data declaration module. No external dependencies.
 * ============================================================================
 */

/**
 * covers
 * An array of high-fidelity, aesthetic Unsplash photographic image URLs.
 * Used as preset cover selections during Pace space creations or edits.
 */
export const covers = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=75",
  "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=800&q=75"
];

/**
 * paces
 * Fallback spaces mimicking real DB records for instant prototype loading.
 * Each Pace features pre-configured background gradients (`color`) and cover art.
 */
export const paces = [
  {
    id: "chennai",
    title: "Chennai Nights",
    mood: "late-night",
    members: ["Me", "Riya", "Aadhi", "Noor"],
    last: "12 min ago",
    snippet: "auto rides, bad karaoke, and the sea looking like a secret",
    color: "from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25",
    cover: covers[1],
    collage: [covers[1], covers[3], covers[5]]
  },
  {
    id: "semester",
    title: "Final Semester",
    mood: "nostalgic",
    members: ["Me", "Kavin", "Isha"],
    last: "Yesterday",
    snippet: "we kept saying this was the last normal week",
    color: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
    cover: covers[0],
    collage: [covers[0], covers[2], covers[4]]
  },
  {
    id: "sidegig",
    title: "The SideGig Era",
    mood: "chaotic",
    members: ["Me", "Dev", "Maya", "Arun"],
    last: "3 days ago",
    snippet: "pitch decks at 2:14am and one very dramatic chai break",
    color: "from-[#8f6b67]/25 via-[#181716]/30 to-[#d7d5cf]/15",
    cover: covers[4],
    collage: [covers[4], covers[2], covers[1]]
  }
];

/**
 * memories
 * Pre-loaded, nostalgic memory posts displaying different message types
 * (Photo, Voice, Text note) in the local offline mockup dashboard feed.
 */
export const memories = [
  {
    id: "chennai_1",
    type: "photo",
    author: "Riya",
    time: "11:42 PM",
    date: "April 18",
    caption: "Marina was louder than all of us tonight.",
    image: covers[1],
    mood: "alive"
  },
  {
    id: "chennai_2",
    type: "voice",
    author: "Aadhi",
    time: "1:08 AM",
    date: "April 19",
    caption: "A voice note that starts as gossip and ends as life advice.",
    mood: "soft"
  },
  {
    id: "chennai_3",
    type: "text",
    author: "Me",
    time: "2:17 AM",
    date: "April 19",
    caption:
      "I think we will miss the version of ourselves that only existed in this city, under these lights.",
    mood: "core-memory"
  },
  {
    id: "chennai_4",
    type: "photo",
    author: "Noor",
    time: "6:21 PM",
    date: "April 20",
    caption: "Proof that golden hour can forgive almost anything.",
    image: covers[3],
    mood: "warm"
  }
];

/**
 * moods
 * Single source of truth defining all valid creative mood visual themes
 * supported in the Pace application.
 */
export const moods = ["chaotic", "peaceful", "late-night", "nostalgic", "soft", "adventure", "core-memory"];

/**
 * mockConversations
 * High-fidelity conversation listings for direct messaging and Pace group chats.
 */
export const mockConversations = [
  {
    id: "conv_arjun",
    type: "direct",
    title: "Arjun",
    userId: "user_arjun",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    lastMessage: "Marina was louder than all of us tonight.",
    timestamp: "12 min ago",
    unreadCount: 2,
    online: true,
    stats: "4 Paces · 267 Memories",
    recentMemoryImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75"
  },
  {
    id: "conv_riya",
    type: "direct",
    title: "Riya",
    userId: "user_riya",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    lastMessage: "Who is up for bad karaoke tonight?",
    timestamp: "1 hr ago",
    unreadCount: 0,
    online: true,
    stats: "2 Paces · 84 Memories",
    recentMemoryImage: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=800&q=75"
  },
  {
    id: "conv_chennai",
    type: "pace_group",
    paceId: "chennai",
    title: "Chennai Nights",
    avatar: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75",
    lastMessage: "Aadhi shared a voice note",
    timestamp: "3 hrs ago",
    unreadCount: 0,
    online: false,
    stats: "4 members · 189 Memories",
    recentMemoryImage: null
  },
  {
    id: "conv_semester",
    type: "pace_group",
    paceId: "semester",
    title: "Final Semester",
    avatar: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=75",
    lastMessage: "we kept saying this was the last normal week",
    timestamp: "Yesterday",
    unreadCount: 0,
    online: false,
    stats: "3 members · 72 Memories",
    recentMemoryImage: null
  }
];

/**
 * mockMessages
 * Indexed by conversation ID to represent chronological text/memory chat logs.
 */
export const mockMessages = {
  conv_arjun: [
    {
      id: "msg_1",
      sender_id: "user_arjun",
      sender_name: "Arjun",
      sender_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      type: "text",
      content: "Hey! Did you see the photos from last night?",
      created_at: "2026-06-03T19:30:00Z"
    },
    {
      id: "msg_2",
      sender_id: "me",
      sender_name: "Me",
      type: "text",
      content: "Yeah, Riya uploaded a couple of them. They look super nostalgic already.",
      created_at: "2026-06-03T19:32:00Z"
    },
    {
      id: "msg_3",
      sender_id: "user_arjun",
      sender_name: "Arjun",
      sender_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      type: "memory_card",
      content: "This one is my absolute favorite. Look at the lighting.",
      reference_memory_id: "mem_1",
      reference_memory: {
        id: "mem_1",
        type: "photo",
        author: "Riya",
        date: "April 18",
        caption: "Marina was louder than all of us tonight.",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75",
        pace_title: "Chennai Nights"
      },
      created_at: "2026-06-03T19:33:00Z"
    },
    {
      id: "msg_4",
      sender_id: "me",
      sender_name: "Me",
      type: "voice",
      content: "Voice note",
      media_url: "mock-voice.mp3",
      created_at: "2026-06-03T19:35:00Z"
    },
    {
      id: "msg_5",
      sender_id: "user_arjun",
      sender_name: "Arjun",
      sender_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
      type: "pace_card",
      content: "Let's put everything in this Pace.",
      reference_pace_id: "chennai",
      reference_pace: {
        id: "chennai",
        title: "Chennai Nights",
        members: ["Me", "Riya", "Aadhi", "Noor"],
        memoriesCount: 189,
        cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75"
      },
      created_at: "2026-06-03T20:33:00Z"
    }
  ],
  conv_riya: [
    {
      id: "msg_riya_1",
      sender_id: "user_riya",
      sender_name: "Riya",
      sender_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      type: "text",
      content: "Are we going out this Friday?",
      created_at: "2026-06-03T18:00:00Z"
    },
    {
      id: "msg_riya_2",
      sender_id: "me",
      sender_name: "Me",
      type: "text",
      content: "Yes! Definitely. Chai and sunset at Marina beach?",
      created_at: "2026-06-03T18:05:00Z"
    },
    {
      id: "msg_riya_3",
      sender_id: "user_riya",
      sender_name: "Riya",
      sender_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      type: "text",
      content: "Who is up for bad karaoke tonight?",
      created_at: "2026-06-03T19:45:00Z"
    }
  ],
  conv_chennai: [
    {
      id: "msg_ch_1",
      sender_id: "user_riya",
      sender_name: "Riya",
      sender_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      type: "text",
      content: "Just uploaded the Marina photos! 🌊",
      created_at: "2026-06-03T17:10:00Z"
    },
    {
      id: "msg_ch_2",
      sender_id: "user_aadhi",
      sender_name: "Aadhi",
      sender_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      type: "voice",
      content: "Gossip time",
      media_url: "mock-voice-2.mp3",
      created_at: "2026-06-03T17:15:00Z"
    }
  ],
  conv_semester: [
    {
      id: "msg_sem_1",
      sender_id: "user_kavin",
      sender_name: "Kavin",
      sender_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      type: "text",
      content: "Can't believe exams are finally over.",
      created_at: "2026-06-02T15:00:00Z"
    },
    {
      id: "msg_sem_2",
      sender_id: "me",
      sender_name: "Me",
      type: "text",
      content: "we kept saying this was the last normal week",
      created_at: "2026-06-02T15:10:00Z"
    }
  ]
};

/**
 * mockReactions
 * Reactions/Echoes associated with memories.
 */
export const mockReactions = {
  "chennai_1": [
    { user_id: "user_riya", user_name: "Riya", emoji: "❤️‍🔥" },
    { user_id: "user_aadhi", user_name: "Aadhi", emoji: "🥹" }
  ],
  "chennai_2": [
    { user_id: "user_arjun", user_name: "Arjun", emoji: "🫂" }
  ]
};

/**
 * mockRelationshipStats
 * Statistics and computed timeline for the RelationshipProfile screen.
 */
export const mockRelationshipStats = {
  user_arjun: {
    name: "Arjun",
    friendshipDuration: "Friends for 3 years, 2 months",
    stats: [
      { label: "Shared Paces", value: 4, icon: "Layers" },
      { label: "Shared Memories", value: 267, icon: "Heart" },
      { label: "Photos", value: 142, icon: "Image" },
      { label: "Voice Notes", value: 58, icon: "Mic" },
      { label: "Videos", value: 19, icon: "Video" },
      { label: "Locations", value: 12, icon: "MapPin" }
    ],
    aiRecap: {
      text: "You created 267 memories together over 3 years. Most of your memories happened during late-night outings and college events. Your most active Pace was Chennai Nights.",
      sparkles: true
    },
    timeline: [
      { id: "t1", date: "April 18, 2024", type: "memory", label: "First memory together", detail: "Marina beach sunset" },
      { id: "t2", date: "May 2, 2024", type: "pace", label: "First Pace created", detail: "Chennai Nights space" },
      { id: "t3", date: "July 2025", type: "milestone", label: "Most active month", detail: "43 memories added" },
      { id: "t4", date: "Jan 12, 2026", type: "milestone", label: "100th Memory milestone", detail: "Scrapbook photo in sidegig" }
    ],
    sharedMemories: [
      {
        id: "sh_mem_1",
        type: "photo",
        author: "Arjun",
        date: "April 18",
        caption: "Late night drives around Chennai 🚗",
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=75",
        mood: "late-night"
      },
      {
        id: "sh_mem_2",
        type: "photo",
        author: "Me",
        date: "May 5",
        caption: "Chai break at 2 AM",
        image: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=800&q=75",
        mood: "chaotic"
      },
      {
        id: "sh_mem_3",
        type: "voice",
        author: "Arjun",
        date: "June 10",
        caption: "Arjun singing bad karaoke",
        mood: "soft"
      }
    ]
  },
  user_riya: {
    name: "Riya",
    friendshipDuration: "Friends for 1 year, 6 months",
    stats: [
      { label: "Shared Paces", value: 2, icon: "Layers" },
      { label: "Shared Memories", value: 84, icon: "Heart" },
      { label: "Photos", value: 52, icon: "Image" },
      { label: "Voice Notes", value: 12, icon: "Mic" },
      { label: "Videos", value: 4, icon: "Video" },
      { label: "Locations", value: 5, icon: "MapPin" }
    ],
    aiRecap: {
      text: "You and Riya captured 84 moments together. You share a love for high-energy weekend trips and food reviews. Your common Pace is Final Semester.",
      sparkles: true
    },
    timeline: [
      { id: "tr1", date: "Jan 10, 2025", type: "memory", label: "First memory together", detail: "Final semester group study" },
      { id: "tr2", date: "Feb 15, 2025", type: "pace", label: "Joined Final Semester Pace", detail: "Nostalgic memories of college" }
    ],
    sharedMemories: [
      {
        id: "sh_mem_r1",
        type: "photo",
        author: "Riya",
        date: "Feb 12",
        caption: "Library sessions that are 90% talking 🤫",
        image: "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=800&q=75",
        mood: "nostalgic"
      }
    ]
  }
};

