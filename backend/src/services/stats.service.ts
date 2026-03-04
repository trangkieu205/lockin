import { listByDate as listMeals } from "../repos/logs/mealLog.repo.js";
import { listByDate as listWorkouts } from "../repos/logs/workoutLog.repo.js";
import { getOrCreateProfile } from "./profile.service.js";
import type { UserPublic } from "../repos/auth.repo.js";

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function calcBMI(heightCm?: number, weightKg?: number): number | null {
  const h = safeNum(heightCm);
  const w = safeNum(weightKg);
  if (!h || !w) return null;
  const m = h / 100;
  const bmi = w / (m * m);
  return Math.round(bmi * 10) / 10;
}

function calcBMR(sex?: string, heightCm?: number, weightKg?: number, age?: number): number {
  const h = safeNum(heightCm);
  const w = safeNum(weightKg);
  const a = safeNum(age);
  if (!h || !w || !a) return 0;
  const s = String(sex || "").toUpperCase();
  const base = 10 * w + 6.25 * h - 5 * a;
  const bmr = s === "M" ? base + 5 : base - 161;
  return Math.round(bmr);
}

export async function todayStats(date: string, user?: UserPublic | null) {
  const meals = await listMeals(date);
  const workouts = await listWorkouts(date);

  const caloriesIn = meals.reduce((sum, x) => sum + safeNum((x as any).calories), 0);
  const totalCaloriesBurned = workouts.reduce(
    (sum, x) => sum + safeNum((x as any).caloriesBurned ?? (x as any).calories_burned ?? (x as any).kcal),
    0
  );

  const totals = {
    caloriesIn,
    caloriesOut: totalCaloriesBurned,
    netCalories: caloriesIn - totalCaloriesBurned,
    totalCaloriesBurned,
  };

  let profile: any = null;
  let metrics: any = { bmr: 0, tdee: 0, bmi: null as number | null };

  if (user) {
    profile = await getOrCreateProfile(user);
    const bmr = calcBMR(profile.sex, profile.heightCm, profile.weightKg, profile.age);
    const tdee = bmr ? Math.round(bmr * 1.2) : 0;
    const bmi = calcBMI(profile.heightCm, profile.weightKg);
    metrics = { bmr, tdee, bmi };
  }

  return { date, totals, profile, metrics };
}
