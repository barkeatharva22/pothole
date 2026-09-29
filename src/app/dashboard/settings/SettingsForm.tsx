"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, ShieldCheck, User } from "lucide-react";

export default function SettingsForm({
  userId,
  email,
  fullName,
  role,
  joined,
}: {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  joined: string;
}) {
  const [name, setName] = useState(fullName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name })
        .eq("id", userId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-amber-400" />
          <h2 className="font-medium text-sm">Profile</h2>
        </div>

        <label className="text-xs text-zinc-500 block mb-1.5">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition mb-3"
        />

        <label className="text-xs text-zinc-500 block mb-1.5">Email</label>
        <input
          value={email}
          disabled
          className="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 mb-4 cursor-not-allowed"
        />

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <h2 className="font-medium text-sm">Account</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Account type</p>
            <p className="capitalize case-id">{role}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Member since</p>
            <p className="case-id">{new Date(joined).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}