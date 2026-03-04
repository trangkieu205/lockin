import path from "path";
import { env } from "../../config/env.js";
import { readJsonFile, updateJsonFile } from "../json/jsonStore.js";

export type MealLog = {
  id: number;
  date: string;
  mealType: string;
  foodName: string;
  brand?: string;
  grams?: number;
  calories: number;
  loggedAt: string;
};

export type CreateMealLogInput = Omit<MealLog, "id" | "loggedAt">;

const FILE = path.join(env.dataDir, "mealLogs.json");

export async function listByDate(date: string): Promise<MealLog[]> {
  const items = await readJsonFile<MealLog[]>(FILE, []);
  return items.filter((x) => x.date === date).sort((a, b) => (b.loggedAt || "").localeCompare(a.loggedAt || ""));
}

export async function create(input: CreateMealLogInput): Promise<MealLog> {
  const now = new Date().toISOString();
  let created: MealLog | null = null;

  await updateJsonFile<MealLog[]>(FILE, [], (cur) => {
    const nextId = cur.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    created = {
      id: nextId,
      date: input.date,
      mealType: input.mealType,
      foodName: input.foodName,
      brand: input.brand,
      grams: input.grams,
      calories: Number(input.calories) || 0,
      loggedAt: now,
    };
    return [created!, ...cur];
  });

  return created!;
}

export async function remove(id: number): Promise<boolean> {
  let removed = false;
  await updateJsonFile<MealLog[]>(FILE, [], (cur) => {
    const next = cur.filter((x) => {
      if (x.id === id) {
        removed = true;
        return false;
      }
      return true;
    });
    return next;
  });
  return removed;
}
