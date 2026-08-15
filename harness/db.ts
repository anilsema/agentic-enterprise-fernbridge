import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

const envPath = path.resolve(process.cwd(), "../.env.local");

if (!existsSync(envPath)) {
  throw new Error(
    `Could not find .env.local at ${envPath}. Are you running this from inside the harness/ folder?`
  );
}

dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(`.env.local was found at ${envPath} but DATABASE_URL is not set inside it.`);
}

/**
 * Single shared Postgres connection for the entire harness.
 *
 * Every module (intake, routing, budget, agent1, agent2, agent3, ...) imports
 * this SAME instance rather than opening its own. This matters for two reasons:
 *
 * 1. Correctness: Node won't exit a script until every open connection pool is
 *    closed. Four separate connections meant four separate things to close,
 *    which is what caused the hang after test-agent1.ts finished.
 * 2. Resource usage: Supabase (like most managed Postgres) caps concurrent
 *    connections. One shared pool scales; N modules each opening their own
 *    does not, and this problem gets worse, not better, as Agents 2 and 3
 *    and eventually the external site all need to talk to the database.
 */
export const sql = postgres(process.env.DATABASE_URL);

export async function closeConnection() {
  await sql.end();
}
