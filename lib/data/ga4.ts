import { SignupSourceBreakdown, ConversionStats, DateRange } from "@/lib/types";
import { mockSignupSources, mockConversionStats } from "@/lib/mockData";

/**
 * GA4 Data API integration point.
 *
 * STATUS: NOT YET WIRED — needs:
 *   - GA4_PROPERTY_ID
 *   - GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *     (or GOOGLE_APPLICATION_CREDENTIALS json), granted Viewer on the
 *     property (read-only) — see SECURITY_CHECKLIST.md.
 *   - Confirmation of whether a `sign_up` conversion event is configured
 *     (OPEN_QUESTIONS.md item 3).
 *
 * When ready, use the official `@google-analytics/data` client:
 *   npm install @google-analytics/data
 * and run a runReport() call with dimensions like
 * sessionDefaultChannelGroup / sessionSource for 가입 유입경로, and
 * an event-count metric filtered to `sign_up` for 전환 성과.
 */
export async function getSignupSourceBreakdown(
  _range: DateRange
): Promise<SignupSourceBreakdown[]> {
  return mockSignupSources;
}

export async function getConversionStats(_range: DateRange): Promise<ConversionStats> {
  return mockConversionStats;
}
