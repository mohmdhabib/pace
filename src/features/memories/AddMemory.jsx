/**
 * ============================================================================
 * FILE NAME: AddMemory.jsx
 * TYPE: Memory Feature Component
 * PURPOSE: Provides a gorgeous visual modal for posting new shared memories to the
 *          active Pace. Supports multiple media types (Photos, Notes, Voice recordings,
 *          and Videos), location tagging, custom mood highlights, a creative AI caption
 *          sparker, and an innovative "Time Lock Capsule" feature that hides/blurs the post
 *          from the feed until a future date.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The main component `AddMemory` receives `onClose` and `onCreate` callbacks.
 * 2. It tracks local states: `type` (active media tab), `caption`, `locationName`,
 *    `mood`, `file` upload references, local preview URLs, and `lockDuration` selectors.
 * 3. Renders a helper sub-component `MemoryAction` in a 4-column tab bar, enabling
 *    smooth selection of Photo/Note/Voice/Video formats.
 * 4. Renders a dynamic image/media upload area (for file selection) OR a notepad textarea
 *    based on the active media type.
 * 5. Provides fields for customizing locations and pre-built mood capsules.
 * 6. Renders the Time-Lock capsule selector allowing users to freeze the post
 *    (none, 1 minute, 1 day, or 1 year) by calculating future timestamps via `getLockDate()`.
 * 7. Submits the structured object payload to `onCreate()` which handles Supabase storage
 *    writes and feed updates.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Tracks form states and media selections.
 * - Icons from "lucide-react": Standard high-quality icons representing camera, micro, location, lock, etc.
 * - Reusable UI layouts: `Modal` overlay sheet, `Close` action button, and `Field` wrapper.
 * - Constants: presets cover lists and moods strings.
 * ============================================================================
 */

import React, { useState } from "react";
import {
  Camera,
  FileText,
  Mic2,
  Film,
  ImagePlus,
  Lock,
  Wand2,
  CalendarDays,
  MapPin
} from "lucide-react";
import { covers, moods } from "../../shared/constants";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

/**
 * MemoryAction Sub-Component
 * Renders a specialized icon button in the top grid selector representing a media type.
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide SVG icon component.
 * @param {String} props.label - Text label (e.g. "Photo", "Voice").
 * @param {Boolean} props.active - If true, applies high-contrast active background colors.
 * @param {Function} props.onClick - Action routine when tapped.
 */
/**
 * MemoryAction Sub-Component — slim pill tab variant
 */
function MemoryAction({ icon, label, active, onClick }) {
  return (
    <button
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition active:scale-95 ${
        active
          ? "border-pace-bone bg-pace-pearl text-pace-black shadow-[0_0_12px_rgba(244,238,227,0.3)]"
          : "border-white/10 bg-white/[0.05] text-pace-bone hover:bg-white/[0.09]"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * AddMemory Main Component
 * @param {Object} props
 * @param {Function} props.onClose - Action callback when dismisses modal.
 * @param {Function} props.onCreate - Action callback executing the database saving transactions.
 */
export default function AddMemory({ onClose, onCreate, maxWidth = "max-w-[485px]" }) {
  // --- FORM STATES ---
  const [type, setType] = useState("photo"); // Tracks 'photo', 'text', 'voice', or 'video'
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("Besant Nagar");
  const [mood, setMood] = useState("soft");
  
  // Custom uploaded files and local preview object URLs
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Capsule Lock Duration ('none', '1m', '1d', '1y')
  const [lockDuration, setLockDuration] = useState("none");
  
  // Dynamic fallback cover image
  const mediaUrl = covers[3];

  // --- TIME LOCK OFFSET HELPER ---
  // Calculates the future unlock date stamp based on the chosen locking offset
  function getLockDate() {
    if (lockDuration === "1m") return new Date(Date.now() + 60 * 1000).toISOString();
    if (lockDuration === "1d") return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    if (lockDuration === "1y") return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    return null; // Return null if "none" selected (post is instantly public/unlocked)
  }

  return (
    <Modal onClose={onClose} maxWidth={maxWidth}>
      {/* Modal Title Banner */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Add memory</p>
          <h2 className="mt-1 text-3xl font-semibold">Keep this one</h2>
        </div>
        <Close onClose={onClose} />
      </div>

      {/* Media Type Tab Row — slim pill tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <MemoryAction
          icon={<Camera size={14} />}
          label="Photo"
          active={type === "photo"}
          onClick={() => {
            setType("photo");
            setCaption("");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
        <MemoryAction
          icon={<FileText size={14} />}
          label="Note"
          active={type === "text"}
          onClick={() => {
            setType("text");
            setCaption("");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
        <MemoryAction
          icon={<Mic2 size={14} />}
          label="Voice"
          active={type === "voice"}
          onClick={() => {
            setType("voice");
            setCaption("");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
        <MemoryAction
          icon={<Film size={14} />}
          label="Video"
          active={type === "video"}
          onClick={() => {
            setType("video");
            setCaption("");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
      </div>

      {/* Dynamic File Upload Container based on chosen media tab type */}
      {type !== "text" ? (
        <label className="mt-4 block overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.06] cursor-pointer hover:bg-white/[0.09] transition active:scale-[0.99] duration-200">
          <input
            className="sr-only" // Hides visual browse input, styled custom label acts as focus point
            type="file"
            // Filters based on chosen media tab
            accept={type === "photo" ? "image/*" : type === "voice" ? "audio/*" : "video/*"}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              // Generates immediate virtual preview URL if file is an image
              setPreviewUrl(nextFile && nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : null);
            }}
          />
          
          <div className="flex min-h-32 items-center gap-4 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.1rem] bg-pace-pearl text-pace-black shadow-glow overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus size={20} />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium">{file ? file.name : `Upload a ${type} file`}</p>
              <p className="mt-1 text-xs leading-5 text-pace-smoke">
                {type === "photo"
                  ? "Select a photo memory. Stored privately."
                  : type === "voice"
                  ? "Select an audio recording / voice note."
                  : "Select a video clip to remember this era."}
              </p>
            </div>
          </div>
        </label>
      ) : (
        // Renders simple guiding cards if user selects "text note" tab instead
        <div className="mt-4 rounded-[1.4rem] border border-white/5 bg-white/[0.02] p-4 text-center select-none">
          <p className="text-xs text-pace-smoke leading-relaxed font-medium">
            Write down the feelings, the quotes, or the quiet details of this era below.
          </p>
        </div>
      )}

      {/* Text Area layout for full notes, otherwise maps normal short text field for captions */}
      {type === "text" ? (
        <label className="mt-4 block rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-4 py-3">
          <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-pace-smoke">
            <FileText size={15} />
            Thoughts / Quotes
          </span>
          <textarea
            className="mt-2 w-full h-28 bg-transparent text-base text-pace-pearl outline-none placeholder:text-pace-smoke/60 resize-none leading-relaxed"
            placeholder="Type your note, quote, or core memory details here..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        </label>
      ) : (
        <Field label="Caption" value={caption} onChange={setCaption} />
      )}
      
      {/* Date & Location tags grid row */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Date" value="Tonight" icon={<CalendarDays size={15} />} />
        <Field label="Place" value={locationName} onChange={setLocationName} icon={<MapPin size={15} />} />
      </div>

      {/* Mood capsules selection pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {moods.slice(0, 5).map((preset) => (
          <button
            key={preset}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              preset === mood
                ? "border-pace-bone bg-pace-pearl text-pace-black font-medium"
                : "border-white/10 bg-white/[0.07] text-pace-bone"
            }`}
            onClick={() => setMood(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Time Lock capsule settings selector */}
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
              {dur === "none" ? "None" : dur === "1m" ? "1 min" : dur === "1d" ? "1 day" : "1 year"}
            </button>
          ))}
        </div>
      </div>

      {/* Nostalgic AI Caption Spark Block */}
      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Wand2 size={16} />
          AI caption
        </div>
        <p className="mt-2 text-lg leading-7">we were young in a way the camera understood</p>
      </div>

      {/* Main Save Action button triggers creation handles */}
      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98]"
        onClick={() =>
          onCreate({
            type,
            caption,
            mood,
            file: type === "text" ? null : file,
            previewUrl: type === "text" ? null : previewUrl,
            mediaUrl: type === "text" ? null : previewUrl || mediaUrl,
            locationName,
            lockedUntil: getLockDate() // Stores ISO timestamp string to locking parameters
          })
        }
      >
        <ImagePlus size={17} />
        Save memory
      </button>
    </Modal>
  );
}
