-- ============================================================================
-- Pace Schema V2: Relationship-Centered Messaging
-- Run AFTER schema.sql. Adds conversations, messages, reactions.
-- ============================================================================

-- CONVERSATIONS
-- Supports both direct (1:1) and pace_group (tied to a Pace) types.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'pace_group')),
  pace_id uuid references public.paces(id) on delete set null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CONVERSATION MEMBERS
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

-- MESSAGES
-- Supports text, image, voice, memory_card (reference to a memory), pace_card (reference to a pace)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'text' check (type in ('text', 'image', 'voice', 'memory_card', 'pace_card')),
  content text,
  media_url text,
  reference_memory_id uuid references public.memories(id) on delete set null,
  reference_pace_id uuid references public.paces(id) on delete set null,
  created_at timestamptz not null default now()
);

-- REACTIONS on memories ("Echoes")
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (memory_id, user_id, emoji)
);

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;

-- Helper: check if user is a conversation member
create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

-- RLS policies for conversations
create policy "members can read conversations"
  on public.conversations for select
  using (public.is_conversation_member(id));

create policy "authenticated users can create conversations"
  on public.conversations for insert
  with check (auth.uid() is not null);

create policy "members can update conversations"
  on public.conversations for update
  using (public.is_conversation_member(id));

-- RLS policies for conversation_members
create policy "members can read conversation memberships"
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id));

create policy "authenticated users can add conversation members"
  on public.conversation_members for insert
  with check (auth.uid() is not null);

-- RLS policies for messages
create policy "members can read messages"
  on public.messages for select
  using (public.is_conversation_member(conversation_id));

create policy "members can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id)
  );

-- RLS policies for reactions
create policy "pace members can read reactions"
  on public.reactions for select
  using (
    exists (
      select 1 from public.memories m
      where m.id = reactions.memory_id
      and public.is_pace_member(m.pace_id)
    )
  );

create policy "pace members can add reactions"
  on public.reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.memories m
      where m.id = reactions.memory_id
      and public.is_pace_member(m.pace_id)
    )
  );

create policy "users can remove own reactions"
  on public.reactions for delete
  using (user_id = auth.uid());

-- Auto-update conversations.updated_at when a new message arrives
create or replace function public.update_conversation_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger on_message_sent
  after insert on public.messages
  for each row execute function public.update_conversation_timestamp();

-- Indexes for performance
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists reactions_memory_idx on public.reactions(memory_id);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists conversations_updated_idx on public.conversations(updated_at desc);
create index if not exists conversations_pace_idx on public.conversations(pace_id);
