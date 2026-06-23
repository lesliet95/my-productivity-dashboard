"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

export async function getData<T>(key: string, fallback: T): Promise<T> {
  const sql = getDb();
  const rows = await sql`SELECT value FROM user_data WHERE key = ${key}`;
  if (rows.length === 0) return fallback;
  return rows[0].value as T;
}

export async function setData<T>(key: string, value: T, revalidate?: string): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO user_data (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = now()
  `;
  if (revalidate) revalidatePath(revalidate);
}
