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
import { UserStats, MonthlyMemberCount, MemberListEntry } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";
import { percentChange, freshnessLevel } from "@/lib/aggregate";

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
 * 계정 owner 요청으로 베트남을 빨간색으로 지정. countryBreakdown 정렬 순서가
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
  realMembers,
}: {
  stats: UserStats;
  /** 최신 월이 먼저 오는 배열 (getMemberCountsByMonth 결과) — 전월 대비 추이 계산용. 없으면 추이 숨김. */
  monthlyCounts?: MonthlyMemberCount[];
  /**
   * 실제 회원 원본 목록(국가+가입일) — 2026-08-15 추가. 신규 회원 추이 라인
   * 차트와, 그 옆의 국적별 파이 차트가 둘 다 이 데이터에서 계산됨. 기존
   * stats.dailySignups는 최근 30일 고정 윈도우라서(last30DaysWindow()),
   * "1년" 같은 넓은 기간을 선택하면 실제로는 데이터가 없어 보이는 문제가
   * 있었음 — realMembers에서 직접 집계하면 이 제한이 사라짐.
   */
  realMembers: MemberListEntry[];
}) {
  const [range, setRange] = useState<ResolvedRange>(defaultRange());

  /** 선택한 기간에 가입한 실제 회원만 — 라인 차트와 파이 차트가 공유하는 필터링 결과. */
  const membersInRange = useMemo(() => {
    return realMembers.filter((m) => m.signupDate >= range.from && m.signupDate <= range.to);
  }, [range, realMembers]);

  const filtered = useMemo(() => {
    const countByDate = new Map<string, number>();
    for (const m of membersInRange) {
      countByDate.set(m.signupDate, (countByDate.get(m.signupDate) ?? 0) + 1);
    }
    return enumerateDates(range.from, range.to).map((date) => ({
      date,
      count: countByDate.get(date) ?? 0,
    }));
  }, [range, membersInRange]);

  // 넓은 기간(1년 등)에서는 날짜 수가 많아 라벨/눈금이 겹치므로 자동으로 정리.
  const showPointLabels = filtered.length <= 31;
  const xAxisInterval = filtered.length > 60 ? Math.ceil(filtered.length / 12) : 0;

  const countryBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of membersInRange) {
      counts.set(m.countryFlag, (counts.get(m.countryFlag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([countryFlag, count]) => ({ countryFlag, count }))
      .sort((a, b) => b.count - a.count);
  }, [membersInRange]);

  const thisMonth = monthlyCounts?.[0];
  const lastMonth = monthlyCounts?.[1];
  const monthTrend =
    thisMonth && lastMonth ? percentChange(thisMonth.count, lastMonth.count) : null;

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
        <SummaryCard
          label="전체 회원"
          value={stats.totalMembers}
          sub={`활성 ${stats.activeMembers}명`}
          accent="brand"
          icon="👥"
          href="/dashboard/members"
        />
        <SummaryCard
          label="이번 달 신규 회원"
          value={`+${stats.newMembersThisMonth}`}
          sub={
            monthTrend !== null
              ? `${currentMonthLabel(stats.fetchedAt)} 가입 · 전월 대비 ${monthTrend >= 0 ? "+" : ""}${monthTrend.toFixed(1)}%`
              : `${currentMonthLabel(stats.fetchedAt)} 가입`
          }
          accent="violet"
          icon="🌱"
          href="/dashboard/members?filter=new"
        />
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
            ? `선택 기간 총 ${membersInRange.length}명 가입 (K-UNIV 관리자 페이지 기준, ${new Date(stats.fetchedAt).toISOString().slice(0, 10)} 수동 갱신)`
            : `선택 기간 총 ${membersInRange.length}명 가입`
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
                <Line
                  type="monotone"
                  dataKey="count"
                  name="신규 회원"
                  stroke="#0a3696"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: "#0a3696" }}
                  activeDot={{ r: 5 }}
                >
                  {showPointLabels && (
                    <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#0a3696" }} />
                  )}
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col lg:col-span-1">
            <p className="mb-2 text-center text-xs font-medium text-slate-500">
              국적별 분포 · 선택 기간 신규 {membersInRange.length}명
            </p>
            {countryBreakdown.length === 0 ? (
              <div className="flex h-64 w-full items-center justify-center text-center text-sm text-slate-400">
                해당 기간에 가입한 회원이 없습니다.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryBreakdown}
                      dataKey="count"
                      nameKey="countryFlag"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {countryBreakdown.map((entry, i) => (
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
