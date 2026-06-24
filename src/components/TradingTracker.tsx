"use client";

import { useState, useTransition } from "react";
import { addTrade, updateTrade, deleteTrade, type Trade, type TradingData, type Direction } from "@/lib/actions/trading";
import { calcPnL } from "@/lib/tradingUtils";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STRATEGIES = ["Breakout", "Pullback", "Earnings", "Trend", "Reversal", "Scalp", "Swing", "News", "OpenInsider", "Other"];

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeStats(trades: Trade[]) {
  const pnls = trades.map(calcPnL);
  const total = pnls.reduce((s, p) => s + p, 0);
  const wins = trades.filter((t) => calcPnL(t) > 0);
  const losses = trades.filter((t) => calcPnL(t) < 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + calcPnL(t), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + calcPnL(t), 0) / losses.length : 0;
  return { total, winRate, avgWin, avgLoss, wins: wins.length, losses: losses.length };
}

export default function TradingTracker({ initialData }: { initialData: TradingData }) {
  const [trades, setTrades] = useState(initialData.trades);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const stats = computeStats(trades);

  function handleAdd(trade: Omit<Trade, "id">) {
    const optimistic: Trade = { ...trade, id: crypto.randomUUID() };
    setTrades((prev) => [optimistic, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setShowForm(false);
    startTransition(() => addTrade(trade));
  }

  function handleUpdate(id: string, updates: Partial<Omit<Trade, "id">>) {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setEditingId(null);
    startTransition(() => updateTrade(id, updates));
  }

  function handleDelete(id: string) {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => deleteTrade(id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total P&L"
          value={`${stats.total >= 0 ? "+" : ""}$${fmt(stats.total)}`}
          color={stats.total >= 0 ? "text-green-600" : "text-red-500"}
          sub={`${trades.length} trade${trades.length !== 1 ? "s" : ""}`}
        />
        <StatCard
          label="Win Rate"
          value={`${fmt(stats.winRate)}%`}
          color={stats.winRate >= 50 ? "text-green-600" : "text-red-500"}
          sub={`${stats.wins}W / ${stats.losses}L`}
        />
        <StatCard
          label="Avg Win"
          value={stats.avgWin > 0 ? `+$${fmt(stats.avgWin)}` : "—"}
          color="text-green-600"
          sub="per winning trade"
        />
        <StatCard
          label="Avg Loss"
          value={stats.avgLoss < 0 ? `-$${fmt(Math.abs(stats.avgLoss))}` : "—"}
          color="text-red-500"
          sub="per losing trade"
        />
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Log Trade
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <TradeForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          submitLabel="Log Trade"
        />
      )}

      {/* Table */}
      {trades.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-xl">
          <p className="text-lg">No trades logged yet</p>
          <p className="text-sm mt-1">Click "Log Trade" to record your first trade.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Date", "Ticker", "L/S", "Entry", "Exit", "Size", "P&L", "Strategy", "Plan?", "Notes", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => {
                  const pnl = calcPnL(trade);
                  const isEditing = editingId === trade.id;
                  return isEditing ? (
                    <tr key={trade.id} className="bg-indigo-50">
                      <td colSpan={11} className="px-4 py-3">
                        <TradeForm
                          initial={trade}
                          onSubmit={(data) => handleUpdate(trade.id, data)}
                          onCancel={() => setEditingId(null)}
                          submitLabel="Save"
                          inline
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={trade.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(trade.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 uppercase">{trade.ticker}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          trade.direction === "Long" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                        )}>
                          {trade.direction === "Long" ? "L" : "S"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">${fmt(trade.entry)}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">${fmt(trade.exit)}</td>
                      <td className="px-4 py-3 text-gray-700 tabular-nums">{trade.size}</td>
                      <td className={cn("px-4 py-3 font-semibold tabular-nums", pnl >= 0 ? "text-green-600" : "text-red-500")}>
                        {pnl >= 0 ? "+" : ""}${fmt(pnl)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {trade.strategy}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {trade.followed_plan
                          ? <Check size={15} className="text-green-500 mx-auto" />
                          : <X size={15} className="text-red-400 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate">{trade.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingId(trade.id)} className="p-1 text-gray-400 hover:text-indigo-600">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(trade.id)} className="p-1 text-gray-400 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

// ── TradeForm ─────────────────────────────────────────────────────────────────

function TradeForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  inline = false,
}: {
  initial?: Partial<Trade>;
  onSubmit: (data: Omit<Trade, "id">) => void;
  onCancel: () => void;
  submitLabel: string;
  inline?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.date ?? today);
  const [ticker, setTicker] = useState(initial?.ticker ?? "");
  const [direction, setDirection] = useState<Direction>(initial?.direction ?? "Long");
  const [entry, setEntry] = useState(initial?.entry?.toString() ?? "");
  const [exit, setExit] = useState(initial?.exit?.toString() ?? "");
  const [size, setSize] = useState(initial?.size?.toString() ?? "");
  const [strategy, setStrategy] = useState(initial?.strategy ?? "Breakout");
  const [followedPlan, setFollowedPlan] = useState(initial?.followed_plan ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const previewPnl = entry && exit && size
    ? calcPnL({ direction, entry: parseFloat(entry), exit: parseFloat(exit), size: parseFloat(size) })
    : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      date,
      ticker: ticker.trim().toUpperCase(),
      direction,
      entry: parseFloat(entry),
      exit: parseFloat(exit),
      size: parseFloat(size),
      strategy,
      followed_plan: followedPlan,
      notes: notes.trim(),
    });
  }

  const wrapClass = inline
    ? "space-y-3"
    : "bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3";

  return (
    <form onSubmit={handleSubmit} className={wrapClass}>
      {!inline && <h3 className="text-sm font-semibold text-gray-800">Log Trade</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ticker</label>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Direction</label>
          <div className="flex gap-1">
            {(["Long", "Short"] as Direction[]).map((d) => (
              <button key={d} type="button" onClick={() => setDirection(d)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-bold border transition-colors",
                  direction === d
                    ? d === "Long" ? "bg-green-500 text-white border-green-500" : "bg-red-500 text-white border-red-500"
                    : "bg-white border-gray-200 text-gray-500"
                )}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Entry $</label>
          <input type="number" step="0.01" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="0.00" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Exit $</label>
          <input type="number" step="0.01" value={exit} onChange={(e) => setExit(e.target.value)} placeholder="0.00" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Size</label>
          <input type="number" step="0.01" value={size} onChange={(e) => setSize(e.target.value)} placeholder="100" required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
            {STRATEGIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Followed Plan?</label>
          <div className="flex gap-1">
            {([true, false] as const).map((v) => (
              <button key={String(v)} type="button" onClick={() => setFollowedPlan(v)}
                className={cn("flex-1 py-2 rounded-lg text-xs font-bold border transition-colors",
                  followedPlan === v
                    ? v ? "bg-green-500 text-white border-green-500" : "bg-red-400 text-white border-red-400"
                    : "bg-white border-gray-200 text-gray-500"
                )}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500 mb-1 block">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="One line max…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        {previewPnl !== null ? (
          <p className={cn("text-sm font-semibold", previewPnl >= 0 ? "text-green-600" : "text-red-500")}>
            P&L preview: {previewPnl >= 0 ? "+" : ""}${fmt(previewPnl)}
          </p>
        ) : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
