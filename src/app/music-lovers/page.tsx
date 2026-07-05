import { getTasks } from "@/lib/actions/tasks";
import { getContentPosts, getContentIdeas } from "@/lib/actions/musicContent";
import MusicLoversHub from "@/components/MusicLoversHub";
import { Music } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MusicLoversPage() {
  const [allTasks, posts, ideas] = await Promise.all([
    getTasks(),
    getContentPosts(),
    getContentIdeas(),
  ]);

  const tasks = allTasks.filter((t) => t.category === "Music Lovers");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Music size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Music Lovers Hub</h1>
          <p className="text-sm text-gray-500">Content calendar, ideas, and tasks for your music channel</p>
        </div>
      </div>

      <MusicLoversHub tasks={tasks} posts={posts} ideas={ideas} />
    </div>
  );
}
