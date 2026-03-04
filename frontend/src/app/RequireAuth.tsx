import React, { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken, clearToken } from "../utils/authStorage";
import { getJson } from "../services/http";

type RequireAuthProps = {
  children?: ReactNode;
};

export default function RequireAuth({ children }: RequireAuthProps) {
  const token = getToken();
  const loc = useLocation();
  const [checking, setChecking] = useState(true);
  const [needOnboarding, setNeedOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!token) {
        if (mounted) setChecking(false);
        return;
      }

      if (mounted) setChecking(true);

      try {
        await getJson("/auth/me");

        const p = await getJson("/profile/me");
        const profile = (p as any)?.profile ?? p;

        const ok =
          Number(profile?.weightKg) > 0 &&
          Number(profile?.heightCm) > 0 &&
          (profile?.sex === "M" || profile?.sex === "F") &&
          String(profile?.activityLevel ?? "").trim().length > 0;

        if (mounted) setNeedOnboarding(!ok);
      } catch {
        clearToken();
      } finally {
        if (mounted) setChecking(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
    // ✅ quan trọng: re-check khi đổi route
  }, [token, loc.pathname]);

  if (!token) return <Navigate to="/auth" replace state={{ from: loc }} />;

  if (checking) return <div style={{ padding: 16 }}>Loading…</div>;

  if (needOnboarding && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children ?? <Outlet />}</>;
}
