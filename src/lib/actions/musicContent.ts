"use server";

import { revalidatePath } from "next/cache";
import { getData, setData } from "@/lib/actions/userData";

export type Platform = "instagram" | "tiktok" | "youtube" | "twitter" | "facebook";

export type ContentStatus = "idea" | "filming" | "editing" | "scheduled" | "posted";

export type ContentPost = {
  id: string;
  title: string;
  caption?: string;
  platforms: Platform[];
  status: ContentStatus;
  scheduledDate?: string;
  notes?: string;
  createdAt: string;
};

export type ContentIdea = {
  id: string;
  title: string;
  description?: string;
  platforms: Platform[];
  createdAt: string;
};

function revalidate() {
  revalidatePath("/music-lovers");
}

// ── Content Calendar ──────────────────────────────────────────────────────────

export async function getContentPosts(): Promise<ContentPost[]> {
  return getData<ContentPost[]>("music_content_v1", []);
}

async function savePosts(posts: ContentPost[]) {
  await setData("music_content_v1", posts);
  revalidate();
}

export async function createContentPost(data: Omit<ContentPost, "id" | "createdAt">) {
  const posts = await getContentPosts();
  const post: ContentPost = { ...data, id: `p${Date.now()}`, createdAt: new Date().toISOString() };
  await savePosts([...posts, post]);
}

export async function updateContentPost(id: string, data: Partial<Omit<ContentPost, "id" | "createdAt">>) {
  const posts = await getContentPosts();
  await savePosts(posts.map((p) => p.id === id ? { ...p, ...data } : p));
}

export async function deleteContentPost(id: string) {
  const posts = await getContentPosts();
  await savePosts(posts.filter((p) => p.id !== id));
}

// ── Ideas Bank ────────────────────────────────────────────────────────────────

export async function getContentIdeas(): Promise<ContentIdea[]> {
  return getData<ContentIdea[]>("music_ideas_v1", []);
}

async function saveIdeas(ideas: ContentIdea[]) {
  await setData("music_ideas_v1", ideas);
  revalidate();
}

export async function createContentIdea(data: Omit<ContentIdea, "id" | "createdAt">) {
  const ideas = await getContentIdeas();
  const idea: ContentIdea = { ...data, id: `i${Date.now()}`, createdAt: new Date().toISOString() };
  await saveIdeas([...ideas, idea]);
}

export async function updateContentIdea(id: string, data: Partial<Omit<ContentIdea, "id" | "createdAt">>) {
  const ideas = await getContentIdeas();
  await saveIdeas(ideas.map((i) => i.id === id ? { ...i, ...data } : i));
}

export async function deleteContentIdea(id: string) {
  const ideas = await getContentIdeas();
  await saveIdeas(ideas.filter((i) => i.id !== id));
}

export async function promoteIdeaToPost(id: string) {
  const [ideas, posts] = await Promise.all([getContentIdeas(), getContentPosts()]);
  const idea = ideas.find((i) => i.id === id);
  if (!idea) return;
  const post: ContentPost = {
    id: `p${Date.now()}`, title: idea.title, platforms: idea.platforms,
    status: "idea", notes: idea.description, createdAt: new Date().toISOString(),
  };
  await Promise.all([
    setData("music_ideas_v1", ideas.filter((i) => i.id !== id)),
    setData("music_content_v1", [...posts, post]),
  ]);
  revalidate();
}
