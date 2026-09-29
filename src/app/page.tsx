import Link from "next/link";
import { ShieldAlert, Camera, MapPin, Mail, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5 font-display font-semibold text-lg">
          <span className="case-stamp w-9 h-9 text-amber-400">
            <ShieldAlert className="w-4.5 h-4.5" />
          </span>
          Civix
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium px-4 py-2 rounded-lg transition"
          >
            Report a hazard
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-16">
        <div className="animate-fade-up inline-flex items-center gap-2 text-xs font-medium case-id bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full mb-6">
          <ShieldAlert className="w-3.5 h-3.5" />
          Powered by Groq AI + Vision
        </div>
        <h1 className="animate-fade-up font-display text-5xl sm:text-6xl font-semibold tracking-tight mb-6" style={{ animationDelay: "0.1s" }}>
          See a hazard.
          <br />
          <span className="text-amber-400">Get it fixed faster.</span>
        </h1>
        <p className="animate-fade-up text-lg text-zinc-400 max-w-xl mx-auto mb-10" style={{ animationDelay: "0.2s" }}>
          Photograph a pothole, broken streetlight, or exposed wiring. Civix drafts
          the formal complaint, prioritizes it for local authorities, and tracks it
          until it's resolved.
        </p>
        <div className="animate-fade-up flex items-center justify-center gap-4" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium px-6 py-3 rounded-lg transition"
          >
            Start reporting <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/map"
            className="flex items-center gap-2 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-medium px-6 py-3 rounded-lg transition"
          >
            View public map
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 px-6 pb-24">
        <Feature
          icon={<Camera className="w-5 h-5 text-amber-400" />}
          title="Photo to complaint"
          desc="Groq Vision classifies the hazard and its severity, then Groq AI drafts a formal complaint automatically."
        />
        <Feature
          icon={<MapPin className="w-5 h-5 text-amber-400" />}
          title="AI-prioritized queue"
          desc="Authorities see hazards ranked by severity, age, and how many citizens confirmed it's still there."
        />
        <Feature
          icon={<Mail className="w-5 h-5 text-amber-400" />}
          title="Tracked to resolution"
          desc="Get notified by email the moment your report is acknowledged, in progress, or resolved."
        />
      </section>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display font-medium mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}