export const dynamic = "force-dynamic";

import { getCards } from "@/lib/actions/cards";
import CardBenefits from "@/components/CardBenefits";

export default async function CardsPage() {
  const cards = await getCards();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Card Benefits</h1>
        <p className="text-sm text-gray-500 mt-1">Annual fee analysis — are you getting your money's worth?</p>
      </div>
      <CardBenefits cards={cards} />
    </div>
  );
}
