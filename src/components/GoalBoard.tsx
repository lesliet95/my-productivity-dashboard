"use client";

import { useState, useTransition } from "react";
import {
  createGoal, renameGoal, updateGoalProgress, deleteGoal, rolloverGoal,
  createKeyResult, updateKeyResult, deleteKeyResult,
  createMilestone, toggleMilestone, deleteMilestone,
} from "@/lib/actions/goals";
import { goalProgress, keyResultProgress, type Goal, type KeyResult } from "@/lib/types/goals";
import {
  currentQuarter, shiftQuarter, quarterLabel, quarterRange, quarterWeeks,
  weekOfQuarter, quarterElapsed, daysLeft,
} from "@/lib/quarters";
import {
  Trash2, Plus, ChevronLeft, ChevronRight, ChevronDown, Target, Square, CheckSquare, ArrowRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Run = (action: Promise<Goal[]>) => void;

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtValue(n: number, unit: string | null): string {
  if (!unit) return fmtNum(n);
  return unit === "$" ? `$${fmtNum(n)}` : `${fmtNum(n)} ${unit}`;
}

type StatusInfo = { label: string; className: string; ring: string };

function goalStatus(goal: Goal, progress: number, today: string): StatusInfo {
  if (progress >= 100) return { label: "Done", className: "bg-green-50 text-green-700", ring: "#16a34a" };
  if (goal.rolled_to) return { label: `Rolled to ${quarterLabel(goal.rolled_to)}`, className: "bg-gray-100 text-gray-500", ring: "#9ca3af" };
  if (goal.quarter < today) return { label: "Unfinished", className: "bg-orange-50 text-orange-700", ring: "#f97316" };
  if (goal.quarter > today) return { label: "Planned", className: "bg-gray-100 text-gray-500", ring: "#6366f1" };
  const expected = quarterElapsed(goal.quarter) * 100;
  return progress >= expected - 10
    ? { label: "On track", className: "bg-green-50 text-green-700", ring: "#16a34a" }
    : { label: "Behind", className: "bg-amber-50 text-amber-700", ring: "#d97706" };
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="shrink-0">
      <circle cx="23" cy="23" r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
      <circle
        cx="23" cy="23" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 23 23)"
        className="transition-all duration-500"
      />
      <text x="23" y="27" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{value}%</text>
    </svg>
  );
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 bg-gray-100 rounded-full overflow-hidden", className)}>
      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

function InlineText({ value, onSave, className }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (!editing) {
    return (
      <span onClick={() => { setDraft(value); setEditing(true); }} className={cn("cursor-text", className)} title="Click to edit">
        {value}
      </span>
    );
  }
  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
  };
  return (
    <input
      autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className={cn("w-full border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400", className)}
    />
  );
}

// ── Board ──────────────────────────────────────────────────────────────────────

export default function GoalBoard({ initialGoals }: { initialGoals: Goal[] }) {
  const today = currentQuarter();
  const [goals, setGoals] = useState(initialGoals);
  const [quarter, setQuarter] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const run: Run = (action) => startTransition(async () => setGoals(await action));

  const inQuarter = goals.filter((g) => g.quarter === quarter);
  const progresses = inQuarter.map(goalProgress);
  const avg = progresses.length ? Math.round(progresses.reduce((a, b) => a + b, 0) / progresses.length) : 0;
  const thisWeek = weekOfQuarter(quarter);
  const weekMilestones = inQuarter.flatMap((g) => g.key_results.flatMap((kr) => kr.milestones)).filter((m) => m.week === thisWeek);

  const prevQuarter = shiftQuarter(quarter, -1);
  const carryable = quarter === today
    ? goals.filter((g) => g.quarter === prevQuarter && !g.rolled_to && goalProgress(g) < 100)
    : [];

  return (
    <div className={cn(isPending && "opacity-80 transition-opacity")}>
      <QuarterHeader quarter={quarter} today={today} onShift={(d) => setQuarter(shiftQuarter(quarter, d))} onToday={() => setQuarter(today)} onAdd={() => setShowForm(true)} />
      <WeekStrip quarter={quarter} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Quarter progress" value={`${avg}%`} />
        <Stat label="Time elapsed" value={`${Math.round(quarterElapsed(quarter) * 100)}%`} />
        <Stat
          label={thisWeek ? `Week ${thisWeek} milestones` : "Milestones"}
          value={thisWeek
            ? `${weekMilestones.filter((m) => m.done).length} / ${weekMilestones.length}`
            : `${inQuarter.flatMap((g) => g.key_results.flatMap((kr) => kr.milestones)).filter((m) => m.done).length} done`}
        />
      </div>

      {carryable.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-indigo-900">
            {carryable.length} unfinished {carryable.length === 1 ? "goal" : "goals"} from {quarterLabel(prevQuarter)}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setQuarter(prevQuarter)} className="text-xs px-3 py-1.5 text-indigo-700 hover:underline">Review</button>
            <button
              onClick={() => run((async () => { let r = goals; for (const g of carryable) r = await rolloverGoal(g.id); return r; })())}
              className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Roll over all
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <AddGoalForm
          quarter={quarter}
          onClose={() => setShowForm(false)}
          onSubmit={(title, description) => { setShowForm(false); run(createGoal({ title, description, quarter })); }}
        />
      )}

      {inQuarter.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-lg">No objectives for {quarterLabel(quarter)}</p>
          <p className="text-sm mt-1">Pick 2–4 outcomes that would make this quarter a win.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-indigo-600 hover:underline">Add objective</button>
        </div>
      ) : (
        <div className="space-y-4">
          {inQuarter.map((goal) => (
            <ObjectiveCard key={goal.id} goal={goal} today={today} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuarterHeader({ quarter, today, onShift, onToday, onAdd }: {
  quarter: string; today: string; onShift: (d: number) => void; onToday: () => void; onAdd: () => void;
}) {
  const { start, end } = quarterRange(quarter);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sub = quarter === today
    ? `${daysLeft(quarter)} days left`
    : quarter < today ? "Past quarter" : "Upcoming";
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button onClick={() => onShift(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Previous quarter"><ChevronLeft size={18} /></button>
        <span className="text-lg font-semibold text-gray-900 w-24 text-center">{quarterLabel(quarter)}</span>
        <button onClick={() => onShift(1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" aria-label="Next quarter"><ChevronRight size={18} /></button>
        <span className="text-sm text-gray-500 ml-1">{fmt(start)} – {fmt(end)} · {sub}</span>
        {quarter !== today && (
          <button onClick={onToday} className="text-xs text-indigo-600 hover:underline ml-2">Back to {quarterLabel(today)}</button>
        )}
      </div>
      <button onClick={onAdd} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
        <Plus size={16} /> Add objective
      </button>
    </div>
  );
}

function WeekStrip({ quarter }: { quarter: string }) {
  const weeks = quarterWeeks(quarter);
  const now = weekOfQuarter(quarter);
  const past = quarter < currentQuarter();
  const { start } = quarterRange(quarter);
  const months = [0, 1, 2].map((i) => new Date(start.getFullYear(), start.getMonth() + i, 1).toLocaleDateString("en-US", { month: "short" }));
  return (
    <div className="mb-5">
      <div className="flex gap-1">
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => (
          <div
            key={w}
            title={`Week ${w}`}
            className={cn(
              "h-2 flex-1 rounded-sm",
              past || (now !== null && w < now) ? "bg-indigo-400"
                : w === now ? "bg-indigo-200 ring-2 ring-indigo-600 ring-offset-1"
                : "bg-gray-100"
            )}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
        {months.map((m) => <span key={m}>{m}</span>)}
        {now !== null && <span className="text-gray-500">Week {now} of {weeks}</span>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

// ── Objective ──────────────────────────────────────────────────────────────────

function ObjectiveCard({ goal, today, run }: { goal: Goal; today: string; run: Run }) {
  const progress = goalProgress(goal);
  const status = goalStatus(goal, progress, today);
  const [open, setOpen] = useState(goal.quarter >= today && progress < 100);
  const [addingKr, setAddingKr] = useState(false);
  const canRoll = !goal.rolled_to && progress < 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-3 px-5 py-4">
        <ProgressRing value={progress} color={status.ring} />
        <div className="flex-1 min-w-0">
          <InlineText value={goal.title} onSave={(t) => run(renameGoal(goal.id, t))} className="font-semibold text-gray-900 text-[15px]" />
          <p className="text-xs text-gray-500 mt-0.5">
            {goal.key_results.length} key {goal.key_results.length === 1 ? "result" : "results"}
            {goal.rolled_from && " · carried over"}
            {goal.description && ` · ${goal.description}`}
          </p>
        </div>
        <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium shrink-0", status.className)}>{status.label}</span>
        {canRoll && (
          <button
            onClick={() => run(rolloverGoal(goal.id))}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 shrink-0"
            title={`Copy unfinished work into ${quarterLabel(shiftQuarter(goal.quarter, 1))}`}
          >
            Roll over <ArrowRight size={12} />
          </button>
        )}
        <button onClick={() => { if (confirm(`Delete "${goal.title}"?`)) run(deleteGoal(goal.id)); }} className="text-gray-300 hover:text-red-400 transition-colors" aria-label="Delete objective">
          <Trash2 size={14} />
        </button>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600" aria-label={open ? "Collapse" : "Expand"}>
          <ChevronDown size={18} className={cn("transition-transform", !open && "-rotate-90")} />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 px-5 py-3">
          {goal.key_results.length === 0 && !addingKr && (
            <ManualProgress goal={goal} run={run} />
          )}
          <div className="space-y-1">
            {goal.key_results.map((kr) => (
              <KeyResultRow key={kr.id} kr={kr} quarter={goal.quarter} run={run} />
            ))}
          </div>
          {addingKr ? (
            <AddKeyResultForm
              onClose={() => setAddingKr(false)}
              onSubmit={(data) => { setAddingKr(false); run(createKeyResult(goal.id, data)); }}
            />
          ) : (
            <button onClick={() => setAddingKr(true)} className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
              <Plus size={12} /> Add key result
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ManualProgress({ goal, run }: { goal: Goal; run: Run }) {
  const [value, setValue] = useState(goal.progress);
  return (
    <div className="mb-2">
      <p className="text-xs text-gray-400 mb-2">Add key results to track progress automatically, or set it by hand:</p>
      <div className="flex items-center gap-3">
        <input type="range" min={0} max={100} value={value} onChange={(e) => setValue(Number(e.target.value))}
          onMouseUp={() => value !== goal.progress && run(updateGoalProgress(goal.id, value))}
          onTouchEnd={() => value !== goal.progress && run(updateGoalProgress(goal.id, value))}
          className="flex-1 accent-indigo-600" />
        <span className="text-xs font-medium text-gray-600 w-10 text-right">{value}%</span>
      </div>
    </div>
  );
}

// ── Key results ────────────────────────────────────────────────────────────────

function KeyResultRow({ kr, quarter, run }: { kr: KeyResult; quarter: string; run: Run }) {
  const pct = keyResultProgress(kr);
  const [editingValue, setEditingValue] = useState(false);
  const [draft, setDraft] = useState(String(kr.current_value));
  const [addingMs, setAddingMs] = useState(false);

  const commitValue = () => {
    setEditingValue(false);
    const n = Number(draft);
    if (draft.trim() !== "" && !Number.isNaN(n) && n !== kr.current_value) run(updateKeyResult(kr.id, { current_value: n }));
  };

  return (
    <div className="group py-1.5">
      <div className="flex items-center gap-3">
        <Target size={15} className="text-gray-400 shrink-0" />
        <div className="flex-1 min-w-0 text-sm text-gray-800">
          <InlineText value={kr.title} onSave={(t) => run(updateKeyResult(kr.id, { title: t }))} />
        </div>
        <Bar value={pct} className="w-36 shrink-0" />
        <div className="w-28 text-right text-xs text-gray-500 shrink-0">
          {kr.kind === "checklist" ? (
            <span>{kr.milestones.filter((m) => m.done).length} / {kr.milestones.length}</span>
          ) : editingValue ? (
            <input
              autoFocus type="number" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commitValue}
              onKeyDown={(e) => { if (e.key === "Enter") commitValue(); if (e.key === "Escape") setEditingValue(false); }}
              className="w-20 border border-indigo-300 rounded px-1.5 py-0.5 text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ) : (
            <button onClick={() => { setDraft(String(kr.current_value)); setEditingValue(true); }} className="hover:text-indigo-600" title="Update current value">
              {fmtValue(kr.current_value, kr.unit)} / {fmtValue(kr.target_value, kr.unit)}
            </button>
          )}
        </div>
        <button onClick={() => run(deleteKeyResult(kr.id))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity" aria-label="Delete key result">
          <X size={13} />
        </button>
      </div>

      <div className="ml-[7px] mt-1 pl-5 border-l border-gray-200 space-y-0.5">
        {kr.milestones.map((m) => (
          <div key={m.id} className="group/ms flex items-center gap-2 text-[13px] py-0.5">
            <button onClick={() => run(toggleMilestone(m.id, !m.done))} className={m.done ? "text-green-600" : "text-gray-400 hover:text-gray-600"} aria-label={m.done ? "Mark not done" : "Mark done"}>
              {m.done ? <CheckSquare size={14} /> : <Square size={14} />}
            </button>
            {m.week !== null && (
              <span className={cn("text-[11px] px-1.5 rounded", m.week === weekOfQuarter(quarter) ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500")}>
                Wk {m.week}
              </span>
            )}
            <span className={cn("flex-1", m.done ? "text-gray-400 line-through" : "text-gray-600")}>{m.title}</span>
            <button onClick={() => run(deleteMilestone(m.id))} className="opacity-0 group-hover/ms:opacity-100 text-gray-300 hover:text-red-400 transition-opacity" aria-label="Delete milestone">
              <X size={12} />
            </button>
          </div>
        ))}
        {addingMs ? (
          <AddMilestoneForm
            quarter={quarter}
            onClose={() => setAddingMs(false)}
            onSubmit={(title, week) => { run(createMilestone(kr.id, { title, week })); }}
          />
        ) : (
          <button onClick={() => setAddingMs(true)} className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-indigo-600 py-0.5">
            <Plus size={11} /> Milestone
          </button>
        )}
      </div>
    </div>
  );
}

// ── Forms ──────────────────────────────────────────────────────────────────────

function AddGoalForm({ quarter, onClose, onSubmit }: {
  quarter: string; onClose: () => void; onSubmit: (title: string, description?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSubmit(title.trim(), description.trim() || undefined); }}
      className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6"
    >
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New objective for {quarterLabel(quarter)}</h3>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Grow the business to $20K MRR" required
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why it matters (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Add objective</button>
      </div>
    </form>
  );
}

function AddKeyResultForm({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { title: string; kind: "number" | "checklist"; start_value?: number; target_value?: number; unit?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"number" | "checklist">("number");
  const [start, setStart] = useState("0");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("Enter a key result");
    if (kind === "number" && (target.trim() === "" || Number.isNaN(Number(target)))) return setError("Enter a target number");
    onSubmit(kind === "number"
      ? { title: title.trim(), kind, start_value: Number(start) || 0, target_value: Number(target), unit: unit.trim() || undefined }
      : { title: title.trim(), kind });
  }

  const field = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
  return (
    <form onSubmit={submit} className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
      <input autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Sign 5 new clients" className={cn(field, "w-full")} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          {(["number", "checklist"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={cn("px-3 py-1.5", kind === k ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50")}>
              {k === "number" ? "Measurable number" : "Checklist of milestones"}
            </button>
          ))}
        </div>
        {kind === "number" && (
          <>
            <label className="text-xs text-gray-500">From</label>
            <input value={start} onChange={(e) => setStart(e.target.value)} type="number" className={cn(field, "w-20")} />
            <label className="text-xs text-gray-500">to</label>
            <input value={target} onChange={(e) => { setTarget(e.target.value); setError(""); }} type="number" placeholder="5" className={cn(field, "w-20")} />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit ($, clients)" className={cn(field, "w-32")} />
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800">Cancel</button>
        <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">Add key result</button>
      </div>
    </form>
  );
}

function AddMilestoneForm({ quarter, onClose, onSubmit }: {
  quarter: string; onClose: () => void; onSubmit: (title: string, week: number | null) => void;
}) {
  const weeks = quarterWeeks(quarter);
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState<string>(String(weekOfQuarter(quarter) ?? ""));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), week ? Number(week) : null);
    setTitle(""); // stay open so several milestones can be added in a row
  }
  return (
    <form onSubmit={submit} className="flex items-center gap-2 py-1">
      <select value={week} onChange={(e) => setWeek(e.target.value)} className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option value="">No week</option>
        {Array.from({ length: weeks }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Wk {w}</option>)}
      </select>
      <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Book 5 discovery calls"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        className="flex-1 border border-gray-200 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      <button type="submit" className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Add</button>
      <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">Done</button>
    </form>
  );
}
