export const dynamic = "force-dynamic";

import { getTasks } from "@/lib/actions/tasks";
import { getHabits } from "@/lib/actions/habits";
import { getGoals } from "@/lib/actions/goals";
import { getNotes } from "@/lib/actions/notes";
import { CheckSquare, Zap, Target, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [tasks, habits, goals, notes] = await Promise.all([
    getTasks(),
    getHabits(),
    getGoals(),
    getNotes(),
  ]);

  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const habitsCompletedToday = habits.filter((h) => h.completed_today).length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const avgGoalProgress =
    goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
      : 0;

  const overdueTasks = tasks.filter(
    (t) =>
      !t.completed &&
      t.due_date &&
      new Date(t.due_date) < new Date(new Date().toDateString())
  );

  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Good day!</h1>
        <p className="text-gray-500 mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          href="/tasks"
          icon={<CheckSquare className="text-blue-500" size={22} />}
          label="Tasks Pending"
          value={pendingTasks}
          sub={`${completedTasks} completed`}
          bg="bg-blue-50"
        />
        <StatCard
          href="/habits"
          icon={<Zap className="text-purple-500" size={22} />}
          label="Habits Today"
          value={`${habitsCompletedToday}/${habits.length}`}
          sub={habits.length > 0 ? `${Math.round((habitsCompletedToday / habits.length) * 100)}% done` : "No habits yet"}
          bg="bg-purple-50"
        />
        <StatCard
          href="/goals"
          icon={<Target className="text-green-500" size={22} />}
          label="Active Goals"
          value={activeGoals}
          sub={`${avgGoalProgress}% avg progress`}
          bg="bg-green-50"
        />
        <StatCard
          href="/notes"
          icon={<FileText className="text-amber-500" size={22} />}
          label="Notes"
          value={notes.length}
          sub="total notes"
          bg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Section title="Upcoming Tasks" href="/tasks" icon={<CheckSquare size={16} />}>
          {upcomingTasks.length === 0 && pendingTasks === 0 ? (
            <EmptyState text="No pending tasks — great job!" />
          ) : upcomingTasks.length === 0 ? (
            <EmptyState text="No tasks with due dates set." />
          ) : (
            <ul className="space-y-2">
              {upcomingTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <PriorityDot priority={task.priority} />
                    <span className="text-sm text-gray-800 truncate">{task.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {formatDate(task.due_date!)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {overdueTasks.length > 0 && (
            <p className="mt-3 text-xs text-red-500 font-medium">
              ⚠ {overdueTasks.length} overdue task{overdueTasks.length > 1 ? "s" : ""}
            </p>
          )}
        </Section>

        {/* Habits Today */}
        <Section title="Habits Today" href="/habits" icon={<Zap size={16} />}>
          {habits.length === 0 ? (
            <EmptyState text="No habits yet. Add one to get started!" />
          ) : (
            <ul className="space-y-2">
              {habits.filter((h) => h.frequency === "daily").slice(0, 6).map((habit) => (
                <li key={habit.id} className="flex items-center gap-3 py-1.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className={`text-sm flex-1 ${habit.completed_today ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {habit.name}
                  </span>
                  {habit.completed_today ? (
                    <span className="text-xs text-green-600 font-medium">Done ✓</span>
                  ) : (
                    <span className="text-xs text-gray-400">Pending</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Goals Progress */}
        <Section title="Goals Progress" href="/goals" icon={<TrendingUp size={16} />}>
          {goals.filter((g) => g.status === "active").length === 0 ? (
            <EmptyState text="No active goals. Set one to stay on track!" />
          ) : (
            <ul className="space-y-3">
              {goals.filter((g) => g.status === "active").slice(0, 4).map((goal) => (
                <li key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-800 truncate">{goal.title}</span>
                    <span className="text-gray-500 shrink-0 ml-2">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Recent Notes */}
        <Section title="Recent Notes" href="/notes" icon={<FileText size={16} />}>
          {notes.length === 0 ? (
            <EmptyState text="No notes yet. Start capturing ideas!" />
          ) : (
            <ul className="space-y-2">
              {notes.slice(0, 4).map((note) => (
                <li key={note.id} className="py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium text-gray-800">{note.title}</p>
                  {note.content && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{note.content}</p>
                  )}
                  {note.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  sub,
  bg,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  bg: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </Link>
  );
}

function Section({
  title,
  href,
  icon,
  children,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          {icon}
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        <Link href={href} className="text-xs text-indigo-600 hover:underline">
          View all →
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400 py-4 text-center">{text}</p>;
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-red-400",
    medium: "bg-yellow-400",
    low: "bg-gray-300",
  };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${colors[priority] ?? "bg-gray-300"}`} />;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff}d overdue`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
