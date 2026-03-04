import type { Request, Response } from "express";
import * as svc from "../../services/logs/meal.service.js";


export async function list(req: Request, res: Response) {
  const date = String(req.query.date ?? "");
  if (!date) return res.status(400).json({ message: "date is required" });
  const items = await svc.list(date);
  res.json({ items });
}

export async function create(req: Request, res: Response) {
  try {
    const item = await svc.createLog(req.body);
    res.json({ item });
  } catch (e: any) {
    res.status(400).json({ message: e?.message ?? "Bad Request" });
  }
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  const ok = await svc.removeLog(id);
  if (!ok) return res.status(404).json({ message: "Not found" });
  res.status(204).send();
}
