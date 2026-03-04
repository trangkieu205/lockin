import type { Request, Response } from "express";
import { searchExercises } from "../services/exercises.service.js";
import {
  createCustomExercise,
  deleteCustomExercise,
  listFavoriteExercises,
  setFavorite,
} from "../repos/exercises.repo.js";

export async function list(req: Request, res: Response) {
  const query = String(req.query.query ?? "");
  const category = String(req.query.category ?? "");
  const items = await searchExercises({ query, category });
  res.json({ items });
}

export async function favorites(_req: Request, res: Response) {
  const items = await listFavoriteExercises();
  res.json({ items });
}

export async function createCustom(req: Request, res: Response) {
  try {
    const item = await createCustomExercise(req.body ?? {});
    res.json({ item });
  } catch (e: any) {
    res.status(400).json({ message: e?.message ?? "Bad Request" });
  }
}

export async function removeCustom(req: Request, res: Response) {
  const id = String(req.params.id ?? "");
  const ok = await deleteCustomExercise(id);
  if (!ok) return res.status(404).json({ message: "Not found" });
  res.status(204).send();
}

export async function favorite(req: Request, res: Response) {
  const id = String(req.params.id ?? "");
  const isFavorite =
    typeof req.body?.isFavorite === "boolean" ? req.body.isFavorite : undefined;

  const out = await setFavorite(id, isFavorite);
  res.json(out);
}
