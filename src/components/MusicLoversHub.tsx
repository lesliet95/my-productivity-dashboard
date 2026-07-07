"use client";

import React, { useState, useTransition } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  toggleTask, deleteTask, createTask, updateTaskTitle, updateTaskDueDate,
  updateTaskSubtasks, updateTaskPriority, updateTaskDescription,
  type Task, type Subtask,
} from "@/lib/actions/tasks";
import {
  createContentPost, updateContentPost, deleteContentPost,
  createContentIdea, updateContentIdea, deleteContentIdea, promoteIdeaToPost,
  type ContentPost, type ContentIdea, type Platform, type ContentStatus,
} from "@/lib/actions/musicContent";
import { Plus, Trash2, ChevronDown, Check, ListChecks, Calendar, ArrowUpRight, Instagram, Youtube, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: "instagram", label: "Instagram", color: "bg-pink-100 text-pink-700" },
  { id: "tiktok",    label: "TikTok",    color: "bg-gray-900 text-white" },
  { id: "youtube",   label: "YouTube",   color: "bg-red-100 text-red-700" },
  { id: "twitter",   label: "X/Twitter", color: "bg-sky-100 text-sky-700" },
  { id: "facebook",  label: "Facebook",  color: "bg-blue-100 text-blue-700" },
];

const STATUSES: { id: ContentStatus; label: string; color: string; bg: string }[] = [
  { id: "idea",      label: "Idea",      color: "text-gray-600",   bg: "bg-gray-50 border-gray-200" },
  { id: "filming",   label: "Filming",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  { id: "editing",   label: "Editing",   color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  { id: "scheduled", label: "Scheduled", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  { id: "posted",    label: "Posted",    color: "text-green-700",  bg: "bg-green-50 border-green-200" },
];

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-600", medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-500",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PlatformPill({ platform }: { platform: Platform }) {
  const p = PLATFORMS.find((x) => x.id === platform);
  if (!p) return null;
  return <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", p.color)}>{p.label}</span>;
}

// ── Task Board ─────────────────────────────────────────────────────────────────

function SubtaskList({ taskId, subtasks, onUpdate }: {
  taskId: number; subtasks: Subtask[];
  onUpdate: (id: number, s: Subtask[]) => void;
}) {
  const [, start] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  function save(next: Subtask[]) {
    onUpdate(taskId, next);
    start(async () => { await updateTaskSubtasks(taskId, next); });
  }
  return (
    <div className="space-y-0.5 mt-1">
      {subtasks.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5 group/s py-0.5">
          <button onClick={() => save(subtasks.map((x) => x.id === s.id ? { ...x, completed: !x.completed } : x))}
            className={cn("w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center", s.completed ? "bg-purple-500 border-purple-500 text-white" : "border-gray-300 hover:border-purple-400")}>
            {s.completed && <Check size={9} />}
          </button>
          <span className={cn("flex-1 text-[11px]", s.completed ? "line-through text-gray-400" : "text-gray-600")}>{s.title}</span>
          <button onClick={() => save(subtasks.filter((x) => x.id !== s.id))} className="opacity-0 group-hover/s:opacity-100 text-gray-300 hover:text-red-400">
            <Trash2 size={10} />
          </button>
        </div>
      ))}
      <form onSubmit={(e) => { e.preventDefault(); if (!newTitle.trim()) return; save([...subtasks, { id: `s${Date.now()}`, title: newTitle.trim(), completed: false }]); setNewTitle(""); }} className="flex items-center gap-1">
        <Plus size={10} className="text-gray-300 shrink-0" />
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add subtask…" className="flex-1 text-[11px] text-gray-500 bg-transparent placeholder-gray-300 focus:outline-none" />
        {newTitle.trim() && <button type="submit" className="text-[10px] text-purple-500 font-medium">Add</button>}
      </form>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onUpdate }: {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<Task>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const titleRef = React.useRef(titleDraft);
  titleRef.current = titleDraft;
  const [, start] = useTransition();
  const subtasksDone = task.subtasks.filter((s) => s.completed).length;
  const subtasksTotal = task.subtasks.length;
  const isOverdue = !task.completed && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);

  function saveTitle() {
    const val = titleRef.current.trim();
    if (val && val !== task.title) { onUpdate(task.id, { title: val }); start(async () => { await updateTaskTitle(task.id, val); }); }
    else setTitleDraft(task.title);
    setEditingTitle(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow group">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)}
          className="mt-0.5 w-3.5 h-3.5 shrink-0 rounded border-gray-300 text-purple-600 cursor-pointer" />
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input autoFocus value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { setTitleDraft(task.title); setEditingTitle(false); } }}
              className="w-full text-sm font-medium border border-purple-300 rounded px-1.5 py-0.5 focus:outline-none" />
          ) : (
            <p className={cn("text-sm font-medium cursor-pointer hover:text-purple-600 transition-colors", task.completed && "line-through text-gray-400")}
              onClick={() => setExpanded((v) => !v)} onDoubleClick={() => setEditingTitle(true)}>
              {task.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.due_date && (
              <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? "text-red-500 font-medium" : "text-gray-400")}>
                <Calendar size={9} />{formatDate(task.due_date)}
              </span>
            )}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </span>
            {subtasksTotal > 0 && (
              <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full", subtasksDone === subtasksTotal ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500")}>
                <ListChecks size={9} />{subtasksDone}/{subtasksTotal}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
      {expanded && (
        <div className="mt-2 ml-5 space-y-2">
          <textarea defaultValue={task.description ?? ""} placeholder="Add a description…" rows={2}
            onBlur={(e) => { const v = e.target.value; if (v !== (task.description ?? "")) { onUpdate(task.id, { description: v || null }); start(async () => { await updateTaskDescription(task.id, v); }); } }}
            className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300 placeholder-gray-300" />
          <SubtaskList taskId={task.id} subtasks={task.subtasks}
            onUpdate={(id, s) => onUpdate(id, { subtasks: s })} />
        </div>
      )}
    </div>
  );
}

function TaskBoard({ tasks, onTasksChange }: { tasks: Task[]; onTasksChange: (tasks: Task[]) => void }) {
  const [, start] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  function handleToggle(id: number) {
    const task = tasks.find((t) => t.id === id);
    const completing = task && !task.completed;
    onTasksChange(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    if (completing) toast("Task completed ✓");
    start(() => toggleTask(id));
  }
  function handleDelete(id: number) {
    onTasksChange(tasks.filter((t) => t.id !== id));
    toast("Task deleted", "delete");
    start(() => deleteTask(id));
  }
  function handleUpdate(id: number, patch: Partial<Task>) {
    onTasksChange(tasks.map((t) => t.id === id ? { ...t, ...patch } : t));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask({ title: newTitle.trim(), priority: newPriority, category: "Music Lovers" });
    onTasksChange([{ id: Date.now(), title: newTitle.trim(), description: null, completed: false, priority: newPriority, due_date: null, category: "Music Lovers", subtasks: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...tasks]);
    setNewTitle(""); setNewPriority("medium"); setAdding(false);
    toast("Task added ✓");
  }

  const pending = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{pending.length} pending · {done.length} done</p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
          <Plus size={13} /> New Task
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
          <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title…" required
            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
          <div className="flex gap-2">
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as "low" | "medium" | "high")}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-500 px-2">Cancel</button>
              <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700">Add</button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {pending.map((t) => <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />)}
      </div>
      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 list-none flex items-center gap-1">
            <ChevronDown size={12} className="group-open:rotate-180 transition-transform" /> {done.length} completed
          </summary>
          <div className="mt-2 space-y-2 opacity-60">
            {done.map((t) => <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />)}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Content Calendar ───────────────────────────────────────────────────────────

function PostCard({ post, onUpdate, onDelete }: {
  post: ContentPost;
  onUpdate: (id: string, data: Partial<ContentPost>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [, start] = useTransition();
  const status = STATUSES.find((s) => s.id === post.status)!;

  function save(data: Partial<ContentPost>) {
    onUpdate(post.id, data);
    start(async () => { await updateContentPost(post.id, data); });
  }

  return (
    <div className={cn("border rounded-xl p-3 group transition-shadow hover:shadow-sm", status.bg)}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <input defaultValue={post.title} onBlur={(e) => { if (e.target.value.trim() !== post.title) save({ title: e.target.value.trim() }); }}
            className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-400 focus:outline-none py-0.5" />
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <select value={post.status} onChange={(e) => save({ status: e.target.value as ContentStatus })}
              className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 border focus:outline-none cursor-pointer", status.bg, status.color)}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            {post.platforms.map((p) => <PlatformPill key={p} platform={p} />)}
            {post.scheduledDate && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Calendar size={9} />{formatDate(post.scheduledDate)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600">
            <ChevronDown size={13} className={cn("transition-transform", expanded && "rotate-180")} />
          </button>
          <button onClick={() => onDelete(post.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-2 space-y-2">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Platforms</p>
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map((p) => (
                <button key={p.id} onClick={() => {
                  const next = post.platforms.includes(p.id) ? post.platforms.filter((x) => x !== p.id) : [...post.platforms, p.id];
                  save({ platforms: next });
                }} className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-opacity", p.color, post.platforms.includes(p.id) ? "opacity-100" : "opacity-30")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Scheduled Date</p>
            <input type="date" defaultValue={post.scheduledDate ?? ""} onBlur={(e) => save({ scheduledDate: e.target.value || undefined })}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-300" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Caption</p>
            <textarea defaultValue={post.caption ?? ""} placeholder="Write caption…" rows={3}
              onBlur={(e) => save({ caption: e.target.value || undefined })}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300 placeholder-gray-300" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <textarea defaultValue={post.notes ?? ""} placeholder="Production notes…" rows={2}
              onBlur={(e) => save({ notes: e.target.value || undefined })}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300 placeholder-gray-300" />
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCalendar({ posts: initial }: { posts: ContentPost[] }) {
  const [posts, setPosts] = useState(initial);
  const [, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPlatforms, setNewPlatforms] = useState<Platform[]>([]);
  const [view, setView] = useState<ContentStatus | "all">("all");
  const { toast } = useToast();

  function handleUpdate(id: string, data: Partial<ContentPost>) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p));
    toast("Post updated ✓");
  }
  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast("Post deleted", "delete");
    start(async () => { await deleteContentPost(id); });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const data = { title: newTitle.trim(), platforms: newPlatforms, status: "idea" as ContentStatus };
    await createContentPost(data);
    setPosts((prev) => [...prev, { ...data, id: `p${Date.now()}`, createdAt: new Date().toISOString() }]);
    setNewTitle(""); setNewPlatforms([]); setAdding(false);
    toast("Post added ✓");
  }

  const filtered = view === "all" ? posts : posts.filter((p) => p.status === view);

  return (
    <div className="space-y-4">
      {/* Status filter tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg flex-wrap">
          <button onClick={() => setView("all")} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", view === "all" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
            All <span className="ml-1 text-gray-400">{posts.length}</span>
          </button>
          {STATUSES.map((s) => {
            const count = posts.filter((p) => p.status === s.id).length;
            return (
              <button key={s.id} onClick={() => setView(s.id)} className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors", view === s.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
                {s.label} {count > 0 && <span className="ml-1 text-gray-400">{count}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors shrink-0">
          <Plus size={13} /> New Post
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
          <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Post title…" required
            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Platforms</p>
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" onClick={() => setNewPlatforms((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                  className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-opacity", p.color, newPlatforms.includes(p.id) ? "opacity-100" : "opacity-30")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-500 px-2">Cancel</button>
            <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700">Add</button>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">No posts yet — click New Post to add one</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => <PostCard key={p.id} post={p} onUpdate={handleUpdate} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}

// ── Ideas Bank ─────────────────────────────────────────────────────────────────

function IdeaCard({ idea, onUpdate, onDelete, onPromote }: {
  idea: ContentIdea;
  onUpdate: (id: string, data: Partial<ContentIdea>) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string) => void;
}) {
  const [, start] = useTransition();

  function save(data: Partial<ContentIdea>) {
    onUpdate(idea.id, data);
    start(async () => { await updateContentIdea(idea.id, data); });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 group hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <input defaultValue={idea.title} onBlur={(e) => { if (e.target.value.trim() !== idea.title) save({ title: e.target.value.trim() }); }}
            className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-400 focus:outline-none py-0.5" />
          {idea.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{idea.description}</p>}
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {idea.platforms.map((p) => <PlatformPill key={p} platform={p} />)}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onPromote(idea.id)} title="Promote to content calendar" className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-purple-500 transition-all">
            <ArrowUpRight size={14} />
          </button>
          <button onClick={() => onDelete(idea.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function IdeasBank({ ideas: initial }: { ideas: ContentIdea[] }) {
  const [ideas, setIdeas] = useState(initial);
  const [, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatforms, setNewPlatforms] = useState<Platform[]>([]);
  const { toast } = useToast();

  function handleUpdate(id: string, data: Partial<ContentIdea>) {
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, ...data } : i));
  }
  function handleDelete(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast("Idea deleted", "delete");
    start(async () => { await deleteContentIdea(id); });
  }
  function handlePromote(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast("Idea promoted to calendar ✓");
    start(async () => { await promoteIdeaToPost(id); });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const data = { title: newTitle.trim(), description: newDesc.trim() || undefined, platforms: newPlatforms };
    await createContentIdea(data);
    setIdeas((prev) => [...prev, { ...data, id: `i${Date.now()}`, createdAt: new Date().toISOString() }]);
    setNewTitle(""); setNewDesc(""); setNewPlatforms([]); setAdding(false);
    toast("Idea added ✓");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">{ideas.length} ideas · hover a card to promote it to the calendar ↗</p>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors">
          <Plus size={13} /> New Idea
        </button>
      </div>

      {adding && (
        <form onSubmit={handleAdd} className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-2">
          <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Idea title…" required
            className="w-full text-sm border border-purple-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white" />
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)…" rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-purple-300 placeholder-gray-300 bg-white" />
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Platforms</p>
            <div className="flex gap-1.5 flex-wrap">
              {PLATFORMS.map((p) => (
                <button key={p.id} type="button" onClick={() => setNewPlatforms((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                  className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-opacity", p.color, newPlatforms.includes(p.id) ? "opacity-100" : "opacity-30")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-gray-500 px-2">Cancel</button>
            <button type="submit" className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700">Add</button>
          </div>
        </form>
      )}

      {ideas.length === 0 && !adding ? (
        <p className="text-center text-sm text-gray-400 py-12">No ideas yet — click New Idea to capture one</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ideas.map((i) => <IdeaCard key={i.id} idea={i} onUpdate={handleUpdate} onDelete={handleDelete} onPromote={handlePromote} />)}
        </div>
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function MusicLoversHub({ tasks: initialTasks, posts, ideas }: {
  tasks: Task[];
  posts: ContentPost[];
  ideas: ContentIdea[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState<"tasks" | "calendar" | "ideas">("tasks");

  const tabs = [
    { id: "tasks",    label: "Task Board",        icon: ListChecks },
    { id: "calendar", label: "Content Calendar",  icon: Calendar },
    { id: "ideas",    label: "Ideas Bank",         icon: Music2 },
  ] as const;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "tasks" && <TaskBoard tasks={tasks} onTasksChange={setTasks} />}
      {tab === "calendar" && <ContentCalendar posts={posts} />}
      {tab === "ideas" && <IdeasBank ideas={ideas} />}
    </div>
  );
}
