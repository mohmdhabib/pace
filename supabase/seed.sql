-- ============================================================================
-- SQL Script: seed.sql
-- PURPOSE: Seeds the Pace database with two interactive users (Arjun and Riya)
--          along with their profiles, a shared Pace space, memories, and messages.
-- ============================================================================

-- 1. Create seed users in auth.users table
-- (Triggers on_auth_user_created will automatically execute, but we'll also insert
-- into public.profiles directly to guarantee they exist with display details)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user,
  created_at,
  updated_at
) VALUES 
(
  '00000000-0000-0000-0000-000000000000',
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'authenticated', 
  'authenticated',
  'arjun@example.com', 
  crypt('password123', gen_salt('bf')), 
  now(), 
  now(),
  '{"provider": "email", "providers": ["email"]}', 
  '{"full_name": "Arjun Dev", "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"}', 
  false,
  false,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'authenticated', 
  'authenticated',
  'riya@example.com', 
  crypt('password123', gen_salt('bf')), 
  now(), 
  now(),
  '{"provider": "email", "providers": ["email"]}', 
  '{"full_name": "Riya Sen", "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}', 
  false,
  false,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Directly insert/upsert into public.profiles to ensure visual detail syncing
INSERT INTO public.profiles (
  id, 
  display_name, 
  avatar_url, 
  created_at
) VALUES
(
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'Arjun Dev', 
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', 
  now()
),
(
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'Riya Sen', 
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 
  now()
)
ON CONFLICT (id) DO UPDATE 
SET 
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url;

-- 3. Create a shared Pace space owned by Arjun Dev
INSERT INTO public.paces (
  id,
  owner_id,
  title,
  description,
  mood,
  cover_url,
  color_theme,
  created_at,
  updated_at
) VALUES (
  'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', -- Owned by Arjun
  'Marina Sunset Drives',
  'auto rides, bad karaoke, and the sea looking like a secret',
  'late-night',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75',
  'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25',
  now() - interval '5 days',
  now()
) ON CONFLICT (id) DO NOTHING;

-- 4. Establish memberships for Arjun and Riya in the Pace space
INSERT INTO public.pace_members (
  pace_id, 
  user_id, 
  role, 
  created_at
) VALUES
(
  'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'owner', 
  now() - interval '5 days'
),
(
  'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'member', 
  now() - interval '4 days'
)
ON CONFLICT (pace_id, user_id) DO NOTHING;

-- 5. Seed nostalgic Memories in the shared Pace space
INSERT INTO public.memories (
  id,
  pace_id,
  author_id,
  type,
  caption,
  mood,
  media_url,
  location_name,
  memory_at,
  created_at
) VALUES 
(
  'd1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', -- Posted by Riya
  'photo',
  'Marina was louder than all of us tonight.',
  'alive',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=75',
  'Marina Beach',
  now() - interval '3 days',
  now() - interval '3 days'
),
(
  'd2f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'c5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', -- Posted by Arjun
  'text',
  'I think we will miss the version of ourselves that only existed in this city, under these lights.',
  'core-memory',
  null,
  'Besant Nagar Avenue',
  now() - interval '2 days',
  now() - interval '2 days'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Seed a Direct Message conversation and message logs between Arjun and Riya
INSERT INTO public.conversations (
  id, 
  type, 
  title, 
  created_at, 
  updated_at
) VALUES (
  'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'direct', 
  'Arjun & Riya', 
  now() - interval '2 days', 
  now()
) ON CONFLICT (id) DO NOTHING;

-- Add Arjun and Riya as members of this DM conversation
INSERT INTO public.conversation_members (
  conversation_id, 
  user_id, 
  joined_at
) VALUES
(
  'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  now() - interval '2 days'
),
(
  'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', 
  now() - interval '2 days'
)
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Insert seed message exchanges between Arjun and Riya
INSERT INTO public.messages (
  id, 
  conversation_id, 
  sender_id, 
  type, 
  content, 
  created_at
) VALUES
(
  'f1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'a5f22ea6-e9b1-4c3e-9fae-05a26b40c3b2', -- Arjun
  'text',
  'Hey Riya, did you upload the Marina sunset pictures yet?',
  now() - interval '1 day'
),
(
  'f2f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'e1f22ea6-e9b1-4c3e-9fae-05a26b40c3b2',
  'b1b22ea6-e9b1-4c3e-9fae-05a26b40c3b2', -- Riya
  'text',
  'Yes! Just uploaded them to our shared Marina Sunset Drives pace! They look so nostalgic 🌊✨',
  now() - interval '23 hours'
)
ON CONFLICT (id) DO NOTHING;
