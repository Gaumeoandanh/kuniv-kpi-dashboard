import { ChannelPublishCount } from "@/lib/types";
import { CHANNEL_LABEL } from "@/lib/aggregate";
import SectionCard from "@/components/dashboard/SectionCard";

export default function ChannelPublishSection({ data }: { data: ChannelPublishCount[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <SectionCard title="채널별 발행" subtitle="채널별 발행 콘텐츠 수">
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.channel} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-sm text-slate-600">{CHANNEL_LABEL[d.channel]}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium text-slate-700">{d.count}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
