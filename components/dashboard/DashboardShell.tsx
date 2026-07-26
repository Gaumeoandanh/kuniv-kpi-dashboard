"use client";

import { useRouter } from "next/navigation";
import CatIcon from "@/components/CatIcon";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <CatIcon className="h-8 w-8" />
            <span className="font-semibold text-slate-800">
              K-UNIV <span className="text-brand-600">KPI</span>
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
            type="button"
          >
            로그아웃
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
