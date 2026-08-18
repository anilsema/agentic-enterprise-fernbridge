export default function LandingPage() {
  return (
    <>
      <style>{`
        :root {
          --navy: #0B1628; --navy-mid: #132035; --navy-lt: #1E3050;
          --teal: #2DD4C8; --gold: #C9A84C; --text: #E8EDF5; --text-mut: #8BA0BC; --border: #243350;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--navy); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; line-height: 1.65; }
        .wrap { max-width: 780px; margin: 0 auto; padding: 64px 24px 96px; }
        .kicker { color: var(--teal); font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px; }
        .fictitious { background: var(--navy-mid); border: 1px solid var(--border); border-left: 3px solid var(--gold); border-radius: 8px; padding: 14px 18px; font-size: 14px; color: var(--text-mut); margin: 24px 0 40px; }
        .fictitious strong { color: var(--gold); }
        h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 8px; color: var(--text); }
        .subtitle { color: var(--text-mut); font-size: 17px; margin-bottom: 40px; }
        h2 { color: var(--gold); font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin: 44px 0 18px; }
        p { color: var(--text); font-size: 15.5px; margin: 0 0 16px; }
        .tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0 8px; }
        .tier { background: var(--navy-mid); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
        .tier .label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .tier.low .label { color: #22C55E; } .tier.medium .label { color: #F59E0B; } .tier.high .label { color: #EF4444; }
        .tier .desc { font-size: 13.5px; color: var(--text-mut); }
        .principles { padding-left: 0; list-style: none; margin: 0; }
        .principles li { padding: 10px 0 10px 22px; border-bottom: 1px solid rgba(36,51,80,0.4); font-size: 14.5px; color: var(--text-mut); position: relative; }
        .principles li::before { content: "—"; position: absolute; left: 0; color: var(--gold); }
        .principles strong { color: var(--text); }
        .cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 40px 0 8px; }
        .btn { display: inline-block; padding: 12px 22px; border-radius: 9px; font-size: 14px; font-weight: 700; text-decoration: none; }
        .btn-primary { background: var(--teal); color: var(--navy); }
        .btn-secondary { background: transparent; color: var(--text-mut); border: 1px solid var(--border); }
        footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--border); color: var(--text-mut); font-size: 13px; }
        footer a { color: var(--teal); text-decoration: none; }
        @media (max-width: 600px) { .tiers { grid-template-columns: 1fr; } h1 { font-size: 27px; } }
      `}</style>
      <div className="wrap">
        <div className="kicker">Agentic Enterprise — Reference Implementation</div>
        <h1>A Governance-First Approach to AI Agents</h1>
        <p className="subtitle">Risk classification and human oversight, designed before a single agent was written.</p>

        <div className="fictitious">
          <strong>Fernbridge Business Alliance</strong> is a fictitious membership association, used throughout this project for illustrative purposes. No real organisation, individual, or dataset is represented here.
        </div>

        <h2>The Sequencing Story</h2>
        <p>Most agentic AI projects start with the agent. This one didn&apos;t. The risk classification matrix, the three-pillar governance structure, and the data foundation were designed and validated before a single line of agent code existed, the same foundation-before-capability discipline behind real transformation programmes, applied here to a working system.</p>
        <p>Every task an agent might handle is scored across five independent dimensions, reversibility, data sensitivity, public exposure, reputational/legal exposure, and decision novelty, then routed to one of three oversight models based on the highest-scoring dimension, not an average.</p>

        <h2>Three Tiers, Three Real Oversight Models</h2>
        <div className="tiers">
          <div className="tier low">
            <div className="label">Low — Agent 1</div>
            <div className="desc">Human-above-the-loop. Acts autonomously within a real-time budget cap; a human monitors and can pause or override.</div>
          </div>
          <div className="tier medium">
            <div className="label">Medium — Agent 2</div>
            <div className="desc">Human-in-the-loop. Proposes an action, holds for a single approval before executing. Rejection is isolated from failure tracking.</div>
          </div>
          <div className="tier high">
            <div className="label">High — Agent 3</div>
            <div className="desc">Dual confirmation. Two independent, sequenced approvals required. A live Claude API call sits behind this tier, with a hard cost ceiling.</div>
          </div>
        </div>

        <h2>Governance Principles</h2>
        <ul className="principles">
          <li><strong>Proportionality</strong> — control scales with consequence, not activity volume or general caution.</li>
          <li><strong>Verifiable Trust</strong> — trust is earned through an audit trail, not assumed at deployment.</li>
          <li><strong>Data Minimalism</strong> — one authoritative source per fact, never a cached or reconstructed copy.</li>
          <li><strong>Accountable Escalation</strong> — every tier has a named human role accountable for it, even at full autonomy.</li>
          <li><strong>Foundation Before Capability</strong> — governance and data design come before agent capability, not after.</li>
        </ul>

        <h2>Tokenomics, Not Just a Budget Cap</h2>
        <p>Real-time spend tracking, validated against live infrastructure, distinguishes between two different problems: cost control (a hard budget ceiling per agent, live and tested) and availability control (rate limiting, scoped and designed, next release). Most agentic demos miss this distinction entirely. The budget cap protects the wallet. It does not, by itself, protect against a bot exhausting an agent&apos;s capacity in minutes, that is a rate problem, not a cost problem, and it needs its own mechanism.</p>

        <div className="cta-row">
          <a className="btn btn-primary" href="/demo">Try the Interactive Demo</a>
          <a className="btn btn-secondary" href="https://github.com/anilsema/agentic-enterprise-fernbridge" target="_blank" rel="noopener noreferrer">View the Repository</a>
          <a className="btn btn-secondary" href="https://linkedin.com/in/kunjunny" target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a>
        </div>

        <footer>
          Built by <a href="https://linkedin.com/in/kunjunny" target="_blank" rel="noopener noreferrer">Anil Kunjunny</a> — Enterprise Transformation Architect, Auckland, NZ.
          Full governance framework, risk scoring worksheet, and source code in the repository above.
        </footer>
      </div>
    </>
  );
}
