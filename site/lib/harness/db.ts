import postgres from "postgres";

/**
 * Single shared Postgres connection, Next.js context.
 *
 * Unlike the CLI harness scripts (harness/db.ts), this does NOT manually
 * load .env.local, Next.js loads environment variables natively for
 * server-side code (API routes, Server Components) from .env.local in
 * local dev, and from Vercel's Environment Variables dashboard in
 * production. Manual dotenv loading here would be redundant at best and
 * could conflict with Next.js's own env handling at worst.
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is not set. In local dev, add it to site/.env.local. In production, set it in Vercel's Environment Variables.`
  );
}

export const sql = postgres(process.env.DATABASE_URL);
