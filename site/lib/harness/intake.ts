import { sql } from "./db";
import { lookupRiskScores, deriveTier, Pillar } from "./risk-catalog";

export interface IntakeResult {
  requestId: string;
  pillar: Pillar;
  taskType: string;
  tier: string;
  status: string;
}

/**
 * Submit a new request to the harness.
 *
 * Flow:
 *  1. Look up the task's pre-scored risk profile from the catalog.
 *     If unknown, treat as novel: force Novelty=3 (High), which pulls the
 *     whole task to High tier — an unrecognised task type should never
 *     silently default to Low. This is the "fail safe, not fail open"
 *     posture the governance framework depends on.
 *  2. Insert the request row.
 *  3. Insert the risk_scores row — the database trigger derives overall_tier
 *     independently (see schema.sql fn_derive_overall_tier), and we assert
 *     it matches the application-layer calculation as a consistency check.
 *  4. Write an audit_log entry for the classification event.
 */
export async function submitRequest(
  memberId: string | null,
  pillar: Pillar,
  taskType: string
): Promise<IntakeResult> {
  const catalogEntry = lookupRiskScores(taskType);

  const riskScores = catalogEntry
    ? catalogEntry.scores
    : { reversibility: 2, dataSensitivity: 2, publicExposure: 2, reputationalLegal: 2, novelty: 3 };

  const isNovel = !catalogEntry;
  const appDerivedTier = deriveTier(riskScores);

  const [request] = await sql`
    insert into requests (member_id, pillar, task_type, status)
    values (${memberId}, ${pillar}, ${taskType}, 'pending')
    returning id;
  `;
  const requestId = request.id;

  const [riskRow] = await sql`
    insert into risk_scores (
      request_id, reversibility, data_sensitivity, public_exposure,
      reputational_legal, novelty, overall_tier, scoring_notes
    )
    values (
      ${requestId}, ${riskScores.reversibility}, ${riskScores.dataSensitivity},
      ${riskScores.publicExposure}, ${riskScores.reputationalLegal}, ${riskScores.novelty},
      ${appDerivedTier},
      ${isNovel ? "NOVEL TASK TYPE — not in catalog, defaulted to conservative scoring pending human review." : catalogEntry?.notes ?? null}
    )
    returning overall_tier;
  `;

  // Consistency check: app-layer tier calc must match the DB trigger's independent calc.
  if (riskRow.overall_tier !== appDerivedTier) {
    throw new Error(
      `Tier mismatch: app calculated '${appDerivedTier}' but DB trigger derived '${riskRow.overall_tier}'. ` +
        `This should never happen — investigate fn_derive_overall_tier vs deriveTier() drift.`
    );
  }

  await sql`
    insert into audit_log (request_id, event_type, actor, detail)
    values (
      ${requestId}, 'request_classified', 'system',
      ${sql.json({ taskType, pillar, tier: riskRow.overall_tier, novel: isNovel })}
    );
  `;

  return {
    requestId,
    pillar,
    taskType,
    tier: riskRow.overall_tier,
    status: "pending",
  };
}
