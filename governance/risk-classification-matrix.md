# Risk Classification Matrix
### Membership Association Context — Fernbridge Business Alliance — Membership & Advocacy Functions

*Fernbridge Business Alliance is a fictitious organisation used for illustrative purposes throughout this document.*

## The five criteria that determine tier

Before the matrix itself, define what you're actually scoring. Five dimensions, each scored independently, then combined into a single tier. This mirrors how the Idea-to-Initiative Framework scored investment proposals against multiple criteria before a single funding decision, same discipline, applied to agent autonomy instead of capital.

| Dimension | Question it answers |
|---|---|
| **Reversibility** | Can a human undo this action after the fact with no lasting harm? |
| **Data sensitivity** | Does this touch member PII, financial data, or confidential advocacy positions? |
| **Public exposure** | Is the output seen only internally, or does it reach members, media, or regulators? |
| **Reputational/legal exposure** | If the agent gets this wrong, does it damage Fernbridge's standing or create legal exposure? |
| **Decision novelty** | Is this a routine, well-precedented task, or does it require judgement Fernbridge hasn't automated before? |

Score each Low/Medium/High, then the **overall tier is set by the highest single score**, not an average. One high-risk dimension is enough to pull the whole task into the high-risk tier, this is the same logic as a risk register where one red flag vetoes a green overall status regardless of the other scores.

---

## The tier structure

| Tier | Human oversight model | Approval authority | Audit requirement |
|---|---|---|---|
| **Low** | Human-above-the-loop (monitor, can pause/override) | None required per action | Logged, reviewed in aggregate weekly |
| **Medium** | Human-in-the-loop (single approval before execution) | Named role, e.g. Membership Coordinator | Logged individually, reviewed per action |
| **High** | Human-in-the-loop, dual confirmation | Named role plus a second approver, e.g. Domain Lead + Advocacy Manager | Logged individually, retained for compliance, reviewed before and after execution |

---

## Membership function — worked examples

| Task | Reversibility | Data sensitivity | Public exposure | Reputational/legal | Novelty | **Tier** |
|---|---|---|---|---|---|---|
| Answer FAQ on membership tiers/pricing | High (easily corrected) | Low | Low (1:1 chat) | Low | Low | **Low** |
| Send renewal reminder emails | High | Low (name/email only) | Medium (member sees it) | Low | Low | **Low** |
| Process a membership renewal payment | Medium (refundable but effortful) | High (financial + PII) | Low | Medium | Low | **Medium** |
| Update member contact/company details | Medium (correctable but visible in records) | Medium | Low | Low | Low | **Medium** |
| Approve or reject a new membership application | Low (reputational precedent once decided) | Medium | Medium (applicant-facing) | Medium | Medium | **Medium** |
| Cancel a membership following a dispute | Low (hard to reverse trust damage) | Medium | Medium | High | Medium | **High** |

## Advocacy function — worked examples

| Task | Reversibility | Data sensitivity | Public exposure | Reputational/legal | Novelty | **Tier** |
|---|---|---|---|---|---|---|
| Monitor and summarise sector news for the advocacy pipeline | High | Low | Low (internal briefing) | Low | Low | **Low** |
| Draft internal talking points for a domain lead's review | High (unpublished draft) | Low | Low (internal only) | Low | Medium | **Low** |
| Draft first-pass content for a policy submission | Medium (draft, but anchors thinking) | Low | Medium (domain lead sees it, may reuse phrasing) | Medium | High | **Medium** |
| Respond to a routine member query on a known advocacy position | High | Low | Medium (member-facing) | Low | Low | **Low** |
| Respond to a media enquiry on a contentious issue | Low (public statements are hard to walk back) | Low | High | High | High | **High** |
| Submit or publish a formal policy submission | None (once submitted, it's on the record) | Low | High | High | High | **High** |

---

## Why this mapping is honest, not generous

Notice most Advocacy tasks land Low or High with little Medium, that's a genuine feature of the domain, not a modelling shortcut. Research and drafting are low-stakes because a human reviews before anything leaves the building. Anything that becomes public (a submission, a media response) is irreversible in reputational terms the moment it's out, which correctly forces it to High regardless of how routine the underlying research was. This mirrors the Fernbridge Advocacy model: supporting domain leads on the pipeline of contentious issues is safe exploratory work, the submission itself is where governance tightens.

For the demo build, this gives you a clean instructional case: Agent 1 (low risk, human-above-the-loop) naturally maps to sector monitoring or FAQ response, Agent 2 (medium, human-in-the-loop) maps to renewal processing or first-pass submission drafting, Agent 3 (high, dual-confirmation) maps to anything that publishes or communicates externally on a contentious position, which is also the most narratively compelling tier to demonstrate, since it's the one where getting it wrong would actually matter.

---

## One field left for you to define

**Escalation path**: who does an agent hand off to when it's uncertain which tier applies? For Fernbridge's real Advocacy function this would likely be the relevant Domain Lead. Worth naming a specific role in your documentation rather than leaving it generic, it's a small addition that makes the governance story concrete rather than theoretical.
