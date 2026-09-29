import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/confirm - confirm a hazard still exists (toggles on/off)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { hazard_id } = await req.json();

  const { data: existing } = await supabase
    .from("confirmations")
    .select("id")
    .eq("hazard_id", hazard_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("confirmations").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ confirmed: false });
  }

  const { error } = await supabase
    .from("confirmations")
    .insert({ hazard_id, user_id: user.id });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ confirmed: true });
}
