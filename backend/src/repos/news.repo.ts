import path from "path";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

export type NewsItem = {
  id: number;
  title: string;
  content?: string;
  excerpt?: string;
  coverUrl?: string;
  createdBy?: string;
  createdAt: string;
};

export type CreateNewsInput = {
  title: string;
  content?: string;
  excerpt?: string;
  coverUrl?: string;
  createdBy?: string;
};

const FILE = path.join(env.dataDir, "news.json");

type Store = { items: NewsItem[] };
const EMPTY: Store = { items: [] };

function normalize(s: any): Store {
  if (Array.isArray(s)) return { items: s };
  if (s && Array.isArray(s.items)) return s;
  return EMPTY;
}

export async function list(limit: number = 20): Promise<NewsItem[]> {
  const raw = await readJsonFile<any>(FILE, EMPTY as any);
  const store = normalize(raw);
  return store.items
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, Math.max(0, limit));
}

export async function create(input: CreateNewsInput): Promise<NewsItem> {
  if (!input?.title) throw new Error("title is required");

  const now = new Date().toISOString();
  let created: NewsItem | null = null;

  await updateJsonFile<any>(FILE, EMPTY as any, (cur) => {
    const store = normalize(cur);
    const nextId = store.items.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    created = {
      id: nextId,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      coverUrl: input.coverUrl,
      createdBy: input.createdBy,
      createdAt: now,
    };
    return { items: [created!, ...store.items] };
  });

  return created!;
}

export async function remove(id: number): Promise<boolean> {
  let removed = false;
  await updateJsonFile<any>(FILE, EMPTY as any, (cur) => {
    const store = normalize(cur);
    const items = store.items.filter((x) => {
      if (x.id === id) {
        removed = true;
        return false;
      }
      return true;
    });
    return { items };
  });
  return removed;
}
