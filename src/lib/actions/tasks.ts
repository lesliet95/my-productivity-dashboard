"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTasks(): Promise<Task[]> {
  const rows = await getDb()`
    SELECT * FROM tasks ORDER BY completed ASC, priority DESC, created_at DESC
  `;
  return rows as Task[];
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: string;
  due_date?: string;
}) {
  await getDb()`
    INSERT INTO tasks (title, description, priority, due_date)
    VALUES (${data.title}, ${data.description ?? null}, ${data.priority ?? "medium"}, ${data.due_date ?? null})
  `;
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function toggleTask(id: number) {
  await getDb()`
    UPDATE tasks SET completed = NOT completed, updated_at = now() WHERE id = ${id}
  `;
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTask(id: number) {
  await getDb()`DELETE FROM tasks WHERE id = ${id}`;
  revalidatePath("/tasks");
  revalidatePath("/");
}
