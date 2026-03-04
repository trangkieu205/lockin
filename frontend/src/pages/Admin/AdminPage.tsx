// frontend/src/pages/Admin/AdminPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createNews, deleteNews, listNews, type NewsItem } from "../../services/newsService";

const KEY_FOODS = "demo_foods_db_v1";
const KEY_EXERCISES = "demo_exercises_db_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function Card(props: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 1000, fontSize: 16 }}>{props.title}</div>
        <div style={{ marginLeft: "auto" }}>{props.right}</div>
      </div>
      {props.children}
    </div>
  );
}

function Btn(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }
) {
  const { variant = "primary", style, ...rest } = props;
  const base: React.CSSProperties = {
    borderRadius: 12,
    padding: "9px 12px",
    border: "1px solid #eee",
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  };
  const v: Record<string, React.CSSProperties> = {
    primary: { background: "#2F6BFF", borderColor: "#dbe3ff" },
    ghost: { background: "#fff", color: "#111" },
    danger: { background: "#E23B3B", borderColor: "#ffd6d6" },
  };
  return <button {...rest} style={{ ...base, ...v[variant], ...style }} />;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error("Failed to read file"));
    fr.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error("Failed to read file"));
    fr.readAsText(file);
  });
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminPage() {
  const [toast, setToast] = useState("");

  // NEWS
  const [news, setNews] = useState<NewsItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);

  // DB editors
  const [foodsText, setFoodsText] = useState<string>(() => {
    const arr = safeParse<any[]>(localStorage.getItem(KEY_FOODS), []);
    return JSON.stringify(arr, null, 2);
  });
  const [exText, setExText] = useState<string>(() => {
    const arr = safeParse<any[]>(localStorage.getItem(KEY_EXERCISES), []);
    return JSON.stringify(arr, null, 2);
  });

  const foodsImportRef = useRef<HTMLInputElement | null>(null);
  const exImportRef = useRef<HTMLInputElement | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function refreshNews() {
    const items = await listNews();
    setNews(items);
  }

  useEffect(() => {
    refreshNews();
  }, []);

  const demoAdminEnabled = useMemo(() => {
    try {
      return localStorage.getItem("demo_admin") === "1";
    } catch {
      return false;
    }
  }, []);

  async function onCreateNews() {
    try {
      await createNews({ title, content, imageDataUrl });
      setTitle("");
      setContent("");
      setImageDataUrl(undefined);
      await refreshNews();
      showToast("Created news (demo).");
    } catch (e: any) {
      showToast(e?.message ?? "Create news failed.");
    }
  }

  async function onDeleteNews(id: string) {
    await deleteNews(id);
    await refreshNews();
    showToast("Deleted news (demo).");
  }

  function saveDb(which: "foods" | "exercises") {
    const text = which === "foods" ? foodsText : exText;
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array.");
      if (which === "foods") localStorage.setItem(KEY_FOODS, JSON.stringify(parsed));
      else localStorage.setItem(KEY_EXERCISES, JSON.stringify(parsed));
      showToast(`Saved ${which} database (demo).`);
    } catch (e: any) {
      showToast(e?.message ?? "Invalid JSON.");
    }
  }

  async function importDb(which: "foods" | "exercises", file: File) {
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array (top-level).");

      const pretty = JSON.stringify(parsed, null, 2);
      if (which === "foods") {
        setFoodsText(pretty);
        localStorage.setItem(KEY_FOODS, JSON.stringify(parsed));
      } else {
        setExText(pretty);
        localStorage.setItem(KEY_EXERCISES, JSON.stringify(parsed));
      }

      showToast(`Imported & saved ${which} DB (demo).`);
    } catch (e: any) {
      showToast(e?.message ?? "Import failed.");
    }
  }

  function exportDb(which: "foods" | "exercises") {
    const text = which === "foods" ? foodsText : exText;
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSON must be an array.");
      downloadText(which === "foods" ? "foods.export.json" : "exercises.export.json", JSON.stringify(parsed, null, 2));
      showToast(`Exported ${which} JSON.`);
    } catch (e: any) {
      showToast(e?.message ?? "Export failed.");
    }
  }

  function loadExample(which: "foods" | "exercises") {
    if (which === "foods") {
      const example = [
        {
          id: 1,
          name: "White rice (cooked)",
          brand: null,
          caloriesPer100g: 130,
          proteinPer100g: 2.7,
          carbPer100g: 28.2,
          fatPer100g: 0.3,
          servingSizeG: 150,
          servingLabel: "1 bowl (~150g)",
          imagePrimaryUri: "assets/foods/rice.png",
          isVerified: true,
        },
      ];
      setFoodsText(JSON.stringify(example, null, 2));
      showToast("Loaded foods example into editor.");
    } else {
      const example = [
        {
          id: 1,
          title: "Running",
          category: "Cardiovascular",
          caloriesPerMinute: 10,
          desc: "Outdoor/indoor running",
          isVerified: true,
          imagePrimaryUri: "/assets/exercises/running.png",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ];
      setExText(JSON.stringify(example, null, 2));
      showToast("Loaded exercises example into editor.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 14, background: "#fff" }}>
        <div style={{ fontWeight: 1000, fontSize: 18 }}>Admin (Demo)</div>
        <div style={{ marginTop: 6, color: "#555", lineHeight: 1.35 }}>
          {demoAdminEnabled
            ? "demo_admin=1 (tab Admin đang bật)."
            : 'Chưa bật demo_admin. Mở Console chạy: localStorage.setItem("demo_admin","1"); location.reload();'}
        </div>
      </div>

      <Card title="Create News (image + big title + small content)" right={<Btn onClick={onCreateNews}>Publish</Btn>}>
        <div style={{ display: "grid", gap: 10 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Big title"
            style={{ border: "1px solid #eee", borderRadius: 12, padding: "10px 12px", fontWeight: 900 }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Small content"
            rows={4}
            style={{ border: "1px solid #eee", borderRadius: 12, padding: "10px 12px", resize: "vertical" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const dataUrl = await readFileAsDataUrl(f);
                  setImageDataUrl(dataUrl);
                  showToast("Image attached.");
                } catch {
                  showToast("Read image failed.");
                }
              }}
            />
            {imageDataUrl ? (
              <Btn variant="ghost" onClick={() => setImageDataUrl(undefined)}>
                Remove image
              </Btn>
            ) : null}
          </div>

          {imageDataUrl ? (
            <div style={{ border: "1px solid #eee", borderRadius: 14, padding: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Preview</div>
              <img src={imageDataUrl} style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12 }} />
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: 12, fontWeight: 1000 }}>News list (demo)</div>
        {news.length === 0 ? (
          <div style={{ marginTop: 6, color: "#777" }}>No news yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {news.map((n) => (
              <div key={n.id} style={{ border: "1px solid #eee", borderRadius: 14, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 1000, fontSize: 16 }}>{n.title}</div>
                  <div style={{ marginLeft: "auto" }}>
                    <Btn variant="danger" onClick={() => onDeleteNews(n.id)}>
                      Delete
                    </Btn>
                  </div>
                </div>
                <div style={{ color: "#777", fontSize: 12, marginTop: 2 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
                {n.imageDataUrl ? (
                  <img
                    src={n.imageDataUrl}
                    style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 12, marginTop: 10 }}
                  />
                ) : null}
                <div style={{ marginTop: 10, color: "#333" }}>{n.content}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* hidden inputs for import */}
      <input
        ref={foodsImportRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await importDb("foods", f);
          e.currentTarget.value = "";
        }}
      />
      <input
        ref={exImportRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          await importDb("exercises", f);
          e.currentTarget.value = "";
        }}
      />

      <Card
        title="Foods database editor (demo)"
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => foodsImportRef.current?.click()}>
              Import JSON
            </Btn>
            <Btn variant="ghost" onClick={() => exportDb("foods")}>
              Export JSON
            </Btn>
            <Btn variant="ghost" onClick={() => loadExample("foods")}>
              Load example
            </Btn>
            <Btn onClick={() => saveDb("foods")}>Save</Btn>
          </div>
        }
      >
        <div style={{ color: "#555", marginBottom: 8 }}>
          Import file <b>foods.json</b> để load nhanh, hoặc dán JSON array. Save lưu vào localStorage (demo_foods_db_v1).
        </div>
        <textarea
          value={foodsText}
          onChange={(e) => setFoodsText(e.target.value)}
          rows={14}
          style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: 12, fontFamily: "monospace" }}
        />
      </Card>

      <Card
        title="Exercises database editor (demo)"
        right={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => exImportRef.current?.click()}>
              Import JSON
            </Btn>
            <Btn variant="ghost" onClick={() => exportDb("exercises")}>
              Export JSON
            </Btn>
            <Btn variant="ghost" onClick={() => loadExample("exercises")}>
              Load example
            </Btn>
            <Btn onClick={() => saveDb("exercises")}>Save</Btn>
          </div>
        }
      >
        <div style={{ color: "#555", marginBottom: 8 }}>
          Import file <b>exercises.json</b> để load nhanh, hoặc dán JSON array. Save lưu vào localStorage (demo_exercises_db_v1).
        </div>
        <textarea
          value={exText}
          onChange={(e) => setExText(e.target.value)}
          rows={14}
          style={{ width: "100%", border: "1px solid #eee", borderRadius: 12, padding: 12, fontFamily: "monospace" }}
        />
      </Card>

      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 18,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid #eee",
            background: "rgba(17,17,17,0.92)",
            color: "white",
            fontWeight: 900,
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
