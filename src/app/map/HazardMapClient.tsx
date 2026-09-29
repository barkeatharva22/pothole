"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { ShieldAlert, ArrowLeft, MapPinOff } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Hazard, Severity } from "@/lib/types";
import { SEVERITY_COLORS, CATEGORY_LABELS, STATUS_LABELS } from "@/lib/types";

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low"];

export default function HazardMapClient() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  useEffect(() => {
    fetch("/api/hazards")
      .then((res) => res.json())
      .then((data) => setHazards(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (severityFilter === "all" ? hazards : hazards.filter((h) => h.severity === severityFilter)),
    [hazards, severityFilter]
  );

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    hazards.forEach((h) => { c[h.severity as Severity]++; });
    return c;
  }, [hazards]);

  const center: [number, number] =
    hazards.length > 0 ? [hazards[0].latitude, hazards[0].longitude] : [20.5937, 78.9629]; // India centroid fallback

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5 font-display font-semibold">
          <span className="case-stamp w-8 h-8 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </span>
          Civix
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <div className="p-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-lg font-semibold">Public hazard map</h1>
          <p className="text-sm text-zinc-500">
            {loading ? "Loading..." : `${hazards.length} hazard${hazards.length === 1 ? "" : "s"} reported nearby`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <FilterChip active={severityFilter === "all"} onClick={() => setSeverityFilter("all")} color="#71717a">
            All ({hazards.length})
          </FilterChip>
          {SEVERITY_ORDER.map((sev) => (
            <FilterChip
              key={sev}
              active={severityFilter === sev}
              onClick={() => setSeverityFilter(sev)}
              color={SEVERITY_COLORS[sev]}
            >
              {sev} ({counts[sev]})
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 min-h-[300px]">
          {!loading && hazards.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="case-stamp w-14 h-14 text-zinc-600 mx-auto mb-4">
                  <MapPinOff className="w-6 h-6" />
                </div>
                <h2 className="font-display font-medium mb-2">No hazards reported yet</h2>
                <p className="text-sm text-zinc-500">
                  Once citizens start filing reports, they&apos;ll show up here on the public map for
                  everyone to see and confirm.
                </p>
              </div>
            </div>
          ) : (
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filtered.map((h) => (
                <CircleMarker
                  key={h.id}
                  center={[h.latitude, h.longitude]}
                  radius={9}
                  pathOptions={{
                    color: SEVERITY_COLORS[h.severity as Severity],
                    fillColor: SEVERITY_COLORS[h.severity as Severity],
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>{h.title}</p>
                      <p style={{ fontSize: 12, color: "#666" }}>
                        {CATEGORY_LABELS[h.category]} · {h.severity} · {STATUS_LABELS[h.status]}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-zinc-800 overflow-y-auto shrink-0 max-h-64 md:max-h-none">
            {filtered.map((h) => (
              <div key={h.id} className="px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{h.title}</p>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: SEVERITY_COLORS[h.severity as Severity] }}
                  />
                </div>
                <p className="text-xs text-zinc-500 case-id">
                  {CATEGORY_LABELS[h.category]} · {STATUS_LABELS[h.status]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full border transition capitalize ${
        active ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-800 text-zinc-500 hover:border-zinc-700"
      }`}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {children}
    </button>
  );
}