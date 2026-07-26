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

export function dailyViewsFromContent(rows: ContentMetric[]): DailyViewPoint[] {
  const byDate = new Map<string, number>();
  for (const row of rows) {
    if (row.primaryViews === null) continue;
    byDate.set(row.publishedDate, (byDate.get(row.publishedDate) ?? 0) + row.primaryViews);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, views]) => ({ date, views }));
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
