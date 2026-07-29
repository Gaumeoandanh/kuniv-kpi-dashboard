import { ContentSummary } from "@/lib/types";
import SummaryCard from "@/components/dashboard/SummaryCard";

// 콘텐츠 결과가 정리되는 원본 Google Sheet ("[K-UNIV]성과" 탭).
const CONTENT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1cgYYoJk5O7mJsmA-maZAMbNE8z6PV750-22hjDZvpYw/edit?gid=666615790#gid=666615790";

export default function ContentPerformanceSection({ summary }: { summary: ContentSummary }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800">콘텐츠 성과</h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-5">
        <SummaryCard
          label="발행 콘텐츠"
          value={summary.totalPublished}
          accent="slate"
          icon="📝"
          href={CONTENT_SHEET_URL}
        />
        <SummaryCard label="총 조회수" value={summary.totalViews.toLocaleString()} accent="brand" icon="👀" />
        <SummaryCard label="총 좋아요" value={summary.totalLikes.toLocaleString()} accent="rose" icon="❤️" />
        <SummaryCard label="총 댓글" value={summary.totalComments.toLocaleString()} accent="violet" icon="💬" />
        <SummaryCard label="총 공유" value={summary.totalShares.toLocaleString()} accent="amber" icon="🔁" />
      </div>
    </section>
  );
}
