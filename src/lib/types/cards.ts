export type BenefitValue = number | string | null; // number, "~$400", "TBD", "Soft", "Unlimited"

export interface BenefitOrganic {
  notes: string;
  value: BenefitValue;
  icon?: "check" | "hourglass"; // default check
}

export interface BenefitNonOrganic {
  notes: string;
  value: BenefitValue;
  icon?: "check" | "hourglass";
}

export interface BenefitRow {
  id: string;
  benefit: string;
  subtitle?: string;
  maxValue: BenefitValue;
  organic?: BenefitOrganic;
  nonOrganic?: BenefitNonOrganic;
  footnote?: string; // renders as a dark calculation row below
}

export interface CardBenefitData {
  id: string;
  name: string;
  annualFee: number;
  tagline?: string;
  accentColor?: string; // tailwind color name, e.g. "indigo", "blue"
  benefits: BenefitRow[];
}

// Extract a numeric value for math calculations
export function parseValue(v: BenefitValue): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const match = v.replace(/,/g, "").match(/\d+(\.\d+)?/);
    if (match) return parseFloat(match[0]);
  }
  return 0;
}

export function calcCardMath(card: CardBenefitData) {
  let organicTotal = 0;
  let nonOrganicTotal = 0;
  let tbdTotal = 0;

  for (const row of card.benefits) {
    if (row.organic) {
      const v = row.organic.value;
      if (typeof v === "string" && (v === "TBD" || v.startsWith("TBD"))) {
        tbdTotal += parseValue(row.maxValue);
      } else if (v !== "Soft" && v !== null) {
        organicTotal += parseValue(v);
      }
    }
    if (row.nonOrganic) {
      const v = row.nonOrganic.value;
      if (typeof v === "string" && (v === "TBD" || v.startsWith("TBD"))) {
        tbdTotal += parseValue(row.maxValue);
      } else if (v !== "Soft" && v !== null) {
        nonOrganicTotal += parseValue(v);
      }
    }
  }

  const totalCaptured = organicTotal + nonOrganicTotal;
  const netGain = totalCaptured - card.annualFee;
  const projectedNet = netGain + tbdTotal;

  return { organicTotal, nonOrganicTotal, totalCaptured, netGain, tbdTotal, projectedNet };
}
