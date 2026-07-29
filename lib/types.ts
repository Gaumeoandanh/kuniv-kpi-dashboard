// Shared types for the KPI dashboard.
// Mirrors the schema agreed in DATA_SOURCE_MAP.md.

export type DateRangePreset = "7d" | "30d" | "thisMonth" | "custom";

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}

/** Section 1 — 사용자 */
export interface UserStats {
  totalMembers: number; // 전체 회원
  activeMembers: number; // 활성
  newMembersThisMonth: number; // 이번 달 신규 회원
  churnedMembers: number; // 탈퇴
  dailySignups: { date: string; count: number }[]; // 신규 회원 theo ngày
  isLive: boolean; // true nếu lấy từ nguồn thật, false nếu mock
  source: "kuniv_admin" | "kuniv_api" | "mock";
  fetchedAt: string; // ISO timestamp
}

/** 가입 유입경로 */
export interface SignupSourceBreakdown {
  source: string; // "구글" | "직접유입" | "네이버" | ... (dynamic, không hard-code enum)
  count: number;
}

/** Content log (Google Sheets) — chuẩn hóa */
export type ContentChannel =
  | "instagram"
  | "tiktok"
  | "threads"
  | "facebook"
  | "other";

export interface ContentMetric {
  id: string;
  publishedDate: string; // ISO date
  channel: ContentChannel;
  channelRaw: string;
  title: string;
  views: {
    d1: number | null;
    d3: number | null;
    d7: number | null;
  };
  likesD7: number | null;
  commentsD7: number | null;
  sharesD7: number | null;
  primaryViews: number | null; // = views.d7
  isDataComplete: boolean; // >= 7 ngày kể từ publishedDate
  link: string | null; // 원본 게시물 링크 (sheet 컬럼 L)
}

export interface ContentSummary {
  totalPublished: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

export type BestContentMetricKey = "views" | "likes" | "comments" | "shares";

export interface ChannelPublishCount {
  channel: ContentChannel;
  count: number;
}

export interface ChannelPerformance {
  channel: ContentChannel;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

/** 전환 성과 */
export interface ConversionStats {
  websiteVisits: number;
  newSignups: number;
  conversionRate: number; // 0..1
  byChannel?: {
    channel: string;
    visits: number;
    signups: number;
    conversionRate: number;
  }[];
}

export interface DailyViewPoint {
  date: string;
  views: number;
}

/**
 * 전체 회원 목록 항목 — 이름 + 국가 + 가입일 (이메일/여권명/전화번호 없음).
 * See lib/data/memberListSnapshot.json for the PII-exception note.
 */
export interface MemberListEntry {
  name: string;
  countryFlag: string;
  signupDate: string; // ISO date (YYYY-MM-DD)
}
