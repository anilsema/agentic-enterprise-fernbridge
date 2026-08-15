# Agentic Enterprise — Study Companion
### Closing the gaps, in your own architectural language

The fastest way through this is to notice you already have the mental models. Agentic system design is largely EA and integration architecture wearing a new vocabulary. This maps each build-plan element to the pattern name, the EA-equivalent you already know, and how deep to go given the Tuesday deadline.

---

## 1. Harness / Orchestrator

**What it is:** the component that receives a request, classifies it, and routes it to the right agent under the right oversight model.

**EA-equivalent you already know:** this is your Enterprise Service Bus (ESB) or integration middleware layer, doing content-based routing. If you've ever documented a system where a message gets inspected and sent down different paths depending on its type, you've designed this before.

**Named patterns:**
- **Router pattern** (also called Content-Based Router in EAI literature) — inspect the request, decide which agent handles it. This is your risk classification step.
- **Orchestrator pattern** — a central component owns the workflow sequence, as opposed to...
- **Choreography pattern** — where agents react to each other's outputs with no central conductor. For your build, orchestration is the right call: a central harness enforcing risk tiers needs to be the authority, choreography would make governance much harder to audit.
- **Circuit Breaker pattern** — worth including even minimally: if an agent fails repeatedly, the harness stops routing to it rather than retrying into a failure loop. Same logic as a circuit breaker in any resilient integration architecture.

**Depth needed:** enough to implement router + orchestrator. Circuit breaker can be a simple try/fail-count/pause, doesn't need a library.

---

## 2. Tokenomics

**What it is:** per-agent, per-task cost tracking against a budget cap.

**EA-equivalent you already know:** IT financial management / chargeback models (ITIL), or in cloud terms, FinOps. You've done this conceptually already: the Idea-to-Initiative Framework is a governance mechanism that ties spend to value before commitment. Tokenomics is the same idea applied at the level of individual agent calls instead of capital projects.

**Named pattern:** **Metering and Rate-Limiting pattern** — track consumption, enforce a ceiling, alert or halt before overrun. This is standard API gateway territory (think AWS API Gateway usage plans), not agent-specific.

**Depth needed:** shallow. Log token count and cost per call, sum per agent, hard-stop at budget cap. Don't over-engineer a dashboard here, a table is enough to prove governance intent.

---

## 3. External-Facing Website

**EA-equivalent you already know:** the Channel layer in TOGAF's Business Architecture, the customer-facing presentation tier in any Application Architecture diagram.

**Named pattern:** **Backend-for-Frontend (BFF)** — a thin layer that exists purely to serve the external site's needs without exposing your internal harness directly. For a build this size, you may not need a full BFF, but the principle matters: the public site should call a narrow, purpose-built API, not your internal orchestrator directly.

**Depth needed:** shallow. Static site plus a thin API layer is enough. This is the piece to cut polish from first if time runs short, per the build plan.

---

## 4. Self-Service Tools

**EA-equivalent you already know:** the Service Catalog pattern from ITIL, a defined, bounded set of actions a user can trigger themselves without a human intermediary.

**Named pattern:** this is really just your Agent 1 and Agent 2 exposed through a UI. The architectural concept worth knowing is **Command pattern** from software design, each self-service action is a discrete, well-defined command with clear inputs, outputs, and (critically for your governance story) an audit record.

**Depth needed:** shallow, this is UI wiring on top of agents you're already building.

---

## 5. SSO

**EA-equivalent you already know:** Identity and Access Management (IAM) architecture, federated identity.

**Named patterns:**
- **OAuth 2.0 / OpenID Connect (OIDC)** — the actual protocols. OAuth handles authorization (what you can do), OIDC layers identity on top (who you are). Managed providers (Clerk, Auth0) implement both so you don't need to hand-roll the protocol, but knowing the split helps you explain the architecture credibly in an interview.
- **Federated Identity pattern** — trusting an external identity provider rather than managing credentials yourself. This is the EA pattern name for "why we don't build our own login system."

**Depth needed:** conceptual only. You need to be able to explain the pattern, not implement the protocol by hand, that's exactly what the managed provider is for.

---

## 6. Human-in-the-Loop vs Human-Above-the-Loop

**This is your strongest ground, not a gap.** The EA-equivalent is a **decision rights framework**, the same category of thing as a RACI matrix or a delegated authority matrix, which you've built before in a governance context (Idea-to-Initiative Framework is a decision-rights framework for capital investment).

**Named patterns:**
- **Human-in-the-loop (HITL)** — a human must approve before the action executes. Your Agent 2 and Agent 3.
- **Human-above-the-loop (sometimes "human-on-the-loop")** — the human monitors and can intervene, but doesn't approve each action. Your Agent 1.
- **Escalation pattern** — a defined path for an agent to hand off to a human when it's outside its confidence or authority, worth a line in your governance doc even if not fully built.

**Depth needed:** you already understand this conceptually better than most engineers building agent systems. The work here is translation, mapping your governance language onto these specific terms so the documentation reads as fluent in both worlds.

---

## 7. Governance & Trust

**EA-equivalent you already know:** TOGAF's Architecture Governance phase, and Data Governance frameworks like DAMA-DMBOK if you want a named reference to cite.

**Named pattern worth knowing:** **Guardrails pattern** — the AI-specific term for constraints placed around an agent's behaviour (what it can't do, regardless of what it's asked). Your risk classification matrix is effectively your guardrails specification.

**Also worth a mention in documentation:** **Zero Trust** as a security principle, verify every request regardless of source, which pairs naturally with your SSO and audit-logging design.

**Depth needed:** this is where your existing expertise is strongest. Spend more documentation effort here than build effort, this section is what makes the project read as governance-led rather than a coding exercise.

---

## 8. Data Foundation

**EA-equivalent you already know:** Master Data Management (MDM), which you already led on Project Woohoo, and Data Governance more broadly.

**Named patterns:**
- **Single Source of Truth (SSoT)** — the principle behind your schema design, exactly the same principle behind Woohoo's Customer Master data flow.
- **Data Mesh vs Data Lake** — worth knowing as a talking point even if not architecturally relevant at this scale: Data Mesh treats data as a product owned by domain teams, Data Lake centralises it. For a project this size you're effectively building a small, centralised store, closer to a lake than a mesh, but being able to name the distinction signals fluency.

**Depth needed:** shallow on new learning, this is closest to territory you already own.

---

## How to sequence the studying against the build plan

- **Friday (governance doc day):** read sections 6, 7, 8 properly, these directly inform the risk classification matrix you're writing that day, and you already have most of the vocabulary.
- **Saturday-Sunday (harness + agents):** skim sections 1 and 2 just before building, Router/Orchestrator/Circuit Breaker and the metering pattern.
- **Monday (site + SSO):** skim sections 3, 4, 5 the morning of, these are shallow and mostly about naming things correctly in documentation, not deep implementation learning.
- **Tuesday (documentation pass):** this is where the EA vocabulary earns its keep, weave the named patterns into the README and architecture doc so the project reads as informed by established practice, not reinventing terminology.

One honest note: none of this needs a separate course or deep-dive, it needs about 90 minutes of targeted reading against real terms, done in the gaps around the build itself, not as a standalone study block competing with Tuesday's deadline.
