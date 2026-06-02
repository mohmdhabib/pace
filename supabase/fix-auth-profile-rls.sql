drop policy if exists "users can create own profile" on public.profiles;
create policy "users can create own profile"
  on public.profiles for insert
  with check (id = auth.uid());

drop policy if exists "users can upsert own profile" on public.profiles;
create policy "users can upsert own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

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
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
