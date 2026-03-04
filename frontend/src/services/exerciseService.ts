import { delJson, getJson, patchJson, postJson } from "./http";

export type Exercise = {
  id: number | string;
  title: string;
  category?: string;
  met?: number;
  caloriesPerMinute?: number;
  desc?: string;
  isVerified?: boolean;

  isCustom?: boolean;
  createdAt?: string;

  imageUrl?: string; // "/assets/exercises/xxx.png"
  isFavorite?: boolean;
};

// ✅ Demo DB keys (phải khớp với AdminPage)
const KEY_EXERCISES = "demo_exercises_db_v1";
const KEY_FAVS = "demo_exercise_favs_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getDemoExercisesRaw(): any[] | null {
  try {
    const raw = localStorage.getItem(KEY_EXERCISES);
    if (!raw) return null;
    const arr = safeParse<any[]>(raw, []);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function getFavSet(): Set<string> {
  try {
    const arr = safeParse<string[]>(localStorage.getItem(KEY_FAVS), []);
    return new Set(arr.map(String));
  } catch {
    return new Set<string>();
  }
}

function saveFavSet(set: Set<string>) {
  try {
    localStorage.setItem(KEY_FAVS, JSON.stringify(Array.from(set)));
  } catch {}
}

function normalizeExercise(raw: any, favs?: Set<string>): Exercise {
  const id = raw?.id ?? raw?._id ?? raw?.key ?? `${Date.now()}`;
  const idStr = String(id);

  // JSON của bạn đang dùng imagePrimaryUri, FE service dùng imageUrl
  const imageUrl =
    raw?.imageUrl ??
    raw?.imagePrimaryUri ??
    raw?.image ??
    undefined;

  return {
    id,
    title: raw?.title ?? raw?.name ?? "Exercise",
    category: raw?.category,
    met: raw?.met,
    caloriesPerMinute: raw?.caloriesPerMinute ?? raw?.calories_per_minute,
    desc: raw?.desc ?? raw?.description,
    isVerified: raw?.isVerified ?? true,
    isCustom: raw?.isCustom ?? raw?.is_custom,
    createdAt: raw?.createdAt,
    imageUrl,
    isFavorite: favs ? favs.has(idStr) : raw?.isFavorite ?? false,
  };
}

function getDemoExercises(): Exercise[] | null {
  const raw = getDemoExercisesRaw();
  if (!raw) return null;
  const favs = getFavSet();
  return raw.map((x) => normalizeExercise(x, favs));
}

function saveDemoExercises(exercises: any[]) {
  try {
    localStorage.setItem(KEY_EXERCISES, JSON.stringify(exercises));
  } catch {}
}

function includesInsensitive(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export async function searchExercises(params?: { query?: string; category?: string }) {
  const demo = getDemoExercises();
  if (demo) {
    const q = (params?.query ?? "").trim();
    const c = (params?.category ?? "").trim();

    const filtered = demo.filter((e) => {
      const okQ = !q || includesInsensitive(e.title ?? "", q);
      const okC = !c || (e.category ?? "").toLowerCase() === c.toLowerCase();
      return okQ && okC;
    });

    return { items: filtered };
  }

  // fallback: backend
  const q = encodeURIComponent(params?.query ?? "");
  const c = encodeURIComponent(params?.category ?? "");
  return getJson<{ items: Exercise[] }>(`/exercises?query=${q}&category=${c}`);
}

export async function listFavoriteExercises() {
  const demo = getDemoExercises();
  if (demo) {
    const favs = getFavSet();
    const items = demo.filter((e) => favs.has(String(e.id))).map((e) => ({ ...e, isFavorite: true }));
    return { items };
  }

  return getJson<{ items: Exercise[] }>(`/exercises/favorites`);
}

export async function toggleExerciseFavorite(id: number | string) {
  const demo = getDemoExercises();
  if (demo) {
    const favs = getFavSet();
    const key = String(id);
    const next = !favs.has(key);
    if (next) favs.add(key);
    else favs.delete(key);
    saveFavSet(favs);
    return { id, isFavorite: next };
  }

  return patchJson<{ id: number | string; isFavorite: boolean }>(`/exercises/${id}/favorite`, {});
}

export async function createCustomExercise(input: {
  title: string;
  category?: string;
  met?: number;
  caloriesPerMinute?: number;
  imageUrl?: string;
  desc?: string;
}) {
  const raw = getDemoExercisesRaw();
  if (raw) {
    const id = `c_${Date.now()}`;
    const item = {
      id,
      title: input.title,
      category: input.category,
      met: input.met,
      caloriesPerMinute: input.caloriesPerMinute,
      desc: input.desc,
      isVerified: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      // lưu theo schema data của bạn: imagePrimaryUri
      imagePrimaryUri: input.imageUrl,
    };
    const next = [item, ...raw];
    saveDemoExercises(next);

    return { item: normalizeExercise(item, getFavSet()) };
  }

  return postJson<{ item: Exercise }>(`/exercises/custom`, input);
}

export async function deleteCustomExercise(id: number | string) {
  const raw = getDemoExercisesRaw();
  if (raw) {
    const key = String(id);
    const next = raw.filter((x) => String(x?.id) !== key);
    saveDemoExercises(next);

    const favs = getFavSet();
    if (favs.has(key)) {
      favs.delete(key);
      saveFavSet(favs);
    }
    return { ok: true };
  }

  return delJson(`/exercises/custom/${id}`);
}
