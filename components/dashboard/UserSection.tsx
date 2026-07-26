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
} from "recharts";
import { UserStats } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";

export default function UserSection({ stats }: { stats: UserStats }) {
  const [range, setRange] = useState<ResolvedRange | null>(null);

  const filtered = useMemo(() => {
    if (!range) return stats.dailySignups;
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
            Mock data — chưa nối nguồn thật
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="전체 회원" value={stats.totalMembers} sub={`활성 ${stats.activeMembers}명`} accent="brand" icon="👥" />
        <SummaryCard label="이번 달 신규 회원" value={`+${stats.newMembersThisMonth}`} sub="최근 30일 가입" accent="violet" icon="🌱" />
        <SummaryCard label="탈퇴" value={stats.churnedMembers} sub="누적" accent="rose" icon="👋" />
      </div>

      <SectionCard
        title="신규 회원 추이"
        subtitle={stats.isLive ? "일별 신규 가입자 수 (추이는 예시 데이터, 위 요약 수치만 실데이터)" : "일별 신규 가입자 수"}
        action={<DateRangeSelector onChange={setRange} />}
      >
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filtered} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="신규 회원" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </section>
  );
}
