"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type Event = {
  id: number;
  title: string;
  date: string;
  time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  source_url: string | null;
  google_event_id: string | null;
  created_at: string;
};

async function ensureTable() {
  await getDb()`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      time TEXT,
      location TEXT,
      description TEXT,
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await getDb()`ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id TEXT`;
  await getDb()`ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TEXT`;
}

export async function getEvents(): Promise<Event[]> {
  await ensureTable();
  const rows = await getDb()`
    SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, end_time, location, description, source_url, google_event_id, created_at
    FROM events
    ORDER BY date ASC, time ASC
  `;
  return rows as Event[];
}

export async function createEvent(
  data: Omit<Event, "id" | "created_at" | "google_event_id">
): Promise<Event> {
  await ensureTable();
  const rows = await getDb()`
    INSERT INTO events (title, date, time, end_time, location, description, source_url)
    VALUES (${data.title}, ${data.date}, ${data.time ?? null}, ${data.end_time ?? null}, ${data.location ?? null}, ${data.description ?? null}, ${data.source_url ?? null})
    RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, end_time, location, description, source_url, google_event_id, created_at
  `;
  revalidatePath("/events");
  return rows[0] as Event;
}

export async function deleteEvent(id: number): Promise<void> {
  const rows = await getDb()`SELECT google_event_id FROM events WHERE id = ${id}`;
  const googleEventId = (rows[0] as { google_event_id: string | null } | undefined)?.google_event_id;
  if (googleEventId) {
    try {
      const calendar = await getCalendarClient();
      await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
    } catch {
      // best-effort cleanup — event row deletion should proceed regardless
    }
  }
  await getDb()`DELETE FROM events WHERE id = ${id}`;
  revalidatePath("/events");
}

// ── Link extraction (free — no API calls) ───────────────────────────────────
//
// Most event platforms (Eventbrite, Meetup, Facebook Events, Ticketmaster,
// WordPress event plugins, etc.) embed schema.org "Event" JSON-LD directly in
// the page, so we parse that rather than paying for an LLM call. If a page
// has no structured data we fall back to Open Graph tags + light regex
// scanning for a date/time in the visible text; anything we can't find is
// just left blank for the user to fill in by hand.

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i");
  return html.match(re)?.[1] ?? null;
}

function findEventNode(data: unknown): Record<string, unknown> | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findEventNode(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const type = obj["@type"];
    if (type === "Event" || (Array.isArray(type) && type.includes("Event"))) return obj;
    if (Array.isArray(obj["@graph"])) return findEventNode(obj["@graph"]);
  }
  return null;
}

function formatLocation(loc: unknown): string | null {
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  if (typeof loc !== "object") return null;
  const l = loc as Record<string, unknown>;
  const name = typeof l.name === "string" ? l.name : null;
  let address: string | null = null;
  if (typeof l.address === "string") {
    address = l.address;
  } else if (l.address && typeof l.address === "object") {
    const a = l.address as Record<string, unknown>;
    address =
      [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode]
        .filter((x) => typeof x === "string" && x)
        .join(", ") || null;
  }
  return [name, address].filter(Boolean).join(" — ") || null;
}

function findEventJsonLd(html: string): Record<string, unknown> | null {
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );
  for (const s of scripts) {
    try {
      const found = findEventNode(JSON.parse(s[1].trim()));
      if (found) return found;
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return null;
}

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function findDateInText(text: string): string | null {
  const named = text.match(new RegExp(`\\b(${MONTHS.join("|")})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "i"));
  if (named) {
    const month = MONTHS.indexOf(named[1].toLowerCase()) + 1;
    return `${named[3]}-${String(month).padStart(2, "0")}-${String(Number(named[2])).padStart(2, "0")}`;
  }
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const slash = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) return `${slash[3]}-${String(Number(slash[1])).padStart(2, "0")}-${String(Number(slash[2])).padStart(2, "0")}`;
  return null;
}

function findTimeInText(text: string): string | null {
  const ampm = text.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const period = ampm[3].toLowerCase();
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${ampm[2]}`;
  }
  const military = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (military) return `${military[1].padStart(2, "0")}:${military[2]}`;
  return null;
}

export type ExtractedEvent = {
  title: string;
  date: string | null;
  time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
};

export async function extractEventFromUrl(url: string): Promise<ExtractedEvent> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("That doesn't look like a valid URL");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let html: string;
  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EventsBot/1.0; +https://vercel.com)" },
    });
    if (!res.ok) throw new Error(`Couldn't load that page (${res.status})`);
    html = (await res.text()).slice(0, 500_000);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("That page took too long to load");
    }
    throw err instanceof Error ? err : new Error("Couldn't load that page");
  } finally {
    clearTimeout(timeout);
  }

  const pageTitle = extractMeta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const metaDescription = extractMeta(html, "og:description");

  // Preferred path: structured schema.org Event data
  const eventNode = findEventJsonLd(html);
  if (eventNode) {
    const name = typeof eventNode.name === "string" ? eventNode.name : null;
    const startDate = typeof eventNode.startDate === "string" ? eventNode.startDate : null;
    const endDate = typeof eventNode.endDate === "string" ? eventNode.endDate : null;
    const description = typeof eventNode.description === "string" ? eventNode.description : null;
    const dateMatch = startDate?.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
    const endMatch = endDate?.match(/T(\d{2}:\d{2})/);

    if (name || dateMatch) {
      return {
        title: name || pageTitle || "Untitled event",
        date: dateMatch?.[1] ?? null,
        time: dateMatch?.[2] ?? null,
        end_time: endMatch?.[1] ?? null,
        location: formatLocation(eventNode.location),
        description: (description ?? metaDescription)?.slice(0, 300) ?? null,
      };
    }
  }

  // Fallback: Open Graph tags + a light scan of the visible text. Some sites
  // (e.g. Facebook, which shows crawlers a stripped-down page with no real
  // body) only surface the date inside the meta description itself, so scan
  // that first before falling through to the rendered body text. There's no
  // reliable way to spot an end time in freeform text, so that's always left
  // for the user to fill in on this path.
  const bodyText = stripHtml(html).slice(0, 6000);
  const scanText = [metaDescription, bodyText].filter(Boolean).join(" ");
  return {
    title: pageTitle || "Untitled event",
    date: findDateInText(scanText),
    time: findTimeInText(scanText),
    end_time: null,
    location: null,
    description: metaDescription,
  };
}

// ── Google Calendar sync ─────────────────────────────────────────────────────

async function getCalendarClient() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) throw new Error("Connect Google Calendar first");
  if ((session as { error?: string }).error === "RefreshAccessTokenError") {
    throw new Error("Google session expired — sign out and back in");
  }
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({ access_token: session.accessToken });
  return google.calendar({ version: "v3", auth });
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function addMinutes(date: string, time: string, minutesToAdd: number): { date: string; time: string } {
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + minutesToAdd;
  let dayOffset = 0;
  while (total >= 24 * 60) {
    total -= 24 * 60;
    dayOffset += 1;
  }
  const newTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  let newDate = date;
  for (let i = 0; i < dayOffset; i++) newDate = nextDay(newDate);
  return { date: newDate, time: newTime };
}

export async function setEventCalendarSync(
  id: number,
  sync: boolean,
  timeZone: string
): Promise<{ google_event_id: string | null }> {
  timeZone = timeZone || "UTC";
  await ensureTable();
  const rows = await getDb()`
    SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, end_time, location, description, source_url, google_event_id
    FROM events WHERE id = ${id}
  `;
  const event = rows[0] as (Event & { google_event_id: string | null }) | undefined;
  if (!event) throw new Error("Event not found");

  const calendar = await getCalendarClient();

  if (sync) {
    if (event.google_event_id) return { google_event_id: event.google_event_id };

    const description =
      [event.description, event.source_url ? `Source: ${event.source_url}` : null].filter(Boolean).join("\n\n") ||
      undefined;

    const requestBody = event.time
      ? (() => {
          const end = event.end_time
            ? { date: event.date, time: event.end_time }
            : addMinutes(event.date, event.time!, 60);
          return {
            summary: event.title,
            location: event.location ?? undefined,
            description,
            start: { dateTime: `${event.date}T${event.time}:00`, timeZone },
            end: { dateTime: `${end.date}T${end.time}:00`, timeZone },
          };
        })()
      : {
          summary: event.title,
          location: event.location ?? undefined,
          description,
          start: { date: event.date },
          end: { date: nextDay(event.date) },
        };

    const created = await calendar.events.insert({ calendarId: "primary", requestBody });
    const googleEventId = created.data.id ?? null;
    await getDb()`UPDATE events SET google_event_id = ${googleEventId} WHERE id = ${id}`;
    revalidatePath("/events");
    return { google_event_id: googleEventId };
  }

  if (event.google_event_id) {
    try {
      await calendar.events.delete({ calendarId: "primary", eventId: event.google_event_id });
    } catch (err: unknown) {
      const status = (err as { code?: number })?.code;
      if (status !== 404 && status !== 410) throw err instanceof Error ? err : new Error("Calendar sync failed");
    }
  }
  await getDb()`UPDATE events SET google_event_id = NULL WHERE id = ${id}`;
  revalidatePath("/events");
  return { google_event_id: null };
}
