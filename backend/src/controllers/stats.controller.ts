import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { todayStats } from "../services/stats.service.js";

export async function today(req: AuthedRequest, res: Response) {
  const date = String(req.query.date ?? "").trim();
  if (!date) return res.status(400).json({ message: "date is required" });
  const dto = await todayStats(date, req.user ?? null);
  res.json(dto);
}
