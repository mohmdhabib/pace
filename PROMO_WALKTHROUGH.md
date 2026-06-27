# PromoShowcase - Implementation Plan & Video Walkthrough

## 📺 Overview
**Duration:** 60 seconds  
**Framework:** React + Framer Motion + Tailwind CSS  
**Component:** [PromoShowcase.jsx](src/views/PromoShowcase.jsx)  
**Total Scenes:** 13 sequential scenes  
**Playback:** Auto-play with controls (Play, Pause, Speed, HUD toggle)

---

## 🎬 13-Scene Video Timeline

### **Scene 0: Cold Open (0s - 3s) - Pattern Interrupt**
- **Goal:** Stop the viewer with a provocative question
- **Content:** Rapid flashing between social media metrics vs. reality
  - Flash 1: Instagram grid with follower count (128,492)
  - Flash 2: TikTok viral interface (@trending_now · #fyp)
  - Flash 3: Vanity metrics (1.2M followers + "+12,340 today")
  - Flash 4: Emotional hook ("1.2M people liked your post. But do they actually know you?")
- **Tagline:** 
  - Silence (1.5-2.0s)
  - "What if you stopped performing... and started remembering?"
- **Visual:** Dark background, white flashes, then back to dark with tagline

---

### **Scene 1: Brand Reveal (3s - 7s) - Logo Reveal**
- **Goal:** Introduce PACE brand with emotional positioning
- **Content:**
  - Animated moon logo with shimmer effect
  - Name reveal: "PACE" with expanding letter-spacing
  - Tagline: "Private rooms for your friendship eras."
- **Animation:**
  - Logo scales in (0.8 → 1.0) with glow effect
  - Letter-spacing animates over 2.2 seconds
  - Concentric circle borders pulse around logo
- **Color Palette:** Warm neutrals (#cfc6ba, #ebdcb9) + deep blacks
- **Vibe:** Luxury, intimate, aspirational

---

### **Scene 2: Invite Flow (7s - 11s) - Private Link**
- **Goal:** Show how to invite friends securely
- **Content:** Dual-phone animation
  - **Left phone:** Inviter UI
    - Shows "Kyoto in the Rain" pace
    - Generates private invite link: `pace.app/join/kyoto-k2x9`
    - Animated shimmer effect on link
    - Send button press
    - "Link sent!" confirmation
  - **Arc connector:** Line animation from sender to receiver
  - **Right phone:** Receiver UI (appears dimmed, then animates in)
    - Invitation card: "You're invited to Kyoto in the Rain"
    - "by Aarav · 3 members"
    - Emoji: 🌧️
    - "Join this era →" button
- **Key Message:** One private link. No strangers. No public profiles.

---

### **Scene 3: Auth OTP (11s - 14s) - OTP Entry**
- **Goal:** Show secure verification (not passwords)
- **Content:** Phone screen with OTP entry
  - Title: "Verification code"
  - 4 input boxes sequentially fill: ["8", "3", "2", "1"]
  - Numeric keypad below with animated highlights on pressed keys
  - Success badge appears: "✓ Identity Verified"
- **Timing:** Each digit enters in 0.8s intervals
- **Left HUD:** 
  - Icon: Lock
  - Headline: "Secure, invite-only entrance."
  - Copy: "No passwords to leak. A quick verification code connects you and your closest friends safely."

---

### **Scene 4: Library of Eras (14s - 18.5s) - Home Dashboard**
- **Goal:** Showcase the era collection interface
- **Content:** Home feed with 3 pace cards
  1. **"Kyoto in the Rain" 🌧️** (active, highlighted)
     - Mood: nostalgic
     - Snippet: "rain on temple roofs and coffee"
     - Members: 3 avatars
     - Badge pulse: "3" (new messages)
     - Interaction: Card scales up when clicked (2.6-2.8s)
  2. **"Vaporwave Coding" 💻** (archived, faded)
     - Mood: chaotic
  3. **"Late Night Chai" ☕** (archived, faded)
     - Mood: soft
- **Scroll Animation:** At 3.4s, feed scrolls up revealing next action
- **Camera FAB:** Pulsing red button appears for photo capture (4.0-4.2s)
- **Left HUD:**
  - Icon: Layers
  - Headline: "All your phases, held beautifully."
  - Copy: "Trips, semesters, late-night coffee runs. Private folders styled with mood presets."

---

### **Scene 5: Capture & Drop (18.5s - 24s) - Camera Shutter**
- **Goal:** Demonstrate the capture-and-drop memory mechanic
- **Part A (18.5-20.7s): Camera Mode**
  - Live camera feed with location tag: "🧭 Kyoto Temple"
  - Live indicator (red badge)
  - Mood selector strip: ["🌧️ nostalgic", "✨ glowing", "🌊 flowing"]
  - Camera shutter button (pulsing circle)
  - Animated shutter click and white flash (20.5-21.0s)
- **Part B (20.7-24s): Timeline View**
  - 3D "polaroid stack" effect
  - Memories drop in with rotation + depth perspective:
    1. "Me" (just now) — nostalgic caption
    2. "Aarav" (same moment) — positioned behind
    3. "Riya" (1 day ago) — with caption
    4. "Arjun" (2 days ago) — continues stack
    5. "Aadhi" (3 days ago) — further back
    6. "Riya" (4 days ago) — furthest back
  - Each polaroid has photo, caption, author timestamp
  - Scroll animation reveals deeper memories
- **Left HUD:**
  - Icon: Camera
  - Headline: "Snap & watch memories drop."
  - Copy: "Your photo. Their photo. Same moment. Different eyes. Both polaroid-dropped onto the timeline."

---

### **Scene 6: Pulse Drop (24s - 28s) - Daily Mood**
- **Goal:** Show the daily emoji ritual ("Pulse")
- **Part A (24-26s): Selection**
  - Title: "How are you feeling today?"
  - 12 emoji mood options grid:
    - 🔥 on fire, 🥹 emotional, ⚡ electric, 🌙 low key
    - 💫 dreamy, 😶‍🌫️ zoning, 🫂 need a hug, 🌊 flowing
    - 💀 gone, ✨ glowing, 😴 exhausted, 🤯 overwhelmed
  - At 0.8s: Moon emoji (🌙) highlights with scale animation
  - "Drop my pulse" button appears
  - User clicks button (1.6-1.9s) with scale feedback
- **Part B (26-28s): Reveal**
  - Your pulse (🌙) shows in a large circle
  - Crew pulses reveal with flip animation:
    - Riya: 🥹 emotional
    - Arjun: ⚡ electric
    - Aadhi: 🌙 low key
  - Each appears with name, avatar, and "just now" timestamp
- **Vibes:** Red color orb animates in background
- **Left HUD:**
  - Icon: ⚡
  - Headline: "One emoji. Every day."
  - Copy: "Post yours. Unlock everyone else's. The most honest check-in you'll do all day."

---

### **Scene 7: Voice Memory (28s - 32s) - Interactive Audio**
- **Goal:** Showcase voice memo playback with animated spectrum
- **Content:**
  - Header image: Late night chai vibes (from Unsplash)
  - Title: "Late Night Chai"
  - Status: "playing audio memory"
  - **Pulsing audio spectrograph:**
    - 28 bars with varying heights (8-60px)
    - Each bar animates on a staggered delay (0.10-1.45s)
    - Full wave animation cycle: 1.4s, repeating infinitely
  - Audio label: "🔊 Aadhi voice memo"
  - Transcribed quote: *"Aadhi at 1:08 AM — 'I told you this would become a core memory.'"*
- **Left HUD:**
  - Icon: Volume2
  - Headline: "Keep the voice, keep the laugh."
  - Copy: "Voice notes with an interactive pulsing spectrograph that ripples dynamically when played."

---

### **Scene 8: AI Recap (32s - 37s) - Nostalgic Recap**
- **Goal:** Show AI-generated emotional summaries
- **Content:**
  - Recap card with gradient border and shimmer effect
  - AI badge: "🤖 ai-generated recap"
  - **Typewriter text animation** (streams character-by-character):
    - "Kyoto in the Rain felt nostalgic and deep. The rainy day in Kyoto brought everyone together, and the midnight talks cemented the era as a core memory."
    - Text appears at ~35 characters per second
  - At 35s: Mood sentiment bar appears
    - "nostalgic" ← → "deep"
    - Gradient fill (pace-wine to #d2c5b1): 78% filled
  - Summary: "Kyoto trip sentiment · nostalgic & deep"
- **Shimmer effect:** Animates across card every 2-3 seconds
- **Left HUD:**
  - Icon: Bot
  - Headline: "Aesthetic emotional recaps."
  - Copy: "Pace parses your photos, dates, and captions to write poetic summaries of each era."

---

### **Scene 9: Capsule Lock (37s - 41s) - Era Sealed**
- **Goal:** Position the archive/lock feature as "sealing" memories
- **Part A (37-38.6s): Lock confirmation modal**
  - Archive icon
  - "Lock this era?" heading
  - Metadata: "Kyoto in the Rain · 3 members · 24 memories"
  - Animated confirmation
- **Part B (38.6-41s): Seal animation**
  - Phone animates into 3D perspective (hidden from front)
  - Lock confirmation badge appears
  - Capsule/seal visual effect
  - Era is now locked (archived but never lost)
- **Overlay Caption (39s - 41s):**
  - *"Some eras are meant to end."*
  - *"Pace makes sure they're never forgotten."*
  - Divider line animation
- **Left HUD:**
  - Icon: Archive
  - Headline: "Seal the era. Keep it forever."
  - Copy: "When it's over, lock the Pace. It becomes a time capsule — sealed, but never lost."

---

### **Scene 10: Zero Metrics (41s - 44.5s) - Zero Pressure**
- **Goal:** Emphasize privacy as a differentiator
- **Content:**
  - Phone shows a clean, metric-free interface
  - No followers, no like counts, no algorithm signals
  - Just shared memories
- **Message:** 0 followers. 0 likes. Just a quiet shared space.
- **Left HUD:**
  - Icon: ShieldCheck
  - Headline: "No public views. No algorithms."
  - Copy: "0 followers. 0 likes. Just a quiet shared space for your closest friends."

---

### **Scene 11: Social Proof Mosaic (44.5s - 48.5s) - 2,847 Eras**
- **Goal:** Build credibility through user-generated content showcase
- **Content:** 3 phone-mockup cards showing different eras:
  1. **"Graduation Week 🎓"** (6 members, 42 memories)
     - Image: Unsplash graduation photo
     - Mood: "euphoric" (text-pace-wine)
     - Avatars: R, A, N, +3 more
     - Thumbnail gallery (2 recent + "+40 more")
  2. **"Goa 2026 🌊"** (4 members, 89 memories)
     - Image: Beach/ocean
     - Mood: "wild" (text-[#ff7954])
     - Avatars: Ar, K, M, +1 more
  3. **"3am Philosophy ☁️"** (2 members, 17 memories)
     - Image: Night sky/philosophical vibe
     - Mood: "nostalgic" (text-[#ebdcb9])
     - Avatars: Ad, Me (no +)
- **Card animations:**
  - Enter with spring physics: `stiffness: 60, damping: 15`
  - Subtle rotation: -6°, 0°, +6°
  - Y-offset: 20px, 0px, 20px
  - Staggered delays: 0s, 0.15s, 0.3s
- **Counter animation:**
  - Large number: "2,847"
  - Counts up from 0 to 2,847 with easing
  - Text: "eras created. counting."
  - Animated in at 44.5s, completes by 47.5s
- **Tagline:** "Your era is waiting."

---

### **Scene 12: Product Hunt Outro (48.5s - 60s) - Launch**
- **Goal:** Close with brand + Product Hunt positioning
- **Content:**
  - Animated logo entrance (moon icon, scale spring animation)
  - Logo animates with shadow/glow effect
  - Brand name: "PACE SOCIAL"
    - Letter-spacing animates to 0.45em
  - Tagline: "Private rooms for your friendship eras"
  - **Product Hunt badge:**
    - Badge design with P initial (red-orange gradient)
    - Shimmer animation across badge (2.2s cycle)
    - Text: "Featured on PRODUCT HUNT"
  - **Cinematic closing tagline (staged animation):**
    - *"We live life in phases."* (2.2s)
    - *"Hold them privately."* (3.0s)
    - *"— Pace"* (4.0s, faded)

---

## 🎨 Design System

### Color Palette
```
Primary:
- pace-pearl:    #f5f1ea (warm white)
- pace-bone:     #cfc6ba (warm grey)
- pace-black:    #080807 (deep black)

Accent Colors:
- pace-wine:     #8f6b67 (dusty rose)
- pace-moss:     #77a872 (sage green)
- pace-smoke:    #9b9289 (taupe grey)

Secondary:
- pace-black:    #080807
- bg-[#0c0c0b]:  Phone frame
- bg-[#161514]:  Subtle UI elements
```

### Typography
- **Font Display:** Serif (for headings)
- **Font Sans:** Default (for body)
- **Sizes:**
  - Headings: 4xl (36px) to 6xl (48px)
  - Body: 9px to 12px
  - Labels: 7px to 8px

### Animation Principles
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (premium feel)
- **Spring physics:** `stiffness: 60-200, damping: 12-16`
- **Durations:** 0.3s to 2.2s depending on action
- **Delays:** Staggered 0.1s to 0.5s for sequence effects

---

## 🎥 Technical Implementation

### Component States
```javascript
const [currentTime, setCurrentTime] = useState(0);           // Playback position
const [isPlaying, setIsPlaying] = useState(true);            // Auto-play
const [playbackSpeed, setPlaybackSpeed] = useState(1);       // 0.5x, 1x, 1.5x, 2x
const [showGrain, setShowGrain] = useState(true);            // Film grain effect
const [showHUD, setShowHUD] = useState(true);                // Left-side text
const [capturingMode, setCapturingMode] = useState(false);   // Full-screen demo mode
const [isHUDMinimized, setIsHUDMinimized] = useState(false);  // Collapse sidebar
```

### Key Animations
1. **RAF Timer Loop:** `requestAnimationFrame()` for smooth 60fps playback
2. **Framer Motion:** `AnimatePresence` for scene transitions
3. **3D Transforms:** `perspective`, `translate3d`, `rotateX/Y/Z` for phone
4. **Staggered animations:** Sequential delays for multi-element reveals

### Image Assets
Pre-loaded from Unsplash for scenes 4 & 5:
```
- Kyoto temple: photo-1503899036084-c55cdd92da26
- Coding desk: photo-1550751827-4bd374c3f58b
- Chai/coffee: photo-1517816743773-6e0fd518b4a6
- Sunset/nature: photo-1495567720989-cebdbdd97913
- Beach/friends: photo-1493976040374-85c8e12f0c0e
- Graduation: photo-1541339907198-e08756dedf3f
- Plus 4 more...
```

---

## 🎮 Viewer Controls

### Playback Controls (HUD Top)
- **Play/Pause:** Toggle playback
- **Restart:** Jump to scene 0
- **Speed:** 0.5x, 1x, 1.5x, 2x
- **Scene Jumper:** Click timeline to jump to scene

### Display Options
- **Grain Toggle:** Film texture on/off
- **HUD Toggle:** Show/hide left sidebar text
- **Minimize:** Collapse HUD to sidebar
- **Fullscreen:** Immersive demo mode with auto-play countdown

### Keyboard Shortcuts
- **Space:** Play/Pause
- **Esc:** Exit fullscreen mode

---

## 📊 Performance Optimizations
1. Image preloading in `useEffect` before scenes 4 & 5
2. `useMemo` for expensive calculations (scroll positions, timing)
3. `AnimatePresence` mode="wait" to prevent layout shift
4. GPU acceleration via `will-change: transform`
5. Debounced window resize handlers

---

## 🚀 Launch Strategy
- **Product Hunt Featured:** PH launch badge prominently positioned
- **Social Proof:** 2,847 eras counter (animates during scene 11)
- **Emotional Arc:** Opens with social criticism → closes with brand aspiration
- **Call-to-Action:** "Your era is waiting" positions user as next creator

---

## 📝 Key Messaging Through Scenes

| Scene | Core Message | Emotion |
|-------|--------------|---------|
| 0-1 | *"Stop performing, start remembering"* | Provocative → Aspirational |
| 2-3 | *"Invite-only, secure, private"* | Exclusive & Safe |
| 4-5 | *"Capture moments beautifully"* | Tactile & Aesthetic |
| 6-7 | *"Daily rituals + voice keeps memories alive"* | Intimate & Nostalgic |
| 8-9 | *"AI writes poetry about your life"* | Poetic & Eternal |
| 10 | *"Zero metrics, zero pressure"* | Liberating |
| 11 | *"You're not alone: 2,847 eras exist"* | Social Proof |
| 12 | *"Join the movement on Product Hunt"* | Momentum & Urgency |

---

**Last Updated:** 2026-06-27  
**Component:** [src/views/PromoShowcase.jsx](src/views/PromoShowcase.jsx)  
**Status:** ✅ Production Ready
