"use client";

import { useState, useTransition } from "react";
import { toggleHabit, deleteHabit, createHabit, type Habit } from "@/lib/actions/habits";
import { Trash2, Plus, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

export default function HabitTracker({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  function handleToggle(id: number) {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed_today: !h.completed_today, streak: h.completed_today ? h.streak - 1 : h.streak + 1 } : h))
    );
    startTransition(() => toggleHabit(id));
  }

  function handleDelete(id: number) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    startTransition(() => deleteHabit(id));
  }

  const daily = habits.filter((h) => h.frequency === "daily");
  const weekly = habits.filter((h) => h.frequency === "weekly");
  const completedCount = habits.filter((h) => h.completed_today).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        {habits.length > 0 && (
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{completedCount}</span>/{habits.length} done today
          </div>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Add Habit
          </button>
        </div>
      </div>

      {showForm && (
        <AddHabitForm
          onClose={() => setShowForm(false)}
          onAdd={(habit) => {
            setHabits((prev) => [habit, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No habits yet</p>
          <p className="text-sm mt-1">Build good habits by tracking them daily.</p>
        </div>
      ) : (
        <>
          {daily.length > 0 && (
            <HabitGroup
              title="Daily"
              habits={daily}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
          {weekly.length > 0 && (
            <HabitGroup
              title="Weekly"
              habits={weekly}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}

function HabitGroup({
  title,
  habits,
  onToggle,
  onDelete,
}: {
  title: string;
  habits: Habit[];
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h2>
      <ul className="space-y-2">
        {habits.map((habit) => (
          <HabitItem key={habit.id} habit={habit} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  );
}

function HabitItem({
  habit,
  onToggle,
  onDelete,
}: {
  habit: Habit;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 transition-all",
        habit.completed_today && "opacity-75"
      )}
    >
      <button
        onClick={() => onToggle(habit.id)}
        className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: habit.color,
          backgroundColor: habit.completed_today ? habit.color : "transparent",
        }}
      >
        {habit.completed_today && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", habit.completed_today && "line-through text-gray-400")}>
          {habit.name}
        </p>
        {habit.description && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{habit.description}</p>
        )}
      </div>
      {habit.streak > 0 && (
        <div className="flex items-center gap-1 text-orange-500 shrink-0">
          <Flame size={14} />
          <span className="text-xs font-semibold">{habit.streak}</span>
        </div>
      )}
      <button
        onClick={() => onDelete(habit.id)}
        className="text-gray-300 hover:text-red-400 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

function AddHabitForm({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (habit: Habit) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createHabit({ name: name.trim(), description: description.trim() || undefined, frequency, color });
    const optimistic: Habit = {
      id: Date.now(),
      name: name.trim(),
      description: description.trim() || null,
      frequency: frequency as Habit["frequency"],
      color,
      created_at: new Date().toISOString(),
      completed_today: false,
      streak: 0,
    };
    onAdd(optimistic);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New Habit</h3>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Habit name"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <div className="flex gap-2 mb-3">
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn("w-6 h-6 rounded-full transition-transform", color === c && "scale-125 ring-2 ring-offset-1 ring-gray-400")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Habit"}
        </button>
      </div>
    </form>
  );
}
