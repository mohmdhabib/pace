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
    type: "photo",
    author: "Riya",
    time: "11:42 PM",
    date: "April 18",
    caption: "Marina was louder than all of us tonight.",
    image: covers[1],
    mood: "alive"
  },
  {
    type: "voice",
    author: "Aadhi",
    time: "1:08 AM",
    date: "April 19",
    caption: "A voice note that starts as gossip and ends as life advice.",
    mood: "soft"
  },
  {
    type: "text",
    author: "Me",
    time: "2:17 AM",
    date: "April 19",
    caption:
      "I think we will miss the version of ourselves that only existed in this city, under these lights.",
    mood: "core-memory"
  },
  {
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
