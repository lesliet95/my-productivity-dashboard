export const dynamic = "force-dynamic";

import { getGoals } from "@/lib/actions/goals";
import GoalBoard from "@/components/GoalBoard";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quarterly objectives, broken into key results and weekly milestones
        </p>
      </div>
      <GoalBoard initialGoals={goals} />
    </div>
  );
}
