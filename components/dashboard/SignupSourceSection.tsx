"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { SignupSourceBreakdown } from "@/lib/types";
import SectionCard from "@/components/dashboard/SectionCard";

export default function SignupSourceSection({ data }: { data: SignupSourceBreakdown[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <SectionCard title="가입 유입경로" subtitle="채널별 신규 가입 수 (실데이터 기준, 목록은 고정되어 있지 않음)">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ left: 12, right: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <YAxis type="category" dataKey="source" width={90} tick={{ fontSize: 12, fill: "#475569" }} />
            <Tooltip />
            <Bar dataKey="count" fill="#2dd4bf" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
