import { delJson, getJson, postJson } from "./http";

export type Food = {
  id: number;
  name: string;
  brand?: string | null;
  caloriesPer100g: number;

  // optional extras (foods.json của bạn có các field này)
  proteinPer100g?: number;
  carbPer100g?: number;
  fatPer100g?: number;

  servingSizeG?: number;
  servingLabel?: string;

  // có thể là path ("assets/foods/...") hoặc data URL (base64)
  imagePrimaryUri?: string | null;

  isVerified?: boolean;
  createdAt?: string;
};

// ✅ Demo DB key do AdminPage lưu
const KEY_FOODS = "demo_foods_db_v1";

// ✅ Đồng bộ với MealPage favorites key hiện tại
const KEY_FAVS = "lockin_fav_food_ids";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getDemoFoodsRaw(): any[] | null {
  try {
    const raw = localStorage.getItem(KEY_FOODS);
    if (!raw) return null;
    const arr = safeParse<any[]>(raw, []);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function normalizeFood(raw: any): Food {
  return {
    id: Number(raw?.id),
    name: raw?.name ?? raw?.title ?? "Food",
    brand: raw?.brand ?? null,
    caloriesPer100g: Number(raw?.caloriesPer100g ?? raw?.kcalPer100g ?? 0),

    proteinPer100g: raw?.proteinPer100g != null ? Number(raw.proteinPer100g) : undefined,
    carbPer100g: raw?.carbPer100g != null ? Number(raw.carbPer100g) : undefined,
    fatPer100g: raw?.fatPer100g != null ? Number(raw.fatPer100g) : undefined,

    servingSizeG: raw?.servingSizeG != null ? Number(raw.servingSizeG) : undefined,
    servingLabel: raw?.servingLabel ?? undefined,

    imagePrimaryUri: raw?.imagePrimaryUri ?? raw?.imageUrl ?? raw?.image ?? null,
    isVerified: raw?.isVerified ?? true,
    createdAt: raw?.createdAt,
  };
}

function includesInsensitive(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function getFavIdsLocal(): number[] {
  const arr = safeParse<any[]>(localStorage.getItem(KEY_FAVS), []);
  return arr.map((x) => Number(x)).filter((x) => Number.isFinite(x));
}

function saveFavIdsLocal(ids: number[]) {
  try {
    localStorage.setItem(KEY_FAVS, JSON.stringify(ids));
  } catch {}
}

export function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5179";
}

export async function searchFoods(query: string) {
  const demo = getDemoFoodsRaw();
  if (demo) {
    const q = (query ?? "").trim();
    const items = demo
      .map(normalizeFood)
      .filter((f) => {
        if (!q) return true;
        return (
          includesInsensitive(f.name ?? "", q) ||
          includesInsensitive(f.brand ?? "", q)
        );
      });
    return items;
  }

  const res = await getJson<{ items: Food[] }>(`/foods?query=${encodeURIComponent(query || "")}`);
  return res?.items ?? [];
}

export async function getFavoriteIds() {
  const demo = getDemoFoodsRaw();
  if (demo) return getFavIdsLocal();

  const res = await getJson<{ ids: number[] }>(`/foods/favorites`);
  return res?.ids ?? [];
}

export async function addFavorite(foodId: number) {
  const demo = getDemoFoodsRaw();
  if (demo) {
    const ids = getFavIdsLocal();
    if (!ids.includes(foodId)) ids.unshift(foodId);
    saveFavIdsLocal(ids);
    return ids;
  }

  const res = await postJson<{ ids: number[] }>(`/foods/favorites`, { foodId });
  return res?.ids ?? [];
}

export async function removeFavorite(foodId: number) {
  const demo = getDemoFoodsRaw();
  if (demo) {
    const ids = getFavIdsLocal().filter((x) => x !== foodId);
    saveFavIdsLocal(ids);
    return ids;
  }

  const res = await delJson<{ ids: number[] }>(`/foods/favorites/${foodId}`);
  return res?.ids ?? [];
}

export async function createCustomFood(payload: {
  name: string;
  brand?: string;
  caloriesPer100g: number;
  servingSizeG?: number;
  servingLabel?: string;

  // MealPage đang dùng imageDataUrl, mình support cả 2
  imageBase64?: string; // data url
  imageDataUrl?: string; // data url
}) {
  const demo = getDemoFoodsRaw();
  if (demo) {
    const maxId = demo.reduce((m, x) => {
      const n = Number(x?.id);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    const id = maxId + 1;

    const item = {
      id,
      name: payload.name,
      brand: payload.brand ?? null,
      caloriesPer100g: Number(payload.caloriesPer100g),
      servingSizeG: payload.servingSizeG,
      servingLabel: payload.servingLabel,
      imagePrimaryUri: payload.imageBase64 ?? payload.imageDataUrl ?? null,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    const next = [item, ...demo];
    try {
      localStorage.setItem(KEY_FOODS, JSON.stringify(next));
    } catch {}

    return normalizeFood(item);
  }

  // backend
  const body: any = {
    name: payload.name,
    brand: payload.brand,
    caloriesPer100g: payload.caloriesPer100g,
    servingSizeG: payload.servingSizeG,
    servingLabel: payload.servingLabel,
    imageBase64: payload.imageBase64 ?? payload.imageDataUrl,
    imageDataUrl: payload.imageDataUrl ?? payload.imageBase64,
  };

  const res = await postJson<{ item: Food }>(`/foods/custom`, body);
  return res?.item;
}
