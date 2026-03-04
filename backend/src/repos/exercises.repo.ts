import path from "path";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

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

  imageUrl?: string;       // "/assets/exercises/xxx.png"
  isFavorite?: boolean;    // computed from favorites file
};

type Store = { items: Exercise[] } | Exercise[];
function normalizeStore(s: Store): Exercise[] {
  if (Array.isArray(s)) return s;
  return Array.isArray((s as any).items) ? (s as any).items : [];
}

const BASE_FILE = path.join(env.dataDir, "exercises.json");
const CUSTOM_FILE = path.join(env.dataDir, "exercises.custom.json");
const FAV_FILE = path.join(env.dataDir, "exercises.favorites.json");

type FavStore = { ids: Array<number | string> };

function normId(id: any) {
  return String(id);
}

export async function listExercises(): Promise<Exercise[]> {
  const [baseRaw, customRaw, favRaw] = await Promise.all([
    readJsonFile<Store>(BASE_FILE, [] as any),
    readJsonFile<Store>(CUSTOM_FILE, [] as any),
    readJsonFile<FavStore>(FAV_FILE, { ids: [] }),
  ]);

  const base = normalizeStore(baseRaw);
  const custom = normalizeStore(customRaw).map((x) => ({
    ...x,
    isCustom: true,
  }));

  const favSet = new Set((favRaw?.ids ?? []).map(normId));

  // merge (custom overrides base by id)
  const map = new Map<string, Exercise>();
  for (const x of base) map.set(normId(x.id), { ...x });
  for (const x of custom) map.set(normId(x.id), { ...x });

  return Array.from(map.values()).map((x) => ({
    ...x,
    isFavorite: favSet.has(normId(x.id)),
  }));
}

export async function listFavoriteExercises(): Promise<Exercise[]> {
  const all = await listExercises();
  return all.filter((x) => x.isFavorite);
}

export async function createCustomExercise(input: {
  title: string;
  category?: string;
  met?: number;
  caloriesPerMinute?: number;
  imageUrl?: string;
  desc?: string;
}): Promise<Exercise> {
  const title = String(input.title ?? "").trim();
  if (!title) throw new Error("Title is required");

  const now = new Date().toISOString();

  const next = await updateJsonFile<Store>(CUSTOM_FILE, [] as any, (cur) => {
    const arr = normalizeStore(cur);

    const maxId =
      arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 100000) || 100000;

    const rec: Exercise = {
      id: maxId + 1,
      title,
      category: input.category?.trim() || "Other",
      met: input.met,
      caloriesPerMinute: input.caloriesPerMinute,
      desc: input.desc,
      imageUrl: input.imageUrl?.trim() || undefined,
      isCustom: true,
      createdAt: now,
    };

    return [rec, ...arr];
  });

  const arr = normalizeStore(next);
  return arr[0] as Exercise;
}

export async function deleteCustomExercise(id: number | string): Promise<boolean> {
  const before = await readJsonFile<Store>(CUSTOM_FILE, [] as any);
  const arr = normalizeStore(before);
  const nid = normId(id);

  const filtered = arr.filter((x) => normId(x.id) !== nid);
  if (filtered.length === arr.length) return false;

  await updateJsonFile<Store>(CUSTOM_FILE, [] as any, () => filtered as any);
  return true;
}

export async function setFavorite(id: number | string, isFavorite?: boolean) {
  const nid = normId(id);

  const next = await updateJsonFile<FavStore>(FAV_FILE, { ids: [] }, (cur) => {
    const ids = Array.isArray(cur?.ids) ? [...cur.ids] : [];
    const set = new Set(ids.map(normId));

    const want =
      typeof isFavorite === "boolean" ? isFavorite : !set.has(nid);

    if (want) {
      if (!set.has(nid)) ids.unshift(id);
    } else {
      return { ids: ids.filter((x) => normId(x) !== nid) };
    }

    // dedupe while preserving
    const seen = new Set<string>();
    const out: Array<number | string> = [];
    for (const x of ids) {
      const k = normId(x);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(x);
    }
    return { ids: out };
  });

  const favSet = new Set((next?.ids ?? []).map(normId));
  return { id, isFavorite: favSet.has(nid) };
}
