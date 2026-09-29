export type Severity = "low" | "medium" | "high" | "critical";
export type Status = "reported" | "acknowledged" | "in_progress" | "resolved";
export type Category =
  | "pothole"
  | "streetlight"
  | "electrical"
  | "water"
  | "garbage"
  | "road_damage"
  | "other";
export type Role = "citizen" | "authority";

export interface Profile {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
}

export interface Hazard {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: Category;
  severity: Severity;
  status: Status;
  latitude: number;
  longitude: number;
  address: string | null;
  ai_complaint_draft: string | null;
  duplicate_of: string | null;
  confirmations_count: number;
  created_at: string;
  updated_at: string;
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  low: "#3b82f6",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export const STATUS_LABELS: Record<Status, string> = {
  reported: "Reported",
  acknowledged: "Acknowledged",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  pothole: "Pothole",
  streetlight: "Broken streetlight",
  electrical: "Electrical hazard",
  water: "Water/drainage issue",
  garbage: "Garbage/dumping",
  road_damage: "Road damage",
  other: "Other",
};
