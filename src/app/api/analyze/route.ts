import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyHazardImage, draftComplaint, detectDuplicates } from "@/lib/groq";
import { distanceInMeters } from "@/lib/priority";
import type { Hazard } from "@/lib/types";

const NEARBY_RADIUS_METERS = 300;

// POST /api/analyze
// body: { image_data_url, latitude, longitude, address }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { image_data_url, latitude, longitude, address } = body;

  if (!image_data_url || latitude == null || longitude == null) {
    return NextResponse.json({ error: "Missing image or location" }, { status: 400 });
  }

  try {
    const classification = await classifyHazardImage(image_data_url);
    const complaint = await draftComplaint(classification, address ?? "Unknown location");

    // Find nearby existing hazards for duplicate detection
    const { data: allHazards } = await supabase
      .from("hazards")
      .select("*")
      .neq("status", "resolved")
      .limit(200);

    const nearby = ((allHazards as Hazard[]) ?? [])
      .map((h) => ({
        id: h.id,
        title: h.title,
        description: h.description,
        distanceMeters: distanceInMeters(latitude, longitude, h.latitude, h.longitude),
      }))
      .filter((h) => h.distanceMeters <= NEARBY_RADIUS_METERS)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 10);

    // Duplicate detection is a bonus - never let it break the whole analysis
    let duplicates: Awaited<ReturnType<typeof detectDuplicates>> = [];
    try {
      duplicates = await detectDuplicates(
        { title: classification.title, description: classification.description },
        nearby
      );
    } catch (e) {
      console.error("detectDuplicates failed:", e);
    }

    return NextResponse.json({
      ...classification,
      ai_complaint_draft: complaint,
      duplicates,
    });
  } catch (err) {
    console.error("Analyze failed:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
