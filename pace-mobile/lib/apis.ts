import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import * as mock from '../constants/mockData';

// Helper checking if an ID is a live UUID from Supabase or static mock
export function isLiveId(id: string): boolean {
  if (!id) return false;
  // Live Supabase UUIDs contain hyphens and aren't mock tags
  return id.includes('-') && !id.startsWith('prototype-') && !id.startsWith('conv_') && !id.startsWith('user_');
}

// Visual theme configurations mapping to color arrays for background cards
export const themeByMood = {
  chaotic: ['rgba(143, 107, 103, 0.25)', 'rgba(24, 23, 22, 0.3)', 'rgba(215, 213, 207, 0.15)'],
  peaceful: ['rgba(201, 190, 177, 0.2)', 'rgba(35, 33, 29, 0.3)', 'rgba(125, 133, 119, 0.2)'],
  'late-night': ['rgba(210, 197, 177, 0.25)', 'rgba(98, 89, 77, 0.1)', 'rgba(143, 107, 103, 0.25)'],
  nostalgic: ['rgba(201, 190, 177, 0.2)', 'rgba(35, 33, 29, 0.3)', 'rgba(125, 133, 119, 0.2)'],
  soft: ['rgba(215, 213, 207, 0.18)', 'rgba(39, 35, 31, 0.2)', 'rgba(143, 107, 103, 0.16)'],
  adventure: ['rgba(125, 133, 119, 0.24)', 'rgba(22, 22, 21, 0.3)', 'rgba(201, 190, 177, 0.16)'],
  'core-memory': ['rgba(210, 197, 177, 0.26)', 'rgba(17, 16, 15, 0.25)', 'rgba(143, 107, 103, 0.18)']
} as const;

// --- DATETIME FORMATTING HELPERS ---

export function formatDate(value: string | Date): string {
  try {
    return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(new Date(value));
  } catch {
    return 'Recently';
  }
}

export function formatTime(value: string | Date): string {
  try {
    return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
  } catch {
    return '';
  }
}

export function relativeTime(value: string | Date): string {
  try {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.round(diff / 60000));
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  } catch {
    return 'New';
  }
}

// --- NORMALIZATION ADAPTERS ---

export function normalizePace(row: any) {
  const members = row.pace_members && row.pace_members.length > 0
    ? row.pace_members.map((member: any) => member.profiles?.display_name || 'Friend')
    : ['Me'];
  const membersDetails = row.pace_members && row.pace_members.length > 0
    ? row.pace_members.map((member: any) => ({
        id: member.profiles?.id || member.user_id,
        displayName: member.profiles?.display_name || 'Friend',
        avatarUrl: member.profiles?.avatar_url
      }))
    : [];
  const latest = row.memories?.[0];
  
  const photoMemories = row.memories
    ? row.memories
        .filter((m: any) => m.type === 'photo' && m.media_url)
        .map((m: any) => m.media_url)
        .slice(0, 3)
    : [];

  const collage = [row.cover_url, ...photoMemories].filter(Boolean);

  return {
    id: row.id,
    title: row.title,
    mood: row.mood,
    members,
    membersDetails,
    last: latest ? relativeTime(latest.created_at) : 'New Pace',
    snippet: latest?.caption || row.description || 'A private room for the moments that still glow.',
    color: row.color_theme || 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25',
    cover: row.cover_url || mock.covers[0],
    collage: collage.length > 0 ? collage : [row.cover_url || mock.covers[0]],
    archivedAt: row.archived_at
  };
}

export function normalizeMemory(row: any) {
  return {
    id: row.id,
    type: row.type || 'text',
    author: row.profiles?.display_name || 'Me',
    time: formatTime(row.memory_at),
    date: formatDate(row.memory_at),
    caption: row.caption || row.ai_caption || '',
    image: row.media_url,
    mediaUrl: row.media_url,
    mood: row.ai_mood || row.mood || 'soft',
    lockedUntil: row.locked_until,
    location: row.location_name
  };
}

function normalizeMessage(msg: any) {
  if (!msg) return null;
  return {
    id: msg.id,
    conversation_id: msg.conversation_id,
    sender_id: msg.sender_id,
    sender_name: msg.profiles?.display_name || 'Friend',
    sender_avatar: msg.profiles?.avatar_url,
    type: msg.type || 'text',
    content: msg.content,
    media_url: msg.media_url,
    created_at: msg.created_at,
    reference_memory: msg.reference_memory ? {
      id: msg.reference_memory.id,
      type: msg.reference_memory.type,
      caption: msg.reference_memory.caption,
      image: msg.reference_memory.media_url,
      date: formatDate(msg.reference_memory.memory_at),
      author: msg.reference_memory.profiles?.display_name || 'Friend',
      pace_title: msg.reference_memory.paces?.title || 'Pace Moment'
    } : null,
    reference_pace: msg.reference_pace ? {
      id: msg.reference_pace.id,
      title: msg.reference_pace.title,
      cover: msg.reference_pace.cover_url || mock.covers[0],
      mood: msg.reference_pace.mood,
      members: msg.reference_pace.pace_members?.map((m: any) => m.profiles?.display_name || 'Friend') || [],
      memoriesCount: msg.reference_pace.memories?.length || 0
    } : null
  };
}

// --- CORE TRANSACTIONS ---

export async function ensureProfile(user: any) {
  if (!supabase || !user?.id) return null;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pace friend';

  const { data: rpcData, error: rpcError } = await supabase.rpc('ensure_user_profile', {
    display_name_arg: displayName,
    avatar_url_arg: user.user_metadata?.avatar_url || null
  });

  if (!rpcError) return rpcData;

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: displayName,
      avatar_url: user.user_metadata?.avatar_url || null
    }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPaces() {
  if (!isSupabaseConfigured || !supabase) return mock.paces;
  const { data, error } = await supabase
    .from('paces')
    .select('*, pace_members(user_id, role, profiles(id, display_name, avatar_url)), memories(caption, type, media_url, created_at)')
    .order('updated_at', { ascending: false })
    .order('created_at', { foreignTable: 'memories', ascending: false })
    .limit(24);

  if (error) throw error;
  return data.map(normalizePace);
}

export async function fetchMemories(paceId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return mock.memories;
  const { data, error } = await supabase
    .from('memories')
    .select('*, profiles(display_name, avatar_url)')
    .eq('pace_id', paceId)
    .order('memory_at', { ascending: false });

  if (error) throw error;
  return data.map(normalizeMemory);
}

export async function createPace({ title, description, mood, coverUrl }: any) {
  if (!isSupabaseConfigured || !supabase) {
    const newPace = {
      id: `local-pace-${Date.now()}`,
      title,
      mood,
      members: ['Me'],
      membersDetails: [{ id: 'me', displayName: 'Me', avatarUrl: null }],
      last: 'Just now',
      snippet: description || 'A private room for the moments that still glow.',
      color: 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25',
      cover: coverUrl || mock.covers[0],
      collage: [coverUrl || mock.covers[0]],
      archivedAt: null
    };
    return newPace;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user?.id) throw new Error('You must be signed in to create a Pace.');

  const { data, error } = await supabase.rpc('create_pace', {
    title_arg: title,
    description_arg: description || null,
    mood_arg: mood,
    cover_url_arg: coverUrl || null,
    color_theme_arg: 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25'
  });

  if (error) {
    await ensureProfile(user);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('paces')
      .insert({
        owner_id: user.id,
        title,
        description: description || null,
        mood,
        cover_url: coverUrl || null,
        color_theme: 'from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25'
      })
      .select()
      .single();

    if (fallbackError) throw fallbackError;
    return normalizePace({ ...fallbackData, pace_members: [], memories: [] });
  }

  return normalizePace({ ...data, pace_members: [], memories: [] });
}

export async function createMemory(payload: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(payload.paceId)) {
    const newMemory = {
      id: `local-mem-${Date.now()}`,
      type: payload.type,
      author: 'Me',
      time: formatTime(new Date()),
      date: formatDate(new Date()),
      caption: payload.caption,
      image: payload.mediaUrl,
      mediaUrl: payload.mediaUrl,
      mood: payload.mood || 'soft',
      lockedUntil: payload.lockedUntil || null,
      location: payload.locationName
    };
    return newMemory;
  }

  const { data, error } = await supabase
    .from('memories')
    .insert({
      pace_id: payload.paceId,
      author_id: payload.authorId,
      type: payload.type,
      caption: payload.caption,
      mood: payload.mood,
      media_url: payload.mediaUrl,
      location_name: payload.locationName,
      memory_at: payload.memoryAt || new Date().toISOString(),
      locked_until: payload.lockedUntil || null
    })
    .select('*, profiles(display_name, avatar_url)')
    .single();

  if (error) throw error;
  return normalizeMemory(data);
}

export function subscribeToMemories(paceId: string, onMemory: (mem: any) => void) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return () => {};

  const channel = supabase
    .channel(`pace:${paceId}:memories`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'memories',
      filter: `pace_id=eq.${paceId}`
    }, (payload) => onMemory(normalizeMemory(payload.new)))
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}

export async function updatePace(paceId: string, updates: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return null;
  const { data, error } = await supabase
    .from('paces')
    .update(updates)
    .eq('id', paceId)
    .select('*, pace_members(role, profiles(display_name, avatar_url)), memories(caption, type, media_url, created_at)')
    .single();

  if (error) throw error;
  return normalizePace(data);
}

export async function archivePace(paceId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return null;
  return updatePace(paceId, { archived_at: new Date().toISOString() });
}

export async function unarchivePace(paceId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return null;
  return updatePace(paceId, { archived_at: null });
}

// --- INVITE API SERVICES ---

export async function fetchInviteDetails(token: string) {
  if (!isSupabaseConfigured || !supabase || !token) {
    if (token && token.startsWith('prototype-')) {
      return {
        id: token,
        paceId: 'chennai',
        invitedBy: 'prototype',
        isAccepted: false,
        pace: {
          id: 'chennai',
          title: 'Chennai Nights',
          coverUrl: mock.covers[1],
          mood: 'late-night',
          description: 'auto rides, bad karaoke, and the sea looking like a secret'
        },
        inviter: { displayName: 'Riya' }
      };
    }
    return null;
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('fetch_invite_details', {
    token_arg: token
  });

  if (!rpcError && rpcData) return rpcData;

  const { data, error } = await supabase
    .from('pace_invites')
    .select(`
      id, pace_id, invited_by, expires_at, accepted_by,
      paces (id, title, cover_url, mood, description),
      profiles:invited_by (display_name, avatar_url)
    `)
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    paceId: data.pace_id,
    invitedBy: data.invited_by,
    expiresAt: data.expires_at,
    isAccepted: Boolean(data.accepted_by),
    pace: {
      id: (data.paces as any)?.id,
      title: (data.paces as any)?.title || 'Shared Pace',
      coverUrl: (data.paces as any)?.cover_url,
      mood: (data.paces as any)?.mood,
      description: (data.paces as any)?.description
    },
    inviter: {
      displayName: (data.profiles as any)?.display_name || 'A friend'
    }
  };
}

export async function acceptInvite(token: string, paceId: string, userId: string) {
  if (!isSupabaseConfigured || !supabase || !token) return paceId || 'chennai';

  const { data: rpcData, error: rpcError } = await supabase.rpc('accept_pace_invite', {
    token_arg: token
  });

  if (!rpcError) {
    await joinPaceGroupChat(rpcData);
    return rpcData;
  }

  if (!paceId || !userId) throw new Error('Missing Pace ID or User ID for fallback joining.');

  const { error: joinError } = await supabase
    .from('pace_members')
    .insert({ pace_id: paceId, user_id: userId, role: 'member' });

  if (joinError) throw joinError;

  await supabase.from('pace_invites').update({ accepted_by: userId }).eq('token', token);
  await joinPaceGroupChat(paceId);

  return paceId;
}

export async function createInvite({ paceId, invitedBy, email }: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) {
    return {
      token: `prototype-invite-${Date.now()}`,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      url: `pace://invite?token=prototype-invite-${Date.now()}`
    };
  }

  const { data, error } = await supabase
    .from('pace_invites')
    .insert({ pace_id: paceId, invited_by: invitedBy, email: email || null })
    .select('token, expires_at')
    .single();

  if (error) throw error;
  return {
    token: data.token,
    expiresAt: data.expires_at,
    url: `pace://invite?token=${data.token}`
  };
}

// --- CHAT API SERVICES ---

export async function fetchConversations() {
  if (!isSupabaseConfigured || !supabase) return mock.mockConversations;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return mock.mockConversations;

    const { data: memberRows, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (memberError) throw memberError;
    if (!memberRows || memberRows.length === 0) return [];

    const userConvIds = memberRows.map((m) => m.conversation_id);

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        paces(id, title, cover_url, mood, pace_members(profiles(display_name))),
        conversation_members(user_id, profiles(id, display_name, avatar_url)),
        messages(id, content, type, created_at, media_url, sender_id)
      `)
      .in('id', userConvIds)
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' })
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map((conv: any) => {
      const lastMsg = conv.messages?.[0];
      let title = conv.title;
      let avatar = null;
      let userId = null;
      let online = false;
      let stats = '';

      if (conv.type === 'direct') {
        const otherMember = conv.conversation_members?.find((m: any) => m.user_id !== user.id);
        if (otherMember) {
          title = otherMember.profiles?.display_name || 'Pace Friend';
          avatar = otherMember.profiles?.avatar_url;
          userId = otherMember.profiles?.id;
          online = true;
        } else {
          title = 'Pace Friend';
        }
        stats = 'Direct Message';
      } else if (conv.type === 'pace_group') {
        title = conv.paces?.title || conv.title || 'Group Chat';
        avatar = conv.paces?.cover_url;
        const memberCount = conv.paces?.pace_members?.length || conv.conversation_members?.length || 0;
        stats = `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
      }

      let lastMsgText = 'No messages yet';
      if (lastMsg) {
        if (lastMsg.type === 'text') lastMsgText = lastMsg.content;
        else if (lastMsg.type === 'voice') lastMsgText = 'Sent a voice note';
        else if (lastMsg.type === 'memory_card') lastMsgText = 'Shared a memory';
        else if (lastMsg.type === 'pace_card') lastMsgText = 'Shared a Pace';
      }

      return {
        id: conv.id,
        type: conv.type,
        title,
        avatar,
        userId,
        online,
        lastMessage: lastMsgText,
        timestamp: lastMsg ? relativeTime(lastMsg.created_at) : 'New chat',
        unreadCount: 0,
        stats,
        recentMemoryImage: (lastMsg?.type === 'memory_card' && lastMsg.media_url) ? lastMsg.media_url : null
      };
    });
  } catch (err) {
    return mock.mockConversations;
  }
}

export async function fetchMessages(conversationId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(conversationId)) {
    return mock.mockMessages[conversationId] || [];
  }
  const MESSAGE_SELECT = `
    id, conversation_id, sender_id, type, content, media_url, created_at,
    profiles:sender_id(display_name, avatar_url),
    reference_memory:reference_memory_id(id, type, caption, media_url, memory_at, profiles:author_id(display_name), paces:pace_id(title)),
    reference_pace:reference_pace_id(id, title, cover_url, mood, pace_members(profiles(display_name)), memories(id))
  `;
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(normalizeMessage);
}

export async function sendMessage({ conversationId, type = 'text', content = '', mediaUrl = null, referenceMemoryId = null, referencePaceId = null }: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(conversationId)) {
    return {
      id: `local-msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'me',
      sender_name: 'Me',
      type,
      content,
      media_url: mediaUrl,
      created_at: new Date().toISOString()
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) throw new Error('User session not found.');

  const MESSAGE_SELECT = `
    id, conversation_id, sender_id, type, content, media_url, created_at,
    profiles:sender_id(display_name, avatar_url),
    reference_memory:reference_memory_id(id, type, caption, media_url, memory_at, profiles:author_id(display_name), paces:pace_id(title)),
    reference_pace:reference_pace_id(id, title, cover_url, mood, pace_members(profiles(display_name)), memories(id))
  `;

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      type,
      content,
      media_url: mediaUrl,
      reference_memory_id: referenceMemoryId,
      reference_pace_id: referencePaceId
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw error;
  return normalizeMessage(data);
}

export function subscribeToMessages(conversationId: string, onMessage: (msg: any) => void) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(conversationId)) return () => {};

  const MESSAGE_SELECT = `
    id, conversation_id, sender_id, type, content, media_url, created_at,
    profiles:sender_id(display_name, avatar_url),
    reference_memory:reference_memory_id(id, type, caption, media_url, memory_at, profiles:author_id(display_name), paces:pace_id(title)),
    reference_pace:reference_pace_id(id, title, cover_url, mood, pace_members(profiles(display_name)), memories(id))
  `;

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, async (payload) => {
      try {
        if (!supabase) {
          onMessage(normalizeMessage(payload.new));
          return;
        }
        const { data, error } = await supabase
          .from('messages')
          .select(MESSAGE_SELECT)
          .eq('id', payload.new.id)
          .single();

        if (!error && data) onMessage(normalizeMessage(data));
        else onMessage(normalizeMessage(payload.new));
      } catch {
        onMessage(normalizeMessage(payload.new));
      }
    })
    .subscribe();

  return () => {
    if (supabase) {
      supabase.removeChannel(channel);
    }
  };
}

export async function markAsRead(conversationId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(conversationId)) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .match({ conversation_id: conversationId, user_id: user.id });
  } catch {}
}

export async function addReaction({ memoryId, emoji }: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(memoryId)) {
    return { id: `local-react-${Date.now()}`, memory_id: memoryId, emoji, user_id: 'me' };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No session found');

  const { data, error } = await supabase
    .from('reactions')
    .insert({ memory_id: memoryId, emoji, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeReaction({ memoryId, emoji }: any) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(memoryId)) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('reactions')
    .delete()
    .match({ memory_id: memoryId, emoji, user_id: user.id });
}

export async function getOrCreateDMConversation(targetUserId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(targetUserId)) return 'conv_arjun';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No session found');

  const { data: myMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (myMembers && myMembers.length > 0) {
    const convIds = myMembers.map((m) => m.conversation_id);
    const { data: dmMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations!inner(type)')
      .in('conversation_id', convIds)
      .eq('user_id', targetUserId)
      .eq('conversations.type', 'direct');

    if (dmMembers && dmMembers.length > 0) return dmMembers[0].conversation_id;
  }

  const convId = 'local-dm-' + Date.now();
  await supabase.from('conversations').insert({ id: convId, type: 'direct' });
  await supabase.from('conversation_members').insert([
    { conversation_id: convId, user_id: user.id },
    { conversation_id: convId, user_id: targetUserId }
  ]);

  return convId;
}

export async function getOrCreatePaceGroupChat(paceId: string, title?: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return 'conv_chennai';
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No session found');

  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('pace_id', paceId)
    .eq('type', 'pace_group')
    .maybeSingle();

  if (existing) return existing.id;

  const groupConvId = 'local-grp-' + Date.now();
  await supabase.from('conversations').insert({
    id: groupConvId,
    pace_id: paceId,
    type: 'pace_group',
    title: title || 'Group Chat'
  });

  await supabase.from('conversation_members').insert({
    conversation_id: groupConvId,
    user_id: user.id
  });

  return groupConvId;
}

export async function joinPaceGroupChat(paceId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(paceId)) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: conv } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('pace_id', paceId)
      .eq('type', 'pace_group')
      .maybeSingle();

    let convId = conv?.id;

    if (!convId) {
      const { data: pace } = await supabase.from('paces').select('title').eq('id', paceId).single();
      convId = await getOrCreatePaceGroupChat(paceId, pace?.title || 'Group Chat');
    } else {
      await supabase.from('conversation_members').insert({
        conversation_id: convId,
        user_id: user.id
      });
    }
    return convId;
  } catch {
    return null;
  }
}

// --- RELATIONSHIP API SERVICES ---

export async function fetchRelationship(targetUserId: string) {
  if (!isSupabaseConfigured || !supabase || !isLiveId(targetUserId)) {
    return mock.mockRelationshipStats[targetUserId] || mock.mockRelationshipStats.user_arjun;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return mock.mockRelationshipStats.user_arjun;

  const { data: targetProfile } = await supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle();
  const friendName = targetProfile?.display_name || 'Friend';

  const { data: myMemberships } = await supabase.from('pace_members').select('pace_id').eq('user_id', user.id);
  const myPaceIds = myMemberships?.map((m) => m.pace_id) || [];

  if (myPaceIds.length === 0) return emptyRelationship(friendName, targetProfile?.avatar_url);

  const { data: sharedPacesData } = await supabase
    .from('pace_members')
    .select('pace_id, created_at, paces(*)')
    .in('pace_id', myPaceIds)
    .eq('user_id', targetUserId);

  const sharedPaceIds = sharedPacesData?.map((p) => p.pace_id) || [];
  const sharedPaces = sharedPacesData?.map((p) => p.paces).filter(Boolean) || [];

  if (sharedPaceIds.length === 0) return emptyRelationship(friendName, targetProfile?.avatar_url);

  const { data: memories } = await supabase
    .from('memories')
    .select('*, profiles:author_id(display_name)')
    .in('pace_id', sharedPaceIds)
    .order('memory_at', { ascending: false });

  const photosCount = memories?.filter((m) => m.type === 'photo').length || 0;
  const voiceCount = memories?.filter((m) => m.type === 'voice').length || 0;
  const videoCount = memories?.filter((m) => m.type === 'video').length || 0;
  const locations = [...new Set(memories?.map((m) => m.location_name).filter(Boolean))];

  const timeline: any[] = [];
  if (sharedPacesData && sharedPacesData.length > 0) {
    const oldestJoin = [...sharedPacesData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    timeline.push({
      id: 't-join',
      date: formatDate(oldestJoin.created_at),
      type: 'pace',
      label: 'First Pace Shared',
      detail: `Joined "${(oldestJoin.paces as any)?.title || 'a space'}" together`
    });
  }

  if (memories && memories.length > 0) {
    const oldestMemory = memories[memories.length - 1];
    timeline.push({
      id: 't-mem',
      date: formatDate(oldestMemory.memory_at),
      type: 'memory',
      label: 'First Memory Shared',
      detail: oldestMemory.caption || 'Added first scrap'
    });
  }

  let durationStr = '1 month';
  if (sharedPacesData && sharedPacesData.length > 0) {
    const oldestJoin = [...sharedPacesData].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
    const diffDays = Math.ceil(Math.abs(Date.now() - new Date(oldestJoin.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      durationStr = `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      durationStr = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  }

  return {
    name: friendName,
    avatarUrl: targetProfile?.avatar_url,
    friendshipDuration: `Friends for ${durationStr}`,
    stats: [
      { label: 'Shared Paces', value: sharedPaceIds.length, icon: 'Layers' },
      { label: 'Shared Memories', value: memories?.length || 0, icon: 'Heart' },
      { label: 'Photos', value: photosCount, icon: 'Image' },
      { label: 'Voice Notes', value: voiceCount, icon: 'Mic' },
      { label: 'Videos', value: videoCount, icon: 'Video' },
      { label: 'Locations', value: locations.length, icon: 'MapPin' }
    ],
    aiRecap: {
      text: `You and ${friendName} have captured ${memories?.length || 0} moments together. Most of your memories are in ${(sharedPaces[0] as any)?.title || 'shared spaces'}.`,
      sparkles: true
    },
    timeline,
    sharedMemories: memories?.map((m) => ({
      id: m.id,
      type: m.type,
      author: m.profiles?.display_name || 'Friend',
      date: formatDate(m.memory_at),
      caption: m.caption || '',
      image: m.media_url,
      mood: m.mood || 'soft'
    })) || []
  };
}

export async function generateFriendshipRecap(targetUserId: string) {
  const data = await fetchRelationship(targetUserId);
  return data.aiRecap;
}

function emptyRelationship(friendName: string, avatarUrl: string | null = null) {
  return {
    name: friendName,
    avatarUrl,
    friendshipDuration: 'Just connected',
    stats: [
      { label: 'Shared Paces', value: 0, icon: 'Layers' },
      { label: 'Shared Memories', value: 0, icon: 'Heart' },
      { label: 'Photos', value: 0, icon: 'Image' },
      { label: 'Voice Notes', value: 0, icon: 'Mic' },
      { label: 'Videos', value: 0, icon: 'Video' },
      { label: 'Locations', value: 0, icon: 'MapPin' }
    ],
    aiRecap: {
      text: `No memories shared yet with ${friendName}. Add a post to a shared Pace to start capturing memories!`,
      sparkles: false
    },
    timeline: [],
    sharedMemories: []
  };
}

export async function fetchCloseConnections() {
  if (!isSupabaseConfigured || !supabase) {
    return Object.keys(mock.mockRelationshipStats).map((key) => ({
      id: key,
      name: mock.mockRelationshipStats[key].name,
      avatar_url: key === 'user_arjun'
        ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    }));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .neq('id', user.id)
    .limit(10);

  if (error) throw error;
  if (!profiles || profiles.length === 0) return [];

  return profiles.map((p) => ({
    id: p.id,
    name: p.display_name || 'Friend',
    avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
  }));
}

// --- ACTIVITY API SERVICES ---

function normalizeReactionActivity(row: any) {
  return {
    id: `react-${row.id}`,
    user: {
      name: row.profiles?.display_name || 'Someone',
      avatar: row.profiles?.avatar_url
    },
    text: `reacted ${row.emoji} to your memory`,
    detail: row.memories?.caption ? `"${row.memories.caption}"` : 'A memory from your pace',
    time: relativeTime(row.created_at),
    type: 'reaction',
    memoryId: row.memory_id,
    paceId: row.memories?.pace_id,
    timestamp: new Date(row.created_at).getTime()
  };
}

export async function fetchRecentActivities() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userMemories } = await supabase.from('memories').select('id').eq('author_id', user.id);
  if (!userMemories?.length) return [];

  const memoryIds = userMemories.map((m) => m.id);

  const { data: reactions, error } = await supabase
    .from('reactions')
    .select('id, emoji, created_at, memory_id, profiles(display_name, avatar_url), memories(caption, pace_id)')
    .in('memory_id', memoryIds)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return reactions.map(normalizeReactionActivity);
}

export async function fetchFlashback(paceIds: string[]) {
  if (!isSupabaseConfigured || !supabase || !paceIds?.length) return null;
  const { data, error } = await supabase
    .from('memories')
    .select('*, profiles(display_name)')
    .in('pace_id', paceIds)
    .eq('type', 'photo')
    .not('media_url', 'is', null)
    .order('memory_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    caption: data.caption,
    image: data.media_url,
    author: data.profiles?.display_name || 'Someone',
    mood: data.mood || 'Nostalgic'
  };
}

// --- PULSE API SERVICES ---

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getMyTodayDrop() {
  const TODAY = todayStr();
  const LS_KEY = `pace_pulse_${TODAY}`;
  const cached = await AsyncStorage.getItem(LS_KEY);
  if (cached) return JSON.parse(cached);

  if (!isSupabaseConfigured || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('pulse_drops')
    .select('emoji, note, dropped_at')
    .eq('user_id', user.id)
    .eq('date', TODAY)
    .maybeSingle();

  if (data) {
    await AsyncStorage.setItem(LS_KEY, JSON.stringify(data));
  }
  return data || null;
}

export async function dropTodaysPulse(emoji: string, note = '') {
  const TODAY = todayStr();
  const LS_KEY = `pace_pulse_${TODAY}`;
  const drop = { emoji, note, dropped_at: new Date().toISOString() };

  await AsyncStorage.setItem(LS_KEY, JSON.stringify(drop));

  if (!isSupabaseConfigured || !supabase) return drop;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('pulse_drops').upsert({
        user_id: user.id,
        emoji,
        note: note || null,
        date: TODAY,
        dropped_at: drop.dropped_at
      }, { onConflict: 'user_id,date' });
    }
  } catch {}

  return drop;
}

export async function fetchTodaysFriendPulses() {
  if (!isSupabaseConfigured || !supabase) return [];
  const TODAY = todayStr();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase.from('pace_members').select('pace_id').eq('user_id', user.id);
  if (!memberships?.length) return [];

  const paceIds = memberships.map((m) => m.pace_id);
  const { data: paceMembers } = await supabase
    .from('pace_members')
    .select('user_id, profiles(display_name, avatar_url)')
    .in('pace_id', paceIds)
    .neq('user_id', user.id);

  if (!paceMembers?.length) return [];

  const friendIds = [...new Set(paceMembers.map((m) => m.user_id))];
  const profileMap: Record<string, any> = {};
  paceMembers.forEach((m) => {
    if (m.profiles) profileMap[m.user_id] = m.profiles;
  });

  const { data: drops } = await supabase
    .from('pulse_drops')
    .select('user_id, emoji, note, dropped_at')
    .in('user_id', friendIds)
    .eq('date', TODAY);

  return (drops || []).map((d) => ({
    userId: d.user_id,
    name: profileMap[d.user_id]?.display_name || 'Friend',
    avatar: profileMap[d.user_id]?.avatar_url || null,
    emoji: d.emoji,
    note: d.note,
    droppedAt: d.dropped_at
  }));
}

export async function fetchPulseHistory() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];

    const { data } = await supabase
      .from('pulse_drops')
      .select('user_id, emoji, date, profiles(display_name)')
      .gte('date', cutoff)
      .order('date', { ascending: false });

    if (!data?.length) return [];

    const byDate: Record<string, any[]> = {};
    data.forEach((d) => {
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push({
        userId: d.user_id,
        name: (d.profiles as any)?.display_name || 'Friend',
        emoji: d.emoji,
        isMe: d.user_id === user.id
      });
    });

    return Object.entries(byDate).map(([date, drops]) => ({ date, drops }));
  } catch {
    return [];
  }
}

// --- FILE STORAGE UPLOAD ---

export async function uploadMemoryFile({ paceId, uri, fileExtension = 'jpg' }: any) {
  if (!isSupabaseConfigured || !supabase || !uri) return null;
  const filePath = `${paceId}/${Date.now()}-upload.${fileExtension}`;

  try {
    // Standard React Native fetch-blob method to extract file binary for storage
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from('pace-media').upload(filePath, blob, {
      cacheControl: '3600',
      upsert: false
    });

    if (error) throw error;

    const { data } = supabase.storage.from('pace-media').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload file to storage:', err);
    throw err;
  }
}

export async function updateProfile({ displayName, avatarUrl }: any) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated session found.');

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName, avatar_url: avatarUrl }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  await supabase.auth.updateUser({
    data: { full_name: displayName, avatar_url: avatarUrl }
  });

  return data;
}

export async function fetchRecentMemoriesAcrossPaces() {
  if (!isSupabaseConfigured || !supabase) return mock.memories;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get the pace ids the user belongs to
  const { data: members } = await supabase
    .from('pace_members')
    .select('pace_id')
    .eq('user_id', user.id);
  
  const paceIds = members?.map(m => m.pace_id) || [];
  if (paceIds.length === 0) return [];

  const { data, error } = await supabase
    .from('memories')
    .select('*, profiles(display_name, avatar_url)')
    .in('pace_id', paceIds)
    .order('memory_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data.map(normalizeMemory);
}
