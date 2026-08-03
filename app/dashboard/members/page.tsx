import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import SectionCard from "@/components/dashboard/SectionCard";
import {
  getRealMembers,
  getStaffMembers,
  getNewMembersThisMonth,
  getChurnedMembers,
  getMemberCountsByMonth,
  getMembersByMonth,
} from "@/lib/data/kuniv";
import { MemberListEntry } from "@/lib/types";

/** "2026-08" → "2026년 8월" */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

// PII EXCEPTION — see lib/data/memberListSnapshot.json for context. This
// page (and only this page) shows member account names, per an explicit
// request from the account owner (2026-07-29). It still sits behind the
// same password-protected /dashboard middleware as the rest of the app.
export const dynamic = "force-dynamic";

const BackLink = () => (
  <Link
    href="/dashboard"
    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
  >
    ← 대시보드로
  </Link>
);

/** 이름 · 국가 · 가입일(+상태뱃지) 한 줄짜리 리스트 — 필터 뷰에서 재사용. */
function MemberRow({ m, index, total }: { m: MemberListEntry; index: number; total: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-8 shrink-0 text-right text-xs text-slate-400">{total - index}</span>
      <span className="text-lg">{m.countryFlag}</span>
      <span className="flex-1 text-sm text-slate-700">{m.name}</span>
      {m.status === "탈퇴" && (
        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500">
          탈퇴
        </span>
      )}
      <span className="shrink-0 text-xs text-slate-400">{m.signupDate}</span>
    </div>
  );
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { filter?: string; month?: string };
}) {
  const filter = searchParams?.filter;
  const month = searchParams?.month;

  // 필터 뷰 — "이번 달 신규 회원" 또는 "탈퇴" 카드에서 넘어온 경우.
  if (filter === "new" || filter === "churned") {
    const members = filter === "new" ? await getNewMembersThisMonth() : await getChurnedMembers();
    const title = filter === "new" ? "이번 달 신규 회원" : "탈퇴 회원";
    const subtitle = filter === "new" ? "이번 달(달력 기준) 가입 · 실제 회원 기준" : "누적 · 실제 회원 기준";

    return (
      <DashboardShell>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/members"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
          >
            ← 전체 회원 목록
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        </div>

        <SectionCard title={title} subtitle={`${members.length}명 · ${subtitle}`}>
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">해당하는 회원이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m, i) => (
                <MemberRow key={`${m.name}-${i}`} m={m} index={i} total={members.length} />
              ))}
            </div>
          )}
        </SectionCard>
      </DashboardShell>
    );
  }

  // 필터 뷰 — "월별 신규 가입" 섹션에서 특정 월을 클릭한 경우.
  if (month) {
    const members = await getMembersByMonth(month);
    const title = `${formatMonthLabel(month)} 신규 가입`;

    return (
      <DashboardShell>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/members"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
          >
            ← 전체 회원 목록
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        </div>

        <SectionCard title={title} subtitle={`${members.length}명 · 실제 회원 기준`}>
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">해당하는 회원이 없습니다.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {members.map((m, i) => (
                <MemberRow key={`${m.name}-${i}`} m={m} index={i} total={members.length} />
              ))}
            </div>
          )}
        </SectionCard>
      </DashboardShell>
    );
  }

  // 기본 뷰 — 전체 회원 목록 (실제 회원 + 학교 관계자 분리).
  const [realMembers, staffMembers, monthlyCounts] = await Promise.all([
    getRealMembers(),
    getStaffMembers(),
    getMemberCountsByMonth(),
  ]);
  const total = realMembers.length + staffMembers.length;

  const countryCounts = realMembers.reduce<Record<string, number>>((acc, m) => {
    acc[m.countryFlag] = (acc[m.countryFlag] ?? 0) + 1;
    return acc;
  }, {});
  const countryEntries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <DashboardShell>
      <div className="flex items-center gap-3">
        <BackLink />
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

      <SectionCard title="월별 신규 가입" subtitle="실제 회원 기준 · 월 클릭 시 해당 월 명단 보기">
        <div className="flex flex-wrap gap-2">
          {monthlyCounts.map(({ month, count }) => (
            <Link
              key={month}
              href={`/dashboard/members?month=${month}`}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
            >
              <span>{formatMonthLabel(month)}</span>
              <span className="font-medium">{count}명</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="실제 회원 (학생)" subtitle={`${realMembers.length}명 · 최신 가입순`}>
        <div className="divide-y divide-slate-100">
          {realMembers.map((m, i) => (
            <MemberRow key={`${m.name}-${i}`} m={m} index={i} total={realMembers.length} />
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
