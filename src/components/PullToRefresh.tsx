"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 80; // px to pull before triggering

export default function PullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      // Only trigger when scrolled to very top
      if (window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current || startY.current === null) return;
      if (window.scrollY > 0) { pulling.current = false; setPullDistance(0); return; }
      const dist = Math.max(0, e.touches[0].clientY - startY.current);
      if (dist > 0) {
        // Dampen — feels natural, not 1:1
        setPullDistance(Math.min(THRESHOLD * 1.5, dist * 0.45));
      }
    }

    async function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      if (pullDistance >= THRESHOLD) {
        setRefreshing(true);
        setPullDistance(THRESHOLD * 0.6);
        router.refresh();
        await new Promise((r) => setTimeout(r, 1000));
        setRefreshing(false);
      }
      setPullDistance(0);
      startY.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pullDistance, router]);

  if (pullDistance === 0 && !refreshing) return null;

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const ready = progress >= 1;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none md:hidden"
      style={{ height: pullDistance + 48, transition: refreshing || pullDistance === 0 ? "height 0.3s ease" : "none" }}
    >
      <div
        className="mb-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md"
        style={{
          background: "#1b2824",
          opacity: Math.max(0.3, progress),
          transform: `scale(${0.6 + progress * 0.4})`,
          transition: refreshing ? "transform 0.2s ease" : "none",
        }}
      >
        {refreshing ? (
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(153,179,183,0.3)", borderTopColor: "#99b3b7" }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#99b3b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: `rotate(${ready ? 180 : progress * 160}deg)`, transition: "transform 0.15s ease" }}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        )}
      </div>
    </div>
  );
}
