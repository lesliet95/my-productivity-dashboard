"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import type { TaskCategory } from "@/lib/taskCategories";

export type { TaskCategory };

export type Subtask = { id: string; title: string; completed: boolean };

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  category: TaskCategory | null;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};

async function ensureSubtasksColumn() {
  await getDb()`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB NOT NULL DEFAULT '[]'`;
}

export async function getTasks(): Promise<Task[]> {
  await ensureSubtasksColumn();
  const rows = await getDb()`
    SELECT id, title, description, completed, priority, category,
           TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
           subtasks, created_at, updated_at
    FROM tasks WHERE list IS NULL OR list = 'main'
    ORDER BY completed ASC, priority DESC, created_at DESC
  `;
  return rows.map((r) => ({ ...r, subtasks: r.subtasks ?? [] })) as Task[];
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
  category?: string;
}) {
  await getDb()`
    INSERT INTO tasks (title, description, priority, due_date, category)
    VALUES (${data.title}, ${data.description ?? null}, ${data.priority ?? "medium"}, ${data.due_date ?? null}, ${data.category ?? null})
  `;
  revalidatePath("/tasks");
  revalidatePath("/week");
  revalidatePath("/");
}

export async function toggleTask(id: number) {
  await getDb()`
    UPDATE tasks SET completed = NOT completed, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
  revalidatePath("/week");
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  await getDb()`DELETE FROM tasks WHERE id = ${id}`;
  revalidatePath("/tasks");
  revalidatePath("/week");
  revalidatePath("/");
}

export async function updateTaskDescription(id: number, description: string) {
  await getDb()`
    UPDATE tasks SET description = ${description || null}, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
}

export async function updateTaskCategory(id: number, category: TaskCategory | null) {
  await getDb()`
    UPDATE tasks SET category = ${category}, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
  revalidatePath("/week");
}

export async function updateTaskDueDate(id: number, due_date: string | null) {
  await getDb()`
    UPDATE tasks SET due_date = ${due_date || null}, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
  revalidatePath("/week");
}

export async function updateTaskSubtasks(id: number, subtasks: Subtask[]) {
  await getDb()`
    UPDATE tasks SET subtasks = ${JSON.stringify(subtasks)}::jsonb, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
}
