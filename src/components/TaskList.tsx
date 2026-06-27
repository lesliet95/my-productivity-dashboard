"use client";

import React, { useState, useTransition } from "react";
import { toggleTask, deleteTask, createTask, updateTaskDescription, updateTaskCategory, type Task } from "@/lib/actions/tasks";
import { TASK_CATEGORIES, CATEGORY_STYLES, type TaskCategory } from "@/lib/taskCategories";
import { Plus, Trash2, ChevronDown, Calendar, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PRIORITY_STYLES = {
  high:   "bg-red-100 text-red-600",
  medium: "bg-yellow-100 text-yellow-700",
  low:    "bg-gray-100 text-gray-500",
};

const COL_ACCENT: Record<TaskCategory | "Uncategorized", { header: string; label: string; dot: string }> = {
  "Home":          { header: "bg-blue-50",   label: "text-blue-700",   dot: "bg-blue-400" },
  "Finances":      { header: "bg-green-50",  label: "text-green-700",  dot: "bg-green-400" },
  "Music Lovers":  { header: "bg-purple-50", label: "text-purple-700", dot: "bg-purple-400" },
  "Food":          { header: "bg-orange-50", label: "text-orange-700", dot: "bg-orange-400" },
  "Self Care":     { header: "bg-pink-50",   label: "text-pink-700",   dot: "bg-pink-400" },
  "Uncategorized": { header: "bg-gray-50",   label: "text-gray-600",   dot: "bg-gray-400" },
};

// ── Inline add form inside a column ───────────────────────────────────────────

function InlineAddTask({ category, onAdd }: { category: TaskCategory | null; onAdd: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title: title.trim(), priority, due_date: dueDate || undefined, category: category ?? undefined });
    } catch { setLoading(false); return; }
    onAdd({
      id: Date.now(), title: title.trim(), description: null,
      completed: false, priority, due_date: dueDate || null,
      category, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    setTitle(""); setDueDate(""); setPriority("medium"); setOpen(false); setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-b-xl transition-colors"
      >
        <Plus size={12} /> New task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 space-y-2">
      <input
        autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…" required
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <div className="flex gap-2">
        <select value={priority} onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-500 px-2 py-1">Cancel</button>
        <button type="submit" disabled={loading || !title.trim()}
          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {loading ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  );
}

// ── Category column card ───────────────────────────────────────────────────────

function ColumnTaskCard({ task, onToggle, onDelete, onDescriptionSave, onCategoryChange }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(task.description ?? "");
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  function handleBlur() {
    if (draftRef.current !== (task.description ?? "")) {
      onDescriptionSave(task.id, draftRef.current);
    }
  }

  return (
    <div className="rounded-lg hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-all">
      <div className="flex items-start gap-2 px-2 py-1.5">
        <input type="checkbox" checked={false} onChange={() => onToggle(task.id)}
          className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-indigo-600 cursor-pointer" />
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-gray-800 leading-snug text-left w-full hover:text-indigo-600 transition-colors"
          >
            {task.title}
          </button>
          {task.due_date && <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(task.due_date)}</p>}
        </div>
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5">
          <Trash2 size={11} />
        </button>
      </div>
      {expanded && (
        <div className="px-2 pb-2 ml-5 space-y-1.5">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            placeholder="Add a description…"
            rows={2}
            className="w-full text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder-gray-300"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">Category:</span>
            <select
              value={task.category ?? ""}
              onChange={(e) => onCategoryChange(task.id, (e.target.value as TaskCategory) || null)}
              className="text-[10px] text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">Uncategorized</option>
              {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryColumn({ category, tasks, onToggle, onDelete, onAdd, onDescriptionSave, onCategoryChange }: {
  category: TaskCategory | "Uncategorized";
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (t: Task) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
}) {
  const accent = COL_ACCENT[category];
  const pending = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b border-gray-100", accent.header)}>
        <span className={cn("w-2.5 h-2.5 rounded-sm shrink-0", accent.dot)} />
        <span className={cn("text-sm font-semibold truncate", accent.label)}>{category}</span>
        <span className="ml-auto text-xs text-gray-400 font-medium">{pending}</span>
      </div>
      <div className="flex-1 p-2 space-y-1 min-h-[72px]">
        {tasks.filter((t) => !t.completed).map((task) => (
          <ColumnTaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onDescriptionSave={onDescriptionSave} onCategoryChange={onCategoryChange} />
        ))}
      </div>
      <InlineAddTask category={category === "Uncategorized" ? null : category} onAdd={onAdd} />
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function TableRow({ task, onToggle, onDelete, onDescriptionSave, onCategoryChange }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(task.description ?? "");
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const isOverdue = !task.completed && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

  function handleDescBlur() {
    if (draftRef.current !== (task.description ?? "")) {
      onDescriptionSave(task.id, draftRef.current);
    }
  }

  return (
    <>
      <tr className={cn("group border-b border-gray-100 hover:bg-gray-50 transition-colors", task.completed && "opacity-50")}>
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-indigo-500 shrink-0 transition-colors">
              <ChevronDown size={13} className={cn("transition-transform", expanded && "rotate-180")} />
            </button>
            <span className={cn("text-sm font-medium cursor-pointer hover:text-indigo-600 transition-colors", task.completed && "line-through text-gray-400")}
              onClick={() => setExpanded((v) => !v)}>
              {task.title}
            </span>
          </div>
        </td>
        <td className="py-2.5 px-4 text-xs whitespace-nowrap">
          {task.due_date ? (
            <span className={cn("flex items-center gap-1", isOverdue ? "text-red-500 font-medium" : "text-gray-400")}>
              <Calendar size={11} />{formatDate(task.due_date)}
            </span>
          ) : <span className="text-gray-300">—</span>}
        </td>
        <td className="py-2.5 px-4">
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </span>
        </td>
        <td className="py-2.5 px-4">
          <select
            value={task.category ?? ""}
            onChange={(e) => onCategoryChange(task.id, (e.target.value as TaskCategory) || null)}
            className={cn(
              "text-xs px-2 py-1 rounded-full font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-300 border border-transparent hover:border-gray-300 transition-colors",
              task.category ? CATEGORY_STYLES[task.category].pill : "text-gray-400 bg-gray-100"
            )}
          >
            <option value="">Uncategorized</option>
            {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td className="py-2.5 px-4 text-center">
          <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer" />
        </td>
        <td className="py-2.5 pr-4 text-right">
          <button onClick={() => onDelete(task.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
            <Trash2 size={13} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={6} className="px-10 py-2">
            <div className="space-y-2">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description…"
                rows={2}
                className="w-full text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-300"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Category:</span>
                <select
                  value={task.category ?? ""}
                  onChange={(e) => onCategoryChange(task.id, (e.target.value as TaskCategory) || null)}
                  className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="">Uncategorized</option>
                  {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Add row inside table ───────────────────────────────────────────────────────

function AddTableRow({ onAdd, onCancel }: { onAdd: (t: Task) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title: title.trim(), priority, due_date: dueDate || undefined, category: category || undefined });
    } catch { setLoading(false); return; }
    onAdd({
      id: Date.now(), title: title.trim(), description: null,
      completed: false, priority, due_date: dueDate || null,
      category: (category || null) as Task["category"],
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
  }

  return (
    <tr className="border-b border-indigo-100 bg-indigo-50">
      <td className="py-2 px-4">
        <form id="add-row-form" onSubmit={handleSubmit}>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Task name…" required
            className="w-full text-sm bg-white border border-indigo-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </form>
      </td>
      <td className="py-2 px-4">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none w-full" />
      </td>
      <td className="py-2 px-4">
        <select value={priority} onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none w-full">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </td>
      <td className="py-2 px-4">
        <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory | "")}
          className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none w-full">
          <option value="">None</option>
          {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="py-2 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button type="submit" form="add-row-form" disabled={loading || !title.trim()}
            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "…" : "Add"}
          </button>
          <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700 px-1">✕</button>
        </div>
      </td>
      <td />
    </tr>
  );
}

// ── Calendar view ─────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarView({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: number) => void }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().slice(0, 10);

  // Map tasks by due date key
  const tasksByDate: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!t.due_date) continue;
    if (!tasksByDate[t.due_date]) tasksByDate[t.due_date] = [];
    tasksByDate[t.due_date].push(t);
  }

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build grid cells: nulls for padding + day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Tasks with no due date
  const undated = tasks.filter((t) => !t.due_date && !t.completed);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="min-h-[90px] bg-gray-50/50" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;

          return (
            <div key={dateStr} className={cn("min-h-[90px] p-1.5 flex flex-col", isPast && !isToday && "bg-gray-50/40")}>
              <span className={cn(
                "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 self-start",
                isToday ? "bg-indigo-600 text-white" : isPast ? "text-gray-300" : "text-gray-600"
              )}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 flex-1">
                {dayTasks.slice(0, 3).map((t) => {
                  const cat = t.category ? CATEGORY_STYLES[t.category] : null;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onToggle(t.id)}
                      title={t.title}
                      className={cn(
                        "text-left text-[10px] px-1.5 py-0.5 rounded truncate w-full leading-snug transition-opacity",
                        t.completed ? "opacity-40 line-through" : "",
                        cat ? cat.pill : "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {t.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Undated tasks */}
      {undated.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 mb-2">No due date</p>
          <div className="flex flex-wrap gap-1.5">
            {undated.map((t) => {
              const cat = t.category ? CATEGORY_STYLES[t.category] : null;
              return (
                <span key={t.id} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cat ? cat.pill : "bg-gray-100 text-gray-500")}>
                  {t.title}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const [showAddRow, setShowAddRow] = useState(false);

  function handleToggle(id: number) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    startTransition(() => toggleTask(id));
  }

  function handleDelete(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteTask(id));
  }

  function handleAdd(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  function handleDescriptionSave(id: number, description: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, description: description || null } : t));
    startTransition(() => updateTaskDescription(id, description));
  }

  function handleCategoryChange(id: number, category: TaskCategory | null) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, category } : t));
    startTransition(() => updateTaskCategory(id, category));
  }

  const [tableFilter, setTableFilter] = useState<"all" | "pending" | "completed">("all");

  const tableTasks = tasks
    .filter((t) => tableFilter === "all" ? true : tableFilter === "pending" ? !t.completed : t.completed)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
    });

  const [topView, setTopView] = useState<"upcoming" | "calendar">("upcoming");
  const hasUncategorized = tasks.some((t) => !t.category);

  return (
    <div className="space-y-8">
      {/* Top section with view toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            {topView === "upcoming" ? "By Category" : "Calendar"}
          </h2>
          <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            <button
              onClick={() => setTopView("upcoming")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                topView === "upcoming" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
            >
              <LayoutGrid size={12} /> Upcoming
            </button>
            <button
              onClick={() => setTopView("calendar")}
              className={cn("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                topView === "calendar" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
            >
              <Calendar size={12} /> Calendar
            </button>
          </div>
        </div>

        {topView === "upcoming" ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {TASK_CATEGORIES.map((cat) => (
                <CategoryColumn key={cat} category={cat}
                  tasks={tasks.filter((t) => t.category === cat)}
                  onToggle={handleToggle} onDelete={handleDelete} onAdd={handleAdd} onDescriptionSave={handleDescriptionSave} onCategoryChange={handleCategoryChange} />
              ))}
            </div>
            {hasUncategorized && (
              <div className="mt-3 max-w-[220px]">
                <CategoryColumn category="Uncategorized"
                  tasks={tasks.filter((t) => !t.category)}
                  onToggle={handleToggle} onDelete={handleDelete} onAdd={handleAdd} onDescriptionSave={handleDescriptionSave} onCategoryChange={handleCategoryChange} />
              </div>
            )}
          </>
        ) : (
          <CalendarView tasks={tasks.filter((t) => !t.completed)} onToggle={handleToggle} />
        )}
      </div>

      {/* Full to-do table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">To-Do List</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
              {(["all", "pending", "completed"] as const).map((f) => (
                <button key={f} onClick={() => setTableFilter(f)}
                  className={cn("px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors",
                    tableFilter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddRow(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
              <Plus size={13} /> New
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Name</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Due Date</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Priority</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-center py-2.5 px-4 text-xs font-semibold text-gray-500">Completed</th>
                <th className="py-2.5 pr-4" />
              </tr>
            </thead>
            <tbody>
              {showAddRow && (
                <AddTableRow onAdd={(t) => { handleAdd(t); setShowAddRow(false); }} onCancel={() => setShowAddRow(false)} />
              )}
              {tableTasks.length === 0 && !showAddRow ? (
                <tr><td colSpan={6} className="text-center py-12 text-sm text-gray-400">No tasks — click New to add one</td></tr>
              ) : (
                tableTasks.map((t) => <TableRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onDescriptionSave={handleDescriptionSave} onCategoryChange={handleCategoryChange} />)
              )}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium tracking-wide">
            COUNT {tableTasks.length}
          </div>
        </div>
      </div>

    </div>
  );
}
