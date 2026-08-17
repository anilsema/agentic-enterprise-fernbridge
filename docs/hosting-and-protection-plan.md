# External Site — Hosting & Protection Plan
### A decision document, not yet a build — read through and choose before Monday's site work starts

## First, an honest scoping question

This is a public **portfolio demo**, not a production system serving real members. Fernbridge is fictitious, the data is illustrative, and the audience is recruiters, hiring managers, and LinkedIn connections, not paying customers. That distinction should shape what "protection" actually needs to achieve here, which is narrower than a real SaaS product:

- Prevent bots/scrapers from silently burning through your own real Supabase and Anthropic API costs, since you are personally paying for this infrastructure.
- Prevent the public demo from being defaced or spammed with garbage in a way that would look bad if someone you are interviewing with clicks the link.
- Prevent the underlying governed data (requests, approvals, audit log) from being polluted by random internet traffic, so the demo still tells a coherent story weeks after launch.

It does **not** need to defend against sophisticated targeted attackers the way a real bank or membership association's production system would, there is no real member data, no real financial transactions, and no real legal exposure behind it. Worth keeping this framing explicit, it changes which protections are worth the setup time and which are overkill for what this actually is.

---

## Hosting: two real options

### Option A — Vercel + Cloudflare DNS (recommended)
Deploy the site itself to Vercel (already the plan for the site build), then point `fernbridge.kunjunnys.com` at it via a CNAME record in Cloudflare, wherever `kunjunnys.com`'s DNS is currently managed.

**Why recommended:** Vercel is the natural home for the Next.js-style site the build plan already assumes, has first-class custom domain support, and this keeps the site build itself completely decoupled from the protection layer, which lives in front of it.

**Setup, roughly:**
1. In Vercel, add `fernbridge.kunjunnys.com` as a custom domain on the site project.
2. Vercel gives you a CNAME target (typically `cname.vercel-dns.com`).
3. In Cloudflare's DNS for `kunjunnys.com`, add a CNAME record: `fernbridge` → that target.
4. Vercel auto-provisions SSL once the DNS resolves.

### Option B — Cloudflare Pages directly
Skip Vercel entirely, host the static/site build on Cloudflare Pages instead, subdomain becomes native rather than a CNAME hop.

**Why not the default recommendation:** loses some of Vercel's more mature framework-specific tooling if the site ends up being a Next.js app calling the harness's API routes. Worth considering only if you want everything, DNS and hosting, under one provider for simplicity.

**Recommendation: Option A.** Standard, well-documented, and keeps hosting and DNS as separate, swappable concerns.

---

## Protection: layered, outer to inner

**Update, post-implementation:** the original plan below assumed Cloudflare Access gating the whole subdomain. In practice, Vercel's own DNS configuration screen explicitly recommended "DNS only" (not Proxied) for this domain, and Cloudflare Access requires proxied traffic to intercept anything, that's a genuine conflict, not a preference. Rather than force proxying through (which risks SSL certificate re-provisioning issues once introduced after the fact) just to enable a layer that was always a slightly blunt instrument for "gate only part of the site," the resolution below drops Cloudflare Access entirely and lets Clerk do that job instead, at the application layer, where it doesn't care about Cloudflare's proxy status at all.

### Layer 1 — Clerk SSO (now the actual front gate)
Gates the interactive demo route specifically, checked before the page renders anything, not the public landing page. The landing page stays fully public and DNS-only, matching the original "always works when linked from LinkedIn" goal without needing a separate network-layer gate in front of it.

### Layer 2 — Clerk bot detection
Configured explicitly in the Clerk dashboard, catches automated sign-up/sign-in attempts.

### Layer 3 — Rate limiting
Per session/IP, via Vercel Edge Middleware, independent of Cloudflare's proxy status since it runs on Vercel's own edge regardless.

### Layer 4 — Token budget cap (already built and validated)
The genuine cost-of-last-resort ceiling. Since Clerk gates the demo before any Supabase or Claude API call happens, this is defense in depth rather than the only thing standing between a bot and your wallet.

### Why this is not a weaker outcome
The actual thing worth protecting is not "does Vercel see the request", Vercel's free tier comfortably absorbs unauthenticated hits to a static or lightly-dynamic page. The thing worth protecting is the Supabase and Anthropic API calls, which only fire after Clerk confirms identity. Gating at that exact point is arguably more precise than gating the whole domain at the network edge, since it protects the actual cost driver directly rather than as a side effect of blocking all traffic.

---

## Original plan (superseded, kept for reference)

The section below was the original six-layer plan before the DNS/SSL conflict was discovered. Superseded by the section above, kept here so the reasoning trail is visible rather than silently deleted.

### Layer 1 — Password gate at the edge (the layer that actually protects your wallet)
Two real ways to do this, both stop traffic **before** it reaches Vercel, Clerk, or Supabase at all:

- **Cloudflare Access** (if `kunjunnys.com`'s DNS is on Cloudflare, which it sounds like it is): gate the entire `fernbridge.kunjunnys.com` subdomain behind a Cloudflare Access policy, either a shared password or an email-based one-time-passcode allowlist. This is genuinely the strongest option: unauthenticated traffic gets challenged by Cloudflare itself and never touches your origin server at all.
- **Vercel Edge Middleware with HTTP Basic Auth**: a lighter alternative if you'd rather keep everything inside Vercel. Slightly weaker than Cloudflare Access since the request does reach Vercel's edge before being rejected, but still stops it well before Clerk or Supabase.

**Recommendation: Cloudflare Access**, given the domain is already there. This single layer is the most important decision in this whole document, it is what actually prevents the "bot burns the budget cap in minutes" scenario discussed earlier, by stopping traffic before it can even trigger a request.

### Layer 2 — Clerk SSO
For anyone who gets past the password gate (you, and anyone you deliberately share access with) and wants to use the interactive self-service tools or approval dashboard, not the static/informational parts of the site.

### Layer 3 — Clerk bot detection
Configured explicitly (not automatic by default, as flagged earlier), catches automated sign-up/sign-in attempts even from someone who has the shared password.

### Layer 4 — Rate limiting
Per session/IP, independent of the token budget cap, as documented in `harness/data/data-model.md`. Belt-and-suspenders alongside Layer 1, in case the password is ever shared more widely than intended.

### Layer 5 — Token budget cap (already built and tested)
The innermost layer, already proven working since Saturday. Even if every outer layer somehow failed, this is the hard financial ceiling that was validated in Deep Block 3.

### Layer 6 — CAPTCHA on the self-service entry point
Lowest priority given Layer 1 already gates the whole subdomain, worth adding only if Layer 1's password ever needs to be shared more broadly (e.g. if this becomes a genuinely public-facing demo later rather than a shared-link portfolio piece).

---

## What this means practically for Monday

Given the portfolio-demo framing, **Layer 1 (Cloudflare Access) alone may be sufficient** for the initial public version, with Layers 2-5 demonstrating the governance model itself for anyone who does get access, rather than needing all six layers live before anything ships. Worth deciding:

1. **Domain:** confirm `fernbridge.kunjunnys.com` as the subdomain (recommended, ties it to your personal brand exactly as intended for the LinkedIn post).
2. **Gate mechanism:** Cloudflare Access with a shared password (simplest, good for "I'm sharing this link with a specific recruiter/interviewer") versus an email allowlist (more setup, better if you want to track who's actually viewed it).
3. **What sits behind the gate versus in front of it:** the whole site behind Cloudflare Access is simplest. An alternative is a public, static "about this project" landing page with the architecture diagram and governance narrative, with only the *interactive* self-service demo behind the password gate. This second option is arguably better for the LinkedIn post specifically, since it means the link you share publicly always works and tells the story, while the parts that could incur real cost stay protected.

---

## Status and next steps (current)

- ✅ Domain confirmed and live: `fernbridge.kunjunnys.com`, DNS-only, pointed at Vercel.
- ✅ Public landing page deployed and working.
- **Next:** wire Clerk into the interactive demo route specifically, not the whole site, gated at the application layer as described above.
- **Then:** Vercel Edge Middleware for rate limiting, independent of Cloudflare's proxy status.
- Cloudflare Access setup steps below are kept for reference only, not part of the current plan.
