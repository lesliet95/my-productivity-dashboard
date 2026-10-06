// Quarter keys look like "2026-Q4".

export function quarterOf(date: Date): string {
  return `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
}

export function currentQuarter(): string {
  return quarterOf(new Date());
}

function parse(q: string): { year: number; n: number } {
  const [y, n] = q.split("-Q");
  return { year: Number(y), n: Number(n) };
}

export function shiftQuarter(q: string, delta: number): string {
  const { year, n } = parse(q);
  const idx = year * 4 + (n - 1) + delta;
  return `${Math.floor(idx / 4)}-Q${(idx % 4) + 1}`;
}

export function quarterLabel(q: string): string {
  const { year, n } = parse(q);
  return `Q${n} ${year}`;
}

export function quarterRange(q: string): { start: Date; end: Date } {
  const { year, n } = parse(q);
  const start = new Date(year, (n - 1) * 3, 1);
  const end = new Date(year, n * 3, 0); // last day of the quarter
  return { start, end };
}

export function quarterWeeks(q: string): number {
  const { start, end } = quarterRange(q);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return Math.ceil(days / 7);
}

/** 1-based week of the quarter for a date, or null if the date is outside it. */
export function weekOfQuarter(q: string, date = new Date()): number | null {
  const { start, end } = quarterRange(q);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d < start || d > end) return null;
  // Round to whole days so DST shifts don't push a date into the wrong week.
  const days = Math.round((d.getTime() - start.getTime()) / 86400000);
  return Math.floor(days / 7) + 1;
}

/** Fraction of the quarter elapsed (0–1), clamped. */
export function quarterElapsed(q: string, now = new Date()): number {
  const { start, end } = quarterRange(q);
  const total = end.getTime() + 86400000 - start.getTime();
  return Math.min(1, Math.max(0, (now.getTime() - start.getTime()) / total));
}

export function daysLeft(q: string, now = new Date()): number {
  const { end } = quarterRange(q);
  return Math.max(0, Math.ceil((end.getTime() + 86400000 - now.getTime()) / 86400000));
}
