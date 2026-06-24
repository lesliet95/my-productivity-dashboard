import type { Trade } from "./actions/trading";

export function calcPnL(trade: Pick<Trade, "direction" | "entry" | "exit" | "size">): number {
  const diff = trade.exit - trade.entry;
  const raw = (trade.direction === "Long" ? diff : -diff) * trade.size;
  return Math.round(raw * 100) / 100;
}
