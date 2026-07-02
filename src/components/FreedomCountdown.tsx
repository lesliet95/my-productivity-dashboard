"use client";

import { useEffect, useState } from "react";

function daysUntil(dateStr: string) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FreedomCountdown() {
  const [, setTick] = useState(0);
  useEffect(() => { setTick(1); }, []);

  const quitDays = daysUntil("2025-08-17");
  const lastDays = daysUntil("2025-08-31");

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
        August 17, 2025 — Quit Date
      </p>

      {/* Secondary: last day */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">last day</p>
          <p className="text-4xl font-bold text-indigo-500 tabular-nums">{lastDays}</p>
          <p className="text-sm text-gray-500 mt-0.5">days · Aug 31, 2025</p>
        </div>
      </div>
    </div>
  );
}
