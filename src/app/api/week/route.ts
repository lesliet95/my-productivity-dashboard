import { NextRequest, NextResponse } from "next/server";
import { getWeekData } from "@/lib/actions/weekView";
import { getTasks } from "@/lib/actions/tasks";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  const [data, tasks] = await Promise.all([getWeekData(key), getTasks()]);
  return NextResponse.json({ ...data, allTasks: tasks });
}
