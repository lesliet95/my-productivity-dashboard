"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { saveWeekData, type WeekData, type WeekGoal } from "@/lib/actions/weekView";
import { toggleTask, createTask, deleteTask, type Task } from "@/lib/actions/tasks";
import { CATEGORY_STYLES } from "@/lib/taskCategories";
import { ChevronLeft, ChevronRight, Plus, Trash2, BookOpen, Sparkles, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Week key helpers ──────────────────────────────────────────────────────────

function getMondayOf(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function weekLabel(key: string, offset: number): string {
  const d = new Date(key + "T00:00:00");
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  if (offset === 0) return "This Week";
  if (offset === -1) return "Last Week";
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " +
    end.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

function popSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
}

function spawnConfetti(x: number, y: number) {
  const colors = ["#6366f1", "#ec4899", "#f97316", "#22c55e", "#eab308", "#14b8a6", "#8b5cf6"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.5;
    const dist = 40 + Math.random() * 60;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 5 + Math.random() * 5;
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      background:${color};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      pointer-events:none;z-index:9999;
      transform:translate(-50%,-50%);
      transition:transform 0.5s ease-out,opacity 0.5s ease-out;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${Math.random() * 360}deg)`;
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 550);
  }
  popSound();
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WeekView({
  initialData,
  initialWeekKey,
  initialTasks,
}: {
  initialData: WeekData;
  initialWeekKey: string;
  initialTasks: Task[];
}) {
  const [offset, setOffset] = useState(0);
  const [weekKey, setWeekKey] = useState(initialWeekKey);
  const [data, setData] = useState(initialData);
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Sunday of the week (weekKey is Monday)
  const weekStart = weekKey;
  const weekEnd = (() => {
    const d = new Date(weekKey + "T00:00:00");
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })();

  // Tasks relevant to this week: due within the week, or no due date (current week only)
  const weekTasks = tasks.filter((t) => {
    if (t.due_date) {
      return t.due_date >= weekStart && t.due_date <= weekEnd;
    }
    return offset === 0; // show undated tasks only for current week
  });

  async function navigateTo(newOffset: number) {
    setLoading(true);
    const newKey = getMondayOf(newOffset);
    setOffset(newOffset);
    setWeekKey(newKey);
    const res = await fetch(`/api/week?key=${newKey}`);
    const json = await res.json();
    setData(json);
    setTasks(json.allTasks ?? tasks);
    setLoading(false);
  }

  function persist(patch: Partial<WeekData>) {
    setData((prev) => ({ ...prev, ...patch }));
    startTransition(() => saveWeekData(weekKey, patch));
  }

  function handleToggleTask(id: number, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    if (task && !task.completed) spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    startTransition(() => toggleTask(id));
  }

  function handleDeleteTask(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteTask(id));
  }

  async function handleAddTask(title: string, dueDate: string) {
    const optimistic: Task = {
      id: Date.now(),
      title,
      description: null,
      completed: false,
      priority: "medium",
      due_date: dueDate,
      category: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, optimistic]);
    await createTask({ title, due_date: dueDate });
  }

  const label = weekLabel(weekKey, offset);

  return (
    <div className={cn("transition-opacity", loading && "opacity-40 pointer-events-none")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigateTo(offset - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-700 w-36 text-center">{label}</h2>
          <button
            onClick={() => navigateTo(offset + 1)}
            disabled={offset >= 0}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          {offset !== 0 && (
            <button onClick={() => navigateTo(0)} className="text-xs text-indigo-600 hover:underline ml-1">
              Back to this week
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles size={13} />
          Week of {new Date(weekKey + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left col — takes 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          <TaskChecklist
            tasks={weekTasks}
            weekKey={weekKey}
            isCurrentWeek={offset === 0}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onAdd={handleAddTask}
          />
          <WeeklyFocus focus={data.focus} goals={data.goals} onChange={(focus, goals) => persist({ focus, goals })} />
          <Reflections reflection={data.reflection} onChange={(reflection) => persist({ reflection })} />
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <CurrentlyReadingWidget reading={data.reading} onChange={(reading) => persist({ reading })} />
          <WeekStats tasks={weekTasks} goals={data.goals} />
        </div>
      </div>
    </div>
  );
}

// ── TaskChecklist ─────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(weekKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekKey + "T00:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function TaskChecklist({
  tasks,
  weekKey,
  isCurrentWeek,
  onToggle,
  onDelete,
  onAdd,
}: {
  tasks: Task[];
  weekKey: string;
  isCurrentWeek: boolean;
  onToggle: (id: number, e: React.MouseEvent) => void;
  onDelete: (id: number) => void;
  onAdd: (title: string, dueDate: string) => void;
}) {
  const weekDates = getWeekDates(weekKey);
  const today = todayKey();
  const defaultDay = isCurrentWeek && weekDates.includes(today) ? today : null;
  const [selectedDay, setSelectedDay] = useState<string | null>(defaultDay);
  const [input, setInput] = useState("");

  // Reset selected day when week changes
  useEffect(() => {
    const dates = getWeekDates(weekKey);
    const t = todayKey();
    setSelectedDay(isCurrentWeek && dates.includes(t) ? t : null);
  }, [weekKey, isCurrentWeek]);

  const visibleTasks = selectedDay
    ? tasks.filter((t) => t.due_date === selectedDay || (!t.due_date && selectedDay === today))
    : tasks;

  const done = visibleTasks.filter((t) => t.completed).length;

  function handleAdd() {
    if (!input.trim()) return;
    onAdd(input.trim(), selectedDay ?? weekKey);
    setInput("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Tasks</h3>
        <div className="flex items-center gap-3">
          {visibleTasks.length > 0 && (
            <span className="text-xs text-gray-400">{done}/{visibleTasks.length} done</span>
          )}
          <Link href="/tasks" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
            All tasks <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Day bar */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSelectedDay(null)}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
            selectedDay === null
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          All
        </button>
        {weekDates.map((date, i) => {
          const isToday = date === today;
          const count = tasks.filter((t) => t.due_date === date).length;
          const isSelected = selectedDay === date;
          return (
            <button
              key={date}
              onClick={() => setSelectedDay(isSelected ? null : date)}
              className={cn(
                "flex-1 flex flex-col items-center py-1.5 rounded-lg text-xs font-medium transition-colors relative",
                isSelected
                  ? "bg-indigo-600 text-white"
                  : isToday
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              <span>{DAY_LABELS[i]}</span>
              {count > 0 && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mt-0.5",
                  isSelected ? "bg-white" : "bg-indigo-400"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick add */}
      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={selectedDay ? `Add task for ${DAY_LABELS[weekDates.indexOf(selectedDay)]}…` : "Add task for this week…"}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          {selectedDay
            ? `Nothing due ${selectedDay === today ? "today" : `on ${DAY_LABELS[weekDates.indexOf(selectedDay)]}`}`
            : "No tasks due this week — add one above or set due dates in Tasks."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {visibleTasks
            .slice()
            .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
            .map((task) => {
              const catStyle = task.category ? CATEGORY_STYLES[task.category] : null;
              return (
                <li key={task.id} className="flex items-center gap-3 group py-1">
                  <button
                    onClick={(e) => onToggle(task.id, e)}
                    className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                      task.completed ? "bg-indigo-500 border-indigo-500 scale-110" : "border-gray-300 hover:border-indigo-400"
                    )}
                  >
                    {task.completed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={cn("flex-1 text-sm", task.completed && "line-through text-gray-400")}>
                    {task.title}
                  </span>
                  {catStyle && task.category && (
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:block", catStyle.pill)}>
                      {task.category}
                    </span>
                  )}
                  <button
                    onClick={() => onDelete(task.id)}
                    className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

// ── WeeklyFocus ───────────────────────────────────────────────────────────────

function WeeklyFocus({ focus, goals, onChange }: {
  focus: string;
  goals: WeekGoal[];
  onChange: (focus: string, goals: WeekGoal[]) => void;
}) {
  const [focusVal, setFocusVal] = useState(focus);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => { setFocusVal(focus); }, [focus]);

  function saveFocus() {
    if (focusVal !== focus) onChange(focusVal, goals);
  }

  function addGoal() {
    if (!goalInput.trim()) return;
    const next = [...goals, { id: crypto.randomUUID(), text: goalInput.trim(), completed: false }];
    onChange(focusVal, next);
    setGoalInput("");
  }

  function toggleGoal(id: string, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const next = goals.map((g) => g.id === id ? { ...g, completed: !g.completed } : g);
    onChange(focusVal, next);
    const goal = goals.find((g) => g.id === id);
    if (goal && !goal.completed) spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  function deleteGoal(id: string) {
    onChange(focusVal, goals.filter((g) => g.id !== id));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-3">Weekly Focus</h3>
      <input
        value={focusVal}
        onChange={(e) => setFocusVal(e.target.value)}
        onBlur={saveFocus}
        onKeyDown={(e) => e.key === "Enter" && saveFocus()}
        placeholder="What's your main focus this week?"
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
      />

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weekly Goals</h4>
      <div className="flex gap-2 mb-3">
        <input
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGoal()}
          placeholder="Add a specific goal…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button onClick={addGoal} disabled={!goalInput.trim()}
          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">No goals yet</p>
      ) : (
        <ul className="space-y-1.5">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-center gap-3 group py-0.5">
              <button
                onClick={(e) => toggleGoal(goal.id, e)}
                className={cn(
                  "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                  goal.completed ? "bg-indigo-500 border-indigo-500" : "border-gray-300 hover:border-indigo-400"
                )}
              >
                {goal.completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span className={cn("flex-1 text-sm", goal.completed && "line-through text-gray-400")}>{goal.text}</span>
              <button onClick={() => deleteGoal(goal.id)}
                className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Reflections ───────────────────────────────────────────────────────────────

function Reflections({ reflection, onChange }: { reflection: string; onChange: (r: string) => void }) {
  const [val, setVal] = useState(reflection);
  useEffect(() => { setVal(reflection); }, [reflection]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-1">Reflections</h3>
      <p className="text-xs text-gray-400 mb-3">What went well? What would you do differently?</p>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { if (val !== reflection) onChange(val); }}
        placeholder="Write your weekly reflection here…"
        rows={5}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none leading-relaxed"
      />
    </div>
  );
}

// ── CurrentlyReadingWidget ────────────────────────────────────────────────────

function CurrentlyReadingWidget({ reading, onChange }: {
  reading: WeekData["reading"];
  onChange: (r: WeekData["reading"]) => void;
}) {
  const [val, setVal] = useState(reading);
  const [editing, setEditing] = useState(false);
  useEffect(() => { setVal(reading); }, [reading]);

  function save() {
    onChange(val);
    setEditing(false);
  }

  const hasBook = reading.title.trim().length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-amber-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Currently Reading</h3>
        </div>
        <button onClick={() => setEditing((e) => !e)} className="text-xs text-indigo-600 hover:underline">
          {editing ? "Cancel" : hasBook ? "Edit" : "Add"}
        </button>
      </div>

      {editing ? (
        <div className="space-y-2">
          <input value={val.title} onChange={(e) => setVal({ ...val, title: e.target.value })}
            placeholder="Book title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input value={val.author} onChange={(e) => setVal({ ...val, author: e.target.value })}
            placeholder="Author" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span><span>{val.progress}%</span>
            </div>
            <input type="range" min={0} max={100} value={val.progress}
              onChange={(e) => setVal({ ...val, progress: Number(e.target.value) })}
              className="w-full accent-amber-500" />
          </div>
          <button onClick={save} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save</button>
        </div>
      ) : hasBook ? (
        <div>
          <p className="font-semibold text-gray-900 text-sm">{reading.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{reading.author}</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span><span>{reading.progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${reading.progress}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-3">No book set for this week</p>
      )}
    </div>
  );
}

// ── WeekStats ─────────────────────────────────────────────────────────────────

function WeekStats({ tasks, goals }: { tasks: Task[]; goals: WeekGoal[] }) {
  const taskDone = tasks.filter((t) => t.completed).length;
  const goalDone = goals.filter((g) => g.completed).length;
  const totalItems = tasks.length + goals.length;
  const totalDone = taskDone + goalDone;
  const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">Week Progress</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none"
              stroke={pct >= 80 ? "#22c55e" : pct >= 50 ? "#6366f1" : "#f97316"}
              strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">{pct}%</span>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Tasks: <span className="font-semibold text-gray-800">{taskDone}/{tasks.length}</span></p>
          <p className="text-xs text-gray-500">Goals: <span className="font-semibold text-gray-800">{goalDone}/{goals.length}</span></p>
          <p className="text-xs text-gray-500">Total: <span className="font-semibold text-gray-800">{totalDone}/{totalItems}</span></p>
        </div>
      </div>
      {pct === 100 && totalItems > 0 && (
        <p className="text-xs text-center text-green-600 font-semibold bg-green-50 rounded-lg py-2">🎉 Perfect week!</p>
      )}
    </div>
  );
}
