import {
  UserStats,
  SignupSourceBreakdown,
  ContentMetric,
  ConversionStats,
} from "@/lib/types";

// ---------------------------------------------------------------------
// MOCK DATA — placeholders only, shaped like real K-UNIV data so the UI
// can be built/reviewed before live data sources (Sheets/GA4/K-UNIV API)
// are wired up. Replace by editing lib/data/*.ts once credentials from
// OPEN_QUESTIONS.md are confirmed.
//
// 사용자 numbers below match the real K-UNIV admin dashboard as observed
// manually on 2026-07-26 (전체 회원 55 / 신규 30일 +26 / 탈퇴 0); the
// daily breakdown and everything else is synthetic sample data.
// ---------------------------------------------------------------------

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const days30 = lastNDays(30);

export const mockUserStats: UserStats = {
  totalMembers: 55,
  activeMembers: 55,
  newMembersThisMonth: 26,
  churnedMembers: 0,
  dailySignups: days30.map((date, i) => ({
    date,
    count: Math.max(0, Math.round(1 + Math.sin(i / 3) * 1.5 + (i > 25 ? 3 : 0))),
  })),
  isLive: false,
  source: "mock",
  fetchedAt: new Date().toISOString(),
};

export const mockSignupSources: SignupSourceBreakdown[] = [
  { source: "구글", count: 18 },
  { source: "직접유입", count: 14 },
  { source: "인스타그램", count: 9 },
  { source: "네이버", count: 6 },
  { source: "틱톡", count: 4 },
  { source: "스레드", count: 2 },
  { source: "chatgpt.com", count: 1 },
  { source: "기타 외부", count: 1 },
];

const sampleTitles = [
  "한국 유학생 알바 최저임금 총정리",
  "TOPIK 신청 일정 안내",
  "어학원 vs 대학 부속 어학당 비교",
  "장학금 신청 꿀팁 5가지",
  "기숙사 있는 대학 모음",
  "D-2 비자 서류 체크리스트",
  "졸업 후 E-7 취업 비자 가이드",
  "서울 어학원 학비 비교",
];

const channelsRaw = ["Instagram", "틱톡", "Threads", "페이스북", "instagram"];

export const mockContentRows: ContentMetric[] = Array.from({ length: 24 }).map((_, i) => {
  const daysAgo = i * 2;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const publishedDate = date.toISOString().slice(0, 10);
  const complete = daysAgo >= 7;
  const d7 = complete ? 500 + Math.round(Math.random() * 4000) : null;

  return {
    id: `row-${i}`,
    publishedDate,
    channel: (["instagram", "tiktok", "threads", "facebook"] as const)[i % 4],
    channelRaw: channelsRaw[i % channelsRaw.length],
    title: sampleTitles[i % sampleTitles.length],
    views: {
      d1: complete || daysAgo >= 1 ? 100 + Math.round(Math.random() * 800) : null,
      d3: complete || daysAgo >= 3 ? 300 + Math.round(Math.random() * 1500) : null,
      d7,
    },
    likesD7: complete ? Math.round((d7 ?? 0) * 0.05) : null,
    commentsD7: complete ? Math.round((d7 ?? 0) * 0.01) : null,
    sharesD7: complete ? Math.round((d7 ?? 0) * 0.02) : null,
    primaryViews: d7,
    isDataComplete: complete,
  };
});

export const mockConversionStats: ConversionStats = {
  websiteVisits: 4820,
  newSignups: 26,
  conversionRate: 26 / 4820,
  byChannel: [
    { channel: "구글", visits: 1800, signups: 10, conversionRate: 10 / 1800 },
    { channel: "직접유입", visits: 1100, signups: 6, conversionRate: 6 / 1100 },
    { channel: "인스타그램", visits: 900, signups: 5, conversionRate: 5 / 900 },
    { channel: "네이버", visits: 600, signups: 3, conversionRate: 3 / 600 },
    { channel: "틱톡", visits: 420, signups: 2, conversionRate: 2 / 420 },
  ],
};
