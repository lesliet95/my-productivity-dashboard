export type FreedomCategory = "Finances" | "Health Benefits" | "Work Info";

export const FREEDOM_CATEGORIES: FreedomCategory[] = ["Finances", "Health Benefits", "Work Info"];

export const FREEDOM_CATEGORY_STYLES: Record<FreedomCategory, { pill: string; border: string }> = {
  "Finances":       { pill: "bg-green-100 text-green-700",  border: "border-l-green-400" },
  "Health Benefits":{ pill: "bg-blue-100 text-blue-700",    border: "border-l-blue-400" },
  "Work Info":      { pill: "bg-purple-100 text-purple-700",border: "border-l-purple-400" },
};

export const FREEDOM_COL_ACCENT: Record<FreedomCategory | "Uncategorized", { header: string; label: string; dot: string }> = {
  "Finances":        { header: "bg-green-50",  label: "text-green-700",  dot: "bg-green-400" },
  "Health Benefits": { header: "bg-blue-50",   label: "text-blue-700",   dot: "bg-blue-400" },
  "Work Info":       { header: "bg-purple-50", label: "text-purple-700", dot: "bg-purple-400" },
  "Uncategorized":   { header: "bg-gray-50",   label: "text-gray-600",   dot: "bg-gray-400" },
};
