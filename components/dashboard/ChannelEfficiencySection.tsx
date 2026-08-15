import { ChannelEfficiency } from "@/lib/types";
import { CHANNEL_LABEL } from "@/lib/aggregate";
import SectionCard from "@/components/dashboard/SectionCard";

function fmt(n: number | null): string {
  return n === null ? "—" : Math.round(n).toLocaleString();
}

/**
 * "채널별 효율" — 채널별 성과(총합) 테이블과 달리 게시물 1개당 평균 기준.
 * 게시물을 많이 올린 채널이 항상 "1등"으로 보이는 착시를 막기 위해 추가
 * (KPI_DASHBOARD_AUDIT_2026-08-12.md 4장 항목 6). 기존 채널별 성과 테이블을
 * 대체하지 않고 나란히 둠 — 총량과 효율은 서로 다른 질문에 답하기 때문.
 */
export default function ChannelEfficiencySection({ data }: { data: ChannelEfficiency[] }) {
  return (
    <SectionCard title="채널별 효율" subtitle="게시물 1개당 평균 성과 · 조회수 평균 높은 순">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="py-2 pr-3 font-medium">채널</th>
              <th className="py-2 pr-3 font-medium">게시물 수</th>
              <th className="py-2 pr-3 font-medium">평균 조회수</th>
              <th className="py-2 pr-3 font-medium">평균 좋아요</th>
              <th className="py-2 pr-3 font-medium">참여율</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => (
              <tr key={d.channel} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-slate-700">
                  {idx === 0 && d.avgViews !== null && "🏆 "}
                  {CHANNEL_LABEL[d.channel]}
                </td>
                <td className="py-2.5 pr-3 text-slate-600">{d.postCount}</td>
                <td className="py-2.5 pr-3 text-slate-600">{fmt(d.avgViews)}</td>
                <td className="py-2.5 pr-3 text-slate-600">{fmt(d.avgLikes)}</td>
                <td className="py-2.5 pr-3 text-slate-600">
                  {d.engagementRate === null ? "—" : `${(d.engagementRate * 100).toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
