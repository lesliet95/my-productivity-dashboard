"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export async function getNotes(): Promise<Note[]> {
  const rows = await getDb()`SELECT * FROM notes ORDER BY updated_at DESC`;
  return rows as Note[];
}

export async function createNote(data: {
  title: string;
  content?: string;
  tags?: string[];
}) {
  await getDb()`
    INSERT INTO notes (title, content, tags)
    VALUES (${data.title}, ${data.content ?? ""}, ${data.tags ?? []})
  `;
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function updateNote(
  id: number,
  data: { title?: string; content?: string; tags?: string[] }
) {
  await getDb()`
    UPDATE notes SET
      title = COALESCE(${data.title ?? null}, title),
      content = COALESCE(${data.content ?? null}, content),
      tags = COALESCE(${data.tags ?? null}, tags),
      updated_at = now()
    WHERE id = ${id}
  `;
  revalidatePath("/notes");
}

export async function deleteNote(id: number) {
  await getDb()`DELETE FROM notes WHERE id = ${id}`;
  revalidatePath("/notes");
  revalidatePath("/");
}
