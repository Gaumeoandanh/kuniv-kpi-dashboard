import {
  UserStats,
  MonthlyMemberCount,
  MonthlyContentSummary,
  ChannelEfficiency,
  ContentSummary,
  MemberListEntry,
} from "@/lib/types";
import {
  CHANNEL_LABEL,
  percentChange,
  currentMonthGoal,
  daysSince,
  countryBreakdown,
} from "@/lib/aggregate";

/** "2026-08" → "2026년 8월" — 프로젝트 전체에서 쓰는 표기와 통일. */
function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${y}년 ${Number(m)}월`;
}

function last3Months(memberCounts: MonthlyMemberCount[], content: MonthlyContentSummary[]): string[] {
  const months = new Set<string>([...memberCounts.map((m) => m.month), ...content.map((c) => c.month)]);
  return [...months].sort((a, b) => b.localeCompare(a)).slice(0, 3);
}

/** A4 비율(210×297mm)에 맞춘 페이지 너비/높이(px) — 800px 폭 기준. */
const PAGE_WIDTH = 800;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * (297 / 210)); // ≈ 1131px

/**
 * PDF 페이지 1장 분량의 래퍼. className="pdf-page"로 표시된 요소 단위로
 * ReportDownloadButton이 각각 따로 캡처해서 PDF 페이지 1장씩 만든다 —
 * 문서 전체를 통째로 찍어서 픽셀 단위로 기계적으로 자르면 표나 카드 중간이
 * 잘리는 문제가 있었음(2026-08-15 사용자 피드백). 섹션 단위로 미리 나눠
 * 캡처하면 표/카드가 페이지 경계에서 끊기지 않는다. 내용이 한 페이지보다
 * 길어지는 경우(채널·국가가 아주 많을 때 등)에도 ReportDownloadButton이
 * 자동으로 추가 페이지를 만들어 절대 잘리지 않도록 처리함.
 */
function ReportPage({
  children,
  pageNumber,
  totalPages,
}: {
  children: React.ReactNode;
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <div
      className="pdf-page bg-white text-slate-800"
      style={{
        width: PAGE_WIDTH,
        minHeight: PAGE_HEIGHT,
        padding: 48,
        boxSizing: "border-box",
        fontFamily: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex-1">{children}</div>
      <p className="mt-6 text-right text-[10px] text-slate-300">
        {pageNumber} / {totalPages}
      </p>
    </div>
  );
}

/**
 * PDF 보고서 본문 — ReportDownloadButton이 렌더링한 뒤 html2canvas로
 * 페이지(.pdf-page) 단위로 캡처해서 PDF로 변환한다. 2026-08-15 추가.
 *
 * 왜 html2canvas 방식인가: jsPDF의 기본 폰트는 한글(Hangul)을 지원하지
 * 않는다 — 폰트를 직접 임베드하지 않는 이상 한글 텍스트가 빈 사각형으로
 * 깨져서 나온다. 이 프로젝트는 UI 전체가 한글이므로, 브라우저가 실제로
 * 렌더링한 화면을 이미지로 캡처하는 방식(html2canvas)을 대신 사용해
 * 폰트 임베딩 없이도 한글이 항상 정확히 보이도록 함.
 *
 * 대시보드 라이브 뷰(항상 최신, 상호작용 가능)와는 별개로, 이 컴포넌트는
 * "특정 시점 스냅샷"을 문서로 남기기 위한 것 — 그래서 화면과 완전히 같은
 * 수치를 보여주되, 인쇄용으로 더 단순한 레이아웃(그림자·hover 등 제거)을 쓴다.
 */
export default function ReportDocument({
  userStats,
  monthlyMemberCounts,
  monthlyContent,
  channelEff,
  contentSummary,
  realMembers,
}: {
  userStats: UserStats;
  monthlyMemberCounts: MonthlyMemberCount[];
  monthlyContent: MonthlyContentSummary[];
  channelEff: ChannelEfficiency[];
  contentSummary: ContentSummary;
  realMembers: MemberListEntry[];
}) {
  const currentMonthKey = userStats.fetchedAt.slice(0, 7);
  const monthLabel = `${Number(currentMonthKey.slice(5, 7))}월`;
  const generatedAt = new Date();

  const thisMonthMembers = monthlyMemberCounts.find((m) => m.month === currentMonthKey)?.count ?? 0;
  const lastMonthMembers = monthlyMemberCounts.find((m) => m.month < currentMonthKey)?.count ?? 0;
  const memberTrend = lastMonthMembers > 0 ? percentChange(thisMonthMembers, lastMonthMembers) : null;

  const goal = currentMonthGoal(monthlyMemberCounts, currentMonthKey);
  const churnRate = userStats.totalMembers > 0 ? (userStats.churnedMembers / userStats.totalMembers) * 100 : null;

  const bestChannel = channelEff.find((c) => c.avgViews !== null) ?? null;
  const dataAgeDays = daysSince(userStats.fetchedAt);

  const months = last3Months(monthlyMemberCounts, monthlyContent);
  const comparisonRows = months.map((month) => {
    const members = monthlyMemberCounts.find((m) => m.month === month)?.count ?? 0;
    const content = monthlyContent.find((c) => c.month === month);
    return {
      month,
      members,
      published: content?.totalPublished ?? 0,
      views: content?.totalViews ?? 0,
      likes: content?.totalLikes ?? 0,
    };
  });

  const countries = countryBreakdown(realMembers).slice(0, 6);
  const countryTotal = realMembers.length;

  const narrative = [
    `${monthLabel} 기준 전체 회원 ${userStats.totalMembers}명, 이번 달 신규 가입 ${thisMonthMembers}명${
      memberTrend !== null ? ` (전월 대비 ${memberTrend >= 0 ? "+" : ""}${memberTrend.toFixed(1)}%)` : ""
    }입니다.`,
    goal
      ? `이번 달 목표(전월 수준 ${goal.target}명) 대비 ${goal.actual}명 달성${
          goal.achievementPercent !== null ? ` (${goal.achievementPercent.toFixed(0)}%)` : ""
        }.`
      : null,
    bestChannel && bestChannel.avgViews !== null
      ? `게시물당 효율이 가장 좋은 채널은 ${CHANNEL_LABEL[bestChannel.channel]}(평균 ${Math.round(bestChannel.avgViews).toLocaleString()}회/건)입니다.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const totalPages = 2;

  return (
    <div className="space-y-6">
      <ReportPage pageNumber={1} totalPages={totalPages}>
        <header className="mb-8 border-b-4 border-brand-600 pb-4">
          <p className="text-xs font-medium text-brand-600">K-UNIV KPI</p>
          <h1 className="text-2xl font-bold text-slate-900">종합 현황 보고서</h1>
          <p className="mt-1 text-xs text-slate-400">
            생성일 {generatedAt.toISOString().slice(0, 10)} · 데이터 기준일 {userStats.fetchedAt.slice(0, 10)}
            {dataAgeDays > 0 && ` (${dataAgeDays}일 전 크롤링)`}
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-bold text-slate-700">요약</h2>
          <p className="rounded-lg bg-slate-50 p-4 text-sm leading-relaxed">{narrative}</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-slate-700">핵심 지표</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "전체 회원", value: `${userStats.totalMembers}명` },
              { label: `${monthLabel} 신규 회원`, value: `+${thisMonthMembers}명` },
              {
                label: "목표 달성률",
                value: goal?.achievementPercent !== null && goal?.achievementPercent !== undefined
                  ? `${goal.achievementPercent.toFixed(0)}%`
                  : "—",
              },
              { label: "탈퇴율", value: churnRate !== null ? `${churnRate.toFixed(1)}%` : "—" },
              { label: "누적 콘텐츠 발행", value: `${contentSummary.totalPublished}건` },
              { label: "누적 조회수", value: `${contentSummary.totalViews.toLocaleString()}회` },
            ].map((card) => (
              <div key={card.label} className="rounded-lg border border-slate-200 p-3">
                <p className="text-[11px] text-slate-400">{card.label}</p>
                <p className="text-lg font-bold text-slate-800">{card.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-slate-700">최근 3개월 비교</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">월</th>
                <th className="py-2 pr-3 font-medium">신규 회원</th>
                <th className="py-2 pr-3 font-medium">콘텐츠 발행</th>
                <th className="py-2 pr-3 font-medium">조회수</th>
                <th className="py-2 pr-3 font-medium">좋아요</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((r) => (
                <tr key={r.month} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{formatMonthLabel(r.month)}</td>
                  <td className="py-2 pr-3">{r.members.toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.published.toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.views.toLocaleString()}</td>
                  <td className="py-2 pr-3">{r.likes.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </ReportPage>

      <ReportPage pageNumber={2} totalPages={totalPages}>
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-slate-700">채널별 효율 (게시물 1개당 평균)</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">채널</th>
                <th className="py-2 pr-3 font-medium">게시물 수</th>
                <th className="py-2 pr-3 font-medium">평균 조회수</th>
                <th className="py-2 pr-3 font-medium">참여율</th>
              </tr>
            </thead>
            <tbody>
              {channelEff.map((c) => (
                <tr key={c.channel} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-medium">{CHANNEL_LABEL[c.channel]}</td>
                  <td className="py-2 pr-3">{c.postCount}</td>
                  <td className="py-2 pr-3">{c.avgViews === null ? "—" : Math.round(c.avgViews).toLocaleString()}</td>
                  <td className="py-2 pr-3">{c.engagementRate === null ? "—" : `${(c.engagementRate * 100).toFixed(1)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold text-slate-700">국가별 분포 (실제 회원 기준, 총 {countryTotal}명)</h2>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {countries.map((c) => (
              <div key={c.countryFlag} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
                <span>{c.countryFlag}</span>
                <span className="font-medium">
                  {c.count}명 ({countryTotal > 0 ? ((c.count / countryTotal) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-bold text-slate-700">데이터 공백 &amp; 다음 단계</h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">
            <p>· 광고비/예산 데이터 없음 — 채널별 CAC(user당 획득 비용)를 아직 계산할 수 없습니다.</p>
            <p>· GA4/전환 퍼널 미연동 — 콘텐츠가 실제로 몇 명의 가입으로 이어졌는지 추적하지 못합니다.</p>
            <p>· 이번 달 목표는 "전월 실제치"를 자동 기준으로 사용 중이며, 별도 입력된 사업 목표는 아닙니다.</p>
            <p>· 회원 데이터는 수동 크롤링 기반입니다 — 위 데이터 기준일 이후 변동은 반영되지 않았을 수 있습니다.</p>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-3 text-[10px] text-slate-400">
          K-UNIV KPI Dashboard에서 자동 생성 · {generatedAt.toLocaleString("ko-KR")}
        </footer>
      </ReportPage>
    </div>
  );
}
