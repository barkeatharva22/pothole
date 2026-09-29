"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ThumbsUp, MapPin } from "lucide-react";
import type { Hazard, Status } from "@/lib/types";
import { STATUS_LABELS, CATEGORY_LABELS } from "@/lib/types";

const STATUSES: Status[] = ["reported", "acknowledged", "in_progress", "resolved"];

export default function HazardDetailClient({
  hazard,
  isOwner,
  isAuthority,
  initiallyConfirmed,
}: {
  hazard: Hazard;
  isOwner: boolean;
  isAuthority: boolean;
  initiallyConfirmed: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(hazard.status);
  const [confirmed, setConfirmed] = useState(initiallyConfirmed);
  const [confirmCount, setConfirmCount] = useState(hazard.confirmations_count);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function updateStatus(newStatus: Status) {
    setUpdating(true);
    const prev = status;
    setStatus(newStatus);
    try {
      const res = await fetch(`/api/hazards/${hazard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setStatus(prev);
    } finally {
      setUpdating(false);
    }
  }

  async function toggleConfirm() {
    const wasConfirmed = confirmed;
    setConfirmed(!wasConfirmed);
    setConfirmCount((c) => c + (wasConfirmed ? -1 : 1));
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hazard_id: hazard.id }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setConfirmed(wasConfirmed);
      setConfirmCount((c) => c + (wasConfirmed ? 1 : -1));
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this report? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hazards/${hazard.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{hazard.title}</h1>
          <p className="text-sm text-zinc-500 flex items-center gap-1.5">
            {CATEGORY_LABELS[hazard.category]} ·{" "}
            {new Date(hazard.created_at).toLocaleDateString()}
          </p>
          {hazard.address && (
            <p className="text-sm text-zinc-500 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {hazard.address}
            </p>
          )}
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={toggleConfirm}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition ${
            confirmed
              ? "bg-amber-500 text-zinc-950 border-amber-500"
              : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {confirmed ? "Confirmed" : "Still there?"} ({confirmCount})
        </button>
      </div>

      {isAuthority && (
        <div className="flex items-center gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating}
              className={`text-sm px-3 py-1.5 rounded-lg border transition ${
                status === s
                  ? "bg-amber-500 text-zinc-950 border-amber-500"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
      {!isAuthority && (
        <div className="mb-6">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
            Status: {STATUS_LABELS[status]}
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-400 mb-2">Description</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{hazard.description}</p>
        </div>

        {hazard.ai_complaint_draft && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-400 mb-2">AI-drafted formal complaint</p>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {hazard.ai_complaint_draft}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
