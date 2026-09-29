"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Hazard, Severity, Status } from "@/lib/types";
import { STATUS_LABELS, CATEGORY_LABELS, SEVERITY_COLORS } from "@/lib/types";
import { priorityScore } from "@/lib/priority";

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

export default function TriageQueueClient({ hazards }: { hazards: Hazard[] }) {
  const openHazards = useMemo(
    () =>
      hazards
        .filter((h) => h.status !== "resolved")
        .map((h) => ({ ...h, _score: priorityScore(h) }))
        .sort((a, b) => b._score - a._score),
    [hazards]
  );

  const total = hazards.length;
  const resolved = hazards.filter((h) => h.status === "resolved").length;
  const critical = hazards.filter((h) => h.severity === "critical" && h.status !== "resolved").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const severityData = ["low", "medium", "high", "critical"].map((sev) => ({
    name: sev,
    value: hazards.filter((h) => h.severity === sev).length,
  }));

  const categoryMap: Record<string, number> = {};
  hazards.forEach((h) => {
    categoryMap[h.category] = (categoryMap[h.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .map(([name, count]) => ({ name: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] ?? name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Triage queue</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Prioritized by severity, age, and community confirmations.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total reports" value={total} />
        <StatCard label="Resolved" value={resolved} />
        <StatCard label="Critical open" value={critical} accent="text-red-400" />
        <StatCard label="Resolution rate" value={`${resolutionRate}%`} accent="text-emerald-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">By severity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name as Severity]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-4">By category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} angle={-15} textAnchor="end" height={50} />
              <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="text-sm font-medium text-zinc-300 mb-3">Priority queue ({openHazards.length} open)</h2>
      {openHazards.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-zinc-400">No open reports — nice work.</p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800">
          {openHazards.map((h, i) => (
            <Link
              key={h.id}
              href={`/dashboard/hazards/${h.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-zinc-900 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-xs font-mono text-zinc-600 w-6 shrink-0">#{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {CATEGORY_LABELS[h.category]} · {new Date(h.created_at).toLocaleDateString()}
                    {h.confirmations_count > 0 ? ` · ${h.confirmations_count} confirmations` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-mono">
                  {h._score}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-md ${SEVERITY_STYLE[h.severity]}`}>
                  {h.severity}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-md ${STATUS_STYLE[h.status]}`}>
                  {STATUS_LABELS[h.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}
