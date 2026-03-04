import type { Request, Response } from "express";
import * as svc from "../services/auth.service.js";

function bearerToken(req: Request): string | null {
  const h = String(req.headers.authorization || "");
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function statusFromErr(err: any) {
  const s = Number(err?.status ?? err?.statusCode ?? err?.code);
  return Number.isFinite(s) && s >= 400 && s <= 599 ? s : 500;
}

function messageFromErr(err: any) {
  return String(err?.message || err?.error || "Internal Server Error");
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, age } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const user = await svc.register({ email, password, name, age });
    res.json({ user });
  } catch (err: any) {
    console.error("[auth.register] error:", err);
    res.status(statusFromErr(err)).json({ message: messageFromErr(err) });
  }
}

export async function login(req: Request, res: Response) {
  try {
    await svc.ensureDemoUsers();
    const { email, password, remember } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const out = await svc.login({ email, password, remember });
    if (!out) return res.status(401).json({ message: "Invalid email or password" });

    res.json(out);
  } catch (err: any) {
    console.error("[auth.login] error:", err);
    res.status(statusFromErr(err)).json({ message: messageFromErr(err) });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const user = await svc.authFromToken(token);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    res.json({ user });
  } catch (err: any) {
    console.error("[auth.me] error:", err);
    res.status(statusFromErr(err)).json({ message: messageFromErr(err) });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const token = bearerToken(req);
    if (!token) return res.status(204).send();

    await svc.logout(token);
    res.status(204).send();
  } catch (err: any) {
    console.error("[auth.logout] error:", err);
    res.status(statusFromErr(err)).json({ message: messageFromErr(err) });
  }
}
