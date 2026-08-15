import fs from "fs";
import path from "path";
import { UserStats, MemberListEntry, MonthlyMemberCount } from "@/lib/types";

type MemberListSnapshot = {
  fetchedAt: string;
  members: MemberListEntry[];
};

const SNAPSHOT_PATH = path.join(process.cwd(), "lib/data/memberListSnapshot.json");

/**
 * memberListSnapshot.json을 매 호출마다 디스크에서 새로 읽어온다.
 *
 * 2026-08-11 변경: 예전에는 `import memberListSnapshot from "...json"`으로
 * 빌드 타임에 번들에 박아 넣었기 때문에, 크롤링 후 JSON 파일만 갱신해도
 * `npm run build`(=Netlify 재배포) 전까지는 화면에 반영되지 않았다. 이제는
 * 요청마다 fs로 다시 읽으므로 — 로컬 `npm run dev`에서는 JSON 파일을 저장하는
 * 즉시, 페이지를 새로고침만 해도 "월별 신규 가입" 수치와 성장률 코멘트가
 * 곧바로 최신 값으로 다시 계산된다 (별도 재시작/재빌드 불필요).
 *
 * 단, Netlify처럼 빌드 산출물을 그대로 배포하는 서버리스 환경에서는 이
 * 파일도 배포 번들에 같이 굳어버리므로, "배포된 사이트"에 새 데이터를
 * 반영하려면 여전히 JSON을 갱신 → git push → Netlify 재배포가 필요하다.
 * 이 변경은 그 워크플로를 없애는 게 아니라, 로컬에서 확인할 때 재시작 없이
 * 바로바로 최신 숫자를 보기 위한 것.
 */
function loadSnapshot(): MemberListSnapshot {
  const raw = fs.readFileSync(SNAPSHOT_PATH, "utf8");
  return JSON.parse(raw) as MemberListSnapshot;
}

/**
 * K-UNIV admin의 소속/직위 컬럼 기준 분류.
 * "-"(값 없음) = 실제 회원(학생). 그 외 텍스트가 있으면 학교 관계자/직원
 * 계정으로 간주한다 (예: "국제교류처/담당", "입학처 / 입학홍보팀장" 등).
 * 2026-07-31, 계정 owner 요청으로 도입 — 사용자 KPI 수치에 학교 관계자가
 * 섞여서 집계되는 문제를 해결하기 위함.
 */
export function isStaffMember(m: MemberListEntry): boolean {
  const a = m.affiliation?.trim();
  return !!a && a !== "-";
}

function getAllMembers(): MemberListEntry[] {
  return loadSnapshot().members;
}

function getRealMembersSync(): MemberListEntry[] {
  return getAllMembers().filter((m) => !isStaffMember(m));
}

/** fetchedAt 기준 최근 30일 (그날 포함) 날짜 문자열 목록, 오래된 순 — 일별 추이 차트용. */
function last30DaysWindow(fetchedAt: string): string[] {
  const asOf = new Date(fetchedAt);
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(asOf);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/**
 * fetchedAt 기준 "이번 달" (달력 월, 예: "2026-08"). 2026-08-03 계정 owner
 * 요청으로 도입 — 기존에는 최근 30일 롤링 윈도우로 계산해서 7월+8월 신규
 * 가입이 섞여 보이는 문제가 있었음. 이제 진짜 달력 월 기준으로만 집계한다.
 */
function currentMonthPrefix(fetchedAt: string): string {
  return fetchedAt.slice(0, 7); // "YYYY-MM"
}

/**
 * 사용자 (member) stats — 실제 회원(학생)만 집계, 학교 관계자 제외.
 *
 * STATUS: manual snapshot, not a live connection.
 *
 * Per IMPLEMENTATION_PLAN.md, member data has 3 possible sources:
 *   A. K-UNIV API (read-only token)      — checked 2026-07-26, does not
 *      exist (no API key/token feature under 시스템 설정 in K-UNIV admin).
 *   B. Admin CSV/Excel export             — not confirmed available.
 *   C. Browser automation on admin panel  — used manually to read the
 *      numbers below. This must stay a manual, human-in-the-loop action
 *      (a person is logged into the admin panel on screen) — this code
 *      must never store or automate admin credentials, see
 *      SECURITY_CHECKLIST.md 3b.
 *
 * 2026-07-31부터: 전체 회원/활성/신규/탈퇴/일별 가입 추이 모두
 * lib/data/memberListSnapshot.json 하나에서 파생 계산한다 (기존
 * userSnapshot.json / dailySignupsSnapshot.json은 더 이상 읽지 않음 —
 * 두 파일은 과거 기록용으로만 남겨둠). 계산 시 학교 관계자
 * (isStaffMember() === true) 계정은 전부 제외한다.
 */
export async function getUserStats(): Promise<UserStats> {
  const snapshot = loadSnapshot();
  const real = snapshot.members.filter((m) => !isStaffMember(m));

  const totalMembers = real.length;
  const activeMembers = real.filter((m) => m.status === "정상").length;
  const churnedMembers = real.filter((m) => m.status === "탈퇴").length;

  const days = last30DaysWindow(snapshot.fetchedAt);
  const countByDate = new Map<string, number>(days.map((d) => [d, 0]));
  for (const m of real) {
    if (countByDate.has(m.signupDate)) {
      countByDate.set(m.signupDate, (countByDate.get(m.signupDate) ?? 0) + 1);
    }
  }
  const dailySignups = days.map((date) => ({ date, count: countByDate.get(date) ?? 0 }));

  // "이번 달 신규 회원" — 달력 월 기준 (예: 8월이면 8월 가입자만), 30일 롤링
  // 윈도우가 아님. dailySignups(차트용)와는 별개 계산.
  const monthPrefix = currentMonthPrefix(snapshot.fetchedAt);
  const newMembersThisMonth = real.filter((m) => m.signupDate.startsWith(monthPrefix)).length;

  return {
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    churnedMembers,
    dailySignups,
    isLive: true,
    source: "kuniv_admin",
    fetchedAt: snapshot.fetchedAt,
  };
}

/**
 * 전체 회원 목록 (실제 회원 + 학교 관계자 전부) — see
 * lib/data/memberListSnapshot.json.
 *
 * PII EXCEPTION: every other function in this file returns aggregate
 * numbers only. This one returns per-member names, which the project's
 * standing rule normally forbids — the account owner explicitly asked
 * for this feature and confirmed accepting that tradeoff (2026-07-29).
 * Do not add email, passport name, or phone number here.
 */
export async function getMemberList(): Promise<MemberListEntry[]> {
  return getAllMembers();
}

/** 실제 회원(학생)만 — 소속/직위가 "-"인 계정. */
export async function getRealMembers(): Promise<MemberListEntry[]> {
  return getRealMembersSync();
}

/** 학교 관계자/직원 계정만 — 소속/직위 값이 있는 계정. */
export async function getStaffMembers(): Promise<MemberListEntry[]> {
  return getAllMembers().filter(isStaffMember);
}

/**
 * 이번 달 신규 회원 (실제 회원 중 fetchedAt 기준 달력 월 가입) —
 * "이번 달 신규 회원" 카드 클릭 시 표시되는 목록. UserStats.newMembersThisMonth
 * 와 동일한 달력 월 기준으로 계산하므로 카드 숫자와 리스트 인원수가 항상 일치.
 */
export async function getNewMembersThisMonth(): Promise<MemberListEntry[]> {
  const snapshot = loadSnapshot();
  const monthPrefix = currentMonthPrefix(snapshot.fetchedAt);
  return snapshot.members
    .filter((m) => !isStaffMember(m))
    .filter((m) => m.signupDate.startsWith(monthPrefix))
    .sort((a, b) => b.signupDate.localeCompare(a.signupDate));
}

/**
 * 월별 신규 가입 회원 수 (실제 회원만) — 전체 회원 목록 페이지의
 * "월별 신규 가입" 섹션에서 사용. 최신 월이 먼저 오도록 정렬.
 * 2026-08-03 계정 owner 요청으로 추가.
 *
 * 매 호출마다 memberListSnapshot.json을 새로 읽어오므로(loadSnapshot 참고),
 * 크롤링 후 JSON만 갱신해도 이 값과 members/page.tsx의 성장률 코멘트가
 * 자동으로 최신 데이터를 반영한다.
 */
export async function getMemberCountsByMonth(): Promise<MonthlyMemberCount[]> {
  const real = getRealMembersSync();
  const countByMonth = new Map<string, number>();
  for (const m of real) {
    const month = m.signupDate.slice(0, 7); // "YYYY-MM"
    countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
  }
  return Array.from(countByMonth.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * 특정 달(YYYY-MM)에 가입한 실제 회원 목록 — "월별 신규 가입"에서 특정
 * 월을 클릭했을 때 보여주는 목록. 최신 가입순 정렬.
 */
export async function getMembersByMonth(month: string): Promise<MemberListEntry[]> {
  return getRealMembersSync()
    .filter((m) => m.signupDate.startsWith(month))
    .sort((a, b) => b.signupDate.localeCompare(a.signupDate));
}

/**
 * 탈퇴한 실제 회원 목록 — "탈퇴" 카드 클릭 시 표시되는 목록.
 * UserStats.churnedMembers 와 동일 기준(실제 회원 + status === "탈퇴").
 */
export async function getChurnedMembers(): Promise<MemberListEntry[]> {
  return getRealMembersSync()
    .filter((m) => m.status === "탈퇴")
    .sort((a, b) => b.signupDate.localeCompare(a.signupDate));
}
