import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJson } from "../../services/http";
import { setToken } from "../../utils/authStorage";

type Tab = "signin" | "signup";

function extractToken(out: any) {
  return (
    out?.token ??
    out?.session?.token ??
    out?.data?.token ??
    out?.data?.session?.token ??
    out?.data?.sessionToken ??
    out?.data?.accessToken
  );
}

function extractUser(out: any) {
  return out?.user ?? out?.data?.user ?? out?.data?.profile;
}

function syncDemoAdmin(user: any) {
  try {
    if (user?.role === "admin") localStorage.setItem("demo_admin", "1");
    else localStorage.removeItem("demo_admin");
  } catch {}
}

export default function AuthPage() {
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("signup");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Sign up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign in
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const canSignup = useMemo(() => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      email.trim() &&
      password.trim().length >= 6 &&
      Number(age) > 0
    );
  }, [firstName, lastName, email, password, age]);

  const canSignin = useMemo(() => {
    return loginEmail.trim() && loginPassword.trim();
  }, [loginEmail, loginPassword]);

  async function onSignUp() {
    setErr("");
    if (!canSignup) return;

    try {
      setLoading(true);

      const name = `${firstName} ${lastName}`.trim();

      // backend: POST /auth/register { email, password, name, age }
      await postJson("/auth/register", {
        email,
        password,
        name,
        age: Number(age),
      });

      // register không trả token -> login luôn
      const out = await postJson("/auth/login", {
        email,
        password,
        remember: true,
      });

      const token = extractToken(out);
      if (!token) throw new Error("Không nhận được token từ /auth/login");

      setToken(token as string, true);

      // ✅ bật tab Admin nếu user là admin
      const user = extractUser(out);
      syncDemoAdmin(user);

      nav("/onboarding", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Sign up thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function onSignIn() {
    setErr("");
    if (!canSignin) return;

    try {
      setLoading(true);

      const out = await postJson("/auth/login", {
        email: loginEmail,
        password: loginPassword,
        remember: true,
      });

      const token = extractToken(out);
      if (!token) throw new Error("Không nhận được token từ /auth/login");

      setToken(token as string, true);

      // ✅ bật tab Admin nếu user là admin
      const user = extractUser(out);
      syncDemoAdmin(user);

      nav("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.message ?? "Sign in thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.brand}>LockIn</div>

      <div style={styles.tabs}>
        <button
          onClick={() => setTab("signin")}
          style={{ ...styles.tabBtn, ...(tab === "signin" ? styles.tabActive : {}) }}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab("signup")}
          style={{ ...styles.tabBtn, ...(tab === "signup" ? styles.tabActive : {}) }}
        >
          Sign Up
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          {tab === "signup" ? "Join fitness community!" : "Welcome back!"}
        </div>

        {tab === "signup" ? (
          <>
            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>First Name</label>
                <input style={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Name</label>
                <input style={styles.input} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (>= 6 chars)"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Age</label>
              <input
                style={styles.input}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                inputMode="numeric"
              />
            </div>

            {err ? <div style={styles.error}>{err}</div> : null}

            <button
              style={{ ...styles.primaryBtn, opacity: loading || !canSignup ? 0.6 : 1 }}
              disabled={loading || !canSignup}
              onClick={onSignUp}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            <div style={styles.or}>OR</div>
            <button style={styles.googleBtn} disabled>
              CONTINUE WITH GOOGLE
            </button>
          </>
        ) : (
          <>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={styles.input} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            {err ? <div style={styles.error}>{err}</div> : null}

            <button
              style={{ ...styles.primaryBtn, opacity: loading || !canSignin ? 0.6 : 1 }}
              disabled={loading || !canSignin}
              onClick={onSignIn}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#eef3f7",
    padding: 24,
    gap: 14,
  },
  brand: {
    fontSize: 64,
    fontWeight: 900,
    letterSpacing: 1,
    background: "linear-gradient(90deg, #7c3aed, #22c55e, #06b6d4)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    marginBottom: 6,
  },
  tabs: {
    width: 720,
    maxWidth: "92vw",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#e6e6e6",
    borderRadius: 999,
    padding: 4,
  },
  tabBtn: {
    border: "none",
    padding: "12px 12px",
    borderRadius: 999,
    background: "transparent",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 18,
  },
  tabActive: {
    background: "#fff",
    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
  },
  card: {
    width: 720,
    maxWidth: "92vw",
    background: "#fff",
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: 900,
    marginBottom: 14,
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "grid", gap: 6, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: 900, color: "#333" },
  input: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 12px",
    outline: "none",
    background: "#f7f7f7",
  },
  primaryBtn: {
    width: "100%",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    background: "#1e88e5",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 6,
    fontSize: 16,
  },
  or: { textAlign: "center", margin: "14px 0 10px", color: "#666", fontWeight: 900 },
  googleBtn: {
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontWeight: 900,
    cursor: "not-allowed",
    color: "#333",
  },
  error: { color: "#d32f2f", fontWeight: 900, marginBottom: 8, fontSize: 13 },
};
