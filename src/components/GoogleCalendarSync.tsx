"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RefreshCw, LogIn, LogOut, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GoogleCalendarSync() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/calendar/sync-tasks", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setResult({ created: data.created, skipped: data.skipped });
      if (data.created > 0) router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <LogIn size={13} className="text-indigo-500" />
        Connect Google Calendar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className={cn(
          "flex items-center gap-1 text-xs font-medium",
          result.created > 0 ? "text-green-600" : "text-gray-400"
        )}>
          <Check size={12} />
          {result.created > 0
            ? `${result.created} task${result.created !== 1 ? "s" : ""} added`
            : "Already up to date"}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
        title="Import lavender Google Calendar events as tasks"
      >
        <RefreshCw size={12} className={cn("text-indigo-500", syncing && "animate-spin")} />
        {syncing ? "Syncing…" : "Sync Lavender Events"}
      </button>
      <button
        onClick={() => signOut()}
        className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
        title="Disconnect Google Calendar"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
