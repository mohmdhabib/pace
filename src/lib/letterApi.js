/**
 * ============================================================================
 * FILE NAME: letterApi.js
 * TYPE: API Library File
 * PURPOSE: Manages all database operations for the Living Letter feature —
 *          an interactive, block-based invitation letter that replaces cold
 *          invite links. Writers embed text, questions, and photos; recipients
 *          answer inline before joining a Pace.
 *
 * FUNCTIONS:
 * 1. createLetter()     — Inserts letter + blocks into DB, returns token URL.
 * 2. fetchLetterByToken() — Resolves a token to the full letter payload.
 * 3. submitLetterResponse() — Saves recipient's answers to question blocks.
 * 4. joinPaceViaLetter()  — Adds recipient as Pace member after responding.
 *
 * OFFLINE / PROTOTYPE MODE:
 * All functions check for prototype tokens (starting with "letter-proto-")
 * and return mock data immediately, matching the pattern used by inviteApi.js.
 *
 * KEY IMPORTS & DEPENDENCIES:
 * - { supabase } from "./supabase": Core Supabase client.
 * - { joinPaceGroupChat } from "./chatApi": Joins group chat on pace membership.
 * ============================================================================
 */

import { supabase } from "./supabase";
import { joinPaceGroupChat } from "./chatApi";

// ─── Prototype-mode mock letter ──────────────────────────────────────────────
const PROTO_LETTER = {
  letter: {
    id: "proto-letter-001",
    pace_id: "chennai",
    sender_id: "proto-sender",
    token: "letter-proto-001",
    title: "Come join us in Chennai Nights ✨",
    mood: "nostalgic",
    mode: "sealed",
    status: "sent",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  blocks: [
    {
      id: "b1",
      letter_id: "proto-letter-001",
      type: "text",
      content: "Hey — I've been meaning to tell you something for a while now.\n\nThere's this little corner of the internet I've been keeping for the people I actually care about. Not for followers, not for likes. Just for moments.",
      order_index: 0
    },
    {
      id: "b2",
      letter_id: "proto-letter-001",
      type: "question",
      content: "What's the most vivid memory you have of us together?",
      order_index: 1
    },
    {
      id: "b3",
      letter_id: "proto-letter-001",
      type: "text",
      content: "That memory? I want to keep it somewhere it won't get lost in the scroll. That's what this Pace is for.",
      order_index: 2
    },
    {
      id: "b4",
      letter_id: "proto-letter-001",
      type: "divider",
      content: null,
      order_index: 3
    },
    {
      id: "b5",
      letter_id: "proto-letter-001",
      type: "question",
      content: "If you could relive one night from last year, which one would it be?",
      order_index: 4
    },
    {
      id: "b6",
      letter_id: "proto-letter-001",
      type: "text",
      content: "Come in. Bring those memories with you. This place is ours.",
      order_index: 5
    }
  ],
  pace: {
    id: "chennai",
    title: "Chennai Nights",
    cover_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
    mood: "late-night",
    description: "auto rides, bad karaoke, and the sea looking like a secret"
  },
  sender: {
    display_name: "Riya",
    avatar_url: null
  }
};

// ─── Local storage helpers for prototype mode ──────────────────────────────
const LS_KEY = "pace_local_letters";

function getLocalLetters() {
  try {
    const data = localStorage.getItem(LS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalLetter(token, data) {
  try {
    const letters = getLocalLetters();
    letters[token] = data;
    localStorage.setItem(LS_KEY, JSON.stringify(letters));
  } catch (e) {
    console.warn("Failed to save local letter:", e);
  }
}

/**
 * createLetter
 * Inserts a new letter with its blocks into the database.
 * Returns the generated token URL for sharing.
 *
 * @param {Object} params
 * @param {String} params.paceId      - The target Pace ID.
 * @param {String} params.senderId    - The authenticated sender's user ID.
 * @param {String} params.title       - The letter's title (shown to recipient).
 * @param {String} params.mood        - Mood theme: nostalgic | tender | wild | electric.
 * @param {Array}  params.blocks      - Ordered array of block objects:
 *                                      { type, content, photo_url, order_index }
 * @returns {Promise<{ letter, url }>}
 */
export async function createLetter({ paceId, senderId, title, mood = "nostalgic", blocks = [] }) {
  // --- PROTOTYPE / OFFLINE FALLBACK ---
  if (!supabase || !paceId || paceId.startsWith("pace-demo")) {
    const protoToken = `letter-proto-${Date.now()}`;
    const url = `${window.location.origin}?letter=${protoToken}`;

    const isMockPace = paceId === "chennai";
    const paceInfo = isMockPace 
      ? { id: "chennai", title: "Chennai Nights", cover_url: null, mood: "late-night" }
      : (paceId && !paceId.startsWith("pace-demo") 
          ? { id: paceId, title: paceId, cover_url: null, mood }
          : null);

    const newLetterData = {
      letter: {
        id: protoToken,
        pace_id: paceId || null,
        sender_id: senderId || "proto-sender",
        token: protoToken,
        title: title || null,
        mood,
        mode: "sealed",
        status: "sent",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      blocks: blocks.map((b, i) => ({
        id: b.id || `b-${Date.now()}-${i}`,
        letter_id: protoToken,
        type: b.type,
        content: b.content || null,
        photo_url: b.photo_url || null,
        order_index: b.order_index ?? i
      })),
      pace: paceInfo,
      sender: {
        display_name: "You",
        avatar_url: null
      },
      responses: {},
      respondent: null
    };

    saveLocalLetter(protoToken, newLetterData);

    return {
      letter: newLetterData.letter,
      url
    };
  }

  try {
    // 1. Insert letter metadata row
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .insert({
        pace_id: paceId,
        sender_id: senderId,
        title: title || null,
        mood,
        mode: "sealed",
        status: "sent"
      })
      .select()
      .single();

    if (letterError) throw letterError;

    // 2. Insert all blocks in one batch
    if (blocks.length > 0) {
      const blockRows = blocks.map((b, i) => ({
        letter_id: letter.id,
        type: b.type,
        content: b.content || null,
        photo_url: b.photo_url || null,
        order_index: b.order_index ?? i
      }));

      const { error: blocksError } = await supabase
        .from("letter_blocks")
        .insert(blockRows);

      if (blocksError) throw blocksError;
    }

    // 3. Build shareable URL
    const url = `${window.location.origin}?letter=${letter.token}`;
    return { letter, url };
  } catch (err) {
    console.error("createLetter error:", err);
    throw err;
  }
}

/**
 * fetchLetterByToken
 * Resolves a letter token to the full payload: letter + blocks + pace + sender.
 * Uses the `fetch_letter_by_token` RPC to allow unauthenticated access.
 *
 * @param {String} token - The unique letter token from the URL query string.
 * @returns {Promise<Object|null>} - { letter, blocks, pace, sender } or null if not found.
 */
export async function fetchLetterByToken(token) {
  if (!token) return null;

  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (token.startsWith("letter-proto-")) {
    console.log("fetchLetterByToken: prototype token shortcut");
    const local = getLocalLetters()[token];
    if (local) return local;
    return PROTO_LETTER;
  }

  if (!supabase) return null;

  try {
    // Attempt RPC first (allows unauthenticated guests to see letter details)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "fetch_letter_by_token",
      { token_arg: token }
    );

    if (!rpcError && rpcData) {
      console.log("fetchLetterByToken RPC success");
      return rpcData;
    }

    console.warn("fetch_letter_by_token RPC failed, using client-side fallback:", rpcError);

    // Client-side fallback: query letters + blocks directly
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .select(`
        *,
        paces ( id, title, cover_url, mood, description ),
        profiles:sender_id ( display_name, avatar_url )
      `)
      .eq("token", token)
      .maybeSingle();

    if (letterError) throw letterError;
    if (!letter) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from("letter_blocks")
      .select("*")
      .eq("letter_id", letter.id)
      .order("order_index", { ascending: true });

    if (blocksError) throw blocksError;

    return {
      letter: {
        id: letter.id,
        pace_id: letter.pace_id,
        sender_id: letter.sender_id,
        token: letter.token,
        title: letter.title,
        mood: letter.mood,
        status: letter.status,
        created_at: letter.created_at,
        expires_at: letter.expires_at
      },
      blocks: blocks || [],
      pace: letter.paces ? {
        id: letter.paces.id,
        title: letter.paces.title,
        cover_url: letter.paces.cover_url,
        mood: letter.paces.mood,
        description: letter.paces.description
      } : null,
      sender: {
        display_name: letter.profiles?.display_name || "A friend",
        avatar_url: letter.profiles?.avatar_url || null
      }
    };
  } catch (err) {
    console.error("fetchLetterByToken error:", err);
    throw err;
  }
}

/**
 * submitLetterResponses
 * Saves the recipient's answers to all question blocks in one batch.
 * Also marks the letter status as 'responded'.
 *
 * @param {Object} params
 * @param {String} params.letterId      - The letter's UUID.
 * @param {String} params.respondentId  - The authenticated respondent's user ID.
 * @param {Array}  params.responses     - Array of { blockId, answer } objects.
 * @returns {Promise<void>}
 */
export async function submitLetterResponses({ letterId, respondentId, responses = [] }) {
  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (!supabase || !letterId || letterId.startsWith("proto-") || letterId.startsWith("letter-proto-")) {
    console.log("submitLetterResponses: prototype mode, saving to local cache");
    let local = getLocalLetters()[letterId];
    if (!local) {
      if (letterId === "proto-letter-001" || letterId === "letter-proto-001") {
        local = JSON.parse(JSON.stringify(PROTO_LETTER));
      }
    }
    if (local) {
      const respObj = { ...(local.responses || {}) };
      responses.forEach((r) => {
        respObj[r.blockId] = r.answer;
      });
      local.responses = respObj;
      local.letter.status = "responded";
      local.respondent = {
        display_name: "Arjun",
        avatar_url: null
      };
      saveLocalLetter(letterId, local);
      
      // Also cache by token if it differs from the ID
      if (local.letter.token && local.letter.token !== letterId) {
        saveLocalLetter(local.letter.token, local);
      }
    }
    return;
  }

  try {
    // Batch insert all answers
    const responseRows = responses
      .filter((r) => r.answer?.trim())
      .map((r) => ({
        letter_id: letterId,
        block_id: r.blockId,
        respondent_id: respondentId,
        answer: r.answer.trim()
      }));

    if (responseRows.length > 0) {
      const { error: respError } = await supabase
        .from("letter_responses")
        .upsert(responseRows, { onConflict: "block_id,respondent_id" });

      if (respError) throw respError;
    }

    // Mark letter as responded
    await supabase
      .from("letters")
      .update({ status: "responded" })
      .eq("id", letterId);

    console.log("submitLetterResponses: saved", responseRows.length, "answers");
  } catch (err) {
    console.error("submitLetterResponses error:", err);
    throw err;
  }
}

/**
 * joinPaceViaLetter
 * Adds the authenticated user as a Pace member via the letter flow.
 * Mirrors the acceptInvite fallback logic from inviteApi.js.
 *
 * @param {Object} params
 * @param {String} params.paceId       - The Pace to join.
 * @param {String} params.userId       - The authenticated user ID.
 * @param {String} params.letterId     - The letter ID (for status tracking).
 * @returns {Promise<String>} - The joined paceId.
 */
export async function joinPaceViaLetter({ paceId, userId, letterId }) {
  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (!supabase || !paceId || paceId === "chennai") {
    console.log("joinPaceViaLetter: prototype mode");
    return paceId;
  }

  try {
    // Insert pace membership
    const { error: joinError } = await supabase
      .from("pace_members")
      .insert({ pace_id: paceId, user_id: userId, role: "member" });

    // Ignore "already a member" duplicate errors gracefully
    if (joinError && joinError.code !== "23505") {
      throw joinError;
    }

    // Mark the letter as responded (in case submitLetterResponses wasn't called)
    if (letterId && !letterId.startsWith("proto-")) {
      await supabase
        .from("letters")
        .update({ status: "responded" })
        .eq("id", letterId);
    }

    // Join the Pace group chat conversation
    await joinPaceGroupChat(paceId);

    console.log("joinPaceViaLetter: successfully joined pace", paceId);
    return paceId;
  } catch (err) {
    console.error("joinPaceViaLetter error:", err);
    throw err;
  }
}

/**
 * fetchSentLetters
 * Returns all letters sent by the current authenticated user, with pace info
 * and response status. Used by ChatsView to render the "Sent Letters" section.
 *
 * @param {String} senderId - The authenticated user's ID.
 * @returns {Promise<Array>} - Array of { letter, pace }
 */
export async function fetchSentLetters(senderId) {
  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (!supabase || !senderId) {
    const list = [
      {
        letter: {
          id: "proto-letter-001",
          title: "Come join us in Chennai Nights ✨",
          status: "responded",
          mood: "nostalgic",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          token: "letter-proto-001"
        },
        pace: { id: "chennai", title: "Chennai Nights", cover_url: null, mood: "late-night" }
      }
    ];

    const cached = getLocalLetters();
    Object.values(cached).forEach((item) => {
      // Avoid duplicate proto-letter-001
      if (item.letter.id !== "proto-letter-001") {
        list.unshift({
          letter: item.letter,
          pace: item.pace
        });
      }
    });

    return list;
  }

  try {
    const { data, error } = await supabase
      .from("letters")
      .select(`
        id, title, status, mood, created_at, token, expires_at,
        paces ( id, title, cover_url, mood )
      `)
      .eq("sender_id", senderId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      letter: {
        id: row.id,
        title: row.title,
        status: row.status,
        mood: row.mood,
        created_at: row.created_at,
        token: row.token,
        expires_at: row.expires_at
      },
      pace: {
        id: row.paces?.id,
        title: row.paces?.title || "A Pace",
        cover_url: row.paces?.cover_url,
        mood: row.paces?.mood
      }
    }));
  } catch (err) {
    console.error("fetchSentLetters error:", err);
    return [];
  }
}

/**
 * fetchLetterWithResponses
 * Returns a letter's full content including all blocks AND the recipient's answers.
 * Used by LetterResponseView so the sender can read how the recipient responded.
 *
 * @param {String} letterId - The letter UUID or "proto-letter-001" for prototype mode.
 * @returns {Promise<Object|null>} - { letter, blocks, pace, sender, responses, respondent }
 */
export async function fetchLetterWithResponses(letterId) {
  // --- PROTOTYPE OFFLINE FALLBACK ---
  if (!letterId || letterId === "proto-letter-001" || letterId.startsWith("letter-proto-")) {
    const local = getLocalLetters()[letterId];
    if (local) return local;

    const PROTO_LETTER_INNER = {
      letter: {
        id: "proto-letter-001",
        title: "Come join us in Chennai Nights \u2728",
        mood: "nostalgic",
        status: "responded",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      blocks: [
        { id: "b1", type: "text", content: "Hey \u2014 I\u2019ve been meaning to tell you something for a while now.\n\nThere\u2019s this little corner of the internet I\u2019ve been keeping for the people I actually care about. Not for followers, not for likes. Just for moments.", order_index: 0 },
        { id: "b2", type: "question", content: "What\u2019s the most vivid memory you have of us together?", order_index: 1 },
        { id: "b3", type: "text", content: "That memory? I want to keep it somewhere it won\u2019t get lost in the scroll. That\u2019s what this Pace is for.", order_index: 2 },
        { id: "b4", type: "divider", content: null, order_index: 3 },
        { id: "b5", type: "question", content: "If you could relive one night from last year, which one would it be?", order_index: 4 },
        { id: "b6", type: "text", content: "Come in. Bring those memories with you. This place is ours.", order_index: 5 }
      ],
      pace: { id: "chennai", title: "Chennai Nights", cover_url: null, mood: "late-night" },
      sender: { display_name: "You", avatar_url: null }
    };
    return {
      ...PROTO_LETTER_INNER,
      responses: {
        b2: "The night we got lost trying to find that rooftop restaurant and ended up eating street food at 2am. Still the best meal.",
        b5: "That drive back after Arjun\u2019s farewell \u2014 nobody wanted the night to end so we just kept driving."
      },
      respondent: { display_name: "Arjun", avatar_url: null }
    };
  }

  if (!supabase) return null;

  try {
    const { data: letter, error: letterError } = await supabase
      .from("letters")
      .select(`
        *,
        paces ( id, title, cover_url, mood, description ),
        profiles:sender_id ( display_name, avatar_url )
      `)
      .eq("id", letterId)
      .maybeSingle();

    if (letterError) throw letterError;
    if (!letter) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from("letter_blocks")
      .select("*")
      .eq("letter_id", letterId)
      .order("order_index", { ascending: true });

    if (blocksError) throw blocksError;

    const { data: responseRows, error: respError } = await supabase
      .from("letter_responses")
      .select(`
        block_id, answer, respondent_id,
        profiles:respondent_id ( display_name, avatar_url )
      `)
      .eq("letter_id", letterId);

    if (respError) throw respError;

    const responses = {};
    let respondent = null;
    (responseRows || []).forEach((r) => {
      responses[r.block_id] = r.answer;
      if (!respondent && r.profiles) {
        respondent = {
          display_name: r.profiles.display_name || "Someone",
          avatar_url: r.profiles.avatar_url || null
        };
      }
    });

    return {
      letter: { id: letter.id, title: letter.title, mood: letter.mood, status: letter.status, created_at: letter.created_at },
      blocks: blocks || [],
      pace: letter.paces ? {
        id: letter.paces.id,
        title: letter.paces.title,
        cover_url: letter.paces.cover_url,
        mood: letter.paces.mood,
        description: letter.paces.description
      } : null,
      sender: { display_name: letter.profiles?.display_name || "You", avatar_url: letter.profiles?.avatar_url || null },
      responses,
      respondent
    };
  } catch (err) {
    console.error("fetchLetterWithResponses error:", err);
    throw err;
  }
}

