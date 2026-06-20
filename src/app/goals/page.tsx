export const dynamic = "force-dynamic";

import { getGoals } from "@/lib/actions/goals";
import GoalBoard from "@/components/GoalBoard";

export default async function GoalsPage() {
  const goals = await getGoals();

  const active = goals.filter((g) => g.status === "active").length;
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <p className="text-sm text-gray-500 mt-1">
          {active} active · {completed} completed
        </p>
      </div>
      <GoalBoard initialGoals={goals} />
    </div>
  );
}
