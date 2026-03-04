// frontend/src/services/mealLogService.ts
import { getJson, postJson, delJson } from "./http";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | string;

export type MealLog = {
  id: number | string;
  date: string; // YYYY-MM-DD
  mealType: MealType;

  foodId?: number | string;
  foodName: string;
  brand?: string;

  grams?: number;
  calories: number;

  createdAt?: string;
  loggedAt?: string;
};

type ListResponse<T> = { items: T[] } | T[];

/**
 * GET /logs/meals?date=YYYY-MM-DD
 */
export async function listMealLogs(dateKey: string): Promise<ListResponse<MealLog>> {
  return getJson(`/logs/meals?date=${encodeURIComponent(dateKey)}`);
}

/**
 * POST /logs/meals
 * body: { date, mealType, foodName, calories, grams?, ... }
 */
export async function createMealLog(payload: Partial<MealLog>) {
  return postJson(`/logs/meals`, payload);
}

/**
 * DELETE /logs/meals/:id
 */
export async function deleteMealLog(id: number | string) {
  return delJson(`/logs/meals/${id}`);
}
