-- ============================================================================
-- SQL Script: messaging-realtime-setup.sql
-- PURPOSE: Sets up triggers to automate conversation creation and group chat
--          memberships when users create or join Paces.
-- ============================================================================

-- Create a function to automatically add a member to the Pace's group conversation
-- when they are inserted into pace_members.
create or replace function public.sync_pace_member_to_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_pace_title text;
begin
  -- Get the title of the Pace
  select title into v_pace_title from public.paces where id = new.pace_id;

  -- Get or create the pace group conversation
  select id into v_conv_id 
  from public.conversations 
  where pace_id = new.pace_id and type = 'pace_group';
  
  if v_conv_id is null then
    insert into public.conversations (type, pace_id, title)
    values ('pace_group', new.pace_id, v_pace_title)
    returning id into v_conv_id;
  end if;

  -- Add the new member to the conversation members
  insert into public.conversation_members (conversation_id, user_id)
  values (v_conv_id, new.user_id)
  on conflict (conversation_id, user_id) do nothing;

  return new;
end;
$$;

-- Create the trigger
drop trigger if exists on_pace_member_added on public.pace_members;
create trigger on_pace_member_added
  after insert on public.pace_members
  for each row execute function public.sync_pace_member_to_conversation();
