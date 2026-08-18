import { sql } from "./db";

/**
 * Availability control, distinct from budget.ts's cost control.
 * A budget cap protects total spend, it does not protect against a bot
 * exhausting an agent's capacity in minutes, staying technically within
 * the dollar ceiling the entire time. This is that separate mechanism.
 *
 * Fixed 60-second window, checked in middleware BEFORE a request reaches
 * Clerk or any API route. A blocked request costs nothing, no Supabase
 * query beyond this check, no Anthropic call, no wasted compute downstream.
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
