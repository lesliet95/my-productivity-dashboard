"use client";

import { useState, useTransition } from "react";
import {
  addBucketItem, toggleBucketItem, deleteBucketItem, updateBucketItem,
  type BucketListItem, type BucketListData,
} from "@/lib/actions/bucketList";
import { Plus, Trash2, X, List, LayoutGrid, ImageIcon, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = ["Travel", "Experience", "Career", "Personal", "Health", "Creative", "Financial"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_STYLES: Record<Category, { pill: string; dot: string; bg: string; border: string; text: string }> = {
  Travel:     { pill: "bg-sky-100 text-sky-700",      dot: "bg-sky-400",    bg: "bg-sky-50",    border: "border-sky-200",    text: "text-sky-800" },
  Experience: { pill: "bg-purple-100 text-purple-700", dot: "bg-purple-400", bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800" },
  Career:     { pill: "bg-blue-100 text-blue-700",     dot: "bg-blue-400",   bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800" },
  Personal:   { pill: "bg-rose-100 text-rose-700",     dot: "bg-rose-400",   bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-800" },
  Health:     { pill: "bg-green-100 text-green-700",   dot: "bg-green-400",  bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800" },
  Creative:   { pill: "bg-pink-100 text-pink-700",     dot: "bg-pink-400",   bg: "bg-pink-50",   border: "border-pink-200",   text: "text-pink-800" },
  Financial:  { pill: "bg-amber-100 text-amber-700",   dot: "bg-amber-400",  bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800" },
};

const CATEGORY_EMOJIS: Record<Category, string> = {
  Travel: "✈️", Experience: "⭐", Career: "🚀", Personal: "🌱",
  Health: "💪", Creative: "🎨", Financial: "💰",
};

// ── Vision Board Card ──────────────────────────────────────────────────────────

function VisionCard({ item, onToggle, onDelete, onUpdate }: {
  item: BucketListItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<BucketListItem, "imageUrl">>) => void;
}) {
  const [editingImage, setEditingImage] = useState(false);
  const [imgDraft, setImgDraft] = useState(item.imageUrl ?? "");
  const [imgError, setImgError] = useState(false);
  const style = item.category ? CATEGORY_STYLES[item.category as Category] : CATEGORY_STYLES.Experience;

  function saveImage() {
    const url = imgDraft.trim();
    onUpdate(item.id, { imageUrl: url || undefined });
    setEditingImage(false);
    setImgError(false);
  }

  const hasImage = !!item.imageUrl && !imgError;

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden group break-inside-avoid mb-3 border transition-all duration-200",
      hasImage ? "border-transparent shadow-md hover:shadow-xl" : cn("border", style.border, style.bg),
    )} style={{ minHeight: hasImage ? 200 : 120 }}>

      {/* Background image */}
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl!}
            alt={item.text}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      )}

      {/* Completion overlay */}
      {item.completed && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
          <div className="bg-white/90 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
            <Check size={22} className="text-green-600" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "relative z-10 p-4 flex flex-col",
        hasImage ? "min-h-[200px] justify-end" : "min-h-[120px] justify-between",
      )}>
        {/* Top row: category emoji + actions */}
        {!hasImage && (
          <div className="flex items-start justify-between mb-2">
            <span className="text-2xl">{CATEGORY_EMOJIS[item.category as Category] ?? "⭐"}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingImage(true)} className="p-1 rounded-lg bg-white/80 text-gray-500 hover:text-mahogany transition-colors">
                <ImageIcon size={13} />
              </button>
              <button onClick={() => onDelete(item.id)} className="p-1 rounded-lg bg-white/80 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Item text */}
        <p className={cn(
          "font-semibold leading-snug",
          hasImage ? "text-white text-sm drop-shadow" : cn("text-sm", style.text),
          item.completed && "opacity-60",
        )}>
          {item.text}
        </p>

        {/* Bottom row */}
        <div className={cn("flex items-center justify-between mt-2", !hasImage && "")}>
          {item.category && (
            <span className={cn(
              "text-[10px] font-semibold uppercase tracking-wider",
              hasImage ? "text-white/70" : style.text,
            )}>
              {item.category}
            </span>
          )}
          {item.completed && item.completedAt && (
            <span className={cn("text-[10px]", hasImage ? "text-white/60" : "text-gray-400")}>
              ✓ {new Date(item.completedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Image overlay actions (when has image) */}
      {hasImage && (
        <div className="absolute top-3 right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingImage(true)} className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors">
            <Pencil size={11} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-600/80 transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Complete button */}
      <button
        onClick={() => onToggle(item.id)}
        title={item.completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "absolute bottom-3 right-3 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
          "opacity-0 group-hover:opacity-100",
          item.completed
            ? "bg-green-500 border-green-500 text-white"
            : hasImage
              ? "bg-white/20 border-white/60 hover:bg-white/40"
              : cn("border-current", style.text, "bg-white/60 hover:bg-white"),
        )}
      >
        {item.completed && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Image URL editor */}
      {editingImage && (
        <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-3 p-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-white text-xs font-medium">Paste an image URL</p>
          <input
            autoFocus
            value={imgDraft}
            onChange={(e) => setImgDraft(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full text-xs bg-white/10 border border-white/30 text-white placeholder-white/40 rounded-lg px-3 py-2 focus:outline-none focus:border-white/60"
            onKeyDown={(e) => { if (e.key === "Enter") saveImage(); if (e.key === "Escape") setEditingImage(false); }}
          />
          <div className="flex gap-2">
            <button onClick={() => setEditingImage(false)} className="text-xs text-white/60 hover:text-white px-3 py-1">Cancel</button>
            {item.imageUrl && (
              <button onClick={() => { setImgDraft(""); onUpdate(item.id, { imageUrl: undefined }); setEditingImage(false); }}
                className="text-xs text-red-400 hover:text-red-300 px-3 py-1">Remove</button>
            )}
            <button onClick={saveImage} className="text-xs bg-white text-gray-900 font-medium px-3 py-1 rounded-lg hover:bg-gray-100">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── List Item ─────────────────────────────────────────────────────────────────

function ListItem({ item, onToggle, onDelete }: {
  item: BucketListItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const style = item.category ? CATEGORY_STYLES[item.category as Category] : null;
  return (
    <li className={cn("flex items-center gap-3 border rounded-xl px-4 py-3 group transition-all", item.completed && "opacity-60")}>
      <button
        onClick={() => onToggle(item.id)}
        className={cn(
          "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
          item.completed ? "bg-mahogany border-mahogany" : "border-gray-300 hover:border-mahogany",
        )}
      >
        {item.completed && <Check size={10} className="text-white" strokeWidth={3} />}
      </button>
      <span className={cn("flex-1 text-sm", item.completed ? "line-through text-gray-400" : "text-gray-800")}>{item.text}</span>
      {style && (
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", style.pill)}>{item.category}</span>
      )}
      {item.completed && item.completedAt && (
        <span className="text-xs text-gray-400 shrink-0">
          ✓ {new Date(item.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )}
      <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 size={14} />
      </button>
    </li>
  );
}

// ── Add Form ──────────────────────────────────────────────────────────────────

function AddItemForm({ onAdd, onClose }: {
  onAdd: (item: { text: string; category: Category; imageUrl?: string }) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("Experience");
  const [imageUrl, setImageUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), category, imageUrl: imageUrl.trim() || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-5" style={{ background: "rgba(110,61,35,0.05)", borderColor: "rgba(110,61,35,0.2)" }}>
      <div className="space-y-3">
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} required
          placeholder="Something you want to do before you die…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
          style={{ "--tw-ring-color": "rgba(110,61,35,0.35)" } as React.CSSProperties} />
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional — paste any photo link)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white text-gray-600 placeholder-gray-300"
          style={{ "--tw-ring-color": "rgba(110,61,35,0.25)" } as React.CSSProperties} />
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={cn("text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                category === cat ? cn(CATEGORY_STYLES[cat].pill, "ring-2 ring-offset-1 ring-current") : "bg-gray-100 text-gray-500 hover:bg-gray-200")}>
              {CATEGORY_EMOJIS[cat]} {cat}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
          <button type="submit" disabled={!text.trim()}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: "#6e3d23" }}>
            Add to Board
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function BucketList({ initialData }: { initialData: BucketListData }) {
  const [items, setItems] = useState(initialData.items);
  const [view, setView] = useState<"board" | "list">("board");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [showDone, setShowDone] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const filtered = items
    .filter((i) => {
      if (!showDone && i.completed) return false;
      if (filter !== "all" && i.category !== filter) return false;
      return true;
    })
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));

  // Group by category for vision board
  const grouped = CATEGORIES.reduce<Record<string, BucketListItem[]>>((acc, cat) => {
    const catItems = filtered.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});
  const uncategorized = filtered.filter((i) => !i.category || !CATEGORIES.includes(i.category as Category));

  function handleToggle(id: string) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: !i.completed, completedAt: !i.completed ? new Date().toISOString() : undefined } : i));
    startTransition(() => toggleBucketItem(id));
  }
  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => deleteBucketItem(id));
  }
  function handleUpdate(id: string, patch: Partial<Pick<BucketListItem, "imageUrl">>) {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
    startTransition(() => updateBucketItem(id, patch));
  }
  function handleAdd(item: { text: string; category: Category; imageUrl?: string }) {
    const optimistic: BucketListItem = { id: crypto.randomUUID(), text: item.text, completed: false, category: item.category, imageUrl: item.imageUrl };
    setItems((prev) => [...prev, optimistic]);
    setShowForm(false);
    startTransition(() => addBucketItem(item));
  }

  return (
    <div>
      {/* Progress bar */}
      <div className="border rounded-xl p-5 mb-6" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: "var(--obsidian)" }}>{completed} of {total} completed</span>
          <span className="text-2xl font-bold" style={{ color: "var(--mahogany)" }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(157,121,96,0.12)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "var(--mahogany)" }} />
        </div>
        <div className="flex gap-3 mt-4 flex-wrap">
          {CATEGORIES.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (!catItems.length) return null;
            const catDone = catItems.filter((i) => i.completed).length;
            return (
              <div key={cat} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={cn("w-2 h-2 rounded-full shrink-0", CATEGORY_STYLES[cat].dot)} />
                {cat}: {catDone}/{catItems.length}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Category filters */}
        <div className="flex gap-1 flex-wrap flex-1">
          <button onClick={() => setFilter("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === "all" ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            style={filter === "all" ? { background: "var(--obsidian)" } : {}}>
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setFilter(filter === cat ? "all" : cat)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === cat ? "text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              style={filter === cat ? { background: "var(--obsidian)" } : {}}>
              {CATEGORY_EMOJIS[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="rounded" />
            Completed
          </label>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button onClick={() => setView("board")}
              className={cn("px-2.5 py-1.5 transition-colors", view === "board" ? "text-white" : "bg-white text-gray-400 hover:text-gray-600")}
              style={view === "board" ? { background: "var(--mahogany)" } : {}}
              title="Vision Board">
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setView("list")}
              className={cn("px-2.5 py-1.5 transition-colors border-l border-gray-200", view === "list" ? "text-white" : "bg-white text-gray-400 hover:text-gray-600")}
              style={view === "list" ? { background: "var(--mahogany)" } : {}}
              title="List">
              <List size={14} />
            </button>
          </div>

          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--mahogany)" }}>
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {showForm && <AddItemForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">{total === 0 ? "Your vision board is empty" : "Nothing matches this filter"}</p>
          <p className="text-sm mt-1">{total === 0 ? "Add the things you dream of doing." : "Try a different filter."}</p>
        </div>
      ) : view === "list" ? (
        <ul className="space-y-2">
          {filtered.map((item) => (
            <ListItem key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </ul>
      ) : (
        /* Vision Board — grouped by category */
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catItems]) => {
            const style = CATEGORY_STYLES[cat as Category];
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_EMOJIS[cat as Category]}</span>
                  <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--slate)" }}>{cat}</h2>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-1", style.pill)}>
                    {catItems.filter((i) => i.completed).length}/{catItems.length}
                  </span>
                  <div className="flex-1 h-px ml-2" style={{ background: "var(--card-border)" }} />
                </div>
                {/* Masonry-style grid using CSS columns */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
                  {catItems.map((item) => (
                    <VisionCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />
                  ))}
                </div>
              </div>
            );
          })}
          {uncategorized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--slate)" }}>Other</h2>
                <div className="flex-1 h-px ml-2" style={{ background: "var(--card-border)" }} />
              </div>
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
                {uncategorized.map((item) => (
                  <VisionCard key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onUpdate={handleUpdate} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
