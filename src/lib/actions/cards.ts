"use server";

import { revalidatePath } from "next/cache";
import { getData, setData } from "@/lib/actions/userData";
import type { CardBenefitData } from "@/lib/types/cards";

const DEFAULT_CARDS: CardBenefitData[] = [
  {
    id: "chase-sapphire-reserve",
    name: "Chase Sapphire Reserve®",
    annualFee: 795,
    tagline: "ANNUAL FEE ANALYSIS — 2026 | EXCLUDES 150,000 PT SIGN-UP BONUS",
    accentColor: "indigo",
    benefits: [
      {
        id: "travel-credit",
        benefit: "$300 Travel Credit",
        maxValue: 300,
        organic: { notes: "Flights & rental cars — booked anyway", value: 300 },
      },
      {
        id: "dining-credit",
        benefit: "$300 Dining Credit",
        subtitle: "OpenTable Exclusive Tables",
        maxValue: 300,
        organic: { notes: "Dine out regularly — $150 used Jan–Jun, $150 pending", value: 300 },
      },
      {
        id: "stubhub-credit",
        benefit: "$300 StubHub / Viagogo Credit",
        maxValue: 300,
        organic: { notes: "Buy event tickets regularly — $150 used, $150 pending", value: 300 },
      },
      {
        id: "global-entry",
        benefit: "Global Entry Renewal",
        maxValue: 120,
        organic: { notes: "Renewal was already due anyway", value: 120 },
      },
      {
        id: "hotel-credit",
        benefit: "$250 Select Hotel Credit (2026)",
        maxValue: 250,
        organic: { notes: "Redirecting an existing trip to qualifying hotel", value: 250 },
      },
      {
        id: "whoop",
        benefit: "WHOOP Life Membership",
        maxValue: 359,
        nonOrganic: { notes: "Bought because of the card — $359 fully covered", value: 359 },
      },
      {
        id: "priority-pass",
        benefit: "Priority Pass Lounge Access",
        maxValue: "Unlimited",
        nonOrganic: { notes: "4–5 visits planned with 1 guest each (~$40/person/visit)", value: "~$400" },
        footnote: "Calculation: 5 visits x 2 people x $40 day-pass value = $400",
      },
      {
        id: "doordash",
        benefit: "DoorDash / DashPass Credits",
        maxValue: 420,
        nonOrganic: { notes: "Occasional non-restaurant promo use", value: "~$60", icon: "hourglass" },
      },
      {
        id: "lyft",
        benefit: "Lyft Credits ($10/mo)",
        maxValue: 120,
        nonOrganic: { notes: "Airport rides throughout the year", value: "~$60", icon: "hourglass" },
        footnote: "Calculation: ~6 rides/year x $10 credit = $60",
      },
      {
        id: "rental-car",
        benefit: "Rental Car Elite Status",
        subtitle: "Hertz / Avis / National",
        maxValue: "Soft",
        nonOrganic: { notes: "Active — line-skip & upgrades", value: "Soft" },
      },
      {
        id: "apple-tv",
        benefit: "Apple TV+ & Apple Music",
        maxValue: 288,
        organic: { notes: "Activated because of the card — now using it", value: 288 },
      },
      {
        id: "ihg",
        benefit: "IHG Platinum Elite Status",
        maxValue: "Soft",
        nonOrganic: { notes: "Activated, no stays yet", value: "TBD", icon: "hourglass" },
      },
      {
        id: "edit-hotel",
        benefit: "$500 The Edit Hotel Credit",
        maxValue: 500,
        organic: { notes: "Available all year — plan to use", value: "TBD", icon: "hourglass" },
      },
      {
        id: "trip-cancel",
        benefit: "Trip Cancellation Insurance",
        maxValue: "Soft",
        organic: { notes: "Passive — replaces ~$150/yr standalone policy", value: "Soft" },
      },
    ],
  },
  {
    id: "amex-business-platinum",
    name: "Amex Business Platinum Card®",
    annualFee: 695,
    tagline: "ANNUAL FEE ANALYSIS — 2026",
    accentColor: "amber",
    benefits: [
      {
        id: "airline-fee",
        benefit: "$200 Airline Fee Credit",
        maxValue: 200,
        organic: { notes: "Select one airline — incidental fees (bags, seat upgrades)", value: "TBD", icon: "hourglass" },
      },
      {
        id: "hotel-credit",
        benefit: "$200 Fine Hotels + Resorts Credit",
        maxValue: 200,
        organic: { notes: "Booked through Amex Travel — plan to redirect a trip", value: "TBD", icon: "hourglass" },
      },
      {
        id: "dell-credits",
        benefit: "$400 Dell Credits",
        subtitle: "$200 Jan–Jun · $200 Jul–Dec",
        maxValue: 400,
        organic: { notes: "Active business use — hardware & accessories", value: "TBD", icon: "hourglass" },
      },
      {
        id: "adobe",
        benefit: "$150 Adobe Credit",
        maxValue: 150,
        organic: { notes: "Already using Adobe CC — offsets existing subscription", value: 150 },
      },
      {
        id: "clear",
        benefit: "$189 CLEAR Plus Credit",
        maxValue: 189,
        organic: { notes: "CLEAR already used at airports regularly", value: 189 },
      },
      {
        id: "digital",
        benefit: "$240 Digital Entertainment Credit",
        subtitle: "$20/mo — eligible services",
        maxValue: 240,
        organic: { notes: "Using eligible streaming services monthly", value: 240 },
      },
      {
        id: "global-entry",
        benefit: "Global Entry / TSA PreCheck Credit",
        maxValue: 120,
        organic: { notes: "Used for renewal", value: 120 },
      },
      {
        id: "centurion",
        benefit: "Centurion Lounge Access",
        maxValue: "Unlimited",
        nonOrganic: { notes: "~6 visits/yr at key airports (~$50/visit value)", value: "~$300" },
        footnote: "Calculation: 6 visits x $50 estimated day-pass value = $300",
      },
      {
        id: "priority-pass",
        benefit: "Priority Pass Select",
        maxValue: "Unlimited",
        nonOrganic: { notes: "Backup to Centurion at non-Amex airports", value: "~$100", icon: "hourglass" },
      },
      {
        id: "points-35",
        benefit: "35% Points Back on Flights",
        subtitle: "Up to 500,000 pts/yr",
        maxValue: "Soft",
        organic: { notes: "Used on business travel — significant point recovery", value: "Soft" },
      },
      {
        id: "hotel-status",
        benefit: "Marriott Bonvoy Gold / Hilton Gold",
        maxValue: "Soft",
        nonOrganic: { notes: "Automatic mid-tier status — upgrades & breakfast", value: "Soft" },
      },
      {
        id: "purchase-protection",
        benefit: "Purchase & Extended Warranty",
        maxValue: "Soft",
        organic: { notes: "Passive coverage on business purchases", value: "Soft" },
      },
    ],
  },
];

export async function getCards(): Promise<CardBenefitData[]> {
  const cards = await getData<CardBenefitData[]>("cards_v1", DEFAULT_CARDS);
  // Migrate: move Apple TV+ & Apple Music from nonOrganic → organic on CSR
  const migrated = cards.map((card) => {
    if (card.id !== "chase-sapphire-reserve") return card;
    return {
      ...card,
      benefits: card.benefits.map((row) => {
        if (row.id !== "apple-tv") return row;
        if (row.organic) return row; // already correct
        return {
          ...row,
          organic: row.nonOrganic ?? { notes: "Activated because of the card — now using it", value: 288 },
          nonOrganic: undefined,
        };
      }),
    };
  });
  return migrated;
}

export async function saveCards(cards: CardBenefitData[]): Promise<void> {
  await setData("cards_v1", cards);
  revalidatePath("/cards");
}
