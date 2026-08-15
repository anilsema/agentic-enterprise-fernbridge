import { sql, closeConnection } from "./db";

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
    await closeConnection();
  }
}

testConnection();
