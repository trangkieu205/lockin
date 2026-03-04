import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "../../services/http";
import { todayKey } from "../../utils/date";

type SidebarDto = {
  profile?: {
    name: string;
    sex: "F" | "M";
    heightCm: number;
    weightKg: number;
    age: number;
    measurements?: Record<string, number>;
    goal?: { targetWeightKg?: number };
    avatarDataUrl?: string;
  };
  metrics?: { bmr: number; tdee: number; bmi: number | null };
};

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export function RightSidebar() {
  const nav = useNavigate();
  const [data, setData] = useState<SidebarDto>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        // Dùng stats endpoint sẵn có để lấy profile/metrics (view-only)
        const d = await getJson<SidebarDto>(`/stats/today?date=${todayKey()}`);
        setData(d ?? {});
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load sidebar");
      }
    })();
  }, []);

  const p = data.profile;
  const m = data.metrics;

  return (
    <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 1000 }}>USER PROFILE</div>

        {/* Dashboard cấm sửa, nhưng sidebar cho phép đi sang Profile page để sửa */}
        <button
          onClick={() => nav("/profile")}
          style={{
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: 10,
            padding: "6px 10px",
            cursor: "pointer",
            fontWeight: 900,
          }}
          title="Edit in Profile page"
        >
          ✎
        </button>
      </div>

      {err ? (
        <div style={{ marginTop: 10, background: "#fff5f5", border: "1px solid #ffcccc", borderRadius: 10, padding: 10, color: "#b00020", fontWeight: 900 }}>
          {err}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 12, marginTop: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <Line label="Name" value={p?.name ?? "-"} unit="" />
          <Line label="Sex" value={p?.sex ?? "-"} unit="" />
          <Line label="Height" value={p?.heightCm ?? 0} unit="cm" />
          <Line label="Weight" value={p?.weightKg ?? 0} unit="kg" />
          <Line label="Age" value={p?.age ?? 0} unit="year" />
        </div>

        <div
          style={{
            width: 110,
            height: 110,
            borderRadius: 999,
            background: "#eee",
            overflow: "hidden",
            border: "1px solid #eee",
            display: "grid",
            placeItems: "center",
            justifySelf: "end",
          }}
        >
          {p?.avatarDataUrl ? (
            <img src={p.avatarDataUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ fontWeight: 1000, fontSize: 38, color: "#555" }}>
              {(p?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid #eee" }} />

      <div style={{ fontWeight: 1000 }}>GOAL</div>
      <div style={{ marginTop: 8 }}>
        <Line label="Target weight" value={p?.goal?.targetWeightKg ?? 0} unit="kg" />
      </div>

      <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid #eee" }} />

      <div style={{ fontWeight: 1000 }}>METRICS</div>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        <Line label="BMR" value={safeNum(m?.bmr)} unit="kcal" />
        <Line label="TDEE" value={safeNum(m?.tdee)} unit="kcal" />
        <Line label="BMI" value={m?.bmi ?? "-"} unit="" />
      </div>
    </div>
  );
}

function Line({ label, value, unit }: { label: string; value: any; unit: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "baseline" }}>
      <div style={{ color: "#333" }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#666" }}>{unit}</div>
    </div>
  );
}
