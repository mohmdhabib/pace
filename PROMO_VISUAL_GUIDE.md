# PromoShowcase - Scene-by-Scene Visual Guide

## Quick Reference: What Happens in Each Scene

```
Timeline Layout:
0s ──────────┬────────────┬────────────┬────────────┬─ 60s
   Cold Open │ Auth Entry │   Memories │  Recap Box │ PH Launch
   0-3s      │  11-14s    │   18-24s   │   32-37s   │ 48-60s
```

---

## Scene Breakdown with Visual Details

### 🎬 Scene 0: Cold Open (0-3s)
**Visual:** Black screen with rapid flashing transitions
```
Timeline:
0.0-0.35s: White flash (Instagram grid) → "128,492 followers"
0.35-0.70s: Black flash (TikTok interface) → "@trending_now #fyp #viral"
0.70-1.05s: Dark blue (Analytics) → "1,247,839 followers +12,340 today"
1.05-1.5s: Black (Emotional hit) → "1.2M people liked. Do they know you?"
1.5-2.0s: Silence (all black)
2.0-3.0s: Reveal tagline with fade-in animation
```

**Typography:**
- Large serif font (36-48px) in pace-pearl
- Italic subtext in pace-wine
- Smooth fade in/out between messages

**Color Shift:**
- White → Black → Dark Blue (#1a1a2e) → Black → Tagline text

---

### 🎬 Scene 1: Brand Reveal (3-7s)
**Visual:** Dark centered composition with animated logo

```
Timeline:
3.0-3.8s: Logo scales in (0.8 → 1.0) with glow
3.8-4.5s: Concentric borders pulse
4.0-6.2s: Letter-spacing animates on "PACE" text
5.0-7.0s: Tagline fades in below
```

**Components:**
- **Logo:** Moon icon (24px) inside circle (80px diameter)
  - Fill: pace-pearl (#f5f1ea)
  - Background: Radial gradient (center transparent → edge black)
  - Glow: `shadow-glow` class (CSS glow effect)
  - Border pings at scale 0.9, opacity 0.25
  
- **Text:** "PACE"
  - Font: Display (serif), 48px
  - Animation: letter-spacing 0.1em → 0.55em over 2.2s
  - Color: pace-pearl with drop-shadow
  
- **Tagline:** "Private rooms for your friendship eras."
  - Font: sans, 14px
  - Color: pace-bone with 0.8 opacity
  - Timing: Delayed 1.4s from start

**Background:** Radial gradient orb at center (500x500px), blur 140px

---

### 🎬 Scene 2: Invite Flow (7-11s)
**Visual:** Two phones with animated arc connector

```
Timeline Structure:
7.0-7.7s: Left phone slides in (animate from x: -50, rotate: -3)
7.0-7.7s: Right phone slides in (animate from x: +50, rotate: 3) but opacity: 0.25
7.7-9.0s: Arc connector draws (SVG path animation, strokeDashoffset)
9.0-10.0s: Right phone activates (opacity: 1, content fades in)
10.0-11.0s: "Join this era →" button highlight
```

**Left Phone - Sender:**
- Title: "Kyoto in the Rain" (pace-wine italic)
- Action: "Invite someone"
- Link display: `pace.app/join/kyoto-k2x9` (monospace)
  - Background: rgba(207, 198, 186, 0.05) with shimmer animation
  - Shimmer moves left-to-right over 2s, repeats with 1s delay
- Button: "Send Invite" (pace-pearl bg, pace-black text)
- Success: "✓ Link sent!" (text-pace-moss)

**Arc Connector:**
- SVG curve (quadratic Bézier from left to right)
- Stroke: rgba(210, 197, 177, 0.35)
- Animated draw: strokeDashoffset from 90 → 0 over 0.9s
- End point dot appears after animation

**Right Phone - Receiver:**
- Initially: Lock icon + "Waiting for invite..."
- After arc: Invitation card slides in
  - Emoji: 🌧️ (28px)
  - Title: "Kyoto in the Rain"
  - Meta: "by Aarav · 3 members"
  - Button: "Join this era →" (pace-pearl, bold)
  - Background: Gradient from #8f6b67/20 to transparent

**Phone Frame Specs:**
- Dimensions: 175px wide × 350px tall
- Border radius: 34px
- Border: 7px #181816
- Notch: 52px wide × 15px tall (positioned top-center)
- Shadow: `0 30px 70px rgba(0,0,0,0.9)`

---

### 🎬 Scene 3: Auth OTP (11-14s)
**Visual:** Phone with OTP entry form

```
Timeline:
11.0-11.8s: First box lights up (0 → "8")
11.8-12.6s: Second box (0 → "3")
12.6-13.3s: Third box (0 → "2")
13.3-14.0s: Fourth box (0 → "1")
13.3-14.0s: Success badge fades in
```

**OTP Inputs:**
- 4 boxes, each 48px × 56px
- Empty state: border-white/10, bg-white/0.01
- Filled state: border-pace-pearl, bg-white/5, shadow-glow
- Transition duration: 300ms

**Numeric Keypad:**
- 3×3 grid (9 buttons)
- Idle: bg-transparent, text-pace-bone
- Active (pressed): bg-rgba(245,241,234,0.15), scale: 0.92, color: #f5f1ea
- Smooth transitions on numeric input

**Success Badge:**
- Icon: ✓ (Check from lucide)
- Text: "Identity Verified"
- Style: border border-pace-moss/20, bg-pace-moss/5, rounded-2xl
- Color: text-pace-moss
- Appears at 3.3s into scene

**Left HUD Text:**
- "PRIVACY SANDBOX" (icon: Lock)
- Headline: "Secure, invite-only entrance."
- Body: "No passwords to leak. A quick verification code..."
- Slide in from left with 0.7s duration

---

### 🎬 Scene 4: Library of Eras (14-18.5s)
**Visual:** Home dashboard with pace card stack

```
Timeline:
14.0-14.6s: Dashboard title + 3 cards appear with stagger
14.6-16.4s: Cards in neutral position
16.4-18.0s: Kyoto card elevates (scale: 1.02)
17.0-18.5s: Feed scrolls up, FAB button pulses
18.0-18.5s: Prepare for transition to camera
```

**Card Stack (3 cards):**

**Card 1: "Kyoto in the Rain 🌧️"** (Active/Featured)
- Colors: `from-[#8f6b67]/25 via-neutral-900/40 to-neutral-950`
- Mood: "nostalgic" (text-pace-smoke, 7px)
- Title: "Kyoto in the Rain 🌧️" (11px, bold)
- Snippet: "rain on temple roofs and coffee"
- Cover image: Unsplash photo-1503899036084-c55cdd92da26 (right-aligned thumb)
- Badge: Red pulse (animated scale 1→1.15) showing "3" (new items)
- Avatars: 3 small circles (R, A, N) with initials
- State: Fully opaque (opacity: 1), scale: 1.02 during hover phase
- Click animation: scale 0.96 when user hovers

**Card 2 & 3:** Similar but faded (opacity: 0.4, 0.3) and offset lower

**Camera FAB Button:**
- Position: Absolute, bottom-4, right-4
- Size: 44px diameter circle
- Background: pace-wine (#8f6b67)
- Icon: Camera (18px, pace-pearl)
- Shadow: `0 4px 16px rgba(143,107,103,0.4)`
- Animation: Pulsing (scale 1 → 1.1 → 1) continuously
- On interaction: scale 0.88

**Scroll Animation (3.4-4.0s):**
- Feed translates upward by -60px
- Duration: 0.6s with easeInOut timing

---

### 🎬 Scene 5: Capture & Drop (18.5-24s)
**Visual:** Camera interface → Timeline of polaroids

```
PHASE A: Camera (18.5-20.7s)
18.5-19.2s: Camera feed visible
19.5-20.2s: Mood selector appears (3 options)
20.0-20.5s: Shutter button animates (scale pulsing)
20.5-20.7s: White flash (photo capture)

PHASE B: Timeline (20.7-24s)
20.7-21.5s: Timeline transition in
21.5-24.0s: Polaroids scroll + rotate 3D stack
```

**Camera Feed:**
- Full screen black background
- Unsplash image: photo-1503899036084 (opacity: 0.8)
- Location badge: "🧭 Kyoto Temple" (top, bg-black/45, blur backdrop)
- Live indicator: Red badge (top-right)
- Grid overlay: Subtle crosshairs

**Mood Selector Strip:**
- 3 buttons: "🌧️ nostalgic", "✨ glowing", "🌊 flowing"
- Position: bottom-20, left-4, right-4
- Active state: scale 1.05, bg-white, border-white
- Idle state: bg-black/30, border-white/10

**Shutter Button:**
- Circle border (white, 4px), diameter: 56px
- Inner circle (red, diameter: 40px)
- Glow: `shadow-[0_0_12px_rgba(220,38,38,0.5)]`
- Animation: Scale pulsing 1 → 1.1 → 1 continuously
- On capture (20.5-20.7s): Freezes and white flash overlay

**Timeline View (20.7s+):**
- Header: "Timeline" (8px label)
- Polaroid stack with 3D perspective
- **Motion:** Each polaroid animates in from top
  - translate3d: 0, -300px, 0 → 0, final_y, final_z
  - rotate: starting angle → final angle
  - scale: 0.95 → 1.0

**Polaroid Card Details:**
- Dimensions: 280px wide × ~200px tall
- Border-radius: 16px
- Photo: aspect-ratio 4/3
- Caption text: 10px, pace-pearl (or pace-black on light cards)
- Author: "Name · time · location" (8px, pace-smoke)
- Background: White/cream colors (different shade per card)
- Shadows: Depth-based (closer = stronger shadow)

**Polaroid Positions (3D Stack):**
1. **Me (just now):** y: 0, rotate: -1.5°, scale: 1.0, z: 15
2. **Aarav (same moment):** y: 10, rotate: 3°, scale: 0.88, z: 5
3. **Riya (1 day ago):** y: -25, rotate: -2.5°, scale: 0.85, z: 20 (scrolls in)
4. **Arjun (2 days ago):** y: -30, rotate: 1.8°, scale: 0.83, z: 0 (scrolls in)
5. **Aadhi (3 days ago):** y: -35, rotate: -3.5°, scale: 0.84, z: 10 (scrolls in)
6. **Riya (4 days ago):** y: -40, rotate: 4°, scale: 0.82, z: 25 (scrolls in)

**Scroll Trigger:**
- Starts at 21.5s relative to scene start (20.7 + 0.8)
- Progress: (currentTime - 3.1) / 1.8 (normalized 0-1 over 1.8s window)
- Transform: `translate3d(0, ${scrollY}px, 0)` where scrollY = progress × -380

---

### 🎬 Scene 6: Pulse Drop (24-28s)
**Visual:** Daily mood emoji selector → Friend pulse reveal

```
Timeline:
24.0-24.8s: Emoji grid appears
24.8-26.2s: Selection phase (user can "pick")
26.2-26.4s: Moon emoji highlights
26.4-26.8s: "Drop my pulse" button appears
26.8-27.6s: Transition to reveal phase
27.6-28.0s: Friend pulses animate in
```

**Emoji Grid:**
- 4 columns × 3 rows (12 emojis total)
- Each emoji: 80px diameter circle
- Default: border-white/5, bg-white/0.03, rounded-xl
- Hover/Active: border-white/30, bg-white/10
- Gap: 6px between items
- Font size: 28px emoji
- Label: 6px, text-pace-smoke, uppercase
- Stagger animation: delay each by i*0.04s

**Selected Emoji (🌙 at index 3):**
- Scale: 0.88 when clicked
- Border glows: border-white/30
- Box-shadow: custom glow

**"Drop my pulse" Button:**
- Full width, py-2.5
- Background: pace-pearl
- Text: "🌙 Drop my pulse" (pace-black, 11px, bold)
- Animation: Appears with opacity/scale in at 26.4s
- On click (26.8-26.9s): scale 0.92 feedback
- Transitions to reveal phase

**Reveal Phase Content:**

**Your Pulse Display:**
- Large circle (64px), border border-white/15, bg-white/5
- Centered emoji: 48px
- Text: "Your pulse today" (9px, text-pace-smoke)

**Friend Pulses (reveal in sequence):**
- Each friend row: flex items-center justify-between
- Left: Avatar circle (24px) + name + "just now"
- Right: Large emoji (32px)
- Background: border border-white/5, bg-white/0.03
- Animation: rotateY flip effect (scale: 0 → 1), spring timing
- Stagger: 0.5s between each friend

**Friend Data:**
1. Riya (avatar bg-#8f6b67, emoji 🥹)
2. Arjun (avatar bg-#7d8577, emoji ⚡)
3. Aadhi (avatar bg-#cfc6ba, emoji 🌙)

**Background Animation:**
- Red/wine color orb (background position changes)
- Opacity: pulses between 0.05 → 0.15

---

### 🎬 Scene 7: Voice Memory (28-32s)
**Visual:** Voice memo playback with animated audio spectrum

```
Timeline:
28.0-28.5s: Header image loads
28.5-32.0s: Audio spectrum animates continuously
28.0-29.2s: Title + content fade in
29.2-32.0s: Quote text appears (italic, glowing)
```

**Header Section:**
- Image: photo-1495567720989 (Unsplash)
- Overlay: gradient-to-b from-black/25 to-#0d0d0c
- Title: "Late Night Chai" (18px, pace-pearl, bold)
- Mood: "late-night" (8px, text-pace-bone, uppercase)
- Close button: ChevronLeft (top-left)

**Audio Spectrograph:**
- Container: rounded-2xl, border border-white/10, bg-#161514
- Dimensions: Full width, h-56 (224px)
- Bars: 28 total bars arranged horizontally
- **Bar Properties:**
  ```
  id: 1-28
  Height range: 8px to 60px
  Stagger delay: 0.10s to 1.45s (0.05s increments)
  Animation cycle: 1.4s per loop, infinite
  Height animation: 6px → height → 8px → height*0.7 → 6px
  ```
- Colors: Each bar is `bg-pace-pearl/45`
- Spacing: gap-[2.5px] between bars
- Vertical centering: flex items-center h-14

**Audio Label:**
- Icon: Volume2 (12px, text-pace-pearl, animate-pulse)
- Text: "Aadhi voice memo" (9px, font-bold, uppercase)
- Background: border border-white/10, bg-white/5, rounded-full, px-3
- Glowing pulse border (scale: 0.95, border-white/10)

**Transcribed Quote:**
- Container: bg-white/0.02, border border-white/5, rounded-xl, p-3
- Text: "Aadhi at 1:08 AM — 'I told you this would become a core memory.'"
- Font: 11px, text-pace-bone, italic, leading-relaxed

---

### 🎬 Scene 8: AI Recap (32-37s)
**Visual:** Animated AI summary card with typewriter text

```
Timeline:
32.0-32.5s: Card appears with shimmer
32.5-35.5s: Text types out character-by-character
35.5-36.0s: Sentiment bar appears (animated fill)
36.0-37.0s: Complete and hold
```

**Recap Card:**
- Container: rounded-2xl, border-[#d2c5b1]/20, bg-gradient-to-br from-white/5 to-#1c1a18
- Padding: p-5
- Shadow: shadow-glow (custom CSS)
- Overflow: hidden (for shimmer animation)

**Shimmer Effect:**
- Gradient bar: `bg-gradient-to-r from-transparent via-[#d2c5b1]/8 to-transparent`
- Animation: Translates from left to right over 3s
- Cycle: Repeats infinitely with 1s delay between cycles
- Transform: skew-x-12

**AI Badge:**
- Icon: Bot (13px)
- Text: "AI-GENERATED RECAP" (8.5px, text-[#d2c5b1], uppercase, tracking-[0.2em])
- Flex gap: 1.5

**Typewriter Text Animation:**
```javascript
const full = "Kyoto in the Rain felt nostalgic and deep...";
// Streams character by character starting at t=0.5s
// Speed: ~35 chars/sec
// Continues until t=3.0s (duration of scene = 5s, text fills ~2.5s)
```

- Font: 12px, text-pace-pearl, leading-relaxed
- Min height: 96px (ensures consistent height)
- Cursor animation (simulated with inline block):
  - Width: 2px, height: 14px
  - Background: pace-pearl
  - Blink: 0.8s step-end infinite
  - Inline: `inline-block w-[2px] h-3.5 bg-pace-pearl ml-0.5 translate-y-[2px]`

**Sentiment Bar (appears at 35.5s):**
- Container: border-t border-white/5, pt-3, mt-4
- Labels: "nostalgic" ← → "deep" (8px, text-pace-smoke)
- Bar background: h-1, bg-white/10, rounded-full, overflow-hidden
- Animated fill:
  - Gradient: from-pace-wine to-#d2c5b1
  - Width animates: 0% → 78% over 1.0s with 0.2s delay
  - Border-radius: rounded-full

**Summary Line:**
- Flex justify-between, text-8px, text-pace-smoke
- Text: "Kyoto trip sentiment · nostalgic & deep"

---

### 🎬 Scene 9: Capsule Lock (37-41s)
**Visual:** Lock confirmation → 3D phone rotation

```
Timeline:
37.0-38.0s: Lock dialog appears
38.0-38.6s: Confirmation animates
38.6-40.4s: Phone rotates away (3D transform)
39.0-41.0s: Overlay caption animates in
40.4-41.0s: Phone hidden, lock seal effect
```

**Lock Dialog (on phone screen):**
- Container: absolute inset-0, p-5, flex flex-col justify-between, bg-#080807
- Icon: Archive (18px, text-pace-bone)
- Heading: "Lock this era?" (20px, font-bold, text-pace-pearl)
- Metadata: "Kyoto in the Rain · 3 members · 24 memories"

**3D Phone Animation:**
- `getCameraStyles()` function handles all 13 scenes of camera positioning
- For scene 9:
  - If t < 37 + 1.8s: translate3d(0, 0, 90px), rotateX(0), rotateY(0)
  - If t >= 37 + 1.8s: translate3d(0, 100px, -400px), rotateX(30deg), rotateY(-20deg), opacity(0)
- Duration: 1.2s for exit animation
- Easing: cubic-bezier(0.16, 1, 0.3, 1)

**Overlay Caption (39-41s):**
- Full screen dark overlay
- Center flex column
- First line (39.0-39.6s): *"Some eras are meant to end."*
  - Opacity: 0 → 1, y: 20 → 0
- Second line (39.6-40.2s): *"Pace makes sure they're never forgotten."*
  - Same animation with delay
- Divider: h-px, w-32, bg-pace-bone/20 (appears at 40.2s)

---

### 🎬 Scene 10: Zero Metrics (41-44.5s)
**Visual:** Clean interface with no metrics

```
Timeline:
41.0-44.5s: Phone displays metric-free UI
41.0-42.0s: Phone animates into view
42.0-44.5s: Hold state
```

**Phone Content:**
- Clean layout showing just shared memories
- No follower counts, likes, engagement metrics
- Simple, peaceful design

---

### 🎬 Scene 11: Social Proof Mosaic (44.5-48.5s)
**Visual:** 3 phone cards in staggered layout showing real eras

```
Timeline:
44.5-45.5s: 3 cards animate in (staggered 0.15s each)
45.5-46.5s: Counter starts counting (0 → 2847)
46.5-47.5s: Cards hold, counter completes
47.5-48.5s: "Your era is waiting" tagline fades in
```

**Card Layout:**
- 3 cards arranged horizontally with slight rotation + depth
- Gap: 20px between cards
- Stagger animation: 0s, 0.15s, 0.3s delays

**Card 1: "Graduation Week 🎓"** (rot: -6°, y: 20px)
**Card 2: "Goa 2026 🌊"** (rot: 0°, y: 0px) - Center card
**Card 3: "3am Philosophy ☁️"** (rot: 6°, y: 20px)

**Individual Card Structure:**
- Frame: w-36, h-[270px], rounded-3xl, border-6, shadow intense
- Header image: aspect-3/2, rounded-xl, opacity-85
- Mood badge: text-pace-wine or #ff7954, 6.5px
- Title: 9.5px, font-bold, text-pace-pearl
- Avatar row: -space-x-1, stacked circles (3-4 avatars)
- "Recent memories" thumbnail gallery:
  - 3 items: 2 images + "+XX more" counter
  - Size: 28px × 36px each
- Footer: Memory count + lock icon

**Counter Animation:**
- Large number: "2,847"
- Position: Center flex column, items-center justify-center
- Font: 48px, font-black, tabular-nums
- Animation: Counts from 0 to 2,847 in 2.0s window (44.5-46.5s)
- Text below: "eras created. counting." (text-xs, text-pace-smoke, uppercase)

**Tagline:**
- Text: "Your era is waiting."
- Font: 20px, font-display, italic, text-pace-bone/70
- Animation: Fade in at 47.5s

---

### 🎬 Scene 12: Product Hunt Outro (48.5-60s)
**Visual:** Logo + PH badge + cinematic closing

```
Timeline:
48.5-49.2s: Logo animates in (spring)
49.2-50.8s: Brand name reveals
50.8-51.8s: Tagline fades in
51.8-52.8s: PH badge animates in
53.0-54.0s: First closing line appears
54.0-55.0s: Second closing line appears
55.0-60.0s: Hold, fade

```

**Logo Section:**
- Moon icon: 38px, text-pace-black
- Container: w-20, h-20, rounded-full, bg-pace-pearl, flex items-center justify-center
- Shadow: shadow-glow, border border-white/20
- Animation: scale 0.7 → 1.0, spring physics (stiffness: 60, damping: 15)

**Brand Name:**
- Text: "PACE SOCIAL"
- Font: 36px, font-bold, uppercase, font-display, pl-4
- Animation: letter-spacing 0.2em → 0.45em over 1.6s (delay: 0.3s)
- Color: text-pace-pearl

**Tagline:**
- Text: "Private rooms for your friendship eras"
- Font: 12px, tracking-[0.22em], uppercase, font-semibold
- Color: text-pace-smoke/60
- Opacity animation: 0 → 0.6 over 0.8s (delay: 0.8s)

**Product Hunt Badge:**
- Gradient background: from-[#da552f] to-[#ff7954]
- Padding: p-[1.5px]
- Inner container: rounded-2xl, bg-#0c0807, px-6, py-4
- Layout: flex items-center, gap-4
- **Left element:** Circle (44px) with "P" letter
  - Font: 28px, font-extrabold, text-white
  - Background: #da552f
  - Centered flex
- **Right element:** Text column
  - Label: "FEATURED ON" (10px, tracking-widest, text-#ff7954)
  - Brand: "PRODUCT HUNT" (16px, font-extrabold, text-white)
- Shimmer animation: gradient bar over 2.2s, repeats with 1.5s delay
- Animation entrance: opacity 0 → 1, y 30 → 0 (delay: 1.1s, spring)

**Closing Tagline (Cinematic):**
- Center text-center, space-y-1

Line 1 (53.0s):
```
"We live life in phases."
Font: 16px, font-display, italic, text-pace-pearl
Animation: opacity 0 → 1, y 10 → 0 (delay: 0s within this segment)
```

Line 2 (54.0s):
```
"Hold them privately."
Font: 16px, font-display, italic, text-pace-bone
Animation: opacity 0 → 1, y 10 → 0 (delay: 0s)
```

Line 3 (55.0s):
```
"— Pace"
Font: 12px, text-pace-smoke, tracking-widest, uppercase
Animation: opacity 0 → 0.4 (fade subtle, not prominent)
```

---

## 🎨 Color Palette Reference

```css
/* Primary Colors */
--pace-pearl: #f5f1ea     /* Warm white, primary text/accents */
--pace-bone: #cfc6ba      /* Warm grey, secondary text */
--pace-black: #080807     /* Deep black, primary background */
--pace-smoke: #9b9289     /* Taupe grey, labels/hints */

/* Accent Colors */
--pace-wine: #8f6b67      /* Dusty rose, highlights/active states */
--pace-moss: #77a872      /* Sage green, success/verified */

/* UI Colors */
--frame-bg: #0c0c0b       /* Phone frame */
--surface-dark: #161514   /* Deep UI surfaces */
--surface-light: #f4eee3  /* Polaroid cards */
--border-light: rgba(255,255,255,0.05)
--border-accent: rgba(210,197,177,0.35)

/* Gradients */
--kyoto-gradient: from-[#8f6b67]/25 via-neutral-900/40 to-neutral-950
--glow-gradient: radial-gradient(ellipse at center, transparent 30%, #080807 100%)
```

---

## 🎬 Animation Library

### Spring Animations (Reusable)
```javascript
// Entrance spring (fast, playful)
{type: "spring", stiffness: 200, damping: 20}

// Standard spring (natural)
{type: "spring", stiffness: 60, damping: 15}

// Slow spring (dramatic)
{type: "spring", stiffness: 40, damping: 18}
```

### Easing Functions (Reusable)
```javascript
// Premium easing (main transitions)
easingPremium = [0.16, 1, 0.3, 1]  // cubic-bezier

// Ease in/out
easeInOut = "easeInOut"

// Ease out
easeOut = "easeOut"
```

### Transition Durations
- **UI Elements:** 0.3s (buttons, icons)
- **Scene Transitions:** 0.7s - 0.9s (fade in/out)
- **Text Animations:** 0.6s - 2.2s (typewriter, reveal)
- **3D Transforms:** 1.2s - 1.5s (phone rotations)

---

## 📸 Screenshot Moments

Key moments to capture for documentation:

1. **Scene 0:** Social media metrics flashing (0.35s, 0.70s, 1.05s)
2. **Scene 1:** PACE logo centered (4.5s)
3. **Scene 2:** Two phones with arc connector (8.5s)
4. **Scene 3:** OTP "8321" filled (13.5s)
5. **Scene 4:** Kyoto card highlighted in feed (16s)
6. **Scene 5:** Polaroid stack with 6 memories (22s)
7. **Scene 6:** Friend pulses revealed (27.5s)
8. **Scene 7:** Audio spectrum animating (30s)
9. **Scene 8:** AI recap text streaming (34s)
10. **Scene 9:** Phone rotating away (39s)
11. **Scene 11:** 3 era cards + "2,847" counter (47s)
12. **Scene 12:** PACE SOCIAL + PH badge (52s)

---

## 🔧 Developer Notes

- **Image Loading:** Pre-load all Unsplash images in `useEffect` before scenes 4-5
- **Performance:** Use `requestAnimationFrame` for smooth 60fps playback
- **Responsive:** Component scales based on viewport, assumes 1920x1080+ for demo
- **Accessibility:** HUD can be toggled; video plays without sound (subtitled)
- **Exports:** Consider exporting as MP4 after finalizing for social media sharing

