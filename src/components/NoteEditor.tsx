"use client";

import { useState, useTransition } from "react";
import { createNote, updateNote, deleteNote, type Note } from "@/lib/actions/notes";
import { Trash2, Plus, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NoteEditor({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState<Note | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  function handleDelete(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selected?.id === id) setSelected(null);
    startTransition(() => deleteNote(id));
  }

  function handleSave(updated: Note) {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelected(updated);
    startTransition(() =>
      updateNote(updated.id, {
        title: updated.title,
        content: updated.content,
        tags: updated.tags,
      })
    );
  }

  function handleCreate(note: Note) {
    setNotes((prev) => [note, ...prev]);
    setSelected(note);
    setShowNew(false);
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>
          <button
            onClick={() => { setShowNew(true); setSelected(null); }}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No notes found</p>
          ) : (
            filtered.map((note) => (
              <button
                key={note.id}
                onClick={() => { setSelected(note); setShowNew(false); }}
                className={cn(
                  "w-full text-left px-3 py-3 rounded-lg transition-colors",
                  selected?.id === note.id
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-white border border-gray-200 hover:border-gray-300"
                )}
              >
                <p className="text-sm font-medium text-gray-800 truncate">{note.title}</p>
                {note.content && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{note.content}</p>
                )}
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(note.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
        {showNew ? (
          <NewNoteForm onClose={() => setShowNew(false)} onCreate={handleCreate} />
        ) : selected ? (
          <NoteDetail
            key={selected.id}
            note={selected}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg">Select a note or create a new one</p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-3 text-sm text-indigo-600 hover:underline"
              >
                + New note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteDetail({
  note,
  onSave,
  onDelete,
}: {
  note: Note;
  onSave: (note: Note) => void;
  onDelete: (id: number) => void;
}) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(note.tags);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    setDirty(true);
  }

  function handleSave() {
    onSave({ ...note, title, content, tags });
    setDirty(false);
  }

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !tags.includes(t)) {
        const newTags = [...tags, t];
        setTags(newTags);
        setTagInput("");
        markDirty();
      }
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
    markDirty();
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Add tag…"
            className="text-xs outline-none text-gray-500 placeholder-gray-300 w-20"
          />
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
            >
              Save
            </button>
          )}
          <button onClick={() => onDelete(note.id)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); markDirty(); }}
        className="px-5 pt-4 pb-2 text-xl font-bold text-gray-900 outline-none placeholder-gray-300 w-full"
        placeholder="Title"
      />
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); markDirty(); }}
        className="flex-1 px-5 py-2 text-sm text-gray-700 outline-none resize-none placeholder-gray-300 leading-relaxed"
        placeholder="Start writing…"
      />
    </>
  );
}

function NewNoteForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (note: Note) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await createNote({ title: title.trim(), content: content.trim() });
    const optimistic: Note = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onCreate(optimistic);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">New Note</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="px-5 pt-4 pb-2 text-xl font-bold text-gray-900 outline-none placeholder-gray-300 w-full"
        placeholder="Title"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 px-5 py-2 text-sm text-gray-700 outline-none resize-none placeholder-gray-300 leading-relaxed"
        placeholder="Start writing…"
      />
      <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create Note"}
        </button>
      </div>
    </form>
  );
}
