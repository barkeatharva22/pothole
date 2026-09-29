import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hazard } from "@/lib/types";
import TriageQueueClient from "./TriageQueueClient";

export default async function AuthorityDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "authority") {
    redirect("/dashboard");
  }

  const { data: hazards } = await supabase
    .from("hazards")
    .select("*")
    .order("created_at", { ascending: false });

  return <TriageQueueClient hazards={(hazards as Hazard[]) ?? []} />;
}
