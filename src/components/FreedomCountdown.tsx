"use client";

import { useEffect, useState } from "react";

export default function FreedomCountdown({ quitDate }: { quitDate: string }) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    function calc() {
      const target = new Date(quitDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
    }
    calc();
  }, [quitDate]);

  const formattedDate = new Date(quitDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const isPast = daysLeft !== null && daysLeft < 0;
  const isToday = daysLeft === 0;

  return (
    <div className="mb-8 py-8 text-center">
      <p className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-2">
        {isPast ? "Freedom achieved" : isToday ? "Today is the day" : "Days until freedom"}
      </p>
      {!isPast && !isToday && daysLeft !== null && (
        <p className="text-8xl font-black text-gray-900 leading-none mb-3">
          {daysLeft}
        </p>
      )}
      {isToday && (
        <p className="text-6xl font-black text-indigo-600 leading-none mb-3">🎉</p>
      )}
      <p className="text-2xl font-bold text-gray-700">
        {isPast ? formattedDate : `August 17, 2025`}
      </p>
      {!isPast && !isToday && (
        <p className="text-sm text-gray-400 mt-1">
          {formattedDate}
        </p>
      )}
    </div>
  );
}
