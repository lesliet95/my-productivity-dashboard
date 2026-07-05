"use server";

import { getData, setData } from "./userData";

export interface BucketListItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  category?: string;
  imageUrl?: string;
}

export type BucketListData = {
  items: BucketListItem[];
};

const KEY = "bucket_list";
const FALLBACK: BucketListData = { items: [] };

export async function getBucketList(): Promise<BucketListData> {
  return getData<BucketListData>(KEY, FALLBACK);
}

export async function addBucketItem(item: Omit<BucketListItem, "id" | "completed" | "completedAt">): Promise<void> {
  const current = await getBucketList();
  const newItem: BucketListItem = { ...item, id: crypto.randomUUID(), completed: false };
  await setData(KEY, { items: [...current.items, newItem] }, "/bucket-list");
}

export async function toggleBucketItem(id: string): Promise<void> {
  const current = await getBucketList();
  const items = current.items.map((item) =>
    item.id === id
      ? { ...item, completed: !item.completed, completedAt: !item.completed ? new Date().toISOString() : undefined }
      : item
  );
  await setData(KEY, { items }, "/bucket-list");
}

export async function deleteBucketItem(id: string): Promise<void> {
  const current = await getBucketList();
  await setData(KEY, { items: current.items.filter((i) => i.id !== id) }, "/bucket-list");
}

export async function updateBucketItem(id: string, patch: Partial<Pick<BucketListItem, "text" | "category" | "imageUrl">>): Promise<void> {
  const current = await getBucketList();
  await setData(KEY, { items: current.items.map((i) => i.id === id ? { ...i, ...patch } : i) }, "/bucket-list");
}
