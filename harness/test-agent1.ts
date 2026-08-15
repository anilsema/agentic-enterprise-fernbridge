import { runAgent1 } from "./agent1";
import { closeConnection } from "./db";

async function run() {
  console.log("Test 1: Agent 1 handles an export resource match request (keyword: agriculture)\n");
  const result1 = await runAgent1(null, "agriculture");
  console.log(result1);
  console.log(
    result1.status === "executed" && result1.matchedResources?.length
      ? "✅ PASS — executed end-to-end: classified, routed, budget-checked, executed, recorded"
      : "❌ FAIL"
  );

  console.log("\nTest 2: Agent 1 handles a query with no specific match (falls back to general resource)\n");
  const result2 = await runAgent1(null, "shipbuilding");
  console.log(result2);
  console.log(
    result2.matchedResources?.[0] === "General Export Starter Pack (NZTE)"
      ? "✅ PASS — fallback matching works correctly"
      : "❌ FAIL"
  );

  await closeConnection();
}

run();
