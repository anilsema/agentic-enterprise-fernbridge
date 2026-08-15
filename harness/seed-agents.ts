import { sql, closeConnection } from "./db";

/**
 * Idempotent seed: safe to run more than once, will not create duplicates.
 * Budget caps are illustrative for the demo, not derived from any real costing
 * exercise — a real deployment would size these against actual expected volume.
 */
const REAL_AGENTS = [
  { name: "Agent 1 - Low Risk", tier: "low", pillar: "membership", budget_cap: 25.0 },
  { name: "Agent 2 - Medium Risk", tier: "medium", pillar: "advocacy", budget_cap: 15.0 },
  { name: "Agent 3 - High Risk", tier: "high", pillar: "legal_consulting", budget_cap: 10.0 },
];

async function seed() {
  for (const a of REAL_AGENTS) {
    const existing = await sql`select id from agents where name = ${a.name};`;
    if (existing.length > 0) {
      console.log(`Already exists: ${a.name} (${existing[0].id})`);
      continue;
    }
    const [created] = await sql`
      insert into agents (name, tier, pillar, budget_cap, active)
      values (${a.name}, ${a.tier}, ${a.pillar}, ${a.budget_cap}, true)
      returning id;
    `;
    console.log(`Created: ${a.name} (${created.id})`);
  }
  await closeConnection();
}

seed();
