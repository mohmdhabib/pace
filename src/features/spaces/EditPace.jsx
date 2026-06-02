import React, { useState } from "react";
import { Camera, Sparkles, Wand2 } from "lucide-react";
import { covers, moods } from "../../shared/constants";
import { readableSupabaseError } from "../../shared/utils";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

export default function EditPace({ pace, onClose, onUpdate, onArchive, onUnarchive }) {
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
