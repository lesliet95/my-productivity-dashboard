export type Milestone = {
  id: number;
  key_result_id: number;
  title: string;
  week: number | null;
  done: boolean;
  position: number;
};

export type KeyResult = {
  id: number;
  goal_id: number;
  title: string;
  kind: "number" | "checklist";
  start_value: number;
  current_value: number;
  target_value: number;
  unit: string | null;
  position: number;
  milestones: Milestone[];
};

export type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_date: string | null;
  progress: number;
  status: "active" | "completed" | "paused";
  quarter: string;
  rolled_from: number | null;
  /** Quarter this goal was rolled over into, if any. */
  rolled_to: string | null;
  created_at: string;
  updated_at: string;
  key_results: KeyResult[];
};

/** 0–100 progress for one key result. */
export function keyResultProgress(kr: KeyResult): number {
  if (kr.kind === "checklist") {
    if (kr.milestones.length === 0) return 0;
    return Math.round((kr.milestones.filter((m) => m.done).length / kr.milestones.length) * 100);
  }
  const span = kr.target_value - kr.start_value;
  if (span === 0) return kr.current_value >= kr.target_value ? 100 : 0;
  const pct = ((kr.current_value - kr.start_value) / span) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)));
}

/** Goal progress is the average of its key results; manual progress when it has none. */
export function goalProgress(goal: Pick<Goal, "progress" | "key_results">): number {
  if (goal.key_results.length === 0) return goal.progress;
  const sum = goal.key_results.reduce((s, kr) => s + keyResultProgress(kr), 0);
  return Math.round(sum / goal.key_results.length);
}
