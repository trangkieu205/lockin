export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcBmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  if (!h) return 0;
  return weightKg / (h * h);
}

// Mifflin-St Jeor
export function calcBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
}) {
  const { weightKg, heightCm, age, gender } = input;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export function calcTdee(bmr: number, level: ActivityLevel) {
  return bmr * (ACTIVITY_FACTORS[level] ?? 1.2);
}
