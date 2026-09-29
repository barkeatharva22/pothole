import Groq from "groq-sdk";
import type { Category, Severity } from "./types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models sometimes wrap JSON in ```fences``` or add text around it. Pull out the object.
function parseJsonLoose<T>(raw: string): T {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error(`Model returned no JSON: ${raw.slice(0, 200)}`);
  return JSON.parse(raw.slice(start, end + 1)) as T;
}

const CATEGORIES = ["pothole", "streetlight", "electrical", "water", "garbage", "road_damage", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];

export interface HazardClassification {
  title: string;
  category: Category;
  severity: Severity;
  description: string;
}

// Vision models on Groq change often (older ones get shut down).
// Set GROQ_VISION_MODEL in .env.local to override. We try each in order until one works.
const VISION_MODELS = [
  process.env.GROQ_VISION_MODEL,
  "qwen/qwen3.6-27b",
  "qwen/qwen3.8-27b",
].filter((m): m is string => Boolean(m));

const CLASSIFY_PROMPT = `Look at this photo of a potential civic hazard. Respond with ONLY a JSON object,
no markdown fences, no preamble, with this exact shape:
{
  "title": "short 6-10 word description of the hazard",
  "category": "pothole" | "streetlight" | "electrical" | "water" | "garbage" | "road_damage" | "other",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "2-3 sentence factual description of what's visible, for a formal complaint"
}
Severity should reflect real danger to public safety (e.g. exposed live wiring or a deep pothole
on a busy road is critical/high; a minor cosmetic issue is low).`;

// Groq Vision: analyze a hazard photo and classify it
export async function classifyHazardImage(imageDataUrl: string): Promise<HazardClassification> {
  let lastError: unknown;

  for (const model of VISION_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: CLASSIFY_PROMPT },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.2,
        reasoning_effort: "none", // skip "thinking" so the JSON answer is returned directly
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content ?? "";
      const c = parseJsonLoose<HazardClassification>(content);
      return {
        title: c.title || "Civic hazard",
        category: CATEGORIES.includes(c.category) ? c.category : "other",
        severity: SEVERITIES.includes(c.severity) ? c.severity : "medium",
        description: c.description || "",
      };
    } catch (err) {
      console.error(`Vision model ${model} failed:`, err);
      lastError = err;
      // try the next model
    }
  }
  throw lastError ?? new Error("No vision model available");
}

// Groq AI: draft a formal complaint from the classification + location
export async function draftComplaint(
  classification: HazardClassification,
  address: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content:
          "You draft short, formal, properly-toned civic complaints addressed to a local municipal authority. Be factual, concise, and professional. 3-4 sentences plus a closing request for action. No markdown. Address it to The Concerned Authority, Municipal Corporation. NEVER use placeholders or fill-in-the-blank text in square brackets such as [Municipality Name], [Your Name] or [Date]; if a detail is unknown, leave it out. Do not include a signature block.",
      },
      {
        role: "user",
        content: `Hazard type: ${classification.category}
Severity: ${classification.severity}
Description: ${classification.description}
Location: ${address}

Draft the formal complaint.`,
      },
    ],
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  // Safety net: remove any leftover [placeholder] text the model may still add
  return text
    .replace(/\[[^\]]{1,60}\]/g, "")
    .replace(/[ \t]+,/g, ",")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  description: string;
  distanceMeters: number;
}

export interface DuplicateMatch {
  id: string;
  title: string;
  score: number;
}

// Groq AI: given nearby existing hazards, decide if any are likely the same as the new one
export async function detectDuplicates(
  newHazard: { title: string; description: string },
  candidates: DuplicateCandidate[]
): Promise<DuplicateMatch[]> {
  if (candidates.length === 0) return [];

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      {
        role: "system",
        content: `You detect duplicate civic hazard reports. Given a new report and a list of nearby
existing reports (with distance in meters), decide which existing reports are LIKELY describing
the same physical hazard. Respond with ONLY a JSON object, no markdown, in this shape:
{ "matches": [{ "id": "...", "score": 0.0-1.0 }] }
Only include matches with score > 0.6. Consider both description similarity AND distance —
reports more than ~100m apart are unlikely to be the same hazard even if similar.`,
      },
      {
        role: "user",
        content: `New report:
Title: ${newHazard.title}
Description: ${newHazard.description}

Nearby existing reports:
${candidates
  .map(
    (c, i) =>
      `${i + 1}. id=${c.id}, distance=${Math.round(c.distanceMeters)}m, title="${c.title}", description="${c.description}"`
  )
  .join("\n")}`,
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = parseJsonLoose<{ matches?: { id: string; score: number }[] }>(content);

  return (parsed.matches ?? []).map((m) => {
    const candidate = candidates.find((c) => c.id === m.id);
    return { id: m.id, title: candidate?.title ?? "", score: m.score };
  });
}