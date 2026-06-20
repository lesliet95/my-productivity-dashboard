"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";

export type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: "active" | "completed" | "paused";
  created_at: string;
  updated_at: string;
};

export async function getGoals(): Promise<Goal[]> {
  const rows = await sql`SELECT * FROM goals ORDER BY status ASC, target_date ASC NULLS LAST`;
  return rows as Goal[];
}

export async function createGoal(data: {
  title: string;
  description?: string;
  target_date?: string;
}) {
  await sql`
    INSERT INTO goals (title, description, target_date)
    VALUES (${data.title}, ${data.description ?? null}, ${data.target_date ?? null})
  `;
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function updateGoalProgress(id: number, progress: number) {
  const status = progress >= 100 ? "completed" : undefined;
  await sql`
    UPDATE goals SET
      progress = ${progress},
      status = COALESCE(${status ?? null}, status),
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/goals");
  revalidatePath("/");
}

export async function deleteGoal(id: number) {
  await sql`DELETE FROM goals WHERE id = ${id}`;
  revalidatePath("/goals");
  revalidatePath("/");
}
