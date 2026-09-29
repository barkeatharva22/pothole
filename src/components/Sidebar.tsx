"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  ListChecks,
  Plus,
  Map as MapIcon,
  Menu,
  X,
  Gavel,
  Clock,
  Wrench,
  CheckCircle2,
  Settings,
  HelpCircle,
} from "lucide-react";
import SignOutButton from "./SignOutButton";
import type { Role } from "@/lib/types";

interface Stats {
  reported: number;
  in_progress: number;
  resolved: number;
}

const SEVERITY_LEGEND = [
  { label: "Low", color: "#3b82f6" },
  { label: "Medium", color: "#eab308" },
  { label: "High", color: "#f97316" },
  { label: "Critical", color: "#ef4444" },
];

export default function Sidebar({
  email,
  role,
  stats,
}: {
  email: string;
  role: Role;
  stats?: Stats;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const citizenLinks = [
    { href: "/dashboard", label: "My reports", icon: ListChecks },
    { href: "/dashboard/hazards/new", label: "Report hazard", icon: Plus, accent: true },
  ];

  const authorityLinks = [
    { href: "/dashboard/authority", label: "Triage queue", icon: Gavel },
  ];

  const links = role === "authority" ? authorityLinks : citizenLinks;
  const initial = email.charAt(0).toUpperCase() || "?";

  const NavLink = ({
    href,
    label,
    icon: Icon,
    accent,
  }: {
    href: string;
    label: string;
    icon: typeof ListChecks;
    accent?: boolean;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`group relative flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-lg text-sm transition ${
          active
            ? "bg-amber-500/10 text-amber-300"
            : accent
            ? "text-amber-400 hover:bg-zinc-900"
            : "text-zinc-300 hover:bg-zinc-900"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-amber-400" />
        )}
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </Link>
    );
  };

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold">
          <span className="case-stamp w-7 h-7 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </span>
          Civix
        </Link>
        <button onClick={() => setOpen(!open)} className="text-zinc-300 p-1">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <aside
        className={`${
          open ? "flex" : "hidden"
        } md:flex w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800 flex-col p-4 shrink-0 bg-zinc-950`}
      >
        <Link href="/" className="hidden md:flex items-center gap-2.5 font-display font-semibold text-[15px] px-1 mb-6">
          <span className="case-stamp w-8 h-8 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </span>
          Civix
        </Link>

        <div className="px-2 mb-4 flex items-center gap-2">
          <span
            className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-md ${
              role === "authority"
                ? "bg-amber-500/10 text-amber-300"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800"
            }`}
          >
            {role === "authority" ? "Authority" : "Citizen account"}
          </span>
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
          <div className="h-px bg-zinc-800 my-2" />
          <NavLink href="/map" label="Public map" icon={MapIcon} />
        </nav>

        {role === "citizen" && stats && (
          <div className="mt-5 px-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-2 px-1">
              Your reports
            </p>
            <div className="space-y-1">
              <StatRow icon={Clock} label="Awaiting review" value={stats.reported} color="text-blue-400" />
              <StatRow icon={Wrench} label="In progress" value={stats.in_progress} color="text-amber-400" />
              <StatRow icon={CheckCircle2} label="Resolved" value={stats.resolved} color="text-emerald-400" />
            </div>
          </div>
        )}

        <div className="mt-5 px-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-2 px-1">
            Severity key
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 px-1">
            {SEVERITY_LEGEND.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col gap-1">
          <NavLink href="/dashboard/settings" label="Settings" icon={Settings} />
          <NavLink href="/dashboard/help" label="Help" icon={HelpCircle} />
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0 case-id">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500 truncate">{email}</p>
          </div>
        </div>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between px-1 py-1 text-xs">
      <span className="flex items-center gap-1.5 text-zinc-400">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {label}
      </span>
      <span className="case-id text-zinc-300">{value}</span>
    </div>
  );
}