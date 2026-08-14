# Agentic Enterprise — A Governance-First Reference Implementation

> **Fernbridge Business Alliance is a fictitious membership association**, used throughout this project for illustrative purposes. No real organisation, individual, or dataset is represented here. Roles referenced (Head of Advocacy & Strategy, AdviceLine Manager, etc.) are generic titles chosen to make the governance model concrete, not references to any real person or employer.

## What this is

A small, real agentic system built in a deliberate order: governance and data foundations designed *before* a single agent was scoped, not layered on afterward. The build order is itself the argument. Three risk-tiered agents demonstrate human-in-the-loop versus human-above-the-loop oversight, calibrated against a genuine risk classification matrix, not an arbitrary demo split.

This is not a rebuild of a membership association's full systems. That is architect and analyst work well understood elsewhere. The point of this project is to make the thinking behind AI guardrails explicit, defensible, and small enough to actually finish.

## The sequencing story

1. **Governance before code.** The risk classification matrix (`/governance`) was written and scored before any agent existed.
2. **Foundation before capability.** The data schema (`/harness/data`) was designed before the agents that would use it.
3. **Minimum viable proof, not maximum scope.** Three agents, one per risk tier, is deliberately the minimum that demonstrates differentiated oversight. More agents would dilute build time without strengthening the argument.

See [`/docs/governance-framework.md`](./docs/governance-framework.md) for the full reasoning, including the five governance principles this build is accountable to.

## Structure

```
governance/     Risk classification matrix, scoring worksheet, tier definitions
harness/        Orchestrator: request intake, risk classification, routing, audit logging, token budget enforcement
agents/
  agent1_low_risk/      Human-above-the-loop, autonomous within budget cap
  agent2_medium_risk/   Human-in-the-loop, single approval
  agent3_high_risk/     Human-in-the-loop, dual confirmation
site/           External-facing page: architecture, governance narrative, self-service demo (SSO-gated)
docs/           Governance framework, architecture notes, this README's supporting detail
```

## The three risk tiers

| Tier | Oversight Model | Audit Requirement |
|---|---|---|
| **Low** | Human-above-the-loop: agent acts autonomously within budget cap; human monitors, can pause/override | Logged, reviewed in aggregate weekly |
| **Medium** | Human-in-the-loop: agent proposes, holds for single approval before executing | Logged individually, reviewed per action |
| **High** | Human-in-the-loop, dual confirmation: agent proposes, requires approval plus a second, independent confirmation | Logged individually, retained for compliance, reviewed before and after execution |

Tier is set by the **highest single scored dimension**, not an average, across five criteria: Reversibility, Data Sensitivity, Public Exposure, Reputational/Legal Exposure, and Decision Novelty. Full scoring detail in [`/governance/risk-scoring-worksheet.xlsx`](./governance/risk-scoring-worksheet.xlsx).

## Status

Build in progress, Friday 14 – Tuesday 18 August 2026. See [`/docs/build-plan.md`](./docs/build-plan.md) for the day-by-day plan and what gets cut first if the deadline is at risk.

## Author

Anil Kunjunny — [linkedin.com/in/kunjunny](https://linkedin.com/in/kunjunny)
