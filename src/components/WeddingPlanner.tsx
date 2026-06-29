"use client";

import { useState, useTransition } from "react";
import { Check, Trash2, Plus, ListChecks, CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toggleWeddingTask, addWeddingTask, deleteWeddingTask,
} from "@/lib/actions/wedding";
import {
  WEDDING_CATEGORIES, WEDDING_CATEGORY_STYLES,
  type WeddingTask, type WeddingCategory,
} from "@/lib/types/wedding";

// ── Week-of schedule days ──────────────────────────────────────────────────────
const WEEK_DAYS = [
  { label: "Thursday", sublabel: "Aug 6", key: "thu" },
  { label: "Friday",   sublabel: "Aug 7", key: "fri" },
  { label: "Saturday", sublabel: "Aug 8 · Wedding Day 💍", key: "sat" },
];

// Tasks manually assigned to week-of days
const WEEK_DAY_TASKS: Record<string, string[]> = {
  thu: ["m1", "m4", "m5", "k3", "k4"],
  fri: ["m2", "m4", "m5"],
  sat: ["m6", "d1", "d2", "d3", "d4", "d5"],
};

// ── Inline add form ────────────────────────────────────────────────────────────
function AddTaskRow({
  category, onAdd,
}: {
  category: WeddingCategory;
  onAdd: (t: WeddingTask) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!title.trim()) return;
    const optimistic: WeddingTask = {
      id: `tmp-${Date.now()}`, title: title.trim(), completed: false, category,
    };
    onAdd(optimistic);
    setTitle("");
    setOpen(false);
    startTransition(async () => { await addWeddingTask({ title: optimistic.title, completed: false, category }); });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-b-xl"
      >
        <Plus size={11} /> New task
      </button>
    );
  }

  return (
    <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Task name…"
        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
      />
      <button onClick={handleAdd} className="text-xs bg-rose-500 text-white px-2 py-1 rounded-lg hover:bg-rose-600">Add</button>
      <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
    </div>
  );
}

// ── Single task row ────────────────────────────────────────────────────────────
function TaskRow({
  task, onToggle, onDelete, showTime,
}: {
  task: WeddingTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showTime?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-start gap-2 px-3 py-2 group hover:bg-gray-50 rounded-lg transition-colors",
      task.completed && "opacity-50",
    )}>
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          task.completed
            ? "bg-rose-500 border-rose-500 text-white"
            : "border-gray-300 hover:border-rose-400",
        )}
      >
        {task.completed && <Check size={10} strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        {showTime && task.time && (
          <div className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold mb-0.5">
            <Clock size={9} /> {task.time}
          </div>
        )}
        <span className={cn("text-xs leading-snug", task.completed && "line-through text-gray-400")}>
          {task.title}
        </span>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

// ── Category column ────────────────────────────────────────────────────────────
function CategoryColumn({
  category, tasks, onToggle, onDelete, onAdd,
}: {
  category: WeddingCategory;
  tasks: WeddingTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (t: WeddingTask) => void;
}) {
  const style = WEDDING_CATEGORY_STYLES[category];
  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-gray-100", style.header)}>
        <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", style.dot)} />
        <span className={cn("text-sm font-semibold truncate", style.label)}>{category}</span>
        <span className="ml-auto text-xs text-gray-400 font-medium">{done}/{total}</span>
      </div>
      <div className="flex-1 p-1 space-y-0.5 min-h-[72px]">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </div>
      <AddTaskRow category={category} onAdd={onAdd} />
    </div>
  );
}

// ── Schedule view ──────────────────────────────────────────────────────────────
function ScheduleView({
  tasks, onToggle, onDelete,
}: {
  tasks: WeddingTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]));

  return (
    <div className="space-y-4">
      {/* Week-of day columns */}
      <div className="grid grid-cols-3 gap-4">
        {WEEK_DAYS.map(({ label, sublabel, key }) => {
          const dayTaskIds = WEEK_DAY_TASKS[key] ?? [];
          const dayTasks = dayTaskIds
            .map((id) => taskById[id])
            .filter(Boolean) as WeddingTask[];
          const isSat = key === "sat";

          return (
            <div key={key} className={cn(
              "border rounded-xl overflow-hidden bg-white",
              isSat ? "border-rose-300" : "border-gray-200",
            )}>
              <div className={cn(
                "px-4 py-3 border-b",
                isSat ? "bg-rose-50 border-rose-200" : "bg-gray-50 border-gray-100",
              )}>
                <p className={cn("text-sm font-bold", isSat ? "text-rose-700" : "text-gray-700")}>{label}</p>
                <p className={cn("text-[11px]", isSat ? "text-rose-500" : "text-gray-400")}>{sublabel}</p>
              </div>
              <div className="p-2 space-y-0.5 min-h-[120px]">
                {dayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} showTime={isSat} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week-of checklist */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Week-of To-Do</h3>
        <div className="grid grid-cols-2 gap-3">
          {tasks.filter((t) => t.category === "Week of").map((task) => (
            <div key={task.id} className="bg-white border border-gray-200 rounded-xl px-1 py-1">
              <TaskRow task={task} onToggle={onToggle} onDelete={onDelete} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function WeddingPlanner({ initialTasks }: { initialTasks: WeddingTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"checklist" | "schedule">("checklist");
  const [, startTransition] = useTransition();

  function handleToggle(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    startTransition(() => toggleWeddingTask(id));
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteWeddingTask(id));
  }

  function handleAdd(task: WeddingTask) {
    setTasks((prev) => [...prev, task]);
  }

  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-rose-600">{pct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">{done} of {total} tasks complete</p>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          {view === "checklist" ? "By Category" : "Week Schedule"}
        </h2>
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
          <button
            onClick={() => setView("checklist")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
              view === "checklist" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
            )}
          >
            <ListChecks size={12} /> Checklist
          </button>
          <button
            onClick={() => setView("schedule")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
              view === "schedule" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700",
            )}
          >
            <CalendarDays size={12} /> Schedule
          </button>
        </div>
      </div>

      {view === "checklist" ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {WEDDING_CATEGORIES.map((cat) => (
            <CategoryColumn
              key={cat}
              category={cat}
              tasks={tasks.filter((t) => t.category === cat)}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))}
        </div>
      ) : (
        <ScheduleView tasks={tasks} onToggle={handleToggle} onDelete={handleDelete} />
      )}
    </div>
  );
}
