import { NextRequest, NextResponse } from "next/server";
import { analyzeExternalSentiment } from "@/lib/agentic/sentiment";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    if (!query.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const sentiment = await analyzeExternalSentiment(query);
    return NextResponse.json({ success: true, sentiment });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to analyze sentiment: ${String(error)}` },
      { status: 500 }
    );
  }
}
