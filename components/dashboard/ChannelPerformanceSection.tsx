import { ChannelPerformance } from "@/lib/types";
import { CHANNEL_LABEL } from "@/lib/aggregate";
import SectionCard from "@/components/dashboard/SectionCard";

export default function ChannelPerformanceSection({ data }: { data: ChannelPerformance[] }) {
  return (
    <SectionCard title="채널별 성과" subtitle="채널별 발행 수 및 누적 성과">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="py-2 pr-3 font-medium">채널</th>
              <th className="py-2 pr-3 font-medium">발행 수</th>
              <th className="py-2 pr-3 font-medium">조회수</th>
              <th className="py-2 pr-3 font-medium">좋아요</th>
              <th className="py-2 pr-3 font-medium">댓글</th>
              <th className="py-2 pr-3 font-medium">공유</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.channel} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-slate-700">{CHANNEL_LABEL[d.channel]}</td>
                <td className="py-2.5 pr-3 text-slate-600">{d.postCount}</td>
                <td className="py-2.5 pr-3 text-slate-600">{d.totalViews.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{d.totalLikes.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{d.totalComments.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{d.totalShares.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
