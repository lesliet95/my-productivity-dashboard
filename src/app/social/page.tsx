export const dynamic = "force-dynamic";

import { getSocialData } from "@/lib/actions/social";
import SocialPlanner from "@/components/SocialPlanner";

export default async function SocialPage() {
  const data = await getSocialData();

  const published = data.posts.filter((p) => p.status === "published").length;
  const scheduled = data.posts.filter((p) => p.status === "scheduled").length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Social Media</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.posts.length} posts total · {scheduled} scheduled · {published} published
        </p>
      </div>
      <SocialPlanner initialData={data} />
    </div>
  );
}
