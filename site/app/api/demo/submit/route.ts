import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runAgent1 } from "@/lib/harness/agent1";
import { proposeRenewal } from "@/lib/harness/agent2";
import { proposeAdviceLineGuidance } from "@/lib/harness/agent3";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { demoType, input } = await req.json();

    if (demoType === "low") {
      const result = await runAgent1(null, input || "agriculture");
      return NextResponse.json({ kind: "low", result });
    }

    if (demoType === "medium") {
      const result = await proposeRenewal(null, input || "standard");
      return NextResponse.json({ kind: "medium", result });
    }

    if (demoType === "high") {
      const result = await proposeAdviceLineGuidance(null, input || "dismissal");
      return NextResponse.json({ kind: "high", result });
    }

    return NextResponse.json({ error: "Unknown demoType" }, { status: 400 });
  } catch (err) {
    console.error("Demo submit error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
