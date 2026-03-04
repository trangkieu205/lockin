import type { Request, Response } from "express";
import { listFoods, createCustomFood } from "../repos/foods.repo.js";
import { addFavorite, getFavoriteIds, removeFavorite } from "../repos/foodsFavorites.repo.js";

function getUserId(req: Request): number {
  const uid = (req as any)?.user?.id ?? (req as any)?.userId ?? (req as any)?.auth?.userId;
  const n = Number(uid);
  if (!Number.isFinite(n) || n <= 0) throw new Error("Unauthorized");
  return n;
}

export async function list(req: Request, res: Response) {
  const query = typeof req.query.query === "string" ? req.query.query : "";
  const items = await listFoods(query);
  res.json({ items });
}

export async function favorites(req: Request, res: Response) {
  const userId = getUserId(req);
  const ids = await getFavoriteIds(userId);
  res.json({ ids });
}

export async function addFav(req: Request, res: Response) {
  const userId = getUserId(req);
  const foodId = Number(req.body?.foodId);
  if (!Number.isFinite(foodId)) return res.status(400).json({ message: "foodId is required" });
  const ids = await addFavorite(userId, foodId);
  res.json({ ids });
}

export async function delFav(req: Request, res: Response) {
  const userId = getUserId(req);
  const foodId = Number(req.params.foodId);
  if (!Number.isFinite(foodId)) return res.status(400).json({ message: "foodId invalid" });
  const ids = await removeFavorite(userId, foodId);
  res.json({ ids });
}

export async function createCustom(req: Request, res: Response) {
  const userId = getUserId(req);
  const name = String(req.body?.name ?? "").trim();
  const caloriesPer100g = Number(req.body?.caloriesPer100g);
  if (!name) return res.status(400).json({ message: "name is required" });
  if (!Number.isFinite(caloriesPer100g) || caloriesPer100g <= 0) {
    return res.status(400).json({ message: "caloriesPer100g must be > 0" });
  }

  const rec = await createCustomFood({
    name,
    brand: req.body?.brand,
    caloriesPer100g,
    servingSizeG: req.body?.servingSizeG ? Number(req.body.servingSizeG) : undefined,
    servingLabel: req.body?.servingLabel,
    imageBase64: req.body?.imageBase64, // data:image/png;base64,...
    createdByUserId: userId,
  });

  res.json({ item: rec });
}
