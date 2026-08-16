import { proposeAdviceLineGuidance, actOnDualApproval } from "./agent3";
import { closeConnection } from "./db";

async function run() {
  console.log("Test 1: Propose AdviceLine guidance (dismissal query) — expect 2 approvers required\n");
  const proposal1 = await proposeAdviceLineGuidance(null, "dismissal");
  console.log(proposal1);
  console.log(
    proposal1.status === "pending_dual_approval" &&
      proposal1.approversRequired?.[0] === "Legal Counsel" &&
      proposal1.approversRequired?.[1] === "Head of Legal"
      ? "✅ PASS — correct dual approvers assigned"
      : "❌ FAIL"
  );

  console.log("\nTest 2: Try to act on sequence=2 BEFORE sequence=1 — should throw\n");
  try {
    await actOnDualApproval(proposal1.requestId, 2, "Head of Legal", "approved");
    console.log("❌ FAIL — should have thrown");
  } catch (e) {
    console.log("✅ PASS — correctly blocked:", (e as Error).message);
  }

  console.log("\nTest 3: Approve sequence=1 — should NOT execute yet (still needs sequence=2)\n");
  const outcome1 = await actOnDualApproval(proposal1.requestId, 1, "Legal Counsel", "approved");
  console.log(outcome1);
  console.log(
    outcome1.fullyApproved === false && outcome1.executed === false
      ? "✅ PASS — correctly still pending after only 1 of 2 approvals"
      : "❌ FAIL"
  );

  console.log("\nTest 4: Approve sequence=2 — NOW it should execute\n");
  const outcome2 = await actOnDualApproval(proposal1.requestId, 2, "Head of Legal", "approved", "dismissal");
  console.log(outcome2);
  console.log(
    outcome2.fullyApproved === true && outcome2.executed === true
      ? "✅ PASS — both confirmations in place, executed"
      : "❌ FAIL"
  );

  console.log("\nTest 5: Propose a second request, reject at sequence=1 — should stop entirely\n");
  const proposal2 = await proposeAdviceLineGuidance(null, "personal grievance");
  const rejectOutcome = await actOnDualApproval(proposal2.requestId, 1, "Legal Counsel", "rejected");
  console.log(rejectOutcome);
  console.log(
    rejectOutcome.decision === "rejected" && rejectOutcome.executed === false
      ? "✅ PASS — rejected at step 1, correctly did not proceed"
      : "❌ FAIL"
  );

  console.log("\nTest 6: Try to act on sequence=2 after sequence=1 was rejected — should throw\n");
  try {
    await actOnDualApproval(proposal2.requestId, 2, "Head of Legal", "approved");
    console.log("❌ FAIL — should have thrown");
  } catch (e) {
    console.log("✅ PASS — correctly blocked, sequence=1 was rejected, not approved:", (e as Error).message);
  }

  await closeConnection();
}

run();
