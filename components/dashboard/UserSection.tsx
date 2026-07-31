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
} from "recharts";
import { UserStats } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";

/** Default to the last 7 days on first load (matches the "7일" button). */
function defaultRange(): ResolvedRange {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  return { preset: "7d", from, to };
}

export default function UserSection({ stats }: { stats: UserStats }) {
  const [range, setRange] = useState<ResolvedRange>(defaultRange());

  const filtered = useMemo(() => {
    return stats.dailySignups.filter((p) => p.date >= range.from && p.date <= range.to);
  }, [range, stats.dailySignups]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">사용자</h2>
        {stats.isLive ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">
            실데이터 · {new Date(stats.fetchedAt).toISOString().slice(0, 10)} 기준 (수동 갱신)
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
          sub="최근 30일 가입"
          accent="violet"
          icon="🌱"
          href="/dashboard/members?filter=new"
        />
        <SummaryCard
          label="탈퇴"
          value={stats.churnedMembers}
          sub="누적"
          accent="rose"
          icon="👋"
          href="/dashboard/members?filter=churned"
        />
      </div>

      <SectionCard
        title="신규 회원 추이"
        subtitle={
          stats.isLive
            ? `일별 신규 가입자 수 (K-UNIV 관리자 페이지 기준, ${new Date(stats.fetchedAt).toISOString().slice(0, 10)} 수동 갱신)`
            : "일별 신규 가입자 수"
        }
        action={<DateRangeSelector onChange={setRange} />}
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} />
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
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "#0a3696" }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </section>
  );
}
