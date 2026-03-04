import React, { useEffect, useMemo, useState } from "react";
import { delJson, getJson, postJson } from "../../services/http";

type Relaxation = {
  id: number;
  title: string;
  category: string;
  desc?: string;
  steps?: string[];
  suggestedMinutes?: number;
  imageUrl?: string | null;
};

type RelaxationLog = {
  id: number;
  date: string;
  relaxationId?: number;
  category?: string;
  title: string;
  minutes: number;
  note?: string;
  mood?: string;
  loggedAt?: string;
  imageUrl?: string;
};

function todayKeyLocal() {
  return new Date().toISOString().slice(0, 10);
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function RelaxationPage() {
  const [date, setDate] = useState(todayKeyLocal());

  const [relaxations, setRelaxations] = useState<Relaxation[]>([]);
  const [logs, setLogs] = useState<RelaxationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // --- Log modal state (per category)
  const [logOpen, setLogOpen] = useState(false);
  const [logCategory, setLogCategory] = useState<string>("");
  const [logRelaxationId, setLogRelaxationId] = useState<number | "">("");
  const [logTitle, setLogTitle] = useState("");
  const [logMinutes, setLogMinutes] = useState<number>(10);
  const [logMood, setLogMood] = useState("");
  const [logNote, setLogNote] = useState("");

  // --- Add custom relaxation state
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSuggestedMinutes, setNewSuggestedMinutes] = useState<number>(5);
  const [newImageUrl, setNewImageUrl] = useState<string>("");

  const totalMinutes = useMemo(
    () => logs.reduce((s, x) => s + (Number(x.minutes) || 0), 0),
    [logs]
  );

  const categories = useMemo(() => {
    const map = new Map<string, Relaxation[]>();
    for (const r of relaxations) {
      const key = String(r.category || "Other").trim() || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    // stable sort: category name, then title
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, items]) => ({
        category,
        items: items.slice().sort((a, b) => a.title.localeCompare(b.title)),
      }));
  }, [relaxations]);

  function relaxationsByCategory(cat: string) {
    return relaxations.filter((r) => String(r.category) === String(cat));
  }

  function findRelaxation(id: number | "") {
    if (id === "") return undefined;
    return relaxations.find((r) => r.id === id);
  }

  async function loadRelaxations() {
    const res = await getJson<{ items: Relaxation[] }>("/relaxations");
    setRelaxations(res?.items ?? []);
  }

  async function loadLogs() {
    const res = await getJson<{ items: RelaxationLog[] }>(
      `/logs/relaxation?date=${encodeURIComponent(date)}`
    );
    setLogs(res?.items ?? []);
  }

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      await Promise.all([loadRelaxations(), loadLogs()]);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load relaxation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLogs().catch((e: any) => setErr(e?.message ?? "Failed to load logs"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function openLogModal(category: string) {
    const list = relaxationsByCategory(category);
    const first = list[0];

    setLogCategory(category);
    setLogRelaxationId(first ? first.id : "");
    setLogTitle(first ? first.title : "");
    setLogMinutes(first?.suggestedMinutes ? Number(first.suggestedMinutes) : 10);
    setLogMood("");
    setLogNote("");
    setLogOpen(true);
  }

  async function onCreateLog() {
    setErr("");

    const min = Number(logMinutes);
    if (!Number.isFinite(min) || min <= 0) return setErr("Minutes must be > 0");

    const picked = findRelaxation(logRelaxationId);
    const title = (picked?.title ?? logTitle).trim();
    const category = (picked?.category ?? logCategory).trim();

    if (!title) return setErr("Title is required");

    try {
      await postJson("/logs/relaxation", {
        date,
        relaxationId: picked?.id,
        category,
        title,
        minutes: min,
        mood: logMood.trim() || undefined,
        note: logNote.trim() || undefined,
        imageUrl: picked?.imageUrl || undefined,
      });
      setLogOpen(false);
      await loadLogs();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to log relaxation");
    }
  }

  async function onDeleteLog(id: number) {
    setErr("");
    try {
      await delJson(`/logs/relaxation/${id}`);
      setLogs((cur) => cur.filter((x) => x.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete");
    }
  }

  function openAddCustom() {
    const defaultCategory = categories[0]?.category ?? "Breathing";
    setNewTitle("");
    setNewCategory(defaultCategory);
    setNewDesc("");
    setNewSuggestedMinutes(5);
    setNewImageUrl("");
    setAddOpen(true);
  }

  async function onCreateCustomRelaxation() {
    setErr("");
    const title = newTitle.trim();
    const category = newCategory.trim();
    const suggestedMinutes = Number(newSuggestedMinutes);

    if (!title) return setErr("Title is required");
    if (!category) return setErr("Category is required");
    if (!Number.isFinite(suggestedMinutes) || suggestedMinutes <= 0) return setErr("Suggested minutes must be > 0");

    try {
      const res = await postJson<{ item: Relaxation }>("/relaxations", {
        title,
        category,
        desc: newDesc.trim() || undefined,
        suggestedMinutes,
        imageUrl: newImageUrl.trim() || null,
      });

      setAddOpen(false);
      await loadRelaxations();

      // nice UX: open log modal for the newly added item's category
      const created = res?.item;
      if (created?.category) {
        setTimeout(() => openLogModal(created.category), 0);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add custom relaxation");
    }
  }

  return (
    <div>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Relaxation</div>
          <div style={styles.sub}>Breathing • Stretching • Recovery</div>
        </div>

        <div style={styles.headerRight}>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.dateInput}
          />
          <button onClick={openAddCustom} style={styles.primaryBtn}>
            + Add Relaxation
          </button>
        </div>
      </div>

      <div style={styles.cardsRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Minutes</div>
          <div style={styles.bigNumber}>{Math.round(totalMinutes)}</div>
          <div style={styles.muted}>minutes (selected date)</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Sessions</div>
          <div style={styles.bigNumber}>{logs.length}</div>
          <div style={styles.muted}>selected date</div>
        </div>
      </div>

      {err ? <div style={styles.error}>{err}</div> : null}
      {loading ? <div style={styles.muted}>Loading…</div> : null}

      {/* Library */}
      <div style={{ ...styles.section, marginBottom: 12 }}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>Relaxation Library</div>
          <div style={styles.muted}>Log by category (small popup)</div>
        </div>

        {categories.length === 0 ? (
          <div style={styles.empty}>No relaxations</div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {categories.map((group) => (
              <div key={group.category}>
                <div style={styles.categoryHead}>
                  <div style={styles.categoryTitle}>{group.category}</div>
                  <button onClick={() => openLogModal(group.category)} style={styles.primaryBtnSmall}>
                    Log
                  </button>
                </div>

                <div style={styles.gridCards}>
                  {group.items.map((r) => (
                    <div key={r.id} style={styles.relaxCard}>
                      <div style={{ display: "flex", gap: 12 }}>
                        {r.imageUrl ? (
                          <img
                            src={r.imageUrl}
                            alt=""
                            style={styles.thumb}
                          />
                        ) : (
                          <div style={styles.thumbFallback} />
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={styles.relaxTitle}>{r.title}</div>
                          {r.desc ? <div style={styles.relaxDesc}>{r.desc}</div> : null}
                          <div style={styles.relaxMeta}>
                            Suggested: {r.suggestedMinutes ?? 5} min
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diary */}
      <div style={styles.section}>
        <div style={styles.sectionHead}>
          <div style={styles.sectionTitle}>Your Relaxation Diary</div>
        </div>

        {logs.length === 0 ? (
          <div style={styles.empty}>No sessions</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {logs.map((it) => (
              <div key={it.id} style={styles.row}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt="" style={styles.thumbSmall} />
                  ) : (
                    <div style={styles.thumbFallbackSmall} />
                  )}

                  <div>
                    <div style={styles.rowTitle}>{it.title}</div>
                    <div style={styles.rowSub}>
                      {it.category ? `${it.category} • ` : ""}
                      {it.minutes} min
                      {it.mood ? ` • Mood: ${it.mood}` : ""}
                      {it.loggedAt ? ` • ${new Date(it.loggedAt).toLocaleTimeString()}` : ""}
                    </div>
                    {it.note ? (
                      <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>{it.note}</div>
                    ) : null}
                  </div>
                </div>

                <button onClick={() => onDeleteLog(it.id)} style={styles.dangerBtn}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log modal */}
      {logOpen ? (
        <div style={styles.modalOverlay} onMouseDown={() => setLogOpen(false)}>
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Log Relaxation • {logCategory}</div>
            <div style={styles.modalBody}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Relaxation</div>
                  <select
                    value={logRelaxationId}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const nextId = raw ? Number(raw) : "";
                      setLogRelaxationId(nextId);
                      const picked = findRelaxation(nextId);
                      if (picked) {
                        setLogTitle(picked.title);
                        setLogMinutes(picked.suggestedMinutes ? Number(picked.suggestedMinutes) : 10);
                      }
                    }}
                    style={styles.input}
                  >
                    <option value="">(Custom title)</option>
                    {relaxationsByCategory(logCategory).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Minutes</div>
                  <input
                    type="number"
                    value={logMinutes}
                    onChange={(e) => setLogMinutes(Number(e.target.value))}
                    style={styles.input}
                  />
                </div>
              </div>

              {logRelaxationId === "" ? (
                <div style={styles.field}>
                  <div style={styles.label}>Title</div>
                  <input value={logTitle} onChange={(e) => setLogTitle(e.target.value)} style={styles.input} />
                </div>
              ) : null}

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Mood (optional)</div>
                  <input value={logMood} onChange={(e) => setLogMood(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Note (optional)</div>
                  <input value={logNote} onChange={(e) => setLogNote(e.target.value)} style={styles.input} />
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setLogOpen(false)} style={styles.secondaryBtn}>
                Cancel
              </button>
              <button onClick={onCreateLog} style={styles.primaryBtn}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add custom modal */}
      {addOpen ? (
        <div style={styles.modalOverlay} onMouseDown={() => setAddOpen(false)}>
          <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Add Custom Relaxation</div>
            <div style={styles.modalBody}>
              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Title</div>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={styles.input} />
                </div>
                <div style={styles.field}>
                  <div style={styles.label}>Category</div>
                  <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={styles.input} />
                </div>
              </div>

              <div style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>Suggested Minutes</div>
                  <input
                    type="number"
                    value={newSuggestedMinutes}
                    onChange={(e) => setNewSuggestedMinutes(Number(e.target.value))}
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>Image</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const dataUrl = await fileToDataUrl(f);
                        setNewImageUrl(dataUrl);
                      } catch (err: any) {
                        setErr(err?.message ?? "Failed to read image");
                      }
                    }}
                    style={{ ...styles.input, paddingTop: 8 }}
                  />
                </div>
              </div>

              {newImageUrl ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={newImageUrl} alt="" style={styles.preview} />
                  <button onClick={() => setNewImageUrl("")} style={styles.secondaryBtn}>
                    Remove image
                  </button>
                </div>
              ) : null}

              <div style={styles.field}>
                <div style={styles.label}>Description (optional)</div>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ ...styles.input, height: 90, padding: 12 }}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setAddOpen(false)} style={styles.secondaryBtn}>
                Cancel
              </button>
              <button onClick={onCreateCustomRelaxation} style={styles.primaryBtn}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RelaxationPage;

const styles: Record<string, React.CSSProperties> = {
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, marginBottom: 12 },
  headerRight: { display: "flex", gap: 10, alignItems: "center" },
  title: { fontSize: 28, fontWeight: 800 },
  sub: { color: "#666" },

  dateInput: { height: 38, borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", padding: "0 10px" },

  cardsRow: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 12 },
  card: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  cardLabel: { color: "#666", fontWeight: 700, marginBottom: 6 },
  bigNumber: { fontSize: 24, fontWeight: 900 },
  muted: { color: "#777", fontSize: 13 },

  error: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", padding: 10, borderRadius: 12, marginBottom: 12 },

  section: {
    background: "#fff",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 800 },
  empty: { color: "#777", padding: "6px 0" },

  categoryHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryTitle: { fontSize: 16, fontWeight: 900 },

  gridCards: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },

  relaxCard: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  relaxTitle: { fontWeight: 900 },
  relaxDesc: { color: "#666", fontSize: 13, marginTop: 4, lineHeight: 1.3 },
  relaxMeta: { color: "#777", fontSize: 12, marginTop: 6 },

  thumb: {
    width: 54,
    height: 54,
    borderRadius: 14,
    objectFit: "cover",
    border: "1px solid rgba(0,0,0,0.1)",
  },
  thumbFallback: { width: 54, height: 54, borderRadius: 14, background: "#e5e7eb" },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "#fafafa",
  },
  rowTitle: { fontWeight: 900 },
  rowSub: { color: "#777", fontSize: 12, marginTop: 2 },

  thumbSmall: {
    width: 44,
    height: 44,
    borderRadius: 12,
    objectFit: "cover",
    border: "1px solid rgba(0,0,0,0.1)",
  },
  thumbFallbackSmall: { width: 44, height: 44, borderRadius: 12, background: "#e5e7eb" },

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
  primaryBtnSmall: {
    height: 32,
    padding: "0 12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#1d77e8",
    color: "#fff",
    fontWeight: 800,
  },
  secondaryBtn: {
    height: 34,
    padding: "0 10px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
  },
  dangerBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 800,
    color: "#b91c1c",
    whiteSpace: "nowrap",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    zIndex: 50,
  },
  modal: {
    width: 680,
    maxWidth: "95vw",
    background: "#fff",
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  modalTitle: { padding: 14, fontSize: 18, fontWeight: 900, borderBottom: "1px solid rgba(0,0,0,0.08)" },
  modalBody: { padding: 14, display: "grid", gap: 12 },
  modalActions: {
    padding: 14,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    borderTop: "1px solid rgba(0,0,0,0.08)",
  },
  field: { display: "grid", gap: 6 },
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
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },

  preview: {
    width: 60,
    height: 60,
    borderRadius: 14,
    objectFit: "cover",
    border: "1px solid rgba(0,0,0,0.1)",
  },
};
