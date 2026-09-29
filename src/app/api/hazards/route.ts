import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendComplaintEmail } from "@/lib/resend";
import { getAuthorityEmail } from "@/lib/authority-emails";
import type { Hazard } from "@/lib/types";

// GET /api/hazards - list all hazards (public map + dashboards use this)
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hazards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST /api/hazards - create a new hazard report
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("hazards")
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category ?? "other",
      severity: body.severity ?? "medium",
      status: "reported",
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address ?? null,
      ai_complaint_draft: body.ai_complaint_draft ?? null,
      duplicate_of: body.duplicate_of ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire off the AI-drafted complaint to the responsible department.
  // Wrapped in try/catch so an email failure never blocks the report from saving.
  try {
    const authorityEmail = getAuthorityEmail((data as Hazard).category);
    await sendComplaintEmail(authorityEmail, data as Hazard, user.email ?? "");
  } catch (emailErr) {
    console.error("Failed to send complaint email:", emailErr);
  }

  return NextResponse.json({ data }, { status: 201 });
}