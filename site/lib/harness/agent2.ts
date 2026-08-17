import { sql } from "./db";
import { submitRequest } from "./intake";
import { routeRequest } from "./routing";
import { checkBudget, recordUsage, recordAgentOutcome, checkCircuitBreaker } from "./budget";

/**
 * Agent 2 — Medium tier, human-in-the-loop.
 *
 * Unlike Agent 1 (Low, human-above-the-loop, fully autonomous within budget),
 * Agent 2 CANNOT complete a request in a single call. It proposes, then a
 * human approver must act, then (if approved) it executes. This is the
 * Medium-tier oversight model made concrete in code, not just described.
 *
 * IMPORTANT governance distinction: a human REJECTING a proposal is the
 * system working correctly, not an agent failure. It must never be recorded
 * as 'failure' or counted toward the circuit breaker, that would punish the
 * agent for being appropriately gated. Rejections get their own event type.
 */

const RENEWAL_TIERS: Record<string, number> = {
  standard: 450,
  premium: 950,
  export: 1400,
};

function calculateRenewalAmount(memberTier: string): number {
  return RENEWAL_TIERS[memberTier.toLowerCase()] ?? RENEWAL_TIERS.standard;
}

/**
 * IMPORTANT — two unrelated numbers appear in this file, easy to conflate:
 *
 *   proposedAmount (e.g. $950)  — the BUSINESS TRANSACTION amount, what the
 *     member is actually charged for their renewal. This is what the human
 *     approver (Membership and Export Manager) is reviewing and approving
 *     or rejecting. It has nothing to do with running cost.
 *
 *   estimatedCost (e.g. $0.03) — the AGENT'S OWN OPERATING cost, tracked
 *     separately against the agent's tokenomics budget cap (see budget.ts).
 *     This check happens automatically during execution and is invisible
 *     to the human approver, who never sees or approves this figure.
 *
 * Approving a proposal means "yes, charge this member $950", not "yes,
 * spend $0.03 of agent budget." Keep these two figures conceptually and
 * visually separate anywhere this file is read or extended.
 */

export interface ProposeResult {
  requestId: string;
  tier: string;
  status: "pending_approval" | "refused_not_medium_tier";
  pendingApprover?: string;
  proposedAmount?: number;
  reason?: string;
}

/** Phase 1: classify, route, and produce a pending proposal awaiting approval. */
export async function proposeRenewal(
  memberId: string | null,
  memberTierForBilling: string
): Promise<ProposeResult> {
  const classified = await submitRequest(memberId, "membership", "process_renewal");

  if (classified.tier !== "medium") {
    return {
      requestId: classified.requestId,
      tier: classified.tier,
      status: "refused_not_medium_tier",
      reason: `Expected Medium tier, got ${classified.tier}. Agent 2 only handles Medium-tier work.`,
    };
  }

  const routing = await routeRequest(classified.requestId);
  const proposedAmount = calculateRenewalAmount(memberTierForBilling);

  // Stash the proposed amount so approveAndExecute can act on the SAME figure
  // the approver actually saw, rather than recalculating (and potentially
  // drifting) at execution time.
  await sql`
    insert into audit_log (request_id, event_type, actor, detail)
    values (${classified.requestId}, 'proposal_created', 'system',
      ${sql.json({ proposedAmount, memberTierForBilling })});
  `;

  return {
    requestId: classified.requestId,
    tier: "medium",
    status: "pending_approval",
    pendingApprover: routing.approversAssigned[0],
    proposedAmount,
  };
}

export interface ApprovalOutcome {
  requestId: string;
  decision: "approved" | "rejected";
  executed: boolean;
  reason?: string;
}

/** Phase 2: a human approver acts on the proposal. Only proceeds to execution if approved. */
export async function actOnProposal(
  requestId: string,
  approverRole: string,
  decision: "approved" | "rejected"
): Promise<ApprovalOutcome> {
  const [approval] = await sql`
    select id, approver_role, decision as existing_decision
    from approvals
    where request_id = ${requestId} and approval_sequence = 1;
  `;

  if (!approval) {
    throw new Error(`No pending Medium-tier approval found for request ${requestId}.`);
  }
  if (approval.existing_decision) {
    throw new Error(`Request ${requestId} already has a recorded decision: ${approval.existing_decision}.`);
  }

  await sql`
    update approvals set decision = ${decision}, decided_at = now()
    where id = ${approval.id};
  `;

  if (decision === "rejected") {
    // This is NOT a failure. Distinct event type, does not feed the circuit breaker.
    await sql`update requests set status = 'rejected', resolved_at = now() where id = ${requestId};`;
    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (${requestId}, 'proposal_rejected_by_human', ${approverRole},
        ${sql.json({ approverRole })});
    `;
    return { requestId, decision: "rejected", executed: false };
  }

  // Approved — proceed to execution, same budget/circuit-breaker discipline as Agent 1.
  const [agent] = await sql`select id, active from agents where name = 'Agent 2 - Medium Risk';`;
  if (!agent) throw new Error("Agent 2 not found — run seed-agents.ts first.");
  if (!agent.active) {
    return { requestId, decision: "approved", executed: false, reason: "Agent 2 is inactive (circuit breaker previously tripped)." };
  }

  const cbCheck = await checkCircuitBreaker(agent.id);
  if (cbCheck.tripped) {
    return { requestId, decision: "approved", executed: false, reason: "Circuit breaker tripped during this run." };
  }

  // Illustrative simulated-compute cost. Higher than Agent 1's (one extra
  // governance step: the approval gate itself), but still deliberately below
  // Agent 3's REAL measured Claude API cost (~$0.0003/call) — see agent1.ts
  // for the full reasoning on why this ordering matters for the dashboard.
  const estimatedCost = 0.0001;
  const budgetCheck = await checkBudget(agent.id, estimatedCost);
  if (!budgetCheck.allowed) {
    await recordAgentOutcome(agent.id, requestId, "failure", { reason: "budget_exceeded" });
    return {
      requestId, decision: "approved", executed: false,
      reason: `Insufficient budget: $${budgetCheck.remainingBudget.toFixed(5)} remaining.`,
    };
  }

  await recordUsage(requestId, agent.id, 60, estimatedCost);
  await sql`update requests set agent_id = ${agent.id}, status = 'executed', resolved_at = now() where id = ${requestId};`;
  await recordAgentOutcome(agent.id, requestId, "success", { approverRole });

  return { requestId, decision: "approved", executed: true };
}
