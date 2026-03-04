import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../../utils/authStorage";
import { postJson } from "../../services/http";

type LoginResponse = {
  user?: any;
  session?: { token: string };
  token?: string; // fallback nếu backend trả token thẳng
};

export default function LoginPage() {
  const nav = useNavigate();

  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("demo@lockin.local");
  const [password, setPassword] = useState("demo123");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    if (tab !== "signin") return false;
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading, tab]);

  async function onSignIn(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");

    const em = email.trim().toLowerCase();
    if (!em.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.trim().length < 1) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = (await postJson("/auth/login", {
        email: em,
        password,
        remember,
      })) as LoginResponse;

      const token = res?.session?.token ?? res?.token;
      if (!token) {
        throw new Error("Login response missing token");
      }

      setToken(token, remember);
      nav("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  function onContinueGoogle() {
    // Tạm thời chưa hỗ trợ OAuth
    setError("Google sign-in is not available in this demo yet.");
  }

  function onForgot() {
    setError("Forgot password is not available in this demo yet.");
  }

  return (
    <div style={styles.page}>
      <div style={styles.brand}>LockIn</div>

      <div style={styles.tabsWrap}>
        <button
          type="button"
          onClick={() => setTab("signin")}
          style={{
            ...styles.tabBtn,
            ...(tab === "signin" ? styles.tabActive : styles.tabInactive),
          }}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => setTab("signup")}
          style={{
            ...styles.tabBtn,
            ...(tab === "signup" ? styles.tabActive : styles.tabInactive),
          }}
          title="Sign Up is disabled for now"
        >
          Sign Up
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          {tab === "signin" ? "Sign in to continue" : "Sign up (disabled)"}
        </div>

        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {tab === "signin" ? (
          <form onSubmit={onSignIn}>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                placeholder="Enter your username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
              <div style={styles.hint}>* Use email (e.g. demo@lockin.local)</div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>

            <div style={styles.rowBetween}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span style={{ marginLeft: 8 }}>Remember me</span>
              </label>

              <button type="button" onClick={onForgot} style={styles.linkBtn}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                ...styles.primaryBtn,
                ...(canSubmit ? {} : styles.primaryBtnDisabled),
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div style={styles.orRow}>
              <div style={styles.orLine} />
              <div style={styles.orText}>OR</div>
              <div style={styles.orLine} />
            </div>

            <button type="button" onClick={onContinueGoogle} style={styles.googleBtn}>
              <span style={styles.googleIcon}>G</span>
              <span style={{ fontWeight: 700 }}>CONTINUE WITH GOOGLE</span>
            </button>
          </form>
        ) : (
          <div>
            <div style={{ color: "#666", marginBottom: 10 }}>
              Sign Up is temporarily disabled.
            </div>

            <div style={{ fontSize: 14, color: "#666" }}>
              (You said we should skip creating new user for now because it involves personal body
              data.)
            </div>

            <button
              type="button"
              onClick={() => setTab("signin")}
              style={{ ...styles.primaryBtn, marginTop: 16 }}
            >
              Back to Sign In
            </button>
          </div>
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
    padding: 24,
    background: "#eef6fb",
    position: "relative",
    overflow: "hidden",
  },
  brand: {
    position: "absolute",
    top: 46,
    fontSize: 64,
    fontWeight: 800,
    letterSpacing: 1,
    background: "linear-gradient(90deg, #a855f7, #22c55e, #3b82f6)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    userSelect: "none",
  },
  tabsWrap: {
    width: 520,
    maxWidth: "92vw",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    background: "#e5e5e5",
    borderRadius: 999,
    padding: 6,
    marginTop: 120,
    marginBottom: 16,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
  },
  tabBtn: {
    border: "none",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 18,
    background: "transparent",
  },
  tabActive: {
    background: "#fff",
    color: "#0b3aa6",
    boxShadow: "0 1px 10px rgba(0,0,0,0.06)",
  },
  tabInactive: {
    background: "transparent",
    color: "#222",
    opacity: 0.85,
  },
  card: {
    width: 520,
    maxWidth: "92vw",
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 18,
  },
  errorBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    padding: "10px 12px",
    borderRadius: 10,
    marginBottom: 14,
    fontWeight: 600,
  },
  field: { marginBottom: 14 },
  label: {
    display: "block",
    fontWeight: 700,
    marginBottom: 8,
    color: "#111",
  },
  input: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
    background: "#f7f7f7",
  },
  hint: { fontSize: 12, marginTop: 6, color: "#777" },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  checkboxRow: { display: "flex", alignItems: "center", fontSize: 14, color: "#333" },
  linkBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: 14,
    textDecoration: "underline",
  },
  primaryBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "#1d77e8",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  orRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 12,
    alignItems: "center",
    margin: "16px 0",
  },
  orLine: { height: 1, background: "rgba(0,0,0,0.12)" },
  orText: { fontWeight: 800, color: "#666" },
  googleBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(0,0,0,0.18)",
    fontWeight: 900,
    fontFamily: "Arial, sans-serif",
  },
};
