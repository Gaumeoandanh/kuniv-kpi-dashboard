"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import { UserStats, MonthlyMemberCount, MemberListEntry } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";
import { percentChange, freshnessLevel, countryBreakdown } from "@/lib/aggregate";

/** Default to the last 7 days on first load (matches the "7일" button). */
function defaultRange(): ResolvedRange {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  return { preset: "7d", from, to };
}

/**
 * from~to 사이 모든 날짜(YYYY-MM-DD), 빠짐없이 — DailyViewsChart의
 * enumerateDates()와 동일한 목적: 가입자가 없는 날도 0으로 채워서
 * "1년" 같은 넓은 기간을 선택해도 X축이 끊기지 않게 함.
 */
function enumerateDates(from: string, to: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

const PIE_COLORS = ["#0a3696", "#2dd4bf", "#7c3aed", "#f59e0b", "#64748b", "#22c55e", "#eab308"];

/**
 * 특정 국가는 순위/색 순환과 무관하게 항상 같은 색으로 고정 — 2026-08-15,
 * 계정 owner 요청으로 베트남을 빨간색으로 지정. countryStats 정렬 순서가
 * 바뀌어도(다른 국가가 1위가 되어도) 베트남 색은 항상 유지됨.
 */
const COUNTRY_COLOR_OVERRIDES: Record<string, string> = {
  "🇻🇳": "#dc2626", // 베트남 — 빨간색 고정
};

function colorForCountry(countryFlag: string, fallbackIndex: number): string {
  return COUNTRY_COLOR_OVERRIDES[countryFlag] ?? PIE_COLORS[fallbackIndex % PIE_COLORS.length];
}

/** "8월" 처럼 fetchedAt 기준 달력 월을 한국어로 표시 (이번 달 신규 회원 카드용). */
function currentMonthLabel(fetchedAt: string): string {
  const month = Number(fetchedAt.slice(5, 7));
  return `${month}월`;
}

/** 배지 색상 — 데이터가 오래될수록 눈에 띄게 (2026-08-15, 종합 현황 개발 시 추가). */
const FRESHNESS_BADGE: Record<
  ReturnType<typeof freshnessLevel>,
  { className: string; label: string }
> = {
  fresh: { className: "bg-brand-50 text-brand-600", label: "실데이터" },
  warn: { className: "bg-amber-50 text-amber-600", label: "실데이터 — 곧 재크롤링 필요" },
  stale: { className: "bg-rose-50 text-rose-600", label: "실데이터 — 갱신 필요 ⚠️" },
};

export default function UserSection({
  stats,
  monthlyCounts,
  monthlyStaffCounts,
  realMembers,
  staffMembers,
}: {
  stats: UserStats;
  /** 최신 월이 먼저 오는 배열 (getMemberCountsByMonth 결과, 학생회원만) — 전월 대비 추이 계산용. 없으면 추이 숨김. */
  monthlyCounts?: MonthlyMemberCount[];
  /**
   * 최신 월이 먼저 오는 배열 (getStaffCountsByMonth 결과, 대학 회원만) — 2026-08-22 추가.
   * "전체 회원"/"이번 달 신규 회원" 카드를 학생회원/대학 회원으로 나눠 보여줄 때
   * "이번 달 신규 회원"의 전월 대비 증감률을 (학생+대학) 합산 기준으로 계산하기 위함.
   */
  monthlyStaffCounts?: MonthlyMemberCount[];
  /**
   * 실제 회원(학생) 원본 목록(국가+가입일) — 2026-08-15 추가. 신규 회원 추이 라인
   * 차트와, 그 옆의 국적별 파이 차트가 둘 다 이 데이터에서 계산됨. 기존
   * stats.dailySignups는 최근 30일 고정 윈도우라서(last30DaysWindow()),
   * "1년" 같은 넓은 기간을 선택하면 실제로는 데이터가 없어 보이는 문제가
   * 있었음 — realMembers에서 직접 집계하면 이 제한이 사라짐.
   */
  realMembers: MemberListEntry[];
  /**
   * 학교 관계자(대학 회원) 원본 목록 — 2026-08-22 추가. "신규 회원 추이"
   * 차트에 학생회원 라인과 나란히 대학 회원 라인을 보여주기 위함
   * (국적별 파이 차트는 기존대로 학생회원만 대상으로 유지).
   */
  staffMembers: MemberListEntry[];
}) {
  const [range, setRange] = useState<ResolvedRange>(defaultRange());

  /** 선택한 기간에 가입한 실제 회원(학생)만 — 라인 차트와 파이 차트가 공유하는 필터링 결과. */
  const membersInRange = useMemo(() => {
    return realMembers.filter((m) => m.signupDate >= range.from && m.signupDate <= range.to);
  }, [range, realMembers]);

  /** 선택한 기간에 가입한 대학 회원(학교 관계자)만 — 추이 차트의 두 번째 라인용. */
  const staffInRange = useMemo(() => {
    return staffMembers.filter((m) => m.signupDate >= range.from && m.signupDate <= range.to);
  }, [range, staffMembers]);

  const filtered = useMemo(() => {
    const studentCountByDate = new Map<string, number>();
    for (const m of membersInRange) {
      studentCountByDate.set(m.signupDate, (studentCountByDate.get(m.signupDate) ?? 0) + 1);
    }
    const staffCountByDate = new Map<string, number>();
    for (const m of staffInRange) {
      staffCountByDate.set(m.signupDate, (staffCountByDate.get(m.signupDate) ?? 0) + 1);
    }
    return enumerateDates(range.from, range.to).map((date) => ({
      date,
      count: studentCountByDate.get(date) ?? 0,
      staffCount: staffCountByDate.get(date) ?? 0,
    }));
  }, [range, membersInRange, staffInRange]);

  // 넓은 기간(1년 등)에서는 날짜 수가 많아 라벨/눈금이 겹치므로 자동으로 정리.
  const showPointLabels = filtered.length <= 31;
  const xAxisInterval = filtered.length > 60 ? Math.ceil(filtered.length / 12) : 0;

  const countryStats = useMemo(() => countryBreakdown(membersInRange), [membersInRange]);

  const lastMonth = monthlyCounts?.[1];

  // 2026-08-22 추가 — "전체 회원"/"이번 달 신규 회원" 카드를 학생회원/대학 회원으로
  // 나눠 보여주기 위한 대학 회원(학교 관계자) 집계. stats.totalMembers /
  // stats.newMembersThisMonth는 실제 회원(학생)만 집계된 값이므로, 대학 회원 수를
  // 별도로 더해서 "전체" 숫자를 만든다.
  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter((m) => m.status === "정상").length;

  const currentMonthKey = stats.fetchedAt.slice(0, 7); // "YYYY-MM"
  const newStaffThisMonth = staffMembers.filter((m) => m.signupDate.startsWith(currentMonthKey)).length;
  const lastMonthStaff = monthlyStaffCounts?.[1];

  const totalMembersAll = stats.totalMembers + totalStaff;
  const totalNewThisMonth = stats.newMembersThisMonth + newStaffThisMonth;
  const totalNewLastMonth = (lastMonth?.count ?? 0) + (lastMonthStaff?.count ?? 0);
  const totalMonthTrend = totalNewLastMonth > 0 ? percentChange(totalNewThisMonth, totalNewLastMonth) : null;

  const churnRate = stats.totalMembers > 0 ? (stats.churnedMembers / stats.totalMembers) * 100 : null;

  const badge = FRESHNESS_BADGE[freshnessLevel(stats.fetchedAt)];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">사용자</h2>
        {stats.isLive ? (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.className}`}>
            {badge.label} · {new Date(stats.fetchedAt).toISOString().slice(0, 10)} 기준 (수동 갱신)
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
            목업 데이터 — 실제 데이터 미연동
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* 전체 회원 — 2026-08-22부터 학생회원/대학 회원 합산 총계 + 세부 분류
            표시 (계정 owner 요청). 클릭 시 기존과 동일하게 전체 회원 목록으로 이동. */}
        <Link
          href="/dashboard/members"
          className="block rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm shadow-slate-100 transition hover:border-brand-200 hover:shadow-md sm:rounded-2xl sm:p-5"
        >
          <div className="mb-1.5 flex items-center justify-between sm:mb-3">
            <span className="text-[11px] font-medium text-slate-500 sm:text-sm">전체 회원</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-xs text-brand-600 sm:h-8 sm:w-8 sm:rounded-lg sm:text-base">
              👥
            </span>
          </div>
          <div className="text-lg font-semibold text-slate-800 sm:text-2xl">{totalMembersAll}</div>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 sm:mt-3 sm:pt-3">
            <div>
              <div className="text-[10px] text-slate-500 sm:text-xs">학생회원</div>
              <div className="text-sm font-semibold text-slate-700 sm:text-base">{stats.totalMembers}</div>
              <div className="text-[10px] text-slate-400">활성 {stats.activeMembers}명</div>
            </div>
            <div className="border-l border-slate-100 pl-2 sm:pl-3">
              <div className="text-[10px] text-slate-500 sm:text-xs">대학 회원</div>
              <div className="text-sm font-semibold text-slate-700 sm:text-base">{totalStaff}</div>
              <div className="text-[10px] text-slate-400">활성 {activeStaff}명</div>
            </div>
          </div>
        </Link>

        {/* 이번 달 신규 회원 — 위와 동일하게 학생회원/대학 회원 합산 총계 + 세부
            분류. 전월 대비 증감률도 (학생+대학) 합산 기준으로 계산. */}
        <Link
          href="/dashboard/members?filter=new"
          className="block rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm shadow-slate-100 transition hover:border-brand-200 hover:shadow-md sm:rounded-2xl sm:p-5"
        >
          <div className="mb-1.5 flex items-center justify-between sm:mb-3">
            <span className="text-[11px] font-medium text-slate-500 sm:text-sm">이번 달 신규 회원</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-xs text-violet-600 sm:h-8 sm:w-8 sm:rounded-lg sm:text-base">
              🌱
            </span>
          </div>
          <div className="text-lg font-semibold text-slate-800 sm:text-2xl">+{totalNewThisMonth}</div>
          <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
            {totalMonthTrend !== null
              ? `${currentMonthLabel(stats.fetchedAt)} 가입 · 전월 대비 ${totalMonthTrend >= 0 ? "+" : ""}${totalMonthTrend.toFixed(1)}%`
              : `${currentMonthLabel(stats.fetchedAt)} 가입`}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 sm:mt-3 sm:pt-3">
            <div>
              <div className="text-[10px] text-slate-500 sm:text-xs">학생회원</div>
              <div className="text-sm font-semibold text-slate-700 sm:text-base">+{stats.newMembersThisMonth}</div>
            </div>
            <div className="border-l border-slate-100 pl-2 sm:pl-3">
              <div className="text-[10px] text-slate-500 sm:text-xs">대학 회원</div>
              <div className="text-sm font-semibold text-slate-700 sm:text-base">+{newStaffThisMonth}</div>
            </div>
          </div>
        </Link>

        <SummaryCard
          label="탈퇴"
          value={stats.churnedMembers}
          sub={churnRate !== null ? `누적 · 전체 대비 ${churnRate.toFixed(1)}%` : "누적"}
          accent="rose"
          icon="👋"
          href="/dashboard/members?filter=churned"
        />
      </div>

      <SectionCard
        title="신규 회원 추이"
        subtitle={
          stats.isLive
            ? `선택 기간 학생 ${membersInRange.length}명 · 대학 회원 ${staffInRange.length}명 가입 (K-UNIV 관리자 페이지 기준, ${new Date(stats.fetchedAt).toISOString().slice(0, 10)} 수동 갱신)`
            : `선택 기간 학생 ${membersInRange.length}명 · 대학 회원 ${staffInRange.length}명 가입`
        }
        action={<DateRangeSelector onChange={setRange} />}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 w-full lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(d) => d.slice(5)}
                  interval={xAxisInterval}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="학생회원"
                  stroke="#0a3696"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#0a3696" }}
                  activeDot={{ r: 5 }}
                >
                  {showPointLabels && (
                    <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#0a3696" }} />
                  )}
                </Line>
                <Line
                  type="monotone"
                  dataKey="staffCount"
                  name="대학 회원"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#f59e0b" }}
                  activeDot={{ r: 5 }}
                >
                  {showPointLabels && (
                    <LabelList dataKey="staffCount" position="bottom" style={{ fontSize: 10, fill: "#f59e0b" }} />
                  )}
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col lg:col-span-1">
            <p className="mb-2 text-center text-xs font-medium text-slate-500">
              국적별 분포 · 선택 기간 신규 {membersInRange.length}명
            </p>
            {countryStats.length === 0 ? (
              <div className="flex h-64 w-full items-center justify-center text-center text-sm text-slate-400">
                해당 기간에 가입한 회원이 없습니다.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryStats}
                      dataKey="count"
                      nameKey="countryFlag"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {countryStats.map((entry, i) => (
                        <Cell key={entry.countryFlag} fill={colorForCountry(entry.countryFlag, i)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item) => {
                        const pct = ((value / membersInRange.length) * 100).toFixed(1);
                        return [`${value}명 (${pct}%)`, item?.payload?.countryFlag ?? ""];
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
