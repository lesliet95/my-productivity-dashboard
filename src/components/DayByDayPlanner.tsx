"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { addWeddingDay, removeWeddingDay, updateWeddingDayField } from "@/lib/actions/weddingDays";
import type { WeddingDayPlan } from "@/lib/types/wedding";

function DayField({
  value, placeholder, onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft !== value) onCommit(draft);
  }

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      rows={4}
      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-300 bg-white resize-none"
    />
  );
}

function DayRow({ day, onRemove }: { day: WeddingDayPlan; onRemove: (id: string) => void }) {
  const [, startTransition] = useTransition();
  const [label, setLabel] = useState(day.label);

  function commitLabel() {
    if (label !== day.label) startTransition(() => updateWeddingDayField(day.id, "label", label));
  }

  const columns: { key: "time" | "tasks" | "notes"; title: string; placeholder: string }[] = [
    { key: "time", title: "Time", placeholder: "e.g. 9:00 AM – 5:00 PM" },
    { key: "tasks", title: "Tasks", placeholder: "What needs to happen…" },
    { key: "notes", title: "Notes", placeholder: "Anything else…" },
  ];

  return (
    <div className="w-full border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-rose-50">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={commitLabel}
          className="flex-1 text-sm font-bold text-rose-700 bg-transparent focus:outline-none border-b border-transparent focus:border-rose-300"
        />
        <button
          onClick={() => onRemove(day.id)}
          className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
        {columns.map((col) => (
          <div key={col.key}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              {col.title}
            </p>
            <DayField
              value={day[col.key]}
              placeholder={col.placeholder}
              onCommit={(v) => startTransition(() => updateWeddingDayField(day.id, col.key, v))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DayByDayPlanner({ initialDays }: { initialDays: WeddingDayPlan[] }) {
  const [days, setDays] = useState(initialDays);
  const [, startTransition] = useTransition();

  function handleRemove(id: string) {
    setDays((prev) => prev.filter((d) => d.id !== id));
    startTransition(() => removeWeddingDay(id));
  }

  function handleAdd() {
    const optimistic: WeddingDayPlan = { id: `tmp-${Date.now()}`, label: "New day", time: "", tasks: "", notes: "" };
    setDays((prev) => [...prev, optimistic]);
    startTransition(async () => {
      await addWeddingDay(optimistic.label);
    });
  }

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <DayRow key={day.id} day={day} onRemove={handleRemove} />
      ))}
      {days.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">No days yet. Add one below.</p>
      )}
      <button
        onClick={handleAdd}
        className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-medium px-3 py-2 border border-dashed border-rose-200 rounded-xl w-full justify-center hover:bg-rose-50 transition-colors"
      >
        <Plus size={12} /> Add day
      </button>
    </div>
  );
}
