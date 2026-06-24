"use server";

import { getData, setData } from "./userData";

export interface WeekTask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface WeekGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface WeekReading {
  title: string;
  author: string;
  progress: number; // 0-100
}

export interface WeekData {
  weekKey: string; // Monday YYYY-MM-DD
  tasks: WeekTask[];
  focus: string;
  goals: WeekGoal[];
  reflection: string;
  reading: WeekReading;
}

const FALLBACK = (weekKey: string): WeekData => ({
  weekKey,
  tasks: [],
  focus: "",
  goals: [],
  reflection: "",
  reading: { title: "", author: "", progress: 0 },
});

function key(weekKey: string) {
  return `week_${weekKey}`;
}

export async function getWeekData(weekKey: string): Promise<WeekData> {
  const data = await getData<WeekData>(key(weekKey), FALLBACK(weekKey));
  return { ...FALLBACK(weekKey), ...data };
}

export async function saveWeekData(weekKey: string, data: Partial<WeekData>): Promise<void> {
  const current = await getWeekData(weekKey);
  await setData(key(weekKey), { ...current, ...data }, "/week");
}
