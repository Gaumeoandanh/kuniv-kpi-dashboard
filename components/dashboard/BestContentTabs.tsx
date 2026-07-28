"use client";

import { useMemo, useState } from "react";
import { ContentMetric, BestContentMetricKey } from "@/lib/types";
import { topContent, CHANNEL_LABEL } from "@/lib/aggregate";
import SectionCard from "@/components/dashboard/SectionCard";

const TABS: { key: BestContentMetricKey; label: string }[] = [
  { key: "views", label: "조회수" },
  { key: "likes", label: "좋아요" },
  { key: "comments", label: "댓글" },
  { key: "shares", label: "공유" },
];

export default function BestContentTabs({ rows }: { rows: ContentMetric[] }) {
  const [tab, setTab] = useState<BestContentMetricKey>("views");

  const top = useMemo(() => topContent(rows, tab, 5), [rows, tab]);
  const max = top.length > 0 ? top[0].value : 1;

  return (
    <SectionCard
      title="BEST 콘텐츠"
      subtitle="지표별 상위 5개 콘텐츠"
      action={
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tab === t.key ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-3">
        {top.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">아직 데이터가 없습니다.</p>
        )}
        {top.map(({ row, value }, idx) => {
          const content = (
            <>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-sm font-medium text-slate-700 ${
                      row.link ? "group-hover:text-brand-600 group-hover:underline" : ""
                    }`}
                  >
                    {row.title}
                  </p>
                  <span className="shrink-0 text-sm font-semibold text-slate-800">
                    {value.toLocaleString()}
                  </span>
                </div>
                <div className="mb-1 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{CHANNEL_LABEL[row.channel]}</span>
                  <span>·</span>
                  <span>{row.publishedDate}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
                  />
                </div>
              </div>
            </>
          );

          return row.link ? (
            <a
              key={row.id}
              href={row.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-lg transition hover:bg-slate-50"
            >
              {content}
            </a>
          ) : (
            <div key={row.id} className="group flex items-center gap-3">
              {content}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
