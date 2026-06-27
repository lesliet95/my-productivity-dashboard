import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Google Calendar event colorId "1" = Lavender
const LAVENDER_COLOR_ID = "1";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: session.accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    // Fetch events from 30 days ago through 90 days ahead
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 90);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 500,
    });

    const lavenderEvents = (res.data.items ?? []).filter(
      (e) => e.colorId === LAVENDER_COLOR_ID
    );

    if (lavenderEvents.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, message: "No lavender events found" });
    }

    // Get existing task titles to avoid duplicates
    const db = getDb();
    const existing = await db`SELECT title FROM tasks`;
    const existingTitles = new Set(existing.map((r) => (r.title as string).toLowerCase()));

    let created = 0;
    let skipped = 0;

    for (const event of lavenderEvents) {
      const title = event.summary?.trim();
      if (!title) { skipped++; continue; }
      if (existingTitles.has(title.toLowerCase())) { skipped++; continue; }

      // Get the date (all-day events use date, timed events use dateTime)
      const rawDate = event.start?.date ?? event.start?.dateTime;
      const dueDate = rawDate ? rawDate.slice(0, 10) : null;

      await db`
        INSERT INTO tasks (title, due_date, priority, category)
        VALUES (${title}, ${dueDate}, 'medium', null)
      `;
      existingTitles.add(title.toLowerCase()); // prevent duplicates within this batch
      created++;
    }

    revalidatePath("/tasks");
    revalidatePath("/week");

    return NextResponse.json({ created, skipped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
