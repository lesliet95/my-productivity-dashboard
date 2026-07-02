export const dynamic = "force-dynamic";

import { getFreedomTasks } from "@/lib/actions/freedom";
import FreedomTaskList from "@/components/FreedomTaskList";

export default async function FreedomPage() {
  const tasks = await getFreedomTasks();
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prepare for Freedom</h1>
        <p className="text-sm text-gray-500 mt-1">
          {completed} of {tasks.length} completed
        </p>
      </div>
      <FreedomTaskList initialTasks={tasks} />
    </div>
  );
}
