"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  createEvent, deleteEvent, extractEventFromUrl, setEventCalendarSync, type Event,
} from "@/lib/actions/events";
import { Plus, Trash2, X, ExternalLink, Wand2, Loader } from "lucide-react";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(time: string | null) {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Add form ─────────────────────────────────────────────────────────────────

function AddEventForm({ onAdd, onClose }: {
  onAdd: (event: Omit<Event, "id" | "created_at" | "google_event_id">) => Promise<void>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  async function handleExtract() {
    if (!url.trim()) return;
    setExtracting(true);
    try {
      const data = await extractEventFromUrl(url.trim());
      setTitle(data.title);
      setDate(data.date ?? "");
      setTime(data.time ?? "");
      setLocation(data.location ?? "");
      setDescription(data.description ?? "");
      setShowFields(true);
      toast("Event details extracted ✓");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't extract event details", "error");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    try {
      await onAdd({
        title: title.trim(),
        date,
        time: time || null,
        location: location.trim() || null,
        description: description.trim() || null,
        source_url: url.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-5" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an event link (Eventbrite, Meetup, a blog post…)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white"
          />
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !url.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50 transition-colors shrink-0"
            style={{ background: "var(--slate)" }}
          >
            {extracting ? <Loader size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {extracting ? "Extracting…" : "Extract details"}
          </button>
        </div>

        {(showFields || title) && (
          <div className="grid grid-cols-2 gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title"
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)"
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes (optional)"
              className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
          <button type="submit" disabled={!title.trim() || !date || saving}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: "var(--mahogany)" }}>
            {saving ? "Adding…" : "Add Event"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

export default function EventsList({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [, startTransition] = useTransition();
  const { toast } = useToast();

  const sorted = [...events].sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));

  async function handleAdd(data: Omit<Event, "id" | "created_at" | "google_event_id">) {
    try {
      const created = await createEvent(data);
      setEvents((prev) => [...prev, created]);
      setShowForm(false);
      toast("Event added ✓");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't add event", "error");
    }
  }

  function handleDelete(id: number) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast("Event deleted", "delete");
    startTransition(() => deleteEvent(id));
  }

  async function handleToggleCalendar(id: number, checked: boolean) {
    setSyncingIds((prev) => new Set(prev).add(id));
    try {
      const { google_event_id } = await setEventCalendarSync(id, checked);
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, google_event_id } : e)));
      toast(checked ? "Added to Google Calendar ✓" : "Removed from Google Calendar");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Calendar sync failed", "error");
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--mahogany)" }}>
          <Plus size={15} /> Add Event
        </button>
      </div>

      {showForm && <AddEventForm onAdd={handleAdd} onClose={() => setShowForm(false)} />}

      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No events yet</p>
          <p className="text-sm mt-1">Paste a link above to pull in the title, date, and time automatically.</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "var(--card-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Title", "Date", "Time", "Location", "Link", "Add to Google Calendar", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((event) => {
                const syncing = syncingIds.has(event.id);
                return (
                  <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-gray-900">{event.title}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDate(event.date)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTime(event.time)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{event.location ?? "—"}</td>
                    <td className="px-4 py-3">
                      {event.source_url ? (
                        <a href={event.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--slate)" }} className="hover:opacity-70">
                          <ExternalLink size={14} />
                        </a>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {syncing ? (
                        <Loader size={16} className="animate-spin text-gray-400 inline-block" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={!!event.google_event_id}
                          onChange={(e) => handleToggleCalendar(event.id, e.target.checked)}
                          className="w-4 h-4 cursor-pointer"
                          style={{ accentColor: "var(--mahogany)" }}
                          title={event.google_event_id ? "Remove from Google Calendar" : "Add to Google Calendar"}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(event.id)} className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
