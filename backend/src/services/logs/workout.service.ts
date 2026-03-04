import { create, listByDate, remove, type CreateWorkoutLogInput } from "../../repos/logs/workoutLog.repo.js";

export async function list(date: string) {
  return listByDate(date);
}

export async function createLog(input: CreateWorkoutLogInput) {
  if (!input?.date) throw new Error("date is required");
  if (!input?.title) throw new Error("title is required");
  return create(input);
}

export async function removeLog(id: number) {
  return remove(id);
}
