"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import type { FreedomCategory } from "@/lib/freedomCategories";
import type { Subtask } from "@/lib/actions/tasks";

export type { Subtask };

export type FreedomTask = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  category: FreedomCategory | null;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};

async function ensureColumns() {
  await getDb()`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS list TEXT NOT NULL DEFAULT 'main'`;
  await getDb()`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB NOT NULL DEFAULT '[]'`;
}

export async function getFreedomTasks(): Promise<FreedomTask[]> {
  await ensureColumns();
  const rows = await getDb()`
    SELECT id, title, description, completed, priority, category,
           TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
           subtasks, created_at, updated_at
    FROM tasks WHERE list = 'freedom'
    ORDER BY completed ASC, priority DESC, created_at DESC
  `;
  return rows.map((r) => ({ ...r, subtasks: r.subtasks ?? [] })) as FreedomTask[];
}

export async function createFreedomTask(data: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  category?: string;
}) {
  await ensureColumns();
  await getDb()`
    INSERT INTO tasks (title, description, priority, due_date, category, list)
    VALUES (${data.title}, ${data.description ?? null}, ${data.priority ?? "medium"}, ${data.due_date ?? null}, ${data.category ?? null}, 'freedom')
  `;
  revalidatePath("/freedom");
}

export async function toggleFreedomTask(id: number) {
  await getDb()`UPDATE tasks SET completed = NOT completed, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function deleteFreedomTask(id: number) {
  await getDb()`DELETE FROM tasks WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function updateFreedomTaskDescription(id: number, description: string) {
  await getDb()`UPDATE tasks SET description = ${description || null}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function updateFreedomTaskCategory(id: number, category: FreedomCategory | null) {
  await getDb()`UPDATE tasks SET category = ${category}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function updateFreedomTaskPriority(id: number, priority: "low" | "medium" | "high") {
  await getDb()`UPDATE tasks SET priority = ${priority}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function updateFreedomTaskDueDate(id: number, due_date: string | null) {
  await getDb()`UPDATE tasks SET due_date = ${due_date || null}, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}

export async function updateFreedomTaskSubtasks(id: number, subtasks: Subtask[]) {
  await getDb()`UPDATE tasks SET subtasks = ${JSON.stringify(subtasks)}::jsonb, updated_at = now() WHERE id = ${id}`;
  revalidatePath("/freedom");
}
