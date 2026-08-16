import { sql } from "./db";
import { submitRequest } from "./intake";
import { routeRequest } from "./routing";
import { checkBudget, recordUsage, recordAgentOutcome, checkCircuitBreaker } from "./budget";
import { getAdviceLineGuidanceFromClaude, WORST_CASE_ESTIMATED_COST } from "./claude-client";

/**
 * Agent 3 — High tier, human-in-the-loop with DUAL confirmation.
 *
 * The most consequential tier: two independent approvals required, in
 * sequence, before execution. This is not two people signing off in any
 * order, it is a real chain: sequence=2 cannot be actioned until sequence=1
 * is recorded as 'approved'. A rejection at either step stops the whole
 * thing, even if the other approver hasn't acted yet.
 *
 * Task used: answer_adviceline_query. Real ER/HR advisory guidance given
 * incorrectly can expose a member business to a Personal Grievance claim,
 * which is exactly why this sits at Legal Counsel + Head of Legal, not a
 * lower tier. See docs/governance-framework.md and the risk-scoring
 * worksheet notes on this task.
 *
 * This is the ONE agent in the build that makes a real Claude API call
 * (Haiku 4.5, hard output cap, conservative pre-call budget check using a
 * worst-case estimate, actual measured cost recorded after the call
 * returns). Agents 1 and 2 use simulated task logic deliberately, see
 * README for the reasoning on why only this tier gets a live model call.
 */

const ADVICE_TOPICS: Record<string, string> = {
  restructuring: "Restructuring guidance requires a documented business case, genuine consultation, and a fair process. Escalate to Legal for case-specific review before advising the member further.",
  dismissal: "Dismissal guidance requires confirmation that a fair process was followed (notice, investigation, opportunity to respond). High Personal Grievance risk if process was not followed. Escalate to Legal for case-specific review.",
  "personal grievance": "A Personal Grievance claim has been raised or is anticipated. This requires direct Legal Counsel involvement, not general guidance. Do not provide advice beyond acknowledging receipt and confirming escalation.",
};

/**
 * Offline fallback only — used by validation/tests that don't have a live
 * ANTHROPIC_API_KEY, not invoked automatically if the real API call fails.
 * A real API failure should surface as a genuine 'failure' outcome (see
 * actOnDualApproval below), not be silently papered over with canned text,
 * that would misrepresent what actually happened.
 */
function getFallbackAdviceGuidance(topicKeyword: string): string {
  const key = topicKeyword.toLowerCase().trim();
  return ADVICE_TOPICS[key] ?? "General employment relations query. Standard AdviceLine guidance applies; escalate to Legal Counsel if the member's situation involves any live dispute or threatened claim.";
}

export interface ProposeHighResult {
  requestId: string;
  tier: string;
  status: "pending_dual_approval" | "refused_not_high_tier";
  approversRequired?: string[];
  reason?: string;
}

/** Phase 1: classify, route (creates 2 pending approvals), await both sign-offs. */
export async function proposeAdviceLineGuidance(
  memberId: string | null,
  topicKeyword: string
): Promise<ProposeHighResult> {
  const classified = await submitRequest(memberId, "membership", "answer_adviceline_query");

  if (classified.tier !== "high") {
    return {
      requestId: classified.requestId,
      tier: classified.tier,
      status: "refused_not_high_tier",
      reason: `Expected High tier, got ${classified.tier}. Agent 3 only handles High-tier work.`,
    };
  }

  const routing = await routeRequest(classified.requestId);

  await sql`
    insert into audit_log (request_id, event_type, actor, detail)
    values (${classified.requestId}, 'dual_proposal_created', 'system',
      ${sql.json({ topicKeyword, approversRequired: routing.approversAssigned })});
  `;

  return {
    requestId: classified.requestId,
    tier: "high",
    status: "pending_dual_approval",
    approversRequired: routing.approversAssigned,
  };
}

export interface DualApprovalOutcome {
  requestId: string;
  sequence: 1 | 2;
  decision: "approved" | "rejected";
  fullyApproved: boolean;
  executed: boolean;
  guidance?: string;
  reason?: string;
}

/**
 * Phase 2: act on ONE of the two required approvals. Enforces sequencing
 * (sequence=2 blocked until sequence=1 is approved) and stops the whole
 * request on any rejection, at either step.
 */
export async function actOnDualApproval(
  requestId: string,
  sequence: 1 | 2,
  approverRole: string,
  decision: "approved" | "rejected",
  topicKeyword?: string
): Promise<DualApprovalOutcome> {
  const [approval] = await sql`
    select id, approver_role, decision as existing_decision
    from approvals
    where request_id = ${requestId} and approval_sequence = ${sequence};
  `;

  if (!approval) {
    throw new Error(`No sequence=${sequence} approval found for request ${requestId}.`);
  }
  if (approval.existing_decision) {
    throw new Error(`Sequence=${sequence} for request ${requestId} already has a recorded decision: ${approval.existing_decision}.`);
  }

  if (sequence === 2) {
    const [firstApproval] = await sql`
      select decision from approvals where request_id = ${requestId} and approval_sequence = 1;
    `;
    if (!firstApproval || firstApproval.decision !== "approved") {
      throw new Error(
        `Cannot act on sequence=2 for request ${requestId}: sequence=1 must be 'approved' first (currently: ${firstApproval?.decision ?? "not yet decided"}).`
      );
    }
  }

  await sql`
    update approvals set decision = ${decision}, decided_at = now() where id = ${approval.id};
  `;

  if (decision === "rejected") {
    await sql`update requests set status = 'rejected', resolved_at = now() where id = ${requestId};`;
    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (${requestId}, 'proposal_rejected_by_human', ${approverRole},
        ${sql.json({ approverRole, sequence })});
    `;
    return { requestId, sequence, decision: "rejected", fullyApproved: false, executed: false };
  }

  // Approved. If this was sequence=1, we're not done, sequence=2 still required.
  if (sequence === 1) {
    return { requestId, sequence, decision: "approved", fullyApproved: false, executed: false };
  }

  // Sequence=2 approved, and we already confirmed sequence=1 was approved above.
  // Both confirmations in place — proceed to execution.
  const [agent] = await sql`select id, active from agents where name = 'Agent 3 - High Risk';`;
  if (!agent) throw new Error("Agent 3 not found — run seed-agents.ts first.");
  if (!agent.active) {
    return { requestId, sequence, decision: "approved", fullyApproved: true, executed: false, reason: "Agent 3 is inactive (circuit breaker previously tripped)." };
  }

  const cbCheck = await checkCircuitBreaker(agent.id);
  if (cbCheck.tripped) {
    return { requestId, sequence, decision: "approved", fullyApproved: true, executed: false, reason: "Circuit breaker tripped during this run." };
  }

  // Pre-call check uses the CONSERVATIVE WORST-CASE estimate (see claude-client.ts),
  // since we do not yet know the real cost until the API call actually returns.
  const budgetCheck = await checkBudget(agent.id, WORST_CASE_ESTIMATED_COST);
  if (!budgetCheck.allowed) {
    await recordAgentOutcome(agent.id, requestId, "failure", { reason: "budget_exceeded" });
    return {
      requestId, sequence, decision: "approved", fullyApproved: true, executed: false,
      reason: `Insufficient budget: $${budgetCheck.remainingBudget.toFixed(2)} remaining, worst-case call needs $${WORST_CASE_ESTIMATED_COST.toFixed(4)}.`,
    };
  }

  // The one real Claude API call in this build. A genuine failure here
  // (network error, API error) is recorded as a real 'failure' outcome,
  // NOT silently papered over with the offline fallback text, that would
  // misrepresent what actually happened in the audit trail.
  let guidance: string;
  let actualCostUsd: number;
  try {
    const result = await getAdviceLineGuidanceFromClaude(topicKeyword ?? "");
    guidance = result.guidance;
    actualCostUsd = result.actualCostUsd;
  } catch (err) {
    await recordAgentOutcome(agent.id, requestId, "failure", {
      reason: "claude_api_error",
      error: err instanceof Error ? err.message : String(err),
    });
    return { requestId, sequence, decision: "approved", fullyApproved: true, executed: false, reason: "Claude API call failed, see audit_log for detail." };
  }

  // Record the ACTUAL measured cost, not the worst-case estimate used for the pre-check.
  await recordUsage(requestId, agent.id, 90, actualCostUsd);
  await sql`update requests set agent_id = ${agent.id}, status = 'executed', resolved_at = now() where id = ${requestId};`;
  await recordAgentOutcome(agent.id, requestId, "success", { topicKeyword, guidance, actualCostUsd });

  return { requestId, sequence, decision: "approved", fullyApproved: true, executed: true, guidance };
}
