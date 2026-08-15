import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

const envPath = path.resolve(process.cwd(), "../.env.local");

if (!existsSync(envPath)) {
  console.error(`Could not find .env.local at ${envPath}. Are you running this from inside the harness/ folder?`);
  process.exit(1);
}

dotenv.config({ path: envPath });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL not found. Check .env.local exists at the repo root and contains it.");
  process.exit(1);
}

const sql = postgres(connectionString);

async function testConnection() {
  try {
    const tables = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name;
    `;
    console.log("✅ Connected to Supabase successfully.\n");
    console.log("Tables found:");
    tables.forEach((t) => console.log("  -", t.table_name));

    const budgetCheck = await sql`select * from v_agent_budget_status;`;
    console.log(`\n✅ v_agent_budget_status view is queryable (${budgetCheck.length} agent(s) found).`);
  } catch (err) {
    console.error("❌ Connection or query failed:", err);
  } finally {
    await sql.end();
  }
}

testConnection();
