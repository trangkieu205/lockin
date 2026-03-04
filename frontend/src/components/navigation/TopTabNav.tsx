import React from "react";
import { NavLink } from "react-router-dom";

function Tab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        color: "#111",
        padding: "8px 12px",
        borderRadius: 12,
        fontWeight: 900,
        background: isActive ? "#eef2ff" : "transparent",
        border: "1px solid #eee",
      })}
    >
      {label}
    </NavLink>
  );
}

export function TopTabsNav() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderBottom: "1px solid #eee",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ fontWeight: 1000, fontSize: 20, marginRight: 8 }}>LockIn</div>

      <Tab to="/dashboard" label="Home" />
      <Tab to="/meal" label="Meal" />
      <Tab to="/activity" label="Activity" />
      <Tab to="/relaxation" label="Relaxation" />
      <Tab to="/report" label="Report" />
      <Tab to="/my-plan" label="My Plan" />
        <Tab to="/admin" label="Admin" />
        
      <div style={{ marginLeft: "auto", fontWeight: 900, color: "#333" }}>Q&amp;A</div>
    </div>
  );
}
