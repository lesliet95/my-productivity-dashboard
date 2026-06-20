"use client";

import { useState, useTransition } from "react";
import { createGoal, updateGoalProgress, deleteGoal, type Goal } from "@/lib/actions/goals";
import { Trash2, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GoalBoard({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleProgress(id: number, progress: number) {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, progress, status: progress >= 100 ? "completed" : g.status }
          : g
      )
    );
    startTransition(() => updateGoalProgress(id, progress));
  }

  function handleDelete(id: number) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    startTransition(() => deleteGoal(id));
  }

  function handleAdd(goal: Goal) {
    setGoals((prev) => [goal, ...prev]);
    setShowForm(false);
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");
  const paused = goals.filter((g) => g.status === "paused");

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {showForm && (
        <AddGoalForm onClose={() => setShowForm(false)} onAdd={handleAdd} />
      )}

      {goals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No goals yet</p>
          <p className="text-sm mt-1">Set meaningful goals and track your progress.</p>
        </div>
      ) : (
        <>
          <GoalSection
            title="Active"
            goals={active}
            onProgress={handleProgress}
            onDelete={handleDelete}
          />
          {completed.length > 0 && (
            <GoalSection
              title="Completed"
              goals={completed}
              onProgress={handleProgress}
              onDelete={handleDelete}
            />
          )}
          {paused.length > 0 && (
            <GoalSection
              title="Paused"
              goals={paused}
              onProgress={handleProgress}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}

function GoalSection({
  title,
  goals,
  onProgress,
  onDelete,
}: {
  title: string;
  goals: Goal[];
  onProgress: (id: number, progress: number) => void;
  onDelete: (id: number) => void;
}) {
  if (goals.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onProgress={onProgress} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({
  goal,
  onProgress,
  onDelete,
}: {
  goal: Goal;
  onProgress: (id: number, progress: number) => void;
  onDelete: (id: number) => void;
}) {
  const [localProgress, setLocalProgress] = useState(goal.progress);
  const [editing, setEditing] = useState(false);

  const isOverdue =
    goal.target_date &&
    goal.status === "active" &&
    new Date(goal.target_date) < new Date(new Date().toDateString());

  const progressColor =
    goal.progress >= 100
      ? "bg-green-500"
      : goal.progress >= 66
      ? "bg-blue-500"
      : goal.progress >= 33
      ? "bg-yellow-500"
      : "bg-orange-400";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{goal.title}</h3>
          {goal.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-gray-300 hover:text-red-400 transition-colors ml-2"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress</span>
          <span className="font-medium text-gray-700">{localProgress}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressColor)}
            style={{ width: `${localProgress}%` }}
          />
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={localProgress}
            onChange={(e) => setLocalProgress(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <button
            onClick={() => {
              onProgress(goal.id, localProgress);
              setEditing(false);
            }}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => { setLocalProgress(goal.progress); setEditing(false); }}
            className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {goal.target_date && (
              <>
                <Calendar size={11} />
                <span className={cn(isOverdue && "text-red-500 font-medium")}>
                  {isOverdue ? "Overdue · " : ""}
                  {new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
          {goal.status !== "completed" && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Update progress
            </button>
          )}
          {goal.status === "completed" && (
            <span className="text-xs text-green-600 font-medium">✓ Completed</span>
          )}
        </div>
      )}
    </div>
  );
}

function AddGoalForm({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await createGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      target_date: targetDate || undefined,
    });
    const optimistic: Goal = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim() || null,
      target_date: targetDate || null,
      progress: 0,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onAdd(optimistic);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New Goal</h3>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Goal title"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />
      <div className="flex gap-2 mb-3">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          <Calendar size={14} />
          Target date
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Goal"}
        </button>
      </div>
    </form>
  );
}
