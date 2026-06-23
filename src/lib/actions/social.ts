"use server";

import { revalidatePath } from "next/cache";
import { getData, setData } from "./userData";

export type Platform = "Instagram" | "TikTok" | "YouTube" | "Twitter/X" | "LinkedIn" | "Facebook" | "Pinterest";

export type PostStatus = "idea" | "draft" | "scheduled" | "published";

export type SocialPost = {
  id: string;
  platform: Platform;
  caption: string;
  notes: string;
  status: PostStatus;
  scheduled_date: string | null;
  tags: string[];
  created_at: string;
};

export type SocialData = {
  posts: SocialPost[];
};

const KEY = "social";
const FALLBACK: SocialData = { posts: [] };

export async function getSocialData(): Promise<SocialData> {
  return getData<SocialData>(KEY, FALLBACK);
}

export async function createPost(data: {
  platform: Platform;
  caption: string;
  notes?: string;
  status?: PostStatus;
  scheduled_date?: string;
  tags?: string[];
}): Promise<void> {
  const current = await getSocialData();
  const post: SocialPost = {
    id: crypto.randomUUID(),
    platform: data.platform,
    caption: data.caption,
    notes: data.notes ?? "",
    status: data.status ?? "idea",
    scheduled_date: data.scheduled_date ?? null,
    tags: data.tags ?? [],
    created_at: new Date().toISOString(),
  };
  await setData(KEY, { posts: [post, ...current.posts] }, "/social");
}

export async function updatePost(id: string, updates: Partial<Omit<SocialPost, "id" | "created_at">>): Promise<void> {
  const current = await getSocialData();
  const posts = current.posts.map((p) => (p.id === id ? { ...p, ...updates } : p));
  await setData(KEY, { posts }, "/social");
}

export async function deletePost(id: string): Promise<void> {
  const current = await getSocialData();
  const posts = current.posts.filter((p) => p.id !== id);
  await setData(KEY, { posts }, "/social");
}
