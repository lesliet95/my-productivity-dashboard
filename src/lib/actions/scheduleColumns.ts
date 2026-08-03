"use server";

import { getData, setData } from "@/lib/actions/userData";
import type { ScheduleColumn } from "@/lib/types/wedding";

export async function getScheduleColumns(): Promise<ScheduleColumn[]> {
  return getData<ScheduleColumn[]>("wedding_schedule_columns_v1", []);
}

async function save(columns: ScheduleColumn[]) {
  await setData("wedding_schedule_columns_v1", columns, "/wedding");
}

export async function addScheduleColumn(label: string): Promise<ScheduleColumn> {
  const columns = await getScheduleColumns();
  const column: ScheduleColumn = { id: `col${Date.now()}`, label };
  await save([...columns, column]);
  return column;
}

export async function removeScheduleColumn(id: string) {
  const columns = await getScheduleColumns();
  await save(columns.filter((c) => c.id !== id));
}
