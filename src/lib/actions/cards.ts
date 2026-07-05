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
    annualFee: 895,
    tagline: "ANNUAL FEE ANALYSIS — 2026",
    accentColor: "amber",
    benefits: [
      {
        id: "hotel-credit",
        benefit: "$600 Hotel Credit",
        subtitle: "$300 Jan–Jun · $300 Jul–Dec",
        maxValue: 600,
        organic: { notes: "Fine Hotels + Resorts (no min stay) or The Hotel Collection (2-night min) via Amex Travel", value: "TBD", icon: "hourglass" },
      },
      {
        id: "chatgpt",
        benefit: "$300 ChatGPT Business Credit",
        maxValue: 300,
        organic: { notes: "Statement credit toward ChatGPT Business subscription", value: "TBD", icon: "hourglass" },
      },
      {
        id: "indeed",
        benefit: "$360 Indeed Credit",
        subtitle: "$90 quarterly",
        maxValue: 360,
        organic: { notes: "Quarterly credit on Indeed hiring spend", value: "TBD", icon: "hourglass" },
      },
      {
        id: "dell-credits",
        benefit: "$1,150 Dell Credits",
        subtitle: "$150 upfront + $1,000 after $5K spend",
        maxValue: 1150,
        organic: { notes: "$150 on any Dell purchase + $1,000 after spending $5,000 at Dell", value: "TBD", icon: "hourglass" },
      },
      {
        id: "adobe",
        benefit: "$250 Adobe Credit",
        maxValue: 250,
        organic: { notes: "Already using Adobe CC — offsets existing subscription", value: 250 },
      },
      {
        id: "airline-fee",
        benefit: "$200 Airline Fee Credit",
        maxValue: 200,
        organic: { notes: "Select one airline — incidental fees (bags, seat upgrades, lounge day passes)", value: "TBD", icon: "hourglass" },
      },
      {
        id: "hilton-credit",
        benefit: "$200 Hilton Property Credit",
        maxValue: 200,
        organic: { notes: "Hilton for Business members — eligible purchases at Hilton properties", value: "TBD", icon: "hourglass" },
      },
      {
        id: "clear",
        benefit: "$209 CLEAR Plus Credit",
        maxValue: 209,
        organic: { notes: "CLEAR already used at airports regularly", value: 209 },
      },
      {
        id: "wireless",
        benefit: "$120 Wireless Phone Credit",
        subtitle: "$10/mo",
        maxValue: 120,
        organic: { notes: "Statement credit on U.S. wireless phone service purchases", value: "TBD", icon: "hourglass" },
      },
      {
        id: "global-entry",
        benefit: "Global Entry / TSA PreCheck Credit",
        maxValue: 120,
        organic: { notes: "$120 Global Entry or $85 TSA PreCheck — every 4–4.5 years", value: 120 },
      },
      {
        id: "centurion",
        benefit: "Centurion Lounge Access",
        maxValue: "Unlimited",
        nonOrganic: { notes: "~6 visits/yr at key airports (~$50/visit value)", value: "~$300" },
        footnote: "Calculation: 6 visits x $50 estimated day-pass value = $300",
      },
      {
        id: "delta-skyclub",
        benefit: "10 Delta Sky Club Visits/yr",
        maxValue: "Soft",
        nonOrganic: { notes: "Unlimited visits after $75K annual spend; ~$50/visit value", value: "Soft", icon: "hourglass" },
      },
      {
        id: "priority-pass",
        benefit: "Priority Pass Select",
        maxValue: "Unlimited",
        nonOrganic: { notes: "Backup to Centurion at non-Amex airports", value: "~$100", icon: "hourglass" },
      },
      {
        id: "hotel-status",
        benefit: "Hotel & Rental Status",
        subtitle: "Marriott Gold · Hilton Gold · Avis+ · Hertz President's Circle · National Executive",
        maxValue: "Soft",
        nonOrganic: { notes: "Automatic mid-tier hotel status + top-tier car rental status", value: "Soft" },
      },
      {
        id: "cell-insurance",
        benefit: "Cell Phone Insurance",
        subtitle: "Up to $800/claim · 2 claims/yr",
        maxValue: "Soft",
        organic: { notes: "Up to $1,600/yr — pay phone bill with the card to activate", value: "Soft" },
      },
      {
        id: "purchase-protection",
        benefit: "Purchase & Travel Protections",
        subtitle: "Purchase protection · Extended warranty · Trip delay/cancellation",
        maxValue: "Soft",
        organic: { notes: "Up to $10K/item purchase protection; $10K/trip cancellation; $500 trip delay", value: "Soft" },
      },
    ],
  },
  {
    id: "chase-ink-business",
    name: "Chase Ink Business Preferred®",
    annualFee: 95,
    tagline: "ANNUAL FEE ANALYSIS — 2026",
    accentColor: "blue",
    benefits: [
      {
        id: "cell-insurance",
        benefit: "Cell Phone Insurance",
        subtitle: "Up to $900/claim ($1,000 − $100 deductible) · 3 claims/12 months",
        maxValue: "Soft",
        organic: { notes: "Pay monthly phone bill with card to activate — replaces standalone insurance", value: "Soft" },
      },
      {
        id: "trip-cancel",
        benefit: "Trip Cancellation / Interruption Insurance",
        subtitle: "Up to $5,000/traveler · $10,000/trip",
        maxValue: "Soft",
        organic: { notes: "Covers non-refundable prepaid travel — book with card to activate", value: "Soft" },
      },
      {
        id: "trip-delay",
        benefit: "Trip Delay Reimbursement",
        subtitle: "Up to $500 · delays 12+ hours",
        maxValue: "Soft",
        organic: { notes: "Covers meals, lodging, and incidentals when flight delayed 12+ hours", value: "Soft" },
      },
      {
        id: "baggage-loss",
        benefit: "Baggage Loss / Damage Insurance",
        subtitle: "Up to $3,000 · $500 sub-limit for jewelry & electronics",
        maxValue: "Soft",
        organic: { notes: "Covers lost or damaged checked/carry-on baggage", value: "Soft" },
      },
      {
        id: "baggage-delay",
        benefit: "Baggage Delay Insurance",
        subtitle: "Up to $100/day · 5 days · delayed 6+ hours",
        maxValue: "Soft",
        organic: { notes: "Covers essential purchases when bag is delayed 6+ hours", value: "Soft" },
      },
      {
        id: "travel-accident",
        benefit: "Travel Accident Insurance",
        subtitle: "Up to $500,000 common carrier · $100,000 24-hr coverage",
        maxValue: "Soft",
        organic: { notes: "Automatic coverage when travel booked with card", value: "Soft" },
      },
      {
        id: "primary-rental",
        benefit: "Primary Rental Car Insurance",
        subtitle: "Business rentals — collision & theft, not liability",
        maxValue: "Soft",
        organic: { notes: "Primary coverage — decline dealer CDW and save ~$15–30/day", value: "Soft" },
      },
      {
        id: "purchase-protection",
        benefit: "Purchase Protection",
        subtitle: "120 days · up to $10,000/claim · $50,000/yr",
        maxValue: "Soft",
        organic: { notes: "Covers damage or theft on new purchases for 120 days", value: "Soft" },
      },
      {
        id: "extended-warranty",
        benefit: "Extended Warranty",
        subtitle: "+1 year on warranties of 3 years or less · $10,000/claim",
        maxValue: "Soft",
        organic: { notes: "Doubles manufacturer warranty up to 1 additional year", value: "Soft" },
      },
      {
        id: "dashpass",
        benefit: "DashPass — DoorDash & Caviar",
        subtitle: "Complimentary membership",
        maxValue: "Soft",
        nonOrganic: { notes: "$0 delivery fees + reduced service fees on eligible orders", value: "Soft" },
      },
      {
        id: "lyft",
        benefit: "5x Points on Lyft",
        subtitle: "Through September 30, 2027",
        maxValue: "Soft",
        organic: { notes: "5x instead of standard 3x travel rate — use Lyft for airport rides", value: "Soft" },
      },
      {
        id: "points-transfer",
        benefit: "Transfer to Travel Partners",
        subtitle: "10 airlines · 4 hotels (United, Hyatt, Southwest, British Airways + more)",
        maxValue: "Soft",
        organic: { notes: "1:1 transfer to 14 partners — Hyatt especially high value at ~2¢+/point", value: "Soft" },
      },
      {
        id: "no-foreign-fee",
        benefit: "No Foreign Transaction Fees",
        maxValue: "Soft",
        organic: { notes: "Use internationally with no added fees", value: "Soft" },
      },
      {
        id: "employee-cards",
        benefit: "Free Employee Cards",
        subtitle: "Set limits · track spend · earn points on employee purchases",
        maxValue: "Soft",
        organic: { notes: "Add employees at no extra cost — all spend earns points at same rates", value: "Soft" },
      },
    ],
  },
  {
    id: "amex-blue-everyday",
    name: "Amex Blue Cash Everyday®",
    annualFee: 0,
    tagline: "NO ANNUAL FEE — CASH BACK ANALYSIS 2026",
    accentColor: "indigo",
    benefits: [
      {
        id: "disney-bundle",
        benefit: "$84 Disney Bundle Credit",
        subtitle: "$7/mo — Disney+, Hulu, ESPN+",
        maxValue: 84,
        organic: { notes: "Monthly statement credit on Disney Bundle subscription", value: 84 },
      },
      {
        id: "home-chef",
        benefit: "$180 Home Chef Credit",
        subtitle: "$15/mo",
        maxValue: 180,
        organic: { notes: "Monthly statement credit on Home Chef meal kit orders", value: "TBD", icon: "hourglass" },
      },
      {
        id: "cash-back-grocery",
        benefit: "3% Cash Back — U.S. Supermarkets",
        subtitle: "Up to $6,000/yr then 1%",
        maxValue: "Soft",
        organic: { notes: "Automatic on grocery spend up to $6K/yr", value: "Soft" },
      },
      {
        id: "cash-back-online",
        benefit: "3% Cash Back — U.S. Online Retail",
        subtitle: "Up to $6,000/yr then 1%",
        maxValue: "Soft",
        organic: { notes: "Includes Amazon — automatic on online retail up to $6K/yr", value: "Soft" },
      },
      {
        id: "cash-back-gas",
        benefit: "3% Cash Back — U.S. Gas Stations",
        subtitle: "Up to $6,000/yr then 1%",
        maxValue: "Soft",
        organic: { notes: "Automatic on gas station purchases up to $6K/yr", value: "Soft" },
      },
      {
        id: "amex-offers",
        benefit: "Amex Offers",
        maxValue: "Soft",
        nonOrganic: { notes: "Extra cash back / credits at select brands — check app regularly", value: "Soft" },
      },
      {
        id: "purchase-protection",
        benefit: "Purchase Protection & Extended Warranty",
        maxValue: "Soft",
        organic: { notes: "Passive coverage on eligible purchases", value: "Soft" },
      },
    ],
  },
];

export async function getCards(): Promise<CardBenefitData[]> {
  const cards = await getData<CardBenefitData[]>("cards_v1", DEFAULT_CARDS);
  // Migrate: move Apple TV+ & Apple Music from nonOrganic → organic on CSR
  // Add new cards that don't exist in stored data yet
  const storedIds = new Set(cards.map((c) => c.id));
  const withNew = [
    ...cards,
    ...DEFAULT_CARDS.filter((c) => !storedIds.has(c.id)),
  ];

  const newAmexDefault = DEFAULT_CARDS.find((c) => c.id === "amex-business-platinum")!;
  const newInkDefault = DEFAULT_CARDS.find((c) => c.id === "chase-ink-business")!;
  const migrated = withNew.map((card) => {
    // Reset Amex Business Platinum if it has the old annual fee ($695) or old benefit IDs
    if (card.id === "amex-business-platinum" && (card.annualFee !== 895 || card.benefits.some((b) => b.id === "digital"))) {
      return newAmexDefault;
    }
    // Reset Chase Ink if it has old points rows OR is missing new benefits like trip-delay
    if (card.id === "chase-ink-business" && (
      card.benefits.some((b) => b.id === "travel-points" || b.id === "ads-points") ||
      !card.benefits.some((b) => b.id === "trip-delay")
    )) {
      return { ...newInkDefault, renewalDate: card.renewalDate };
    }
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
