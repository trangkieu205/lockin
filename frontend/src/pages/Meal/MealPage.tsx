import React, { useEffect, useMemo, useState } from "react";
import { delJson, getJson, postJson } from "../../services/http";
import { searchFoods, createCustomFood, type Food } from "../../services/foodService";
import {todayKey } from "../../utils/date";

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

type MealLog = {
  id: number;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  foodId?: number | string;
  foodName: string;
  brand?: string;
  grams?: number;
  calories?: number;
  createdAt?: string;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:5179";

function assetUrl(uri?: string | null) {
  const s = String(uri ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

function foodImgSrc(food: any): string {
  if (!food) return "";
  return assetUrl(
    (food.imagePrimaryUri as any) ??
      (food.imageUrl as any) ??
      (food.image as any) ??
      (food.coverUrl as any) ??
      (food.thumbnail as any) ??
      ""
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  });
}

function norm(s: any) {
  return String(s ?? "").trim().toLowerCase();
}
function logKey(name: any, brand: any) {
  return `${norm(name)}|${norm(brand)}`;
}

// ---- favorites (client-side for now) ----
const FAV_LS_KEY = "lockin_fav_food_ids";

function loadFavIds(): number[] {
  try {
    const raw = localStorage.getItem(FAV_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => Number(x)).filter((x) => Number.isFinite(x));
  } catch {
    return [];
  }
}
function saveFavIds(ids: number[]) {
  try {
    localStorage.setItem(FAV_LS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function MealPage() {
  const [date, setDate] = useState(todayKey());
  const [items, setItems] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // favorites
  const [favIds, setFavIds] = useState<number[]>(() => loadFavIds());
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  // all foods cache (for showing images/hearts in the MealPage list)
  const [allFoods, setAllFoods] = useState<Food[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await searchFoods("");
        setAllFoods(list || []);
      } catch {
        setAllFoods([]);
      }
    })();
  }, []);

  const foodByNameBrand = useMemo(() => {
    const map = new Map<string, Food>();
    for (const f of allFoods) {
      map.set(logKey((f as any).name, (f as any).brand), f);
      map.set(logKey((f as any).title, (f as any).brand), f);
    }
    return map;
  }, [allFoods]);

  const foodByNameOnly = useMemo(() => {
    const map = new Map<string, Food>();
    for (const f of allFoods) {
      const n1 = norm((f as any).name);
      const n2 = norm((f as any).title);
      if (n1 && !map.has(n1)) map.set(n1, f);
      if (n2 && !map.has(n2)) map.set(n2, f);
    }
    return map;
  }, [allFoods]);

  // ---- picker modal ----
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMealType, setPickerMealType] = useState<MealType>("breakfast");
  const [q, setQ] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);
  const [foodsErr, setFoodsErr] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState<number>(100);

  // ---- custom food modal ----
  const [customOpen, setCustomOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cBrand, setCBrand] = useState("");
  const [cKcal100, setCKcal100] = useState<number>(0);
  const [cServingG, setCServingG] = useState<number>(100);
  const [cServingLabel, setCServingLabel] = useState("1 serving (100g)");
  const [cImg, setCImg] = useState<string>("");
  const [cFav, setCFav] = useState<boolean>(false);
  const [cErr, setCErr] = useState<string>("");
  const [cSaving, setCSaving] = useState(false);

  async function loadLogs(d: string) {
    setLoading(true);
    setErr("");
    try {
      const res = await getJson<{ items: MealLog[] }>(`/logs/meals?date=${encodeURIComponent(d)}`);
      setItems(res?.items ?? []);
    } catch (e: any) {
      setItems([]);
      setErr(e?.message ? String(e.message) : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function openPicker(type?: MealType) {
    setPickerMealType(type ?? "breakfast");
    setPickerOpen(true);
    setFoodsErr("");
    setSelectedFood(null);
    setGrams(100);
  }

  function closePicker() {
    setPickerOpen(false);
    setFoodsErr("");
    setSelectedFood(null);
  }

  useEffect(() => {
    if (!pickerOpen) return;
    let alive = true;
    const t = setTimeout(async () => {
      setFoodsLoading(true);
      setFoodsErr("");
      try {
        const list = await searchFoods(q);
        if (!alive) return;
        setFoods(list || []);
      } catch (e: any) {
        if (!alive) return;
        setFoods([]);
        setFoodsErr(e?.message ? String(e.message) : "Failed to load foods");
      } finally {
        if (!alive) return;
        setFoodsLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [pickerOpen, q]);

  function toggleFav(foodId: any) {
    const id = Number(foodId);
    if (!Number.isFinite(id)) return;
    setFavIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
      saveFavIds(next);
      return next;
    });
  }

  async function onCreateCustomFood() {
    setCErr("");
    const name = cName.trim();
    const brand = cBrand.trim();
    const kcal100 = Number(cKcal100);
    const servingG = Number(cServingG);

    if (!name) return setCErr("Name is required");
    if (!Number.isFinite(kcal100) || kcal100 < 0) return setCErr("Calories/100g must be a valid number");
    if (!Number.isFinite(servingG) || servingG <= 0) return setCErr("Serving grams must be > 0");

    setCSaving(true);
    try {
      const payload: any = {
        name,
        brand: brand || undefined,
        caloriesPer100g: kcal100,
        servingSizeG: servingG,
        servingLabel: cServingLabel?.trim() || undefined,
        imageBase64: cImg || undefined, // data URL
      };

      const created = await createCustomFood(payload);


      if (created) {
        setAllFoods((cur) => [created, ...cur]);

        if (cFav) {
          setFavIds((cur) => {
            const id = Number(created.id);
            if (!Number.isFinite(id)) return cur;
            if (cur.includes(id)) return cur;
            const next = [id, ...cur];
            saveFavIds(next);
            return next;
          });
        }
      }

      setCustomOpen(false);
      setCName("");
      setCBrand("");
      setCKcal100(0);
      setCServingG(100);
      setCServingLabel("1 serving (100g)");
      setCImg("");
      setCFav(false);
    } catch (e: any) {
      setCErr(e?.message ? String(e.message) : "Failed to create custom food");
    } finally {
      setCSaving(false);
    }
  }

  const totals = useMemo(() => {
    const byType: Record<MealType, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snacks: 0,
    };
    let total = 0;

    for (const it of items) {
      const cal = Number(it.calories ?? 0);
      if (!Number.isFinite(cal)) continue;
      byType[it.mealType] += cal;
      total += cal;
    }

    return { total, byType };
  }, [items]);

  const groups = useMemo(() => {
    const order: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];
    return order.map((t) => ({
      type: t,
      title:
        t === "breakfast" ? "Breakfast" : t === "lunch" ? "Lunch" : t === "dinner" ? "Dinner" : "Snacks",
      items: items.filter((x) => x.mealType === t),
      kcal: totals.byType[t],
    }));
  }, [items, totals.byType]);

  async function removeLog(id: number) {
    try {
      await delJson(`/logs/meals/${id}`);
      await loadLogs(date);
    } catch (e: any) {
      alert(e?.message ? String(e.message) : "Delete failed");
    }
  }

  async function onSaveSelected() {
    if (!selectedFood) return;
    const g = Number(grams);
    if (!Number.isFinite(g) || g <= 0) {
      setFoodsErr("Grams must be > 0");
      return;
    }

    const kcalPer100 = Number((selectedFood as any).caloriesPer100g ?? (selectedFood as any).kcalPer100g ?? 0);
    const calories = Math.round((kcalPer100 * g) / 100);

    const payload: Partial<MealLog> = {
      date,
      mealType: pickerMealType,
      foodId: (selectedFood as any).id,
      foodName: String((selectedFood as any).name ?? (selectedFood as any).title ?? "Food"),
      brand: (selectedFood as any).brand,
      grams: g,
      calories,
    };

    try {
      await postJson(`/logs/meals`, payload);
      closePicker();
      await loadLogs(date);
    } catch (e: any) {
      setFoodsErr(e?.message ? String(e.message) : "Failed to save");
    }
  }

  const groupedFoods = useMemo(() => {
    const list = foods || [];
    const qn = q.trim();
    if (qn) return [{ label: "Results", foods: list }];

    const fav = list.filter((f) => favSet.has(Number((f as any).id)));
    const rest = list.filter((f) => !favSet.has(Number((f as any).id)));

    const out: Array<{ label: string; foods: Food[] }> = [];
    if (fav.length) out.push({ label: "Favorites", foods: fav });
    out.push({ label: "All foods", foods: rest });
    return out;
  }, [foods, q, favSet]);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.h1}>Meal Diary</div>
          <div style={styles.muted}>Choose foods (from foods.json + foods.custom.json)</div>
        </div>

        <div style={styles.headerRight}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
          <button onClick={() => setCustomOpen(true)} style={styles.primaryBtn}>
            + Add Custom Food
          </button>
        </div>
      </div>

      {err ? <div style={styles.errBox}>{err}</div> : null}

      <div style={styles.cardsRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Calories</div>
          <div style={styles.bigNumber}>{totals.total}</div>
          <div style={styles.mutedSmall}>for {date}</div>
        </div>

        {groups.map((g) => (
          <div key={g.type} style={styles.card}>
            <div style={styles.cardLabel}>{g.title}</div>
            <div style={styles.bigNumber}>{g.kcal}</div>
            <div style={styles.mutedSmall}>kcal</div>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        <div>
          {loading ? <div style={styles.muted}>Loading…</div> : null}

          {groups.map((g) => (
            <div key={g.type} style={styles.section}>
              <div style={styles.sectionHead}>
                <div style={styles.sectionTitle}>
                  {g.title} <span style={styles.muted}>• {g.kcal} kcal</span>
                </div>
                <button style={styles.smallBtn} onClick={() => openPicker(g.type)}>
                  Add
                </button>
              </div>

              {g.items.length === 0 ? (
                <div style={styles.empty}>No foods logged for this meal.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {g.items.map((it) => (
                    <div key={it.id} style={styles.row}>
                      {(() => {
                        const meta =
                          foodByNameBrand.get(logKey(it.foodName, it.brand)) || foodByNameOnly.get(norm(it.foodName));
                        const img = foodImgSrc(meta);
                        const isFav = meta ? favSet.has(Number((meta as any).id)) : false;

                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <div style={styles.thumbWrap}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={styles.thumbImg}
                                  onError={(e) => {
                                    (e.currentTarget as any).style.display = "none";
                                  }}
                                />
                              ) : null}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={styles.rowTitle}>
                                {it.foodName}
                                {isFav ? <span style={styles.favBadge}>♥</span> : null}
                              </div>
                              <div style={styles.rowSub}>
                                {it.brand ? `${it.brand} • ` : ""}
                                {it.grams ? `${it.grams}g • ` : ""}
                                {it.createdAt ? new Date(it.createdAt).toLocaleTimeString() : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={styles.rowRight}>
                        <div style={styles.kcal}>{Math.round(Number(it.calories ?? 0))} kcal</div>
                        <button style={styles.dangerBtn} onClick={() => removeLog(it.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* right sidebar placeholder: your MainShellLayout already has RightSidebar */}
        <div style={styles.sideNote}>
          <div style={styles.sideTitle}>Tips</div>
          <div style={styles.muted}>
            - Click <b>Add</b> on each meal section to log a food.
            <br />- Use <b>+ Add Custom Food</b> to create your own item (saved to foods.custom.json).
          </div>
        </div>
      </div>

      {/* CREATE CUSTOM FOOD MODAL */}
      {customOpen ? (
        <div style={styles.modalOverlay} onMouseDown={() => !cSaving && setCustomOpen(false)}>
          <div style={styles.modalWide} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTitleRow}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>Add custom food</div>
              <button style={styles.iconBtn} onClick={() => !cSaving && setCustomOpen(false)}>
                ✕
              </button>
            </div>

            {cErr ? <div style={styles.errBox}>{cErr}</div> : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={styles.formLabel}>Name</div>
                <input value={cName} onChange={(e) => setCName(e.target.value)} style={styles.input} placeholder="e.g. My Oatmeal" />
              </div>

              <div>
                <div style={styles.formLabel}>Brand (optional)</div>
                <input value={cBrand} onChange={(e) => setCBrand(e.target.value)} style={styles.input} placeholder="e.g. Quaker" />
              </div>

              <div>
                <div style={styles.formLabel}>Calories / 100g</div>
                <input
                  type="number"
                  value={cKcal100}
                  onChange={(e) => setCKcal100(Number(e.target.value))}
                  style={styles.input}
                  placeholder="e.g. 389"
                />
              </div>

              <div>
                <div style={styles.formLabel}>Serving size (g)</div>
                <input
                  type="number"
                  value={cServingG}
                  onChange={(e) => setCServingG(Number(e.target.value))}
                  style={styles.input}
                  placeholder="e.g. 40"
                />
              </div>

              <div style={{ gridColumn: "1 / span 2" }}>
                <div style={styles.formLabel}>Serving label (optional)</div>
                <input
                  value={cServingLabel}
                  onChange={(e) => setCServingLabel(e.target.value)}
                  style={styles.input}
                  placeholder="e.g. 1/2 cup (~40g)"
                />
              </div>

              <div style={{ gridColumn: "1 / span 2" }}>
                <div style={styles.formLabel}>Image (optional)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 14, overflow: "hidden", background: "rgba(0,0,0,0.08)" }}>
                    {cImg ? <img src={cImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await readFileAsDataUrl(file);
                      setCImg(dataUrl);
                    }}
                  />
                </div>
              </div>

              <div style={{ gridColumn: "1 / span 2" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, userSelect: "none" }}>
                  <input type="checkbox" checked={cFav} onChange={(e) => setCFav(e.target.checked)} />
                  Mark as favorite
                </label>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.smallBtn} onClick={() => !cSaving && setCustomOpen(false)}>
                Cancel
              </button>
              <button style={styles.primaryBtn} onClick={onCreateCustomFood} disabled={cSaving}>
                {cSaving ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* FOOD PICKER MODAL */}
      {pickerOpen ? (
        <div style={styles.modalOverlay} onMouseDown={closePicker}>
          <div style={styles.modalWide} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.modalTitleRow}>
              <div style={styles.modalTitle}>Choose food</div>
              <button style={styles.iconBtn} onClick={closePicker}>
                ✕
              </button>
            </div>

            <div style={styles.searchRow}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search food name / brand…"
                style={{ ...styles.input, flex: 1 }}
              />
              <button style={styles.smallBtn} onClick={() => setQ(q.trim())}>
                Search
              </button>
            </div>

            {foodsLoading ? <div style={styles.muted}>Loading…</div> : null}
            {foodsErr ? <div style={styles.errBox}>{foodsErr}</div> : null}

            <div style={styles.foodList}>
              {groupedFoods.map((g) => (
                <div key={g.label}>
                  <div style={styles.groupLabel}>{g.label}</div>
                  {g.foods.map((f) => {
                    const isSelected = selectedFood?.id === f.id;
                    const isFav = favSet.has(Number(f.id));
                    const img = foodImgSrc(f);

                    return (
                      <div key={String(f.id)} style={{ display: "grid", gap: 8 }}>
                        <button
                          style={{
                            ...styles.foodRow,
                            borderColor: isSelected ? "rgba(29,119,232,0.6)" : "rgba(0,0,0,0.08)",
                          }}
                          onClick={() => setSelectedFood(f)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                            <div style={styles.thumbWrap}>
                              {img ? (
                                <img
                                  src={img}
                                  alt=""
                                  style={styles.thumbImg}
                                  onError={(e) => {
                                    (e.currentTarget as any).style.display = "none";
                                  }}
                                />
                              ) : null}
                            </div>

                            <div style={{ minWidth: 0, textAlign: "left" }}>
                              <div style={styles.foodName}>
                                {String((f as any).name ?? (f as any).title ?? "")}
                              </div>
                              <div style={styles.foodMeta}>
                                {(f as any).verified ? "Verified" : (f as any).custom ? "Custom" : ""}
                                {(f as any).brand ? ` • ${(f as any).brand}` : ""}
                                {" • "}
                                {Number((f as any).caloriesPer100g ?? (f as any).kcalPer100g ?? 0)} kcal/100g
                                {(f as any).servingLabel ? ` • ${(f as any).servingLabel}` : ""}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button
                              type="button"
                              style={styles.heartBtn}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFav((f as any).id);
                              }}
                              title={isFav ? "Remove favorite" : "Add favorite"}
                            >
                              {isFav ? "♥" : "♡"}
                            </button>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div style={styles.pickerFooter}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={styles.mutedSmall}>Meal:</div>
                <select
                  value={pickerMealType}
                  onChange={(e) => setPickerMealType(e.target.value as MealType)}
                  style={styles.select}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                </select>

                <div style={styles.mutedSmall}>Grams:</div>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(Number(e.target.value))}
                  style={{ ...styles.input, width: 120 }}
                />
              </div>

              <button style={styles.primaryBtn} onClick={onSaveSelected} disabled={!selectedFood}>
                Add to meal
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 16,
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 14,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  h1: {
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1.1,
  },
  muted: {
    color: "rgba(0,0,0,0.55)",
  },
  mutedSmall: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 12,
  },
  dateInput: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(29,119,232,0.22)",
    background: "rgba(29,119,232,0.95)",
    color: "white",
    fontWeight: 800,
    cursor: "pointer",
  },
  smallBtn: {
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    fontWeight: 700,
    cursor: "pointer",
  },
  dangerBtn: {
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid rgba(220,38,38,0.25)",
    background: "white",
    color: "rgba(220,38,38,0.95)",
    fontWeight: 800,
    cursor: "pointer",
  },
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 14,
    background: "white",
  },
  cardLabel: {
    color: "rgba(0,0,0,0.6)",
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bigNumber: {
    fontSize: 26,
    fontWeight: 900,
    marginTop: 6,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1.35fr 1fr",
    gap: 16,
    alignItems: "start",
  },
  section: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 14,
    background: "white",
    marginBottom: 14,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  empty: {
    padding: 10,
    color: "rgba(0,0,0,0.55)",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
  },
  rowTitle: {
    fontWeight: 900,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  rowSub: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 12,
  },
  rowRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  kcal: {
    fontWeight: 900,
  },
  sideNote: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 14,
    background: "white",
  },
  sideTitle: {
    fontWeight: 900,
    marginBottom: 8,
  },
  errBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(220,38,38,0.25)",
    background: "rgba(220,38,38,0.06)",
    color: "rgba(220,38,38,0.95)",
    fontWeight: 700,
    marginBottom: 12,
  },

  // modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  modalWide: {
    width: "min(860px, 96vw)",
    maxHeight: "90vh",
    overflow: "auto",
    background: "white",
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
    padding: 16,
  },
  modalTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 900,
  },
  iconBtn: {
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
  },
  foodList: {
    display: "grid",
    gap: 10,
    paddingBottom: 12,
  },
  groupLabel: {
    marginTop: 10,
    marginBottom: 8,
    fontWeight: 900,
    color: "rgba(0,0,0,0.75)",
  },
  foodRow: {
    width: "100%",
    textAlign: "left",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 16,
    padding: 12,
    background: "white",
    cursor: "pointer",
  },
  foodName: {
    fontWeight: 900,
    fontSize: 18,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  foodMeta: {
    color: "rgba(0,0,0,0.55)",
    fontSize: 13,
    marginTop: 2,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  heartBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    padding: 6,
  },
  pickerFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderTop: "1px solid rgba(0,0,0,0.08)",
    paddingTop: 12,
    marginTop: 10,
  },
  formLabel: {
    fontWeight: 800,
    marginBottom: 6,
  },

  imgFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(0,0,0,0.08)",
    flex: "0 0 auto",
  },

  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(0,0,0,0.08)",
    overflow: "hidden",
    flex: "0 0 auto",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  favBadge: {
    color: "rgba(220,38,38,0.95)",
    fontWeight: 900,
    fontSize: 16,
  },
};
