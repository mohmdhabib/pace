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

export default function AddMemory({ onClose, onCreate }) {
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

      {/* Upgraded 4-column Grid layout */}
      <div className="grid grid-cols-4 gap-2">
        <MemoryAction
          icon={<Camera size={16} />}
          label="Photo"
          active={type === "photo"}
          onClick={() => {
            setType("photo");
            setCaption("felt like a core memory while it was happening");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
        <MemoryAction
          icon={<FileText size={16} />}
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
          icon={<Mic2 size={16} />}
          label="Voice"
          active={type === "voice"}
          onClick={() => {
            setType("voice");
            setCaption("felt like a core memory while it was happening");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
        <MemoryAction
          icon={<Film size={16} />}
          label="Video"
          active={type === "video"}
          onClick={() => {
            setType("video");
            setCaption("felt like a core memory while it was happening");
            setFile(null);
            setPreviewUrl(null);
          }}
        />
      </div>

      {/* Conditional File Upload Container */}
      {type !== "text" ? (
        <label className="mt-4 block overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.06] cursor-pointer hover:bg-white/[0.09] transition active:scale-[0.99] duration-200">
          <input
            className="sr-only"
            type="file"
            accept={type === "photo" ? "image/*" : type === "voice" ? "audio/*" : "video/*"}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              setPreviewUrl(nextFile && nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : null);
            }}
          />
          <div className="flex min-h-32 items-center gap-4 p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.1rem] bg-pace-pearl text-pace-black shadow-glow">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full rounded-[1.1rem] object-cover" />
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
        <div className="mt-4 rounded-[1.4rem] border border-white/5 bg-white/[0.02] p-4 text-center select-none">
          <p className="text-xs text-pace-smoke leading-relaxed font-medium">
            Write down the feelings, the quotes, or the quiet details of this era below.
          </p>
        </div>
      )}

      {/* Premium Conditional Textarea for Notes */}
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
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Date" value="Tonight" icon={<CalendarDays size={15} />} />
        <Field label="Place" value={locationName} onChange={setLocationName} icon={<MapPin size={15} />} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {moods.slice(0, 5).map((preset) => (
          <button
            key={preset}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
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
              {dur === "none" ? "None" : dur === "1m" ? "1 min" : dur === "1d" ? "1 day" : "1 year"}
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
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98]"
        onClick={() =>
          onCreate({
            type,
            caption,
            mood,
            file: type === "text" ? null : file,
            previewUrl: type === "text" ? null : previewUrl,
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
