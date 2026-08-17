import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/harness/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const agents = await sql`
      select agent_id, name, tier, budget_cap, spend_to_date, remaining_budget
      from v_agent_budget_status
      order by
        case tier when 'low' then 1 when 'medium' then 2 when 'high' then 3 end;
    `;
    return NextResponse.json({ agents });
  } catch (err) {
    console.error("Budget fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
