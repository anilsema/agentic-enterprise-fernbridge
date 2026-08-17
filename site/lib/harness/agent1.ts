import { sql } from "./db";
import { submitRequest } from "./intake";
import { routeRequest } from "./routing";
import { checkBudget, recordUsage, recordAgentOutcome, checkCircuitBreaker } from "./budget";

/**
 * A tiny simulated "knowledge base" standing in for real export-resource
 * matching logic. This is deliberately simple: the point of this build is
 * proving the governance pipeline (classify -> route -> budget-check ->
 * execute -> record), not building a real export-matching product.
 */
const EXPORT_RESOURCES: Record<string, string[]> = {
  agriculture: ["NZTE Agribusiness Programme", "MFAT Market Access Reports — Agriculture"],
  technology: ["NZTE Tech Sector Export Accelerator", "Callaghan Innovation Export Grants"],
  manufacturing: ["NZTE Manufacturing Export Network", "Export Credit Office — Manufacturing"],
};

function matchExportResources(queryKeyword: string): string[] {
  const key = queryKeyword.toLowerCase().trim();
  return EXPORT_RESOURCES[key] ?? ["General Export Starter Pack (NZTE)"];
}

export interface Agent1Result {
  requestId: string;
  tier: string;
  status: "executed" | "refused_budget" | "refused_not_low_tier";
  matchedResources?: string[];
  reason?: string;
}

/**
 * Agent 1 — Low tier, human-above-the-loop. Runs the full pipeline:
 * classify (intake) -> route (auto-approves at Low tier) -> budget check
 * (real-time, before execution) -> execute -> record usage and outcome.
 *
 * If ANY step disagrees with what Agent 1 is allowed to do (wrong tier,
 * over budget, circuit breaker tripped), it refuses rather than proceeding
 * anyway — this is Governance Principle A (Proportionality) and D
 * (Accountable Escalation) enforced in code, not just described in docs.
 */
export async function runAgent1(memberId: string | null, queryKeyword: string): Promise<Agent1Result> {
  // Get Agent 1's real id (seeded earlier)
  const [agent] = await sql`select id, active from agents where name = 'Agent 1 - Low Risk';`;
  if (!agent) throw new Error("Agent 1 not found — run seed-agents.ts first.");
  if (!agent.active) {
    return { requestId: "", tier: "low", status: "refused_budget", reason: "Agent 1 is inactive (circuit breaker previously tripped)." };
  }

  // 1. Classify
  const classified = await submitRequest(memberId, "membership", "match_export_resources");

  if (classified.tier !== "low") {
    // Should be structurally impossible given this task's catalog score, but
    // Agent 1 checks anyway rather than trusting the caller blindly.
    return { requestId: classified.requestId, tier: classified.tier, status: "refused_not_low_tier",
      reason: `Expected Low tier, got ${classified.tier}. Agent 1 only handles Low-tier work.` };
  }

  // 2. Route (auto-approves for Low tier, sets status='approved')
  await routeRequest(classified.requestId);

  // 3. Circuit breaker check — has Agent 1 been failing repeatedly?
  const cbCheck = await checkCircuitBreaker(agent.id);
  if (cbCheck.tripped) {
    return { requestId: classified.requestId, tier: "low", status: "refused_budget",
      reason: "Circuit breaker tripped during this run." };
  }

  // 4. Budget check BEFORE execution — real-time, not after the fact
  // Illustrative simulated-compute cost, deliberately smaller than Agent 3's
  // REAL measured Claude API cost (~$0.0003/call). Agent 1 does no actual AI
  // inference, this represents notional lookup/compute cost only. Kept below
  // the real AI call cost so the tokenomics dashboard tells a coherent story:
  // simple simulated tasks cost less than genuine model reasoning, not more.
  const estimatedCost = 0.00005;
  const budgetCheck = await checkBudget(agent.id, estimatedCost);
  if (!budgetCheck.allowed) {
    await recordAgentOutcome(agent.id, classified.requestId, "failure", { reason: "budget_exceeded" });
    return { requestId: classified.requestId, tier: "low", status: "refused_budget",
      reason: `Insufficient budget: $${budgetCheck.remainingBudget.toFixed(5)} remaining, needed $${estimatedCost.toFixed(5)}.` };
  }

  // 5. Execute the actual task
  const matchedResources = matchExportResources(queryKeyword);

  // 6. Record usage (real, even though the task itself is simulated) and mark the request executed
  await recordUsage(classified.requestId, agent.id, 40, estimatedCost);
  await sql`update requests set agent_id = ${agent.id}, status = 'executed', resolved_at = now() where id = ${classified.requestId};`;
  await recordAgentOutcome(agent.id, classified.requestId, "success", { matchedResources });

  return {
    requestId: classified.requestId,
    tier: "low",
    status: "executed",
    matchedResources,
  };
}
