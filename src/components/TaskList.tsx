"use client";

import { useState, useTransition } from "react";
import { toggleTask, deleteTask, createTask, type Task } from "@/lib/actions/tasks";
import { TASK_CATEGORIES, CATEGORY_STYLES, type TaskCategory } from "@/lib/taskCategories";
import { Plus, Trash2, ChevronDown, Calendar } from "lucide-react";
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
        <Plus size={12} /> New page
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

function CategoryColumn({ category, tasks, onToggle, onDelete, onAdd }: {
  category: TaskCategory | "Uncategorized";
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (t: Task) => void;
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
          <div key={task.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group">
            <input type="checkbox" checked={false} onChange={() => onToggle(task.id)}
              className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-indigo-600 cursor-pointer" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 leading-snug">{task.title}</p>
              {task.due_date && <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(task.due_date)}</p>}
            </div>
            <button onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
      <InlineAddTask category={category === "Uncategorized" ? null : category} onAdd={onAdd} />
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────────

function TableRow({ task, onToggle, onDelete }: {
  task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = !task.completed && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

  return (
    <>
      <tr className={cn("group border-b border-gray-100 hover:bg-gray-50 transition-colors", task.completed && "opacity-50")}>
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2">
            {task.description && (
              <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <ChevronDown size={13} className={cn("transition-transform", expanded && "rotate-180")} />
              </button>
            )}
            <span className={cn("text-sm font-medium", task.completed && "line-through text-gray-400")}>{task.title}</span>
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
          {task.category
            ? <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_STYLES[task.category].pill)}>{task.category}</span>
            : <span className="text-gray-300 text-xs">—</span>}
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
      {expanded && task.description && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={6} className="px-10 py-2 text-xs text-gray-500">{task.description}</td>
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

// ── Root ───────────────────────────────────────────────────────────────────────

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const [showAddRow, setShowAddRow] = useState(false);
  const [tableFilter, setTableFilter] = useState<"all" | "pending" | "completed">("all");

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

  const tableTasks = tasks
    .filter((t) => tableFilter === "all" ? true : tableFilter === "pending" ? !t.completed : t.completed)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = { high: 0, medium: 1, low: 2 };
      return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
    });

  const hasUncategorized = tasks.some((t) => !t.category);

  return (
    <div className="space-y-8">
      {/* Category columns */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">By Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TASK_CATEGORIES.map((cat) => (
            <CategoryColumn key={cat} category={cat}
              tasks={tasks.filter((t) => t.category === cat)}
              onToggle={handleToggle} onDelete={handleDelete} onAdd={handleAdd} />
          ))}
        </div>
        {hasUncategorized && (
          <div className="mt-3 max-w-[220px]">
            <CategoryColumn category="Uncategorized"
              tasks={tasks.filter((t) => !t.category)}
              onToggle={handleToggle} onDelete={handleDelete} onAdd={handleAdd} />
          </div>
        )}
      </div>

      {/* Full table */}
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
                tableTasks.map((t) => <TableRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)
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
