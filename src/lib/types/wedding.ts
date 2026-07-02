export type WeddingCategory = "Wedding Checklist" | "House Maintenance" | "Meals" | "Week of" | "Day of";

export interface WeddingSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface WeddingTask {
  id: string;
  title: string;
  completed: boolean;
  category: WeddingCategory;
  time?: string;
  date?: string;
  scheduleDay?: "thu" | "fri" | "sat";
  subtasks?: WeddingSubtask[];
}

export const WEDDING_CATEGORY_STYLES: Record<WeddingCategory, { pill: string; header: string; dot: string; label: string }> = {
  "Wedding Checklist": { pill: "bg-rose-100 text-rose-700",   header: "bg-rose-50",   dot: "bg-rose-400",   label: "text-rose-700" },
  "House Maintenance": { pill: "bg-amber-100 text-amber-700", header: "bg-amber-50",  dot: "bg-amber-400",  label: "text-amber-700" },
  "Meals":             { pill: "bg-green-100 text-green-700", header: "bg-green-50",  dot: "bg-green-400",  label: "text-green-700" },
  "Week of":           { pill: "bg-blue-100 text-blue-700",   header: "bg-blue-50",   dot: "bg-blue-400",   label: "text-blue-700" },
  "Day of":            { pill: "bg-purple-100 text-purple-700", header: "bg-purple-50", dot: "bg-purple-400", label: "text-purple-700" },
};

export const WEDDING_CATEGORIES: WeddingCategory[] = [
  "Wedding Checklist", "House Maintenance", "Meals", "Week of", "Day of",
];
