import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, email, created_at")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-zinc-500 mb-6">Manage your account details.</p>

      <SettingsForm
        userId={user!.id}
        email={user!.email ?? ""}
        fullName={profile?.full_name ?? ""}
        role={profile?.role ?? "citizen"}
        joined={profile?.created_at ?? user!.created_at}
      />
    </div>
  );
}