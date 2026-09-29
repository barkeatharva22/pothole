import { Camera, Sparkles, MapPinned, Mail, ShieldAlert, Gavel } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Help &amp; how it works</h1>
      <p className="text-sm text-zinc-500 mb-6">A quick guide to reporting and tracking hazards.</p>

      <div className="space-y-3 mb-8">
        <HelpStep
          icon={<Camera className="w-4 h-4" />}
          title="1. Photograph the hazard"
          desc="Open Report hazard, take or upload a photo, and share your location — either with GPS or by typing an address and clicking Look up."
        />
        <HelpStep
          icon={<Sparkles className="w-4 h-4" />}
          title="2. Let AI analyze it"
          desc="Click Analyze with AI. It classifies the category and severity, and drafts a formal complaint on your behalf."
        />
        <HelpStep
          icon={<Mail className="w-4 h-4" />}
          title="3. It's sent automatically"
          desc="Once you submit, the drafted complaint is emailed straight to the department responsible for that category."
        />
        <HelpStep
          icon={<MapPinned className="w-4 h-4" />}
          title="4. Track it to resolution"
          desc="Check My reports any time to see its status. You'll also get an email whenever it's updated."
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="font-medium text-sm">Severity levels</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Low and medium severity issues are cosmetic or minor inconveniences. High and critical
          are for hazards that pose real danger — like exposed live wiring or a deep pothole on a
          busy road — and get prioritized accordingly.
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Gavel className="w-4 h-4 text-amber-400" />
          <h2 className="font-medium text-sm">For authorities</h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Authority accounts see a triage queue of all reports, ranked by severity and age, and
          can update a report's status as it moves from reported to resolved — citizens are
          notified by email at each step.
        </p>
      </div>
    </div>
  );
}

function HelpStep({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium mb-1">{title}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}