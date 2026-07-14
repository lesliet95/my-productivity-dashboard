export const dynamic = "force-dynamic";

import { getEvents } from "@/lib/actions/events";
import EventsList from "@/components/EventsList";
import { CalendarPlus } from "lucide-react";

export default async function EventsPage() {
  const events = await getEvents();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.date >= today).length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <CalendarPlus size={20} style={{ color: "var(--slate)" }} />
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {events.length} event{events.length !== 1 ? "s" : ""} · {upcoming} upcoming
          </p>
        </div>
      </div>
      <EventsList initialEvents={events} />
    </div>
  );
}
