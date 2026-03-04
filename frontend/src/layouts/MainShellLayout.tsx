import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopTabsNav } from "../components/navigation/TopTabNav";
import { RightSidebar } from "../components/sidebar/RightSidebar";

export function MainShellLayout() {
  const loc = useLocation();
  const isOnboarding = loc.pathname.startsWith("/onboarding");

  // ✅ Onboarding: full cửa sổ, không padding, không topbar, không sidebar
  if (isOnboarding) {
    return <Outlet />;
  }

  // ✅ Ẩn sidebar ở profile (như yêu cầu trước)
  const hideRight = loc.pathname.startsWith("/profile");

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <TopTabsNav />

      <div style={{ padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: hideRight ? "1fr" : "1.35fr 1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          <main style={{ minHeight: 300 }}>
            <Outlet />
          </main>

          {!hideRight ? (
            <aside>
              <RightSidebar />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
