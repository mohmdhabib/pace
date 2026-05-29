# Pace

Pace is a premium mobile-first social memory app prototype: private shared spaces for friendship eras, trips, semesters, late nights, and temporary phases of life.

## Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Supabase client ready through `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## Run

```bash
npm install
npm run dev
```

For Supabase, copy `.env.example` to `.env` and add your project URL and publishable key.
Run `supabase/schema.sql` in your Supabase SQL editor to create the private Pace tables, policies, triggers, and indexes.

## Included Screens

- Cinematic onboarding with Apple/Google/email entry points
- Home with active private Paces and image-led memory cards
- Create Pace flow with mood presets and invite affordance
- Pace timeline with AI recap, polaroid photo memories, text memories, and animated voice notes
- Add memory modal with media, caption, mood, date, people, and location-ready UI
- Memory capsule lock flow
- Minimal profile with no social metrics

## Supabase Model

- `profiles`: private user identity for Pace
- `paces`: private memory spaces with mood, cover, and theme
- `pace_members`: owner/member access for every Pace
- `memories`: text, photo, voice, video, and screenshot memories
- `pace_invites`: private invite tokens
- `ai_recaps`: AI-generated emotional recaps

The UI keeps a polished prototype fallback when Supabase keys are missing, then switches to live auth and sync when `.env` is configured.
