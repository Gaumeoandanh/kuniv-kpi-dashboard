import { ConversionStats } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";
import SectionCard from "@/components/dashboard/SectionCard";

export default function ConversionSection({ stats }: { stats: ConversionStats }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">전환 성과</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="웹사이트 방문수" value={stats.websiteVisits.toLocaleString()} accent="brand" icon="🌐" />
        <SummaryCard label="신규 회원가입수" value={stats.newSignups} accent="violet" icon="🆕" />
        <SummaryCard
          label="방문 → 가입 전환율"
          value={`${(stats.conversionRate * 100).toFixed(2)}%`}
          accent="amber"
          icon="📈"
        />
      </div>

      {stats.byChannel && (
        <SectionCard title="채널별 전환" subtitle="채널별 방문 · 가입 · 전환율">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="py-2 pr-3 font-medium">채널</th>
                  <th className="py-2 pr-3 font-medium">방문수</th>
                  <th className="py-2 pr-3 font-medium">가입수</th>
                  <th className="py-2 pr-3 font-medium">전환율</th>
                </tr>
              </thead>
              <tbody>
                {stats.byChannel.map((c) => (
                  <tr key={c.channel} className="border-b border-slate-50 last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-slate-700">{c.channel}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{c.visits.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{c.signups.toLocaleString()}</td>
                    <td className="py-2.5 pr-3 text-slate-600">{(c.conversionRate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </section>
  );
}
