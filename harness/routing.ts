import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { Pillar, Tier } from "./risk-catalog";

const envPath = path.resolve(process.cwd(), "../.env.local");
if (!existsSync(envPath)) {
  throw new Error(`Could not find .env.local at ${envPath}. Run this from inside harness/.`);
}
dotenv.config({ path: envPath });
if (!process.env.DATABASE_URL) {
  throw new Error(`.env.local found but DATABASE_URL is not set.`);
}

const sql = postgres(process.env.DATABASE_URL);

/**
 * Approver map — mirrors docs/governance-framework.md Part 2 exactly.
 *
 * RESOLVED (was flagged as an open item during Deep Block 2, now confirmed):
 * for Advocacy/Membership High-tier requests, the second approver depends on
 * public exposure: Head of Marketing and Transformation if the request is
 * externally/publicly facing, otherwise a second sign-off from the same
 * Tier-1 head role (Head of Advocacy & Strategy / Head of Membership),
 * required from a different individual than the first approval.
 */
const APPROVER_MAP: Record<Pillar, Record<Tier, { first: string; secondIfPublic?: string }>> = {
  advocacy: {
    low: { first: "Policy Admin / Policy Advisor" },
    medium: { first: "Policy Advisor & Domain Lead" },
    high: { first: "Head of Advocacy & Strategy", secondIfPublic: "Head of Marketing and Transformation" },
  },
  membership: {
    low: { first: "Membership Admin" },
    medium: { first: "Membership and Export Manager" },
    high: { first: "Head of Membership", secondIfPublic: "Head of Marketing and Transformation" },
  },
  legal_consulting: {
    low: { first: "AdviceLine Team / Employer Advisor" },
    medium: { first: "AdviceLine Manager" },
    high: { first: "Legal Counsel", secondIfPublic: "Head of Legal" }, // Legal Counsel reports to Head of Legal — always dual, not conditional on public exposure
  },
};

// Public exposure score (1-3) at or above this threshold counts as "publicly facing"
// for the purpose of deciding the second High-tier approver.
const PUBLIC_EXPOSURE_THRESHOLD = 3;

// Stopgap for the AdviceLine pending-split issue: task types that are actually
// Legal/Consulting even though the requests.pillar column currently says
// 'membership' (see risk-catalog.ts notes on answer_adviceline_query).
const LEGAL_CONSULTING_TASK_OVERRIDE = new Set(["answer_adviceline_query"]);

function resolveEffectivePillar(storedPillar: Pillar, taskType: string): Pillar {
  if (LEGAL_CONSULTING_TASK_OVERRIDE.has(taskType)) return "legal_consulting";
  return storedPillar;
}

export interface RoutingResult {
  requestId: string;
  tier: Tier;
  effectivePillar: Pillar;
  approversAssigned: string[];
  requestStatus: string;
}

/**
 * Route a previously-classified request to the correct oversight path.
 * Must be called after submitRequest() (intake.ts) has already written
 * the risk_scores row — this function reads that classification, it doesn't
 * recompute it, keeping classification and routing as separate concerns.
 */
export async function routeRequest(requestId: string): Promise<RoutingResult> {
  const [request] = await sql`
    select r.id, r.pillar, r.task_type, rs.overall_tier, rs.public_exposure
    from requests r
    join risk_scores rs on rs.request_id = r.id
    where r.id = ${requestId};
  `;

  if (!request) {
    throw new Error(`Request ${requestId} not found, or has no risk_scores row (must classify before routing).`);
  }

  const tier = request.overall_tier as Tier;
  const effectivePillar = resolveEffectivePillar(request.pillar as Pillar, request.task_type);
  const approvers = APPROVER_MAP[effectivePillar][tier];
  const approversAssigned: string[] = [];

  if (tier === "low") {
    // Human-above-the-loop: no per-action approval gate. Auto-approve,
    // rely on aggregate weekly review per the oversight model.
    await sql`update requests set status = 'approved', resolved_at = now() where id = ${requestId};`;
    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (${requestId}, 'auto_approved_low_tier', 'system',
        ${sql.json({ effectivePillar, oversightModel: "human-above-the-loop" })});
    `;
  } else if (tier === "medium") {
    // Human-in-the-loop: single approval required before execution.
    await sql`
      insert into approvals (request_id, approver_role, approval_sequence)
      values (${requestId}, ${approvers.first}, 1);
    `;
    approversAssigned.push(approvers.first);
    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (${requestId}, 'approval_required', 'system',
        ${sql.json({ effectivePillar, oversightModel: "human-in-the-loop", approver: approvers.first })});
    `;
  } else {
    // High: dual confirmation required.
    await sql`
      insert into approvals (request_id, approver_role, approval_sequence)
      values (${requestId}, ${approvers.first}, 1);
    `;
    approversAssigned.push(approvers.first);

    const isPubliclyFacing = request.public_exposure >= PUBLIC_EXPOSURE_THRESHOLD;
    const secondApprover =
      effectivePillar === "legal_consulting"
        ? approvers.secondIfPublic! // legal_consulting always dual, not conditional
        : isPubliclyFacing
          ? approvers.secondIfPublic! // Head of Marketing and Transformation
          : approvers.first; // second sign-off, same role, different individual required
    await sql`
      insert into approvals (request_id, approver_role, approval_sequence)
      values (${requestId}, ${secondApprover}, 2);
    `;
    approversAssigned.push(secondApprover);

    await sql`
      insert into audit_log (request_id, event_type, actor, detail)
      values (${requestId}, 'dual_approval_required', 'system',
        ${sql.json({ effectivePillar, oversightModel: "human-in-the-loop-dual", approvers: approversAssigned })});
    `;
  }

  const [updated] = await sql`select status from requests where id = ${requestId};`;

  return {
    requestId,
    tier,
    effectivePillar,
    approversAssigned,
    requestStatus: updated.status,
  };
}

export async function closeConnection() {
  await sql.end();
}
