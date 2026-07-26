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
import { DailyViewPoint } from "@/lib/types";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";

export default function DailyViewsChart({ data }: { data: DailyViewPoint[] }) {
  const [range, setRange] = useState<ResolvedRange | null>(null);

  const filtered = useMemo(() => {
    if (!range) return data;
    return data.filter((p) => p.date >= range.from && p.date <= range.to);
  }, [range, data]);

  return (
    <SectionCard title="일별 조회수" subtitle="발행 콘텐츠의 날짜별 조회수 합계" action={<DateRangeSelector onChange={setRange} />}>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="views" name="조회수" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
