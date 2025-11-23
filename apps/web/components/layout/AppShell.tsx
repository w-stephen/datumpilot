import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <TopNav />
        <main>{children}</main>
      </div>
    </div>
  );
}
