import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import * as svc from "../services/profile.service.js";

export async function getMe(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const profile = await svc.getOrCreateProfile(user);
  res.json({ profile });
}

export async function updateMe(req: AuthedRequest, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  const patch = req.body || {};
  const profile = await svc.updateProfile(user, patch);
  res.json({ profile });
}
