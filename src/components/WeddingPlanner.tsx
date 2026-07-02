"use client";

import { useState, useTransition, useRef } from "react";
import { Check, Trash2, Plus, ListChecks, CalendarDays, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  toggleWeddingTask, addWeddingTask, deleteWeddingTask, updateWeddingTask, updateWeddingTaskFields,
  addSubtask, toggleSubtask, deleteSubtask, updateSubtask,
} from "@/lib/actions/wedding";
import {
  WEDDING_CATEGORIES, WEDDING_CATEGORY_STYLES,
  type WeddingTask, type WeddingSubtask, type WeddingCategory,
} from "@/lib/types/wedding";

const WEEK_DAYS: { label: string; sublabel: string; key: "thu" | "fri" | "sat" }[] = [
  { label: "Thursday", sublabel: "Aug 6",                   key: "thu" },
  { label: "Friday",   sublabel: "Aug 7",                   key: "fri" },
  { label: "Saturday", sublabel: "Aug 8 · Wedding Day 💍",  key: "sat" },
];

// ── Inline add form ────────────────────────────────────────────────────────────
function AddTaskRow({
  category, scheduleDay, onAdd,
}: {
  category: WeddingCategory;
  scheduleDay?: "thu" | "fri" | "sat";
  onAdd: (t: WeddingTask) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [, startTransition] = useTransition();
  const isSat = scheduleDay === "sat";

  function handleAdd() {
    if (!title.trim()) return;
    const optimistic: WeddingTask = {
      id: `tmp-${Date.now()}`, title: title.trim(), completed: false, category,
      scheduleDay, time: time.trim() || undefined,
    };
    onAdd(optimistic);
    setTitle(""); setTime(""); setOpen(false);
    startTransition(async () => {
      await addWeddingTask({ title: optimistic.title, completed: false, category, scheduleDay, time: optimistic.time });
    });
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
    <div className="px-3 py-2 border-t border-gray-100 space-y-1.5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Task name…"
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
      />
      {isSat && (
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Time (e.g. 3:00 PM)"
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300"
        />
      )}
      <div className="flex gap-1.5">
        <button onClick={handleAdd} className="text-xs bg-rose-500 text-white px-2 py-1 rounded-lg hover:bg-rose-600">Add</button>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

// ── Subtask list ───────────────────────────────────────────────────────────────
function SubtaskList({ taskId, subtasks, onUpdate }: {
  taskId: string;
  subtasks: WeddingSubtask[];
  onUpdate: (subtasks: WeddingSubtask[]) => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [, startTransition] = useTransition();

  function handleToggle(id: string) {
    onUpdate(subtasks.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));
    startTransition(() => toggleSubtask(taskId, id));
  }

  function handleDelete(id: string) {
    onUpdate(subtasks.filter((s) => s.id !== id));
    startTransition(() => deleteSubtask(taskId, id));
  }

  function handleEdit(id: string, title: string) {
    onUpdate(subtasks.map((s) => s.id === id ? { ...s, title } : s));
    startTransition(async () => { await updateSubtask(taskId, id, title); });
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    const s: WeddingSubtask = { id: `s${Date.now()}`, title: newTitle.trim(), completed: false };
    onUpdate([...subtasks, s]);
    setNewTitle(""); setAddingNew(false);
    startTransition(async () => { await addSubtask(taskId, s.title); });
  }

  return (
    <div className="ml-6 mt-1 space-y-0.5">
      {subtasks.map((s) => (
        <SubtaskRow key={s.id} subtask={s} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
      ))}
      {addingNew ? (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-3 h-3 rounded border border-gray-300 shrink-0" />
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingNew(false); setNewTitle(""); } }}
            onBlur={() => { if (newTitle.trim()) handleAdd(); else setAddingNew(false); }}
            placeholder="Subtask name…"
            className="flex-1 text-[11px] border-b border-rose-300 focus:outline-none bg-transparent"
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-500 transition-colors mt-0.5"
        >
          <Plus size={10} /> Add subtask
        </button>
      )}
    </div>
  );
}

function SubtaskRow({ subtask, onToggle, onDelete, onEdit }: {
  subtask: WeddingSubtask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(subtask.title);

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== subtask.title) onEdit(subtask.id, draft.trim());
    else setDraft(subtask.title);
  }

  return (
    <div className="flex items-center gap-1.5 group/sub">
      <button
        onClick={() => onToggle(subtask.id)}
        className={cn(
          "w-3 h-3 rounded border shrink-0 flex items-center justify-center transition-colors",
          subtask.completed ? "bg-rose-400 border-rose-400 text-white" : "border-gray-300 hover:border-rose-300",
        )}
      >
        {subtask.completed && <Check size={8} strokeWidth={3} />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditing(false); setDraft(subtask.title); } }}
          className="flex-1 text-[11px] border-b border-rose-300 focus:outline-none bg-transparent"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={cn("flex-1 text-[11px] cursor-text hover:text-rose-600 transition-colors", subtask.completed && "line-through text-gray-400")}
        >
          {subtask.title}
        </span>
      )}
      <button
        onClick={() => onDelete(subtask.id)}
        className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 transition-all"
      >
        <Trash2 size={9} />
      </button>
    </div>
  );
}

// ── Single task row ────────────────────────────────────────────────────────────
function TaskRow({
  task, onToggle, onDelete, onEdit, onTimeEdit, onSubtasksUpdate, showTime,
}: {
  task: WeddingTask;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onTimeEdit?: (id: string, time: string) => void;
  onSubtasksUpdate: (id: string, subtasks: WeddingSubtask[]) => void;
  showTime?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [editingTime, setEditingTime] = useState(false);
  const [timeDraft, setTimeDraft] = useState(task.time ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const subtasks = task.subtasks ?? [];
  const doneCount = subtasks.filter((s) => s.completed).length;

  function startEdit() { setDraft(task.title); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }
  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== task.title) onEdit(task.id, draft.trim());
    else setDraft(task.title);
  }

  function commitTime() {
    setEditingTime(false);
    if (onTimeEdit) onTimeEdit(task.id, timeDraft.trim());
  }

  return (
    <div className={cn("rounded-lg transition-colors", task.completed && "opacity-50")}>
      <div className="flex items-start gap-2 px-3 py-2 group hover:bg-gray-50 rounded-lg">
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
            task.completed ? "bg-rose-500 border-rose-500 text-white" : "border-gray-300 hover:border-rose-400",
          )}
        >
          {task.completed && <Check size={10} strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          {showTime && (
            editingTime ? (
              <input autoFocus value={timeDraft} onChange={(e) => setTimeDraft(e.target.value)}
                onBlur={commitTime}
                onKeyDown={(e) => { if (e.key === "Enter") commitTime(); if (e.key === "Escape") setEditingTime(false); }}
                placeholder="e.g. 3:00 PM"
                className="text-[10px] border border-rose-300 rounded px-1 focus:outline-none bg-white text-rose-500 w-28 mb-0.5" />
            ) : (
              <button type="button"
                className="flex items-center gap-1 text-[10px] text-rose-500 font-semibold mb-0.5 hover:text-rose-700 hover:underline"
                onClick={(e) => { e.stopPropagation(); setTimeDraft(task.time ?? ""); setEditingTime(true); }}>
                <Clock size={9} />
                {task.time ?? <span className="text-gray-300 font-normal">+ add time</span>}
              </button>
            )
          )}
          <div className="flex items-center gap-1.5">
            {editing ? (
              <input ref={inputRef} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditing(false); setDraft(task.title); } }}
                className="flex-1 text-xs border-b border-rose-300 focus:outline-none bg-transparent pb-0.5" />
            ) : (
              <span onClick={startEdit}
                className={cn("text-xs leading-snug cursor-text hover:text-rose-600 transition-colors flex-1", task.completed && "line-through text-gray-400")}>
                {task.title}
              </span>
            )}
            {subtasks.length > 0 && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                doneCount === subtasks.length ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-slate-500"
              )}>
                <ListChecks size={9} />{doneCount}/{subtasks.length}
              </span>
            )}
            <button onClick={() => setExpanded((v) => !v)}
              className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-hover:opacity-100">
              <ChevronDown size={11} className={cn("transition-transform", expanded && "rotate-180")} />
            </button>
          </div>
        </div>
        <button onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5">
          <Trash2 size={11} />
        </button>
      </div>
      {expanded && (
        <SubtaskList
          taskId={task.id}
          subtasks={subtasks}
          onUpdate={(updated) => onSubtasksUpdate(task.id, updated)}
        />
      )}
    </div>
  );
}

// ── Category column ────────────────────────────────────────────────────────────
function CategoryColumn({
  category, tasks, onToggle, onDelete, onAdd, onEdit, onSubtasksUpdate,
}: {
  category: WeddingCategory;
  tasks: WeddingTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (t: WeddingTask) => void;
  onEdit: (id: string, title: string) => void;
  onSubtasksUpdate: (id: string, subtasks: WeddingSubtask[]) => void;
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
          <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onSubtasksUpdate={onSubtasksUpdate} />
        ))}
      </div>
      <AddTaskRow category={category} onAdd={onAdd} />
    </div>
  );
}

// ── Schedule view ──────────────────────────────────────────────────────────────
function ScheduleView({
  tasks, onToggle, onDelete, onEdit, onTimeEdit, onAdd, onSubtasksUpdate,
}: {
  tasks: WeddingTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onTimeEdit: (id: string, time: string) => void;
  onAdd: (t: WeddingTask) => void;
  onSubtasksUpdate: (id: string, subtasks: WeddingSubtask[]) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {WEEK_DAYS.map(({ label, sublabel, key }) => {
        const isSat = key === "sat";
        const dayTasks = tasks
          .filter((t) => t.scheduleDay === key)
          .sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
          });

        return (
          <div key={key} className={cn(
            "flex flex-col border rounded-xl overflow-hidden bg-white",
            isSat ? "border-rose-300" : "border-gray-200",
          )}>
            <div className={cn(
              "px-4 py-3 border-b",
              isSat ? "bg-rose-50 border-rose-200" : "bg-gray-50 border-gray-100",
            )}>
              <p className={cn("text-sm font-bold", isSat ? "text-rose-700" : "text-gray-700")}>{label}</p>
              <p className={cn("text-[11px]", isSat ? "text-rose-500" : "text-gray-400")}>{sublabel}</p>
            </div>
            <div className="flex-1 p-2 space-y-0.5 min-h-[120px]">
              {dayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onTimeEdit={onTimeEdit}
                  onSubtasksUpdate={onSubtasksUpdate}
                  showTime
                />
              ))}
            </div>
            <AddTaskRow
              category={isSat ? "Day of" : "Week of"}
              scheduleDay={key}
              onAdd={onAdd}
            />
          </div>
        );
      })}
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

  function handleEdit(id: string, title: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, title } : t));
    startTransition(async () => { await updateWeddingTask(id, title); });
  }

  function handleTimeEdit(id: string, time: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, time: time || undefined } : t));
    startTransition(async () => { await updateWeddingTaskFields(id, { time: time || undefined }); });
  }

  function handleSubtasksUpdate(id: string, subtasks: WeddingSubtask[]) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, subtasks } : t));
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
              onEdit={handleEdit}
              onSubtasksUpdate={handleSubtasksUpdate}
            />
          ))}
        </div>
      ) : (
        <ScheduleView
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onTimeEdit={handleTimeEdit}
          onAdd={handleAdd}
          onSubtasksUpdate={handleSubtasksUpdate}
        />
      )}
    </div>
  );
}
