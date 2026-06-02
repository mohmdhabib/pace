# Pace

Pace is a premium mobile-first social memory app prototype: private shared spaces for friendship eras, trips, semesters, late nights, and temporary phases of life.

## Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Supabase client ready through `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

## Run

```bash
npm install
npm run dev
```

For Supabase, copy `.env.example` to `.env` and add your project URL and publishable key.
Run `supabase/schema.sql` in your Supabase SQL editor to create the private Pace tables, policies, triggers, and indexes.
If you already ran the original schema, run `supabase/storage.sql` once to add the media bucket and upload policies.
If sign-up works but Pace creation fails, run `supabase/fix-auth-profile-rls.sql` once to allow the app to create/repair the signed-in user's `profiles` row before inserting into `paces`.

## Auth Setup

In Supabase Auth, enable Email OTP for sign-in/sign-up. For local testing, add `http://127.0.0.1:4173` to the allowed redirect URLs. Google and Apple also need their providers enabled in Supabase before those buttons can complete OAuth.

## Included Screens

- Cinematic onboarding with Apple/Google/email entry points
- Home with active private Paces and image-led memory cards
- Create Pace flow with mood presets and invite affordance
- Pace timeline with AI recap, polaroid photo memories, text memories, and animated voice notes
- Add memory modal with media, caption, mood, date, people, and location-ready UI
- Invite link modal with private token creation
- Supabase Storage-ready memory uploads
- Realtime memory inserts inside a live Pace
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
