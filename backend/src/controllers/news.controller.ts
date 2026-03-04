import type { Request, Response } from "express";
import * as svc from "../services/news.service.js";

export async function list(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const items = await svc.list(Number.isFinite(limit) ? limit : 20);
  res.json({ items });
}
