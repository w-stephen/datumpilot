"use client";

import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F3F3F3] dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area - offset by sidebar width */}
      <div className="pl-64 transition-all duration-300">
        {/* Top navigation */}
        <TopNav />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Grid pattern overlay for subtle visual texture - dark mode only */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-0 dark:opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
