import { auth } from "@clerk/nextjs/server";
import DemoClient from "./DemoClient";

/**
 * Resource-based auth check, per Clerk's current guidance (replaces the
 * deprecated createRouteMatcher + middleware path-matching pattern, see
 * middleware.ts). auth.protect() is called HERE, at the actual resource,
 * not inferred from a URL pattern in middleware — this closes the exact
 * gap Clerk's deprecation warning describes: middleware path matching can
 * diverge from how Next.js actually routes requests, potentially leaving
 * a protected resource reachable. Checking at the resource itself cannot
 * have that class of gap, since there's no pattern to diverge from.
 */
export default async function DemoPage() {
  await auth.protect();
  return <DemoClient />;
}
