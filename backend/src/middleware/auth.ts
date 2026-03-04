// backend/src/middleware/auth.ts
import type { Request, Response, NextFunction } from "express";
import { getSession, getUserById, type UserPublic } from "../repos/auth.repo.js";

export type AuthedRequest = Request & { user?: UserPublic };

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = String(req.headers.authorization ?? "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth || null;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const session = await getSession(token);
    if (!session) return res.status(401).json({ message: "Unauthorized" });

    const user = await getUserById(session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}
