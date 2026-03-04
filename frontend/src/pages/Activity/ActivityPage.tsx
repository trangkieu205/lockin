import React, { useEffect, useMemo, useState } from "react";
import { delJson, getJson, postJson } from "../../services/http";
import {
  searchExercises,
  createCustomExercise,
  listFavoriteExercises,
  toggleExerciseFavorite,
  type Exercise,
} from "../../services/exerciseService";
import { todayKey } from "../../utils/date";

type WorkoutLog = {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  category: string;
  minutes: number;
  caloriesBurned: number;
  createdAt?: string;
  imageUrl?: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5179";

function safeNum(x: any) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function assetUrl(uri?: string | null) {
  const s = String(uri ?? "").trim();
  if (!s) return "";

  // allow inline/local urls
  if (/^(data|blob|file):/i.test(s)) return s;

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

function imgOf(x: any): string {
  if (!x) return "";
  return assetUrl(
    (x.imageUrl as any) ??
      (x.imagePrimaryUri as any) ??
      (x.imageUri as any) ??
      (x.thumbnailUrl as any) ??
      (x.thumbUrl as any) ??
      ""
  );
}

const CAT_ORDER = ["Cardiovascular", "Strength Training", "Other"];

export function ActivityPage() {
  const [date, setDate] = useState(todayKey());
  const [items, setItems] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // choose exercise modal
  const [openChoose, setOpenChoose] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  // when opening modal from a specific category section, lock it to reduce long scrolling
  const [lockedCat, setLockedCat] = useState<string | null>(null);
  const [results, setResults] = useState<Exercise[]>([]);
  const [fav, setFav] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [minutes, setMinutes] = useState(30);

  // create custom exercise modal
  const [openCustom, setOpenCustom] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cCategory, setCCategory] = useState("Cardiovascular");
  const [cCaloriesPerMin, setCCaloriesPerMin] = useState(8);
  const [cImageUrl, setCImageUrl] = useState("");

  // ✅ fix crash when selected = null
  const pickedImage =
    (selected as any)?.imageUrl ??
    (selected as any)?.imagePrimaryUri ??
    (selected as any)?.imageUri ??
    (selected as any)?.thumbnailUrl ??
    (selected as any)?.thumbUrl ??
    undefined;

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await getJson<{ items: WorkoutLog[] }>(`/logs/workouts?date=${date}`);
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load logs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function loadExercises(override?: { query?: string; category?: string }) {
    const query = override?.query ?? q;
    const category = override?.category ?? cat;
    const [a, b] = await Promise.all([searchExercises({ query, category }), listFavoriteExercises()]);
    setResults(Array.isArray(a?.items) ? a.items : []);
    setFav(Array.isArray(b?.items) ? b.items : []);
  }

  function openChooseModalFor(category: string) {
    setErr("");
    setQ("");
    setCat(category);
    setLockedCat(category || null);
    setSelected(null);
    setMinutes(30);
    setOpenChoose(true);
    loadExercises({ query: "", category }).catch(() => {});
  }

  function openCustomModal() {
    setErr("");
    setLockedCat(null);
    setCTitle("");
    setCCategory("Cardiovascular");
    setCCaloriesPerMin(8);
    setCImageUrl("");
    setOpenCustom(true);
  }

  async function onToggleFav(ex: Exercise) {
    try {
      await toggleExerciseFavorite(ex.id);
      await loadExercises();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to toggle favorite");
    }
  }

  async function onCreateLog() {
    if (!selected) return;
    const min = Math.max(1, safeNum(minutes));
    const kk = Math.round(min * safeNum((selected as any).caloriesPerMin ?? 0));

    try {
      await postJson("/logs/workouts", {
        date,
        title: selected.title,
        category: lockedCat || selected.category || "Other",
        minutes: min,
        caloriesBurned: kk,
        imageUrl: pickedImage, // can be data:/blob:/file:/http:/relative
      });
      setOpenChoose(false);
      setLockedCat(null);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create log");
    }
  }

  async function onDeleteLog(id: number) {
    try {
      await delJson(`/logs/workouts/${id}`);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete log");
    }
  }

  async function onCreateCustom() {
    const title = cTitle.trim();
    if (!title) {
      setErr("Title is required");
      return;
    }

    try {
      await createCustomExercise({
        title,
        category: cCategory,
        caloriesPerMinute: Math.max(0, safeNum(cCaloriesPerMin)),
        imageUrl: cImageUrl.trim() || undefined,
      });
      setOpenCustom(false);
      await loadExercises();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create custom activity");
    }
  }

  const totals = useMemo(() => {
    const totalBurned = items.reduce((s, x) => s + safeNum(x.caloriesBurned), 0);
    const totalMinutes = items.reduce((s, x) => s + safeNum(x.minutes), 0);
    return {
      totalBurned: Math.round(totalBurned),
      totalMinutes: Math.round(totalMinutes),
      count: items.length,
    };
  }, [items]);

  const grouped = useMemo(() => {
    const map: Record<string, WorkoutLog[]> = {};
    for (const it of items) {
      const k = String(it.category || "Other");
      (map[k] ||= []).push(it);
    }
    return [
      ...CAT_ORDER.map((k) => ({ key: k, items: map[k] || [] })),
      ...Object.keys(map)
        .filter((k) => !CAT_ORDER.includes(k))
        .map((k) => ({ key: k, items: map[k] || [] })),
    ];
  }, [items]);

  const favIds = useMemo(() => new Set(fav.map((x) => String(x.id))), [fav]);

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Activity Diary</h1>
          <div style={styles.sub}>Choose activities (from exercises.json + exercises.custom.json)</div>
        </div>

        <div style={styles.headerRight}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
          <button onClick={openCustomModal} style={styles.secondaryBtn}>
            + Add Custom Activity
          </button>
        </div>
      </div>

      {err ? <div style={styles.err}>{err}</div> : null}

      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Total Burned</div>
          <div style={styles.big}>{totals.totalBurned} kcal</div>
          <div style={styles.muted}>{totals.count} activities</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Total Minutes</div>
          <div style={styles.big}>{totals.totalMinutes}</div>
          <div style={styles.muted}>minutes</div>
        </div>
      </div>

      <div style={styles.sections}>
        {grouped.map((g) => {
          const total = g.items.reduce((s, x) => s + safeNum(x.caloriesBurned), 0);
          return (
            <div key={g.key} style={styles.section}>
              <div style={styles.sectionHead}>
                <div style={styles.sectionTitle}>
                  {g.key} <span style={styles.sectionKcal}>• {Math.round(total)} kcal</span>
                </div>
                <button onClick={() => openChooseModalFor(g.key)} style={styles.primaryBtnSm}>
                  Log Activity
                </button>
              </div>

              {g.items.length === 0 ? (
                <div style={styles.empty}>No activities</div>
              ) : (
                <div style={styles.rows}>
                  {g.items.map((it) => (
                    <div key={it.id} style={styles.row}>
                      <div style={styles.rowLeft}>
                        <div style={styles.thumbWrap}>
                          {imgOf(it) ? <img src={imgOf(it)} alt="" style={styles.thumb} /> : <div style={styles.thumbPlaceholder} />}
                        </div>
                        <div>
                          <div style={styles.rowTitle}>{it.title}</div>
                          <div style={styles.rowMeta}>{it.minutes} min • {new Date(it.createdAt || Date.now()).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      <div style={styles.rowRight}>
                        <div style={styles.kcal}>{Math.round(safeNum(it.caloriesBurned))} kcal</div>
                        <button onClick={() => onDeleteLog(it.id)} style={styles.delBtn}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openChoose ? (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => {
            setOpenChoose(false);
            setLockedCat(null);
          }}
        >
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Choose activity</h2>

            <div style={styles.modalTop}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity name..." style={styles.searchInput} />
              <select
                value={cat}
                disabled={!!lockedCat}
                onChange={(e) => {
                  setCat(e.target.value);
                  setLockedCat(null);
                }}
                style={{
                  ...styles.select,
                  ...(lockedCat ? { opacity: 0.7, cursor: "not-allowed" as const } : null),
                }}
              >
                <option value="">All categories</option>
                {CAT_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button onClick={() => loadExercises()} style={styles.secondaryBtn}>
                Search
              </button>
            </div>

            {fav.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div style={styles.blockTitle}>Favorites</div>
                <div style={styles.list}>
                  {fav.map((ex) => (
                    <div key={ex.id} style={styles.pickRow}>
                      <div style={styles.pickLeft} onClick={() => setSelected(ex)}>
                        <div style={styles.thumbWrap}>
                          {imgOf(ex) ? <img src={imgOf(ex)} alt="" style={styles.thumb} /> : <div style={styles.thumbPlaceholder} />}
                        </div>
                        <div>
                          <div style={styles.pickTitle}>{ex.title}</div>
                          <div style={styles.pickMeta}>
                            {Math.round(safeNum((ex as any).caloriesPerMin ?? 0) * 60)} kcal/hour • {ex.category}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => onToggleFav(ex)} style={styles.heartBtn} title="Toggle favorite">
                        {favIds.has(String(ex.id)) ? "♥" : "♡"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 14 }}>
              <div style={styles.blockTitle}>All activities</div>
              <div style={styles.list}>
                {results.map((ex) => (
                  <div key={ex.id} style={styles.pickRow}>
                    <div style={styles.pickLeft} onClick={() => setSelected(ex)}>
                      <div style={styles.thumbWrap}>
                        {imgOf(ex) ? <img src={imgOf(ex)} alt="" style={styles.thumb} /> : <div style={styles.thumbPlaceholder} />}
                      </div>
                      <div>
                        <div style={styles.pickTitle}>{ex.title}</div>
                        <div style={styles.pickMeta}>
                          {Math.round(safeNum((ex as any).caloriesPerMin ?? 0) * 60)} kcal/hour • {ex.category}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => onToggleFav(ex)} style={styles.heartBtn} title="Toggle favorite">
                      {favIds.has(String(ex.id)) ? "♥" : "♡"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={styles.label}>Minutes</span>
                <input type="number" value={minutes} min={1} onChange={(e) => setMinutes(Number(e.target.value))} style={styles.minutesInput} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setOpenChoose(false);
                    setLockedCat(null);
                  }}
                  style={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button onClick={onCreateLog} disabled={!selected} style={{ ...styles.primaryBtn, opacity: selected ? 1 : 0.6 }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {openCustom ? (
        <div style={styles.modalOverlay} onMouseDown={() => setOpenCustom(false)}>
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Create custom activity</h2>

            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span style={styles.label}>Title</span>
                <input value={cTitle} onChange={(e) => setCTitle(e.target.value)} style={styles.input} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Category</span>
                <select value={cCategory} onChange={(e) => setCCategory(e.target.value)} style={styles.select}>
                  {CAT_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Calories / min</span>
                <input type="number" value={cCaloriesPerMin} min={0} onChange={(e) => setCCaloriesPerMin(Number(e.target.value))} style={styles.input} />
              </label>

              <label style={styles.field}>
                <span style={styles.label}>Image URL (optional)</span>
                <input value={cImageUrl} onChange={(e) => setCImageUrl(e.target.value)} style={styles.input} />
              </label>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setOpenCustom(false)} style={styles.secondaryBtn}>
                Cancel
              </button>
              <button onClick={onCreateCustom} style={styles.primaryBtn}>
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <div style={{ marginTop: 10, color: "#666" }}>Loading...</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: 16 },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  h1: { margin: 0, fontSize: 40, fontWeight: 900 },
  sub: { color: "#666", marginTop: 4 },
  dateInput: { height: 38, borderRadius: 12, border: "1px solid #ddd", padding: "0 12px" },
  primaryBtn: { height: 38, padding: "0 12px", borderRadius: 12, border: "none", cursor: "pointer", background: "#1d77e8", color: "#fff", fontWeight: 800 },
  primaryBtnSm: { height: 34, padding: "0 12px", borderRadius: 12, border: "none", cursor: "pointer", background: "#1d77e8", color: "#fff", fontWeight: 800 },
  secondaryBtn: { height: 38, padding: "0 12px", borderRadius: 12, border: "1px solid #ddd", cursor: "pointer", background: "#fff", fontWeight: 800 },
  err: { background: "#ffe7e7", border: "1px solid #ffc2c2", padding: 10, borderRadius: 12, color: "#a20000", marginBottom: 12 },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  card: { border: "1px solid #eee", borderRadius: 16, padding: 16, background: "#fff" },
  cardTitle: { fontWeight: 800, color: "#444" },
  big: { fontSize: 28, fontWeight: 900, marginTop: 6 },
  muted: { color: "#777", marginTop: 2 },
  sections: { display: "flex", flexDirection: "column", gap: 16 },
  section: { border: "1px solid #eee", borderRadius: 16, background: "#fff", padding: 16 },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: 900 },
  sectionKcal: { fontSize: 16, fontWeight: 600, color: "#666" },
  empty: { color: "#666", padding: "8px 0" },
  rows: { display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #eee", borderRadius: 16, padding: 12 },
  rowLeft: { display: "flex", alignItems: "center", gap: 12 },
  rowRight: { display: "flex", alignItems: "center", gap: 12 },
  rowTitle: { fontSize: 18, fontWeight: 900 },
  rowMeta: { color: "#666", fontSize: 12 },
  kcal: { fontWeight: 900 },
  delBtn: { height: 34, padding: "0 12px", borderRadius: 12, border: "1px solid #ffd0d0", background: "#fff", color: "#c30000", fontWeight: 800, cursor: "pointer" },

  thumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: "hidden", background: "#f1f3f5", flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center" },
  thumb: { width: "100%", height: "100%", objectFit: "cover" },
  thumbPlaceholder: { width: "100%", height: "100%", background: "#e9ecef" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 },
  modal: { width: "min(820px, 92vw)", maxHeight: "82vh", overflow: "auto", background: "#fff", borderRadius: 16, padding: 16, border: "1px solid #eee" },
  modalTitle: { margin: 0, fontSize: 22, fontWeight: 900 },
  modalTop: { display: "grid", gridTemplateColumns: "1fr 180px auto", gap: 10, marginTop: 12, alignItems: "center" },
  searchInput: { height: 38, borderRadius: 12, border: "1px solid #ddd", padding: "0 12px" },
  select: { height: 38, borderRadius: 12, border: "1px solid #ddd", padding: "0 12px" },

  list: { display: "flex", flexDirection: "column", gap: 12, marginTop: 10 },
  pickRow: { display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #eee", borderRadius: 16, padding: 12 },
  pickLeft: { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", flex: 1 },
  pickTitle: { fontSize: 18, fontWeight: 900 },
  pickMeta: { color: "#666", fontSize: 12, marginTop: 2 },
  heartBtn: { width: 42, height: 42, borderRadius: 14, border: "1px solid #eee", background: "#fff", cursor: "pointer", fontSize: 18 },
  blockTitle: { fontWeight: 900, fontSize: 16 },
  modalActions: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  label: { fontWeight: 800, color: "#444" },
  minutesInput: { width: 90, height: 38, borderRadius: 12, border: "1px solid #ddd", padding: "0 12px" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  input: { height: 38, borderRadius: 12, border: "1px solid #ddd", padding: "0 12px" },
};
