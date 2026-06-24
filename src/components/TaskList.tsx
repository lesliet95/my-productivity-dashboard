"use client";

import { useState, useTransition } from "react";
import { toggleTask, deleteTask, createTask, type Task, type TaskCategory } from "@/lib/actions/tasks";
import { TASK_CATEGORIES, CATEGORY_STYLES } from "@/lib/taskCategories";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "completed";

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");

  const filtered = tasks
    .filter((t) => {
      if (statusFilter === "pending") return !t.completed;
      if (statusFilter === "completed") return t.completed;
      return true;
    })
    .filter((t) => {
      if (categoryFilter === "all") return true;
      return t.category === categoryFilter;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pMap = { high: 0, medium: 1, low: 2 };
      return (pMap[a.priority] ?? 1) - (pMap[b.priority] ?? 1);
    });

  function handleToggle(id: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    startTransition(() => toggleTask(id));
  }

  function handleDelete(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteTask(id));
  }

  return (
    <div>
      {/* Status filter */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["all", "pending", "completed"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
                statusFilter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            categoryFilter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              categoryFilter === cat
                ? "bg-gray-900 text-white"
                : cn(CATEGORY_STYLES[cat].pill, "hover:opacity-80")
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <AddTaskForm
          onClose={() => setShowForm(false)}
          onAdd={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No tasks found</p>
          <p className="text-sm mt-1">
            {tasks.length === 0 ? 'Click "Add Task" to get started.' : "Try a different filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => (
            <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: (id: number) => void; onDelete: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const isOverdue = !task.completed && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());

  const categoryStyle = task.category ? CATEGORY_STYLES[task.category] : null;

  return (
    <li className={cn(
      "bg-white border border-gray-200 rounded-lg border-l-4 transition-all",
      categoryStyle ? categoryStyle.border : task.priority === "high" ? "border-l-red-400" : task.priority === "medium" ? "border-l-yellow-400" : "border-l-gray-300"
    )}>
      <div className="flex items-center gap-3 p-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer shrink-0"
        />
        <div className="flex-1 min-w-0">
          <span className={cn("text-sm font-medium", task.completed && "line-through text-gray-400")}>
            {task.title}
          </span>
          {task.due_date && (
            <span className={cn("ml-2 text-xs", isOverdue ? "text-red-500 font-medium" : "text-gray-400")}>
              {isOverdue ? "Overdue · " : ""}{formatDate(task.due_date)}
            </span>
          )}
        </div>
        {task.category && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", CATEGORY_STYLES[task.category].pill)}>
            {task.category}
          </span>
        )}
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0",
          task.priority === "high" && "bg-red-100 text-red-600",
          task.priority === "medium" && "bg-yellow-100 text-yellow-600",
          task.priority === "low" && "bg-gray-100 text-gray-500"
        )}>
          {task.priority}
        </span>
        {task.description && (
          <button onClick={() => setExpanded((e) => !e)} className="text-gray-400 hover:text-gray-600">
            <ChevronDown size={16} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
        )}
        <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
      {expanded && task.description && (
        <div className="px-4 pb-3 text-sm text-gray-500 border-t border-gray-100 pt-2 ml-7">
          {task.description}
        </div>
      )}
    </li>
  );
}

function AddTaskForm({ onClose, onAdd }: { onClose: () => void; onAdd: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<TaskCategory | "">("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      category: category || undefined,
    });
    const optimistic: Task = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || null,
      completed: false,
      priority: priority as Task["priority"],
      due_date: dueDate || null,
      category: (category || null) as Task["category"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onAdd(optimistic);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New Task</h3>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />

      {/* Category picker */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1.5">Category</p>
        <div className="flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              category === "" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            None
          </button>
          {TASK_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all",
                category === cat
                  ? cn(CATEGORY_STYLES[cat].pill, "ring-2 ring-offset-1 ring-current")
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Task"}
        </button>
      </div>
    </form>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
