import { NextRequest, NextResponse } from "next/server";
import { planGoal } from "@/lib/agentic/planner";
import { UserGoalInput } from "@/lib/agentic/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UserGoalInput;
    if (!body.goal || !body.goal.trim()) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }

    const plan = planGoal(body);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to build plan: ${String(error)}` },
      { status: 500 }
    );
  }
}
