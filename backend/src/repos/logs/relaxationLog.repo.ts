import path from "path";
import { env } from "../../config/env.js";
import { readJsonFile, updateJsonFile } from ".././json/jsonStore.js";

export type RelaxationLog = {
  id: number;
  date: string;           // YYYY-MM-DD
  title: string;          // e.g. "Meditation", "Breathing", ...
  minutes: number;        // duration
  note?: string;
  mood?: string;          // optional
  loggedAt: string;       // ISO
  imageUrl?: string;      // optional
};

export type CreateRelaxationLogInput = Omit<RelaxationLog, "id" | "loggedAt">;

const FILE = path.join(env.dataDir, "relaxationLogs.json");

export async function listByDate(date: string): Promise<RelaxationLog[]> {
  const items = await readJsonFile<RelaxationLog[]>(FILE, []);
  return items
    .filter((x) => x.date === date)
    .sort((a, b) => (b.loggedAt || "").localeCompare(a.loggedAt || ""));
}

export async function create(input: CreateRelaxationLogInput): Promise<RelaxationLog> {
  const now = new Date().toISOString();
  let created: RelaxationLog | null = null;

  await updateJsonFile<RelaxationLog[]>(FILE, [], (cur) => {
    const nextId = cur.reduce((m, x) => Math.max(m, x.id), 0) + 1;

    created = {
      id: nextId,
      date: input.date,
      title: String(input.title ?? "").trim(),
      minutes: Number(input.minutes) || 0,
      note: input.note,
      mood: input.mood,
      imageUrl: input.imageUrl,
      loggedAt: now,
    };

    return [created!, ...cur];
  });

  return created!;
}

export async function remove(id: number): Promise<boolean> {
  let removed = false;

  await updateJsonFile<RelaxationLog[]>(FILE, [], (cur) => {
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
