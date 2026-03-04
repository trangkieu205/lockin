import path from "node:path";
import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import { env } from "../config/env.js";
import { readJsonFile, updateJsonFile } from "./json/jsonStore.js";

export type FoodRecord = {
  id: number;
  name: string;
  brand?: string | null;
  caloriesPer100g: number;
  servingSizeG?: number;
  servingLabel?: string;

  /**
   * URL path served by backend, e.g. "/assets/foods/milk.png"
   * (or absolute "http(s)://..." if you ever want remote images)
   */
  imagePrimaryUri?: string | null;

  isVerified?: boolean; // true for foods.json, false for custom
  createdAt?: string;
  createdByUserId?: number;
};

const FOODS_FILE = path.join(env.dataDir, "foods.json");
const FOODS_CUSTOM_FILE = path.join(env.dataDir, "foods.custom.json");

const ASSET_DIR = path.join(env.dataDir, "assets", "foods");

function norm(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

function pickImageUri(raw: any): string | null {
  // Accept multiple field names just in case foods.json uses older keys
  const v =
    raw?.imagePrimaryUri ??
    raw?.imageUri ??
    raw?.imageUrl ??
    raw?.image ??
    null;
  const s = String(v ?? "").trim();
  return s ? s : null;
}

/**
 * Normalize image uri so BOTH foods.json and foods.custom.json resolve consistently.
 * We want urls like:
 *   - "/assets/foods/xxx.png"  (served by backend)
 * Or absolute:
 *   - "https://..."
 */
function normalizeImageUri(uri: string | null): string | null {
  if (!uri) return null;

  // absolute remote
  if (/^https?:\/\//i.test(uri)) return uri;

  // already correct absolute path
  if (uri.startsWith("/assets/")) return uri;

  // "assets/foods/xxx.png" -> "/assets/foods/xxx.png"
  if (uri.startsWith("assets/")) return `/${uri}`;

  // common legacy shapes -> force under /assets/foods/
  // e.g. "foods/xxx.png", "/foods/xxx.png", "xxx.png"
  const fileName = uri.split("/").filter(Boolean).pop() || uri;
  return `/assets/foods/${fileName}`;
}

function normalizeFood(raw: any, defaults: Partial<FoodRecord> = {}): FoodRecord {
  const imagePrimaryUri = normalizeImageUri(pickImageUri(raw));
  return {
    ...raw,
    ...defaults,
    imagePrimaryUri,
  } as FoodRecord;
}

async function readAllFoods() {
  const base = await readJsonFile<any[]>(FOODS_FILE, []);
  const custom = await readJsonFile<any[]>(FOODS_CUSTOM_FILE, []);
  return { base, custom };
}

export async function listFoods(query?: string): Promise<FoodRecord[]> {
  const { base, custom } = await readAllFoods();

  const all: FoodRecord[] = [
    ...base.map((x) => normalizeFood(x, { isVerified: x?.isVerified ?? true })),
    ...custom.map((x) => normalizeFood(x, { isVerified: x?.isVerified ?? false })),
  ];

  const q = norm(query);
  const filtered = !q
    ? all
    : all.filter((f) => norm(f.name).includes(q) || norm(f.brand).includes(q));

  // verified first, then alphabetical
  filtered.sort((a, b) => {
    const av = a.isVerified ? 0 : 1;
    const bv = b.isVerified ? 0 : 1;
    if (av !== bv) return av - bv;
    return norm(a.name).localeCompare(norm(b.name));
  });

  return filtered;
}

export async function nextFoodId(): Promise<number> {
  const { base, custom } = await readAllFoods();
  const maxId = [...base, ...custom].reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  return maxId + 1;
}

function parseDataUrl(dataUrl: string): { ext: string; buf: Buffer } {
  // supports: data:image/png;base64,xxxx
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!m) throw new Error("Invalid image data");
  const mime = m[1];
  const b64 = m[2];
  const ext =
    mime.includes("png") ? "png" :
    mime.includes("jpeg") || mime.includes("jpg") ? "jpg" :
    mime.includes("webp") ? "webp" : "png";
  return { ext, buf: Buffer.from(b64, "base64") };
}

export async function createCustomFood(input: {
  name: string;
  brand?: string;
  caloriesPer100g: number;
  servingSizeG?: number;
  servingLabel?: string;
  imageBase64?: string; // data url
  createdByUserId: number;
}): Promise<FoodRecord> {
  const id = await nextFoodId();

  let imagePrimaryUri: string | null = null;
  if (input.imageBase64) {
    await fs.mkdir(ASSET_DIR, { recursive: true });

    const { ext, buf } = parseDataUrl(input.imageBase64);
    const safe = crypto.randomUUID().slice(0, 8);
    const fileName = `food_${id}_${safe}.${ext}`;
    const abs = path.join(ASSET_DIR, fileName);
    await fs.writeFile(abs, buf);

    imagePrimaryUri = `/assets/foods/${fileName}`;
  }

  const now = new Date().toISOString();
  const rec: FoodRecord = {
    id,
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    caloriesPer100g: Number(input.caloriesPer100g),
    servingSizeG: input.servingSizeG,
    servingLabel: input.servingLabel?.trim() || undefined,
    imagePrimaryUri,
    isVerified: false,
    createdAt: now,
    createdByUserId: input.createdByUserId,
  };

  await updateJsonFile<FoodRecord[]>(FOODS_CUSTOM_FILE, [], (cur) => [rec, ...cur]);

  return rec;
}
