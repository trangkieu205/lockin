import { create, listByDate, remove, type CreateMealLogInput } from "../../repos/logs/mealLog.repo.js";

export async function list(date: string) {
  return listByDate(date);
}

export async function createLog(input: CreateMealLogInput) {
  if (!input?.date) throw new Error("date is required");
  if (!input?.mealType) throw new Error("mealType is required");
  if (!input?.foodName) throw new Error("foodName is required");
  return create(input);
}

export async function removeLog(id: number) {
  return remove(id);
}
