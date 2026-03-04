// frontend/src/app/routes.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MainShellLayout } from "../layouts/MainShellLayout";
import RequireAuth from "./RequireAuth";

import AuthPage from "../pages/Auth/AuthPage";
import OnboardingPage from "../pages/Onboarding/OnboardingPage";

import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { MealPage } from "../pages/Meal/MealPage";
import { ActivityPage } from "../pages/Activity/ActivityPage";
import { RelaxationPage } from "../pages/Relaxation/RelaxationPage";
import { ReportPage } from "../pages/Report/ReportPage";
import { MyPlanPage } from "../pages/MyPlan/MyPlanPage";
import { ProfilePage } from "../pages/Profile/ProfilePage";

// ✅ ADD THIS
import { AdminPage }from "../pages/Admin/AdminPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* ✅ public */}
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />

      {/* ✅ protected */}
      <Route
        element={
          <RequireAuth>
            <MainShellLayout />
          </RequireAuth>
        }
      >
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/meal" element={<MealPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/relaxation" element={<RelaxationPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/my-plan" element={<MyPlanPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* ✅ ADD THIS */}
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
