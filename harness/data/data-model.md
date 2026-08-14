# Data Model — Single Source of Truth

*Applies Governance Principle C: an agent should draw from one authoritative source for any given fact, never a locally cached or reconstructed copy. See `/docs/governance-framework.md`.*

## Design intent

Every table here exists to serve a governance mechanism already defined elsewhere in this repo, not the other way around. The schema follows the mechanisms, not a generic "agent framework" template:

- **Risk-tiered routing** needs `requests` to carry the five scoring dimensions and the resulting tier.
- **Approval chains** need `approvals`, distinct from the request itself, because a High-tier request requires two independent approval records, not one.
- **Audit trail** needs `audit_log` as an append-only table, separate from everything else, so it can never be edited by anything other than an insert.
- **Tokenomics (real-time)** needs `token_usage` as its own table so a live dashboard can query it directly without touching request or approval data.
- **The AdviceLine → Advocacy escalation pattern** needs `escalations`, because a pattern across multiple requests is a distinct entity, not a property of any single request.

## Entity-relationship diagram

```mermaid
erDiagram
    MEMBERS ||--o{ REQUESTS : submits
    REQUESTS ||--o| RISK_SCORES : "scored by"
    REQUESTS ||--o{ APPROVALS : requires
    REQUESTS ||--o{ AUDIT_LOG : generates
    REQUESTS ||--o{ TOKEN_USAGE : consumes
    AGENTS ||--o{ REQUESTS : handles
    REQUESTS }o--o{ ESCALATIONS : "pattern feeds"
    ESCALATIONS }o--|| POLICY_POSITIONS : "may inform"

    MEMBERS {
        uuid id PK
        text org_name
        text tier
        timestamptz created_at
    }

    REQUESTS {
        uuid id PK
        uuid member_id FK
        text pillar "advocacy | membership | legal_consulting"
        text task_type
        text status "pending | approved | rejected | executed"
        uuid agent_id FK
        timestamptz created_at
        timestamptz resolved_at
    }

    RISK_SCORES {
        uuid id PK
        uuid request_id FK
        int reversibility "1-3"
        int data_sensitivity "1-3"
        int public_exposure "1-3"
        int reputational_legal "1-3"
        int novelty "1-3"
        text overall_tier "low | medium | high"
        text scoring_notes
    }

    AGENTS {
        uuid id PK
        text name
        text tier "low | medium | high"
        text pillar
        numeric budget_cap
        boolean active
    }

    APPROVALS {
        uuid id PK
        uuid request_id FK
        text approver_role
        int approval_sequence "1 = first approver, 2 = second (High tier only)"
        text decision "approved | rejected"
        text notes
        timestamptz decided_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid request_id FK
        text event_type
        text actor "agent | approver_role | system"
        jsonb detail
        timestamptz occurred_at
    }

    TOKEN_USAGE {
        uuid id PK
        uuid request_id FK
        uuid agent_id FK
        int tokens_used
        numeric cost_usd
        timestamptz recorded_at
    }

    ESCALATIONS {
        uuid id PK
        text theme
        int pattern_count "requests matching this theme in window"
        text time_window
        uuid escalated_to_domain_lead
        text status "monitoring | escalated | resolved"
        timestamptz created_at
    }

    POLICY_POSITIONS {
        uuid id PK
        text pillar_tag "employment_relations | health_safety | infrastructure | education_skills | immigration | manufacturing_export"
        text status "draft | published"
        uuid originating_escalation_id FK
        timestamptz created_at
    }
```

## Why this shape, not a simpler one

**`RISK_SCORES` is a separate table from `REQUESTS`, not columns bolted onto it.** This mirrors the actual scoring worksheet: five independent dimensions plus a derived tier, kept together as one unit that can be queried, audited, and revised (as happened live in the scoring session, several scores were corrected with reasoning captured) without touching the request record itself.

**`APPROVALS` allows multiple rows per request deliberately.** A Low-tier request has zero rows here (aggregate review only, per the oversight model). A Medium-tier request has one. A High-tier request has two, `approval_sequence` 1 and 2, enforcing the dual-confirmation rule at the data layer, not just in application logic.

**`AUDIT_LOG` is append-only by convention** (enforced at the application layer, or with a database trigger if built out further): no update or delete path should ever be built against it. This is what makes "Verifiable Trust" (Governance Principle B) actually verifiable rather than asserted.

**`ESCALATIONS` and `POLICY_POSITIONS` exist because the AdviceLine-to-Advocacy pattern is a first-class part of this system, not an afterthought.** A single AdviceLine request never creates a `POLICY_POSITIONS` row on its own. Only a pattern, tracked in `ESCALATIONS`, crossing whatever threshold gets defined, can feed into one. This is the data-layer expression of "AdviceLine escalates the pattern, not the individual case."

## What's deliberately not in scope for this build

- No `MEMBER_PII` detail table (contact info, financial records) — the demo doesn't need real member data to prove the governance pattern, and inventing realistic-looking PII for a public repo is the wrong trade-off even for fictitious data.
- No historical versioning table for `POLICY_POSITIONS` — a real implementation would need this, the demo doesn't.
