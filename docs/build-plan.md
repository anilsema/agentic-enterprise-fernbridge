# Build Plan — Friday 14 to Tuesday 18 August 2026

## What "done" looks like by Tuesday

- Public GitHub repo, documented, README tells the sequencing story (governance, then data foundation, then agents), not just a code dump.
- Public project entry on LinkedIn (Featured) linking to repo and live site.
- Three agents, minimum viable proof: one autonomous (human-above-the-loop), one approval-gated (human-in-the-loop), one dual-confirmation (highest risk tier).
- A harness/orchestrator classifying requests by risk tier and routing under the correct oversight model.
- Tokenomics: per-agent, per-task cost tracking with a visible budget cap. **Real-time/live view, not after-the-fact logging** — this requirement surfaced from a genuine gap noticed during the build itself (no live visibility into usage while working), which is exactly the blind spot this component should not repeat.
- External site: single page, architecture diagram, governance narrative, live/demo-able self-service tool.
- SSO gating self-service tools and the approval dashboard, via a managed provider.
- Documentation standing alone as a portfolio artefact, not just code comments.

## Day by day

**Friday (governance before code):** risk classification matrix and governance/trust principles written first — nothing else starts until these exist. Repo scaffold, rough architecture diagram, data schema draft. Managed data store and SSO provider account set up.

**Saturday (foundation and harness):** data store schema built for real. Harness/orchestrator: request intake, risk classification lookup, routing logic, audit logging, token budget enforcement. Agent 1 (low risk, autonomous) built end to end, including monitoring dashboard.

**Sunday (the two governed agents):** Agent 2 (approval-gated) and Agent 3 (dual-confirmation) built, including human-in-the-loop approval queue UI. Tokenomics wired through all three agents.

**Monday (surface it):** external site built and deployed — architecture diagram, governance narrative, repo link, self-service demo. SSO wired across approval dashboard and self-service tools.

**Tuesday (finish, don't extend):** documentation pass. End-to-end test of all three risk tiers, fix only what's broken. Publish repo public, add LinkedIn Featured entry, tag v1.0.

**Wednesday (LinkedIn post):** built around the sequencing story — governance and data foundation designed before a line of agent code, three risk tiers demonstrating human-in vs human-above-the-loop, tokenomics tying governance to cost.

## What to cut if Tuesday looks at risk

1. **Cut first:** the external site's visual polish. Plain and working beats beautiful and unfinished.
2. **Cut second:** Agent 1's autonomous scope — narrow what it can do rather than dropping the tier entirely. The three-tier structure is the core argument.
3. **Never cut:** the governance/risk classification documentation. Two working agents with excellent documentation beats three agents with none — the documentation is what makes this a credible AI governance artefact rather than a coding demo.

## Open items tracker

Carried from Friday's consolidation pass, updated as resolved:

- [ ] Split the AdviceLine task into its own Legal/Consulting pillar row in `risk-catalog.ts` and `requests.pillar`, rather than the current task-type override stopgap in `routing.ts` (`LEGAL_CONSULTING_TASK_OVERRIDE`). The override works correctly (validated) but is a workaround, not the real fix.
- [ ] Re-examine Advocacy Task 7 (post-policy roadshow content) vs Task 8 (published opinion pieces on unsettled issues) — scores currently sit close together despite the deliberate risk distinction drawn between explaining settled law and taking a public position on a contested one.
- [ ] Define the specific pattern-detection threshold for the AdviceLine-to-Advocacy escalation trigger (the `escalations`/`escalation_requests` tables exist in schema.sql, the actual threshold logic is not yet built).
- [x] **RESOLVED (Deep Block 2):** second High-tier approver for Advocacy/Membership when not externally/publicly facing. Falls back to a second sign-off from the same Tier-1 head role, required from a different individual than the first approval. Public-facing requests route to Head of Marketing and Transformation instead. Implemented and validated in `routing.ts`.
- [x] **RESOLVED (Deep Block 2):** AdviceLine's pillar mismatch (catalog says `membership`, should route as `legal_consulting`) was a real correctness bug, not just a scoring nicety. Fixed via explicit task-type override in `routing.ts`, validated against real Postgres (Test 3) to confirm it correctly assigns Legal Counsel + Head of Legal rather than Membership's approvers.

## Security checklist before Monday

- [ ] **Rate limiting** per user/session (or per IP, pre-SSO), independent of the token budget cap. The budget cap prevents unbounded dollar cost but does NOT prevent rapid exhaustion, a single actor hammering the Low-tier autonomous agent (Agent 1, no per-action human gate by design) could burn the entire budget cap in minutes, technically staying within cost limits while denying legitimate members access for the remainder of the period. Budget cap protects spend; rate limiting protects availability. Both are needed, neither substitutes for the other.
- [ ] **Clerk bot-detection settings** — not automatic by default, needs explicit configuration once SSO is wired up (Monday).
- [ ] **CAPTCHA or equivalent friction** specifically on the self-service entry point, the only surface an unauthenticated or newly-authenticated actor can use to trigger agent activity.

- [x] Row Level Security (RLS) enabled on all Supabase tables from creation, zero policies defined yet. `anon`/`authenticated` keys currently have no access at all; `service_role` (used by the harness) is unaffected by RLS.
- [ ] Write actual RLS policies before the external site/self-service tools go live, scoping authenticated access to a member's own data. See `harness/data/data-model.md` for the full reasoning.
