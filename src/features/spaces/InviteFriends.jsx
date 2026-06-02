/**
 * ============================================================================
 * FILE NAME: InviteFriends.jsx
 * TYPE: Space Feature Component
 * PURPOSE: Renders the security invitation dialog, allowing active space members
 *          to generate and copy secure single-use access link tokens for their friends.
 *          This enforces the app's hyper-private philosophy: no discovery search engine,
 *          no public follower graph—only direct, intimate invitations.
 * 
 * WHAT HAPPENS IN THIS FILE:
 * 1. The component receives an initial `invite` state, `onClose` callback, and the
 *    `onCreate` database transaction generator.
 * 2. It tracks local states: `email` (to restrict access optionally to a specific user),
 *    `currentInvite` (details of the generated link), and `status` messages.
 * 3. It utilizes our animated `Modal` wrapper to slide up from the bottom of the screen.
 * 4. Renders a unified `Field` text input for email addresses.
 * 5. Pressing "Create link" queries the parent's handler, writing an invite row into Supabase
 *    and returning a unique token-appended URL.
 * 6. Displays the generated URL and offers a quick "Copy" button that accesses the native browser
 *    clipboard APIs (`navigator.clipboard.writeText()`).
 * 
 * KEY IMPORTS & DEPENDENCIES:
 * - `React`, `{ useState }` from "react": Tracks form states and current active invitation codes.
 * - Icons from "lucide-react": Mail, Link2 (chain link), and Copy symbols.
 * - Reusable UI layouts: `Modal` background dimming sheet, `Close` icon trigger, and `Field` wrapper.
 * ============================================================================
 */

import React, { useState } from "react";
import { Mail, Link2, Copy } from "lucide-react";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

/**
 * InviteFriends Component
 * @param {Object} props
 * @param {Object} props.invite - The active invitation state object containing the URL (if already created).
 * @param {Function} props.onClose - Action callback when closing the modal window.
 * @param {Function} props.onCreate - Action callback executing the DB link creation.
 */
export default function InviteFriends({ invite, onClose, onCreate, maxWidth = "max-w-[485px]" }) {
  // --- STATE HOOKS ---
  const [email, setEmail] = useState("");
  const [currentInvite, setCurrentInvite] = useState(invite);
  const [status, setStatus] = useState("Private links expire in 14 days.");

  // --- GENERATE SECURE LINK ACTION ---
  async function createLink() {
    try {
      // Calls parents `handleCreateInvite` to insert a row in the Supabase DB
      const nextInvite = await onCreate({ email });
      setCurrentInvite(nextInvite); // Syncs local preview state
      setStatus(email ? `Invite prepared for ${email}.` : "Invite link created.");
    } catch (error) {
      setStatus(error.message || "Invite could not be created yet.");
    }
  }

  // --- SYSTEM CLIPBOARD WRITER ---
  async function copyLink() {
    if (!currentInvite?.url) return;
    // Uses standard modern HTML5 navigator clipboard interface
    await navigator.clipboard.writeText(currentInvite.url);
    setStatus("Invite link copied.");
  }

  return (
    <Modal onClose={onClose} maxWidth={maxWidth}>
      {/* Modal Title Block */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-pace-smoke">Invite</p>
          <h2 className="mt-1 text-3xl font-semibold">Keep it private</h2>
        </div>
        <Close onClose={onClose} />
      </div>
      
      {/* Email Input Field with nested Mail SVG icon inside */}
      <Field label="Friend email" value={email} onChange={setEmail} icon={<Mail size={15} />} />
      
      {/* Informative Branding details card */}
      <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-sm text-pace-bone">
          <Link2 size={16} />
          Quiet access
        </div>
        <p className="mt-2 text-sm leading-6 text-pace-smoke">
          Invites are tied to this Pace. No public profile, no discovery, no follower graph.
        </p>
        
        {/* If a URL has been generated, render a visual box showing it */}
        {currentInvite?.url && (
          <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/20 p-3 text-xs leading-5 text-pace-bone break-all">
            {currentInvite.url}
          </div>
        )}
      </div>
      
      {/* Action Footer Buttons Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Create Link Trigger */}
        <button
          className="flex h-14 items-center justify-center gap-2 rounded-full bg-pace-pearl text-sm font-semibold text-pace-black active:scale-[0.98] transition"
          onClick={createLink}
        >
          <Link2 size={16} />
          Create link
        </button>
        
        {/* Copy to Clipboard Trigger */}
        <button
          className="flex h-14 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] text-sm text-pace-bone active:scale-[0.98] transition"
          onClick={copyLink}
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
      
      {/* Local log/status message */}
      <p className="mt-4 text-center text-xs text-pace-smoke">{status}</p>
    </Modal>
  );
}
