import CatIcon from "@/components/CatIcon";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/80 p-8 shadow-lg shadow-slate-200/60 backdrop-blur">
        <div className="mb-6 flex flex-col items-center gap-3">
          <CatIcon className="h-20 w-20" />
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">
            K-UNIV <span className="text-brand-600">KPI</span>
          </h1>
          <p className="text-center text-sm text-slate-400">
                        내부 대시보드 — K-UNIV 팀 전용
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
