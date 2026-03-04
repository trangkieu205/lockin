// backend/src/app.ts
import express from "express";
import cors from "cors";
import path from "node:path";

import { env } from "./config/env.js";
import { ensureSeedDemoUsers } from "./repos/auth.repo.js";

import authRouter from "./routes/auth.routes.js";
import exercisesRouter from "./routes/exercises.routes.js";
import profileRouter from "./routes/profile.routes.js";
import statsRouter from "./routes/stats.routes.js";
import newsRouter from "./routes/news.routes.js";
import foodsRouter from "./routes/foods.routes.js";
import adminNewsRouter from "./routes/admin/adminNews.routes.js";
import relaxationsRouter from "./routes/relaxations.routes.js";

import mealLogsRouter from "./routes/logs/meal.routes.js";
import workoutLogsRouter from "./routes/logs/workout.routes.js";
import relaxationLogsRouter from "./routes/logs/relaxation.routes.js";

import { requireAuth } from "./middleware/auth.js";

export async function createApp() {
  const app = express();

  // ===== CORS (Deploy) =====
  // Set trên Render: CORS_ORIGINS="https://xxx.netlify.app,http://localhost:5173"
  const origins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const corsOptions: cors.CorsOptions = {
    origin: (origin, cb) => {
      // origin undefined => curl/postman/same-origin
      if (!origin) return cb(null, true);

      // nếu chưa set env thì tạm allow all để khỏi “kẹt” lúc demo
      if (origins.length === 0) return cb(null, true);

      if (origins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
    const corsMw = cors(corsOptions);
  app.use(corsMw);
  app.options("*", corsMw);
  // =========================

  app.use(express.json());

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // public
  app.use("/auth", authRouter);
  app.use("/assets", express.static(path.join(env.dataDir, "assets")));

  // protected
  app.use(requireAuth);
  app.use("/foods", foodsRouter);
  app.use("/exercises", exercisesRouter);
  app.use("/profile", profileRouter);
  app.use("/stats", statsRouter);

  app.use("/logs/meals", mealLogsRouter);
  app.use("/logs/workouts", workoutLogsRouter);
  app.use("/logs/relaxation", relaxationLogsRouter);
  app.use("/relaxations", relaxationsRouter);

  app.use("/news", newsRouter);
  app.use("/admin/news", adminNewsRouter);

  app.use((req, res) => {
    res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: unknown, res: any, _next: unknown) => {
    console.error("[error]", err);
    const status = Number((err as any)?.status || (err as any)?.statusCode || 500);
    const message = (err as any)?.message ? String((err as any).message) : "Internal server error";
    res.status(status).json({ message });
  });

  return app;
}
