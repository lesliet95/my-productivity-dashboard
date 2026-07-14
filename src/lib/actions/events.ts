"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type Event = {
  id: number;
  title: string;
  date: string;
  time: string | null;
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
}

export async function getEvents(): Promise<Event[]> {
  await ensureTable();
  const rows = await getDb()`
    SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, source_url, google_event_id, created_at
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
    INSERT INTO events (title, date, time, location, description, source_url)
    VALUES (${data.title}, ${data.date}, ${data.time ?? null}, ${data.location ?? null}, ${data.description ?? null}, ${data.source_url ?? null})
    RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, source_url, google_event_id, created_at
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

// ── Link extraction (Claude) ────────────────────────────────────────────────

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

function extractEventJsonLd(html: string): string | null {
  const matches = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const m of matches) {
    if (/"@type"\s*:\s*"Event"/i.test(m[1])) return m[1].slice(0, 3000);
  }
  return null;
}

export type ExtractedEvent = {
  title: string;
  date: string | null;
  time: string | null;
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

  const pageTitle = extractMeta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const metaDescription = extractMeta(html, "og:description");
  const jsonLd = extractEventJsonLd(html);
  const bodyText = stripHtml(html).slice(0, 6000);

  const context = [
    `Page title: ${pageTitle}`,
    metaDescription ? `Meta description: ${metaDescription}` : null,
    jsonLd ? `Structured event data (JSON-LD):\n${jsonLd}` : null,
    `Page text:\n${bodyText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY isn't configured — add it to .env.local");
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const today = new Date().toISOString().slice(0, 10);

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 500,
    system: `You extract event details from web page content. Today's date is ${today}. Respond with ONLY a JSON object (no markdown fences, no commentary) with keys: title (string), date (YYYY-MM-DD, or null if unknown), time (24-hour HH:MM local time, or null if not specified), location (string or null), description (one short sentence, or null). Resolve any relative dates (e.g. "next Saturday") using today's date.`,
    messages: [{ role: "user", content: context }],
  });

  const text = msg.content.find((b) => b.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Couldn't find event details on that page");

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Couldn't parse event details from that page");
  }

  return {
    title: typeof obj.title === "string" && obj.title.trim() ? obj.title.trim() : pageTitle || "Untitled event",
    date: typeof obj.date === "string" && obj.date ? obj.date : null,
    time: typeof obj.time === "string" && obj.time ? obj.time : null,
    location: typeof obj.location === "string" && obj.location ? obj.location : null,
    description: typeof obj.description === "string" && obj.description ? obj.description : null,
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

export async function setEventCalendarSync(id: number, sync: boolean): Promise<{ google_event_id: string | null }> {
  await ensureTable();
  const rows = await getDb()`
    SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') AS date, time, location, description, source_url, google_event_id
    FROM events WHERE id = ${id}
  `;
  const event = rows[0] as (Event & { google_event_id: string | null }) | undefined;
  if (!event) throw new Error("Event not found");

  const calendar = await getCalendarClient();

  if (sync) {
    if (event.google_event_id) return { google_event_id: event.google_event_id };

    const calMeta = await calendar.calendars.get({ calendarId: "primary" });
    const timeZone = calMeta.data.timeZone ?? "UTC";
    const description =
      [event.description, event.source_url ? `Source: ${event.source_url}` : null].filter(Boolean).join("\n\n") ||
      undefined;

    const requestBody = event.time
      ? (() => {
          const end = addMinutes(event.date, event.time!, 60);
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
