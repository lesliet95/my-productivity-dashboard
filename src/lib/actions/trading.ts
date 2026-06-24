"use server";

import { getData, setData } from "./userData";

export type Direction = "Long" | "Short";

export type Trade = {
  id: string;
  date: string; // YYYY-MM-DD
  ticker: string;
  direction: Direction;
  entry: number;
  exit: number;
  size: number;
  strategy: string;
  followed_plan: boolean;
  notes: string;
  // pnl is derived, not stored
};

export type TradingData = {
  trades: Trade[];
};

const KEY = "trading_log";
const FALLBACK: TradingData = { trades: [] };


export async function getTradingData(): Promise<TradingData> {
  return getData<TradingData>(KEY, FALLBACK);
}

export async function addTrade(trade: Omit<Trade, "id">): Promise<void> {
  const current = await getTradingData();
  const newTrade: Trade = { ...trade, id: crypto.randomUUID() };
  const trades = [newTrade, ...current.trades].sort((a, b) => b.date.localeCompare(a.date));
  await setData(KEY, { trades }, "/trading");
}

export async function updateTrade(id: string, updates: Partial<Omit<Trade, "id">>): Promise<void> {
  const current = await getTradingData();
  const trades = current.trades.map((t) => (t.id === id ? { ...t, ...updates } : t));
  await setData(KEY, { trades }, "/trading");
}

export async function deleteTrade(id: string): Promise<void> {
  const current = await getTradingData();
  const trades = current.trades.filter((t) => t.id !== id);
  await setData(KEY, { trades }, "/trading");
}
