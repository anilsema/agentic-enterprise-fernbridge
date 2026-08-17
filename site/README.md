# External Site

Next.js 15 app, deployed on Vercel at `fernbridge.kunjunnys.com`.

## Structure

- `app/page.tsx` — public landing page. No auth required, static, always available regardless of what's happening with the interactive demo below.
- `app/demo/page.tsx` — interactive demo. Gated by Clerk (see `middleware.ts`). Lets a visitor role-play submitting and approving requests across all three risk tiers, wired to the real harness logic.
- `app/api/demo/*` — API routes the demo page calls: `submit` (classify + route, or execute if Low tier), `approve` (act on a Medium/High pending approval), `budget` (live tokenomics feed).
- `lib/harness/*` — a deployed copy of the harness modules from `/harness` at the repo root. Duplicated rather than imported directly because Vercel's build is rooted at `/site`; files outside that root aren't included in the deployment. Keep in sync manually if the harness logic changes.
- `middleware.ts` — the actual access gate. See `docs/hosting-and-protection-plan.md` for why this replaced the originally-planned Cloudflare Access layer: it gates `/demo` and `/api/demo/*` specifically at the application layer, while the landing page stays fully public.

## Environment variables needed

Local dev (`site/.env.local`, already git-ignored):
```
DATABASE_URL=<supabase connection string, direct or pooled>
ANTHROPIC_API_KEY=<your key>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<from Clerk dashboard>
CLERK_SECRET_KEY=<from Clerk dashboard>
```

Production (Vercel project → Settings → Environment Variables): same four variables. For `DATABASE_URL` specifically, use Supabase's **Transaction Pooler** connection string (port 6543) here, not the direct connection, serverless functions open many short-lived connections and the pooler is what Supabase recommends for exactly this pattern. Local dev can use either.

## Running locally

```bash
npm install
npm run dev
```

Visit `localhost:3000` for the landing page, `localhost:3000/demo` for the gated interactive demo (requires signing in via Clerk).
