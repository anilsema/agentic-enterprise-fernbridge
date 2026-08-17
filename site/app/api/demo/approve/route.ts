import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { actOnProposal } from "@/lib/harness/agent2";
import { actOnDualApproval } from "@/lib/harness/agent3";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tier, requestId, sequence, decision, topicKeyword } = await req.json();

    if (tier === "medium") {
      const result = await actOnProposal(requestId, "Membership and Export Manager", decision);
      return NextResponse.json({ kind: "medium", result });
    }

    if (tier === "high") {
      const approverRole = sequence === 1 ? "Legal Counsel" : "Head of Legal";
      const result = await actOnDualApproval(requestId, sequence, approverRole, decision, topicKeyword);
      return NextResponse.json({ kind: "high", result });
    }

    return NextResponse.json({ error: "Unknown tier" }, { status: 400 });
  } catch (err) {
    console.error("Demo approve error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
