import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.js";

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ message: "Unauthorized" });
  if ((user as any).role !== "admin") return res.status(403).json({ message: "Forbidden" });
  return next();
}
