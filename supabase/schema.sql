create extension if not exists "pgcrypto";

create type public.pace_role as enum ('owner', 'member');
create type public.pace_mood as enum (
  'chaotic',
  'peaceful',
  'late-night',
  'nostalgic',
  'soft',
  'adventure',
  'core-memory'
);
create type public.memory_type as enum ('photo', 'text', 'voice', 'video', 'screenshot');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.paces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()::uuid references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text,
  mood public.pace_mood not null default 'nostalgic',
  cover_url text,
  color_theme text not null default 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pace_members (
  pace_id uuid not null references public.paces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.pace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (pace_id, user_id)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  pace_id uuid not null references public.paces(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.memory_type not null default 'text',
  caption text,
  mood text,
  media_url text,
  location_name text,
  memory_at timestamptz not null default now(),
  locked_until timestamptz,
  ai_caption text,
  ai_mood text,
  created_at timestamptz not null default now()
);

create table public.pace_invites (
  id uuid primary key default gen_random_uuid(),
  pace_id uuid not null references public.paces(id) on delete cascade,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  email text,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

create table public.ai_recaps (
  id uuid primary key default gen_random_uuid(),
  pace_id uuid not null references public.paces(id) on delete cascade,
  period_label text not null,
  summary text not null,
  recurring_moods text[] not null default '{}',
  highlight_memory_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.paces enable row level security;
alter table public.pace_members enable row level security;
alter table public.memories enable row level security;
alter table public.pace_invites enable row level security;
alter table public.ai_recaps enable row level security;

create or replace function public.is_pace_member(target_pace_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pace_members
    where pace_id = target_pace_id and user_id = auth.uid()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pace_members (pace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_pace_created
  after insert on public.paces
  for each row execute function public.add_owner_membership();

create or replace function public.set_pace_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid()::uuid;
  end if;
  return new;
end;
$$;

create trigger before_insert_pace
  before insert on public.paces
  for each row execute function public.set_pace_owner();

create policy "profiles are visible to shared pace members"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.pace_members mine
      join public.pace_members theirs on theirs.pace_id = mine.pace_id
      where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
    )
  );

create policy "users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users can create own profile"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "members can read paces"
  on public.paces for select
  using (owner_id = auth.uid()::uuid or public.is_pace_member(id));

create policy "users can create paces"
  on public.paces for insert
  with check (owner_id = auth.uid());

create policy "owners can update paces"
  on public.paces for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "members can read memberships"
  on public.pace_members for select
  using (public.is_pace_member(pace_id));

create policy "owners can invite members"
  on public.pace_members for insert
  with check (
    exists (
      select 1 from public.pace_members
      where pace_id = pace_members.pace_id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

create policy "members can read memories"
  on public.memories for select
  using (public.is_pace_member(pace_id));

create policy "members can create memories"
  on public.memories for insert
  with check (author_id = auth.uid() and public.is_pace_member(pace_id));

create policy "authors can update memories"
  on public.memories for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and public.is_pace_member(pace_id));

create policy "members can read invites"
  on public.pace_invites for select
  using (public.is_pace_member(pace_id));

create policy "members can create invites"
  on public.pace_invites for insert
  with check (invited_by = auth.uid() and public.is_pace_member(pace_id));

create policy "members can read ai recaps"
  on public.ai_recaps for select
  using (public.is_pace_member(pace_id));

create or replace function public.ensure_user_profile(
  display_name_arg text default null,
  avatar_url_arg text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    auth.uid(),
    coalesce(display_name_arg, split_part(coalesce(auth.jwt()->>'email', ''), '@', 1), 'Pace friend'),
    avatar_url_arg
  )
  on conflict (id) do update
  set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url)
  returning * into profile_row;

  return profile_row;
end;
$$;

grant execute on function public.ensure_user_profile(text, text) to authenticated;

create or replace function public.create_pace(
  title_arg text,
  description_arg text default null,
  mood_arg public.pace_mood default 'nostalgic',
  cover_url_arg text default null,
  color_theme_arg text default null
)
returns public.paces
language plpgsql
security definer
set search_path = public
as $$
declare
  pace_row public.paces;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if title_arg is null or length(trim(title_arg)) = 0 then
    raise exception 'Pace title is required';
  end if;

  perform public.ensure_user_profile(null, null);

  insert into public.paces (
    owner_id,
    title,
    description,
    mood,
    cover_url,
    color_theme
  )
  values (
    current_user_id,
    trim(title_arg),
    nullif(trim(coalesce(description_arg, '')), ''),
    mood_arg,
    cover_url_arg,
    coalesce(color_theme_arg, 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25')
  )
  returning * into pace_row;

  insert into public.pace_members (pace_id, user_id, role)
  values (pace_row.id, current_user_id, 'owner')
  on conflict (pace_id, user_id) do update set role = 'owner';

  return pace_row;
end;
$$;

grant execute on function public.create_pace(text, text, public.pace_mood, text, text) to authenticated;

create index paces_owner_id_idx on public.paces(owner_id);
create index pace_members_user_id_idx on public.pace_members(user_id);
create index memories_pace_id_memory_at_idx on public.memories(pace_id, memory_at desc);
create index pace_invites_token_idx on public.pace_invites(token);

insert into storage.buckets (id, name, public)
values ('pace-media', 'pace-media', true)
on conflict (id) do nothing;

create policy "pace media is readable"
  on storage.objects for select
  using (bucket_id = 'pace-media');

create policy "members can upload pace media"
  on storage.objects for insert
  with check (
    bucket_id = 'pace-media'
    and public.is_pace_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can update own pace media"
  on storage.objects for update
  using (
    bucket_id = 'pace-media'
    and owner = auth.uid()
    and public.is_pace_member((storage.foldername(name))[1]::uuid)
  );
