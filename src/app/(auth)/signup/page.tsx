"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ShieldAlert } from "lucide-react";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("citizen");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8 font-semibold text-lg">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Civix
        </Link>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h1 className="text-xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-zinc-400 mb-6">Report hazards or manage them as an authority.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1.5">Full name</label>
              <input
                required value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1.5">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1.5">Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-500 transition"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1.5">Account type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("citizen")}
                  className={`text-sm py-2 rounded-lg border transition ${
                    role === "citizen"
                      ? "bg-amber-500 text-zinc-950 border-amber-500"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => setRole("authority")}
                  className={`text-sm py-2 rounded-lg border transition ${
                    role === "authority"
                      ? "bg-amber-500 text-zinc-950 border-amber-500"
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  Authority
                </button>
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">
                Choose &quot;Authority&quot; for the demo to see the triage dashboard.
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-medium py-2.5 rounded-lg transition"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account? <Link href="/login" className="text-amber-400 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
