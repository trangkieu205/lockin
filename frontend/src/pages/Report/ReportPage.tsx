import React, { useEffect, useMemo, useState } from "react";
import { getJson } from "../../services/http";

type TodayStatsDto = {
  date: string;
  totals?: {
    caloriesIn?: number;
    caloriesOut?: number;
    netCalories?: number;
    totalCaloriesBurned?: number;
    waterMl?: number;
    steps?: number;
    sleepMinutes?: number;
  };
  metrics?: { bmr?: number; tdee?: number; bmi?: number | null };
};

type MealLog = { id: number; foodName: string; calories: number; mealType: string };
type WorkoutLog = { id: number; title: string; caloriesBurned: number; minutes?: number; category?: string };

function todayKeyLocal() {
  return new Date().toISOString().slice(0, 10);
}

export function ReportPage() {
  const [date, setDate] = useState(todayKeyLocal());
  const [stats, setStats] = useState<TodayStatsDto | null>(null);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totals = stats?.totals ?? {};
  const metrics = stats?.metrics ?? {};

  const mealsTotal = useMemo(() => meals.reduce((s, x) => s + (Number(x.calories) || 0), 0), [meals]);
  const workoutsTotal = useMemo(
    () => workouts.reduce((s, x) => s + (Number(x.caloriesBurned) || 0), 0),
    [workouts]
  );

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const s = await getJson<TodayStatsDto>(`/stats/today?date=${encodeURIComponent(date)}`);
      setStats(s ?? null);

      const ml = await getJson<{ items: MealLog[] }>(`/logs/meals?date=${encodeURIComponent(date)}`);
      setMeals(ml?.items ?? []);

      const wl = await getJson<{ items: WorkoutLog[] }>(`/logs/workouts?date=${encodeURIComponent(date)}`);
      setWorkouts(wl?.items ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load report");
      setStats(null);
      setMeals([]);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Report</div>
          <div style={styles.sub}>Daily summary (stats + meals + workouts)</div>
        </div>

        <div style={styles.headerRight}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
          <button onClick={load} style={styles.secondaryBtn}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <div style={styles.error}>{err}</div> : null}
      {loading ? <div style={styles.muted}>Loading…</div> : null}

      <div style={styles.cardsRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Calories In</div>
          <div style={styles.bigNumber}>{Math.round(Number(totals.caloriesIn ?? mealsTotal) || 0)}</div>
          <div style={styles.muted}>kcal</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Calories Out</div>
          <div style={styles.bigNumber}>{Math.round(Number(totals.caloriesOut ?? workoutsTotal) || 0)}</div>
          <div style={styles.muted}>kcal burned</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Net</div>
          <div style={styles.bigNumber}>{Math.round(Number(totals.netCalories ?? 0) || 0)}</div>
          <div style={styles.muted}>kcal</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>BMR / TDEE</div>
          <div style={styles.bigNumber}>
            {Math.round(Number(metrics.bmr ?? 0) || 0)} / {Math.round(Number(metrics.tdee ?? 0) || 0)}
          </div>
          <div style={styles.muted}>kcal/day</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>BMI</div>
          <div style={styles.bigNumber}>{metrics.bmi == null ? "—" : String(metrics.bmi)}</div>
          <div style={styles.muted}>body mass index</div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Meals</div>
          {meals.length === 0 ? (
            <div style={styles.empty}>No meals</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {meals.map((m) => (
                <div key={m.id} style={styles.row}>
                  <div>
                    <div style={styles.rowTitle}>{m.foodName}</div>
                    <div style={styles.rowSub}>{m.mealType}</div>
                  </div>
                  <div style={styles.kcal}>{Math.round(Number(m.calories) || 0)} kcal</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Workouts</div>
          {workouts.length === 0 ? (
            <div style={styles.empty}>No workouts</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {workouts.map((w) => (
                <div key={w.id} style={styles.row}>
                  <div>
                    <div style={styles.rowTitle}>{w.title}</div>
                    <div style={styles.rowSub}>
                      {w.category ? `${w.category} • ` : ""}
                      {w.minutes ? `${w.minutes} min` : ""}
                    </div>
                  </div>
                  <div style={styles.kcal}>{Math.round(Number(w.caloriesBurned) || 0)} kcal</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportPage;

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  title: { fontSize: 28, fontWeight: 800 },
  sub: { color: "#666" },

  dateInput: { height: 38, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", padding: "0 10px" },

  error: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 12 },
  muted: { color: "#777", fontSize: 13 },

  cardsRow: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 12 },
  card: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  cardLabel: { color: "#666", fontWeight: 700, marginBottom: 6 },
  bigNumber: { fontSize: 18, fontWeight: 900 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  section: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  sectionTitle: { fontSize: 18, fontWeight: 900, marginBottom: 10 },
  empty: { color: "#777" },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "#fafafa",
  },
  rowTitle: { fontWeight: 900 },
  rowSub: { color: "#777", fontSize: 12, marginTop: 2 },
  kcal: { fontWeight: 900 },

  secondaryBtn: {
    height: 38,
    padding: "0 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
};
