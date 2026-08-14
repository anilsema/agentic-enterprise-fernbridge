-- Fernbridge Business Alliance — Agentic Enterprise Reference Implementation
-- Data Foundation Schema
-- Postgres-compatible (built/tested against Supabase / Neon)
--
-- Fernbridge Business Alliance is a fictitious organisation used for illustrative purposes.
-- See /docs/governance-framework.md Part 4, Principle C: Data Minimalism and Single Source of Truth.
--
-- gen_random_uuid() is native to Postgres 13+, no extension required.

-- ============================================================
-- MEMBERS
-- ============================================================
create table members (
    id uuid primary key default gen_random_uuid(),
    org_name text not null,
    tier text not null check (tier in ('standard', 'premium', 'export')),
    created_at timestamptz not null default now()
);

-- ============================================================
-- AGENTS
-- One row per deployed agent (the minimum three for this build: low/medium/high)
-- ============================================================
create table agents (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    tier text not null check (tier in ('low', 'medium', 'high')),
    pillar text not null check (pillar in ('advocacy', 'membership', 'legal_consulting')),
    budget_cap numeric(10,2) not null,
    active boolean not null default true
);

-- ============================================================
-- REQUESTS
-- The central table: every task an agent handles enters here first
-- ============================================================
create table requests (
    id uuid primary key default gen_random_uuid(),
    member_id uuid references members(id),
    pillar text not null check (pillar in ('advocacy', 'membership', 'legal_consulting')),
    task_type text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'executed')),
    agent_id uuid references agents(id),
    created_at timestamptz not null default now(),
    resolved_at timestamptz
);

create index idx_requests_pillar on requests(pillar);
create index idx_requests_status on requests(status);

-- ============================================================
-- RISK_SCORES
-- One row per request. Five dimensions, 1-3 each, plus derived tier.
-- Overall tier = highest single dimension score (enforced by app logic / trigger, see below)
-- ============================================================
create table risk_scores (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references requests(id) unique,
    reversibility int not null check (reversibility between 1 and 3),
    data_sensitivity int not null check (data_sensitivity between 1 and 3),
    public_exposure int not null check (public_exposure between 1 and 3),
    reputational_legal int not null check (reputational_legal between 1 and 3),
    novelty int not null check (novelty between 1 and 3),
    overall_tier text not null check (overall_tier in ('low', 'medium', 'high')),
    scoring_notes text
);

-- Trigger to auto-derive overall_tier from the max of the five dimensions,
-- mirroring the "highest single score wins" rule from the risk scoring worksheet.
create or replace function fn_derive_overall_tier()
returns trigger as $$
declare
    max_score int;
begin
    max_score := greatest(
        new.reversibility, new.data_sensitivity, new.public_exposure,
        new.reputational_legal, new.novelty
    );
    new.overall_tier := case
        when max_score >= 3 then 'high'
        when max_score = 2 then 'medium'
        else 'low'
    end;
    return new;
end;
$$ language plpgsql;

create trigger trg_derive_overall_tier
    before insert or update on risk_scores
    for each row execute function fn_derive_overall_tier();

-- ============================================================
-- APPROVALS
-- Zero rows for Low tier (aggregate review only), one for Medium, two for High
-- ============================================================
create table approvals (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references requests(id),
    approver_role text not null,
    approval_sequence int not null check (approval_sequence in (1, 2)),
    decision text check (decision in ('approved', 'rejected')),
    notes text,
    decided_at timestamptz
);

create unique index idx_approvals_request_sequence on approvals(request_id, approval_sequence);

-- ============================================================
-- AUDIT_LOG
-- Append-only. No update/delete path should ever be built against this table.
-- ============================================================
create table audit_log (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references requests(id),
    event_type text not null,
    actor text not null, -- 'agent' | a specific approver_role | 'system'
    detail jsonb,
    occurred_at timestamptz not null default now()
);

create index idx_audit_log_request on audit_log(request_id);

-- Revoke update/delete at the database role level in a real deployment:
-- revoke update, delete on audit_log from app_role;

-- ============================================================
-- TOKEN_USAGE
-- Real-time tokenomics. Queried directly by the live dashboard, not derived from audit_log.
-- ============================================================
create table token_usage (
    id uuid primary key default gen_random_uuid(),
    request_id uuid references requests(id),
    agent_id uuid not null references agents(id),
    tokens_used int not null,
    cost_usd numeric(10,4) not null,
    recorded_at timestamptz not null default now()
);

create index idx_token_usage_agent on token_usage(agent_id);
create index idx_token_usage_recorded_at on token_usage(recorded_at);

-- Convenience view for the live dashboard: running spend per agent against its budget cap
-- security_invoker = true: the view respects the querying user's RLS permissions,
-- not the view creator's. Without this, the view bypasses RLS on its underlying
-- tables entirely, see harness/data/data-model.md for why this matters here.
create view v_agent_budget_status
    with (security_invoker = true)
as
select
    a.id as agent_id,
    a.name,
    a.tier,
    a.budget_cap,
    coalesce(sum(t.cost_usd), 0) as spend_to_date,
    a.budget_cap - coalesce(sum(t.cost_usd), 0) as remaining_budget
from agents a
left join token_usage t on t.agent_id = a.id
group by a.id, a.name, a.tier, a.budget_cap;

-- ============================================================
-- ESCALATIONS
-- Pattern-level, not request-level. Multiple AdviceLine requests may feed one escalation.
-- ============================================================
create table escalations (
    id uuid primary key default gen_random_uuid(),
    theme text not null,
    pattern_count int not null default 1,
    time_window text not null, -- e.g. '30 days', threshold defined during build
    escalated_to_domain_lead text,
    status text not null default 'monitoring' check (status in ('monitoring', 'escalated', 'resolved')),
    created_at timestamptz not null default now()
);

-- Join table: which requests contributed to which escalation pattern
create table escalation_requests (
    escalation_id uuid not null references escalations(id),
    request_id uuid not null references requests(id),
    primary key (escalation_id, request_id)
);

-- ============================================================
-- POLICY_POSITIONS
-- ============================================================
create table policy_positions (
    id uuid primary key default gen_random_uuid(),
    pillar_tag text not null check (pillar_tag in (
        'employment_relations', 'health_safety', 'infrastructure',
        'education_skills', 'immigration', 'manufacturing_export'
    )),
    status text not null default 'draft' check (status in ('draft', 'published')),
    originating_escalation_id uuid references escalations(id),
    created_at timestamptz not null default now()
);
