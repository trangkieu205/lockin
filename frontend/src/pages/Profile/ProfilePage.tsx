// frontend/src/pages/Profile/ProfilePage.tsx
import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../services/profileService";

/** ✅ Local type để tránh phụ thuộc profileService export type */
type Profile = {
  name: string;
  avatarDataUrl?: string;

  sex: "M" | "F";
  heightCm: number;
  weightKg: number;
  age: number;

  activityLevel: string;

  measurements: {
    neckCm: number;
    bustCm: number;
    waistCm: number;
    upperArmCm: number;
    thighCm: number;
  };

  goal: { targetWeightKg: number };

  goals: {
    calories: number;
    waterMl: number;
    steps: number;
    sleepMinutes: number;
  };

  updatedAt?: string;
};

function safeNumber(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const emptyProfile: Profile = {
  name: "Demo User",
  sex: "F",
  heightCm: 170,
  weightKg: 60,
  age: 20,
  activityLevel: "moderate",
  measurements: { neckCm: 0, bustCm: 0, waistCm: 0, upperArmCm: 0, thighCm: 0 },
  goal: { targetWeightKg: 0 },
  goals: { calories: 2000, waterMl: 2000, steps: 8000, sleepMinutes: 450 },
  updatedAt: new Date().toISOString(),
};

function normalizeProfile(input: any): Profile {
  const p = input ?? {};

  const sex: "M" | "F" = p.sex === "M" || p.sex === "F" ? p.sex : emptyProfile.sex;

  const measurements = {
    ...emptyProfile.measurements,
    ...(p.measurements ?? {}),
  };

  for (const k of ["neckCm", "bustCm", "waistCm", "upperArmCm", "thighCm"] as const) {
    (measurements as any)[k] = safeNumber((measurements as any)[k], 0);
  }

  const goal = { ...(emptyProfile.goal ?? {}), ...(p.goal ?? {}) };
  goal.targetWeightKg = safeNumber((goal as any).targetWeightKg, 0);

  const goals = { ...(emptyProfile.goals ?? {}), ...(p.goals ?? {}) };
  (goals as any).calories = safeNumber((goals as any).calories, 2000);
  (goals as any).waterMl = safeNumber((goals as any).waterMl, 2000);
  (goals as any).steps = safeNumber((goals as any).steps, 8000);
  (goals as any).sleepMinutes = safeNumber((goals as any).sleepMinutes, 450);

  return {
    ...emptyProfile,
    ...p,
    name: typeof p.name === "string" ? p.name : "",
    avatarDataUrl: typeof p.avatarDataUrl === "string" ? p.avatarDataUrl : "",
    sex,
    heightCm: safeNumber(p.heightCm, emptyProfile.heightCm),
    weightKg: safeNumber(p.weightKg, emptyProfile.weightKg),
    age: safeNumber(p.age, emptyProfile.age),
    activityLevel: typeof p.activityLevel === "string" && p.activityLevel ? p.activityLevel : emptyProfile.activityLevel,
    measurements,
    goal: goal as any,
    goals: goals as any,
    updatedAt: typeof p.updatedAt === "string" && p.updatedAt ? p.updatedAt : new Date().toISOString(),
  };
}

export function ProfilePage() {
  const [p, setP] = useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  async function load() {
    setLoaded(false);
    try {
      const data = await (getProfile as any)(); // service return shape tuỳ dự án
      setP(normalizeProfile(data));
    } catch {
      // keep current
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: String(p.name ?? ""),
        sex: p.sex === "M" || p.sex === "F" ? p.sex : "F",
        heightCm: safeNumber(p.heightCm, 0),
        weightKg: safeNumber(p.weightKg, 0),
        age: safeNumber(p.age, 0),
        activityLevel: p.activityLevel,
        measurements: p.measurements,
        goal: p.goal,
        goals: p.goals,
      };

      const saved = await (updateProfile as any)(payload);
      setP(normalizeProfile(saved));
      window.dispatchEvent(new CustomEvent("lockin:refresh"));
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div>Loading…</div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Profile</h1>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid #eee",
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 22,
          }}
        >
          {p.avatarDataUrl ? (
            <img src={p.avatarDataUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span>{(String(p.name || "U").slice(0, 1) || "U").toUpperCase()}</span>
          )}
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 900 }}>Avatar</div>

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              setUploadErr(null);

              if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                setUploadErr("Chỉ hỗ trợ PNG/JPG/WEBP");
                return;
              }
              if (file.size > 800_000) {
                setUploadErr("Ảnh quá lớn. Hãy chọn ảnh < ~800KB (demo).");
                return;
              }

              try {
                const dataUrl = await fileToDataUrl(file);
                const saved = await (updateProfile as any)({ avatarDataUrl: dataUrl });
                setP(normalizeProfile(saved));
                window.dispatchEvent(new CustomEvent("lockin:refresh"));
              } catch (err: any) {
                setUploadErr(err?.message || "Upload failed");
              } finally {
                e.currentTarget.value = "";
              }
            }}
          />

          <button
            onClick={async () => {
              const saved = await (updateProfile as any)({ avatarDataUrl: "" });
              setP(normalizeProfile(saved));
              window.dispatchEvent(new CustomEvent("lockin:refresh"));
            }}
          >
            Remove avatar
          </button>

          {uploadErr ? <div style={{ color: "#d00000", fontSize: 12 }}>{uploadErr}</div> : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Name">
          <input
            value={p.name ?? ""} // ✅ không bao giờ null
            onChange={(e) => setP(normalizeProfile({ ...p, name: e.target.value }))}
            style={inp}
          />
        </Field>

        <Field label="Sex">
          <select
            value={p.sex === "M" || p.sex === "F" ? p.sex : "F"}
            onChange={(e) => setP(normalizeProfile({ ...p, sex: e.target.value as any }))}
            style={inp}
          >
            <option value="F">F</option>
            <option value="M">M</option>
          </select>
        </Field>

        <Field label="Height (cm)">
          <input
            type="number"
            value={safeNumber(p.heightCm, 0)}
            onChange={(e) => setP(normalizeProfile({ ...p, heightCm: Number(e.target.value) }))}
            style={inp}
          />
        </Field>

        <Field label="Weight (kg)">
          <input
            type="number"
            value={safeNumber(p.weightKg, 0)}
            onChange={(e) => setP(normalizeProfile({ ...p, weightKg: Number(e.target.value) }))}
            style={inp}
          />
        </Field>

        <Field label="Age">
          <input
            type="number"
            value={safeNumber(p.age, 0)}
            onChange={(e) => setP(normalizeProfile({ ...p, age: Number(e.target.value) }))}
            style={inp}
          />
        </Field>

        <Field label="Activity level">
          <input
            value={p.activityLevel ?? ""} // ✅
            onChange={(e) => setP(normalizeProfile({ ...p, activityLevel: e.target.value }))}
            style={inp}
          />
        </Field>
      </div>

      <h3 style={{ marginTop: 18 }}>Body measurements (cm)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {(["neckCm", "bustCm", "waistCm", "upperArmCm", "thighCm"] as const).map((k) => (
          <Field key={k} label={k}>
            <input
              type="number"
              value={safeNumber((p.measurements as any)?.[k], 0)}
              onChange={(e) =>
                setP(
                  normalizeProfile({
                    ...p,
                    measurements: { ...(p.measurements ?? {}), [k]: Number(e.target.value) },
                  })
                )
              }
              style={inp}
            />
          </Field>
        ))}
      </div>

      <h3 style={{ marginTop: 18 }}>Goals</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Target weight (kg)">
          <input
            type="number"
            value={safeNumber(p.goal?.targetWeightKg, 0)}
            onChange={(e) => setP(normalizeProfile({ ...p, goal: { ...(p.goal ?? {}), targetWeightKg: Number(e.target.value) } }))}
            style={inp}
          />
        </Field>

        <Field label="Daily calories">
          <input
            type="number"
            value={safeNumber(p.goals?.calories, 2000)}
            onChange={(e) => setP(normalizeProfile({ ...p, goals: { ...(p.goals ?? {}), calories: Number(e.target.value) } }))}
            style={inp}
          />
        </Field>

        <Field label="Daily water (ml)">
          <input
            type="number"
            value={safeNumber(p.goals?.waterMl, 2000)}
            onChange={(e) => setP(normalizeProfile({ ...p, goals: { ...(p.goals ?? {}), waterMl: Number(e.target.value) } }))}
            style={inp}
          />
        </Field>

        <Field label="Daily steps">
          <input
            type="number"
            value={safeNumber(p.goals?.steps, 8000)}
            onChange={(e) => setP(normalizeProfile({ ...p, goals: { ...(p.goals ?? {}), steps: Number(e.target.value) } }))}
            style={inp}
          />
        </Field>

        <Field label="Daily sleep (minutes)">
          <input
            type="number"
            value={safeNumber(p.goals?.sleepMinutes, 450)}
            onChange={(e) => setP(normalizeProfile({ ...p, goals: { ...(p.goals ?? {}), sleepMinutes: Number(e.target.value) } }))}
            style={inp}
          />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button onClick={load} disabled={saving}>
          Reload
        </button>
        <button onClick={save} disabled={saving}>
          Save
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#666" }}>
        Updated at: {p.updatedAt ?? ""}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Failed to read file"));
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(file);
  });
}

const inp: React.CSSProperties = {
  width: "100%",
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 10,
};
