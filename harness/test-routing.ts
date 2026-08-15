import { submitRequest } from "./intake";
import { routeRequest } from "./routing";
import { closeConnection } from "./db";

async function run() {
  console.log("Test 1: Low tier (match_export_resources) — expect auto-approve, 0 approvals\n");
  const c1 = await submitRequest(null, "membership", "match_export_resources");
  const r1 = await routeRequest(c1.requestId);
  console.log(r1);
  console.log(
    r1.approversAssigned.length === 0 && r1.requestStatus === "approved"
      ? "✅ PASS"
      : "❌ FAIL"
  );

  console.log("\nTest 2: Medium tier (track_submission_deadlines) — expect 1 approver\n");
  const c2 = await submitRequest(null, "advocacy", "track_submission_deadlines");
  const r2 = await routeRequest(c2.requestId);
  console.log(r2);
  console.log(r2.approversAssigned.length === 1 ? "✅ PASS" : "❌ FAIL");

  console.log("\nTest 3: High tier, AdviceLine (answer_adviceline_query) — expect 2 approvers, Legal Counsel + Head of Legal, NOT Membership's approvers\n");
  const c3 = await submitRequest(null, "membership", "answer_adviceline_query");
  const r3 = await routeRequest(c3.requestId);
  console.log(r3);
  const correctApprovers =
    r3.effectivePillar === "legal_consulting" &&
    r3.approversAssigned[0] === "Legal Counsel" &&
    r3.approversAssigned[1] === "Head of Legal";
  console.log(correctApprovers ? "✅ PASS — correctly overrode to Legal/Consulting approvers" : "❌ FAIL");

  await closeConnection();
}

run();
