import {
    ContentMetric,
    ContentSummary,
    ChannelPublishCount,
    ChannelPerformance,
    ContentChannel,
    DailyViewPoint,
    BestContentMetricKey,
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
