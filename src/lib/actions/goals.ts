"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { currentQuarter, shiftQuarter } from "@/lib/quarters";
import { goalProgress, type Goal, type KeyResult, type Milestone } from "@/lib/types/goals";

export type { Goal, KeyResult, Milestone };

let schemaReady: Promise<void> | null = null;

export async function ensureGoalsSchema(): Promise<void> {
  return ensureSchema();
}

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getDb();
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS quarter TEXT`;
      await sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS rolled_from INTEGER REFERENCES goals(id) ON DELETE SET NULL`;
      await sql`
        CREATE TABLE IF NOT EXISTS key_results (
          id SERIAL PRIMARY KEY,
          goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          kind TEXT NOT NULL DEFAULT 'number' CHECK (kind IN ('number', 'checklist')),
          start_value NUMERIC NOT NULL DEFAULT 0,
          current_value NUMERIC NOT NULL DEFAULT 0,
          target_value NUMERIC NOT NULL DEFAULT 100,
          unit TEXT,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS milestones (
          id SERIAL PRIMARY KEY,
          key_result_id INTEGER NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          week INTEGER,
          done BOOLEAN NOT NULL DEFAULT false,
          position INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // Existing goals: active ones move into the current quarter, the rest
      // land in the quarter they were last updated.
      const q = currentQuarter();
      await sql`UPDATE goals SET quarter = ${q} WHERE quarter IS NULL AND status = 'active'`;
      await sql`
        UPDATE goals
        SET quarter = EXTRACT(YEAR FROM updated_at)::int || '-Q' || EXTRACT(QUARTER FROM updated_at)::int
        WHERE quarter IS NULL
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function getGoals(): Promise<Goal[]> {
  await ensureSchema();
  const sql = getDb();
  const [goals, krs, milestones] = await Promise.all([
    sql`
      SELECT g.id, g.title, g.description, TO_CHAR(g.target_date, 'YYYY-MM-DD') AS target_date,
        g.progress, g.status, g.quarter, g.rolled_from, g.created_at, g.updated_at,
        (SELECT n.quarter FROM goals n WHERE n.rolled_from = g.id LIMIT 1) AS rolled_to
      FROM goals g
      ORDER BY g.status ASC, g.created_at ASC
    `,
    sql`SELECT * FROM key_results ORDER BY position ASC, id ASC`,
    sql`SELECT id, key_result_id, title, week, done, position FROM milestones ORDER BY week ASC NULLS LAST, position ASC, id ASC`,
  ]);

  const msByKr = new Map<number, Milestone[]>();
  for (const m of milestones as Milestone[]) {
    msByKr.set(m.key_result_id, [...(msByKr.get(m.key_result_id) ?? []), m]);
  }
  const krsByGoal = new Map<number, KeyResult[]>();
  for (const row of krs) {
    const kr: KeyResult = {
      id: row.id,
      goal_id: row.goal_id,
      title: row.title,
      kind: row.kind,
      start_value: Number(row.start_value),
      current_value: Number(row.current_value),
      target_value: Number(row.target_value),
      unit: row.unit,
      position: row.position,
      milestones: msByKr.get(row.id) ?? [],
    };
    krsByGoal.set(kr.goal_id, [...(krsByGoal.get(kr.goal_id) ?? []), kr]);
  }
  return (goals as Omit<Goal, "key_results">[]).map((g) => ({
    ...g,
    key_results: krsByGoal.get(g.id) ?? [],
  }));
}

/** Store the rolled-up progress on the goal row so the home page and briefing stay in sync. */
async function recompute(goalId: number) {
  const goal = (await getGoals()).find((g) => g.id === goalId);
  if (!goal || goal.key_results.length === 0) return;
  const progress = goalProgress(goal);
  const status = goal.status === "paused" ? "paused" : progress >= 100 ? "completed" : "active";
  await getDb()`UPDATE goals SET progress = ${progress}, status = ${status}, updated_at = now() WHERE id = ${goalId}`;
}

async function done(goalId?: number): Promise<Goal[]> {
  if (goalId !== undefined) await recompute(goalId);
  revalidatePath("/goals");
  revalidatePath("/");
  return getGoals();
}

async function goalIdForKr(krId: number): Promise<number> {
  const [row] = await getDb()`SELECT goal_id FROM key_results WHERE id = ${krId}`;
  return row.goal_id;
}

// ── Goals ──────────────────────────────────────────────────────────────────────

export async function createGoal(data: {
  title: string;
  description?: string;
  target_date?: string;
  quarter?: string;
}): Promise<Goal[]> {
  await ensureSchema();
  await getDb()`
    INSERT INTO goals (title, description, target_date, quarter)
    VALUES (${data.title}, ${data.description ?? null}, ${data.target_date ?? null}, ${data.quarter ?? currentQuarter()})
  `;
  return done();
}

export async function renameGoal(id: number, title: string): Promise<Goal[]> {
  await getDb()`UPDATE goals SET title = ${title}, updated_at = now() WHERE id = ${id}`;
  return done();
}

export async function updateGoalProgress(id: number, progress: number): Promise<Goal[]> {
  const status = progress >= 100 ? "completed" : "active";
  await getDb()`
    UPDATE goals SET progress = ${progress}, status = ${status}, updated_at = now()
    WHERE id = ${id}
  `;
  return done();
}

export async function deleteGoal(id: number): Promise<Goal[]> {
  await getDb()`DELETE FROM goals WHERE id = ${id}`;
  return done();
}

/**
 * Copy an unfinished goal into the next quarter. Number key results pick up
 * where they left off; checklists carry over only their unfinished milestones.
 */
export async function rolloverGoal(id: number): Promise<Goal[]> {
  await ensureSchema();
  const sql = getDb();
  const existing = await sql`SELECT id FROM goals WHERE rolled_from = ${id}`;
  if (existing.length > 0) return getGoals();

  const goal = (await getGoals()).find((g) => g.id === id);
  if (!goal) return getGoals();

  const [created] = await sql`
    INSERT INTO goals (title, description, quarter, rolled_from, progress)
    VALUES (${goal.title}, ${goal.description}, ${shiftQuarter(goal.quarter, 1)}, ${goal.id},
      ${goal.key_results.length === 0 ? goal.progress : 0})
    RETURNING id
  `;
  for (const kr of goal.key_results) {
    const [newKr] = await sql`
      INSERT INTO key_results (goal_id, title, kind, start_value, current_value, target_value, unit, position)
      VALUES (${created.id}, ${kr.title}, ${kr.kind}, ${kr.current_value}, ${kr.current_value},
        ${kr.target_value}, ${kr.unit}, ${kr.position})
      RETURNING id
    `;
    for (const m of kr.milestones.filter((m) => !m.done)) {
      await sql`
        INSERT INTO milestones (key_result_id, title, position)
        VALUES (${newKr.id}, ${m.title}, ${m.position})
      `;
    }
  }
  return done(created.id);
}

// ── Key results ────────────────────────────────────────────────────────────────

export async function createKeyResult(
  goalId: number,
  data: { title: string; kind: "number" | "checklist"; start_value?: number; target_value?: number; unit?: string }
): Promise<Goal[]> {
  const start = data.start_value ?? 0;
  await getDb()`
    INSERT INTO key_results (goal_id, title, kind, start_value, current_value, target_value, unit, position)
    VALUES (${goalId}, ${data.title}, ${data.kind}, ${start}, ${start}, ${data.target_value ?? 100},
      ${data.unit ?? null}, (SELECT COALESCE(MAX(position), -1) + 1 FROM key_results WHERE goal_id = ${goalId}))
  `;
  return done(goalId);
}

export async function updateKeyResult(
  id: number,
  data: { title?: string; current_value?: number; target_value?: number }
): Promise<Goal[]> {
  await getDb()`
    UPDATE key_results SET
      title = COALESCE(${data.title ?? null}, title),
      current_value = COALESCE(${data.current_value ?? null}, current_value),
      target_value = COALESCE(${data.target_value ?? null}, target_value)
    WHERE id = ${id}
  `;
  return done(await goalIdForKr(id));
}

export async function deleteKeyResult(id: number): Promise<Goal[]> {
  const goalId = await goalIdForKr(id);
  await getDb()`DELETE FROM key_results WHERE id = ${id}`;
  return done(goalId);
}

// ── Milestones ─────────────────────────────────────────────────────────────────

export async function createMilestone(krId: number, data: { title: string; week: number | null }): Promise<Goal[]> {
  await getDb()`
    INSERT INTO milestones (key_result_id, title, week, position)
    VALUES (${krId}, ${data.title}, ${data.week},
      (SELECT COALESCE(MAX(position), -1) + 1 FROM milestones WHERE key_result_id = ${krId}))
  `;
  return done(await goalIdForKr(krId));
}

export async function toggleMilestone(id: number, isDone: boolean): Promise<Goal[]> {
  const [row] = await getDb()`UPDATE milestones SET done = ${isDone} WHERE id = ${id} RETURNING key_result_id`;
  return done(await goalIdForKr(row.key_result_id));
}

export async function deleteMilestone(id: number): Promise<Goal[]> {
  const [row] = await getDb()`DELETE FROM milestones WHERE id = ${id} RETURNING key_result_id`;
  return done(await goalIdForKr(row.key_result_id));
}
