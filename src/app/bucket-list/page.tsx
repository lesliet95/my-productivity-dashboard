export const dynamic = "force-dynamic";

import { getBucketList } from "@/lib/actions/bucketList";
import BucketList from "@/components/BucketList";

export default async function BucketListPage() {
  const data = await getBucketList();
  const completed = data.items.filter((i) => i.completed).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bucket List</h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.items.length} things to do · {completed} completed
        </p>
      </div>
      <BucketList initialData={data} />
    </div>
  );
}
