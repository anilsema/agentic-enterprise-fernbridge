# Build Plan — Friday 14 to Tuesday 18 August 2026

## What "done" looks like by Tuesday

- Public GitHub repo, documented, README tells the sequencing story (governance, then data foundation, then agents), not just a code dump.
- Public project entry on LinkedIn (Featured) linking to repo and live site.
- Three agents, minimum viable proof: one autonomous (human-above-the-loop), one approval-gated (human-in-the-loop), one dual-confirmation (highest risk tier).
- A harness/orchestrator classifying requests by risk tier and routing under the correct oversight model.
- Tokenomics: per-agent, per-task cost tracking with a visible budget cap.
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
