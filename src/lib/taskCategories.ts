export type TaskCategory = "Home" | "Finances" | "Music Lovers" | "Food" | "Self Care";

export const TASK_CATEGORIES: TaskCategory[] = ["Home", "Finances", "Music Lovers", "Food", "Self Care"];

export const CATEGORY_STYLES: Record<TaskCategory, { pill: string; border: string }> = {
  "Home":         { pill: "bg-blue-100 text-blue-700",     border: "border-l-blue-400" },
  "Finances":     { pill: "bg-green-100 text-green-700",   border: "border-l-green-400" },
  "Music Lovers": { pill: "bg-purple-100 text-purple-700", border: "border-l-purple-400" },
  "Food":         { pill: "bg-orange-100 text-orange-700", border: "border-l-orange-400" },
  "Self Care":    { pill: "bg-pink-100 text-pink-700",     border: "border-l-pink-400" },
};
