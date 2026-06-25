"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CardBenefitData, BenefitValue } from "@/lib/types/cards";
import { calcCardMath } from "@/lib/types/cards";
import { CreditCard } from "lucide-react";

// ── Value display helpers ──────────────────────────────────────────────────────

function fmtValue(v: BenefitValue): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return `$${v.toLocaleString()}`;
  return v; // already formatted string like "~$400", "TBD", "Soft"
}

function fmtMath(n: number, prefix = "+"): string {
  return `${n >= 0 ? prefix : "-"}$${Math.abs(n).toLocaleString()}`;
}

function CheckIcon() {
  return (
    <svg className="inline w-3.5 h-3.5 mr-1 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function HourglassIcon() {
  return <span className="mr-1 text-xs">⏳</span>;
}

function NoteIcon({ icon }: { icon?: "check" | "hourglass" }) {
  if (icon === "hourglass") return <HourglassIcon />;
  return <CheckIcon />;
}

// ── Accent palettes per card ───────────────────────────────────────────────────

type Accent = {
  header: string;
  feeBadge: string;
  tagline: string;
  orgHeader: string;
  nonOrgHeader: string;
  orgCell: string;
  nonOrgCell: string;
  orgValueText: string;
  nonOrgValueText: string;
  footnoteRow: string;
  mathBorder: string;
  organicLabel: string;
  nonOrganicLabel: string;
};

const ACCENTS: Record<string, Accent> = {
  indigo: {
    header: "bg-[#1a2340]",
    feeBadge: "bg-[#c9a84c] text-white",
    tagline: "text-[#c9a84c]",
    orgHeader: "bg-[#2d6a4f] text-white",
    nonOrgHeader: "bg-[#1a3a5c] text-white",
    orgCell: "bg-[#f0faf4]",
    nonOrgCell: "bg-[#f0f5ff]",
    orgValueText: "text-[#1a6b3a] font-bold",
    nonOrgValueText: "text-[#1a3a7c] font-bold",
    footnoteRow: "bg-[#1a2340] text-[#c9a84c]",
    mathBorder: "border-[#c9a84c]",
    organicLabel: "text-[#2d6a4f]",
    nonOrganicLabel: "text-[#1a3a5c]",
  },
  amber: {
    header: "bg-[#1c1a14]",
    feeBadge: "bg-[#b8860b] text-white",
    tagline: "text-[#d4a017]",
    orgHeader: "bg-[#2d6a4f] text-white",
    nonOrgHeader: "bg-[#5c4a1a] text-white",
    orgCell: "bg-[#f0faf4]",
    nonOrgCell: "bg-[#fdf6e3]",
    orgValueText: "text-[#1a6b3a] font-bold",
    nonOrgValueText: "text-[#7a5c00] font-bold",
    footnoteRow: "bg-[#1c1a14] text-[#d4a017]",
    mathBorder: "border-[#d4a017]",
    organicLabel: "text-[#2d6a4f]",
    nonOrganicLabel: "text-[#5c4a1a]",
  },
};

function getAccent(color?: string): Accent {
  return ACCENTS[color ?? "indigo"] ?? ACCENTS.indigo;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CardBenefits({ cards }: { cards: CardBenefitData[] }) {
  const [activeId, setActiveId] = useState(cards[0]?.id ?? "");
  const card = cards.find((c) => c.id === activeId) ?? cards[0];

  if (!card) {
    return <p className="text-gray-400 text-center py-16">No cards configured yet.</p>;
  }

  const accent = getAccent(card.accentColor);
  const math = calcCardMath(card);

  return (
    <div className="space-y-5">
      {/* Card selector */}
      <div className="flex flex-wrap gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
              c.id === activeId
                ? "bg-[#1a2340] text-white border-[#1a2340]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            <CreditCard size={15} />
            {c.name}
          </button>
        ))}
      </div>

      {/* Card table */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        {/* Header */}
        <div className={cn("px-5 py-4", accent.header)}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">{card.name}</h2>
              {card.tagline && (
                <p className={cn("text-xs font-semibold tracking-wider mt-0.5", accent.tagline)}>
                  {card.tagline}
                </p>
              )}
            </div>
            <span className={cn("px-3 py-1.5 rounded text-sm font-bold", accent.feeBadge)}>
              Annual Fee: ${card.annualFee.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_0.7fr_1.4fr_0.6fr_1.4fr_0.6fr] text-xs font-bold tracking-wider">
          <div className="bg-[#2a3350] text-gray-300 px-4 py-3 uppercase">Benefit</div>
          <div className="bg-[#2a3350] text-gray-300 px-3 py-3 uppercase">Max Value</div>
          <div className={cn("px-4 py-3 uppercase text-white", accent.orgHeader)}>
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5" />
            Organic — Notes
          </div>
          <div className={cn("px-3 py-3 uppercase text-white", accent.orgHeader)}>Value</div>
          <div className={cn("px-4 py-3 uppercase text-white", accent.nonOrgHeader)}>
            <span className="inline-block w-2 h-2 rounded-full bg-blue-300 mr-1.5" />
            Non-Organic — Notes
          </div>
          <div className={cn("px-3 py-3 uppercase text-white", accent.nonOrgHeader)}>Value</div>
        </div>

        {/* Benefit rows */}
        <div className="divide-y divide-gray-100">
          {card.benefits.map((row) => (
            <div key={row.id}>
              <div className="grid grid-cols-[2fr_0.7fr_1.4fr_0.6fr_1.4fr_0.6fr] text-sm items-stretch">
                {/* Benefit name */}
                <div className="px-4 py-3 bg-white">
                  <span className="font-semibold text-gray-900">{row.benefit}</span>
                  {row.subtitle && (
                    <div className="text-xs text-gray-400 mt-0.5">{row.subtitle}</div>
                  )}
                </div>

                {/* Max value */}
                <div className="px-3 py-3 bg-gray-50 text-gray-500 text-xs font-medium flex items-center">
                  {fmtValue(row.maxValue)}
                </div>

                {/* Organic notes */}
                <div className={cn("px-4 py-3 text-xs text-gray-600 flex items-start", row.organic ? accent.orgCell : "bg-white")}>
                  {row.organic ? (
                    <span>
                      <NoteIcon icon={row.organic.icon} />
                      {row.organic.notes}
                    </span>
                  ) : (
                    <span className="text-gray-300 mx-auto self-center">—</span>
                  )}
                </div>

                {/* Organic value */}
                <div className={cn("px-3 py-3 flex items-center text-sm", row.organic ? accent.orgCell : "bg-white")}>
                  {row.organic ? (
                    <span className={accent.orgValueText}>{fmtValue(row.organic.value)}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>

                {/* Non-organic notes */}
                <div className={cn("px-4 py-3 text-xs text-gray-600 flex items-start", row.nonOrganic ? accent.nonOrgCell : "bg-white")}>
                  {row.nonOrganic ? (
                    <span>
                      <NoteIcon icon={row.nonOrganic.icon} />
                      {row.nonOrganic.notes}
                    </span>
                  ) : (
                    <span className="text-gray-300 mx-auto self-center">—</span>
                  )}
                </div>

                {/* Non-organic value */}
                <div className={cn("px-3 py-3 flex items-center text-sm", row.nonOrganic ? accent.nonOrgCell : "bg-white")}>
                  {row.nonOrganic ? (
                    <span className={accent.nonOrgValueText}>{fmtValue(row.nonOrganic.value)}</span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </div>
              </div>

              {/* Footnote row */}
              {row.footnote && (
                <div className={cn("px-5 py-1.5 text-xs italic col-span-6", accent.footnoteRow)}>
                  {row.footnote}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* THE MATH */}
      <div className="rounded-xl border border-gray-200 bg-[#1a2340] p-6">
        <h3 className={cn("text-xs font-bold tracking-[0.2em] uppercase mb-5", accent.tagline)}>
          The Math
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <MathCard label="Annual Fee" value={`-$${card.annualFee.toLocaleString()}`} valueColor="text-red-400" />
          <MathCard
            label={<><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5" />Organic Value</>}
            value={fmtMath(math.organicTotal)}
            valueColor="text-green-400"
          />
          <MathCard
            label={<><span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-1.5" />Non-Organic Value</>}
            value={fmtMath(math.nonOrganicTotal)}
            valueColor="text-blue-400"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <MathCard label="Total Captured So Far" value={`$${math.totalCaptured.toLocaleString()}`} valueColor="text-yellow-400" />
          <MathCard label="Net Gain Over Fee" value={fmtMath(math.netGain)} valueColor="text-green-400" />
          <MathCard label="Still Unused (TBD)" value={fmtMath(math.tbdTotal)} valueColor="text-cyan-400" />
        </div>
        {math.tbdTotal > 0 && (
          <div className="rounded-lg bg-[#0f1824] border border-gray-700 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Full-Year Projected Net Value (if all TBD used) | Excludes sign-up bonus
            </span>
            <span className="text-green-400 font-bold text-base">{fmtMath(math.projectedNet)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MathCard({
  label,
  value,
  valueColor,
}: {
  label: React.ReactNode;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="bg-[#0f1824] rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1.5 flex items-center">{label}</p>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
    </div>
  );
}
