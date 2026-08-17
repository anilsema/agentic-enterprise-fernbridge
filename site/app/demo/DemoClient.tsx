"use client";

import { useState, useEffect, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";

const T = {
  navy: "#0B1628", navyMid: "#132035", navyLt: "#1E3050",
  teal: "#2DD4C8", gold: "#C9A84C", text: "#E8EDF5", textMut: "#8BA0BC",
  border: "#243350", green: "#22C55E", amber: "#F59E0B", red: "#EF4444",
};

interface BudgetRow {
  agent_id: string; name: string; tier: string;
  budget_cap: string; spend_to_date: string; remaining_budget: string;
}

function BudgetDashboard() {
  const [rows, setRows] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/budget");
      const data = await res.json();
      if (data.agents) setRows(data.agents);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBudget();
    const interval = setInterval(fetchBudget, 5000);
    return () => clearInterval(interval);
  }, [fetchBudget]);

  const tierColor: Record<string, string> = { low: T.green, medium: T.amber, high: T.red };

  return (
    <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: T.gold, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Live Tokenomics — Real-Time Budget Status
        </div>
        <div style={{ color: T.textMut, fontSize: 11 }}>refreshes every 5s</div>
      </div>
      {loading ? (
        <div style={{ color: T.textMut, fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {rows.map((r) => {
            const cap = parseFloat(r.budget_cap);
            const spend = parseFloat(r.spend_to_date);
            const pct = cap > 0 ? Math.min((spend / cap) * 100, 100) : 0;
            return (
              <div key={r.agent_id} style={{ background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: tierColor[r.tier], fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>
                  {r.name}
                </div>
                <div style={{ color: T.text, fontSize: 13, marginBottom: 8 }}>
                  ${spend.toFixed(5)} spent / ${cap.toFixed(2)} cap
                </div>
                <div style={{ background: T.border, borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{ background: tierColor[r.tier], height: "100%", width: `${pct}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultBlock({ data }: { data: any }) {
  if (!data) return null;
  if (data.error) {
    return <div style={{ color: T.red, fontSize: 13, marginTop: 10 }}>Error: {data.error}</div>;
  }
  return (
    <pre style={{
      background: T.navy, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: 12, fontSize: 12, color: T.text, marginTop: 10, overflowX: "auto",
      whiteSpace: "pre-wrap", wordBreak: "break-word",
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function LowTierCard() {
  const [keyword, setKeyword] = useState("agriculture");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/demo/submit", {
      method: "POST",
      body: JSON.stringify({ demoType: "low", input: keyword }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  return (
    <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, borderLeft: `3px solid ${T.green}` }}>
      <div style={{ color: T.green, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Low Tier — Agent 1</div>
      <div style={{ color: T.textMut, fontSize: 12, marginBottom: 12 }}>Human-above-the-loop. Executes immediately, no approval needed.</div>
      <div style={{ color: T.text, fontSize: 13, marginBottom: 8 }}>Match export resources for:</div>
      <select value={keyword} onChange={(e) => setKeyword(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 6, background: T.navy, color: T.text, border: `1px solid ${T.border}`, marginBottom: 10 }}>
        <option value="agriculture">Agriculture</option>
        <option value="technology">Technology</option>
        <option value="manufacturing">Manufacturing</option>
        <option value="unknown">Something else (fallback test)</option>
      </select>
      <button onClick={submit} disabled={loading}
        style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: T.teal, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
        {loading ? "Running…" : "Submit"}
      </button>
      <ResultBlock data={result} />
    </div>
  );
}

function MediumTierCard() {
  const [tier, setTier] = useState("standard");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/demo/submit", {
      method: "POST",
      body: JSON.stringify({ demoType: "medium", input: tier }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  async function act(decision: "approved" | "rejected") {
    setLoading(true);
    const requestId = result?.result?.requestId;
    const res = await fetch("/api/demo/approve", {
      method: "POST",
      body: JSON.stringify({ tier: "medium", requestId, decision }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  const pending = result?.result?.status === "pending_approval";

  return (
    <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, borderLeft: `3px solid ${T.amber}` }}>
      <div style={{ color: T.amber, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Medium Tier — Agent 2</div>
      <div style={{ color: T.textMut, fontSize: 12, marginBottom: 12 }}>Human-in-the-loop. Proposes, holds for one approval.</div>
      <div style={{ color: T.text, fontSize: 13, marginBottom: 8 }}>Process a renewal for member tier:</div>
      <select value={tier} onChange={(e) => setTier(e.target.value)} disabled={pending}
        style={{ width: "100%", padding: 8, borderRadius: 6, background: T.navy, color: T.text, border: `1px solid ${T.border}`, marginBottom: 10 }}>
        <option value="standard">Standard ($450)</option>
        <option value="premium">Premium ($950)</option>
        <option value="export">Export ($1,400)</option>
      </select>
      {!pending && (
        <button onClick={submit} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: T.teal, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Proposing…" : "Propose Renewal"}
        </button>
      )}
      {pending && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => act("approved")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
            Approve (as Membership Manager)
          </button>
          <button onClick={() => act("rejected")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontWeight: 700, cursor: "pointer" }}>
            Reject
          </button>
        </div>
      )}
      <ResultBlock data={result} />
    </div>
  );
}

function HighTierCard() {
  const [topic, setTopic] = useState("dismissal");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/demo/submit", {
      method: "POST",
      body: JSON.stringify({ demoType: "high", input: topic }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  async function act(sequence: 1 | 2, decision: "approved" | "rejected") {
    setLoading(true);
    const requestId = result?.result?.requestId;
    const res = await fetch("/api/demo/approve", {
      method: "POST",
      body: JSON.stringify({ tier: "high", requestId, sequence, decision, topicKeyword: topic }),
    });
    setResult(await res.json());
    setLoading(false);
  }

  const status = result?.result?.status;
  const afterSeq1 = result?.result?.sequence === 1 && result?.result?.decision === "approved";
  const awaitingSeq1 = status === "pending_dual_approval";

  return (
    <div style={{ background: T.navyMid, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, borderLeft: `3px solid ${T.red}` }}>
      <div style={{ color: T.red, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>High Tier — Agent 3</div>
      <div style={{ color: T.textMut, fontSize: 12, marginBottom: 12 }}>Dual confirmation. Real Claude API call once both approve.</div>
      <div style={{ color: T.text, fontSize: 13, marginBottom: 8 }}>AdviceLine query topic:</div>
      <select value={topic} onChange={(e) => setTopic(e.target.value)} disabled={awaitingSeq1 || afterSeq1}
        style={{ width: "100%", padding: 8, borderRadius: 6, background: T.navy, color: T.text, border: `1px solid ${T.border}`, marginBottom: 10 }}>
        <option value="dismissal">Dismissal</option>
        <option value="restructuring">Restructuring</option>
        <option value="personal grievance">Personal Grievance</option>
      </select>
      {!awaitingSeq1 && !afterSeq1 && (
        <button onClick={submit} disabled={loading}
          style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: T.teal, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Proposing…" : "Propose Guidance"}
        </button>
      )}
      {awaitingSeq1 && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => act(1, "approved")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
            Approve (as Legal Counsel)
          </button>
          <button onClick={() => act(1, "rejected")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontWeight: 700, cursor: "pointer" }}>
            Reject
          </button>
        </div>
      )}
      {afterSeq1 && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => act(2, "approved")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: T.green, color: T.navy, fontWeight: 700, cursor: "pointer" }}>
            {loading ? "Calling Claude…" : "Approve (as Head of Legal)"}
          </button>
          <button onClick={() => act(2, "rejected")} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontWeight: 700, cursor: "pointer" }}>
            Reject
          </button>
        </div>
      )}
      <ResultBlock data={result} />
    </div>
  );
}

export default function DemoClient() {
  return (
    <div style={{ minHeight: "100vh", background: T.navy, color: T.text, fontFamily: "-apple-system, sans-serif", padding: "0 0 60px" }}>
      <div style={{ background: T.navyMid, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: T.teal, fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>FERNBRIDGE — INTERACTIVE DEMO</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Governance-First Agentic Enterprise</div>
        </div>
        <UserButton />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <p style={{ color: T.textMut, fontSize: 14, marginBottom: 24 }}>
          Try all three tiers. You are role-playing the approver at each step, the same governance chain documented in the repository is enforced for real underneath, requests are classified, routed, and recorded exactly as they would be in production.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <LowTierCard />
          <MediumTierCard />
          <HighTierCard />
        </div>
        <BudgetDashboard />
      </div>
    </div>
  );
}
