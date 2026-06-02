import React, { useState } from "react";
import { Mail, Link2, Copy } from "lucide-react";
import Modal from "../../shared/ui/Modal";
import Close from "../../shared/ui/Close";
import Field from "../../shared/ui/Field";

export default function InviteFriends({ invite, onClose, onCreate }) {
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
