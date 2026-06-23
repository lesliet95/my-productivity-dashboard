export const dynamic = "force-dynamic";

import { getHabitData } from "@/lib/actions/customHabits";
import HabitGrid from "@/components/HabitGrid";

export default async function HabitTrackerPage() {
  const data = await getHabitData();

  const totalHabits = data.habits.length;
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = data.habits.filter((h) =>
    data.logs.some((l) => l.habitId === h.id && l.date === today)
  ).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">
          {doneToday}/{totalHabits} habits done today
        </p>
      </div>
      <HabitGrid initialData={data} />
    </div>
  );
}
