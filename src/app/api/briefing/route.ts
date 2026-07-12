import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const sql = getDb();

  const [tasks, habits, goals] = await Promise.all([
    sql`
      SELECT title, priority, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date
      FROM tasks
      WHERE completed = false
        AND (due_date IS NULL OR due_date <= CURRENT_DATE)
      ORDER BY priority DESC, due_date ASC NULLS LAST
      LIMIT 10
    `,
    sql`
      SELECT
        h.name,
        h.frequency,
        EXISTS(
          SELECT 1 FROM habit_completions hc
          WHERE hc.habit_id = h.id AND hc.completed_on = CURRENT_DATE
        ) AS completed_today,
        (
          SELECT COUNT(*)::int FROM habit_completions hc
          WHERE hc.habit_id = h.id AND hc.completed_on >= CURRENT_DATE - INTERVAL '30 days'
        ) AS streak
      FROM habits h
      ORDER BY h.created_at ASC
    `,
    sql`
      SELECT title, progress, TO_CHAR(target_date, 'YYYY-MM-DD') AS target_date
      FROM goals
      WHERE status = 'active'
      ORDER BY target_date ASC NULLS LAST
      LIMIT 5
    `,
  ]);

  return NextResponse.json({ date: new Date().toISOString().slice(0, 10), tasks, habits, goals });
}
