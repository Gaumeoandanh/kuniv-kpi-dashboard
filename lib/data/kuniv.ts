import { UserStats, MemberListEntry } from "@/lib/types";
import memberListSnapshot from "@/lib/data/memberListSnapshot.json";

const ALL_MEMBERS: MemberListEntry[] = memberListSnapshot.members as MemberListEntry[];

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
  const real = ALL_MEMBERS.filter((m) => !isStaffMember(m));
  const asOf = new Date(memberListSnapshot.fetchedAt);

  const totalMembers = real.length;
  const activeMembers = real.filter((m) => m.status === "정상").length;
  const churnedMembers = real.filter((m) => m.status === "탈퇴").length;

  // fetchedAt 기준 최근 30일 (그날 포함) 일별 신규 가입 추이.
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(asOf);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const countByDate = new Map<string, number>(days.map((d) => [d, 0]));
  for (const m of real) {
    if (countByDate.has(m.signupDate)) {
      countByDate.set(m.signupDate, (countByDate.get(m.signupDate) ?? 0) + 1);
    }
  }
  const dailySignups = days.map((date) => ({ date, count: countByDate.get(date) ?? 0 }));
  const newMembersThisMonth = dailySignups.reduce((sum, p) => sum + p.count, 0);

  return {
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    churnedMembers,
    dailySignups,
    isLive: true,
    source: "kuniv_admin",
    fetchedAt: memberListSnapshot.fetchedAt,
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
  return ALL_MEMBERS;
}

/** 실제 회원(학생)만 — 소속/직위가 "-"인 계정. */
export async function getRealMembers(): Promise<MemberListEntry[]> {
  return ALL_MEMBERS.filter((m) => !isStaffMember(m));
}

/** 학교 관계자/직원 계정만 — 소속/직위 값이 있는 계정. */
export async function getStaffMembers(): Promise<MemberListEntry[]> {
  return ALL_MEMBERS.filter(isStaffMember);
}
