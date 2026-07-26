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
 * SECURITY NOTE: this spreadsheet also contains an "SNS accounts" tab
 * with plaintext social media passwords. Google Sheets API access is
 * granted per *file*, not per tab, so the service account used here can
 * technically read that tab too — the account owner has acknowledged
 * this and chosen to proceed anyway (see SECURITY_CHECKLIST.md 3c). To
 * limit exposure on our side, this code always requests a narrow, named
 * range scoped to the performance tab only — never a whole-spreadsheet
 * read — and never logs raw sheet contents.
 *
 * Needs (see .env.example):
 *   - GOOGLE_SHEETS_SPREADSHEET_ID
 *   - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 * Until all three are set, getContentMetrics() falls back to mock data
 * so the app still runs.
 */

const SHEET_TAB_NAME = process.env.GOOGLE_SHEETS_CONTENT_TAB || "[K-UNIV]성과";
const SHEET_RANGE = `'${SHEET_TAB_NAME}'!B3:L`;

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
  const [num, dateRaw, channelRaw, title, d1, d3, d7, likes, comments, shares] = row;
  if (!title || (typeof title === "string" && title.trim() === "")) return null;

  const publishedDate = parseSheetDate(dateRaw);
  const d7Views = parseMetricCell(d7);

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
  };
}

export async function getContentMetrics(): Promise<ContentMetric[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const auth = getAuth();

  if (!spreadsheetId || !auth) {
    // Not configured yet — keep the app usable on mock data.
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
