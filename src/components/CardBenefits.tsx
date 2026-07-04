"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CardBenefitData, BenefitValue, BenefitRow } from "@/lib/types/cards";
import { calcCardMath } from "@/lib/types/cards";
import { saveCards } from "@/lib/actions/cards";
import { CreditCard, Zap, Pencil, Check } from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtValue(v: BenefitValue): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return `$${v.toLocaleString()}`;
  return v;
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
function HourglassIcon() { return <span className="mr-1 text-xs">⏳</span>; }
function NoteIcon({ icon }: { icon?: "check" | "hourglass" }) {
  return icon === "hourglass" ? <HourglassIcon /> : <CheckIcon />;
}

// ── Accent palettes ────────────────────────────────────────────────────────────

type Accent = {
  header: string; feeBadge: string; tagline: string;
  orgHeader: string; nonOrgHeader: string;
  orgCell: string; nonOrgCell: string;
  orgValueText: string; nonOrgValueText: string;
  footnoteRow: string;
};

const ACCENTS: Record<string, Accent> = {
  indigo: {
    header: "bg-[#1a2340]", feeBadge: "bg-[#c9a84c] text-white", tagline: "text-[#c9a84c]",
    orgHeader: "bg-[#2d6a4f] text-white", nonOrgHeader: "bg-[#1a3a5c] text-white",
    orgCell: "bg-[#f0faf4]", nonOrgCell: "bg-[#f0f5ff]",
    orgValueText: "text-[#1a6b3a] font-bold", nonOrgValueText: "text-[#1a3a7c] font-bold",
    footnoteRow: "bg-[#1a2340] text-[#c9a84c]",
  },
  amber: {
    header: "bg-[#1c1a14]", feeBadge: "bg-[#b8860b] text-white", tagline: "text-[#d4a017]",
    orgHeader: "bg-[#2d6a4f] text-white", nonOrgHeader: "bg-[#5c4a1a] text-white",
    orgCell: "bg-[#f0faf4]", nonOrgCell: "bg-[#fdf6e3]",
    orgValueText: "text-[#1a6b3a] font-bold", nonOrgValueText: "text-[#7a5c00] font-bold",
    footnoteRow: "bg-[#1c1a14] text-[#d4a017]",
  },
};

function getAccent(color?: string): Accent {
  return ACCENTS[color ?? "indigo"] ?? ACCENTS.indigo;
}

// ── Inline editable cell ───────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  className,
  placeholder = "—",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  function commit() {
    onChange(draft);
    setEditing(false);
  }

  if (editing) {
    const shared = {
      ref,
      autoFocus: true,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      },
      className: cn("w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none", className),
      placeholder,
    };
    return multiline
      ? <textarea {...shared as React.TextareaHTMLAttributes<HTMLTextAreaElement>} rows={2} />
      : <input {...shared as React.InputHTMLAttributes<HTMLInputElement>} />;
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={cn("group/edit cursor-pointer flex items-start gap-1 min-h-[1.25rem]", className)}
    >
      <span className={value ? "" : "text-gray-300 italic"}>{value || placeholder}</span>
      <Pencil size={10} className="opacity-0 group-hover/edit:opacity-40 shrink-0 mt-0.5 text-gray-500 transition-opacity" />
    </span>
  );
}

// ── Points earning rates ───────────────────────────────────────────────────────

interface PointsCategory { category: string; multiplier: string; note?: string; }

const POINTS_RATES: Record<string, PointsCategory[]> = {
  "chase-sapphire-reserve": [
    { category: "Hotels & Car Rentals",   multiplier: "10x", note: "Through Chase Travel portal" },
    { category: "Chase Dining",           multiplier: "10x", note: "Through Chase Dining" },
    { category: "Lyft",                   multiplier: "10x", note: "Through Mar 2025" },
    { category: "Flights",                multiplier: "5x",  note: "Through Chase Travel portal" },
    { category: "Dining",                 multiplier: "3x",  note: "Restaurants worldwide" },
    { category: "Travel",                 multiplier: "3x",  note: "Flights, hotels, transit, rideshare booked directly" },
    { category: "Everything else",        multiplier: "1x" },
  ],
  "amex-blue-everyday": [
    { category: "U.S. Supermarkets",   multiplier: "3x", note: "Up to $6,000/yr, then 1%" },
    { category: "U.S. Online Retail",  multiplier: "3x", note: "Up to $6,000/yr, then 1% (includes Amazon)" },
    { category: "U.S. Gas Stations",   multiplier: "3x", note: "Up to $6,000/yr, then 1%" },
    { category: "Everything else",     multiplier: "1x" },
  ],
  "amex-business-platinum": [
    { category: "Flights (Amex Travel)",            multiplier: "5x",  note: "Prepaid flights booked through AmexTravel.com" },
    { category: "Hotels (Amex Travel)",             multiplier: "5x",  note: "Prepaid hotels & short-term rentals via AmexTravel.com" },
    { category: "Large Purchases ($5K+)",           multiplier: "2x",  note: "U.S. purchases of $5,000+ (up to $2M/yr)" },
    { category: "Construction & Hardware",          multiplier: "2x",  note: "U.S. construction material merchants" },
    { category: "Electronics/Software/Cloud",       multiplier: "2x",  note: "U.S. electronic goods retailers & software/cloud providers" },
    { category: "Shipping",                         multiplier: "2x",  note: "U.S. shipping providers" },
    { category: "Everything else",                  multiplier: "1x" },
  ],
};

const MULTIPLIER_COLOR: Record<string, string> = {
  "10x": "bg-emerald-100 text-emerald-700",
  "5x":  "bg-blue-100 text-blue-700",
  "3x":  "bg-indigo-100 text-indigo-700",
  "1.5x":"bg-amber-100 text-amber-700",
  "1x":  "bg-gray-100 text-gray-500",
};

function PointsView({ cardId }: { cardId: string }) {
  const rates = POINTS_RATES[cardId] ?? [];
  if (!rates.length) return <p className="text-gray-400 text-sm py-8 text-center">No points data for this card yet.</p>;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Category</th>
            <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Points</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rates.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 font-medium text-gray-800">{r.category}</td>
              <td className="px-5 py-3.5 text-center">
                <span className={cn("inline-block px-2.5 py-0.5 rounded-full text-xs font-bold", MULTIPLIER_COLOR[r.multiplier] ?? "bg-gray-100 text-gray-600")}>
                  {r.multiplier}
                </span>
              </td>
              <td className="px-5 py-3.5 text-gray-500 text-xs">{r.note ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CardBenefits({ cards: initial }: { cards: CardBenefitData[] }) {
  const [cards, setCards] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<"benefits" | "points">("benefits");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card = cards.find((c) => c.id === activeId) ?? cards[0];
  if (!card) return <p className="text-gray-400 text-center py-16">No cards configured yet.</p>;

  const accent = getAccent(card.accentColor);
  const math = calcCardMath(card);

  // Debounced save so every keystroke doesn't hit the server
  const scheduleSave = useCallback((updated: CardBenefitData[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCards(updated), 800);
  }, []);

  function updateCard(patch: Partial<CardBenefitData>) {
    const updated = cards.map((c) => c.id === card.id ? { ...c, ...patch } : c);
    setCards(updated);
    scheduleSave(updated);
  }

  function updateRow(rowId: string, patch: Partial<BenefitRow>) {
    updateCard({
      benefits: card.benefits.map((r) => r.id === rowId ? { ...r, ...patch } : r),
    });
  }

  function updateOrganic(rowId: string, patch: Partial<NonNullable<BenefitRow["organic"]>>) {
    const row = card.benefits.find((r) => r.id === rowId);
    const current = row?.organic ?? { notes: "", value: null };
    const merged = { ...current, ...patch };
    // Remove the entry entirely if notes are cleared
    updateRow(rowId, { organic: merged.notes.trim() ? merged : undefined });
  }

  function updateNonOrganic(rowId: string, patch: Partial<NonNullable<BenefitRow["nonOrganic"]>>) {
    const row = card.benefits.find((r) => r.id === rowId);
    const current = row?.nonOrganic ?? { notes: "", value: null };
    const merged = { ...current, ...patch };
    updateRow(rowId, { nonOrganic: merged.notes.trim() ? merged : undefined });
  }

  const usedCount = card.benefits.filter((r) => r.used).length;

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

      {/* Tab bar */}
      <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("benefits")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === "benefits" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <CreditCard size={13} /> Benefits
        </button>
        <button
          onClick={() => setActiveTab("points")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            activeTab === "points" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Zap size={13} /> Points
        </button>
      </div>

      {activeTab === "points" && <PointsView cardId={card.id} />}

      {activeTab === "benefits" && (<>
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {usedCount}/{card.benefits.length} redeemed
              </span>
              <span className={cn("px-3 py-1.5 rounded text-sm font-bold", accent.feeBadge)}>
                Annual Fee: ${card.annualFee.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2rem_2fr_0.7fr_1.4fr_0.6fr_1.4fr_0.6fr] text-xs font-bold tracking-wider">
          <div className="bg-[#2a3350]" />
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
              <div className={cn(
                "grid grid-cols-[2rem_2fr_0.7fr_1.4fr_0.6fr_1.4fr_0.6fr] text-sm items-stretch",
                row.used && "opacity-60"
              )}>

                {/* Checkbox */}
                <div className="bg-white flex items-center justify-center">
                  <button
                    onClick={() => updateRow(row.id, { used: !row.used })}
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0",
                      row.used
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-green-400"
                    )}
                    title={row.used ? "Mark unused" : "Mark as used"}
                  >
                    {row.used && <Check size={10} className="text-white" strokeWidth={3} />}
                  </button>
                </div>

                {/* Benefit name */}
                <div className="px-4 py-3 bg-white">
                  <span className={cn("font-semibold text-gray-900", row.used && "line-through text-gray-400")}>
                    {row.benefit}
                  </span>
                  {row.subtitle && <div className="text-xs text-gray-400 mt-0.5">{row.subtitle}</div>}
                </div>

                {/* Max value */}
                <div className="px-3 py-3 bg-gray-50 text-gray-500 text-xs font-medium flex items-center">
                  {fmtValue(row.maxValue)}
                </div>

                {/* Organic notes */}
                <div className={cn(
                  "px-4 py-3 text-xs text-gray-600 flex items-start transition-colors",
                  row.organic?.notes ? accent.orgCell : "bg-white"
                )}>
                  <span className="flex items-start gap-0.5 w-full">
                    {row.organic?.notes && <NoteIcon icon={row.organic.icon} />}
                    <EditableCell
                      value={row.organic?.notes ?? ""}
                      onChange={(v) => updateOrganic(row.id, { notes: v })}
                      placeholder="Add organic notes…"
                      multiline
                    />
                  </span>
                </div>

                {/* Organic value */}
                <div className={cn(
                  "px-3 py-3 flex items-center transition-colors",
                  row.organic?.notes ? accent.orgCell : "bg-white"
                )}>
                  <EditableCell
                    value={String(row.organic?.value ?? "")}
                    onChange={(v) => updateOrganic(row.id, { notes: row.organic?.notes ?? "", value: v })}
                    className={cn("text-sm", row.organic?.notes ? accent.orgValueText : "text-gray-300")}
                    placeholder="$0"
                  />
                </div>

                {/* Non-organic notes */}
                <div className={cn(
                  "px-4 py-3 text-xs text-gray-600 flex items-start transition-colors",
                  row.nonOrganic?.notes ? accent.nonOrgCell : "bg-white"
                )}>
                  <span className="flex items-start gap-0.5 w-full">
                    {row.nonOrganic?.notes && <NoteIcon icon={row.nonOrganic.icon} />}
                    <EditableCell
                      value={row.nonOrganic?.notes ?? ""}
                      onChange={(v) => updateNonOrganic(row.id, { notes: v })}
                      placeholder="Add non-organic notes…"
                      multiline
                    />
                  </span>
                </div>

                {/* Non-organic value */}
                <div className={cn(
                  "px-3 py-3 flex items-center transition-colors",
                  row.nonOrganic?.notes ? accent.nonOrgCell : "bg-white"
                )}>
                  <EditableCell
                    value={String(row.nonOrganic?.value ?? "")}
                    onChange={(v) => updateNonOrganic(row.id, { notes: row.nonOrganic?.notes ?? "", value: v })}
                    className={cn("text-sm", row.nonOrganic?.notes ? accent.nonOrgValueText : "text-gray-300")}
                    placeholder="$0"
                  />
                </div>
              </div>

              {row.footnote && (
                <div className={cn("px-5 py-1.5 text-xs italic", accent.footnoteRow)}>
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
        <div className="grid grid-cols-3 gap-4 mb-4">
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
      </>)}
    </div>
  );
}

function MathCard({ label, value, valueColor }: {
  label: React.ReactNode; value: string; valueColor: string;
}) {
  return (
    <div className="bg-[#0f1824] rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1.5 flex items-center">{label}</p>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
    </div>
  );
}
