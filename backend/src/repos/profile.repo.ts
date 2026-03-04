import path from "path";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

export type UserProfile = {
  userId: number;
  name?: string;
  age?: number;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  measurements?: any;
  goal?: any;
  avatarDataUrl?: string;
  updatedAt?: string;
};

const PROFILE_FILE = path.join(env.dataDir, "profiles.json");
type Store = { items: UserProfile[] };
const EMPTY: Store = { items: [] };

export async function getProfile(userId: number): Promise<UserProfile | null> {
  const store = await readJsonFile<Store>(PROFILE_FILE, EMPTY);
  return store.items.find((x) => x.userId === userId) ?? null;
}

export async function upsertProfile(profile: UserProfile): Promise<UserProfile> {
  const now = new Date().toISOString();
  const out = { ...profile, updatedAt: now };

  await updateJsonFile<Store>(PROFILE_FILE, EMPTY, (cur) => {
    const items = cur.items || [];
    const idx = items.findIndex((x) => x.userId === out.userId);
    if (idx >= 0) {
      const next = items.slice();
      next[idx] = out;
      return { ...cur, items: next };
    }
    return { ...cur, items: [out, ...items] };
  });

  return out;
}
