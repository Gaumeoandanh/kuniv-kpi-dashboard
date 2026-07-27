import { UserStats } from "@/lib/types";
import snapshot from "@/lib/data/userSnapshot.json";
import dailySnapshot from "@/lib/data/dailySignupsSnapshot.json";

/**
 * 사용자 (member) stats.
 *
 * STATUS: manual snapshot, not a live connection.
 *
 * Per IMPLEMENTATION_PLAN.md, member data has 3 possible sources:
 *   A. K-UNIV API (read-only token)      — checked 2026-07-26, does not
 *      exist (no API key/token feature under 시스템 설정 in K-UNIV admin).
 *   B. Admin CSV/Excel export             — not confirmed available.
 *   C. Browser automation on admin panel  — used manually on 2026-07-26
 *      and again on 2026-07-27 to read the numbers below. This must stay
 *      a manual, human-in-the-loop action (a person is logged into the
 *      admin panel on screen) — this code must never store or automate
 *      admin credentials, see SECURITY_CHECKLIST.md 3b.
 *
 * So headline numbers below come from lib/data/userSnapshot.json, a
 * small checked-in file with a timestamp — real data, just not live.
 * To refresh: ask Claude to "refresh user stats", which re-opens the
 * K-UNIV admin dashboard (read-only) and updates userSnapshot.json.
 *
 * The daily signup curve now comes from lib/data/dailySignupsSnapshot.json
 * — pulled on 2026-07-27 from 회원 관리 > 전체 회원 목록 using the 가입
 * 기간 (signup date) filter, counting rows per day. Only the per-day
 * COUNT was recorded; no member names/emails were extracted or stored,
 * per the no-PII rule. This replaces the old illustrative/random mock
 * curve — see CHANGELOG note in that file for how to refresh it.
 */
export async function getUserStats(): Promise<UserStats> {
    return {
          totalMembers: snapshot.totalMembers,
          activeMembers: snapshot.activeMembers,
          newMembersThisMonth: snapshot.newMembersThisMonth,
          churnedMembers: snapshot.churnedMembers,
          dailySignups: dailySnapshot.dailySignups,
          isLive: true,
          source: "kuniv_admin",
          fetchedAt: snapshot.fetchedAt,
    };
}
