import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Sparkles,
  MapPinned,
  Plus,
  Lightbulb,
  Zap,
  Droplets,
  Trash2,
  Construction,
  HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Hazard, Severity, Status, Category } from "@/lib/types";
import { STATUS_LABELS, CATEGORY_LABELS } from "@/lib/types";

const SEVERITY_STYLE: Record<Severity, string> = {
  low: "bg-blue-500/10 text-blue-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const STATUS_STYLE: Record<Status, string> = {
  reported: "bg-zinc-500/10 text-zinc-400",
  acknowledged: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
};

const CATEGORY_ICON: Record<Category, typeof Construction> = {
  pothole: Construction,
  road_damage: Construction,
  streetlight: Lightbulb,
  electrical: Zap,
  water: Droplets,
  garbage: Trash2,
  other: HelpCircle,
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role === "authority") {
    redirect("/dashboard/authority");
  }

  const { data: hazards } = await supabase
    .from("hazards")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const list = (hazards as Hazard[]) ?? [];
  const resolved = list.filter((h) => h.status === "resolved").length;
  const inProgress = list.filter((h) => h.status === "in_progress").length;
  const awaiting = list.filter((h) => h.status === "reported" || h.status === "acknowledged").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1">My reports</h1>
          <p className="text-sm text-zinc-500">Track every hazard you&apos;ve filed, start to resolution.</p>
        </div>
        <Link
          href="/dashboard/hazards/new"
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" /> Report hazard
        </Link>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total filed" value={list.length} />
          <StatCard label="Awaiting review" value={awaiting} accent="text-blue-400" />
          <StatCard label="In progress" value={inProgress} accent="text-amber-400" />
          <StatCard label="Resolved" value={resolved} accent="text-emerald-400" />
        </div>
      )}

      {list.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-10">
          <div className="max-w-md mx-auto text-center">
            <div className="case-stamp w-14 h-14 text-amber-400 mx-auto mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h2 className="font-display font-medium text-lg mb-2">No reports yet</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Spot a pothole, a broken streetlight, or exposed wiring nearby? Report it in under
              a minute — Civix handles the rest.
            </p>
            <Link
              href="/dashboard/hazards/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-medium px-5 py-2.5 rounded-lg transition mb-8"
            >
              <Plus className="w-4 h-4" /> Report your first hazard
            </Link>

            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <EmptyStateFeature
                icon={<Camera className="w-4 h-4" />}
                title="Snap a photo"
                desc="Point your camera at the hazard and capture your location."
              />
              <EmptyStateFeature
                icon={<Sparkles className="w-4 h-4" />}
                title="AI drafts it"
                desc="Groq Vision classifies severity and writes the formal complaint."
              />
              <EmptyStateFeature
                icon={<MapPinned className="w-4 h-4" />}
                title="Track progress"
                desc="Watch it move from reported to resolved, with email updates."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
          {list.map((h) => {
            const Icon = CATEGORY_ICON[h.category];
            return (
              <Link
                key={h.id}
                href={`/dashboard/hazards/${h.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 case-id">
                      {CATEGORY_LABELS[h.category]} · {new Date(h.created_at).toLocaleDateString()}
                      {h.confirmations_count > 0 ? ` · ${h.confirmations_count} confirmations` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className={`text-xs px-2.5 py-1 rounded-md ${SEVERITY_STYLE[h.severity]}`}>
                    {h.severity}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-md ${STATUS_STYLE[h.status]}`}>
                    {STATUS_LABELS[h.status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className={`case-id text-2xl font-semibold ${accent ?? "text-zinc-100"}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

function EmptyStateFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}