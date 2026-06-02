import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion } from "framer-motion";
import {
  Apple,
  Archive,
  Bot,
  CalendarDays,
  Camera,
  ChevronLeft,
  Clock3,
  Copy,
  Film,
  Headphones,
  ImagePlus,
  Link2,
  Lock,
  Mail,
  MapPin,
  Mic2,
  Moon,
  Plus,
  Sparkles,
  Settings,
  Users,
  Wand2,
  X
} from "lucide-react";
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
  uploadMemoryFile
} from "./lib/paceApi";
import {
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
import JoinPaceModal from "./components/JoinPaceModal";
import LockedMemoryOverlay from "./components/LockedMemoryOverlay";
import CapsuleLockModal from "./components/CapsuleLockModal";
import "./styles.css";

const covers = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=1200&q=85"
];

const paces = [
  {
    id: "chennai",
    title: "Chennai Nights",
    mood: "late-night",
    members: ["Me", "Riya", "Aadhi", "Noor"],
    last: "12 min ago",
    snippet: "auto rides, bad karaoke, and the sea looking like a secret",
    color: "from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25",
    cover: covers[1],
    collage: [covers[1], covers[3], covers[5]]
  },
  {
    id: "semester",
    title: "Final Semester",
    mood: "nostalgic",
    members: ["Me", "Kavin", "Isha"],
    last: "Yesterday",
    snippet: "we kept saying this was the last normal week",
    color: "from-[#c9beb1]/20 via-[#23211d]/30 to-[#7d8577]/20",
    cover: covers[0],
    collage: [covers[0], covers[2], covers[4]]
  },
  {
    id: "sidegig",
    title: "The SideGig Era",
    mood: "chaotic",
    members: ["Me", "Dev", "Maya", "Arun"],
    last: "3 days ago",
    snippet: "pitch decks at 2:14am and one very dramatic chai break",
    color: "from-[#8f6b67]/25 via-[#181716]/30 to-[#d7d5cf]/15",
    cover: covers[4],
    collage: [covers[4], covers[2], covers[1]]
  }
];

const memories = [
  {
    type: "photo",
    author: "Riya",
    time: "11:42 PM",
    date: "April 18",
    caption: "Marina was louder than all of us tonight.",
    image: covers[1],
    mood: "alive"
  },
  {
    type: "voice",
    author: "Aadhi",
    time: "1:08 AM",
    date: "April 19",
    caption: "A voice note that starts as gossip and ends as life advice.",
    mood: "soft"
  },
  {
    type: "text",
    author: "Me",
    time: "2:17 AM",
    date: "April 19",
    caption:
      "I think we will miss the version of ourselves that only existed in this city, under these lights.",
    mood: "core-memory"
  },
  {
    type: "photo",
    author: "Noor",
    time: "6:21 PM",
    date: "April 20",
    caption: "Proof that golden hour can forgive almost anything.",
    image: covers[3],
    mood: "warm"
  }
];

const moods = ["chaotic", "peaceful", "late-night", "nostalgic", "soft", "adventure", "core-memory"];

function App() {
  const [started, setStarted] = useState(false);
  const [session, setSession] = useState(null);
  const [appPaces, setAppPaces] = useState(paces);
  const [appMemories, setAppMemories] = useState(memories);
  const [activePace, setActivePace] = useState(paces[0]);
  const [view, setView] = useState("home");
  const [modal, setModal] = useState(null);
  const [invite, setInvite] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("invite");
      return token ? { token, loading: true } : null;
    }
    return null;
  });
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? "Connect to sync private Paces" : "Prototype mode"
  );

  const [loadingSession, setLoadingSession] = useState(isSupabaseConfigured);

  function resetToSignedOut() {
    setSession(null);
    setStarted(false);
    setView("home");
    setModal(null);
    setAppPaces(paces);
    setAppMemories(memories);
    setActivePace(paces[0]);
    setSyncStatus(isSupabaseConfigured ? "Signed out" : "Prototype mode");
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out request failed, resetting client locally:", err);
    } finally {
      resetToSignedOut();
    }
  }

  useEffect(() => {
    let isMounted = true;
    let initialLoadDone = false;

    async function loadPacesForSession(currentSession) {
      if (!currentSession) {
        setSyncStatus("Sign in to unlock private sync");
        return;
      }

      try {
        await ensureProfile(currentSession.user);
        const livePaces = await fetchPaces();
        if (!isMounted) return;

        if (livePaces.length) {
          const hydrated = livePaces.map((pace, index) => ({
            ...pace,
            cover: pace.cover || covers[index % covers.length]
          }));
          setAppPaces(hydrated);
          setActivePace(hydrated[0]);
          setSyncStatus("Synced privately");
          setStarted(true);
        } else {
          setAppPaces([]);
          setActivePace(null);
          setSyncStatus("Signed in. Create your first Pace.");
          setStarted(true);
        }
      } catch (err) {
        console.error("Error loading paces for session:", err);
        if (isMounted) setSyncStatus(formatSyncError(err));
      }
    }

    async function initSession() {
      if (!isSupabaseConfigured) {
        setLoadingSession(false);
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
        }
      }
    }

    initSession();

    const unsubscribe = onAuthChange(async (nextSession) => {
      if (!isMounted) return;
      
      // Prevent running auth change handlers during initial session fetch
      if (!initialLoadDone) return;

      setSession((currentSession) => {
        // If session didn't actually change, do nothing to prevent query loops
        if (currentSession?.user?.id === nextSession?.user?.id) {
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

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function checkUrlInvite() {
      try {
        const token = pendingInvite?.token;
        if (!token || !pendingInvite?.loading) return;

        // Resolve mock prototype invites instantly
        if (!isSupabaseConfigured || token.startsWith("prototype-")) {
          const mockPace = paces[0];
          const details = {
            id: token,
            paceId: mockPace.id,
            invitedBy: "prototype",
            isAccepted: false,
            pace: {
              id: mockPace.id,
              title: mockPace.title,
              coverUrl: mockPace.cover,
              mood: mockPace.mood,
              description: mockPace.snippet
            },
            inviter: {
              displayName: "Riya"
            }
          };
          if (active) {
            setPendingInvite({ ...details, token, loading: false });
          }
          return;
        }

        const details = await fetchInviteDetails(token);
        if (!active) return;
        if (details) {
          setPendingInvite({ ...details, token, loading: false });
        } else {
          setPendingInvite(null);
        }
      } catch (err) {
        console.error("Error loading invite details from URL:", err);
        if (active) setPendingInvite(null);
      }
    }

    checkUrlInvite();
    return () => {
      active = false;
    };
  }, [pendingInvite?.loading, session?.user?.id]);

  useEffect(() => {
    let isMounted = true;

    async function loadMemories() {
      if (!session) {
        setAppMemories(memories);
        return;
      }

      if (!activePace?.id || !isLiveId(activePace.id)) {
        setAppMemories([]);
        return;
      }

      try {
        const liveMemories = await fetchMemories(activePace.id);
        if (!isMounted) return;
        setAppMemories(liveMemories);
      } catch (error) {
        if (isMounted) setSyncStatus(formatSyncError(error));
      }
    }

    loadMemories();
    return () => {
      isMounted = false;
    };
  }, [activePace, session?.user?.id]);

  useEffect(() => {
    if (!session || !activePace?.id || !isLiveId(activePace.id)) return undefined;

    return subscribeToMemories(activePace.id, (memory) => {
      setAppMemories((current) => {
        if (current.some((item) => item.id === memory.id)) return current;
        return [memory, ...current];
      });
    });
  }, [activePace, session?.user?.id]);

  async function handleCreatePace(form) {
    console.log("handleCreatePace start", {
      form,
      sessionExists: Boolean(session),
      sessionUserId: session?.user?.id,
      isSupabaseConfigured
    });

    const fallbackPace = {
      id: `local-${Date.now()}`,
      title: form.title,
      mood: form.mood,
      members: ["Me"],
      last: "Just now",
      snippet: form.description,
      color: themeByMood[form.mood] || themeByMood.nostalgic,
      cover: form.previewUrl || form.coverUrl,
      collage: [form.previewUrl || form.coverUrl]
    };

    if (!session && !isSupabaseConfigured) {
      setAppPaces((current) => [fallbackPace, ...current]);
      setActivePace(fallbackPace);
      setSyncStatus("Prototype mode");
      return fallbackPace;
    }

    if (!session && isSupabaseConfigured) {
      throw new Error("Sign in first. Pace was not sent to Supabase.");
    }

    if (!session.user?.id) {
      throw new Error("Sign in again before creating a new Pace.");
    }

    const currentSession = await getSession();
    console.log("createPace session check", {
      storedSessionUserId: session.user?.id,
      currentSessionUserId: currentSession?.user?.id,
      payloadOwnerId: currentSession?.user?.id
    });

    if (session.user?.id !== currentSession?.user?.id) {
      console.warn(
        "Supabase session mismatch detected",
        session.user?.id,
        currentSession?.user?.id
      );
      setSession(currentSession);
    }

    const userId = currentSession?.user?.id || session?.user?.id;
    if (!userId) {
      throw new Error("Sign in again before creating a new Pace.");
    }

    try {
      // 1. Create the Pace row with the base preset cover URL first (activates RLS membership)
      const livePace = await createPace(form);
      console.log("createPace result", livePace);

      let finalCover = livePace.cover || form.coverUrl;

      // 2. If a custom image was selected, upload it to storage now that the creator is an owner
      if (form.file) {
        console.log("Custom cover file detected. Uploading to Supabase Storage...", form.file);
        try {
          const uploadedUrl = await uploadMemoryFile({ paceId: livePace.id, file: form.file });
          console.log("Custom cover upload success. Public URL:", uploadedUrl);
          
          // 3. Update the Pace row with the new custom cover URL
          const updatedRow = await updatePace(livePace.id, { cover_url: uploadedUrl });
          console.log("Pace cover_url update successful", updatedRow);
          finalCover = uploadedUrl;
        } catch (uploadError) {
          console.error("Custom cover upload failed, falling back to preset:", uploadError);
        }
      }

      const hydrated = { ...livePace, cover: finalCover };
      setAppPaces((current) => [hydrated, ...current]);
      setActivePace(hydrated);
      setSyncStatus("Synced privately");
      return hydrated;
    } catch (error) {
      console.error("createPace error:", error);
      const message = readableSupabaseError(error);
      setSyncStatus(message);
      throw error;
    }
  }

  async function handleUpdatePace(form) {
    console.log("handleUpdatePace called", { form, activePaceId: activePace?.id });

    if (!activePace?.id) return;

    // 1. Offline / Prototype mode update
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

    // 2. Supabase mode update
    try {
      let finalCover = form.coverUrl;

      if (form.file) {
        console.log("New custom cover file detected for update. Uploading...", form.file);
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
      const message = readableSupabaseError(error);
      setSyncStatus(message);
      throw error;
    }
  }

  async function handleArchivePace(paceId) {
    console.log("handleArchivePace called for ID:", paceId);
    
    // 1. Offline / Prototype mode archival
    if (!session && !isSupabaseConfigured) {
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? { ...p, archivedAt: new Date().toISOString() } : p))
      );
      if (activePace?.id === paceId) {
        setActivePace(null);
      }
      return;
    }

    // 2. Supabase mode archival
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
      setSyncStatus(readableSupabaseError(error));
      throw error;
    }
  }

  async function handleUnarchivePace(paceId) {
    console.log("handleUnarchivePace called for ID:", paceId);

    // 1. Offline / Prototype mode unarchival
    if (!session && !isSupabaseConfigured) {
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? { ...p, archivedAt: null } : p))
      );
      return;
    }

    // 2. Supabase mode unarchival
    try {
      const unarchivedRow = await unarchivePace(paceId);
      setAppPaces((current) =>
        current.map((p) => (p.id === paceId ? unarchivedRow : p))
      );
      setSyncStatus("Era restored");
    } catch (error) {
      console.error("unarchivePace error:", error);
      setSyncStatus(readableSupabaseError(error));
      throw error;
    }
  }

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

  const displayedPaces = session
    ? appPaces.filter((p) => isLiveId(p.id))
    : appPaces;

  return (
    <main className="min-h-screen overflow-hidden bg-pace-black text-pace-pearl selection:bg-pace-bone selection:text-pace-black">
      <Ambient />
      <FilmGrain />
      <AnimatePresence mode="wait">
        {loadingSession ? (
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
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal === "create" && (
          <CreatePace
            onClose={() => setModal(null)}
            onCreate={async (form) => {
              await handleCreatePace(form);
              setModal(null);
              setView("timeline");
            }}
          />
        )}
        {modal === "edit-pace" && (
          <EditPace
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
        {modal === "memory" && (
          <AddMemory
            onClose={() => setModal(null)}
            onCreate={async (form) => {
              await handleCreateMemory(form);
              setModal(null);
            }}
          />
        )}
        {modal === "capsule" && (
          <CapsuleLockModal 
            onClose={() => setModal(null)} 
            activePace={activePace} 
          />
        )}
        {modal === "invite" && (
          <InviteFriends
            invite={invite}
            onClose={() => {
              setModal(null);
              setInvite(null);
            }}
            onCreate={handleCreateInvite}
          />
        )}
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
              const url = new URL(window.location.href);
              url.searchParams.delete("invite");
              window.history.replaceState({}, document.title, url.pathname);

              try {
                const livePaces = await fetchPaces();
                if (livePaces.length) {
                  const hydrated = livePaces.map((p, idx) => ({
                    ...p,
                    cover: p.cover || covers[idx % covers.length]
                  }));
                  setAppPaces(hydrated);
                  const matched = hydrated.find((p) => p.id === paceId) || hydrated[0];
                  setActivePace(matched);
                  setStarted(true);
                  setView("timeline");
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

function isLiveId(value) {
  if (!value) return false;
  const demoIds = ["chennai", "semester", "sidegig"];
  if (demoIds.includes(value)) return false;
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    value.length > 10
  );
}

function formatSyncError(error) {
  const message = error?.message || "";
  if (message.includes("schema cache") || message.includes("Could not find") || error?.code === "PGRST205") {
    return "Supabase schema pending";
  }
  return "Sync paused";
}

function readableSupabaseError(error) {
  const message = error?.message || "";
  const details = error?.details ? ` ${error.details}` : "";
  const hint = error?.hint ? ` ${error.hint}` : "";

  if (message.includes("create_pace") || error?.code === "PGRST202") {
    return "Run fix-auth-profile-rls.sql in Supabase, then refresh.";
  }
  if (message.includes("violates foreign key constraint")) {
    return "Profile row missing. Run fix-auth-profile-rls.sql.";
  }
  if (message.includes("row-level security")) {
    return "Supabase denied the insert. Sign in again or check RLS.";
  }
  if (message.includes("JWT") || message.includes("not authenticated") || message.includes("Auth session missing")) {
    return "Sign in again before creating a Pace.";
  }

  return `${message}${details}${hint}`.trim() || "Failed to create Pace";
}

function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 bg-grain">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#c6b79d]/10 blur-3xl" />
      <div className="absolute -right-28 top-1/3 h-80 w-80 rounded-full bg-[#8f6b67]/12 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#7d8577]/10 blur-3xl" />
    </div>
  );
}

function FilmGrain() {
  return <div className="grain pointer-events-none fixed inset-0 z-50 opacity-[0.075]" />;
}

function Onboarding({
  onBegin,
  onAuth,
  onEmailAuth,
  onSignup,
  onSigninPassword,
  setSession,
  setStarted,
  session,
  syncStatus
}) {
  const slides = [
    {
      title: "Some moments deserve more than disappearing chats.",
      desc: "A private place for the small circles, the late nights, and the inside jokes that shaped who you are."
    },
    {
      title: "People come and go. Memories stay.",
      desc: "Keep the ticket stubs, the messy voice notes, and the blur of photos in a space that doesn't expire."
    },
    {
      title: "Create private spaces for the phases that mattered.",
      desc: "An archived era, a wild semester, or just a quiet evening by the sea. Shared only with those who were there."
    }
  ];

  const [index, setIndex] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authMode, setAuthMode] = useState("magic"); // "magic", "password", "signup"
  const [authStatus, setAuthStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = ((index + 1) / slides.length) * 100;

  async function handleEmailAuth() {
    if (!email.trim()) {
      setAuthStatus("Enter your email to get a private sign-in link.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onEmailAuth(email.trim());
      setAuthStatus("Check your email for the Pace sign-in link.");
    } catch (error) {
      setAuthStatus(error.message || "Email sign-in is not ready yet.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderAuth(provider) {
    setLoading(true);
    setAuthStatus("");
    try {
      setAuthStatus(`Opening ${provider} sign-in...`);
      await onAuth(provider);
    } catch (error) {
      setAuthStatus(error.message || `${provider} sign-in is not enabled in Supabase.`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup() {
    if (!email.trim() || !password) {
      setAuthStatus("Provide email and password to create an account.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onSignup(email.trim(), password, { full_name: name || undefined });
      const currentSession = await getSession();
      if (currentSession?.user) await ensureProfile(currentSession.user);
      setSession(currentSession);
      if (currentSession) {
        setAuthStatus("Account created and signed in.");
        onBegin();
      } else {
        setAuthStatus("Account created. Check email if confirmation is enabled.");
      }
    } catch (error) {
      setAuthStatus(error.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSigninPassword() {
    if (!email.trim() || !password) {
      setAuthStatus("Enter email and password to sign in.");
      return;
    }
    setLoading(true);
    setAuthStatus("");
    try {
      await onSigninPassword(email.trim(), password);
      const currentSession = await getSession();
      if (currentSession?.user) await ensureProfile(currentSession.user);
      setSession(currentSession);
      if (currentSession) {
        setAuthStatus("Signed in.");
        onBegin();
      } else {
        setAuthStatus("Sign-in started, but no session returned yet.");
      }
    } catch (error) {
      setAuthStatus(error.message || "Password sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      className="relative z-10 flex max-h-screen min-h-screen items-end overflow-y-auto px-5 pb-8 pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background Image Carousel with Ken Burns subtle scale */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={covers[index + 1] || covers[0]}
            alt=""
            className="h-full w-full object-cover opacity-45"
            initial={{ scale: 1.12, opacity: 0, filter: "blur(5px)" }}
            animate={{ scale: 1.02, opacity: 0.45, filter: "blur(0px)" }}
            exit={{ scale: 0.98, opacity: 0, filter: "blur(5px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-[#080807]/30 via-[#080807]/65 to-[#080807]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-md flex flex-col min-h-[calc(100vh-4rem)] justify-between">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-pace-pearl tracking-wide">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] border border-white/10 backdrop-blur-md">
              <Moon size={13} className="text-pace-pearl" />
            </div>
            <span>Pace</span>
          </div>
          
          <button
            onClick={() => {
              if (showAuth) {
                setShowAuth(false);
                setAuthStatus("");
              } else {
                setShowAuth(true);
              }
            }}
            className="rounded-full border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] px-4 py-1.5 text-xs font-medium text-pace-bone backdrop-blur-xl transition active:scale-95"
          >
            {showAuth ? "Narrative" : "Sign In"}
          </button>
        </div>

        {/* Narrative / Authentication Panel */}
        <div className="my-auto py-10">
          <AnimatePresence mode="wait">
            {!showAuth ? (
              <motion.div
                key="narrative"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                {/* Slide Number / Progress bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-pace-smoke mb-2.5">
                    <span>A Private Memory Network</span>
                    <span>{index + 1} of 3</span>
                  </div>
                  <div className="h-[2px] w-full rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-pace-pearl"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -16, opacity: 0, filter: "blur(8px)" }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-normal text-pace-pearl select-none">
                      {slides[index].title}
                    </h1>
                    <p className="mt-4 text-sm leading-relaxed text-pace-bone/70 select-none">
                      {slides[index].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Continue button */}
                <div className="mt-10">
                  <button
                    className="group relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow transition duration-300 hover:scale-[1.01] active:scale-[0.98]"
                    onClick={() => {
                      if (index < slides.length - 1) {
                        setIndex(index + 1);
                      } else {
                        setShowAuth(true);
                      }
                    }}
                  >
                    <span>{index < slides.length - 1 ? "Continue" : "Begin Sharing"}</span>
                    <Sparkles size={14} className="opacity-70 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 25, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.98 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-soft backdrop-blur-2xl"
              >
                {/* Header */}
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold tracking-tight text-pace-pearl">Welcome to Pace</h2>
                  <p className="mt-1.5 text-xs text-pace-smoke">Sign in privately to protect your era’s memory box.</p>
                </div>

                {/* Segmented Tab Slider Control */}
                <div className="relative flex rounded-full bg-white/[0.04] p-1 border border-white/5 mb-6">
                  {[
                    { id: "magic", label: "Magic Link" },
                    { id: "password", label: "Sign In" },
                    { id: "signup", label: "Register" }
                  ].map((tab) => {
                    const active = authMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          setAuthMode(tab.id);
                          setAuthStatus("");
                        }}
                        className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-300 ${
                          active ? "text-pace-black" : "text-pace-smoke hover:text-pace-pearl"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="auth-tab-capsule"
                            className="absolute inset-0 rounded-full bg-pace-pearl"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-20">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Form fields with custom vector icons and glassmorphic designs */}
                <div className="grid gap-3.5">
                  {authMode === "signup" && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                        <Users size={16} />
                      </div>
                      <input
                        className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                        placeholder="Your display name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  {authMode !== "magic" && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pace-smoke/60 group-focus-within:text-pace-pearl transition-colors">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        className="w-full rounded-full border border-white/5 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-pace-pearl outline-none placeholder:text-pace-smoke/60 hover:bg-white/[0.05] focus:border-pace-bone/35 focus:bg-white/[0.06] transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>

                {/* Animated status alert feedback box */}
                <AnimatePresence>
                  {authStatus && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      className={`mt-4 overflow-hidden rounded-xl border p-3 text-xs leading-relaxed ${
                        authStatus.includes("Check") || authStatus.includes("created") || authStatus.includes("Signed")
                          ? "border-pace-moss/20 bg-pace-moss/10 text-pace-moss"
                          : "border-pace-wine/25 bg-pace-wine/10 text-pace-wine"
                      }`}
                    >
                      {authStatus}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Action Button with beautiful glowing pulse */}
                <div className="mt-5">
                  <button
                    disabled={loading}
                    className="relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-xs font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
                    onClick={() => {
                      if (authMode === "signup") {
                        handleSignup();
                      } else if (authMode === "password") {
                        handleSigninPassword();
                      } else {
                        handleEmailAuth();
                      }
                    }}
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-pace-black border-t-transparent" />
                    ) : authMode === "signup" ? (
                      "Create Private Account"
                    ) : authMode === "password" ? (
                      "Sign In with Password"
                    ) : (
                      "Send Magic Login Link"
                    )}
                  </button>
                </div>

                {/* Social Login Separator */}
                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5" />
                  </div>
                  <span className="relative bg-[#0c0c0b] px-3.5 text-[10px] uppercase tracking-widest text-pace-smoke/70">
                    Or secure with
                  </span>
                </div>

                {/* Better Provider Buttons with Vector Logo Icons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProviderAuth("google")}
                    disabled={loading}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/5 bg-white/[0.02] text-xs font-semibold text-pace-bone hover:bg-white/[0.06] hover:text-pace-pearl transition backdrop-blur-xl group active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 text-pace-bone group-hover:text-pace-pearl transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.746-.08-1.32-.176-1.886H12.24z"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    onClick={() => handleProviderAuth("apple")}
                    disabled={loading}
                    className="flex h-11 items-center justify-center gap-2 rounded-full border border-white/5 bg-white/[0.02] text-xs font-semibold text-pace-bone hover:bg-white/[0.06] hover:text-pace-pearl transition backdrop-blur-xl group active:scale-[0.98]"
                  >
                    <svg className="h-4 w-4 text-pace-bone group-hover:text-pace-pearl transition-colors" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                    </svg>
                    <span>Apple</span>
                  </button>
                </div>

                {/* Subtle Guest / Prototype Bypass mode */}
                <div className="mt-7 text-center">
                  <button
                    onClick={() => {
                      setStarted(true);
                      onBegin();
                    }}
                    className="text-xs font-medium text-pace-smoke hover:text-pace-pearl underline underline-offset-4 decoration-white/10 hover:decoration-white/30 transition-all"
                  >
                    Enter prototype mode & explore standard demo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sync Status / Footer */}
        <div className="text-center pt-2 select-none">
          <p className="text-[10px] tracking-widest uppercase text-pace-smoke/60">
            {session ? "Connected Privately" : syncStatus}
          </p>
        </div>

      </div>
    </motion.section>
  );
}

function Shell({
  paces,
  memories,
  activePace,
  setActivePace,
  view,
  setView,
  setModal,
  syncStatus,
  session,
  onSignOut
}) {
  return (
    <motion.section
      className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-4 pt-5"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <PhoneChrome>
        <AnimatePresence mode="wait">
          {view === "home" && (
            <Home
              setView={setView}
              setModal={setModal}
              setActivePace={setActivePace}
              paces={paces}
              syncStatus={syncStatus}
              session={session}
              key="home"
            />
          )}
          {view === "timeline" && (
            <Timeline
              pace={activePace}
              memories={memories}
              setView={setView}
              setModal={setModal}
              key="timeline"
            />
          )}
          {view === "profile" && (
            <Profile setView={setView} session={session} onSignOut={onSignOut} key="profile" />
          )}
        </AnimatePresence>
      </PhoneChrome>
    </motion.section>
  );
}

function PhoneChrome({ children }) {
  return (
    <div className="relative flex min-h-[calc(100vh-2.25rem)] flex-col overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#0d0d0c]/80 shadow-soft backdrop-blur-2xl">
      <div className="absolute left-1/2 top-3 z-20 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/18" />
      {children}
    </div>
  );
}

function Home({ paces, syncStatus, session, setView, setModal, setActivePace }) {
  const [showArchived, setShowArchived] = useState(false);

  const activePaces = paces.filter((p) => !p.archivedAt);
  const archivedPaces = paces.filter((p) => p.archivedAt);

  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-y-auto no-scrollbar"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="px-5 pb-3 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">{syncStatus}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-none">Pace</h1>
            {session?.user?.email && (
              <p className="mt-2 max-w-[12rem] truncate text-xs text-pace-bone">{session.user.email}</p>
            )}
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-pace-bone backdrop-blur-xl hover:bg-white/[0.12] transition duration-200"
            onClick={() => setView("profile")}
            aria-label="Open profile"
          >
            <Archive size={18} />
          </button>
        </div>
        <p className="mt-5 max-w-[18rem] text-sm leading-6 text-pace-bone/75">
          Your active eras, held quietly with the people who were there.
        </p>
      </header>

      {/* Active Paces horizontal list */}
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-5 pb-8 pt-2">
        {activePaces.length > 0 ? (
          activePaces.map((pace) => (
            <PaceCard
              pace={pace}
              key={pace.id}
              onOpen={() => {
                setActivePace(pace);
                setView("timeline");
              }}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8 border border-white/5 bg-white/[0.02] rounded-[2rem] min-h-[30rem] w-full snaps-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-pace-pearl/10 border border-pace-pearl/20 text-pace-pearl mb-4">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-pace-pearl">Your first era awaits</h3>
            <p className="mt-2 text-xs leading-relaxed text-pace-smoke max-w-[200px]">
              Create a private shared room for a trip, a semester, or a late night phase.
            </p>
          </div>
        )}
      </div>

      {/* Soft Archival Hub Drawer */}
      {archivedPaces.length > 0 && (
        <div className="px-5 pb-28 pt-4 flex flex-col border-t border-white/[0.04] mt-4">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-xs font-semibold text-pace-smoke hover:text-pace-pearl transition duration-200 active:scale-95"
          >
            <Archive size={12} />
            <span>{showArchived ? "Hide Archived Eras" : `Show Archived Eras (${archivedPaces.length})`}</span>
          </button>
          
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="no-scrollbar flex snap-x gap-4 overflow-x-auto py-2"
              >
                {archivedPaces.map((pace) => (
                  <PaceCard
                    pace={pace}
                    key={pace.id}
                    isArchived={true}
                    onOpen={() => {
                      setActivePace(pace);
                      setView("timeline");
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Create Pace Button */}
      <div className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2">
        <button
          className="flex h-14 items-center gap-2 rounded-full border border-white/15 bg-pace-pearl px-5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98] hover:scale-[1.02]"
          onClick={() => setModal("create")}
        >
          <Plus size={18} />
          Create Pace
        </button>
      </div>
    </motion.div>
  );
}

function PaceCard({ pace, onOpen, isArchived = false }) {
  const memoriesPhotos = pace.collage ? pace.collage.slice(1, 4) : [];

  return (
    <motion.button
      className={`relative h-[34rem] min-w-[84%] snap-center overflow-hidden rounded-[2rem] border text-left shadow-soft transition-all duration-300 ${
        isArchived
          ? "border-pace-wine/20 bg-[#120a09]/40 opacity-75 saturate-[0.3] hover:saturate-[0.8] hover:opacity-95"
          : "border-white/10 bg-white/[0.055] hover:border-white/20"
      }`}
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
    >
      <img src={pace.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className={`absolute inset-0 bg-gradient-to-b ${pace.color}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/30 to-black/90" />

      {/* Scrapbook Polaroid Collage Stack in Card Background */}
      {memoriesPhotos.length > 0 && (
        <div className="absolute inset-x-0 top-14 flex items-center justify-center h-44 select-none pointer-events-none">
          {memoriesPhotos.map((imgUrl, i) => {
            const rot = i === 0 ? "rotate-[-7deg]" : i === 1 ? "rotate-[6deg]" : "rotate-[-2deg]";
            const scale = i === 0 ? "scale-90 -translate-x-6 z-10" : i === 1 ? "scale-95 translate-x-6 z-20" : "scale-[0.8] z-0 opacity-40 translate-y-2";
            return (
              <div
                key={imgUrl}
                className={`absolute w-28 h-28 rounded-lg border-2 border-white bg-white/10 p-1 shadow-soft transition-transform ${rot} ${scale}`}
              >
                <img src={imgUrl} alt="" className="h-full w-full object-cover rounded-md" />
              </div>
            );
          })}
        </div>
      )}

      {isArchived && (
        <div className="absolute left-4 top-4 rounded-full border border-pace-wine/30 bg-pace-wine/25 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-pace-wine backdrop-blur-xl animate-pulse">
          Archived Era
        </div>
      )}

      <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
        {pace.last}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="mb-4 flex -space-x-2">
          {pace.members.slice(0, 4).map((member, index) => (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-black/30 bg-pace-pearl text-[10px] font-semibold text-pace-black"
              key={`${member}-${index}`}
              style={{ transform: `translateY(${index % 2 ? 4 : 0}px)` }}
            >
              {member[0]}
            </span>
          ))}
        </div>
        <h2 className="text-4xl font-semibold leading-none">{pace.title}</h2>
        <p className="mt-3 text-sm leading-6 text-pace-bone/82 line-clamp-2">{pace.snippet}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-full border border-white/12 bg-white/[0.08] px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
            {pace.mood}
          </span>
          <span className="flex items-center gap-1 text-xs text-pace-bone">
            <Users size={14} />
            {pace.members.length}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function Timeline({ pace, memories, setView, setModal }) {
  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative h-72 overflow-hidden">
        <img src={pace.cover} alt="" className="h-full w-full object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/20 to-[#0d0d0c]" />
        <button
          className="absolute left-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setView("home")}
          aria-label="Back home"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="absolute right-[8.5rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl hover:bg-black/50 transition active:scale-95 text-pace-bone"
          onClick={() => setModal("edit-pace")}
          aria-label="Edit Era Settings"
        >
          <Settings size={17} />
        </button>
        <button
          className="absolute right-[4.75rem] top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setModal("invite")}
          aria-label="Invite friends"
        >
          <Users size={17} />
        </button>
        <button
          className="absolute right-5 top-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-black/30 backdrop-blur-xl"
          onClick={() => setModal("capsule")}
          aria-label="Open capsule"
        >
          <Lock size={17} />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs uppercase tracking-[0.22em] text-pace-bone/75">{pace.mood}</p>
          <h1 className="mt-2 text-4xl font-semibold leading-none">{pace.title}</h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-pace-bone">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {pace.members.join(", ")}
            </span>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24">
        <AIRecap />
        {memories.map((memory, index) => (
          <MemoryCard memory={memory} key={`${memory.type}-${index}`} index={index} />
        ))}
      </div>
      <button
        className="absolute bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-pace-pearl text-pace-black shadow-glow transition active:scale-[0.98]"
        onClick={() => setModal("memory")}
        aria-label="Add memory"
      >
        <ImagePlus size={21} />
      </button>
    </motion.div>
  );
}

function AIRecap() {
  return (
    <motion.section
      className="mb-5 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-2xl"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-pace-smoke">
        <Bot size={14} />
        AI recap
      </div>
      <p className="mt-3 text-lg font-medium leading-7">
        April felt chaotic, loud, unforgettable, and strangely beautiful.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-pace-bone">
        <span className="rounded-full bg-white/[0.07] px-2 py-2">top photos</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-2">mood drift</span>
        <span className="rounded-full bg-white/[0.07] px-2 py-2">story book</span>
      </div>
    </motion.section>
  );
}

function MemoryCard({ memory, index }) {
  const [isTimeLocked, setIsTimeLocked] = useState(
    memory.lockedUntil ? new Date(memory.lockedUntil) > new Date() : false
  );

  return (
    <motion.article
      className={`mb-6 ${index % 2 ? "pl-8" : "pr-8"}`}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
    >
      <div className="mb-3 flex items-center justify-between text-xs text-pace-smoke">
        <span>{memory.date}</span>
        <span>{memory.time}</span>
      </div>
      <div className="relative memory-card rounded-[1.4rem] border border-white/10 bg-[#f4eee3] p-2 text-pace-black shadow-soft overflow-hidden">
        {isTimeLocked && (
          <LockedMemoryOverlay 
            lockedUntil={memory.lockedUntil} 
            onUnlock={() => setIsTimeLocked(false)} 
          />
        )}
        
        {memory.type === "photo" && (
          <img 
            src={isTimeLocked ? "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?auto=format&fit=crop&w=10&q=10" : memory.image} 
            alt="" 
            className="aspect-[4/5] w-full rounded-[1rem] object-cover" 
          />
        )}
        {memory.type === "voice" && <VoiceNote />}
        {memory.type === "text" && (
          <div className="grid min-h-64 place-items-center rounded-[1rem] bg-[#191816] p-6 text-center text-pace-pearl">
            <p className="text-2xl font-medium leading-tight">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
        {memory.type !== "text" && (
          <div className="px-2 pb-2 pt-3">
            <p className="font-medium leading-6">
              {isTimeLocked ? "Locked capsule" : memory.caption}
            </p>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-pace-smoke">
        {memory.author} · {memory.mood}
      </p>
    </motion.article>
  );
}

function VoiceNote() {
  return (
    <div className="rounded-[1rem] bg-[#191816] p-5 text-pace-pearl">
      <div className="mb-5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm">
          <Mic2 size={16} />
          0:42
        </span>
        <Headphones size={17} className="text-pace-bone" />
      </div>
      <div className="flex h-28 items-center gap-1">
        {Array.from({ length: 34 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-pace-bone"
            animate={{ height: [18, 72 - (i % 9) * 4, 24 + (i % 6) * 7] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.035 }}
          />
        ))}
      </div>
    </div>
  );
}

function CreatePace({ onClose, onCreate }) {
  const [title, setTitle] = useState("Pondy Trip");
  const [description, setDescription] = useState("For the weekend that felt like a film.");
  const [mood, setMood] = useState("nostalgic");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(5);
  const [coverFile, setCoverFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setStatus("Give this Pace a name first.");
      return;
    }

    setIsSaving(true);
    setStatus("Creating your private Pace...");
    try {
      await onCreate({
        title: title.trim(),
        description,
        mood,
        coverUrl: covers[selectedPresetIndex],
        file: coverFile,
        previewUrl: localPreviewUrl
      });
    } catch (error) {
      setStatus(readableSupabaseError(error));
      setIsSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">New Pace</p>
          <h2 className="mt-1 text-3xl font-semibold">Name the era</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      
      <Field label="Pace name" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />

      {/* Visual Cover Selector */}
      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-[0.2em] text-pace-smoke block mb-2">Cover image</label>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto py-1">
          {/* Native Upload Trigger Card */}
          <label className="relative flex h-16 w-16 min-w-[4rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-pace-smoke hover:border-pace-pearl hover:text-pace-pearl hover:bg-white/[0.06] transition duration-200 active:scale-95">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  setLocalPreviewUrl(URL.createObjectURL(file));
                }
              }}
            />
            <Camera size={16} />
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider">Upload</span>
          </label>

          {/* Preset Scroll List */}
          {covers.map((url, idx) => {
            const isSelected = !coverFile && selectedPresetIndex === idx;
            return (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setCoverFile(null);
                  setLocalPreviewUrl(null);
                }}
                className={`relative h-16 w-16 min-w-[4rem] rounded-xl overflow-hidden border transition duration-200 active:scale-95 ${
                  isSelected ? "border-pace-pearl scale-95 shadow-glow" : "border-white/5 opacity-65 hover:opacity-100"
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-pace-pearl">
                    <Sparkles size={11} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Cover Preview */}
      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 relative h-44 w-full group">
        <img
          src={localPreviewUrl || covers[selectedPresetIndex]}
          alt="Cover Preview"
          className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {coverFile && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-md px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-pace-bone">
            Custom Upload
          </div>
        )}
      </div>

      {/* Mood Selectors */}
      <div className="mt-4 flex flex-wrap gap-2">
        {moods.map((preset) => (
          <button
            key={preset}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              preset === mood
                ? "border-pace-bone bg-pace-pearl text-pace-black"
                : "border-white/10 bg-white/[0.07] text-pace-bone"
            }`}
            onClick={() => setMood(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98]"
        onClick={submit}
        disabled={isSaving}
      >
        <Users size={17} />
        {isSaving ? "Creating..." : "Create private Pace"}
      </button>
      {status && <p className="mt-4 text-center text-xs leading-5 text-pace-bone">{status}</p>}
    </Modal>
  );
}

function EditPace({ pace, onClose, onUpdate, onArchive, onUnarchive }) {
  const [title, setTitle] = useState(pace.title);
  const [description, setDescription] = useState(pace.snippet || pace.description || "");
  const [mood, setMood] = useState(pace.mood || "nostalgic");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(() => {
    const idx = covers.indexOf(pace.cover);
    return idx !== -1 ? idx : 0;
  });
  const [coverFile, setCoverFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(() => {
    return covers.indexOf(pace.cover) === -1 ? pace.cover : null;
  });
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit() {
    if (!title.trim()) {
      setStatus("Give this Pace a name first.");
      return;
    }

    setIsSaving(true);
    setStatus("Saving era settings...");
    try {
      await onUpdate({
        title: title.trim(),
        description,
        mood,
        coverUrl: covers[selectedPresetIndex],
        file: coverFile,
        previewUrl: localPreviewUrl
      });
    } catch (error) {
      setStatus(readableSupabaseError(error));
      setIsSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Edit Pace</p>
          <h2 className="mt-1 text-3xl font-semibold">Era settings</h2>
        </div>
        <Close onClose={onClose} />
      </div>

      <Field label="Pace name" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />

      {/* Visual Cover Selector */}
      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-[0.2em] text-pace-smoke block mb-2">Cover image</label>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto py-1">
          {/* Native Upload Trigger Card */}
          <label className="relative flex h-16 w-16 min-w-[4rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-pace-smoke hover:border-pace-pearl hover:text-pace-pearl hover:bg-white/[0.06] transition duration-200 active:scale-95">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  setLocalPreviewUrl(URL.createObjectURL(file));
                }
              }}
            />
            <Camera size={16} />
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider">Upload</span>
          </label>

          {/* Preset Scroll List */}
          {covers.map((url, idx) => {
            const isSelected = !coverFile && !localPreviewUrl && selectedPresetIndex === idx;
            return (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setCoverFile(null);
                  setLocalPreviewUrl(null);
                }}
                className={`relative h-16 w-16 min-w-[4rem] rounded-xl overflow-hidden border transition duration-200 active:scale-95 ${
                  isSelected ? "border-pace-pearl scale-95 shadow-glow" : "border-white/5 opacity-65 hover:opacity-100"
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
                {isSelected && (
                  <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-pace-pearl">
                    <Sparkles size={11} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Cover Preview */}
      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 relative h-44 w-full group">
        <img
          src={localPreviewUrl || covers[selectedPresetIndex]}
          alt="Cover Preview"
          className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {(coverFile || (localPreviewUrl && covers.indexOf(localPreviewUrl) === -1)) && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-md px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-pace-bone">
            Custom Image
          </div>
        )}
      </div>

      {/* Mood Selectors */}
      <div className="mt-4 flex flex-wrap gap-2">
        {moods.map((preset) => (
          <button
            key={preset}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
              preset === mood
                ? "border-pace-bone bg-pace-pearl text-pace-black"
                : "border-white/10 bg-white/[0.07] text-pace-bone"
            }`}
            onClick={() => setMood(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Action Buttons Row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <button
          className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          onClick={submit}
          disabled={isSaving}
        >
          <Wand2 size={16} />
          {isSaving ? "Saving..." : "Save settings"}
        </button>

        <button
          type="button"
          className={`flex h-14 items-center justify-center gap-2 rounded-full border transition active:scale-95 disabled:opacity-50 ${
            pace.archivedAt
              ? "border-pace-moss/25 bg-pace-moss/10 text-xs font-bold text-pace-moss hover:bg-pace-moss/18"
              : "border-pace-wine/25 bg-pace-wine/10 text-xs font-bold text-pace-wine hover:bg-pace-wine/18"
          }`}
          onClick={() => {
            if (pace.archivedAt) {
              if (confirm("Restore this era back to your active dashboard?")) {
                onUnarchive(pace.id);
              }
            } else {
              if (confirm("Are you sure you want to archive this era? You can restore it anytime.")) {
                onArchive(pace.id);
              }
            }
          }}
          disabled={isSaving}
        >
          {pace.archivedAt ? "Restore" : "Archive"}
        </button>
      </div>
      {status && <p className="mt-4 text-center text-xs leading-5 text-pace-bone">{status}</p>}
    </Modal>
  );
}

function AddMemory({ onClose, onCreate }) {
  const [type, setType] = useState("photo");
  const [caption, setCaption] = useState("felt like a core memory while it was happening");
  const [locationName, setLocationName] = useState("Besant Nagar");
  const [mood, setMood] = useState("soft");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [lockDuration, setLockDuration] = useState("none");
  const mediaUrl = covers[3];

  function getLockDate() {
    if (lockDuration === "1m") return new Date(Date.now() + 60 * 1000).toISOString();
    if (lockDuration === "1d") return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (lockDuration === "1y") return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return null;
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Add memory</p>
          <h2 className="mt-1 text-3xl font-semibold">Keep this one</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <MemoryAction icon={<Camera size={18} />} label="Photo" active={type === "photo"} onClick={() => setType("photo")} />
        <MemoryAction icon={<Mic2 size={18} />} label="Voice" active={type === "voice"} onClick={() => setType("voice")} />
        <MemoryAction icon={<Film size={18} />} label="Video" active={type === "video"} onClick={() => setType("video")} />
      </div>
      <label className="mt-4 block overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.06]">
        <input
          className="sr-only"
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={(event) => {
            const nextFile = event.target.files?.[0] || null;
            setFile(nextFile);
            setPreviewUrl(nextFile && nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : null);
          }}
        />
        <div className="flex min-h-32 items-center gap-4 p-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.1rem] bg-pace-pearl text-pace-black">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-full w-full rounded-[1.1rem] object-cover" />
            ) : (
              <ImagePlus size={22} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{file ? file.name : "Upload a memory file"}</p>
            <p className="mt-1 text-xs leading-5 text-pace-smoke">
              Photos, videos, voice notes, or screenshots. Stored privately with this Pace when signed in.
            </p>
          </div>
        </div>
      </label>
      <Field label="Caption" value={caption} onChange={setCaption} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Date" value="Tonight" icon={<CalendarDays size={15} />} />
        <Field label="Place" value={locationName} onChange={setLocationName} icon={<MapPin size={15} />} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {moods.slice(0, 5).map((preset) => (
          <button
            key={preset}
            className={`rounded-full border px-3 py-2 text-xs transition ${
              preset === mood
                ? "border-pace-bone bg-pace-pearl text-pace-black"
                : "border-white/10 bg-white/[0.07] text-pace-bone"
            }`}
            onClick={() => setMood(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Time Lock Selector */}
      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-pace-smoke mb-3">
          <Lock size={13} />
          Time Lock Capsule
        </div>
        <div className="flex gap-2">
          {["none", "1m", "1d", "1y"].map((dur) => (
            <button
              key={dur}
              type="button"
              className={`flex-1 rounded-full border py-2 text-xs transition ${
                dur === lockDuration
                  ? "border-pace-bone bg-pace-pearl text-pace-black font-semibold"
                  : "border-white/10 bg-white/[0.04] text-pace-bone"
              }`}
              onClick={() => setLockDuration(dur)}
            >
              {dur === "none" ? "None" : dur === "1m" ? "1 min (test)" : dur === "1d" ? "1 day" : "1 year"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Wand2 size={16} />
          AI caption
        </div>
        <p className="mt-2 text-lg leading-7">we were young in a way the camera understood</p>
      </div>
      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black"
        onClick={() =>
          onCreate({
            type,
            caption,
            mood,
            file,
            previewUrl,
            mediaUrl: type === "photo" ? previewUrl || mediaUrl : null,
            locationName,
            lockedUntil: getLockDate()
          })
        }
      >
        <ImagePlus size={17} />
        Save memory
      </button>
    </Modal>
  );
}

function InviteFriends({ invite, onClose, onCreate }) {
  const [email, setEmail] = useState("");
  const [currentInvite, setCurrentInvite] = useState(invite);
  const [status, setStatus] = useState("Private links expire in 14 days.");

  async function createLink() {
    try {
      const nextInvite = await onCreate({ email });
      setCurrentInvite(nextInvite);
      setStatus(email ? `Invite prepared for ${email}.` : "Invite link created.");
    } catch (error) {
      setStatus(error.message || "Invite could not be created yet.");
    }
  }

  async function copyLink() {
    if (!currentInvite?.url) return;
    await navigator.clipboard.writeText(currentInvite.url);
    setStatus("Invite link copied.");
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Invite</p>
          <h2 className="mt-1 text-3xl font-semibold">Keep it private</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      <Field label="Friend email" value={email} onChange={setEmail} icon={<Mail size={15} />} />
      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Link2 size={16} />
          Quiet access
        </div>
        <p className="mt-2 text-sm leading-6 text-pace-smoke">
          Invites are tied to this Pace. No public profile, no discovery, no follower graph.
        </p>
        {currentInvite?.url && (
          <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-3 text-xs leading-5 text-pace-bone">
            {currentInvite.url}
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="flex h-14 items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black"
          onClick={createLink}
        >
          <Link2 size={16} />
          Create link
        </button>
        <button
          className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone"
          onClick={copyLink}
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-pace-smoke">{status}</p>
    </Modal>
  );
}

function Capsule({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Memory capsule</p>
          <h2 className="mt-1 text-3xl font-semibold">Lock it for later</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      <div className="grid h-56 place-items-center rounded-[1.6rem] border border-white/10 bg-white/[0.06]">
        <motion.div
          className="grid h-24 w-24 place-items-center rounded-full bg-pace-pearl text-pace-black"
          animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 rgba(0,0,0,0)", "0 0 70px rgba(245,241,234,.25)", "0 0 0 rgba(0,0,0,0)"] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <Lock size={30} />
        </motion.div>
      </div>
      <div className="mt-4 grid gap-2">
        {["Open after 1 year", "Open after graduation", "Open next summer"].map((time) => (
          <button
            key={time}
            className="flex h-12 items-center justify-between rounded-full border border-white/10 bg-white/[0.06] px-4 text-sm text-pace-bone"
          >
            {time}
            <Clock3 size={16} />
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Profile({ setView, session, onSignOut }) {
  const [status, setStatus] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const email = session?.user?.email;
  const name =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    email?.split("@")[0] ||
    "Mohammed";
  const initial = name[0]?.toUpperCase() || "M";

  return (
    <motion.div
      className="flex flex-1 flex-col px-5 pb-7 pt-8"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      <button
        className="mb-8 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07]"
        onClick={() => setView("home")}
        aria-label="Back home"
      >
        <ChevronLeft size={20} />
      </button>
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-pace-pearl text-3xl font-semibold text-pace-black">
        {initial}
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold">{name}</h1>
      <p className="mt-2 truncate text-center text-xs text-pace-smoke">
        {email || "Not signed in yet"}
      </p>
      <p className="mx-auto mt-2 max-w-64 text-center text-sm leading-6 text-pace-bone/75">
        No followers. No performance. Just the rooms that still mean something.
      </p>
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat value="7" label="active" />
        <Stat value="19" label="archived" />
        <Stat value="143" label="memories" />
      </div>
      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Sparkles size={16} />
          Recap history
        </div>
        <p className="mt-3 text-xl font-medium leading-7">
          Your year kept returning to late nights, coast roads, and people who made ordinary days cinematic.
        </p>
      </div>
      {session ? (
        <button
          className="mt-4 h-12 rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone"
          onClick={async () => {
            setIsSigningOut(true);
            setStatus("Signing out...");
            try {
              await onSignOut();
            } catch (error) {
              setStatus(error?.message || "Could not sign out.");
              setIsSigningOut(false);
            }
          }}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      ) : (
        <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4 text-center text-sm leading-6 text-pace-bone">
          Sign in from the welcome screen to store Paces and memories in Supabase.
        </div>
      )}
      {status && <p className="mt-3 text-center text-xs text-pace-bone">{status}</p>}
    </motion.div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] p-3 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-pace-smoke">{label}</div>
    </div>
  );
}

function MemoryAction({ icon, label, active, onClick }) {
  return (
    <button
      className={`grid h-24 place-items-center rounded-[1.3rem] border text-sm transition ${
        active
          ? "border-pace-bone bg-pace-pearl text-pace-black"
          : "border-white/10 bg-white/[0.06] text-pace-bone"
      }`}
      onClick={onClick}
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08]">{icon}</span>
      {label}
    </button>
  );
}

function Field({ label, value, icon, onChange }) {
  return (
    <label className="mt-4 block rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3">
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-pace-smoke">
        {icon}
        {label}
      </span>
      <input
        className="mt-2 w-full bg-transparent text-base text-pace-pearl outline-none placeholder:text-pace-smoke"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={!onChange}
      />
    </label>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 px-4 pb-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11100f]/95 p-5 shadow-soft"
        initial={{ y: 80, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60, scale: 0.98 }}
        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.45 }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Close({ onClose }) {
  return (
    <button
      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06]"
      onClick={onClose}
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );
}

createRoot(document.getElementById("root")).render(<App />);
