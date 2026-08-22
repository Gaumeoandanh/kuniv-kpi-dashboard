import {
  UserStats,
  MonthlyMemberCount,
  MonthlyContentSummary,
  ChannelEfficiency,
  ContentSummary,
  MemberListEntry,
} from "@/lib/types";
import Link from "next/link";
import SummaryCard from "@/components/dashboard/SummaryCard";
import ReportDownloadButton from "@/components/dashboard/ReportDownloadButton";
import { CHANNEL_LABEL, percentChange, daysSince, freshnessLevel, currentMonthGoal } from "@/lib/aggregate";

/**
 * "종합 현황" (Project Overview) — 2026-08-15 추가.
 *
 * 목적: 관리자가 대시보드를 열었을 때 사용자/콘텐츠 두 섹션을 각각 뜯어보지
 * 않아도 "이번 달이 지난달보다 나은지, 어느 채널이 잘 되고 있는지, 데이터가
 * 최신인지"를 10초 안에 파악할 수 있게 하는 요약 블록. 새 데이터 소스는
 * 전혀 쓰지 않고, 이미 있는 회원/콘텐츠 데이터를 다른 각도로 재조합만 한다
 * (KPI_DASHBOARD_AUDIT_2026-08-12.md 4장 "Giai đoạn 1" 항목 1·5 대응).
 *
 * 아래 카드들은 UserSection/ContentPerformanceSection의 "전체 누적" 카드와
 * 겹치지 않도록 일부러 "이번 달" 기준으로만 보여준다.
 */
export default function ProjectOverviewSection({
  userStats,
  monthlyMemberCounts,
  monthlyStaffCounts,
  monthlyContent,
  channelEff,
  contentSummary,
  realMembers,
}: {
  userStats: UserStats;
  monthlyMemberCounts: MonthlyMemberCount[]; // 최신 월이 먼저 오는 배열 — 학생회원(실제 회원)만
  monthlyStaffCounts: MonthlyMemberCount[]; // 최신 월이 먼저 오는 배열 — 대학 회원(학교 관계자)만
  monthlyContent: MonthlyContentSummary[]; // 최신 월이 먼저 오는 배열
  channelEff: ChannelEfficiency[]; // avgViews 내림차순 정렬됨
  contentSummary: ContentSummary; // 누적 총계 — PDF 보고서용
  realMembers: MemberListEntry[]; // 국가별 분포 — PDF 보고서용
}) {
  const currentMonthKey = userStats.fetchedAt.slice(0, 7); // "YYYY-MM"
  const monthLabel = `${Number(currentMonthKey.slice(5, 7))}월`;

  const thisMonthMembers = monthlyMemberCounts.find((m) => m.month === currentMonthKey)?.count ?? 0;
  const lastMonthMembers = monthlyMemberCounts.find((m) => m.month < currentMonthKey)?.count ?? 0;
  const memberTrend = lastMonthMembers > 0 ? percentChange(thisMonthMembers, lastMonthMembers) : null;

  // 2026-08-22 추가 — "{월} 신규 회원" 카드를 학생회원/대학 회원으로 나눠 보여주기 위한
  // 대학 회원(학교 관계자) 집계. thisMonthMembers(위)는 이미 학생회원(실제 회원)만이므로
  // 그대로 재사용하고, 대학 회원 수만 별도로 더한다.
  const thisMonthStaff = monthlyStaffCounts.find((m) => m.month === currentMonthKey)?.count ?? 0;
  const lastMonthStaff = monthlyStaffCounts.find((m) => m.month < currentMonthKey)?.count ?? 0;
  const totalNewMembers = thisMonthMembers + thisMonthStaff;
  const totalLastMonth = lastMonthMembers + lastMonthStaff;
  const totalTrend = totalLastMonth > 0 ? percentChange(totalNewMembers, totalLastMonth) : null;

  // 목표 = 전월 실제 신규 회원 수 (자동 계산, 사람이 입력하는 값 아님 — 2026-08-15 결정).
  const goal = currentMonthGoal(monthlyMemberCounts, currentMonthKey);

  const thisMonthContent = monthlyContent.find((m) => m.month === currentMonthKey) ?? null;

  const bestChannel = channelEff.find((c) => c.avgViews !== null) ?? null;

  const dataAgeDays = daysSince(userStats.fetchedAt);
  const level = freshnessLevel(userStats.fetchedAt);

  const narrativeParts: string[] = [];
  narrativeParts.push(
    `${monthLabel}: 신규 회원 ${thisMonthMembers}명${
      memberTrend !== null ? ` (전월 대비 ${memberTrend >= 0 ? "+" : ""}${memberTrend.toFixed(1)}%)` : ""
    }.`
  );
  if (goal) {
    narrativeParts.push(
      goal.achievementPercent !== null && goal.achievementPercent >= 100
        ? `이번 달 목표(전월 수준 ${goal.target}명)를 달성했습니다 (${goal.achievementPercent.toFixed(0)}%). 🎉`
        : `이번 달 목표(전월 수준 ${goal.target}명) 중 ${goal.actual}명 달성${
            goal.achievementPercent !== null ? ` (${goal.achievementPercent.toFixed(0)}%)` : ""
          }.`
    );
  }
  if (thisMonthContent) {
    narrativeParts.push(
      `콘텐츠 ${thisMonthContent.totalPublished}건 발행, 총 조회수 ${thisMonthContent.totalViews.toLocaleString()}회.`
    );
  } else {
    narrativeParts.push("이번 달 발행된 콘텐츠 데이터가 아직 없습니다.");
  }
  if (bestChannel && bestChannel.avgViews !== null) {
    narrativeParts.push(
      `게시물당 효율이 가장 좋은 채널: ${CHANNEL_LABEL[bestChannel.channel]} (평균 ${Math.round(bestChannel.avgViews).toLocaleString()}회/건).`
    );
  }
  narrativeParts.push(
    level === "fresh"
      ? `회원 데이터는 ${dataAgeDays === 0 ? "오늘" : `${dataAgeDays}일 전`} 기준으로 최신입니다.`
      : `⚠️ 회원 데이터가 ${dataAgeDays}일 전 기준으로 오래됐습니다 — 재크롤링을 권장합니다.`
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800">종합 현황</h2>
          <span className="text-xs text-slate-400">관리자용 요약 · 자동 생성</span>
        </div>
        <ReportDownloadButton
          userStats={userStats}
          monthlyMemberCounts={monthlyMemberCounts}
          monthlyContent={monthlyContent}
          channelEff={channelEff}
          contentSummary={contentSummary}
          realMembers={realMembers}
        />
      </div>

      <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4 text-sm leading-relaxed text-slate-700">
        {narrativeParts.join(" ")}
      </div>

      {goal && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {monthLabel} 신규 회원 목표 (전월 수준 유지)
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {goal.actual} / {goal.target}명
              {goal.achievementPercent !== null && (
                <span className={goal.achievementPercent >= 100 ? "ml-1 text-brand-600" : "ml-1 text-slate-400"}>
                  ({goal.achievementPercent.toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${
                goal.achievementPercent !== null && goal.achievementPercent >= 100 ? "bg-brand-500" : "bg-violet-500"
              }`}
              style={{
                width: `${Math.min(100, goal.achievementPercent ?? 0)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:gap-4 lg:grid-cols-5">
        {/* {월} 신규 회원 — 다른 3개 카드보다 크게, 학생회원/대학 회원으로 세분화
            (2026-08-22, 계정 owner 요청). lg 화면에서 5칸 중 2칸을 차지. */}
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-100 sm:rounded-2xl sm:p-5 lg:col-span-2">
          <div className="mb-1.5 flex items-center justify-between sm:mb-3">
            <span className="text-[11px] font-medium text-slate-500 sm:text-sm">{monthLabel} 신규 회원</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-50 text-xs text-violet-600 sm:h-9 sm:w-9 sm:rounded-lg sm:text-lg">
              🌱
            </span>
          </div>
          <div className="text-2xl font-semibold text-slate-800 sm:text-4xl">{totalNewMembers}</div>
          <div className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
            {totalTrend !== null ? `전월 대비 ${totalTrend >= 0 ? "+" : ""}${totalTrend.toFixed(1)}%` : "전월 데이터 없음"}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-4 sm:pt-4">
            <Link href="/dashboard/members" className="group block">
              <div className="text-[11px] text-slate-500 sm:text-sm">학생회원</div>
              <div className="text-base font-semibold text-slate-700 transition group-hover:text-brand-600 sm:text-xl">
                {thisMonthMembers}
              </div>
            </Link>
            <Link
              href={`/dashboard/members?type=staff&month=${currentMonthKey}`}
              className="group block border-l border-slate-100 pl-2 sm:pl-4"
            >
              <div className="text-[11px] text-slate-500 sm:text-sm">대학 회원</div>
              <div className="text-base font-semibold text-slate-700 transition group-hover:text-brand-600 sm:text-xl">
                {thisMonthStaff}
              </div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:col-span-3">
          <SummaryCard
            label={`${monthLabel} 콘텐츠 발행`}
            value={thisMonthContent?.totalPublished ?? 0}
            sub="이번 달 기준"
            accent="slate"
            icon="📝"
          />
          <SummaryCard
            label={`${monthLabel} 총 조회수`}
            value={(thisMonthContent?.totalViews ?? 0).toLocaleString()}
            sub="이번 달 기준"
            accent="brand"
            icon="👀"
          />
          <SummaryCard
            label="최고 효율 채널"
            value={bestChannel ? CHANNEL_LABEL[bestChannel.channel] : "데이터 없음"}
            sub={
              bestChannel && bestChannel.avgViews !== null
                ? `평균 ${Math.round(bestChannel.avgViews).toLocaleString()}회/건`
                : undefined
            }
            accent="amber"
            icon="🏆"
          />
        </div>
      </div>
    </section>
  );
}
