"use client";

import { useState, useTransition } from "react";
import { addBucketItem, toggleBucketItem, deleteBucketItem, type BucketListItem, type BucketListData } from "@/lib/actions/bucketList";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Travel", "Experience", "Career", "Personal", "Health", "Creative", "Financial"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_STYLES: Record<Category, { pill: string; dot: string }> = {
  Travel:     { pill: "bg-sky-100 text-sky-700",      dot: "bg-sky-400" },
  Experience: { pill: "bg-purple-100 text-purple-700", dot: "bg-purple-400" },
  Career:     { pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  Personal:   { pill: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-400" },
  Health:     { pill: "bg-green-100 text-green-700",   dot: "bg-green-400" },
  Creative:   { pill: "bg-pink-100 text-pink-700",     dot: "bg-pink-400" },
  Financial:  { pill: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
};

export default function BucketList({ initialData }: { initialData: BucketListData }) {
  const [items, setItems] = useState(initialData.items);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [showDone, setShowDone] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const filtered = items.filter((i) => {
    if (!showDone && i.completed) return false;
    if (filter !== "all" && i.category !== filter) return false;
    return true;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });

  function handleToggle(id: string) {
    setItems((prev) => prev.map((i) =>
      i.id === id
        ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : undefined }
        : i
    ));
    startTransition(() => toggleBucketItem(id));
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => deleteBucketItem(id));
  }

  function handleAdd(item: { text: string; category: Category }) {
    const optimistic: BucketListItem = { id: crypto.randomUUID(), text: item.text, completed: false, category: item.category };
    setItems((prev) => [...prev, optimistic]);
    setShowForm(false);
    startTransition(() => addBucketItem(item));
  }

  return (
    <div>
      {/* Progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">{completed} of {total} completed</span>
          <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Category breakdown */}
        {total > 0 && (
          <div className="flex gap-3 mt-4 flex-wrap">
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;
              const catDone = catItems.filter((i) => i.completed).length;
              return (
                <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", CATEGORY_STYLES[cat].dot)} />
                  {cat}: {catDone}/{catItems.length}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          <button
            onClick={() => setFilter("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? "all" : cat)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
              className="rounded"
            />
            Show completed
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <AddItemForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">{total === 0 ? "Your bucket list is empty" : "No items match this filter"}</p>
          <p className="text-sm mt-1">{total === 0 ? "Add something you've always wanted to do." : "Try a different filter or show completed items."}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <BucketItem
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BucketItem({
  item,
  onToggle,
  onDelete,
}: {
  item: BucketListItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const style = item.category ? CATEGORY_STYLES[item.category as Category] : null;

  return (
    <li className={cn(
      "flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 group transition-all",
      item.completed && "opacity-60"
    )}>
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
          item.completed ? "bg-indigo-500 border-indigo-500" : "border-gray-300 hover:border-indigo-400"
        )}
      >
        {item.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className={cn("flex-1 text-sm", item.completed ? "line-through text-gray-400" : "text-gray-800")}>
        {item.text}
      </span>

      {style && (
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", style.pill)}>
          {item.category}
        </span>
      )}

      {item.completed && item.completedAt && (
        <span className="text-xs text-gray-400 shrink-0">
          ✓ {new Date(item.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )}

      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

function AddItemForm({ onAdd, onClose }: { onAdd: (item: { text: string; category: Category }) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("Experience");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), category });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Something you want to do before you die…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                  category === cat ? CATEGORY_STYLES[cat].pill + " ring-2 ring-offset-1 ring-current" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </form>
  );
}
