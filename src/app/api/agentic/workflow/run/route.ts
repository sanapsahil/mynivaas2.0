import { NextRequest, NextResponse } from "next/server";
import { runProactiveWorkflow } from "@/lib/agentic/workflow";
import { UserGoalInput } from "@/lib/agentic/types";
import { OrchestratorPropertyInput } from "@/lib/agentic/orchestrator";

interface WorkflowPayload {
  goals: UserGoalInput[];
  listings: OrchestratorPropertyInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WorkflowPayload;

    if (!Array.isArray(body.goals) || body.goals.length === 0) {
      return NextResponse.json({ error: "goals[] is required" }, { status: 400 });
    }

    if (!Array.isArray(body.listings) || body.listings.length === 0) {
      return NextResponse.json({ error: "listings[] is required" }, { status: 400 });
    }

    const result = await runProactiveWorkflow(body);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to run proactive workflow: ${String(error)}` },
      { status: 500 }
    );
  }
}
