import type { Hazard, Severity } from "./types";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Combines severity, age (older open reports rank higher), and community
// confirmations into a single priority score for the authority queue.
export function priorityScore(hazard: Hazard): number {
  const severityScore = SEVERITY_WEIGHT[hazard.severity] * 25;

  const ageInDays =
    (Date.now() - new Date(hazard.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(ageInDays * 3, 30);

  const confirmationScore = Math.min(hazard.confirmations_count * 5, 25);

  return Math.round(severityScore + ageScore + confirmationScore);
}

export function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
