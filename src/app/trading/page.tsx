export const dynamic = "force-dynamic";

import { getTradingData } from "@/lib/actions/trading";
import { calcPnL } from "@/lib/tradingUtils";
import TradingTracker from "@/components/TradingTracker";

export default async function TradingPage() {
  const data = await getTradingData();
  const totalPnL = data.trades.reduce((s, t) => s + calcPnL(t), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trading Journal</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.trades.length} trade{data.trades.length !== 1 ? "s" : ""} logged
          {data.trades.length > 0 && (
            <span className={totalPnL >= 0 ? " text-green-600" : " text-red-500"}>
              {" · "}
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total P&L
            </span>
          )}
        </p>
      </div>
      <TradingTracker initialData={data} />
    </div>
  );
}
