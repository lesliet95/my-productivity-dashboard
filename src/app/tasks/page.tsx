export const dynamic = "force-dynamic";

import { getTasks } from "@/lib/actions/tasks";
import TaskList from "@/components/TaskList";
import GoogleCalendarSync from "@/components/GoogleCalendarSync";

export default async function TasksPage() {
  const tasks = await getTasks();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {completed} of {total} completed
            {high > 0 && ` · ${high} high priority`}
          </p>
        </div>
        <GoogleCalendarSync onSync={() => {}} />
      </div>
      <TaskList initialTasks={tasks} />
    </div>
  );
}
