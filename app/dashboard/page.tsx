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
import SignupSourceSection from "@/components/dashboard/SignupSourceSection";

import { getUserStats, getMemberCountsByMonth, getStaffCountsByMonth, getRealMembers, getStaffMembers, getSignupSourceBreakdown } from "@/lib/data/kuniv";
import { getContentMetrics } from "@/lib/data/sheets";
import {
  summarizeContent,
  dailyViewsFromContent,
  channelPublishCounts,
  channelPerformance,
  contentSummaryByMonth,
  channelEfficiency,
} from "@/lib/aggregate";

// 전환 성과 (ConversionSection) is still hidden — it depended on GA4, which
// K-UNIV doesn't have, and K-UNIV admin's own "접속 통계" page is still empty.
// The component + lib/data/ga4.ts stub are kept for a one-line re-enable.
//
// 가입 유입경로 (SignupSourceSection) was hidden for the same reason until
// 2026-09-12: the admin panel redesign exposed a per-member "가입 경로"
// column, so the breakdown is now derived from memberListSnapshot.json
// (see getSignupSourceBreakdown) instead of GA4 — and it counts confirmed
// signups rather than anonymous sessions, which is the better number anyway.

// This page fetches on every request (KPI data should be reasonably fresh).
// Revisit with a cache/TTL once real API sources are wired up.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [userStats, contentRows, monthlyMemberCounts, monthlyStaffCounts, realMembers, staffMembers, signupSources] =
    await Promise.all([
      getUserStats(),
      getContentMetrics(),
      getMemberCountsByMonth(),
      getStaffCountsByMonth(),
      getRealMembers(),
      getStaffMembers(),
      getSignupSourceBreakdown(),
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
        monthlyStaffCounts={monthlyStaffCounts}
        monthlyContent={monthlyContent}
        channelEff={channelEff}
        contentSummary={contentSummary}
        realMembers={realMembers}
      />

      <PeriodComparisonTable monthlyMemberCounts={monthlyMemberCounts} monthlyContent={monthlyContent} />

      <div className="border-t border-slate-100 pt-2" />

      <UserSection
        stats={userStats}
        monthlyCounts={monthlyMemberCounts}
        monthlyStaffCounts={monthlyStaffCounts}
        realMembers={realMembers}
        staffMembers={staffMembers}
      />

      <SignupSourceSection data={signupSources} />

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
