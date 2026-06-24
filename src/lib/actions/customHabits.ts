"use server";

import { revalidatePath } from "next/cache";
import { getData, setData } from "./userData";
import type { CustomHabit, HabitData, HabitLog } from "@/lib/types/habits";

const KEY = "habit_tracker";
const FALLBACK: HabitData = {
  habits: [],
  logs: [],
  sectionNames: { daily: "Daily", devotional: "Devotional" },
};

export async function getHabitData(): Promise<HabitData> {
  const data = await getData<HabitData>(KEY, FALLBACK);
  // backfill for existing data that predates sectionNames
  if (!data.sectionNames) {
    return { ...data, sectionNames: { daily: "Daily", devotional: "Devotional" } };
  }
  return data;
}

export async function saveManageData(
  habits: CustomHabit[],
  sectionNames: { daily: string; devotional: string }
): Promise<void> {
  const current = await getHabitData();
  await setData(KEY, { ...current, habits, sectionNames }, "/habits/tracker");
}

export async function toggleLog(habitId: string, date: string): Promise<void> {
  const current = await getHabitData();
  const exists = current.logs.some((l) => l.habitId === habitId && l.date === date);
  const logs: HabitLog[] = exists
    ? current.logs.filter((l) => !(l.habitId === habitId && l.date === date))
    : [...current.logs, { habitId, date }];
  await setData(KEY, { ...current, logs }, "/habits/tracker");
}

// Prune logs older than 90 days to keep the JSON lean
export async function pruneLogs(): Promise<void> {
  const current = await getHabitData();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const logs = current.logs.filter((l) => new Date(l.date) >= cutoff);
  await setData(KEY, { ...current, logs });
}
