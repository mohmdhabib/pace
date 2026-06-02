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

// Modular FSD imports
import { covers, paces, memories, moods } from "./shared/constants";
import { isLiveId, formatSyncError, readableSupabaseError } from "./shared/utils";
import Onboarding from "./features/auth/Onboarding";
import Shell from "./views/Shell";
import Profile from "./views/Profile";
import CreatePace from "./features/spaces/CreatePace";
import EditPace from "./features/spaces/EditPace";
import InviteFriends from "./features/spaces/InviteFriends";
import AddMemory from "./features/memories/AddMemory";

// Auxiliary pre-separated components
import JoinPaceModal from "./components/JoinPaceModal";
import CapsuleLockModal from "./components/CapsuleLockModal";
import "./styles.css";

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

    // Safety Timeout: 2.5s fallback to prevent getting stuck in "unlocking pace"
    const safetyTimeout = setTimeout(() => {
      if (isMounted && !initialLoadDone) {
        console.warn("Unlocking pace session loading timed out. Force bypassing safety lock.");
        setLoadingSession(false);
        initialLoadDone = true;
      }
    }, 2500);

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
          setStarted(true); // Automatically bypass onboarding if a live session exists
        } else {
          setAppPaces([]);
          setActivePace(null);
          setSyncStatus("Signed in. Create your first Pace.");
          setStarted(true); // Automatically bypass onboarding if a live session exists
        }
      } catch (err) {
        console.error("Error loading paces for session:", err);
        if (isMounted) {
          setSyncStatus(formatSyncError(err));
          // Self-healing auth check: if the session has expired or is invalid, clean it up automatically
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
      clearTimeout(safetyTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync memories in real-time
  useEffect(() => {
    if (!activePace?.id || !isLiveId(activePace.id)) return;

    let isMounted = true;
    async function loadMemories() {
      try {
        const data = await fetchMemories(activePace.id);
        if (isMounted) setAppMemories(data);
      } catch (err) {
        console.error("Error fetching memories:", err);
      }
    }
    loadMemories();

    const unsubscribe = subscribeToMemories(activePace.id, (newMemory) => {
      if (isMounted) {
        setAppMemories((current) => {
          const duplicate = current.find((m) => m.id === newMemory.id);
          if (duplicate) return current;
          return [newMemory, ...current];
        });
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [activePace?.id]);

  // Load invite details on token query
  useEffect(() => {
    if (!pendingInvite?.token || !pendingInvite?.loading) return;

    let isMounted = true;
    async function resolveInvite() {
      try {
        const details = await fetchInviteDetails(pendingInvite.token);
        if (isMounted) {
          setPendingInvite(details);
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

  async function handleCreatePace(form) {
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

    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Sign in again before creating a new Pace.");
    }

    try {
      const livePace = await createPace(form);
      let finalCover = livePace.cover || form.coverUrl;

      if (form.file) {
        try {
          const uploadedUrl = await uploadMemoryFile({ paceId: livePace.id, file: form.file });
          const updatedRow = await updatePace(livePace.id, { cover_url: uploadedUrl });
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
      throw error;
    }
  }

  async function handleUpdatePace(form) {
    if (!activePace?.id) return;

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
    <main className="min-h-screen overflow-y-auto bg-pace-black text-pace-pearl selection:bg-pace-bone selection:text-pace-black">
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

      {/* Modal Orchestrator overlays */}
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

createRoot(document.getElementById("root")).render(<App />);
