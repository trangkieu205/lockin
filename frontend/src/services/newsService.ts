// frontend/src/services/newsService.ts
export type NewsItem = {
  id: string;
  title: string;        // tiêu đề lớn
  content: string;      // nội dung nhỏ
  imageDataUrl?: string; // base64 (data:image/...)
  createdAt: string;    // ISO
};

export type CreateNewsInput = {
  title: string;
  content: string;
  imageDataUrl?: string;
};

const KEY = "demo_news_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uid(prefix = "news") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export async function listNews(): Promise<NewsItem[]> {
  const items = safeParse<NewsItem[]>(localStorage.getItem(KEY), []);
  // mới nhất lên đầu
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createNews(input: CreateNewsInput): Promise<NewsItem> {
  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) throw new Error("Title and content are required.");

  const items = safeParse<NewsItem[]>(localStorage.getItem(KEY), []);
  const item: NewsItem = {
    id: uid(),
    title,
    content,
    imageDataUrl: input.imageDataUrl,
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(items));
  return item;
}

export async function deleteNews(id: string): Promise<void> {
  const items = safeParse<NewsItem[]>(localStorage.getItem(KEY), []);
  const next = items.filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export async function clearAllNews(): Promise<void> {
  localStorage.removeItem(KEY);
}
