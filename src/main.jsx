/**
 * ============================================================================
 * FILE NAME: main.jsx
 * TYPE: Application Root Entrypoint & State Orchestrator
 * PURPOSE: The heart of the Pace application. It initializes the React DOM root,
 *          orchestrates global application states (loaded spaces, active posts, user auth
 *          credentials, modal toggles, and invitation parameters), manages background DB
 *          listeners, and coordinates core transaction methods (creating, editing, and archiving).
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. Imports React hook controllers, Framer Motion animators, Lucide SVG icons, Supabase configuration
 *    libraries, database services, and all modular view components.
 * 2. Mounts auxiliary visual elements:
 *    - `Ambient()`: Renders glassmorphic blurred radial gradient circles on the background.
 *    - `FilmGrain()`: Renders a fine transparent film-grain visual overlay layer to capture the physical,
 *      cinematic scrapbook brand look.
 * 3. Mounts the central state component `App()`:
 *    - Connects global React states (started onboarding, authenticated user sessions, loaded spaces list,
 *      scraped memories feed, selected active space, URL invite tokens, modal tags, and connection statuses).
 *    - Handles startup side-effects (`useEffect`): implements an automated 2.5s fallback timeout to bypass
 *      "unlocking pace" loading locks in case of network disruptions; fetches initial logged-in user profile
 *      rows and Paces; registers real-time authentication listener triggers.
 *    - Manages active timeline side-effects (`useEffect`): fetches memory timelines when space IDs change,
 *      registering active real-time WebSockets to push new memory posts instantly.
 *    - Integrates invitation landing side-effects (`useEffect`): parses token query strings to resolve invitation hosts.
 *    - Defines transaction methods wrapping local offline arrays and Supabase API structures
 *      (create, update, archive, and unarchive paces; add memories; create invite links).
 *    - Renders the view conditional shell wrapping layout screens (`Onboarding`, `Shell`) in AnimatePresence fades.
 *    - Coordinates all overlays modals (`CreatePace`, `EditPace`, `AddMemory`, `CapsuleLockModal`, `InviteFriends`, `JoinPaceModal`).
 * 4. Triggers `render()` to append the React tree onto the `#root` index.html container.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useEffect, useState }`: Drives global app hooks.
 * - `createRoot` from "react-dom/client": Attaches React engine to index.html nodes.
 * - `AnimatePresence`, `motion` from "framer-motion": Handles smooth unmount overlay fades.
 * - `{ supabase }` & APIs from "./lib/supabase", "./lib/paceApi", "./lib/inviteApi":
 *   Communicates with our Supabase Postgres backend tables and file storage systems.
 * - Views and Features: unified screens coordinating different capabilities.
 * ============================================================================
 */

import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import { Moon } from "lucide-react";
import {
  archivePace,
  createInvite,
  createMemory,
  createPace,
  ensureProfile,
  fetchMemories,
  fetchPaces,
  subscribeToMemories,
  themeByMood,
  unarchivePace,
  updatePace,
  updateProfile,
  uploadMemoryFile
} from "./lib/paceApi";
import {
  supabase,
  getSession,
  isSupabaseConfigured,
  onAuthChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithPassword,
  signInWithProvider,
  signOut
} from "./lib/supabase";
import { fetchInviteDetails } from "./lib/inviteApi";
import {
  fetchConversations,
  fetchMessages,
  sendMessage as sendChatMessage,
  subscribeToMessages,
  addReaction as addMemoryReaction,
  removeReaction as removeMemoryReaction,
  getOrCreatePaceGroupChat,
  joinPaceGroupChat
} from "./lib/chatApi";

// Modular Feature-Sliced Design (FSD) imports
import { covers, paces, memories, moods, mockConversations, mockMessages, mockReactions, mockRelationshipStats } from "./shared/constants";
import { isLiveId, formatSyncError, readableSupabaseError } from "./shared/utils";
import Onboarding from "./features/auth/Onboarding";
import Shell from "./views/Shell";
import Profile from "./views/Profile";
import CreatePace from "./features/spaces/CreatePace";
import EditPace from "./features/spaces/EditPace";
import InviteFriends from "./features/spaces/InviteFriends";
import AddMemory from "./features/memories/AddMemory";
import StoryMode from "./features/memories/StoryMode";

// Auxiliary overlay components
import JoinPaceModal from "./components/JoinPaceModal";
import CapsuleLockModal from "./components/CapsuleLockModal";
import NewChatModal from "./components/NewChatModal";
import "./styles.css";

/**
 * Ambient Component
 * Renders aesthetic glassmorphic blurred color circles in the dashboard background.
 */
function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 bg-grain">
      {/* Three colorful radial circles positioned strategically to create visual depth */}
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#c6b79d]/10 blur-3xl" />
      <div className="absolute -right-28 top-1/3 h-80 w-80 rounded-full bg-[#8f6b67]/12 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#7d8577]/10 blur-3xl" />
    </div>
  );
}

/**
 * FilmGrain Component
 * Overlays a translucent film grain image texture to capture a vintage physical look.
 */
function FilmGrain() {
  return <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.075]" />;
}

/**
 * App Main Orchestrator Component
 */
function App() {
  // --- GLOBAL STATES ---
  const [started, setStarted] = useState(false); // Flags narrative onboarding completion
  const [session, setSession] = useState(null); // Holds logged-in user profile details (null if offline sandbox guest)
  const [appPaces, setAppPaces] = useState(paces); // Paces space models array (defaults to fallback mock datasets)
  const [appMemories, setAppMemories] = useState(memories); // Memories feed lists array
  const [activePace, setActivePace] = useState(paces[0]); // Active space pointer loaded in timeline
  const [view, setView] = useState("home"); // Page router track state ('home', 'timeline', 'profile')
  const [modal, setModal] = useState(null); // Active overlay modal state ('create', 'edit-pace', etc.)
  const [invite, setInvite] = useState(null); // Created invite tokens parameter context
  
  // --- CHAT & RELATIONSHIP STATES ---
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [reactions, setReactions] = useState(mockReactions);
  const [messages, setMessages] = useState(mockMessages);

  // Parses URL query string to search for active invite codes (e.g. ?invite=abc-123)
  const [pendingInvite, setPendingInvite] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("invite");
      return token ? { token, loading: true } : null;
    }
    return null;
  });
  
  // Syncing banner logs
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? "Connect to sync private Paces" : "Prototype mode"
  );
  
  // Preloading check tracking cached profiles (avoids screen flickering during initial loads)
  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);

  // --- LOGOUT SESSION RESETTER ---
  // Restores all local collections to pre-configured fallback mockup constants on sign-out
  function resetToSignedOut() {
    setSession(null);
    setStarted(false);
    setView("home");
    setModal(null);
    setAppPaces(paces);
    setAppMemories(memories);
    setActivePace(paces[0]);
    setConversations(mockConversations);
    setActiveConversation(null);
    setReactions(mockReactions);
    setMessages(mockMessages);
    setSyncStatus(isSupabaseConfigured ? "Signed out" : "Prototype mode");
  }

  // Calls Supabase Auth sign-out and updates local state
  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out request failed, resetting client locally:", err);
    } finally {
      resetToSignedOut();
    }
  }

  // --- EFFECT 1: STARTUP AUTH AND PACES LOADER ---
  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    // Safety Timeout: 2.5s fallback to prevent getting stuck in "unlocking pace" preloader on slow nets
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialLoadDone) {
        console.warn("Unlocking pace session loading timed out. Force bypassing safety lock.");
        setLoadingSession(false);
        initialLoadDone = true;
      }
    }, 2500);

    // Queries Spaces list from backend tables
    async function loadPacesForSession(currentSession) {
      if (!currentSession) {
        setSyncStatus("Sign in to unlock private sync");
        return;
      }
      try {
        // Upserts a profile record inside profiles table to prevent foreign keys breaks
        await ensureProfile(currentSession.user);
        
        // SELECT query fetching all paces current user owns or is a member of
        const livePaces = await fetchPaces();
        if (!isMounted) return;

        if (livePaces.length) {
          // Flatten relational structures, assigning visual covers sequentially
          const hydrated = livePaces.map((pace, index) => ({
            ...pace,
            cover: pace.cover || covers[index % covers.length]
          }));
          setAppPaces(hydrated);
          setActivePace(hydrated[0]);
          setSyncStatus("Synced privately");
          setStarted(true); // Auto-bypasses brand slides if active session matches
        } else {
          setAppPaces([]);
          setActivePace(null);
          setSyncStatus("Signed in. Create your first Pace.");
          setStarted(true); // Auto-bypasses brand slides if new user registers
        }

        // Fetch user conversations if online
        try {
          const liveConvs = await fetchConversations();
          if (liveConvs) {
            setConversations(liveConvs);
          }
        } catch (convErr) {
          console.warn("Failed to load conversations from session:", convErr);
        }
      } catch (err) {
        console.error("Error loading paces for session:", err);
        if (isMounted) {
          setSyncStatus(formatSyncError(err));
          // Self-healing auth check: if session JWT is invalid or expired, automatically clean up local state
          const errMsg = err?.message || "";
          if (
            errMsg.includes("JWT") ||
            errMsg.includes("expired") ||
            errMsg.includes("invalid claim") ||
            errMsg.includes("invalid signature") ||
            err?.code === "PGRST301" ||
            err?.status === 401
          ) {
            console.warn("Session token is dead/expired. Clearing local auth state...");
            signOut().catch(() => {});
            resetToSignedOut();
          }
        }
      } finally {
        if (isMounted) {
          setLoadingSession(false);
        }
      }
    }

    // Identifies cached local credentials
    async function initSession() {
      if (!isSupabaseConfigured) {
        setLoadingSession(false);
        clearTimeout(safetyTimeout);
        return;
      }
      try {
        const initialSession = await getSession();
        if (isMounted && initialSession) {
          console.log("Supabase initial session detected on mount:", initialSession.user?.email);
          setSession(initialSession);
          await loadPacesForSession(initialSession);
        }
      } catch (err) {
        console.error("Error during initial session check:", err);
      } finally {
        if (isMounted) {
          setLoadingSession(false);
          initialLoadDone = true;
          clearTimeout(safetyTimeout);
        }
      }
    }

    initSession();

    // Registers reactive user observer triggers
    const unsubscribe = onAuthChange(async (nextSession) => {
      if (!isMounted) return;
      if (!initialLoadDone) return; // Prevent loop conflicts during pre-load queries
      
      setSession((currentSession) => {
        // Prevent unnecessary query loops if credentials didn't change (checking ID and update time)
        if (currentSession?.user?.id === nextSession?.user?.id && currentSession?.user?.updated_at === nextSession?.user?.updated_at) {
          return currentSession;
        }
        if (!nextSession) {
          console.log("Supabase session ended, resetting state...");
          resetToSignedOut();
          return null;
        }
        console.log("Supabase session changed, reloading data...", nextSession.user?.email);
        loadPacesForSession(nextSession);
        return nextSession;
      });
    });

    // Cleanup hook: unmounts listeners and cancels safeties
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- EFFECT 2: MEMORIES LOADER & WEBSOCKET SYNCING ---
  // Re-runs whenever the user enters a different space timeline view (updates activePace.id)
  useEffect(() => {
    // If Space is an offline mock constant (chennai, semester, sidegig), skip database queries
    if (!activePace?.id || !isLiveId(activePace.id)) return;

    let isMounted = true;
    
    // Fetch timeline posts list
    async function loadMemories() {
      try {
        const data = await fetchMemories(activePace.id);
        if (isMounted) setAppMemories(data);
      } catch (err) {
        console.error("Error fetching memories:", err);
      }
    }
    loadMemories();

    // Registers active WebSocket channel listening to insert operations filtered by pace_id
    const unsubscribe = subscribeToMemories(activePace.id, (newMemory) => {
      if (isMounted) {
        setAppMemories((current) => {
          // Double-check duplicate tokens to avoid overlap renders
          const duplicate = current.find((m) => m.id === newMemory.id);
          if (duplicate) return current;
          return [newMemory, ...current]; // Push new post to top of array
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe(); // Closes WebSocket connection
    };
  }, [activePace?.id]);

  // --- EFFECT 2.4: GLOBAL CHAT AND CONVERSATIONS REALTIME SYNC ---
  useEffect(() => {
    if (!session?.user?.id || !isSupabaseConfigured) return;

    let isMounted = true;
    let refreshTimer = null;

    // Debounced inbox refresh to prevent rapid-fire DB queries
    const refreshInbox = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        try {
          const liveConvs = await fetchConversations();
          if (isMounted && liveConvs) {
            setConversations(liveConvs);
          }
        } catch (err) {
          console.warn("Failed to refresh inbox on realtime sync:", err);
        }
      }, 300);
    };

    // 1. Listen for new conversations or members added (e.g. user accepts invite, starting new DM)
    const membersChannel = supabase
      .channel("global-members-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members"
        },
        (payload) => {
          console.log("Realtime: Conversation member change detected:", payload);
          refreshInbox();
        }
      )
      .subscribe();

    // 2. Listen for new messages globally to update the lastMessage preview in the inbox
    const messagesChannel = supabase
      .channel("global-messages-inbox-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {
          console.log("Realtime: New message globally:", payload);
          refreshInbox();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [session?.user?.id]);

  // --- EFFECT 2.5: MESSAGES LOADER & REALTIME SYNCING ---
  useEffect(() => {
    if (!activeConversation?.id || !isLiveId(activeConversation.id)) return;

    let isMounted = true;

    async function loadMessages() {
      try {
        const data = await fetchMessages(activeConversation.id);
        if (isMounted) {
          setMessages((prev) => ({
            ...prev,
            [activeConversation.id]: data
          }));
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    }
    loadMessages();

    // Subscribe to messages in realtime
    const unsubscribe = subscribeToMessages(activeConversation.id, (newMsg) => {
      if (isMounted) {
        setMessages((prev) => {
          const currentList = prev[activeConversation.id] || [];
          const duplicate = currentList.find((m) => m.id === newMsg.id);
          if (duplicate) return prev;
          return {
            ...prev,
            [activeConversation.id]: [...currentList, newMsg]
          };
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [activeConversation?.id]);

  // --- EFFECT 3: LANDING PAGE INVITATIONS RESOLVER ---
  useEffect(() => {
    if (!pendingInvite?.token || !pendingInvite?.loading) return;

    let isMounted = true;
    async function resolveInvite() {
      try {
        // Runs RPC stored procedures verifying invite details prior to login registration
        const details = await fetchInviteDetails(pendingInvite.token);
        if (isMounted) {
          setPendingInvite(details); // Updates invite metadata payload to render JoinPaceModal
        }
      } catch (error) {
        console.error("Error resolving invite token:", error);
        if (isMounted) {
          setPendingInvite(null);
          alert("Invite link could not be loaded or has expired.");
        }
      }
    }
    resolveInvite();

    return () => {
      isMounted = false;
    };
  }, [pendingInvite]);

  // --- TRANSACTION METHODS ---

  // Updates user profile display name and avatar URL
  async function handleUpdateProfile({ displayName, avatarUrl }) {
    if (session) {
      const updatedProfile = await updateProfile({ displayName, avatarUrl });
      
      // Update session user metadata locally to force immediate React render
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          user: {
            ...prev.user,
            updated_at: new Date().toISOString(),
            user_metadata: {
              ...prev.user.user_metadata,
              full_name: displayName,
              avatar_url: avatarUrl
            }
          }
        };
      });
      return updatedProfile;
    } else {
      // Offline mode: save to local storage
      localStorage.setItem("pace_guest_name", displayName);
      localStorage.setItem("pace_guest_avatar", avatarUrl);
    }
  }

  // Writes a new Pace space row to database
  async function handleCreatePace(form) {
    // CASE 1: OFFLINE SANDBOX MODE GUESTS
    if (!session && !isSupabaseConfigured) {
      const demoId = `pace-demo-${Date.now()}`;
      const theme = themeByMood[form.mood] || themeByMood.nostalgic;
      const demoPace = {
        id: demoId,
        title: form.title,
        mood: form.mood,
        members: ["Me"],
        last: "Just now",
        snippet: form.description || "A private room for the moments that still glow.",
        color: theme,
        cover: form.previewUrl || form.coverUrl,
        collage: [form.previewUrl || form.coverUrl]
      };
      setAppPaces((current) => [demoPace, ...current]);
      setActivePace(demoPace);
      return demoPace;
    }

    // CASE 2: CLOUD AUTHENTICATED USER
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Sign in again before creating a new Pace.");
    }

    try {
      // Calls API library to execute TRANSACTION RPCs
      const livePace = await createPace(form);
      let finalCover = livePace.cover || form.coverUrl;

      // Handles custom covers uploads to Storage Buckets if visual file is selected
      if (form.file) {
        try {
          const uploadedUrl = await uploadMemoryFile({ paceId: livePace.id, file: form.file });
          // Updates pace cover_url reference
          await updatePace(livePace.id, { cover_url: uploadedUrl });
          finalCover = uploadedUrl;
        } catch (uploadError) {
          console.error("Custom cover upload failed, falling back to preset:", uploadError);
        }
      }

      const hydrated = { ...livePace, cover: finalCover };
      setAppPaces((current) => [hydrated, ...current]);
      setActivePace(hydrated);
      setSyncStatus("Synced privately");

      // Auto-create/get the group chat conversation for this Pace
      try {
        await getOrCreatePaceGroupChat(livePace.id, livePace.title);
        const liveConvs = await fetchConversations();
        if (liveConvs) {
          setConversations(liveConvs);
        }
      } catch (convErr) {
        console.warn("Failed to auto-create group chat conversation:", convErr);
      }

      return hydrated;
    } catch (error) {
      console.error("createPace error:", error);
      throw error;
    }
  }

  // Updates Pace visual layout configurations
  async function handleUpdatePace(form) {
    if (!activePace?.id) return;

    // OFFLINE GUEST SHORTCUT
    if (!session && !isSupabaseConfigured) {
      const updated = {
        ...activePace,
        title: form.title,
        mood: form.mood,
        snippet: form.description,
        description: form.description,
        cover: form.previewUrl || form.coverUrl,
        color: themeByMood[form.mood] || themeByMood.nostalgic
      };
      setAppPaces((current) =>
        current.map((p) => (p.id === activePace.id ? updated : p))
      );
      setActivePace(updated);
      return;
    }

    // CLOUD WRITE
    try {
      let finalCover = form.coverUrl;
      if (form.file) {
        finalCover = await uploadMemoryFile({ paceId: activePace.id, file: form.file });
      }

      const updatedRow = await updatePace(activePace.id, {
        title: form.title,
        description: form.description || null,
        mood: form.mood,
        cover_url: finalCover,
        color_theme: themeByMood[form.mood] || themeByMood.nostalgic
      });

      const hydrated = {
        ...updatedRow,
        cover: finalCover
      };

      setAppPaces((current) =>
        current.map((p) => (p.id === activePace.id ? hydrated : p))
      );
      setActivePace(hydrated);
      setSyncStatus("Synced privately");
    } catch (error) {
      console.error("updatePace error:", error);
      throw error;
    }
  }

  // Soft-archives a Pace
  async function handleArchivePace(paceId) {
    if (!session && !isSupabaseConfigured) {
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? { ...p, archivedAt: new Date().toISOString() } : p))
      );
      if (activePace?.id === paceId) {
        setActivePace(null);
      }
      return;
    }

    try {
      const archivedRow = await archivePace(paceId);
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? archivedRow : p))
      );
      if (activePace?.id === paceId) {
        setActivePace(null);
      }
      setSyncStatus("Era archived");
    } catch (error) {
      console.error("archivePace error:", error);
      throw error;
    }
  }

  // Restores an archived Pace back to active listing
  async function handleUnarchivePace(paceId) {
    if (!session && !isSupabaseConfigured) {
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? { ...p, archivedAt: null } : p))
      );
      return;
    }

    try {
      const unarchivedRow = await unarchivePace(paceId);
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? unarchivedRow : p))
      );
      setSyncStatus("Era restored");
    } catch (error) {
      console.error("unarchivePace error:", error);
      throw error;
    }
  }

  // --- CHAT MESSAGE SENDER WITH BACKEND SYNC ---
  async function handleSendChatMessage(text, type = "text", extra = {}) {
    if (!session && !isSupabaseConfigured) {
      const newMsg = {
        id: `local-msg-${Date.now()}`,
        sender_id: "me",
        sender_name: "Me",
        type,
        content: text,
        created_at: new Date().toISOString(),
        ...extra
      };
      setMessages((prev) => ({
        ...prev,
        [activeConversation.id]: [...(prev[activeConversation.id] || []), newMsg]
      }));
      return;
    }

    try {
      const sentMsg = await sendChatMessage({
        conversationId: activeConversation.id,
        type,
        content: text,
        referenceMemoryId: extra.reference_memory_id || null,
        referencePaceId: extra.reference_pace_id || null
      });

      setMessages((prev) => {
        const currentList = prev[activeConversation.id] || [];
        if (currentList.some((m) => m.id === sentMsg.id)) return prev;
        return {
          ...prev,
          [activeConversation.id]: [...currentList, sentMsg]
        };
      });
    } catch (err) {
      console.error("Failed to send chat message to Supabase:", err);
      alert("Failed to send message: " + err.message);
    }
  }

  // --- MEMORY REACTION ECHO WITH BACKEND SYNC ---
  async function handleToggleReaction(memoryId, emoji) {
    const currentReactions = reactions[memoryId] || [];
    const hasReacted = currentReactions.some((r) => r.user_id === "me" && r.emoji === emoji);

    // Optimistic local state update
    setReactions((prev) => {
      const list = prev[memoryId] || [];
      let next;
      if (hasReacted) {
        next = list.filter((r) => !(r.user_id === "me" && r.emoji === emoji));
      } else {
        next = [...list, { user_id: "me", user_name: "Me", emoji }];
      }
      return {
        ...prev,
        [memoryId]: next
      };
    });

    if (!session && !isSupabaseConfigured) return;

    try {
      if (hasReacted) {
        await removeMemoryReaction({ memoryId, emoji });
      } else {
        await addMemoryReaction({ memoryId, emoji });
      }
    } catch (err) {
      console.error("Failed to sync reaction with Supabase:", err);
      // Revert reactions state on failure
      setReactions((prev) => ({
        ...prev,
        [memoryId]: currentReactions
      }));
    }
  }

  // Saves a new memory post
  async function handleCreateMemory(form) {
    let mediaUrl = form.mediaUrl;
    const fallbackMemory = {
      id: `local-memory-${Date.now()}`,
      type: form.type,
      author: "Me",
      time: "Now",
      date: "Today",
      caption: form.caption,
      image: form.previewUrl || mediaUrl,
      mediaUrl: form.previewUrl || mediaUrl,
      mood: form.mood,
      location: form.locationName
    };

    if (!session || !isLiveId(activePace?.id)) {
      setAppMemories((current) => [fallbackMemory, ...current]);
      return;
    }

    if (form.file) {
      mediaUrl = await uploadMemoryFile({ paceId: activePace.id, file: form.file });
    }

    const liveMemory = await createMemory({
      ...form,
      mediaUrl,
      paceId: activePace.id,
      authorId: session.user.id
    });
    setAppMemories((current) => [liveMemory, ...current]);
  }

  // Generates single-use secure invites link
  async function handleCreateInvite(form) {
    if (!session || !isLiveId(activePace?.id)) {
      const localInvite = {
        url: `${window.location.origin}?invite=prototype-${Date.now()}`,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };
      setInvite(localInvite);
      return localInvite;
    }

    const liveInvite = await createInvite({
      paceId: activePace.id,
      invitedBy: session.user.id,
      email: form.email
    });
    setInvite(liveInvite);
    return liveInvite;
  }

  // Dynamic filter displaying cloud synced paces only when logged in
  const displayedPaces = session
    ? appPaces.filter((p) => isLiveId(p.id))
    : appPaces;

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-pace-black text-pace-pearl selection:bg-pace-bone selection:text-pace-black">
      <Ambient />
      <FilmGrain />
      
      {/* Conditional Root Router Views */}
      <AnimatePresence mode="wait">
        {loadingSession ? (
          // VIEW 1: STARTUP LOGO LOADING SCREEN
          <motion.div
            key="loading-session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-screen items-center justify-center"
          >
            <div className="flex flex-col items-center">
              <Moon size={32} className="text-pace-bone animate-pulse" />
              <p className="mt-4 text-xs tracking-[0.25em] text-pace-smoke uppercase select-none">
                unlocking pace
              </p>
            </div>
          </motion.div>
        ) : !started ? (
          // VIEW 2: WELCOME STORY & AUTH SCREENS
          <Onboarding
            key="onboarding"
            onBegin={() => setStarted(true)}
            onAuth={signInWithProvider}
            onEmailAuth={signInWithEmail}
            onSignup={signUpWithEmail}
            onSigninPassword={signInWithPassword}
            setSession={setSession}
            setStarted={setStarted}
            session={session}
            syncStatus={syncStatus}
          />
        ) : (
          // VIEW 3: MAIN APPLICATION VIEW PORT PORTAL SHELL
          <Shell
            key="app"
            paces={displayedPaces}
            memories={appMemories}
            activePace={activePace}
            setActivePace={setActivePace}
            view={view}
            setView={setView}
            setModal={setModal}
            syncStatus={syncStatus}
            session={session}
            onSignOut={handleSignOut}
            onCreateMemory={handleCreateMemory}
            conversations={conversations}
            setConversations={setConversations}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            reactions={reactions}
            setReactions={setReactions}
            messages={messages}
            setMessages={setMessages}
            onSendMessage={handleSendChatMessage}
            onToggleReaction={handleToggleReaction}
            onProfileUpdate={handleUpdateProfile}
          />
        )}
      </AnimatePresence>

      {/* OVERLAY DIALOG MODAL ORCHESTRATOR */}
      <AnimatePresence>
        {/* Create Pace Dialog */}
        {modal === "create" && (
          <CreatePace
            maxWidth="max-w-[430px]"
            onClose={() => setModal(null)}
            onCreate={async (form) => {
              await handleCreatePace(form);
              setModal(null);
              setView("timeline"); // Auto navigate timeline
            }}
          />
        )}
        
        {/* Edit Pace Settings Dialog */}
        {modal === "edit-pace" && (
          <EditPace
            maxWidth="max-w-[430px]"
            pace={activePace}
            onClose={() => setModal(null)}
            onUpdate={async (form) => {
              await handleUpdatePace(form);
              setModal(null);
            }}
            onArchive={async (paceId) => {
              await handleArchivePace(paceId);
              setModal(null);
              setView("home");
            }}
            onUnarchive={async (paceId) => {
              await handleUnarchivePace(paceId);
              setModal(null);
              setView("home");
            }}
          />
        )}
        
        {/* Add Memory Post Dialog */}
        {modal === "memory" && (
          <AddMemory
            maxWidth="max-w-[430px]"
            onClose={() => setModal(null)}
            onCreate={async (form) => {
              await handleCreateMemory(form);
              setModal(null);
            }}
          />
        )}
        
        {/* Lock Info explainer Dialog */}
        {modal === "capsule" && (
          <CapsuleLockModal 
            maxWidth="max-w-[430px]"
            onClose={() => setModal(null)} 
            activePace={activePace} 
          />
        )}
        
        {/* Generate Invite Links Dialog */}
        {modal === "invite" && (
          <InviteFriends
            maxWidth="max-w-[430px]"
            invite={invite}
            onClose={() => {
              setModal(null);
              setInvite(null);
            }}
            onCreate={handleCreateInvite}
          />
        )}

        {/* New Chat Contacts Selector Modal */}
        {modal === "new-chat" && (
          <NewChatModal
            paces={displayedPaces}
            session={session}
            onClose={() => setModal(null)}
            onChatStarted={(newConv) => {
              setModal(null);
              setConversations((prev) => {
                if (prev.some((c) => c.id === newConv.id)) return prev;
                return [newConv, ...prev];
              });
              setActiveConversation(newConv);
              setView("chat-thread");
            }}
          />
        )}
        
        {/* Story Mode Cinematic Slideshow Player */}
        {modal === "story" && (
          <StoryMode
            memories={appMemories.filter((m) => {
              // Exclude time-locked capsule memories from the slideshow
              if (m.lockedUntil && new Date(m.lockedUntil) > new Date()) return false;
              return true;
            })}
            pace={activePace}
            onClose={() => setModal(null)}
          />
        )}
        
        {/* Guest resolving Landing page join overlays */}
        {pendingInvite && (
          <JoinPaceModal
            invite={pendingInvite}
            session={session}
            onClose={() => setPendingInvite(null)}
            onSigninPassword={signInWithPassword}
            onSignup={signUpWithEmail}
            syncStatus={syncStatus}
            onSuccess={async (paceId) => {
              setPendingInvite(null);
              
              // Removes invite parameters URL query strings from active address bar silently
              const url = new URL(window.location.href);
              url.searchParams.delete("invite");
              window.history.replaceState({}, document.title, url.pathname);

              try {
                // Instantly reloads spaces lists
                const livePaces = await fetchPaces();
                if (livePaces.length) {
                  const hydrated = livePaces.map((p, idx) => ({
                    ...p,
                    cover: p.cover || covers[idx % covers.length]
                  }));
                  setAppPaces(hydrated);
                  // Identifies newly joined space row pointer
                  const matched = hydrated.find((p) => p.id === paceId) || hydrated[0];
                  setActivePace(matched);
                  setStarted(true);
                  setView("timeline"); // Direct route to timeline

                  // Refresh conversations to get the group chat conversation of the joined Pace
                  try {
                    await joinPaceGroupChat(paceId);
                    const liveConvs = await fetchConversations();
                    if (liveConvs) {
                      setConversations(liveConvs);
                    }
                  } catch (convErr) {
                    console.warn("Failed to refresh conversations after join:", convErr);
                  }
                }
              } catch (err) {
                console.error("Error refreshing paces after join:", err);
              }
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// Render tree initialization
createRoot(document.getElementById("root")).render(<App />);
