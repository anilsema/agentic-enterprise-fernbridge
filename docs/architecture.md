# Architecture Overview

```mermaid
flowchart TD
    U[Member / User Request] --> H[Harness / Orchestrator]
    H -->|classify risk tier| RC[Risk Classification Lookup]
    RC -->|Low| A1[Agent 1<br/>Human-above-the-loop<br/>Autonomous within budget cap]
    RC -->|Medium| A2[Agent 2<br/>Human-in-the-loop<br/>Single approval]
    RC -->|High| A3[Agent 3<br/>Human-in-the-loop<br/>Dual confirmation]
    A1 --> AL[Audit Log]
    A2 --> APQ[Approval Queue] --> AL
    A3 --> APQ2[Approval Queue<br/>+ Second Confirmation] --> AL
    AL --> TB[Tokenomics / Budget Tracker]
    TB -->|cap exceeded| H
    A2 -.escalation pattern.-> ADV[Advocacy Domain Lead]
    A3 -.escalation pattern.-> ADV

    subgraph DataFoundation [Data Foundation]
      DS[(Single Source of Truth<br/>Member & Policy Data Store)]
    end
    A1 --> DS
    A2 --> DS
    A3 --> DS
```

## Notes

- The harness is the only component with routing authority. Agents never self-select their risk tier.
- The escalation path (dotted lines) is deliberately explicit rather than an informal handoff: repeated Medium/High-tier AdviceLine queries on the same theme escalate to Advocacy as a *pattern*, not as individual cases.
- All three agents read from one data store. No agent maintains a local or cached copy of member/policy data (see Governance Principle C, Data Minimalism and Single Source of Truth).
- SSO and the external site sit in front of the harness, not embedded inside it — see `/site`.

This diagram is intentionally rough at this stage (Friday, Deep Block 3). It will be refined once the harness is actually built (Saturday) to confirm it matches the real implementation rather than the plan.
