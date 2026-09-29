import type { Category } from "./types";

// Fill in the real email address for whichever department handles each
// category in your city/area. Leave the fallback as a safe default.
export const AUTHORITY_EMAILS: Record<Category, string> = {
  pothole: "sharmaeeshika08@gmail.com",
  road_damage: "sharmaeeshika08@gmail.com",
  streetlight: "sharmaeeshika08@gmail.com",
  electrical: "sharmaeeshika08@gmail.com",
  water: "sharmaeeshika08@gmail.com",
  garbage: "sharmaeeshika08@gmail.com",
  other: "sharmaeeshika08@gmail.com",
};

export function getAuthorityEmail(category: Category): string {
  return AUTHORITY_EMAILS[category] ?? AUTHORITY_EMAILS.other;
}