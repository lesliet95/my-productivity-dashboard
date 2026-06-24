"use client";

import { useState, useTransition, useCallback } from "react";
import { toggleLog, saveManageData } from "@/lib/actions/customHabits";
import type { CustomHabit, HabitData, HabitLog } from "@/lib/types/habits";
import { Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import ManageHabits from "./ManageHabits";

// ── date helpers ──────────────────────────────────────────────────────────────

function getWeekDates(offset = 0): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isToday(date: Date): boolean {
  return toYMD(date) === toYMD(new Date());
}

// ── scoring ───────────────────────────────────────────────────────────────────

function weekScore(habits: CustomHabit[], logs: HabitLog[], dates: Date[]) {
  if (habits.length === 0) return { pct: 0, total: 0, done: 0 };
  const dateStrs = dates.map(toYMD);
  let totalGoal = 0;
  let totalDone = 0;
  for (const h of habits) {
    totalGoal += h.goal;
    const done = dateStrs.filter((d) =>
      logs.some((l) => l.habitId === h.id && l.date === d)
    ).length;
    totalDone += Math.min(done, h.goal);
  }
  return {
    pct: totalGoal > 0 ? Math.round((totalDone / totalGoal) * 100) : 0,
    total: totalGoal,
    done: totalDone,
  };
}

function habitWeekStats(habit: CustomHabit, logs: HabitLog[], dates: Date[]) {
  const dateStrs = dates.map(toYMD);
  const done = dateStrs.filter((d) =>
    logs.some((l) => l.habitId === habit.id && l.date === d)
  ).length;
  return { done, goal: habit.goal, pct: Math.round((Math.min(done, habit.goal) / habit.goal) * 100) };
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HabitGrid({ initialData }: { initialData: HabitData }) {
  const [data, setData] = useState(initialData);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showManage, setShowManage] = useState(false);
  const [, startTransition] = useTransition();

  const dates = getWeekDates(weekOffset);
  const score = weekScore(data.habits, data.logs, dates);
  const isCurrentWeek = weekOffset === 0;

  const handleToggle = useCallback(
    (habitId: string, date: string) => {
      setData((prev) => {
        const exists = prev.logs.some((l) => l.habitId === habitId && l.date === date);
        const logs = exists
          ? prev.logs.filter((l) => !(l.habitId === habitId && l.date === date))
          : [...prev.logs, { habitId, date }];
        return { ...prev, logs };
      });
      startTransition(() => toggleLog(habitId, date));
    },
    []
  );

  const handleSaveManage = useCallback(
    (habits: CustomHabit[], sectionNames: { daily: string; devotional: string }) => {
      setData((prev) => ({ ...prev, habits, sectionNames }));
      startTransition(() => saveManageData(habits, sectionNames));
    },
    []
  );

  const daily = data.habits
    .filter((h) => h.section === "daily")
    .sort((a, b) => a.order - b.order);
  const devotional = data.habits
    .filter((h) => h.section === "devotional")
    .sort((a, b) => a.order - b.order);

  const weekLabel = isCurrentWeek
    ? "This Week"
    : weekOffset === -1
    ? "Last Week"
    : dates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
      " – " +
      dates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-700 w-32 text-center">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
            disabled={isCurrentWeek}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Overall score */}
        <div className="flex items-center gap-3">
          <ScoreRing pct={score.pct} />
          <div>
            <div className="text-lg font-bold text-gray-900">{score.pct}%</div>
            <div className="text-xs text-gray-400">{score.done}/{score.total} goal days</div>
          </div>
        </div>

        <button
          onClick={() => setShowManage(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings size={15} />
          Manage
        </button>
      </div>

      {data.habits.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No habits yet</p>
          <p className="text-sm mt-1">Click <strong>Manage</strong> to add your first habit.</p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            {/* Day headers */}
            <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}>
              <div className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Habit</div>
              {dates.map((d) => (
                <div
                  key={toYMD(d)}
                  className={cn(
                    "py-3 text-center text-xs font-semibold",
                    isToday(d) ? "text-indigo-600" : "text-gray-400"
                  )}
                >
                  <div>{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                  <div className={cn(
                    "mt-0.5 w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs",
                    isToday(d) ? "bg-indigo-600 text-white font-bold" : "text-gray-500"
                  )}>
                    {d.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {daily.length > 0 && (
              <HabitSection
                title={data.sectionNames?.daily ?? "Daily"}
                habits={daily}
                logs={data.logs}
                dates={dates}
                onToggle={handleToggle}
              />
            )}

            {devotional.length > 0 && (
              <HabitSection
                title={data.sectionNames?.devotional ?? "Devotional"}
                habits={devotional}
                logs={data.logs}
                dates={dates}
                onToggle={handleToggle}
              />
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.habits
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((habit) => {
                const stats = habitWeekStats(habit, data.logs, dates);
                return (
                  <SummaryCard key={habit.id} habit={habit} stats={stats} />
                );
              })}
          </div>
        </>
      )}

      {showManage && (
        <ManageHabits
          habits={data.habits}
          sectionNames={data.sectionNames ?? { daily: "Daily", devotional: "Devotional" }}
          onSave={handleSaveManage}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function HabitSection({
  title,
  habits,
  logs,
  dates,
  onToggle,
}: {
  title: string;
  habits: CustomHabit[];
  logs: HabitLog[];
  dates: Date[];
  onToggle: (habitId: string, date: string) => void;
}) {
  return (
    <>
      <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      {habits.map((habit, i) => (
        <div
          key={habit.id}
          className={cn(
            "grid items-center",
            i < habits.length - 1 && "border-b border-gray-50"
          )}
          style={{ gridTemplateColumns: "200px repeat(7, 1fr)" }}
        >
          {/* Habit label */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <span
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0", habit.bg)}
              style={{ border: `1.5px solid`, borderColor: habit.border }}
            >
              {habit.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{habit.label}</p>
              {habit.sublabel && (
                <p className="text-xs text-gray-400 truncate">{habit.sublabel}</p>
              )}
            </div>
          </div>

          {/* Day cells */}
          {dates.map((d) => {
            const dateStr = toYMD(d);
            const checked = logs.some((l) => l.habitId === habit.id && l.date === dateStr);
            const future = d > new Date() && !isToday(d);
            return (
              <div key={dateStr} className="flex items-center justify-center py-3">
                <button
                  onClick={() => !future && onToggle(habit.id, dateStr)}
                  disabled={future}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    future && "opacity-20 cursor-not-allowed",
                    checked
                      ? "border-transparent scale-110"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  style={checked ? { backgroundColor: habit.color } : {}}
                >
                  {checked && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function SummaryCard({ habit, stats }: { habit: CustomHabit; stats: { done: number; goal: number; pct: number } }) {
  const isComplete = stats.done >= stats.goal;
  return (
    <div
      className={cn("rounded-xl p-4 border transition-all", habit.bg)}
      style={{ borderColor: habit.border }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{habit.icon}</span>
        <span className="text-sm font-semibold text-gray-800 truncate">{habit.label}</span>
      </div>
      <div className="flex items-end justify-between mb-1.5">
        <span className="text-2xl font-bold" style={{ color: habit.color }}>
          {stats.done}<span className="text-sm font-normal text-gray-400">/{stats.goal}</span>
        </span>
        {isComplete && <span className="text-xs font-semibold text-green-600">✓ Goal met!</span>}
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(stats.pct, 100)}%`, backgroundColor: habit.color }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={r} fill="none" stroke="#e5e7eb" strokeWidth={5} />
      <circle
        cx={26} cy={26} r={r}
        fill="none"
        stroke={pct >= 80 ? "#22c55e" : pct >= 50 ? "#6366f1" : "#f97316"}
        strokeWidth={5}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
    </svg>
  );
}
