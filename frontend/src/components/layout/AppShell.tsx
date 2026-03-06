import { Outlet } from "react-router";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

