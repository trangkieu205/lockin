import path from "path";
import { env } from "../../config/env.js";
import { readJsonFile, updateJsonFile } from "../json/jsonStore.js";

export type WorkoutLog = {
  id: number;
  date: string;
  title: string;
  category?: string;
  minutes?: number;
  caloriesBurned: number;
  loggedAt: string;
  imageUrl?: string;
};

export type CreateWorkoutLogInput = Omit<WorkoutLog, "id" | "loggedAt">;

const FILE = path.join(env.dataDir, "workoutLogs.json");

export async function listByDate(date: string): Promise<WorkoutLog[]> {
  const items = await readJsonFile<WorkoutLog[]>(FILE, []);
  return items.filter((x) => x.date === date).sort((a, b) => (b.loggedAt || "").localeCompare(a.loggedAt || ""));
}

export async function create(input: CreateWorkoutLogInput): Promise<WorkoutLog> {
  const now = new Date().toISOString();
  let created: WorkoutLog | null = null;

  await updateJsonFile<WorkoutLog[]>(FILE, [], (cur) => {
    const nextId = cur.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    created = {
      id: nextId,
      date: input.date,
      title: input.title,
      category: input.category,
      minutes: input.minutes,
      caloriesBurned: Number(input.caloriesBurned) || 0,
      loggedAt: now,
      imageUrl: input.imageUrl,
    };
    return [created!, ...cur];
  });

  return created!;
}

export async function remove(id: number): Promise<boolean> {
  let removed = false;
  await updateJsonFile<WorkoutLog[]>(FILE, [], (cur) => {
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
