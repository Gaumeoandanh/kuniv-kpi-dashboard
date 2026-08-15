import DashboardShell from "@/components/dashboard/DashboardShell";
import ProjectOverviewSection from "@/components/dashboard/ProjectOverviewSection";
import PeriodComparisonTable from "@/components/dashboard/PeriodComparisonTable";
import UserSection from "@/components/dashboard/UserSection";
import ContentPerformanceSection from "@/components/dashboard/ContentPerformanceSection";
import DailyViewsChart from "@/components/dashboard/DailyViewsChart";
import BestContentTabs from "@/components/dashboard/BestContentTabs";
import ChannelPublishSection from "@/components/dashboard/ChannelPublishSection";
import ChannelPerformanceSection from "@/components/dashboard/ChannelPerformanceSection";
import ChannelEfficiencySection from "@/components/dashboard/ChannelEfficiencySection";

import { getUserStats, getMemberCountsByMonth, getRealMembers } from "@/lib/data/kuniv";
import { getContentMetrics } from "@/lib/data/sheets";
import {
  summarizeContent,
  dailyViewsFromContent,
  channelPublishCounts,
  channelPerformance,
  contentSummaryByMonth,
  channelEfficiency,
} from "@/lib/aggregate";

// 가입 유입경로 (SignupSourceSection) and 전환 성과 (ConversionSection) are
// hidden for now — both depended on GA4, which K-UNIV doesn't have, and
// K-UNIV admin's own "접속 통계" page is currently empty (checked
// 2026-07-26). The components + lib/data/ga4.ts stub are kept so this is
// a one-line re-enable once a real traffic source exists — see
// OPEN_QUESTIONS.md item 3 / DATA_SOURCE_MAP.md.

// This page fetches on every request (KPI data should be reasonably fresh).
// Revisit with a cache/TTL once real API sources are wired up.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [userStats, contentRows, monthlyMemberCounts, realMembers] = await Promise.all([
    getUserStats(),
    getContentMetrics(),
    getMemberCountsByMonth(),
    getRealMembers(),
  ]);

  const contentSummary = summarizeContent(contentRows);
  const dailyViews = dailyViewsFromContent(contentRows);
  const publishCounts = channelPublishCounts(contentRows);
  const perfByChannel = channelPerformance(contentRows);
  const monthlyContent = contentSummaryByMonth(contentRows);
  const channelEff = channelEfficiency(contentRows);

  return (
    <DashboardShell>
      <ProjectOverviewSection
        userStats={userStats}
        monthlyMemberCounts={monthlyMemberCounts}
        monthlyContent={monthlyContent}
        channelEff={channelEff}
      />

      <PeriodComparisonTable monthlyMemberCounts={monthlyMemberCounts} monthlyContent={monthlyContent} />

      <div className="border-t border-slate-100 pt-2" />

      <UserSection stats={userStats} monthlyCounts={monthlyMemberCounts} realMembers={realMembers} />

      <div className="border-t border-slate-100 pt-2" />

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">마케팅 채널</h2>
        <ContentPerformanceSection summary={contentSummary} />
        <DailyViewsChart data={dailyViews} />
        <BestContentTabs rows={contentRows} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChannelPublishSection data={publishCounts} />
          <ChannelPerformanceSection data={perfByChannel} />
        </div>
        <ChannelEfficiencySection data={channelEff} />
      </section>
    </DashboardShell>
  );
}
