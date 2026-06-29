export const dynamic = "force-dynamic";

import { getWeddingTasks } from "@/lib/actions/wedding";
import WeddingPlanner from "@/components/WeddingPlanner";
import { Heart } from "lucide-react";

export default async function WeddingPage() {
  const tasks = await getWeddingTasks();
  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-rose-500 fill-rose-500" />
            <h1 className="text-2xl font-bold text-gray-900">Wedding Planning</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">Saturday, August 8, 2026 · {done} of {tasks.length} tasks done</p>
        </div>
      </div>
      <WeddingPlanner initialTasks={tasks} />
    </div>
  );
}
