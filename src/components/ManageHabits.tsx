"use client";

import { useState } from "react";
import type { CustomHabit } from "@/lib/types/habits";
import { X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = [
  "💧","🏃","📖","🧘","💪","🥗","😴","✍️","🎯","🙏","📿","⭐","🌿","🎵","💊",
  "🧹","💰","📱","🖥️","🤝","❤️","🧠","🌅","🚴","🏊","🍎","☕","📝","🎨","🌙",
];

const COLOR_OPTIONS = [
  { color: "#6366f1", bg: "bg-indigo-50",  border: "#a5b4fc" },
  { color: "#8b5cf6", bg: "bg-purple-50",  border: "#c4b5fd" },
  { color: "#ec4899", bg: "bg-pink-50",    border: "#f9a8d4" },
  { color: "#ef4444", bg: "bg-red-50",     border: "#fca5a5" },
  { color: "#f97316", bg: "bg-orange-50",  border: "#fdba74" },
  { color: "#eab308", bg: "bg-yellow-50",  border: "#fde047" },
  { color: "#22c55e", bg: "bg-green-50",   border: "#86efac" },
  { color: "#14b8a6", bg: "bg-teal-50",    border: "#5eead4" },
  { color: "#3b82f6", bg: "bg-blue-50",    border: "#93c5fd" },
  { color: "#64748b", bg: "bg-slate-50",   border: "#cbd5e1" },
];

const DEFAULT_HABIT: Omit<CustomHabit, "id" | "order"> = {
  label: "",
  sublabel: "",
  icon: "⭐",
  color: COLOR_OPTIONS[0].color,
  bg: COLOR_OPTIONS[0].bg,
  border: COLOR_OPTIONS[0].border,
  goal: 5,
  section: "daily",
};

export default function ManageHabits({
  habits,
  sectionNames,
  onSave,
  onSaveSectionNames,
  onClose,
}: {
  habits: CustomHabit[];
  sectionNames: { daily: string; devotional: string };
  onSave: (habits: CustomHabit[]) => void;
  onSaveSectionNames: (names: { daily: string; devotional: string }) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<CustomHabit[]>(
    habits.slice().sort((a, b) => a.order - b.order)
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [secDaily, setSecDaily] = useState(sectionNames.daily);
  const [secDevotional, setSecDevotional] = useState(sectionNames.devotional);

  function handleSave() {
    const reordered = list.map((h, i) => ({ ...h, order: i }));
    onSave(reordered);
    onSaveSectionNames({ daily: secDaily.trim() || "Daily", devotional: secDevotional.trim() || "Devotional" });
    onClose();
  }

  function handleDelete(id: string) {
    setList((prev) => prev.filter((h) => h.id !== id));
    if (editing === id) setEditing(null);
  }

  function handleMove(id: string, dir: -1 | 1) {
    setList((prev) => {
      const idx = prev.findIndex((h) => h.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }

  function handleUpdate(updated: CustomHabit) {
    setList((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setEditing(null);
  }

  function handleAdd(habit: Omit<CustomHabit, "id" | "order">) {
    const newHabit: CustomHabit = {
      ...habit,
      id: crypto.randomUUID(),
      order: list.length,
    };
    setList((prev) => [...prev, newHabit]);
    setShowAdd(false);
  }

  const daily = list.filter((h) => h.section === "daily");
  const devotional = list.filter((h) => h.section === "devotional");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Manage Habits</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Section name editors */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Section Names</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Section 1</label>
                <input
                  value={secDaily}
                  onChange={(e) => setSecDaily(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Section 2</label>
                <input
                  value={secDevotional}
                  onChange={(e) => setSecDevotional(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {[
            { key: "daily" as const, title: secDaily, items: daily },
            { key: "devotional" as const, title: secDevotional, items: devotional },
          ].map(({ key, title, items }) => (
            <div key={key}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
              {items.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No habits in this section yet.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((habit) => (
                    <div key={habit.id}>
                      <div
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          editing === habit.id ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-white"
                        )}
                      >
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => handleMove(habit.id, -1)} className="text-gray-300 hover:text-gray-500">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => handleMove(habit.id, 1)} className="text-gray-300 hover:text-gray-500">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <span
                          className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0", habit.bg)}
                          style={{ border: `1.5px solid ${habit.border}` }}
                        >
                          {habit.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{habit.label}</p>
                          {habit.sublabel && (
                            <p className="text-xs text-gray-400">{habit.sublabel}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{habit.goal}/wk</span>
                        <button
                          onClick={() => setEditing(editing === habit.id ? null : habit.id)}
                          className="text-xs text-indigo-600 hover:underline shrink-0"
                        >
                          {editing === habit.id ? "Cancel" : "Edit"}
                        </button>
                        <button onClick={() => handleDelete(habit.id)} className="text-gray-300 hover:text-red-400">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {editing === habit.id && (
                        <HabitForm
                          initial={habit}
                          onSubmit={(data) => handleUpdate({ ...habit, ...data })}
                          onCancel={() => setEditing(null)}
                          submitLabel="Save changes"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add new */}
          {showAdd ? (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">New Habit</h3>
              <HabitForm
                initial={{ ...DEFAULT_HABIT, label: "", sublabel: "" }}
                onSubmit={handleAdd}
                onCancel={() => setShowAdd(false)}
                submitLabel="Add habit"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus size={16} />
              Add new habit
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Save & close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HabitForm ─────────────────────────────────────────────────────────────────

function HabitForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: Omit<CustomHabit, "id" | "order">;
  onSubmit: (data: Omit<CustomHabit, "id" | "order">) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [label, setLabel] = useState(initial.label);
  const [sublabel, setSublabel] = useState(initial.sublabel ?? "");
  const [icon, setIcon] = useState(initial.icon);
  const [color, setColor] = useState(initial.color);
  const [bg, setBg] = useState(initial.bg);
  const [border, setBorder] = useState(initial.border);
  const [goal, setGoal] = useState(initial.goal);
  const [section, setSection] = useState<"daily" | "devotional">(initial.section);

  function selectColor(opt: typeof COLOR_OPTIONS[0]) {
    setColor(opt.color);
    setBg(opt.bg);
    setBorder(opt.border);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onSubmit({ label: label.trim(), sublabel: sublabel.trim() || undefined, icon, color, bg, border, goal, section });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Habit name *"
          required
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          value={sublabel}
          onChange={(e) => setSublabel(e.target.value)}
          placeholder="Sublabel (optional)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Icon picker */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              className={cn(
                "w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all",
                icon === e ? "ring-2 ring-indigo-500 bg-indigo-50 scale-110" : "hover:bg-gray-100"
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Color</p>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.color}
              type="button"
              onClick={() => selectColor(opt)}
              className={cn(
                "w-7 h-7 rounded-full transition-all",
                color === opt.color && "ring-2 ring-offset-2 ring-gray-500 scale-125"
              )}
              style={{ backgroundColor: opt.color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        {/* Section */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Section</p>
          <div className="flex gap-1">
            {(["daily", "devotional"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSection(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                  section === s ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Weekly goal (days)</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setGoal(n)}
                className={cn(
                  "w-8 h-8 rounded-lg text-xs font-bold transition-colors",
                  goal === n ? "text-white" : "bg-white border border-gray-200 text-gray-600"
                )}
                style={goal === n ? { backgroundColor: color } : {}}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="ml-auto">
          <p className="text-xs text-gray-500 mb-1">Preview</p>
          <div
            className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-2xl", bg)}
            style={{ border: `2px solid ${border}` }}
          >
            {icon}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!label.trim()}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
