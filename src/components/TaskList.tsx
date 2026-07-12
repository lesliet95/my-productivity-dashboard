"use client";

import React, { useState, useTransition, createContext, useContext } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  toggleTask, deleteTask, createTask, updateTaskDescription, updateTaskCategory,
  updateTaskDueDate, updateTaskSubtasks, updateTaskPriority, updateTaskTitle,
  type Task, type Subtask,
} from "@/lib/actions/tasks";
import { TASK_CATEGORIES, CATEGORY_STYLES, type TaskCategory } from "@/lib/taskCategories";
import { Plus, Trash2, ChevronDown, Calendar, LayoutGrid, ChevronLeft, ChevronRight, Check, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

const AvailableCategoriesCtx = createContext<TaskCategory[]>(TASK_CATEGORIES);
const useAvailableCategories = () => useContext(AvailableCategoriesCtx);

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PRIORITY_STYLES: Record<"high" | "medium" | "low", string> = {
  high:   "bg-red-100 text-red-600 hover:bg-red-200",
  medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  low:    "bg-gray-100 text-gray-500 hover:bg-gray-200",
};

function PrioritySelect({ taskId, priority, onChange }: {
  taskId: number;
  priority: "low" | "medium" | "high";
  onChange: (id: number, priority: "low" | "medium" | "high") => void;
}) {
  return (
    <select
      value={priority}
      onChange={(e) => onChange(taskId, e.target.value as "low" | "medium" | "high")}
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-medium capitalize cursor-pointer focus:outline-none border border-transparent focus:ring-1 focus:ring-indigo-300 transition-colors appearance-none",
        PRIORITY_STYLES[priority]
      )}
    >
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>
  );
}

const COL_ACCENT: Record<TaskCategory | "Uncategorized", { header: string; label: string; dot: string }> = {
  "Home":          { header: "bg-blue-50",   label: "text-blue-700",   dot: "bg-blue-400" },
  "Finances":      { header: "bg-green-50",  label: "text-green-700",  dot: "bg-green-400" },
  "Music Lovers":  { header: "bg-purple-50", label: "text-purple-700", dot: "bg-purple-400" },
  "Food":          { header: "bg-orange-50", label: "text-orange-700", dot: "bg-orange-400" },
  "Self Care":     { header: "bg-pink-50",   label: "text-pink-700",   dot: "bg-pink-400" },
  "Admin":         { header: "bg-slate-50",  label: "text-slate-700",  dot: "bg-slate-400" },
  "Uncategorized": { header: "bg-gray-50",   label: "text-gray-600",   dot: "bg-gray-400" },
};

// ── Subtask components ─────────────────────────────────────────────────────────

function SubtaskRow({ subtask, onToggle, onDelete, onEdit }: {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  function handleBlur() {
    const val = draftRef.current.trim();
    if (val && val !== subtask.title) onEdit(val);
    else setDraft(subtask.title);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-1.5 group/sub py-0.5">
      <button
        onClick={onToggle}
        className={cn(
          "w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors",
          subtask.completed ? "bg-indigo-500 border-indigo-500 text-white" : "border-gray-300 hover:border-indigo-400"
        )}
      >
        {subtask.completed && <Check size={9} />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === "Enter") { e.currentTarget.blur(); } if (e.key === "Escape") { setDraft(subtask.title); setEditing(false); } }}
          className="flex-1 text-[11px] bg-white border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn("flex-1 text-[11px] cursor-pointer hover:text-indigo-600 transition-colors", subtask.completed ? "line-through text-gray-400" : "text-gray-600")}
        >
          {subtask.title}
        </span>
      )}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0"
      >
        <Trash2 size={10} />
      </button>
    </div>
  );
}

function SubtaskList({ taskId, subtasks, onUpdate }: {
  taskId: number;
  subtasks: Subtask[];
  onUpdate: (id: number, subtasks: Subtask[]) => void;
}) {
  const [, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");

  function save(next: Subtask[]) {
    onUpdate(taskId, next);
    startTransition(async () => { await updateTaskSubtasks(taskId, next); });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const next = [...subtasks, { id: `s${Date.now()}`, title: newTitle.trim(), completed: false }];
    save(next);
    setNewTitle("");
  }

  return (
    <div className="space-y-0.5 mt-1">
      {subtasks.map((s) => (
        <SubtaskRow
          key={s.id}
          subtask={s}
          onToggle={() => save(subtasks.map((x) => x.id === s.id ? { ...x, completed: !x.completed } : x))}
          onDelete={() => save(subtasks.filter((x) => x.id !== s.id))}
          onEdit={(title) => save(subtasks.map((x) => x.id === s.id ? { ...x, title } : x))}
        />
      ))}
      <form onSubmit={handleAdd} className="flex items-center gap-1 pt-0.5">
        <Plus size={10} className="text-gray-300 shrink-0" />
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add subtask…"
          className="flex-1 text-[11px] text-gray-500 bg-transparent placeholder-gray-300 focus:outline-none"
        />
        {newTitle.trim() && (
          <button type="submit" className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium">Add</button>
        )}
      </form>
    </div>
  );
}

// ── Editable due date ──────────────────────────────────────────────────────────

function EditableDueDate({ taskId, dueDate, onSave, isOverdue }: {
  taskId: number;
  dueDate: string | null;
  onSave: (id: number, date: string | null) => void;
  isOverdue?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value || null;
    onSave(taskId, val);
    startTransition(async () => { await updateTaskDueDate(taskId, val); });
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={dueDate ?? ""}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        className="text-xs border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={cn(
        "text-xs flex items-center gap-1 hover:underline transition-colors",
        isOverdue ? "text-red-500 font-medium" : dueDate ? "text-gray-400" : "text-gray-300 hover:text-gray-500"
      )}
    >
      <Calendar size={11} />
      {dueDate ? formatDate(dueDate) : "Set date"}
    </button>
  );
}

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
      category, subtasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
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

function ColumnTaskCard({ task, onToggle, onDelete, onDescriptionSave, onCategoryChange, onDueDateSave, onSubtasksUpdate, onPriorityChange, onTitleSave }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
  onDueDateSave: (id: number, date: string | null) => void;
  onSubtasksUpdate: (id: number, subtasks: Subtask[]) => void;
  onPriorityChange: (id: number, priority: "low" | "medium" | "high") => void;
  onTitleSave: (id: number, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const titleDraftRef = React.useRef(titleDraft);
  titleDraftRef.current = titleDraft;
  const availableCategories = useAvailableCategories();
  const [draft, setDraft] = useState(task.description ?? "");
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const subtasksDone = task.subtasks.filter((s) => s.completed).length;
  const subtasksTotal = task.subtasks.length;

  function handleTitleBlur() {
    const val = titleDraftRef.current.trim();
    if (val && val !== task.title) onTitleSave(task.id, val);
    else setTitleDraft(task.title);
    setEditingTitle(false);
  }

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
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitleDraft(task.title); setEditingTitle(false); } }}
              className="w-full text-xs font-medium text-gray-800 bg-white border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
          ) : (
            <button
              onClick={() => setExpanded((v) => !v)}
              onDoubleClick={() => setEditingTitle(true)}
              title="Double-click to edit"
              className="text-xs font-medium text-gray-800 leading-snug text-left w-full hover:text-indigo-600 transition-colors"
            >
              {task.title}
            </button>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <EditableDueDate taskId={task.id} dueDate={task.due_date} onSave={onDueDateSave} />
            {subtasksTotal > 0 && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                subtasksDone === subtasksTotal ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
              )}>
                <ListChecks size={9} />{subtasksDone}/{subtasksTotal}
              </span>
            )}
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">Priority:</span>
              <PrioritySelect taskId={task.id} priority={task.priority} onChange={onPriorityChange} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">Category:</span>
              <select
                value={task.category ?? ""}
                onChange={(e) => onCategoryChange(task.id, (e.target.value as TaskCategory) || null)}
                className="text-[10px] text-gray-600 bg-white border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">Uncategorized</option>
                {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <SubtaskList taskId={task.id} subtasks={task.subtasks} onUpdate={onSubtasksUpdate} />
        </div>
      )}
    </div>
  );
}

function CategoryColumn({ category, tasks, onToggle, onDelete, onAdd, onDescriptionSave, onCategoryChange, onDueDateSave, onSubtasksUpdate, onPriorityChange, onTitleSave }: {
  category: TaskCategory | "Uncategorized";
  tasks: Task[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: (t: Task) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
  onDueDateSave: (id: number, date: string | null) => void;
  onSubtasksUpdate: (id: number, subtasks: Subtask[]) => void;
  onPriorityChange: (id: number, priority: "low" | "medium" | "high") => void;
  onTitleSave: (id: number, title: string) => void;
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
          <ColumnTaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete}
            onDescriptionSave={onDescriptionSave} onCategoryChange={onCategoryChange}
            onDueDateSave={onDueDateSave} onSubtasksUpdate={onSubtasksUpdate}
            onPriorityChange={onPriorityChange} onTitleSave={onTitleSave} />
        ))}
      </div>
      <InlineAddTask category={category === "Uncategorized" ? null : category} onAdd={onAdd} />
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function TableRow({ task, onToggle, onDelete, onDescriptionSave, onCategoryChange, onDueDateSave, onSubtasksUpdate, onPriorityChange, onTitleSave }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onDescriptionSave: (id: number, desc: string) => void;
  onCategoryChange: (id: number, category: TaskCategory | null) => void;
  onDueDateSave: (id: number, date: string | null) => void;
  onSubtasksUpdate: (id: number, subtasks: Subtask[]) => void;
  onPriorityChange: (id: number, priority: "low" | "medium" | "high") => void;
  onTitleSave: (id: number, title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const titleDraftRef = React.useRef(titleDraft);
  titleDraftRef.current = titleDraft;
  const availableCategories = useAvailableCategories();
  const [draft, setDraft] = useState(task.description ?? "");
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const isOverdue = !task.completed && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);
  const subtasksDone = task.subtasks.filter((s) => s.completed).length;
  const subtasksTotal = task.subtasks.length;

  function handleTitleBlur() {
    const val = titleDraftRef.current.trim();
    if (val && val !== task.title) onTitleSave(task.id, val);
    else setTitleDraft(task.title);
    setEditingTitle(false);
  }

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
            <button onClick={() => setExpanded((v) => !v)} className="text-gray-600 hover:text-indigo-500 shrink-0 transition-colors">
              <ChevronDown size={13} className={cn("transition-transform", expanded && "rotate-180")} />
            </button>
            <div className="flex items-center gap-1 flex-wrap">
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitleDraft(task.title); setEditingTitle(false); } }}
                  className="text-sm font-medium bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 min-w-[160px]"
                />
              ) : (
                <span
                  className={cn("text-sm font-medium cursor-pointer hover:text-indigo-600 transition-colors", task.completed && "line-through text-gray-400")}
                  onClick={() => setExpanded((v) => !v)}
                  onDoubleClick={() => setEditingTitle(true)}
                  title="Double-click to edit"
                >
                  {task.title}
                </span>
              )}
              {subtasksTotal > 0 && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  subtasksDone === subtasksTotal ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                )}>
                  <ListChecks size={9} />{subtasksDone}/{subtasksTotal}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-2.5 px-4 text-xs whitespace-nowrap">
          <EditableDueDate taskId={task.id} dueDate={task.due_date} onSave={onDueDateSave} isOverdue={!!isOverdue} />
        </td>
        <td className="py-2.5 px-4">
          <PrioritySelect taskId={task.id} priority={task.priority} onChange={onPriorityChange} />
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
            {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Subtasks</p>
                <SubtaskList taskId={task.id} subtasks={task.subtasks} onUpdate={onSubtasksUpdate} />
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
  const availableCategories = useAvailableCategories();
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
      subtasks: [],
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
          {availableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
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
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().slice(0, 10);

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

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const undated = tasks.filter((t) => !t.due_date && !t.completed);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400">{d}</div>
        ))}
      </div>
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

export default function TaskList({ initialTasks, partnerCategories }: { initialTasks: Task[]; partnerCategories?: TaskCategory[] }) {
  const availableCategories = partnerCategories ?? TASK_CATEGORIES;
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const [showAddRow, setShowAddRow] = useState(false);
  const { toast } = useToast();

  function handleToggle(id: number) {
    const task = tasks.find((t) => t.id === id);
    const completing = task && !task.completed;
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    if (completing) toast("Task completed ✓");
    startTransition(() => toggleTask(id));
  }

  function handleDelete(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast("Task deleted", "delete");
    startTransition(() => deleteTask(id));
  }

  function handleAdd(task: Task) {
    setTasks((prev) => [task, ...prev]);
    toast("Task added ✓");
  }

  function handleDescriptionSave(id: number, description: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, description: description || null } : t));
    startTransition(() => updateTaskDescription(id, description));
  }

  function handleCategoryChange(id: number, category: TaskCategory | null) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, category } : t));
    startTransition(() => updateTaskCategory(id, category));
  }

  function handleDueDateSave(id: number, due_date: string | null) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, due_date } : t));
  }

  function handleSubtasksUpdate(id: number, subtasks: Subtask[]) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, subtasks } : t));
  }

  function handlePriorityChange(id: number, priority: "low" | "medium" | "high") {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, priority } : t));
    toast(`Priority set to ${priority}`, "info");
    startTransition(() => updateTaskPriority(id, priority));
  }

  function handleTitleSave(id: number, title: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, title } : t));
    toast("Task updated ✓");
    startTransition(() => updateTaskTitle(id, title));
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

  const sharedProps = { onToggle: handleToggle, onDelete: handleDelete, onDescriptionSave: handleDescriptionSave, onCategoryChange: handleCategoryChange, onDueDateSave: handleDueDateSave, onSubtasksUpdate: handleSubtasksUpdate, onPriorityChange: handlePriorityChange, onTitleSave: handleTitleSave };

  return (
    <AvailableCategoriesCtx.Provider value={availableCategories}>
    <div className="space-y-8">
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
              {availableCategories.map((cat) => (
                <CategoryColumn key={cat} category={cat}
                  tasks={tasks.filter((t) => t.category === cat)}
                  onAdd={handleAdd} {...sharedProps} />
              ))}
            </div>
            {hasUncategorized && (
              <div className="mt-3 max-w-[220px]">
                <CategoryColumn category="Uncategorized"
                  tasks={tasks.filter((t) => !t.category)}
                  onAdd={handleAdd} {...sharedProps} />
              </div>
            )}
          </>
        ) : (
          <CalendarView tasks={tasks.filter((t) => !t.completed)} onToggle={handleToggle} />
        )}
      </div>

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
                tableTasks.map((t) => (
                  <TableRow key={t.id} task={t} {...sharedProps} />
                ))
              )}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 font-medium tracking-wide">
            COUNT {tableTasks.length}
          </div>
        </div>
      </div>
    </div>
    </AvailableCategoriesCtx.Provider>
  );
}
