import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * clerkMiddleware() still runs on every request, it populates the auth
 * context that resource-level auth.protect() calls depend on. What it no
 * longer does is decide WHICH routes are protected via path matching
 * (createRouteMatcher), that decision now lives at each resource itself:
 * app/demo/page.tsx and each API route under app/api/demo/ call
 * auth.protect() or check auth() directly. See
 * docs/hosting-and-protection-plan.md and the comment in app/demo/page.tsx
 * for the full reasoning.
 */
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
