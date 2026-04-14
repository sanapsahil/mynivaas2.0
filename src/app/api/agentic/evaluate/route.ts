import { NextRequest, NextResponse } from "next/server";
import {
  OrchestratorPropertyInput,
  runAgenticEvaluation,
} from "@/lib/agentic/orchestrator";
import { UserGoalInput } from "@/lib/agentic/types";

interface EvaluatePayload {
  goal: UserGoalInput;
  property: OrchestratorPropertyInput;
  peers?: OrchestratorPropertyInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvaluatePayload;

    if (!body.goal?.goal) {
      return NextResponse.json({ error: "goal.goal is required" }, { status: 400 });
    }

    if (!body.property?.id || !body.property?.listedPrice || !body.property?.title) {
      return NextResponse.json(
        {
          error:
            "property.id, property.title and property.listedPrice are required",
        },
        { status: 400 }
      );
    }

    const result = await runAgenticEvaluation(
      body.goal,
      body.property,
      body.peers ?? []
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to evaluate goal: ${String(error)}` },
      { status: 500 }
    );
  }
}
