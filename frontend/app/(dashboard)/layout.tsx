"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "../../components/shared/protected-route";
import { Sidebar } from "../../components/shared/sidebar";
import { Header } from "../../components/shared/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

