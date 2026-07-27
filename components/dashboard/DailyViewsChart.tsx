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
import { DailyViewPoint } from "@/lib/types";
import SectionCard from "@/components/dashboard/SectionCard";
import DateRangeSelector, { ResolvedRange } from "@/components/dashboard/DateRangeSelector";

/**
 * Every calendar date between from/to (inclusive), as YYYY-MM-DD strings.
  * Used so the 7-day / 30-day filters always show the full requested span
   * on the X axis, instead of silently shrinking to whichever days happen
    * to have a published post.
     */
function enumerateDates(from: string, to: string): string[] {
    const dates: string[] = [];
    const cursor = new Date(from + "T00:00:00Z");
    const end = new Date(to + "T00:00:00Z");
    while (cursor <= end) {
          dates.push(cursor.toISOString().slice(0, 10));
          cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
}
export default function DailyViewsChart({ data }: { data: DailyViewPoint[] }) {
  const [range, setRange] = useState<ResolvedRange | null>(null);

  const filtered = useMemo(() => {
        if (!range) return data;
        const viewsByDate = new Map(data.map((p) => [p.date, p.views]));
        return enumerateDates(range.from, range.to).map((date) => ({
                date,
                views: viewsByDate.get(date) ?? 0,
        }));
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
                          <Line
                                            type="monotone"
                                            dataKey="views"
                                            name="조회수"
                                            stroke="#7c3aed"
                                            strokeWidth={2}
                                            dot={{ r: 3, strokeWidth: 0, fill: "#7c3aed" }}
                                            activeDot={{ r: 5 }}
                                          >
                                          <LabelList dataKey="views" position="top" style={{ fontSize: 10, fill: "#7c3aed" }} /></Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
