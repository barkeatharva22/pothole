import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import type { Hazard } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "citizen" | "authority") ?? "citizen";

  let stats = { reported: 0, in_progress: 0, resolved: 0 };
  if (role === "citizen") {
    const { data: hazards } = await supabase
      .from("hazards")
      .select("status")
      .eq("user_id", user.id);
    const list = (hazards as Pick<Hazard, "status">[]) ?? [];
    stats = {
      reported: list.filter((h) => h.status === "reported" || h.status === "acknowledged").length,
      in_progress: list.filter((h) => h.status === "in_progress").length,
      resolved: list.filter((h) => h.status === "resolved").length,
    };
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      <Sidebar email={user.email ?? ""} role={role} stats={stats} />
      <main className="flex-1 p-5 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}