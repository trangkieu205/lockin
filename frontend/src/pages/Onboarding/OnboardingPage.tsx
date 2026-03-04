import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { putJson } from "../../services/http";
import { clearToken } from "../../utils/authStorage";

type Gender = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type AdjustType = "deficit" | "surplus";

type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calcBmi(weightKg: number, heightCm: number) {
  const h = heightCm / 100;
  if (!h) return 0;
  return weightKg / (h * h);
}

// Mifflin-St Jeor
function calcBmr(weightKg: number, heightCm: number, age: number, gender: Gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

export default function OnboardingPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<Gender | "">("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [targetWeightKg, setTargetWeightKg] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");

  const [adjustType, setAdjustType] = useState<AdjustType>("deficit");
  const [adjustAmount, setAdjustAmount] = useState<string>("");

  const w = Number(weightKg) || 0;
  const h = Number(heightCm) || 0;
  const a = Number(age) || 0;
  const tw = Number(targetWeightKg) || 0;
  const adj = Number(adjustAmount) || 0;

  const bmi = useMemo(() => calcBmi(w, h), [w, h]);

  const bmr = useMemo(() => {
    if (!w || !h || !a || !gender) return 0;
    return calcBmr(w, h, a, gender);
  }, [w, h, a, gender]);

  const tdee = useMemo(() => {
    if (!bmr || !activityLevel) return 0;
    return bmr * ACTIVITY_FACTORS[activityLevel as ActivityLevel];
  }, [bmr, activityLevel]);

  const calorieTarget = useMemo(() => {
    if (!tdee) return 0;
    const delta = adj * (adjustType === "deficit" ? -1 : 1);
    return tdee + delta;
  }, [tdee, adj, adjustType]);

  const warnBelowBmr = useMemo(() => bmr > 0 && calorieTarget > 0 && calorieTarget < bmr, [bmr, calorieTarget]);

  const canSubmit = useMemo(() => {
    return (
      displayName.trim() &&
      w > 0 &&
      h > 0 &&
      a > 0 &&
      !!gender &&
      !!goal &&
      tw > 0 &&
      !!activityLevel
    );
  }, [displayName, w, h, a, gender, goal, tw, activityLevel]);

  function backToAuth() {
    // ✅ quay lại auth: clear token để RequireAuth không đá ngược về onboarding nữa
    clearToken();
    nav("/auth", { replace: true });
  }

  async function onSubmit() {
    setErr("");
    if (!canSubmit) return;

    try {
      setLoading(true);

      const sex = gender === "male" ? "M" : "F";

      await putJson("/profile/me", {
        name: displayName,
        sex,
        weightKg: w,
        heightCm: h,
        age: a,
        activityLevel,
        goal: { targetWeightKg: tw, goalType: goal },
        goals: {
          calories: Math.round(calorieTarget || tdee || 0),
          waterMl: 2000,
          steps: 8000,
          sleepMinutes: 450,
        },
        bmi,
        bmr,
        tdee,
        activityFactor: ACTIVITY_FACTORS[activityLevel as ActivityLevel],
      });

      nav("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Lưu onboarding thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* ✅ header with back button */}
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={backToAuth}>
            ← Back to Sign In / Sign Up
          </button>
          <div style={styles.title}>Get Started</div>
          <div style={{ width: 180 }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>How should we call you?</label>
          <input style={styles.input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div style={styles.row2}>
          <div style={styles.field}>
            <label style={styles.label}>Your weight?</label>
            <div style={styles.inputWrap}>
              <input style={styles.input} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} inputMode="numeric" />
              <span style={styles.unit}>kg</span>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Your height?</label>
            <div style={styles.inputWrap}>
              <input style={styles.input} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} inputMode="numeric" />
              <span style={styles.unit}>cm</span>
            </div>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your age?</label>
          <input style={styles.input} value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your gender?</label>
          <select style={styles.select} value={gender} onChange={(e) => setGender(e.target.value as any)}>
            <option value="">Select your gender</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>What is your goal?</label>
          <select style={styles.select} value={goal} onChange={(e) => setGoal(e.target.value as any)}>
            <option value="">Select your goal</option>
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain</option>
            <option value="gain">Gain weight</option>
          </select>
        </div>

        <div style={styles.row2}>
          <div style={styles.field}>
            <label style={styles.label}>What is your target weight?</label>
            <div style={styles.inputWrap}>
              <input style={styles.input} value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} inputMode="numeric" />
              <span style={styles.unit}>kg</span>
            </div>
            <div style={styles.miniInfo}>Your current BMI is {bmi ? bmi.toFixed(1) : "..."}</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>What is your active level?</label>
            <select style={styles.select} value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as any)}>
              <option value="">Select your activity level</option>
              <option value="sedentary">Ít vận động (AF 1.2)</option>
              <option value="light">Hoạt động nhẹ (AF 1.375)</option>
              <option value="moderate">Hoạt động vừa (AF 1.55)</option>
              <option value="active">Hoạt động mạnh (AF 1.725)</option>
              <option value="very_active">Rất năng động (AF 1.9)</option>
            </select>
            <div style={styles.miniInfo}>
              Your BMR is {bmr ? Math.round(bmr) : "..."} • Your TDEE is {tdee ? Math.round(tdee) : "..."}
            </div>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>How much calories a day do you want to adjust?</label>
          <div style={styles.row2}>
            <select style={styles.select} value={adjustType} onChange={(e) => setAdjustType(e.target.value as any)}>
              <option value="deficit">Deficit (giảm)</option>
              <option value="surplus">Surplus (tăng)</option>
            </select>

            <input
              style={styles.input}
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="Enter the amount you want"
              inputMode="numeric"
            />
          </div>

          {warnBelowBmr ? (
            <div style={styles.warn}>
              You shouldn&apos;t consume calories below your BMR, Lower your deficit or raise your activity level
            </div>
          ) : null}

          {tdee ? (
            <div style={styles.miniInfo}>
              Calorie target: <b>{Math.round(calorieTarget)}</b> kcal/day
            </div>
          ) : null}
        </div>

        {err ? <div style={styles.error}>{err}</div> : null}

        <button
          style={{ ...styles.primaryBtn, opacity: loading || !canSubmit ? 0.6 : 1 }}
          disabled={loading || !canSubmit}
          onClick={onSubmit}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "linear-gradient(180deg, #4b5bd1 0%, #dfe3f2 100%)",
  },
  card: {
    width: 720,
    maxWidth: "92vw",
    background: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 12px 36px rgba(0,0,0,0.18)",
  },
  headerRow: {
    display: "grid",
    gridTemplateColumns: "180px 1fr 180px",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  backBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 900,
    color: "#111",
  },
  title: { fontSize: 28, fontWeight: 900, textAlign: "center" },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "grid", gap: 6, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 900, color: "#333" },
  input: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
    background: "#fff",
  },
  select: {
    width: "100%",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
    outline: "none",
    background: "#fff",
  },
  inputWrap: { position: "relative" },
  unit: { position: "absolute", right: 12, top: 10, color: "#666", fontWeight: 900 },
  miniInfo: { fontSize: 12, color: "#666", marginTop: 6 },
  warn: { color: "#d32f2f", fontWeight: 900, fontSize: 12, marginTop: 6 },
  error: { color: "#d32f2f", fontWeight: 900, fontSize: 13, marginBottom: 8 },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "12px 14px",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 6,
  },
};
