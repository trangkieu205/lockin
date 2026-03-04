import React, { useEffect, useMemo, useState } from "react";
import { getJson, putJson } from "../../services/http";

type ProfileDto = {
  userId?: number;
  name?: string;
  age?: number;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  goal?: any; // we'll store plan here
  updatedAt?: string;
};

function todayKeyLocal() {
  return new Date().toISOString().slice(0, 10);
}

export function MyPlanPage() {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // plan fields (stored in profile.goal.plan)
  const [dailyCalories, setDailyCalories] = useState<number>(2000);
  const [workoutsPerWeek, setWorkoutsPerWeek] = useState<number>(3);
  const [relaxPerWeek, setRelaxPerWeek] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const today = useMemo(() => todayKeyLocal(), []);

  async function load() {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      const res = await getJson<{ profile: ProfileDto } | ProfileDto>("/profile/me");
      const p = (res as any)?.profile ?? res;
      setProfile(p ?? null);

      const plan = (p as any)?.goal?.plan ?? {};
      setDailyCalories(Number(plan.dailyCalories ?? 2000));
      setWorkoutsPerWeek(Number(plan.workoutsPerWeek ?? 3));
      setRelaxPerWeek(Number(plan.relaxPerWeek ?? 3));
      setNotes(String(plan.notes ?? ""));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load plan");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setErr("");
    setOk("");
    setSaving(true);
    try {
      const curGoal = (profile as any)?.goal ?? {};
      const nextGoal = {
        ...curGoal,
        plan: {
          dailyCalories: Number(dailyCalories) || 0,
          workoutsPerWeek: Number(workoutsPerWeek) || 0,
          relaxPerWeek: Number(relaxPerWeek) || 0,
          notes: notes.trim(),
          updatedAt: new Date().toISOString(),
        },
      };

      const res = await putJson<{ profile: ProfileDto } | ProfileDto>("/profile/me", {
        goal: nextGoal,
      });

      const p = (res as any)?.profile ?? res;
      setProfile(p ?? profile);
      setOk("Saved ✅");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>My Plan</div>
          <div style={styles.sub}>Set simple targets (saved into your profile)</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={load} style={styles.secondaryBtn}>
            Reload
          </button>
          <button onClick={save} style={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </div>

      {err ? <div style={styles.error}>{err}</div> : null}
      {ok ? <div style={styles.ok}>{ok}</div> : null}
      {loading ? <div style={styles.muted}>Loading…</div> : null}

      <div style={styles.grid2}>
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Targets</div>

          <div style={styles.field}>
            <div style={styles.label}>Daily calories goal</div>
            <input type="number" value={dailyCalories} onChange={(e) => setDailyCalories(Number(e.target.value))} style={styles.input} />
          </div>

          <div style={styles.grid2Inner}>
            <div style={styles.field}>
              <div style={styles.label}>Workouts / week</div>
              <input
                type="number"
                value={workoutsPerWeek}
                onChange={(e) => setWorkoutsPerWeek(Number(e.target.value))}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <div style={styles.label}>Relax sessions / week</div>
              <input type="number" value={relaxPerWeek} onChange={(e) => setRelaxPerWeek(Number(e.target.value))} style={styles.input} />
            </div>
          </div>

          <div style={styles.field}>
            <div style={styles.label}>Notes</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, height: 120, padding: 12 }} />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Quick Summary</div>

          <div style={styles.summaryRow}>
            <div style={styles.summaryLabel}>Today</div>
            <div style={styles.summaryVal}>{today}</div>
          </div>

          <div style={styles.summaryRow}>
            <div style={styles.summaryLabel}>User</div>
            <div style={styles.summaryVal}>{profile?.name ?? "—"}</div>
          </div>

          <div style={styles.summaryRow}>
            <div style={styles.summaryLabel}>Height / Weight</div>
            <div style={styles.summaryVal}>
              {profile?.heightCm ? `${profile.heightCm} cm` : "—"} / {profile?.weightKg ? `${profile.weightKg} kg` : "—"}
            </div>
          </div>

          <div style={styles.hr} />

          <div style={{ color: "#666", lineHeight: 1.5 }}>
            This plan is stored under <b>profile.goal.plan</b> so you can reuse it later on Dashboard/Report.
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPlanPage;

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 800 },
  sub: { color: "#666" },

  error: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 12 },
  ok: { background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", padding: 10, borderRadius: 12 },
  muted: { color: "#777", fontSize: 13 },

  grid2: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 },
  section: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  sectionTitle: { fontSize: 18, fontWeight: 900, marginBottom: 10 },

  field: { display: "grid", gap: 6, marginBottom: 12 },
  label: { fontWeight: 800, color: "#333", fontSize: 13 },
  input: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 12px",
    background: "#f7f7f7",
    outline: "none",
    resize: "vertical",
  },

  grid2Inner: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" },
  summaryLabel: { color: "#666", fontWeight: 800 },
  summaryVal: { fontWeight: 900 },
  hr: { height: 1, background: "rgba(0,0,0,0.12)", margin: "10px 0" },

  primaryBtn: {
    height: 38,
    padding: "0 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#1d77e8",
    color: "#fff",
    fontWeight: 800,
  },
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
