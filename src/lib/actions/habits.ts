"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export type Habit = {
  id: number;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly";
  color: string;
  created_at: string;
  completed_today: boolean;
  streak: number;
};

export async function getHabits(): Promise<Habit[]> {
  const rows = await getDb()`
    SELECT
      h.*,
      EXISTS(
        SELECT 1 FROM habit_completions hc
        WHERE hc.habit_id = h.id AND hc.completed_on = CURRENT_DATE
      ) AS completed_today,
      (
        SELECT COUNT(*)::int FROM habit_completions hc
        WHERE hc.habit_id = h.id
          AND hc.completed_on >= CURRENT_DATE - INTERVAL '30 days'
      ) AS streak
    FROM habits h
    ORDER BY h.created_at DESC
  `;
  return rows as Habit[];
}

export async function createHabit(data: {
  name: string;
  description?: string;
  frequency?: string;
  color?: string;
}) {
  await getDb()`
    INSERT INTO habits (name, description, frequency, color)
    VALUES (${data.name}, ${data.description ?? null}, ${data.frequency ?? "daily"}, ${data.color ?? "#6366f1"})
  `;
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function toggleHabit(id: number) {
  const existing = await getDb()`
    SELECT id FROM habit_completions
    WHERE habit_id = ${id} AND completed_on = CURRENT_DATE
  `;
  if (existing.length > 0) {
    await getDb()`
      DELETE FROM habit_completions WHERE habit_id = ${id} AND completed_on = CURRENT_DATE
    `;
  } else {
    await getDb()`
      INSERT INTO habit_completions (habit_id) VALUES (${id})
      ON CONFLICT (habit_id, completed_on) DO NOTHING
    `;
  }
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function deleteHabit(id: number) {
  await getDb()`DELETE FROM habits WHERE id = ${id}`;
  revalidatePath("/habits");
  revalidatePath("/");
}
