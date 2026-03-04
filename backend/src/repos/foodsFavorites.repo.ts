import path from "node:path";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

const FAV_FILE = path.join(env.dataDir, "foodFavorites.json");

type FavMap = Record<string, number[]>;

export async function getFavoriteIds(userId: number): Promise<number[]> {
  const map = await readJsonFile<FavMap>(FAV_FILE, {});
  return map[String(userId)] ?? [];
}

export async function addFavorite(userId: number, foodId: number): Promise<number[]> {
  const next = await updateJsonFile<FavMap>(FAV_FILE, {}, (cur) => {
    const key = String(userId);
    const arr = Array.isArray(cur[key]) ? cur[key] : [];
    if (!arr.includes(foodId)) cur[key] = [foodId, ...arr];
    return cur;
  });
  return next[String(userId)] ?? [];
}

export async function removeFavorite(userId: number, foodId: number): Promise<number[]> {
  const next = await updateJsonFile<FavMap>(FAV_FILE, {}, (cur) => {
    const key = String(userId);
    const arr = Array.isArray(cur[key]) ? cur[key] : [];
    cur[key] = arr.filter((x) => x !== foodId);
    return cur;
  });
  return next[String(userId)] ?? [];
}
