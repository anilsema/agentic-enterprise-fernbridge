import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/harness/rate-limit";

/**
 * clerkMiddleware() still runs on every request, it populates the auth
 * context that resource-level auth.protect() calls depend on. What it no
 * longer does is decide WHICH routes are protected via path matching
 * (createRouteMatcher), that decision now lives at each resource itself:
 * app/demo/page.tsx and each API route under app/api/demo/ call
 * auth.protect() or check auth() directly. See
 * docs/hosting-and-protection-plan.md and the comment in app/demo/page.tsx
 * for the full reasoning.
 *
 * Rate limiting is a genuinely separate concern from auth, checked here
 * because middleware is the earliest point a request can be rejected,
 * before it costs anything downstream. Scoped to /demo and /api/demo only,
 * the landing page stays fast and dependency-free, same split as auth.
 * Requires the Node.js runtime (stable since Next.js 15.5), since the
 * shared Postgres client uses a raw TCP connection the default Edge
 * runtime does not support.
 */
const RATE_LIMITED_PREFIXES = ["/demo", "/api/demo"];

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

const clerkHandler = clerkMiddleware();

export default async function middleware(req: NextRequest, event: any) {
  const isRateLimited = RATE_LIMITED_PREFIXES.some((p) => req.nextUrl.pathname.startsWith(p));

  if (isRateLimited) {
    const identifier = getClientIdentifier(req);
    const result = await checkRateLimit(identifier);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }
  }

  return clerkHandler(req, event);
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
