import { sql, closeConnection } from "./db";
import { checkBudget, recordUsage, recordAgentOutcome, checkCircuitBreaker } from "./budget";

async function run() {
  // Create a fresh test agent with a small budget cap so we can actually exhaust it
  const [agent] = await sql`
    insert into agents (name, tier, pillar, budget_cap) values ('Test Budget Agent', 'low', 'membership', 10.00)
    returning id;
  `;
  const agentId = agent.id;
  console.log("Created test agent:", agentId, "with $10.00 budget cap\n");

  const [request] = await sql`insert into requests (pillar, task_type) values ('membership', 'test_task') returning id;`;
  const requestId = request.id;

  console.log("Test 1: checkBudget on a fresh agent, estimated cost $3\n");
  const check1 = await checkBudget(agentId, 3.0);
  console.log(check1);
  console.log(check1.allowed ? "✅ PASS — allowed, plenty of budget" : "❌ FAIL");

  console.log("\nTest 2: recordUsage of $7, then re-check budget\n");
  await recordUsage(requestId, agentId, 1200, 7.0);
  const check2 = await checkBudget(agentId, 1.0);
  console.log(check2);
  console.log(
    check2.remainingBudget === 3.0 ? "✅ PASS — remaining correctly shows $3.00" : "❌ FAIL"
  );

  console.log("\nTest 3: checkBudget for $5 when only $3 remains — should be rejected\n");
  const check3 = await checkBudget(agentId, 5.0);
  console.log(check3);
  console.log(!check3.allowed ? "✅ PASS — correctly rejected" : "❌ FAIL");

  console.log("\nTest 4: record 3 consecutive failures — circuit breaker should trip\n");
  await recordAgentOutcome(agentId, requestId, "failure");
  await recordAgentOutcome(agentId, requestId, "failure");
  await recordAgentOutcome(agentId, requestId, "failure");
  const cbResult = await checkCircuitBreaker(agentId);
  console.log(cbResult);
  console.log(cbResult.tripped ? "✅ PASS — breaker tripped after 3 consecutive failures" : "❌ FAIL");

  const [agentStatus] = await sql`select active from agents where id = ${agentId};`;
  console.log(
    agentStatus.active === false
      ? "✅ PASS — agent correctly deactivated"
      : "❌ FAIL — agent should be inactive"
  );

  await closeConnection();
}

run();
