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
  Film,
  Headphones,
  ImagePlus,
  Lock,
  Mail,
  MapPin,
  Mic2,
  Moon,
  Plus,
  Sparkles,
  Users,
  Wand2,
  X
} from "lucide-react";
import { createMemory, createPace, fetchMemories, fetchPaces } from "./lib/paceApi";
import { getSession, isSupabaseConfigured, signInWithProvider } from "./lib/supabase";
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
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? "Connect to sync private Paces" : "Prototype mode"
  );

  useEffect(() => {
    let isMounted = true;

    async function loadSessionAndPaces() {
      if (!isSupabaseConfigured) return;
      try {
        const currentSession = await getSession();
        if (!isMounted) return;
        setSession(currentSession);

        if (!currentSession) {
          setSyncStatus("Sign in to unlock private sync");
          return;
        }

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
        } else {
          setSyncStatus("No live Paces yet");
        }
      } catch (error) {
        setSyncStatus(formatSyncError(error));
      }
    }

    loadSessionAndPaces();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadMemories() {
      if (!session || !activePace?.id || !isLiveId(activePace.id)) {
        setAppMemories(memories);
        return;
      }

      try {
        const liveMemories = await fetchMemories(activePace.id);
        if (!isMounted) return;
        setAppMemories(liveMemories.length ? liveMemories : memories);
      } catch (error) {
        if (isMounted) setSyncStatus(formatSyncError(error));
      }
    }

    loadMemories();
    return () => {
      isMounted = false;
    };
  }, [activePace, session]);

  async function handleCreatePace(form) {
    const fallbackPace = {
      id: `local-${Date.now()}`,
      title: form.title,
      mood: form.mood,
      members: ["Me"],
      last: "Just now",
      snippet: form.description,
      color: "from-[#d2c5b1]/25 via-[#62594d]/10 to-[#8f6b67]/25",
      cover: form.coverUrl,
      collage: [form.coverUrl]
    };

    if (!session) {
      setAppPaces((current) => [fallbackPace, ...current]);
      setActivePace(fallbackPace);
      setSyncStatus(isSupabaseConfigured ? "Saved locally until sign-in" : "Prototype mode");
      return;
    }

    const livePace = await createPace({ ...form, ownerId: session.user.id });
    const hydrated = { ...livePace, cover: livePace.cover || form.coverUrl };
    setAppPaces((current) => [hydrated, ...current]);
    setActivePace(hydrated);
    setSyncStatus("Synced privately");
  }

  async function handleCreateMemory(form) {
    const fallbackMemory = {
      id: `local-memory-${Date.now()}`,
      type: form.type,
      author: "Me",
      time: "Now",
      date: "Today",
      caption: form.caption,
      image: form.mediaUrl,
      mood: form.mood,
      location: form.locationName
    };

    if (!session || !isLiveId(activePace?.id)) {
      setAppMemories((current) => [fallbackMemory, ...current]);
      return;
    }

    const liveMemory = await createMemory({
      ...form,
      paceId: activePace.id,
      authorId: session.user.id
    });
    setAppMemories((current) => [liveMemory, ...current]);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-pace-black text-pace-pearl selection:bg-pace-bone selection:text-pace-black">
      <Ambient />
      <FilmGrain />
      <AnimatePresence mode="wait">
        {!started ? (
          <Onboarding key="onboarding" onBegin={() => setStarted(true)} onAuth={signInWithProvider} />
        ) : (
          <Shell
            key="app"
            paces={appPaces}
            memories={appMemories}
            activePace={activePace}
            setActivePace={setActivePace}
            view={view}
            setView={setView}
            setModal={setModal}
            syncStatus={syncStatus}
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
        {modal === "memory" && (
          <AddMemory
            onClose={() => setModal(null)}
            onCreate={async (form) => {
              await handleCreateMemory(form);
              setModal(null);
            }}
          />
        )}
        {modal === "capsule" && <Capsule onClose={() => setModal(null)} />}
      </AnimatePresence>
    </main>
  );
}

function isLiveId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

function formatSyncError(error) {
  const message = error?.message || "";
  if (message.includes("schema cache") || message.includes("Could not find") || error?.code === "PGRST205") {
    return "Supabase schema pending";
  }
  return "Sync paused";
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

function Onboarding({ onBegin, onAuth }) {
  const slides = [
    "Some moments deserve more than disappearing chats.",
    "People come and go. Memories stay.",
    "Create private spaces for the phases that mattered.",
    "Welcome to Pace."
  ];
  const [index, setIndex] = useState(0);
  const progress = ((index + 1) / slides.length) * 100;

  return (
    <motion.section
      className="relative z-10 flex min-h-screen items-end px-5 pb-8 pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0">
        <motion.img
          key={index}
          src={covers[index + 1] || covers[0]}
          alt=""
          className="h-full w-full object-cover opacity-50"
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black" />
      </div>
      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-pace-bone">
            <Moon size={16} />
            <span>Pace</span>
          </div>
          <span className="text-xs text-pace-smoke">{index + 1}/4</span>
        </div>
        <div className="mb-6 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-pace-pearl"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.h1
            key={slides[index]}
            className="max-w-sm text-[2.55rem] font-semibold leading-[0.98] tracking-normal text-pace-pearl"
            initial={{ y: 24, opacity: 0, filter: "blur(12px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -16, opacity: 0, filter: "blur(12px)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {slides[index]}
          </motion.h1>
        </AnimatePresence>
        <p className="mt-5 text-base leading-7 text-pace-bone/80">
          A private place for moments you never want to lose.
        </p>
        <div className="mt-8 grid gap-3">
          <button
            className="h-14 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98]"
            onClick={() => (index < slides.length - 1 ? setIndex(index + 1) : onBegin())}
          >
            {index < slides.length - 1 ? "Continue" : "Begin"}
          </button>
          <div className="grid grid-cols-3 gap-2">
            <AuthButton icon={<Apple size={16} />} label="Apple" onClick={() => onAuth("apple")} />
            <AuthButton icon={<Sparkles size={16} />} label="Google" onClick={() => onAuth("google")} />
            <AuthButton icon={<Mail size={16} />} label="Email" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function AuthButton({ icon, label, onClick }) {
  return (
    <button
      className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-xs text-pace-bone backdrop-blur-xl"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function Shell({ paces, memories, activePace, setActivePace, view, setView, setModal, syncStatus }) {
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
          {view === "profile" && <Profile setView={setView} key="profile" />}
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

function Home({ paces, syncStatus, setView, setModal, setActivePace }) {
  return (
    <motion.div
      className="relative flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="px-5 pb-3 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">{syncStatus}</p>
            <h1 className="mt-2 text-4xl font-semibold leading-none">Pace</h1>
          </div>
          <button
            className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-pace-bone backdrop-blur-xl"
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
      <div className="no-scrollbar flex flex-1 snap-x gap-4 overflow-x-auto px-5 pb-24 pt-2">
        {paces.map((pace) => (
          <PaceCard
            pace={pace}
            key={pace.id}
            onOpen={() => {
              setActivePace(pace);
              setView("timeline");
            }}
          />
        ))}
      </div>
      <button
        className="absolute bottom-5 left-1/2 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-pace-pearl px-5 text-sm font-semibold text-pace-black shadow-glow transition active:scale-[0.98]"
        onClick={() => setModal("create")}
      >
        <Plus size={18} />
        Create Pace
      </button>
    </motion.div>
  );
}

function PaceCard({ pace, onOpen }) {
  return (
    <motion.button
      className="relative h-[34rem] min-w-[84%] snap-center overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] text-left shadow-soft"
      whileTap={{ scale: 0.985 }}
      onClick={onOpen}
    >
      <img src={pace.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className={`absolute inset-0 bg-gradient-to-b ${pace.color}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/85" />
      <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-pace-bone backdrop-blur-xl">
        {pace.last}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="mb-4 flex -space-x-2">
          {pace.members.slice(0, 4).map((member, index) => (
            <span
              className="grid h-8 w-8 place-items-center rounded-full border border-black/30 bg-pace-pearl text-[10px] font-semibold text-pace-black"
              key={member}
              style={{ transform: `translateY(${index % 2 ? 4 : 0}px)` }}
            >
              {member[0]}
            </span>
          ))}
        </div>
        <h2 className="text-4xl font-semibold leading-none">{pace.title}</h2>
        <p className="mt-3 text-sm leading-6 text-pace-bone/82">{pace.snippet}</p>
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
      <div className="memory-card rounded-[1.4rem] border border-white/10 bg-[#f4eee3] p-2 text-pace-black shadow-soft">
        {memory.type === "photo" && (
          <img src={memory.image} alt="" className="aspect-[4/5] w-full rounded-[1rem] object-cover" />
        )}
        {memory.type === "voice" && <VoiceNote />}
        {memory.type === "text" && (
          <div className="grid min-h-64 place-items-center rounded-[1rem] bg-[#191816] p-6 text-center text-pace-pearl">
            <p className="text-2xl font-medium leading-tight">{memory.caption}</p>
          </div>
        )}
        {memory.type !== "text" && (
          <div className="px-2 pb-2 pt-3">
            <p className="font-medium leading-6">{memory.caption}</p>
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
  const coverUrl = covers[5];

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
      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10">
        <img src={coverUrl} alt="" className="h-44 w-full object-cover opacity-85" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {moods.map((preset) => (
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
      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black"
        onClick={() => onCreate({ title, description, mood, coverUrl })}
      >
        <Users size={17} />
        Create private Pace
      </button>
    </Modal>
  );
}

function AddMemory({ onClose, onCreate }) {
  const [type, setType] = useState("photo");
  const [caption, setCaption] = useState("felt like a core memory while it was happening");
  const [locationName, setLocationName] = useState("Besant Nagar");
  const [mood, setMood] = useState("soft");
  const mediaUrl = covers[3];

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
      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Wand2 size={16} />
          AI caption
        </div>
        <p className="mt-2 text-lg leading-7">we were young in a way the camera understood</p>
      </div>
      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black"
        onClick={() => onCreate({ type, caption, mood, mediaUrl: type === "photo" ? mediaUrl : null, locationName })}
      >
        <ImagePlus size={17} />
        Save memory
      </button>
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

function Profile({ setView }) {
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
        M
      </div>
      <h1 className="mt-5 text-center text-3xl font-semibold">Mohammed</h1>
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
