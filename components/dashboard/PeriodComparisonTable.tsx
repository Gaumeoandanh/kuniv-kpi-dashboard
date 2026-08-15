import { MonthlyMemberCount, MonthlyContentSummary } from "@/lib/types";
import SectionCard from "@/components/dashboard/SectionCard";

/** "2026-08" → "2026년 8월" — app/dashboard/members/page.tsx의 표기와 동일하게 통일. */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

/**
 * 최근 3개 "월" 목록 — 회원 데이터와 콘텐츠 데이터 중 한쪽에만 있는 달도
 * 놓치지 않도록 두 배열의 월을 합집합한 뒤 최신순 3개만 사용.
 */
function last3Months(memberCounts: MonthlyMemberCount[], content: MonthlyContentSummary[]): string[] {
  const months = new Set<string>([...memberCounts.map((m) => m.month), ...content.map((c) => c.month)]);
  return [...months].sort((a, b) => b.localeCompare(a)).slice(0, 3);
}

/**
 * "기간 비교 테이블" — 관리자가 보고서에 바로 옮겨 쓸 수 있도록 최근 3개월을
 * 나란히 비교. 2026-08-15 추가 (KPI_DASHBOARD_AUDIT_2026-08-12.md 4장 항목 3).
 * 새 데이터 소스 없이 getMemberCountsByMonth() + contentSummaryByMonth() 결과만 합침.
 */
export default function PeriodComparisonTable({
  monthlyMemberCounts,
  monthlyContent,
}: {
  monthlyMemberCounts: MonthlyMemberCount[];
  monthlyContent: MonthlyContentSummary[];
}) {
  const months = last3Months(monthlyMemberCounts, monthlyContent);

  if (months.length === 0) {
    return null;
  }

  const rows = months.map((month) => {
    const members = monthlyMemberCounts.find((m) => m.month === month)?.count ?? 0;
    const content = monthlyContent.find((c) => c.month === month);
    return {
      month,
      members,
      published: content?.totalPublished ?? 0,
      views: content?.totalViews ?? 0,
      likes: content?.totalLikes ?? 0,
      comments: content?.totalComments ?? 0,
      shares: content?.totalShares ?? 0,
    };
  });

  return (
    <SectionCard title="기간 비교" subtitle="최근 3개월 나란히 비교 · 보고서용">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
              <th className="py-2 pr-3 font-medium">월</th>
              <th className="py-2 pr-3 font-medium">신규 회원</th>
              <th className="py-2 pr-3 font-medium">콘텐츠 발행</th>
              <th className="py-2 pr-3 font-medium">조회수</th>
              <th className="py-2 pr-3 font-medium">좋아요</th>
              <th className="py-2 pr-3 font-medium">댓글</th>
              <th className="py-2 pr-3 font-medium">공유</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-slate-700">{formatMonthLabel(r.month)}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.members.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.published.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.views.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.likes.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.comments.toLocaleString()}</td>
                <td className="py-2.5 pr-3 text-slate-600">{r.shares.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
