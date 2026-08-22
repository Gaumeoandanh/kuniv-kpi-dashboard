// Shared types for the KPI dashboard.
// Mirrors the schema agreed in DATA_SOURCE_MAP.md.

export type DateRangePreset = "7d" | "30d" | "1y" | "thisMonth" | "custom";

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

/**
 * 채널별 "효율" — 총합이 아니라 게시물 1개당 평균. 총합 기준인
 * ChannelPerformance와 달리, 게시물을 많이 올린 채널이 무조건 유리해지는
 * 착시를 피하기 위한 지표. avgViews는 조회수가 아직 없는(D+7 미집계) 게시물을
 * 분모에서 제외하고 계산 — "종합 현황" 섹션의 채널별 효율 랭킹에서 사용.
 */
export interface ChannelEfficiency {
  channel: ContentChannel;
  postCount: number;
  avgViews: number | null; // 조회수 있는 게시물만 분모
  avgLikes: number | null;
  avgComments: number | null;
  avgShares: number | null;
  engagementRate: number | null; // (총 좋아요+댓글+공유) / 총 조회수, 조회수 0이면 null
}

/** 월별 콘텐츠 성과 합계 — "종합 현황"의 기간 비교 테이블에서 사용. */
export interface MonthlyContentSummary {
  month: string; // "YYYY-MM"
  totalPublished: number;
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
 * 전체 회원 목록 항목 — 이름 + 국가 + 가입일 + 계정상태 + 소속/직위
 * (이메일/여권명/전화번호 없음).
 * See lib/data/memberListSnapshot.json for the PII-exception note.
 *
 * affiliation은 K-UNIV admin의 소속/직위 컬럼 원본값 그대로 저장됨.
 * "-"(값 없음)이면 실제 회원(학생), 값이 있으면 학교 관계자/직원 계정으로
 * 간주 — see isStaffMember() in lib/data/kuniv.ts.
 */
export interface MemberListEntry {
  name: string;
  countryFlag: string;
  signupDate: string; // ISO date (YYYY-MM-DD)
  status: "정상" | "탈퇴";
  affiliation: string; // "-" = 소속 없음(실제 회원), 그 외 = 소속/직위 텍스트(관계자)
}

/** 월별 신규 가입자 수 — 전체 회원 목록 페이지의 "월별 신규 가입" 섹션에서 사용. */
export interface MonthlyMemberCount {
  month: string; // "YYYY-MM"
  count: number;
}

/**
 * 이번 달 신규 회원 목표 달성 현황 — "종합 현황"의 목표 진행률 카드에서 사용.
 * 목표(target)는 사람이 입력하는 값이 아니라 "바로 전월의 실제 신규 회원 수"로
 * 자동 계산됨 (2026-08-15, 계정 owner 결정) — 데이터가 갱신될 때마다 목표도
 * 같이 자동으로 갱신되고, 별도로 관리할 설정 파일이 없음.
 */
export interface MonthlyGoalStatus {
  month: string; // "YYYY-MM" — 이번 달
  target: number; // = 전월 실제 신규 회원 수
  actual: number; // 이번 달 실제 신규 회원 수 (현재까지)
  achievementPercent: number | null; // actual/target*100, target이 0이면 null
}

/** 국가별(countryFlag) 회원 수 — UserSection 파이 차트 + PDF 보고서에서 공용. */
export interface CountryCount {
  countryFlag: string;
  count: number;
}
