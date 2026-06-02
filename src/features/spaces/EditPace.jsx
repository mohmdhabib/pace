/**
 * ============================================================================
 * FILE NAME: EditPace.jsx
 * TYPE: Space Feature Component
 * PURPOSE: Provides the setting dialog panel for managing an existing Pace space.
 *          It allows space members to edit the name, descriptive memories, mood visual styles,
 *          swap preset cover images, upload new custom covers, or completely Archive/Restore
 *          the space.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives the existing `pace` data and parent transactional handles:
 *    `onClose`, `onUpdate`, `onArchive`, and `onUnarchive`.
 * 2. It initializes state variables pre-filled with the current Pace properties, dynamically
 *    determining if the current cover is a preset or a custom upload to reflect in the active inputs.
 * 3. Builds a form inside our animated modular `Modal` overlay.
 * 4. Renders reactive `Field` text fields for titles and description updates.
 * 5. Provides a scrolling gallery for updating visual cover layouts (presets + uploads).
 * 6. Includes pill badges for mood updating.
 * 7. Offers a footer action grid:
 *    - Save Settings button triggers the parent's `onUpdate()` API routine.
 *    - Archive / Restore button acts as a toggle based on the space status, verifying actions via native
 *      `confirm()` boxes, and calling `onArchive` or `onUnarchive`.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Tracks changed values and locking flags during updates.
 * - Icons from "lucide-react": Camera, Sparkles, and Magic Wand vectors.
 * - Unified layouts: `Modal`, `Close` trigger, and `Field` wrapper components.
 * - Constants and error helpers: covers presets list and readable supabase error handlers.
 * ============================================================================
 */

import React, { useState } from "react";
import { Camera, Sparkles, Wand2 } from "lucide-react";
import { covers, moods } from "../../shared/constants";
import { readableSupabaseError } from "../../shared/utils";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

/**
 * EditPace Component
 * @param {Object} props
 * @param {Object} props.pace - The existing Space details object to edit.
 * @param {Function} props.onClose - Action callback when dismisses settings.
 * @param {Function} props.onUpdate - Callback routine executing the database update transactions.
 * @param {Function} props.onArchive - Callback archiving/freezing this space.
 * @param {Function} props.onUnarchive - Callback restoring this archived space to active state.
 */
export default function EditPace({ pace, onClose, onUpdate, onArchive, onUnarchive, maxWidth = "max-w-[485px]" }) {
  // --- STATE INITIALIZATIONS PRE-FILLED WITH CURRENT PACE VALUES ---
  const [title, setTitle] = useState(pace.title);
  const [description, setDescription] = useState(pace.snippet || pace.description || "");
  const [mood, setMood] = useState(pace.mood || "nostalgic");
  
  // Scans the presets array to see if the current cover matches a preloaded index
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(() => {
    const idx = covers.indexOf(pace.cover);
    return idx !== -1 ? idx : 0;
  });
  
  // Tracks file uploads
  const [coverFile, setCoverFile] = useState(null);
  
  // Set preview URL to the custom cover URL if the current cover is not a preloaded preset
  const [localPreviewUrl, setLocalPreviewUrl] = useState(() => {
    return covers.indexOf(pace.cover) === -1 ? pace.cover : null;
  });
  
  // Visual operations states
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- SAVE ACTION HANDLER ---
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
    <Modal onClose={onClose} maxWidth={maxWidth}>
      {/* Header Info */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Edit Pace</p>
          <h2 className="mt-1 text-3xl font-semibold">Era settings</h2>
        </div>
        <Close onClose={onClose} />
      </div>

      {/* Reusable field layouts for input fields */}
      <Field label="Pace name" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />

      {/* Visual Cover Selector */}
      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-[0.2em] text-pace-smoke block mb-2">Cover image</label>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto py-1">
          {/* Custom File Upload Box */}
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

          {/* Presets List mapping */}
          {covers.map((url, idx) => {
            // Selected check is active only if no custom upload files are loaded
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

      {/* Visual Cover Preview layout */}
      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 relative h-44 w-full group">
        <img
          src={localPreviewUrl || covers[selectedPresetIndex]}
          alt="Cover Preview"
          className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        {/* Render a custom badge if custom uploads or external image locations are loaded */}
        {(coverFile || (localPreviewUrl && covers.indexOf(localPreviewUrl) === -1)) && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 border border-white/10 backdrop-blur-md px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-pace-bone">
            Custom Image
          </div>
        )}
      </div>

      {/* Mood badges capsules selection */}
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
        {/* Save button spans 2 columns */}
        <button
          className="col-span-2 flex h-14 items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
          onClick={submit}
          disabled={isSaving}
        >
          <Wand2 size={16} />
          {isSaving ? "Saving..." : "Save settings"}
        </button>

        {/* Archive/Restore toggle button spans 1 column */}
        <button
          type="button"
          // If archived: displays a calming green (moss) style. If active: displays a caution reddish-wine style.
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
      
      {/* Logs operational statuses */}
      {status && <p className="mt-4 text-center text-xs leading-5 text-pace-bone">{status}</p>}
    </Modal>
  );
}
