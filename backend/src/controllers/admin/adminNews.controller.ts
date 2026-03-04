import type { Request, Response } from "express";
import * as news from "../../services/news.service.js";

export async function create(req: Request, res: Response) {
  try {
    const adminName = String((req as any).user?.name ?? "Admin");
    const item = await news.create({
      title: req.body?.title,
      content: req.body?.content,
      excerpt: req.body?.excerpt,
      coverUrl: req.body?.coverUrl,
      createdBy: adminName,
    });
    res.json({ item });
  } catch (e: any) {
    res.status(400).json({ message: e?.message ?? "Bad Request" });
  }
}

export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
  const ok = await news.remove(id);
  if (!ok) return res.status(404).json({ message: "Not found" });
  res.status(204).send();
}
