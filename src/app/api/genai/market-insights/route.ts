import { NextRequest, NextResponse } from "next/server";
import { getMarketInsights } from "@/lib/marketInsights";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location } = body;

    if (!location || typeof location !== "string") {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    const insights = getMarketInsights(location);

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Market insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate market insights" },
      { status: 500 }
    );
  }
}
