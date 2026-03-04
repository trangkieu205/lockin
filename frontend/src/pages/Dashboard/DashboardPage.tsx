import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJson } from "../../services/http";
import { todayKey } from "../../utils/date";
import { listMealLogs, type MealLog } from "../../services/mealLogService";
import { listWorkoutLogs, type WorkoutLog } from "../../services/workoutLogService";
import { clearToken } from "../../utils/authStorage";

type DashboardDto = {
  date: string;
  totals?: {
    caloriesIn: number;
    caloriesOut: number;
    netCalories: number;
    totalCaloriesBurned: number;
  };
};

type NewsItem = {
  id: number | string;
  title: string;
  content?: string;
  excerpt?: string;
  createdAt?: string;
  createdBy?: string;
  coverUrl?: string;
};

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5179";

function assetUrl(uri?: string | null) {
  const s = String(uri ?? "").trim();
  if (!s) return "";
  // ✅ hỗ trợ data/blob/file luôn (rất hay gặp nếu em upload ảnh)
  if (/^(https?:|data:|blob:|file:)/i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

function imgOf(x: any): string {
  if (!x) return "";
  return assetUrl(
    x.imageUrl ??
      x.imagePrimaryUri ??
      x.imageUri ??
      x.thumbnailUrl ??
      x.thumbUrl ??
      x.coverUrl ??
      ""
  );
}

// meals hay bị để ở field khác nhau → gom lại cho chắc
function mealImgOf(m: any): string {
  return imgOf(
    m?.imageUrl ||
      m?.foodImageUrl ||
      m?.food?.imageUrl ||
      m?.food?.imageUri ||
      m?.food?.thumbnailUrl ||
      null
  );
}

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function formatDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [dateKey, setDateKey] = useState(todayKey());

  const [stats, setStats] = useState<DashboardDto | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // modal xem news (read-only)
  const [newsOpen, setNewsOpen] = useState(false);
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, mealsRes, workoutsRes] = await Promise.all([
        getJson<DashboardDto>(`/stats/today?date=${dateKey}`),
        listMealLogs(dateKey),
        listWorkoutLogs(dateKey as any),
      ]);

      setStats(s ?? null);

      const meals = (mealsRes as any)?.items ?? mealsRes;
      setMealLogs(Array.isArray(meals) ? meals : []);

      const workouts = (workoutsRes as any)?.items ?? workoutsRes;
      setWorkoutLogs(Array.isArray(workouts) ? workouts : []);

      // news (nếu backend chưa có thì vẫn không crash)
      try {
        const n = await getJson<any>(`/news?limit=6`);
        const items = (n as any)?.items ?? n;
        setNews(Array.isArray(items) ? items : []);
      } catch {
        try {
          const n2 = await getJson<any>(`/news`);
          const items2 = (n2 as any)?.items ?? n2;
          setNews(Array.isArray(items2) ? items2 : []);
        } catch {
          setNews([]);
        }
      }
    } catch (e: any) {
      console.error(e);
      setStats(null);
      setMealLogs([]);
      setWorkoutLogs([]);
      setNews([]);
      setErr(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const totalMealKcal = useMemo(
    () => mealLogs.reduce((s, x: any) => s + safeNum(x.calories), 0),
    [mealLogs]
  );

  const totalWorkoutKcal = useMemo(
    () =>
      workoutLogs.reduce(
        (s, x: any) =>
          s + safeNum(x.caloriesBurned ?? x.calories_burned ?? x.kcal),
        0
      ),
    [workoutLogs]
  );

  // ưu tiên totals backend nếu có
  const totalIn = stats?.totals?.caloriesIn ?? totalMealKcal;
  const totalBurned =
    stats?.totals?.totalCaloriesBurned ?? totalWorkoutKcal;
  const net = (stats?.totals?.netCalories ??
    safeNum(totalIn) - safeNum(totalBurned)) as number;

  function onLogout() {
    clearToken();
    navigate("/auth", { replace: true });
  }

  return (
    <div>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#666", fontWeight: 900 }}>
            TODAY, DATE
          </div>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "#5a7cff",
              color: "#fff",
              fontWeight: 1000,
              opacity: 0.85,
            }}
            title="Main page is read-only"
          >
            Overview (read-only)
          </div>

          <button
            style={{
              ...styles.smallBtn,
              background: "#fff5f5",
              borderColor: "#ffcccc",
              color: "#b00020",
            }}
            onClick={onLogout}
            title="Log out"
          >
            Logout
          </button>
        </div>
      </div>

      {err ? (
        <div
          style={{
            marginTop: 12,
            background: "#fff5f5",
            border: "1px solid #ffcccc",
            borderRadius: 12,
            padding: 12,
            color: "#b00020",
            fontWeight: 900,
          }}
        >
          {err}
        </div>
      ) : null}

      {/* SUMMARY */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "2px solid #4da3ff",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 1000, fontSize: 12 }}>TODAY SUMMARY</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 12,
          }}
        >
          <MiniCard title="Calories In" value={safeNum(totalIn)} unit="kcal" />
          <MiniCard
            title="Calories Burned"
            value={safeNum(totalBurned)}
            unit="kcal"
          />
          <MiniCard title="Net" value={safeNum(net)} unit="kcal" />
        </div>
      </div>

      {/* MEALS */}
      <Section
        title="Meals today"
        right={`${safeNum(totalIn)} kcal`}
        empty={mealLogs.length === 0 ? "No meals logged for this day." : ""}
      >
        <div style={{ display: "grid", gap: 8 }}>
          {mealLogs.map((m: any) => {
            const u = mealImgOf(m);
            return (
              <div
                key={m.id ?? `${m.foodName}-${m.loggedAt ?? ""}`}
                style={styles.listRow}
              >
                <div style={styles.thumbWrap}>
                  {u ? (
                    <img src={u} alt="" style={styles.thumb} />
                  ) : (
                    <div style={styles.thumbPlaceholder} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowTitle}>
                    {m.foodName ?? "Food"}
                    {m.brand ? (
                      <span style={{ color: "#777", fontWeight: 800 }}>
                        {" "}
                        • {m.brand}
                      </span>
                    ) : null}
                  </div>
                  <div style={styles.rowSub}>
                    {m.mealType ? (
                      <b>{String(m.mealType).toUpperCase()}</b>
                    ) : null}
                    {m.grams ? <> • {m.grams}g</> : null}
                  </div>
                </div>

                <div style={styles.kcal}>{safeNum(m.calories)} kcal</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ACTIVITIES */}
      <Section
        title="Activities today"
        right={`${safeNum(totalBurned)} kcal`}
        empty={
          workoutLogs.length === 0 ? "No activities logged for this day." : ""
        }
      >
        <div style={{ display: "grid", gap: 8 }}>
          {workoutLogs.map((w: any) => {
            const u = imgOf(w); // workout log có imageUrl rồi
            return (
              <div
                key={w.id ?? `${w.title}-${w.loggedAt ?? ""}`}
                style={styles.listRow}
              >
                <div style={styles.thumbWrap}>
                  {u ? (
                    <img src={u} alt="" style={styles.thumb} />
                  ) : (
                    <div style={styles.thumbPlaceholder} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowTitle}>
                    {w.title ?? "Activity"}
                    {w.category ? (
                      <span style={{ color: "#777", fontWeight: 800 }}>
                        {" "}
                        • {w.category}
                      </span>
                    ) : null}
                  </div>
                  <div style={styles.rowSub}>
                    {w.minutes ? <> • {w.minutes} min</> : null}
                    {w.loggedAt ? <> • {formatDateTime(w.loggedAt)}</> : null}
                  </div>
                </div>

                <div style={styles.kcal}>
                  {safeNum(w.caloriesBurned ?? w.calories_burned ?? w.kcal)} kcal
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* NEWS */}
      <Section
        title="News"
        right="Admin posts"
        empty={news.length === 0 ? "No news yet." : ""}
      >
        <div style={{ display: "grid", gap: 10 }}>
          {news.map((n) => (
            <div key={String(n.id)} style={styles.newsCard}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={styles.newsThumb}>
                  {n.coverUrl ? (
                    <img
                      src={n.coverUrl}
                      alt={n.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowTitle}>{n.title}</div>
                  <div style={styles.rowSub}>
                    {n.excerpt
                      ? n.excerpt
                      : n.content
                      ? String(n.content).slice(0, 90) +
                        (String(n.content).length > 90 ? "…" : "")
                      : ""}
                  </div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
                    {n.createdAt ? formatDateTime(n.createdAt) : ""}
                    {n.createdBy ? ` • ${n.createdBy}` : ""}
                  </div>
                </div>

                <button
                  style={styles.smallBtn}
                  onClick={() => {
                    setActiveNews(n);
                    setNewsOpen(true);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {loading ? <div style={{ marginTop: 10, color: "#666" }}>Loading…</div> : null}

      {/* NEWS MODAL */}
      {newsOpen ? (
        <div
          style={modalStyles.overlay}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setNewsOpen(false);
          }}
        >
          <div style={modalStyles.card} onMouseDown={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 1000,
                    fontSize: 16,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeNews?.title ?? "News"}
                </div>
                <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                  {activeNews?.createdAt ? formatDateTime(activeNews.createdAt) : ""}
                  {activeNews?.createdBy ? ` • ${activeNews.createdBy}` : ""}
                </div>
              </div>

              <button style={modalStyles.closeBtn} onClick={() => setNewsOpen(false)}>
                ✕
              </button>
            </div>

            {activeNews?.coverUrl ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                <img
                  src={activeNews.coverUrl}
                  alt="cover"
                  style={{ width: "100%", maxHeight: 220, objectFit: "cover" }}
                />
              </div>
            ) : null}

            <div
              style={{
                marginTop: 12,
                fontSize: 14,
                color: "#222",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}
            >
              {activeNews?.content ?? activeNews?.excerpt ?? ""}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniCard({
  title,
  value,
  unit,
}: {
  title: string;
  value: number;
  unit: string;
}) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
      <div style={{ fontSize: 12, color: "#666", fontWeight: 900 }}>{title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 1000 }}>{safeNum(value)}</div>
        <div style={{ color: "#666" }}>{unit}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  right,
  empty,
  children,
}: {
  title: string;
  right?: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={{ fontWeight: 1000, fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#666", fontWeight: 900 }}>{right}</div>
      </div>

      {empty ? <div style={{ color: "#999", padding: 8 }}>{empty}</div> : children}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 14,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 14,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
    gap: 12,
  },
  listRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 10,
    background: "#fafafa",
  },
  rowTitle: {
    fontWeight: 1000,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rowSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  kcal: { width: 100, textAlign: "right", fontWeight: 1000 } as React.CSSProperties,
  smallBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 1000,
  },
  newsCard: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
  },
  newsThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    background: "#eee",
    overflow: "hidden",
    flexShrink: 0,
    border: "1px solid #eee",
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    background: "#eee",
    flexShrink: 0,
    border: "1px solid #eee",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: { width: "100%", height: "100%", background: "#e9ecef" },
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 16,
  },
  card: {
    width: 720,
    maxWidth: "96vw",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #eee",
    padding: 16,
    boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
    maxHeight: "86vh",
    overflow: "auto",
  },
  closeBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 10,
    width: 40,
    height: 40,
    cursor: "pointer",
    fontWeight: 1000,
  },
};
