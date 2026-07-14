"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  createEvents, deleteEvent, extractEventFromUrl, setEventCalendarSync, type Event,
} from "@/lib/actions/events";
import { Plus, Trash2, X, ExternalLink, Wand2, Loader } from "lucide-react";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatTimeRange(time: string | null, endTime: string | null) {
  const start = formatTime(time);
  if (!start) return "—";
  const end = formatTime(endTime);
  return end ? `${start} – ${end}` : start;
}

// ── Add form ─────────────────────────────────────────────────────────────────

type DayDraft = { date: string; time: string; endTime: string };

function AddEventForm({ onAdd, onClose }: {
  onAdd: (events: Omit<Event, "id" | "created_at" | "google_event_id">[]) => Promise<void>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<DayDraft[]>([{ date: "", time: "", endTime: "" }]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  function updateDay(index: number, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function handleExtract() {
    if (!url.trim()) return;
    setExtracting(true);
    try {
      const data = await extractEventFromUrl(url.trim());
      setTitle(data.title);
      setDays(data.days.map((d) => ({ date: d.date ?? "", time: d.time ?? "", endTime: d.end_time ?? "" })));
      setLocation(data.location ?? "");
      setDescription(data.description ?? "");
      setShowFields(true);
      toast(
        data.days.length > 1
          ? `Extracted a ${data.days.length}-day event ✓`
          : "Event details extracted ✓"
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't extract event details", "error");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || days.some((d) => !d.date)) return;
    setSaving(true);
    try {
      await onAdd(
        days.map((d) => ({
          title: title.trim(),
          date: d.date,
          time: d.time || null,
          end_time: d.endTime || null,
          location: location.trim() || null,
          description: description.trim() || null,
          source_url: url.trim() || null,
        }))
      );
    } finally {
      setSaving(false);
    }
  }

  const multiDay = days.length > 1;
  const canSubmit = !!title.trim() && days.every((d) => d.date) && !saving;

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
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />

            {multiDay && (
              <p className="text-xs text-gray-500">
                This runs {days.length} days — one event will be created per day below.
              </p>
            )}

            <div className="space-y-2">
              {days.map((day, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input type="date" value={day.date} onChange={(e) => updateDay(i, { date: e.target.value })} required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                  <input type="time" value={day.time} onChange={(e) => updateDay(i, { time: e.target.value })}
                    placeholder="Start time"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                  <input type="time" value={day.endTime} onChange={(e) => updateDay(i, { endTime: e.target.value })}
                    placeholder="End time"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                </div>
              ))}
            </div>

            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X size={16} /></button>
          <button type="submit" disabled={!canSubmit}
            className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ background: "var(--mahogany)" }}>
            {saving ? "Adding…" : multiDay ? `Add ${days.length} Events` : "Add Event"}
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

  async function handleAdd(data: Omit<Event, "id" | "created_at" | "google_event_id">[]) {
    try {
      const created = await createEvents(data);
      setEvents((prev) => [...prev, ...created]);
      setShowForm(false);
      toast(created.length > 1 ? `${created.length} events added ✓` : "Event added ✓");
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
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { google_event_id } = await setEventCalendarSync(id, checked, timeZone);
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
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatTimeRange(event.time, event.end_time)}</td>
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
