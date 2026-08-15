import { sql } from "./db";

/**
 * Metering and Rate-Limiting pattern (see Study Companion, section 2).
 * Real-time, not after-the-fact: checkBudget is called BEFORE an agent is
 * allowed to execute, not just logged afterward for a report someone reads
 * later. This was a requirement that came from a real gap noticed mid-build
 * (no live visibility into usage while working) — see build-plan.md.
 */

export interface BudgetCheckResult {
  allowed: boolean;
  agentId: string;
  budgetCap: number;
  spendToDate: number;
  remainingBudget: number;
  estimatedCost: number;
}

/** Check whether an agent has enough remaining budget for an estimated-cost action, BEFORE it runs. */
export async function checkBudget(agentId: string, estimatedCost: number): Promise<BudgetCheckResult> {
  const [status] = await sql`
    select budget_cap, spend_to_date, remaining_budget
    from v_agent_budget_status
    where agent_id = ${agentId};
  `;

  if (!status) {
    throw new Error(`No budget status found for agent ${agentId}. Does this agent exist in the agents table?`);
  }

  const remaining = Number(status.remaining_budget);
  const allowed = remaining >= estimatedCost;

  return {
    allowed,
    agentId,
    budgetCap: Number(status.budget_cap),
    spendToDate: Number(status.spend_to_date),
    remainingBudget: remaining,
    estimatedCost,
  };
}

/** Record actual usage after an agent action executes. Real-time: the view reflects this immediately on next read. */
export async function recordUsage(
  requestId: string,
  agentId: string,
  tokensUsed: number,
  costUsd: number
): Promise<void> {
  await sql`
    insert into token_usage (request_id, agent_id, tokens_used, cost_usd)
    values (${requestId}, ${agentId}, ${tokensUsed}, ${costUsd});
  `;

  await sql`
    insert into audit_log (request_id, event_type, actor, detail)
    values (${requestId}, 'token_usage_recorded', 'system',
      ${sql.json({ agentId, tokensUsed, costUsd })});
  `;
}

// ── Circuit breaker ──────────────────────────────────────────
// See Study Companion, section 1: if an agent fails repeatedly, the harness
// stops routing to it rather than retrying into a failure loop.

const CIRCUIT_BREAKER_CONSECUTIVE_FAILURE_THRESHOLD = 3;

export async function recordAgentOutcome(
  agentId: string,
  requestId: string,
  outcome: "success" | "failure",
  detail?: Record<string, unknown>
): Promise<void> {
  await sql`
    insert into audit_log (request_id, event_type, actor, detail)
    values (${requestId}, ${"agent_outcome_" + outcome}, 'agent',
      ${sql.json({ agentId, outcome, ...detail })});
  `;
}

export interface CircuitBreakerCheck {
  tripped: boolean;
  agentId: string;
  consecutiveFailures: number;
}

/**
 * Look at this agent's most recent outcomes (regardless of request), most-recent-first.
 * If the last N are ALL failures, trip the breaker: deactivate the agent and log it.
 * A single success anywhere in the recent window resets the count to zero, that's
 * what "consecutive" means here, not just a raw failure tally.
 */
export async function checkCircuitBreaker(agentId: string): Promise<CircuitBreakerCheck> {
  const recentOutcomes = await sql`
    select event_type
    from audit_log
    where detail->>'agentId' = ${agentId}
      and event_type in ('agent_outcome_success', 'agent_outcome_failure')
    order by occurred_at desc
    limit ${CIRCUIT_BREAKER_CONSECUTIVE_FAILURE_THRESHOLD};
  `;

  const consecutiveFailures = (() => {
    let count = 0;
    for (const row of recentOutcomes) {
      if (row.event_type === "agent_outcome_failure") count++;
      else break; // a success breaks the streak
    }
    return count;
  })();

  const tripped = consecutiveFailures >= CIRCUIT_BREAKER_CONSECUTIVE_FAILURE_THRESHOLD;

  if (tripped) {
    await sql`update agents set active = false where id = ${agentId};`;
    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (null, 'circuit_breaker_tripped', 'system',
        ${sql.json({ agentId, consecutiveFailures })});
    `;
  }

  return { tripped, agentId, consecutiveFailures };
}
