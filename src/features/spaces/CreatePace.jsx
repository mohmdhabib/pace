/**
 * ============================================================================
 * FILE NAME: CreatePace.jsx
 * TYPE: Space Feature Component
 * PURPOSE: Renders the premium creation overlay form, allowing users to name a new
 *          private Pace, add a scrapbook description, pick a visual mood theme,
 *          and select a preset cover image or upload their own custom cover photograph.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component initializes several local states (`title`, `description`, `mood`,
 *    `preset indices`, custom `coverFile` and its dynamic local preview URL).
 * 2. It wraps itself in our core `Modal` overlay component for beautiful entry/exit animations.
 * 3. Renders title and description inputs (using our unified reusable `Field` component).
 * 4. Offers a horizontal cover selector scroll:
 *    - Includes a file input picker allowing drag-and-drop or select of personal images.
 *    - Generates instant live previews via `URL.createObjectURL(file)`.
 *    - Displays beautiful pre-curated aesthetic image preset alternatives.
 * 5. Presents a beautiful picture preview card showing the selected cover in high-fidelity.
 * 6. Renders clickable pill buttons for selected moods, applying dynamic border/text highlights.
 * 7. Submits the bundled payload to `onCreate()` which delegates saving to Supabase or offline local stores.
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Tracks form field variables and processing indicators.
 * - Icons from "lucide-react": Camera, Sparkles, and Users vectors.
 * - Reusable UI blocks: `Modal` container, `Close` action button, and `Field` input wrappers.
 * - Shared variables: `covers` image url preset list, and `moods` tag string list.
 * ============================================================================
 */

import React, { useState } from "react";
import { Camera, Sparkles, Users } from "lucide-react";
import { covers, moods } from "../../shared/constants";
import { readableSupabaseError } from "../../shared/utils";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

/**
 * CreatePace Component
 * @param {Object} props
 * @param {Function} props.onClose - Action callback when closing or cancelling the creation.
 * @param {Function} props.onCreate - Action callback executing the database insert or local fallback.
 */
export default function CreatePace({ onClose, onCreate, maxWidth = "max-w-[485px]" }) {
  // --- STATE HOOKS ---
  // Pre-populates fields with warm, nostalgic defaults to prompt user creativity
  const [title, setTitle] = useState("Pondy Trip");
  const [description, setDescription] = useState("For the weekend that felt like a film.");
  const [mood, setMood] = useState("nostalgic");
  
  // Tracks which pre-loaded cover image is active (defaults to cover at index 5)
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(5);
  
  // Tracks custom uploaded file object and its virtual local blob preview URL
  const [coverFile, setCoverFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
  
  // Operational states for validation logs and loading states
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- SUBMISSION METHOD ---
  // Gathers form details, runs checks, and calls the parent container's creation handler
  async function submit() {
    if (!title.trim()) {
      setStatus("Give this Pace a name first.");
      return;
    }

    setIsSaving(true); // Locks button inputs to prevent double-submits
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
      // Displays localized error strings if Supabase writes fail
      setStatus(readableSupabaseError(error));
      setIsSaving(false); // Unlocks form for correction
    }
  }

  return (
    <Modal onClose={onClose} maxWidth={maxWidth}>
      {/* Form Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">New Pace</p>
          <h2 className="mt-1 text-3xl font-semibold">Name the era</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      
      {/* Title & Description Fields */}
      <Field label="Pace name" value={title} onChange={setTitle} />
      <Field label="Description" value={description} onChange={setDescription} />

      {/* Visual Cover Selector */}
      <div className="mt-4">
        <label className="text-[10px] uppercase tracking-[0.2em] text-pace-smoke block mb-2">Cover image</label>
        <div className="no-scrollbar flex gap-2.5 overflow-x-auto py-1">
          {/* Custom File Upload Button */}
          <label className="relative flex h-16 w-16 min-w-[4rem] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] text-pace-smoke hover:border-pace-pearl hover:text-pace-pearl hover:bg-white/[0.06] transition duration-200 active:scale-95">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCoverFile(file);
                  // Creates a transient blob URL: e.g. blob:http://localhost:5173/...
                  // which lets us instantly display the chosen file in our image tag
                  setLocalPreviewUrl(URL.createObjectURL(file));
                }
              }}
            />
            <Camera size={16} />
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider">Upload</span>
          </label>

          {/* Scrolling Curated Presets */}
          {covers.map((url, idx) => {
            // Selected active state check (only active if no custom upload is taking priority)
            const isSelected = !coverFile && selectedPresetIndex === idx;
            return (
              <button
                key={url}
                type="button"
                onClick={() => {
                  setSelectedPresetIndex(idx);
                  setCoverFile(null); // Clear custom upload if presets are selected
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

      {/* Visual Cover Preview Card */}
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

      {/* Mood Selectors Pills */}
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

      {/* Main Save / Submit Trigger Button */}
      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-bold text-pace-black shadow-glow transition hover:scale-[1.01] active:scale-[0.98]"
        onClick={submit}
        disabled={isSaving}
      >
        <Users size={17} />
        {isSaving ? "Creating..." : "Create private Pace"}
      </button>
      
      {/* Submission error or log indicator */}
      {status && <p className="mt-4 text-center text-xs leading-5 text-pace-bone">{status}</p>}
    </Modal>
  );
}
