import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWeeklyDigest } from "@/lib/resend";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("hazards")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "resolved")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ message: "No open reports, nothing sent" });
  }

  await sendWeeklyDigest(user.email, data);
  return NextResponse.json({ message: `Digest sent to ${user.email}` });
}
