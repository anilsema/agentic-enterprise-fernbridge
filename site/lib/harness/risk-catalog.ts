/**
 * Risk Catalog — Fernbridge Business Alliance
 *
 * Transcribed directly from governance/risk-scoring-worksheet.xlsx (the live-scored
 * matrix from Friday's Deep Block 1). This is the single source of truth for task
 * risk classification, see Governance Principle C (Data Minimalism / SSoT).
 *
 * Dimensions, each 1 (Low) / 2 (Medium) / 3 (High):
 *   reversibility, dataSensitivity, publicExposure, reputationalLegal, novelty
 *
 * NOTE: Advocacy task 4 ("AdviceLine queries") is flagged pending a structural split
 * into its own Legal/Consulting pillar row per the end-of-day consolidation item in
 * docs/build-plan.md. It remains under 'membership' here for now, scored HIGH, which
 * is correct even though its pillar assignment is provisional.
 */

export type Pillar = "advocacy" | "membership" | "legal_consulting";
export type Tier = "low" | "medium" | "high";

export interface RiskScores {
  reversibility: number;
  dataSensitivity: number;
  publicExposure: number;
  reputationalLegal: number;
  novelty: number;
}

export interface CatalogEntry {
  pillar: Pillar;
  taskType: string;
  scores: RiskScores;
  notes?: string;
}

function scores(
  reversibility: number,
  dataSensitivity: number,
  publicExposure: number,
  reputationalLegal: number,
  novelty: number
): RiskScores {
  return { reversibility, dataSensitivity, publicExposure, reputationalLegal, novelty };
}

export const RISK_CATALOG: CatalogEntry[] = [
  // ── Advocacy ──────────────────────────────────────────────
  {
    pillar: "advocacy",
    taskType: "monitor_legislative_developments",
    scores: scores(1, 3, 3, 3, 2),
    notes:
      "High despite internal-only audience: premature disclosure of Fernbridge's positioning/synthesis on a live issue could compromise the advocacy outcome itself.",
  },
  {
    pillar: "advocacy",
    taskType: "track_submission_deadlines",
    scores: scores(2, 1, 2, 2, 2),
  },
  {
    pillar: "advocacy",
    taskType: "research_policy_for_opinion_pieces",
    scores: scores(1, 3, 3, 3, 1),
    notes:
      "High driven by Data Sensitivity: research outcomes carry real decision-weight. Reversibility & Novelty low: routine, correctable pre-publication.",
  },
  {
    pillar: "advocacy",
    taskType: "draft_first_pass_submission_content",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "advocacy",
    taskType: "draft_select_committee_briefing_notes",
    scores: scores(1, 2, 1, 2, 1),
  },
  {
    pillar: "advocacy",
    taskType: "summarise_member_consultation_feedback",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "advocacy",
    taskType: "draft_roadshow_content_post_policy",
    scores: scores(2, 3, 3, 3, 3),
  },
  {
    pillar: "advocacy",
    taskType: "draft_opinion_pieces_unsettled_issues",
    scores: scores(2, 1, 3, 3, 1),
    notes:
      "High driven by Public Exposure & Reputational/Legal: once published, wrong information under Fernbridge's name is consequential. Data Sensitivity & Novelty low: no PII, taking public positions is routine business.",
  },
  {
    pillar: "advocacy",
    taskType: "draft_advocacy_newsletter",
    scores: scores(2, 3, 3, 2, 2),
  },
  {
    pillar: "advocacy",
    taskType: "respond_routine_advocacy_enquiry",
    scores: scores(1, 2, 2, 2, 2),
  },
  {
    pillar: "advocacy",
    taskType: "prepare_member_meeting_briefing",
    scores: scores(1, 1, 1, 2, 1),
  },
  {
    pillar: "advocacy",
    taskType: "draft_policy_forum_qanda",
    scores: scores(1, 1, 1, 2, 1),
  },
  {
    pillar: "advocacy",
    taskType: "respond_media_enquiry_contentious",
    scores: scores(3, 3, 3, 3, 1),
  },

  // ── Membership ────────────────────────────────────────────
  {
    pillar: "membership",
    taskType: "respond_prospective_member_enquiry",
    scores: scores(1, 1, 2, 2, 1),
  },
  {
    pillar: "membership",
    taskType: "process_new_membership_application",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "send_onboarding_sequence",
    scores: scores(1, 1, 2, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "answer_adviceline_query",
    scores: scores(3, 3, 3, 3, 3),
    notes:
      "PENDING SPLIT into Legal/Consulting pillar (see build-plan.md open items). Correctly scored HIGH: bad ER/HR advice risks a Personal Grievance claim for the member business, real legal and reputational exposure.",
  },
  {
    pillar: "membership",
    taskType: "send_briefing_reminders",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "recommend_member_rewards",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "draft_member_facing_communications",
    scores: scores(1, 2, 3, 3, 2),
  },
  {
    pillar: "membership",
    taskType: "process_renewal",
    scores: scores(1, 1, 2, 2, 1),
  },
  {
    pillar: "membership",
    taskType: "identify_at_risk_members",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "handle_tier_change_request",
    scores: scores(1, 1, 1, 1, 1),
  },
  {
    pillar: "membership",
    taskType: "respond_member_complaint",
    scores: scores(2, 2, 3, 3, 1),
  },
  {
    pillar: "membership",
    taskType: "process_membership_cancellation",
    scores: scores(1, 1, 3, 3, 1),
  },
  {
    pillar: "membership",
    taskType: "handle_billing_dispute",
    scores: scores(1, 3, 3, 3, 1),
  },
  {
    pillar: "membership",
    taskType: "respond_export_enquiry",
    scores: scores(1, 1, 2, 2, 1),
  },
  {
    pillar: "membership",
    taskType: "match_export_resources",
    scores: scores(1, 1, 1, 1, 1),
  },
];

/** Look up a task's pre-scored risk profile by its type. */
export function lookupRiskScores(taskType: string): CatalogEntry | undefined {
  return RISK_CATALOG.find((entry) => entry.taskType === taskType);
}

/**
 * Derive overall tier from the five dimensions: HIGHEST single score wins,
 * not an average. Mirrors the Postgres trigger fn_derive_overall_tier in schema.sql,
 * kept identical in application logic deliberately, so the classification is
 * consistent whether computed here or by the database.
 */
export function deriveTier(s: RiskScores): Tier {
  const max = Math.max(
    s.reversibility,
    s.dataSensitivity,
    s.publicExposure,
    s.reputationalLegal,
    s.novelty
  );
  if (max >= 3) return "high";
  if (max === 2) return "medium";
  return "low";
}
