"use client";

import { useState, useTransition } from "react";
import {
  createPost, updatePost, deletePost,
  type SocialPost, type SocialData, type Platform, type PostStatus,
} from "@/lib/actions/social";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS: Platform[] = ["Instagram", "TikTok", "YouTube", "Twitter/X", "LinkedIn", "Facebook", "Pinterest"];

const PLATFORM_COLORS: Record<Platform, string> = {
  Instagram: "bg-pink-100 text-pink-700",
  TikTok: "bg-gray-900 text-white",
  YouTube: "bg-red-100 text-red-700",
  "Twitter/X": "bg-sky-100 text-sky-700",
  LinkedIn: "bg-blue-100 text-blue-700",
  Facebook: "bg-indigo-100 text-indigo-700",
  Pinterest: "bg-rose-100 text-rose-700",
};

const STATUS_COLORS: Record<PostStatus, string> = {
  idea: "bg-gray-100 text-gray-600",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
  published: "bg-green-100 text-green-700",
};

const STATUSES: PostStatus[] = ["idea", "draft", "scheduled", "published"];

export default function SocialPlanner({ initialData }: { initialData: SocialData }) {
  const [posts, setPosts] = useState(initialData.posts);
  const [showForm, setShowForm] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PostStatus | "all">("all");
  const [, startTransition] = useTransition();

  const filtered = posts.filter((p) => {
    if (filterPlatform !== "all" && p.platform !== filterPlatform) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  const counts: Record<PostStatus, number> = {
    idea: posts.filter((p) => p.status === "idea").length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  function handleAdd(post: SocialPost) {
    setPosts((prev) => [post, ...prev]);
    setShowForm(false);
  }

  function handleUpdate(id: string, updates: Partial<SocialPost>) {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    startTransition(() => updatePost(id, updates));
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    startTransition(() => deletePost(id));
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={cn(
              "rounded-xl p-4 text-left border transition-all",
              filterStatus === s ? "border-indigo-300 bg-indigo-50" : "bg-white border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="text-2xl font-bold text-gray-900">{counts[s]}</div>
            <div className={cn("text-xs font-medium mt-1 px-1.5 py-0.5 rounded-full inline-block capitalize", STATUS_COLORS[s])}>
              {s}
            </div>
          </button>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 flex-wrap flex-1">
          <button
            onClick={() => setFilterPlatform("all")}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filterPlatform === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
          >
            All platforms
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(filterPlatform === p ? "all" : p)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filterPlatform === p ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
        >
          <Plus size={16} />
          Add Post
        </button>
      </div>

      {showForm && (
        <AddPostForm onClose={() => setShowForm(false)} onAdd={handleAdd} />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No posts yet</p>
          <p className="text-sm mt-1">Start by adding a content idea.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  onUpdate,
  onDelete,
}: {
  post: SocialPost;
  onUpdate: (id: string, updates: Partial<SocialPost>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", PLATFORM_COLORS[post.platform])}>
            {post.platform}
          </span>
          <select
            value={post.status}
            onChange={(e) => onUpdate(post.id, { status: e.target.value as PostStatus })}
            className={cn("text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none capitalize", STATUS_COLORS[post.status])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm text-gray-800", !expanded && "line-clamp-2")}>{post.caption}</p>
          {post.scheduled_date && (
            <p className="text-xs text-gray-400 mt-1">
              📅 {new Date(post.scheduled_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {expanded && post.notes && (
            <p className="text-xs text-gray-500 mt-2 border-t border-gray-100 pt-2">{post.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(post.notes || post.caption.length > 100) && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          <button
            onClick={() => onDelete(post.id)}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPostForm({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (post: SocialPost) => void;
}) {
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [caption, setCaption] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<PostStatus>("idea");
  const [scheduledDate, setScheduledDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().replace(/^#/, "").replace(/,$/, "");
      if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caption.trim()) return;
    setLoading(true);
    await createPost({
      platform,
      caption: caption.trim(),
      notes: notes.trim() || undefined,
      status,
      scheduled_date: scheduledDate || undefined,
      tags,
    });
    const optimistic: SocialPost = {
      id: crypto.randomUUID(),
      platform,
      caption: caption.trim(),
      notes: notes.trim(),
      status,
      scheduled_date: scheduledDate || null,
      tags,
      created_at: new Date().toISOString(),
    };
    onAdd(optimistic);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">New Post</h3>

      <div className="flex gap-2 mb-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PostStatus)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white capitalize"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </div>

      <textarea
        autoFocus
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Caption / content…"
        rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        required
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes, ideas, references… (optional)"
        rows={2}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            onClick={() => setTags(tags.filter((t) => t !== tag))}
            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600"
          >
            #{tag} ×
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Add tag, press Enter…"
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !caption.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add Post"}
        </button>
      </div>
    </form>
  );
}
