"use client";

import { useEffect, useState } from "react";

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function weekendsUntil(dateStr: string) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  const cur = new Date(today);
  while (cur <= target) {
    const day = cur.getDay();
    if (day === 6) count++; // count Saturdays as 1 weekend
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function paychecksUntil(dateStr: string) {
  // Assumes bi-weekly pay, next paycheck on the nearest upcoming Friday
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find next Friday from today
  const nextFriday = new Date(today);
  const daysToFriday = (5 - today.getDay() + 7) % 7 || 7;
  nextFriday.setDate(today.getDate() + daysToFriday);
  let count = 0;
  const cur = new Date(nextFriday);
  while (cur <= target) {
    count++;
    cur.setDate(cur.getDate() + 14);
  }
  return count;
}

export default function FreedomCountdown() {
  const [, setTick] = useState(0);
  useEffect(() => { setTick(1); }, []);

  const QUIT_DATE = "2026-08-17";
  const LAST_DATE = "2026-08-31";

  const quitDays = daysUntil(QUIT_DATE);
  const lastDays = daysUntil(LAST_DATE);
  const quitWeeks = Math.ceil(quitDays / 7);
  const quitMonths = parseFloat((quitDays / 30.44).toFixed(1));
  const weekendsLeft = weekendsUntil(QUIT_DATE);
  const paychecksLeft = paychecksUntil(LAST_DATE);

  const stats = [
    { label: "weeks", value: quitWeeks },
    { label: "months", value: quitMonths },
    { label: "weekends", value: weekendsLeft },
    { label: "paychecks", value: paychecksLeft },
  ];

  return (
    <div className="mb-10 pt-4 pb-8 border-b border-gray-100">
      {/* Main countdown */}
      <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest text-center mb-1">
        days until freedom
      </p>
      <p className="text-[7rem] font-black text-gray-900 leading-none text-center tabular-nums">
        {quitDays}
      </p>
      <p className="text-2xl font-bold text-gray-700 text-center mt-2">
        August 17, 2026 — Quit Date
      </p>
      <p className="text-sm text-gray-400 text-center mt-1">
        Last day August 31, 2026 · <span className="font-semibold text-indigo-400">{lastDays} days</span>
      </p>

      {/* Stat pills */}
      <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 min-w-[90px]">
            <p className="text-2xl font-bold text-gray-800 tabular-nums">{value}</p>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
