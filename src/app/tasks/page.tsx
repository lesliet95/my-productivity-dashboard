export const dynamic = "force-dynamic";

import { getTasks } from "@/lib/actions/tasks";
import TaskList from "@/components/TaskList";
import GoogleCalendarSync from "@/components/GoogleCalendarSync";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { TaskCategory } from "@/lib/taskCategories";

const PARTNER_CATEGORIES: TaskCategory[] = ["Home", "Admin"];

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const role = (session as { role?: string } | null)?.role;
  const isPartner = role === "partner";

  const allTasks = await getTasks();
  const tasks = isPartner
    ? allTasks.filter((t) => t.category && PARTNER_CATEGORIES.includes(t.category as TaskCategory))
    : allTasks;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isPartner ? "Home & Admin tasks · " : ""}{completed} of {total} completed
            {high > 0 && ` · ${high} high priority`}
          </p>
        </div>
        {!isPartner && <GoogleCalendarSync />}
      </div>
      <TaskList initialTasks={tasks} partnerCategories={isPartner ? PARTNER_CATEGORIES : undefined} />
    </div>
  );
}
