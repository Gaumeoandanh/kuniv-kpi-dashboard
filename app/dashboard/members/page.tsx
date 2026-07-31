import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SectionCard from "@/components/dashboard/SectionCard";
import { getRealMembers, getStaffMembers } from "@/lib/data/kuniv";

// PII EXCEPTION — see lib/data/memberListSnapshot.json for context. This
// page (and only this page) shows member account names, per an explicit
// request from the account owner (2026-07-29). It still sits behind the
// same password-protected /dashboard middleware as the rest of the app.
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [realMembers, staffMembers] = await Promise.all([getRealMembers(), getStaffMembers()]);
  const total = realMembers.length + staffMembers.length;

  const countryCounts = realMembers.reduce<Record<string, number>>((acc, m) => {
    acc[m.countryFlag] = (acc[m.countryFlag] ?? 0) + 1;
    return acc;
  }, {});
  const countryEntries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <DashboardShell>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
        >
          ← 대시보드로
        </Link>
        <h1 className="text-lg font-semibold text-slate-800">전체 회원 목록</h1>
      </div>

      <p className="text-xs text-slate-400">
        총 {total}개 계정 · 실제 회원(학생) {realMembers.length}명 · 학교 관계자 {staffMembers.length}명 —
        K-UNIV admin의 소속/직위 컬럼 기준으로 자동 분류 (값 없음 = 실제 회원)
      </p>

      <SectionCard title="국가별 분포" subtitle={`실제 회원 기준 · 총 ${realMembers.length}명`}>
        <div className="flex flex-wrap gap-2">
          {countryEntries.map(([flag, count]) => (
            <span
              key={flag}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600"
            >
              <span className="text-base">{flag}</span>
              <span className="font-medium">{count}</span>
            </span>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="실제 회원 (학생)" subtitle={`${realMembers.length}명 · 최신 가입순`}>
        <div className="divide-y divide-slate-100">
          {realMembers.map((m, i) => (
            <div key={`${m.name}-${i}`} className="flex items-center gap-3 py-2.5">
              <span className="w-8 shrink-0 text-right text-xs text-slate-400">{realMembers.length - i}</span>
              <span className="text-lg">{m.countryFlag}</span>
              <span className="flex-1 text-sm text-slate-700">{m.name}</span>
              {m.status === "탈퇴" && (
                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                  탈퇴
                </span>
              )}
              <span className="shrink-0 text-xs text-slate-400">{m.signupDate}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="학교 관계자 / 직원 계정" subtitle={`${staffMembers.length}명 · 소속/직위 기준 자동 분류`}>
        <div className="divide-y divide-slate-100">
          {staffMembers.map((m, i) => (
            <div key={`${m.name}-${i}`} className="flex items-center gap-3 py-2.5">
              <span className="w-8 shrink-0 text-right text-xs text-slate-400">{staffMembers.length - i}</span>
              <span className="text-lg">{m.countryFlag}</span>
              <span className="flex-1 text-sm text-slate-700">{m.name}</span>
              <span className="shrink-0 max-w-[45%] truncate text-right text-xs text-slate-400">
                {m.affiliation}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
