import {
    ContentMetric,
    ContentSummary,
    ChannelPublishCount,
    ChannelPerformance,
    ChannelEfficiency,
    MonthlyContentSummary,
    ContentChannel,
    DailyViewPoint,
    BestContentMetricKey,
    MonthlyMemberCount,
    MonthlyGoalStatus,
} from "@/lib/types";
import { sumMetric } from "@/lib/data/normalize";

const ALL_CHANNELS: ContentChannel[] = ["instagram", "tiktok", "threads", "facebook", "other"];

export function summarizeContent(rows: ContentMetric[]): ContentSummary {
    return {
          totalPublished: rows.length,
          totalViews: sumMetric(rows, (r) => r.primaryViews),
          totalLikes: sumMetric(rows, (r) => r.likesD7),
          totalComments: sumMetric(rows, (r) => r.commentsD7),
          totalShares: sumMetric(rows, (r) => r.sharesD7),
    };
}

/**
 * D+7 views for a row that's less than 7 days old is *always* null by
 * definition (see REQUIREMENTS.md section 4 — null means "not enough
 * time has passed yet", not "zero"). Using primaryViews (D+7-only) for
 * the daily trend chart means the most recent ~7 days are guaranteed to
 * show nothing, every single time — not useful for a "recent activity"
 * chart. So the chart falls back to the best number available so far
 * (D+7, else D+3, else D+1) per row; it still never invents a 0. The
 * 콘텐츠 성과 summary cards and BEST 콘텐츠 ranking keep using strict D+7
 * (primaryViews) per the original spec — this fallback is chart-only.
 */
function bestAvailableViews(row: ContentMetric): number | null {
    return row.views.d7 ?? row.views.d3 ?? row.views.d1 ?? null;
}

export function dailyViewsFromContent(rows: ContentMetric[]): DailyViewPoint[] {
    const byDate = new Map<string, number>();
    for (const row of rows) {
          const views = bestAvailableViews(row);
          if (views === null) continue;
          byDate.set(row.publishedDate, (byDate.get(row.publishedDate) ?? 0) + views);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, views]) => ({ date, views }));
}

/** True if any row published in the last 7 days is still waiting on its
 * D+7 number — used to show a small caveat under the daily views chart. */
export function hasPendingD7(rows: ContentMetric[]): boolean {
    return rows.some((r) => !r.isDataComplete && bestAvailableViews(r) !== null);
}

export function channelPublishCounts(rows: ContentMetric[]): ChannelPublishCount[] {
    const counts = new Map<ContentChannel, number>();
    for (const ch of ALL_CHANNELS) counts.set(ch, 0);
    for (const row of rows) counts.set(row.channel, (counts.get(row.channel) ?? 0) + 1);
    return [...counts.entries()]
      .filter(([, count]) => count > 0)
      .map(([channel, count]) => ({ channel, count }));
}

export function channelPerformance(rows: ContentMetric[]): ChannelPerformance[] {
    const groups = new Map<ContentChannel, ContentMetric[]>();
    for (const row of rows) {
          const list = groups.get(row.channel) ?? [];
          list.push(row);
          groups.set(row.channel, list);
    }
    return [...groups.entries()].map(([channel, list]) => ({
          channel,
          postCount: list.length,
          totalViews: sumMetric(list, (r) => r.primaryViews),
          totalLikes: sumMetric(list, (r) => r.likesD7),
          totalComments: sumMetric(list, (r) => r.commentsD7),
          totalShares: sumMetric(list, (r) => r.sharesD7),
    }));
}

const METRIC_PICKERS: Record<BestContentMetricKey, (r: ContentMetric) => number | null> = {
    views: (r) => r.primaryViews,
    likes: (r) => r.likesD7,
    comments: (r) => r.commentsD7,
    shares: (r) => r.sharesD7,
};

export function topContent(
    rows: ContentMetric[],
    metric: BestContentMetricKey,
    limit = 5
  ): { row: ContentMetric; value: number }[] {
    const pick = METRIC_PICKERS[metric];
    return rows
      .map((row) => ({ row, value: pick(row) }))
      .filter((r): r is { row: ContentMetric; value: number } => r.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
}

export const CHANNEL_LABEL: Record<ContentChannel, string> = {
    instagram: "인스타그램",
    tiktok: "틱톡",
    threads: "스레드",
    facebook: "페이스북",
    other: "기타",
};

// ---------------------------------------------------------------------
// "종합 현황" (Project Overview) 섹션용 헬퍼 — 2026-08-15 추가.
// 기존 콘텐츠/사용자 데이터를 재조합만 할 뿐, 새 데이터 소스는 필요 없음.
// ---------------------------------------------------------------------

/**
 * 이전 값(previous) 대비 현재 값(current)의 증감률(%).
 * previous가 0 이하이면 "몇 배" 개념이 무의미하므로 null 반환 (0으로
 * 나누거나 무한대 %를 보여주지 않음 — REQUIREMENTS.md의 null-vs-0 원칙과 동일).
 */
export function percentChange(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return ((current - previous) / previous) * 100;
}

export type FreshnessLevel = "fresh" | "warn" | "stale";

/**
 * 수동 크롤링 데이터(memberListSnapshot.json)가 얼마나 오래됐는지 등급화.
 * 회원 데이터가 자동 갱신되지 않는 이 프로젝트 구조상, 아무도 눈치채지
 * 못한 채 며칠씩 방치되는 걸 막기 위한 배지용 — 2026-08-11에 실제로
 * 겪었던 "8월 데이터가 갱신 안 됨" 문제 재발 방지.
 *   fresh: 0~2일 전 · warn: 3~5일 전 · stale: 6일 이상 (재크롤링 필요)
 */
export function freshnessLevel(fetchedAtISO: string, now: Date = new Date()): FreshnessLevel {
    const days = (now.getTime() - new Date(fetchedAtISO).getTime()) / 86400000;
    if (days <= 2) return "fresh";
    if (days <= 5) return "warn";
    return "stale";
}

export function daysSince(iso: string, now: Date = new Date()): number {
    return Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
}

/**
 * 이번 달 신규 회원 목표 달성 현황 계산.
 *
 * 목표(target) = 바로 전월의 실제 신규 회원 수 — "최소 지난달만큼은 하자"는
 * 가장 보수적인 기준. 2026-08-15, 계정 owner가 직접 숫자를 입력하거나
 * 자동 증가율을 적용하는 대신 이 방식을 선택함: 매달 데이터가 갱신되면
 * 목표도 자동으로 같이 갱신되고, 사람이 관리해야 할 설정값이 없음.
 *
 * 비교할 전월 데이터가 없으면(서비스 시작 첫 달 등) null을 반환 — 목표를
 * 0이나 임의의 값으로 지어내지 않음.
 */
export function currentMonthGoal(
    monthlyCounts: MonthlyMemberCount[],
    currentMonthKey: string
): MonthlyGoalStatus | null {
    const actual = monthlyCounts.find((m) => m.month === currentMonthKey)?.count ?? 0;
    const previous = monthlyCounts.find((m) => m.month < currentMonthKey);
    if (!previous) return null;

    return {
        month: currentMonthKey,
        target: previous.count,
        actual,
        achievementPercent: previous.count > 0 ? (actual / previous.count) * 100 : null,
    };
}

/**
 * 월별 콘텐츠 성과 합계 — 최신 월이 먼저 오도록 정렬 (getMemberCountsByMonth와
 * 동일한 정렬 방향, "기간 비교 테이블"에서 그대로 나란히 쓰기 위함).
 */
export function contentSummaryByMonth(rows: ContentMetric[]): MonthlyContentSummary[] {
    const groups = new Map<string, ContentMetric[]>();
    for (const row of rows) {
        const month = row.publishedDate.slice(0, 7); // "YYYY-MM"
        if (!month) continue;
        const list = groups.get(month) ?? [];
        list.push(row);
        groups.set(month, list);
    }
    return [...groups.entries()]
        .map(([month, list]) => ({
            month,
            totalPublished: list.length,
            totalViews: sumMetric(list, (r) => r.primaryViews),
            totalLikes: sumMetric(list, (r) => r.likesD7),
            totalComments: sumMetric(list, (r) => r.commentsD7),
            totalShares: sumMetric(list, (r) => r.sharesD7),
        }))
        .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * 채널별 "효율" — 총합이 아닌 게시물 1개당 평균. channelPerformance()의
 * 총합 순위와 달리, 게시물을 적게 올렸어도 개별 성과가 좋은 채널을
 * 가려낼 수 있도록 함. 평균 계산 시 분모는 "해당 지표가 null이 아닌
 * 게시물 수"만 사용 — D+7 집계 전 게시물이 평균을 부당하게 낮추지 않도록.
 * avgViews 기준 내림차순 정렬(값 없는 채널은 맨 뒤).
 */
export function channelEfficiency(rows: ContentMetric[]): ChannelEfficiency[] {
    const groups = new Map<ContentChannel, ContentMetric[]>();
    for (const row of rows) {
        const list = groups.get(row.channel) ?? [];
        list.push(row);
        groups.set(row.channel, list);
    }

    function avg(list: ContentMetric[], pick: (r: ContentMetric) => number | null): number | null {
        const values = list.map(pick).filter((v): v is number => v !== null);
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    const result: ChannelEfficiency[] = [...groups.entries()].map(([channel, list]) => {
        const totalViews = sumMetric(list, (r) => r.primaryViews);
        const totalLikes = sumMetric(list, (r) => r.likesD7);
        const totalComments = sumMetric(list, (r) => r.commentsD7);
        const totalShares = sumMetric(list, (r) => r.sharesD7);
        return {
            channel,
            postCount: list.length,
            avgViews: avg(list, (r) => r.primaryViews),
            avgLikes: avg(list, (r) => r.likesD7),
            avgComments: avg(list, (r) => r.commentsD7),
            avgShares: avg(list, (r) => r.sharesD7),
            engagementRate: totalViews > 0 ? (totalLikes + totalComments + totalShares) / totalViews : null,
        };
    });

    return result.sort((a, b) => {
        if (a.avgViews === null) return 1;
        if (b.avgViews === null) return -1;
        return b.avgViews - a.avgViews;
    });
}
