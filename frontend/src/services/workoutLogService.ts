// frontend/src/services/workoutLogService.ts
import { getJson, postJson, delJson } from "./http";

export type WorkoutLog = {
  id: number | string;
  date: string; // YYYY-MM-DD

  // exercise info
  exerciseId?: number | string;
  title: string; // exercise title/name
  category?: string;

  minutes?: number;

  // calories burned
  caloriesBurned: number;

  createdAt?: string;
  loggedAt?: string;
};

type ListResponse<T> = { items: T[] } | T[];

/**
 * GET /logs/workouts?date=YYYY-MM-DD
 */
export async function listWorkoutLogs(dateKey: string): Promise<ListResponse<WorkoutLog>> {
  return getJson(`/logs/workouts?date=${encodeURIComponent(dateKey)}`);
}

/**
 * POST /logs/workouts
 * body: { date, title, minutes?, caloriesBurned, category?, exerciseId? }
 */
export async function createWorkoutLog(payload: Partial<WorkoutLog>) {
  return postJson(`/logs/workouts`, payload);
}

/**
 * DELETE /logs/workouts/:id
 */
export async function deleteWorkoutLog(id: number | string) {
  return delJson(`/logs/workouts/${id}`);
}
