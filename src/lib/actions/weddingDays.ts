"use server";

import { getData, setData } from "@/lib/actions/userData";
import type { WeddingDayPlan } from "@/lib/types/wedding";

const DEFAULT_DAYS: WeddingDayPlan[] = [
  { id: "day1", label: "Thursday, Aug 6", time: "", tasks: "", notes: "" },
  { id: "day2", label: "Friday, Aug 7", time: "", tasks: "", notes: "" },
  { id: "day3", label: "Saturday, Aug 8 · Wedding Day", time: "", tasks: "", notes: "" },
];

export async function getWeddingDays(): Promise<WeddingDayPlan[]> {
  return getData<WeddingDayPlan[]>("wedding_days_v1", DEFAULT_DAYS);
}

async function save(days: WeddingDayPlan[]) {
  await setData("wedding_days_v1", days, "/wedding");
}

export async function addWeddingDay(label: string) {
  const days = await getWeddingDays();
  const day: WeddingDayPlan = { id: `d${Date.now()}`, label, time: "", tasks: "", notes: "" };
  await save([...days, day]);
  return day;
}

export async function removeWeddingDay(id: string) {
  const days = await getWeddingDays();
  await save(days.filter((d) => d.id !== id));
}

export async function updateWeddingDayField(
  id: string,
  field: "label" | "time" | "tasks" | "notes",
  value: string
) {
  const days = await getWeddingDays();
  await save(days.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
}
