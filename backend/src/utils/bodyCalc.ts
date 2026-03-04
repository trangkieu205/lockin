// frontend/src/utils/bodyCalc.ts

export type ActivityLevel =
  | "sedentary"      // 1.2
  | "light"          // 1.375
  | "moderate"       // 1.55
  | "active"         // 1.725
  | "very_active";   // 1.9

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTdee(bmr: number, level: ActivityLevel) {
  const af = ACTIVITY_FACTORS[level] ?? 1.2;
  return bmr * af;
}

// Nếu chưa có BMI:
export function calcBmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  if (!h) return 0;
  return weightKg / (h * h);
}
