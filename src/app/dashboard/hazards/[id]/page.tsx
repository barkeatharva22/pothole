import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Hazard } from "@/lib/types";
import HazardDetailClient from "./HazardDetailClient";

export default async function HazardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: hazard } = await supabase.from("hazards").select("*").eq("id", id).single();
  if (!hazard) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const { data: myConfirmation } = await supabase
    .from("confirmations")
    .select("id")
    .eq("hazard_id", id)
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <HazardDetailClient
      hazard={hazard as Hazard}
      isOwner={hazard.user_id === user!.id}
      isAuthority={profile?.role === "authority"}
      initiallyConfirmed={!!myConfirmation}
    />
  );
}
