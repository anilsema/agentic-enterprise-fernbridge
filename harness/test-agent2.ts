import { proposeRenewal, actOnProposal } from "./agent2";
import { closeConnection } from "./db";

async function run() {
  console.log("Test 1: Propose a renewal (premium tier member)\n");
  const proposal1 = await proposeRenewal(null, "premium");
  console.log(proposal1);
  console.log(
    proposal1.status === "pending_approval" && proposal1.proposedAmount === 950
      ? "✅ PASS — proposal created, awaiting approval, correct amount calculated"
      : "❌ FAIL"
  );

  console.log("\nTest 2: Approve the proposal — should execute\n");
  const outcome1 = await actOnProposal(proposal1.requestId, "Membership and Export Manager", "approved");
  console.log(outcome1);
  console.log(outcome1.executed ? "✅ PASS — approved and executed" : "❌ FAIL");

  console.log("\nTest 3: Propose a second renewal, then REJECT it\n");
  const proposal2 = await proposeRenewal(null, "standard");
  console.log(proposal2);
  const outcome2 = await actOnProposal(proposal2.requestId, "Membership and Export Manager", "rejected");
  console.log(outcome2);
  console.log(
    outcome2.decision === "rejected" && outcome2.executed === false
      ? "✅ PASS — rejected, correctly did not execute"
      : "❌ FAIL"
  );

  console.log("\nTest 4: Attempt to act on the same request twice — should throw\n");
  try {
    await actOnProposal(proposal2.requestId, "Membership and Export Manager", "approved");
    console.log("❌ FAIL — should have thrown, decision already recorded");
  } catch (e) {
    console.log("✅ PASS — correctly refused to act twice on the same approval:", (e as Error).message);
  }

  await closeConnection();
}

run();
