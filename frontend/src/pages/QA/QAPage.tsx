// frontend/src/pages/QA/QAPage.tsx
import React, { useMemo, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

function answer(q: string) {
  const t = q.toLowerCase();
  if (t.includes("bmr")) return "BMR là năng lượng tối thiểu cơ thể cần để duy trì hoạt động sống khi nghỉ ngơi.";
  if (t.includes("tdee")) return "TDEE ≈ BMR × hệ số hoạt động. Đây là tổng năng lượng tiêu hao mỗi ngày.";
  if (t.includes("giảm cân") || t.includes("weight loss")) return "Giảm cân: ăn deficit nhẹ (300–500 kcal/ngày), ưu tiên protein, ngủ đủ, tập đều.";
  if (t.includes("tăng cơ") || t.includes("muscle")) return "Tăng cơ: ăn surplus nhẹ, protein đủ, strength training 3–4 buổi/tuần.";
  return "Demo Q&A: Bạn hỏi về dinh dưỡng, tập luyện, ngủ nghỉ… mình sẽ trả lời theo kiến thức cơ bản.";
}

export function QAPage() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Chào bạn! Hỏi mình về BMR/TDEE/BMI, giảm cân, tăng cơ, ngủ nghỉ nhé." },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>Q&amp;A</h1>

      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 14, padding: 14, minHeight: 360 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {msgs.map((m, idx) => (
            <div
              key={idx}
              style={{
                justifySelf: m.role === "user" ? "end" : "start",
                maxWidth: "80%",
                padding: "10px 12px",
                borderRadius: 12,
                background: m.role === "user" ? "#e8f0ff" : "#f5f5f5",
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <input
            style={{ flex: 1, padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi…"
          />
          <button
            disabled={!canSend}
            onClick={() => {
              const q = input.trim();
              setInput("");
              setMsgs((cur) => [...cur, { role: "user", text: q }, { role: "bot", text: answer(q) }]);
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
