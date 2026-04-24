import { NextRequest, NextResponse } from "next/server";
import { generateNeighborhoodReport } from "@/lib/neighborhood";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, additionalData } = body;

    if (!location || typeof location !== "string") {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    const report = generateNeighborhoodReport(location, additionalData || {});

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Neighborhood report error:", error);
    return NextResponse.json(
      { error: "Failed to generate neighborhood report" },
      { status: 500 }
    );
  }
}
