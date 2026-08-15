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

// 2026년 7월 마케팅 캠페인 시작 시점 — "월별 신규 가입"에서 이 달 이후를
// 파스텔 블루로 하이라이트하고, 그 이전 누적치와 성장률을 비교하는 기준.
const GROWTH_HIGHLIGHT_FROM = "2026-07";

/**
 * 하이라이트 기준월(GROWTH_HIGHLIGHT_FROM) 이후 각 달의 증가폭을 계산.
 * - 기준월 첫 달(7월)은 "그 이전 전체 개월들의 합계"와 비교.
 * - 그 다음 달들(8월, 9월 …)은 바로 직전 달과 비교(전월 대비).
 * 실제 데이터(monthlyCounts)에서 바로 계산하므로 매번 최신 숫자를 그대로 반영함.
 */
function summarizeGrowth(monthlyCounts: { month: string; count: number }[]) {
  const previous = monthlyCounts.filter((m) => m.month < GROWTH_HIGHLIGHT_FROM);
  const recent = [...monthlyCounts]
    .filter((m) => m.month >= GROWTH_HIGHLIGHT_FROM)
    .sort((a, b) => a.month.localeCompare(b.month)); // 7월 → 8월 순으로

  const previousTotal = previous.reduce((sum, m) => sum + m.count, 0);
  const previousMonths = previous.length;

  const monthlyBreakdown = recent.map((m, idx) => {
    const isFirst = idx === 0;
    const baselineCount = isFirst ? previousTotal : recent[idx - 1].count;
    const baselineLabel = isFirst
      ? `이전 ${previousMonths}개월 합계(${previousTotal}명)`
      : `${formatMonthLabel(recent[idx - 1].month)}(${recent[idx - 1].count}명)`;
    return {
      month: m.month,
      count: m.count,
      baselineLabel,
      diff: m.count - baselineCount,
      multiple: baselineCount > 0 ? m.count / baselineCount : null,
    };
  });

  return { previousTotal, previousMonths, monthlyBreakdown };
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
  const growth = summarizeGrowth(monthlyCounts);

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
          {monthlyCounts.map(({ month, count }) => {
            const isHighlighted = month >= GROWTH_HIGHLIGHT_FROM;
            return (
              <Link
                key={month}
                href={`/dashboard/members?month=${month}`}
                className={
                  isHighlighted
                    ? "flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-700 transition hover:bg-sky-200"
                    : "flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
                }
              >
                <span>{formatMonthLabel(month)}</span>
                <span className="font-medium">{count}명</span>
              </Link>
            );
          })}
        </div>

        {growth.previousMonths > 0 && growth.monthlyBreakdown.length > 0 && (
          <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-slate-600">
            <p className="text-xs text-slate-500">
              7월은 이전 {growth.previousMonths}개월 합계와, 8월부터는 바로 전달과 비교
            </p>
            <div className="mt-2 space-y-1.5">
              {growth.monthlyBreakdown.map((m) => (
                <p key={m.month} className="font-medium text-sky-700">
                  📈 {formatMonthLabel(m.month)} 신규 가입 {m.count}명 — {m.baselineLabel} 대비{" "}
                  <span className={m.diff >= 0 ? "text-sky-700" : "text-rose-500"}>
                    {m.diff >= 0 ? "+" : ""}
                    {m.diff}명
                  </span>
                  {m.multiple !== null && (
                    <>
                      {" "}
                      (약{" "}
                      <span className={m.multiple >= 1 ? "text-sky-700" : "text-rose-500"}>
                        {m.multiple.toFixed(1)}배
                      </span>
                      )
                    </>
                  )}
                </p>
              ))}
            </div>
          </div>
        )}
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
