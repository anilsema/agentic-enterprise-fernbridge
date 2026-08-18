import { sql } from "./db";

/**
 * Availability control, distinct from budget.ts's cost control.
 * A budget cap protects total spend, it does not prevent rapid exhaustion,
 * staying technically within the dollar ceiling the whole time. This is
 * that separate mechanism.
 *
 * This is a SLIDING WINDOW LOG, not a fixed window, worth being precise
 * about the distinction: a fixed window buckets by wall-clock boundaries
 * and resets the count at each one, which allows a burst-at-the-boundary
 * flaw (e.g. 20 requests at :59 and 20 more at :01 of the next bucket,
 * 40 requests in 2 real seconds). Querying `occurred_at > now() - N seconds`
 * continuously slides with the current instant and has no such flaw. The
 * cost of that correctness is storing one row per event rather than a
 * single counter, which is why this table has individual rows, not a
 * counter column.
 *
 * Known limitation, not fixed here: checkRateLimit is two round-trips
 * (a read, then a write), not atomic, so a genuine TOCTOU race is
 * possible under real concurrent load. Not worth closing at this
 * traffic scale; the fix would be a single atomic conditional INSERT
 * or UPDATE ... WHERE clause rather than check-then-write.
 */

const WINDOW_SECONDS = 60;
const THRESHOLD = 20; // requests per identifier per window

export interface RateLimitResult {
  allowed: boolean;
  count: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  // Opportunistic cleanup, keeps the table small without needing a separate cron job.
  await sql`delete from rate_limit_events where occurred_at < now() - interval '1 hour';`;

  const [{ count }] = await sql`
    select count(*)::int as count
    from rate_limit_events
    where identifier = ${identifier}
      and occurred_at > now() - (${WINDOW_SECONDS} * interval '1 second');
  `;

  if (count >= THRESHOLD) {
    return { allowed: false, count };
  }

  await sql`insert into rate_limit_events (identifier) values (${identifier});`;
  return { allowed: true, count: count + 1 };
}
