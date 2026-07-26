import { ContentSummary } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";

export default function ContentPerformanceSection({ summary }: { summary: ContentSummary }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">콘텐츠 성과</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="발행 콘텐츠" value={summary.totalPublished} accent="slate" icon="📝" />
        <SummaryCard label="총 조회수" value={summary.totalViews.toLocaleString()} accent="brand" icon="👀" />
        <SummaryCard label="총 좋아요" value={summary.totalLikes.toLocaleString()} accent="rose" icon="❤️" />
        <SummaryCard label="총 댓글" value={summary.totalComments.toLocaleString()} accent="violet" icon="💬" />
        <SummaryCard label="총 공유" value={summary.totalShares.toLocaleString()} accent="amber" icon="🔁" />
      </div>
    </section>
  );
}
