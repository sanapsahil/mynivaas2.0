import { NextRequest, NextResponse } from "next/server";
import { detectFraud } from "@/lib/fraudDetector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both formats: direct fields or wrapped in property object
    const property = body.property || {
      title: body.title,
      description: body.description,
      listedPrice: body.listedPrice,
    };

    if (!property || !property.title) {
      return NextResponse.json(
        { error: "Property with title is required" },
        { status: 400 }
      );
    }

    const analysis = detectFraud(property, {
      marketAverage: body.marketAverage,
      otherTitles: body.otherTitles,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Fraud detection error:", error);
    return NextResponse.json(
      { error: "Failed to analyze fraud" },
      { status: 500 }
    );
  }
}
