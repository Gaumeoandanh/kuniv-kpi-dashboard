import { ContentChannel, ContentMetric } from "@/lib/types";

/**
 * Alias table for channel names as they may appear in the Google Sheet.
 * Extend this list once we see the real sheet's distinct values —
 * see OPEN_QUESTIONS.md item 8.
 */
const CHANNEL_ALIASES: Record<string, ContentChannel> = {
  instagram: "instagram",
  "인스타그램": "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  "틱톡": "tiktok",
  threads: "threads",
  "스레드": "threads",
  facebook: "facebook",
  "페이스북": "facebook",
  fb: "facebook",
};

export function normalizeChannel(raw: string): ContentChannel {
  const key = raw.trim().toLowerCase();
  return CHANNEL_ALIASES[key] ?? "other";
}

/**
 * Sheet cells come in as strings when using FORMATTED_VALUE, or as
 * numbers/strings when using UNFORMATTED_VALUE (which is what
 * lib/data/sheets.ts requests). Handle both. Empty string or "-" must
 * become `null`, never silently become 0 — see REQUIREMENTS.md section 4.
 */
export function parseMetricCell(raw: unknown): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const trimmed = String(raw).trim();
  if (trimmed === "" || trimmed === "-") return null;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Google Sheets returns date cells as a serial number (days since
 * 1899-12-30) when using UNFORMATTED_VALUE, or as a locale-formatted
 * string ("일요일, 5 7월, 2026") when using FORMATTED_VALUE — which is
 * also the format the public gviz CSV export returns. Handle both,
 * falling back to the raw string if it can't be parsed.
 */
export function parseSheetDate(raw: unknown): string {
  if (typeof raw === "number") {
    const epoch = Date.UTC(1899, 11, 30);
    return new Date(epoch + raw * 86400000).toISOString().slice(0, 10);
  }
  if (typeof raw === "string") {
    // Korean locale format, e.g. "일요일, 5 7월, 2026" (weekday, day, month월, year).
    // JS's native Date parser does not understand this, so extract it manually
    // before falling back to a generic parse.
    const koreanMatch = raw.match(/(\d{1,2})\s+(\d{1,2})월,\s*(\d{4})/);
    if (koreanMatch) {
      const [, day, month, year] = koreanMatch;
      const d = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return raw;
  }
  return "";
}

export function isDataComplete(publishedDateISO: string, today: Date = new Date()): boolean {
  const published = new Date(publishedDateISO);
  const diffMs = today.getTime() - published.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

/** Sum a metric across content rows, skipping nulls (does not coerce null -> 0). */
export function sumMetric(
  rows: ContentMetric[],
  pick: (row: ContentMetric) => number | null
): number {
  return rows.reduce((acc, row) => {
    const v = pick(row);
    return v === null ? acc : acc + v;
  }, 0);
}
