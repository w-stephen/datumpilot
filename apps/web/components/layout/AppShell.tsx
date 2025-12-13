"use client";

import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F5F5] via-[#F3F3F3] to-[#EDEDED] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* Subtle accent gradient blobs for glassmorphism depth - light mode only */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden dark:hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-accent-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-primary-500/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area - offset by sidebar width */}
      <div className="pl-64 transition-all duration-300 relative z-10">
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
