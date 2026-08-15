import { submitRequest, closeConnection } from "./intake";

async function run() {
  console.log("Test 1: known Low-tier task (match_export_resources)\n");
  const r1 = await submitRequest(null, "membership", "match_export_resources");
  console.log(r1);
  console.log(r1.tier === "low" ? "✅ PASS — correctly classified Low" : "❌ FAIL — expected Low");

  console.log("\nTest 2: known High-tier task (answer_adviceline_query)\n");
  const r2 = await submitRequest(null, "membership", "answer_adviceline_query");
  console.log(r2);
  console.log(r2.tier === "high" ? "✅ PASS — correctly classified High" : "❌ FAIL — expected High");

  console.log("\nTest 3: unknown/novel task type (should fail-safe to High)\n");
  const r3 = await submitRequest(null, "advocacy", "some_task_not_in_catalog");
  console.log(r3);
  console.log(
    r3.tier === "high"
      ? "✅ PASS — unknown task correctly failed safe to High, not silently Low"
      : "❌ FAIL — unknown task should default to High"
  );

  await closeConnection();
}

run();
