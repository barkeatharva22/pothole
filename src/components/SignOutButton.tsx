"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition w-full"
    >
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  );
}
