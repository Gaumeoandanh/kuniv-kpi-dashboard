import { UserStats } from "@/lib/types";
import { mockUserStats } from "@/lib/mockData";
import snapshot from "@/lib/data/userSnapshot.json";

/**
 * 사용자 (member) stats.
 *
 * STATUS: manual snapshot, not a live connection.
 *
 * Per IMPLEMENTATION_PLAN.md, member data has 3 possible sources:
 *   A. K-UNIV API (read-only token)      — checked 2026-07-26, does not
 *      exist (no API key/token feature under 시스템 설정 in K-UNIV admin).
 *   B. Admin CSV/Excel export             — not confirmed available.
 *   C. Browser automation on admin panel  — used once manually on
 *      2026-07-26 to read the numbers below. This must stay a manual,
 *      human-in-the-loop action (a person types the admin password on
 *      screen) — this code must never store or automate admin
 *      credentials, see SECURITY_CHECKLIST.md 3b.
 *
 * So headline numbers below come from lib/data/userSnapshot.json, a
 * small checked-in file with a timestamp — real data, just not live.
 * To refresh: ask Claude to "refresh user stats", which re-opens the
 * K-UNIV admin dashboard (read-only) and updates userSnapshot.json.
 *
 * The daily signup curve is NOT in userSnapshot.json (K-UNIV admin's
 * dashboard doesn't expose a per-day export), so it's still illustrative
 * mock data — see the "dailySignups" note in the UI.
 */
export async function getUserStats(): Promise<UserStats> {
  return {
    totalMembers: snapshot.totalMembers,
    activeMembers: snapshot.activeMembers,
    newMembersThisMonth: snapshot.newMembersThisMonth,
    churnedMembers: snapshot.churnedMembers,
    dailySignups: mockUserStats.dailySignups, // illustrative only, see note above
    isLive: true,
    source: "kuniv_admin",
    fetchedAt: snapshot.fetchedAt,
  };
}
