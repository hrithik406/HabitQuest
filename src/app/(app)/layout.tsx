// src/app/(app)/layout.tsx
import React from "react";
import DashboardLayout from "@/components/DashboardLayout"; // ⬅️ Check this path!
import AchievementPopup from "@/components/AchievementPopUp";
import TopHeader from "@/components/TopHeader";
import LevelUpPopup from "@/components/LevelUpPopUp";
import AuthProvider from "@/components/AuthProvider";
import {AppProvider} from "@/context/AppContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <AppProvider>
        <LevelUpPopup />
        <AchievementPopup />
        <DashboardLayout>
          <TopHeader />
          {children}
        </DashboardLayout>
        </AppProvider>
      </AuthProvider>
    </>
  );
}