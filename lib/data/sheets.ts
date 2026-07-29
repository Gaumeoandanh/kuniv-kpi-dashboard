import { google } from "googleapis";
import { ContentMetric } from "@/lib/types";
import {
  normalizeChannel,
  parseMetricCell,
  parseSheetDate,
  isDataComplete,
} from "@/lib/data/normalize";
import { mockContentRows } from "@/lib/mockData";

/**
 * Google Sheets integration — content KPI log.
 *
 * Confirmed against the real sheet on 2026-07-26:
 *   Tab: "[K-UNIV]성과"
 *   Data lives in columns B:L (column A is a blank spacer), header on
 *   row 2, data starting row 3:
 *   B=번호, C=날짜, D=채널, E=제목, F=조회 수(D+1), G=조회 수(D+3),
 *   H=조회 수(D+7), I=좋아요 수(D+7), J=댓글 수(D+7), K=공유 수(D+7), L=링크
 *
 * LIVE DATA (confirmed 2026-07-29): the owner shares this tab's data via
 * a public "anyone with the link can view" Google Sheet link, so we can
 * read it through Google's public gviz CSV export endpoint — a plain,
 * unauthenticated HTTPS GET. No API key, no service account, no secret
 * of any kind is needed for this path, and no PII is involved (this tab
 * is marketing/content performance numbers only). This is why
 * getContentMetrics() below tries the public CSV first.
 *
 * SECURITY NOTE: this spreadsheet also contains an "SNS accounts" tab
 * with plaintext social media passwords. That tab is separate from the
 * public link above and is never touched by the code on this page. The
 * service-account fallback further down (kept only in case the sheet's
 * sharing setting ever changes back to private) requests a narrow,
 * named range scoped to the performance tab only — never a
 * whole-spreadsheet read — and never logs raw sheet contents. Google
 * Sheets API access is granted per *file*, not per tab, so a service
 * account technically could read the SNS-accounts tab too; the account
 * owner has acknowledged this (see SECURITY_CHECKLIST.md 3c). Since the
 * public CSV path needs no such grant at all, it is the strictly safer
 * option and is preferred whenever it works.
 *
 * Optional (see .env.example) — only used if the public CSV fetch fails:
 *   - GOOGLE_SHEETS_SPREADSHEET_ID (also used to build the public CSV URL;
 *     defaults to the known public sheet ID if unset)
 *   - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 * If neither the public CSV nor the service account works, getContentMetrics()
 * falls back to mock data so the app still runs.
 */

const SHEET_TAB_NAME = process.env.GOOGLE_SHEETS_CONTENT_TAB || "[K-UNIV]성과";
const SHEET_RANGE = `'${SHEET_TAB_NAME}'!B3:L`;
const DEFAULT_SPREADSHEET_ID = "1cgYYoJk5O7mJsmA-maZAMbNE8z6PV750-22hjDZvpYw";

/**
 * Minimal RFC4180-ish CSV parser (handles quoted fields, escaped ""
 * quotes, and embedded commas/newlines inside quoted fields — several
 * of the real post titles contain literal line breaks).
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // ignore — paired \n handles the line break
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Fetch a single tab of the spreadsheet as CSV via Google's public gviz
 * export endpoint. Only works if the sheet is shared as "anyone with the
 * link can view" — returns null on any failure so callers can fall back.
 *
 * No caching: the dashboard page itself is `force-dynamic` (re-runs on
 * every request), and this fetch uses `cache: "no-store"` so it always
 * pulls the sheet's current values — any edit made in the sheet shows up
 * the moment the dashboard page is next loaded/reloaded, with no stale
 * window in between (2026-07-29: 사용자 요청으로 5분 캐시 제거, 즉시 반영).
 */
async function fetchPublicSheetCsv(tabName: string): Promise<string[][] | null> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    return parseCsv(text);
  } catch (err) {
    console.error(
      "[lib/data/sheets] Public CSV fetch failed:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;

  // .env files usually store the key with literal "\n" escapes.
  const key = rawKey.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email,
    key,
    // Read-only scope — this integration must never be able to write
    // back to the sheet, per SECURITY_CHECKLIST.md.
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/** row = [번호, 날짜, 채널, 제목, D+1, D+3, D+7, 좋아요, 댓글, 공유, 링크] */
export function mapRawRowToContentMetric(row: unknown[], index: number): ContentMetric | null {
  const [num, dateRaw, channelRaw, title, d1, d3, d7, likes, comments, shares, link] = row;
  if (!title || (typeof title === "string" && title.trim() === "")) return null;

  const publishedDate = parseSheetDate(dateRaw);
  const d7Views = parseMetricCell(d7);
  const linkStr = typeof link === "string" ? link.trim() : "";

  return {
    id: `row-${num ?? index}-${publishedDate}`,
    publishedDate,
    channel: normalizeChannel(String(channelRaw ?? "")),
    channelRaw: String(channelRaw ?? ""),
    title: String(title),
    views: {
      d1: parseMetricCell(d1),
      d3: parseMetricCell(d3),
      d7: d7Views,
    },
    likesD7: parseMetricCell(likes),
    commentsD7: parseMetricCell(comments),
    sharesD7: parseMetricCell(shares),
    primaryViews: d7Views,
    isDataComplete: publishedDate ? isDataComplete(publishedDate) : false,
    link: linkStr.length > 0 ? linkStr : null,
  };
}

export async function getContentMetrics(): Promise<ContentMetric[]> {
  // 1) Preferred: public, credential-free CSV export. The performance
  //    tab is shared as "anyone with the link can view" (confirmed
  //    2026-07-29), so this needs no secrets at all and can genuinely
  //    auto-refresh on every request.
  const csvRows = await fetchPublicSheetCsv(SHEET_TAB_NAME);
  if (csvRows && csvRows.length > 1) {
    const dataRows = csvRows.slice(1); // drop the header row
    const metrics = dataRows
      // drop the leading blank spacer column (A) so columns line up
      // with mapRawRowToContentMetric's expected [번호, 날짜, 채널, ...]
      .map((row, i) => mapRawRowToContentMetric(row.slice(1), i))
      .filter((r): r is ContentMetric => r !== null);
    if (metrics.length > 0) return metrics;
  }

  // 2) Fallback: service-account API (only relevant if the sheet's
  //    sharing setting is ever changed back to private).
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;
  const auth = getAuth();

  if (!auth) {
    // Neither path is available — keep the app usable on mock data.
    return mockContentRows;
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: SHEET_RANGE,
      valueRenderOption: "UNFORMATTED_VALUE",
    });

    const rows = res.data.values ?? [];
    return rows
      .map((row, i) => mapRawRowToContentMetric(row, i))
      .filter((r): r is ContentMetric => r !== null);
  } catch (err) {
    // Fail soft to mock data rather than crashing the dashboard; log
    // server-side only (no raw sheet contents in the error message).
    console.error(
      "[lib/data/sheets] Failed to fetch content metrics:",
      err instanceof Error ? err.message : err
    );
    return mockContentRows;
  }
}
