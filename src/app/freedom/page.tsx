export const dynamic = "force-dynamic";

import { getFreedomTasks } from "@/lib/actions/freedom";
import FreedomTaskList from "@/components/FreedomTaskList";
import FreedomCountdown from "@/components/FreedomCountdown";

export default async function FreedomPage() {
  const tasks = await getFreedomTasks();
  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <FreedomCountdown quitDate="2025-08-17" />
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          {completed} of {tasks.length} tasks completed
        </p>
      </div>
      <FreedomTaskList initialTasks={tasks} />
    </div>
  );
}
