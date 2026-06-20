export const dynamic = "force-dynamic";

import { getHabits } from "@/lib/actions/habits";
import HabitTracker from "@/components/HabitTracker";

export default async function HabitsPage() {
  const habits = await getHabits();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Habits</h1>
        <p className="text-sm text-gray-500 mt-1">
          Build consistency with daily and weekly habits
        </p>
      </div>
      <HabitTracker initialHabits={habits} />
    </div>
  );
}
