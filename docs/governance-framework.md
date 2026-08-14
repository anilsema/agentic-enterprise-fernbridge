# Governance Framework — Fernbridge Business Alliance Reference Implementation

*Fernbridge Business Alliance is a fictitious organisation used for illustrative purposes throughout this document.*

This document consolidates the risk classification structure and the governance and trust principles for the Agentic Enterprise reference build. It is written against Fernbridge, a fictitious membership association, so that every tier and approver name is grounded in a plausible real-world structure without referencing any actual organisation.

---

## Part 1 — Risk Classification Matrix

### The five scoring dimensions

Each candidate task is scored 1 (Low) / 2 (Medium) / 3 (High) against five independent dimensions:

- **Reversibility** — can a human undo this action after the fact with no lasting harm?
- **Data sensitivity** — does this touch member PII, financial data, or confidential/deliberative positions?
- **Public exposure** — is the output internal only, or does it reach members, media, or regulators?
- **Reputational/legal exposure** — if the agent gets this wrong, does it damage standing or create legal exposure, including for a third party (e.g. a member business)?
- **Decision novelty** — is this routine and precedented, or does it require judgement not yet automated?

### The tiering rule

Overall Tier is set by the **highest single dimension score**, not an average. One High-scoring dimension pulls the whole task into the High tier, the same logic as a risk register where one red flag vetoes an otherwise-green status. A task can be low-effort and routine in every respect but one, and that one dimension determines the oversight it actually needs.

### The three oversight tiers

| Tier | Oversight Model | Audit Requirement |
|---|---|---|
| **Low** | Human-above-the-loop: agent acts autonomously within budget cap; human monitors, can pause/override | Logged, reviewed in aggregate weekly |
| **Medium** | Human-in-the-loop: agent proposes, holds for single approval before executing | Logged individually, reviewed per action |
| **High** | Human-in-the-loop, dual confirmation: agent proposes, requires approval plus a second, independent confirmation | Logged individually, retained for compliance, reviewed before and after execution |

---

## Part 2 — Three-Pillar Structure

The build originally treated this as two functions, Membership and Advocacy. AdviceLine was initially scoped as a sub-function of Membership, but that undersold its role. AdviceLine is the gateway through which contentious issues enter the organisation's perimeter: patterns across individual member queries are what surface a policy semantics or interpretation question worth raising with Advocacy. That makes it a third, distinct pillar with its own risk driver (legal exposure via Personal Grievance risk to member businesses), not a variant of general Membership work.

### Advocacy

| Tier | Approver |
|---|---|
| Low | Policy Admin / Policy Advisor |
| Medium | Policy Advisor & Domain Lead |
| High | Head of Advocacy & Strategy, plus Head of Marketing and Transformation where externally/publicly facing |

### Membership

| Tier | Approver |
|---|---|
| Low | Membership Admin |
| Medium | Membership and Export Manager |
| High | Head of Membership, plus Head of Marketing and Transformation where externally/publicly facing |

### Legal/Consulting (AdviceLine)

| Tier | Approver |
|---|---|
| Low | AdviceLine Team / Employer Advisor |
| Medium | AdviceLine Manager |
| High | Legal Counsel and Head of Legal |

---

## Part 3 — Cross-Pillar Escalation

AdviceLine functions as a sensing mechanism for the whole organisation. A single member query is operational intake, closed at Tier 2 or 3 within the Legal/Consulting pillar. But a pattern of similar queries, multiple members asking about the same regulatory ambiguity, is a different signal: it suggests the organisation itself may need to question the semantics or interpretation of a specific policy, which is Advocacy's remit, not AdviceLine's.

- **Trigger:** a defined threshold of similar AdviceLine queries within a time window (threshold to be defined during build).
- **Action:** AdviceLine Manager escalates the pattern, not the individual case, to the relevant Advocacy Domain Lead.
- This is a genuine cross-pillar workflow and is represented explicitly in the harness routing logic, not left as an informal, undocumented handoff.

---

## Part 4 — Governance & Trust Principles

The three parts above define the workflow: who approves what, at which tier, and how AdviceLine's pattern-detection feeds Advocacy. This section sits underneath that workflow. It states the durable reasoning that explains why the workflow is shaped the way it is, reasoning that would still hold even if the specific approvers, tiers, or org structure changed. This is deliberately not an architecture document — the point of this project was never to fully re-engineer a membership association's systems, that is architect and analyst work already well understood. The point is to make the thinking behind the guardrails explicit and defensible.

### A. Proportionality

Control should scale with consequence, not with activity volume or general unease about AI acting on the organisation's behalf. This principle exists because the first scoring pass over the Membership and Advocacy task set drifted toward over-classification, several routine tasks landed at High out of caution rather than genuine risk. Left uncorrected, that drift defeats the purpose of tiering entirely: if most things are High, nothing is meaningfully prioritised, and human attention gets spent everywhere instead of where it is actually needed.

### B. Verifiable Trust

Trust in an agent is not assumed at deployment, it is earned through a visible, consistent track record at its assigned tier, and it can be revoked. A Low-tier agent operating within its budget cap and producing a clean audit trail over time is demonstrating trustworthiness, not simply being granted it.

### C. Data Minimalism and Single Source of Truth

An agent should draw from one authoritative source for any given fact about a member or a policy position, never from a locally cached or independently reconstructed copy. An agent acting on stale or divergent data does not just produce a wrong answer, it produces a wrong answer with the appearance of authority, which is a materially worse failure mode than a human making the same mistake.

### D. Accountable Escalation

Tiering structures human accountability, it does not remove or dilute it. Even a fully autonomous Low-tier agent has a named human role accountable for its aggregate behaviour, reviewed weekly rather than per action. Autonomy is a delegation of execution, never a delegation of accountability, those two things are frequently and dangerously conflated in how organisations talk about AI adoption, and this document deliberately keeps them separate.

### E. Foundation Before Capability

Governance and data foundations are designed before agent capability is built, not layered on afterward once something already works. The risk classification matrix and the three-pillar structure existed before a single agent was scoped. A guardrail retrofitted after capability is a patch. A guardrail designed before it is architecture.

---

*Anil Kunjunny | Agentic Enterprise Reference Implementation | Fernbridge Business Alliance is fictitious*
