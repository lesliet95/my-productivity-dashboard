"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { Check, Trash2, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "delete" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-obsidian border-pewter/20",
    icon: <Check size={13} className="text-pewter shrink-0" strokeWidth={2.5} />,
  },
  delete: {
    bg: "bg-obsidian border-pewter/20",
    icon: <Trash2 size={13} className="text-bronze shrink-0" />,
  },
  error: {
    bg: "bg-obsidian border-red-500/30",
    icon: <AlertCircle size={13} className="text-red-400 shrink-0" />,
  },
  info: {
    bg: "bg-obsidian border-pewter/20",
    icon: <AlertCircle size={13} className="text-pewter shrink-0" />,
  },
};

// ── Individual toast ──────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { bg, icon } = STYLES[toast.type];
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium",
      bg,
    )} style={{ color: "#eeece9", minWidth: 220, maxWidth: 320, animation: "toast-in 0.2s ease" }}>
      {icon}
      <span className="flex-1 text-xs">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="opacity-40 hover:opacity-70 transition-opacity ml-1">
        <X size={13} />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `t${Date.now()}${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]); // max 4 visible
    timers.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast stack — bottom center on mobile, bottom-right on desktop */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[100] flex flex-col gap-2 items-center md:items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
