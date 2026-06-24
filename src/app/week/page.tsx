export const dynamic = "force-dynamic";

import { getWeekData } from "@/lib/actions/weekView";
import { getTasks } from "@/lib/actions/tasks";
import WeekView from "@/components/WeekView";

function getMondayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export default async function WeekPage() {
  const weekKey = getMondayKey();
  const [data, tasks] = await Promise.all([getWeekData(weekKey), getTasks()]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Week View</h1>
        <p className="text-sm text-gray-500 mt-1">Your weekly command center</p>
      </div>
      <WeekView initialData={data} initialWeekKey={weekKey} initialTasks={tasks} />
    </div>
  );
}
