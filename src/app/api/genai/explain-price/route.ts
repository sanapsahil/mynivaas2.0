import { NextRequest, NextResponse } from "next/server";
import { explainPrice } from "@/lib/genai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Support both formats
    const property = body.property || {
      title: body.title,
      price: body.price || body.listedPrice,
      location: body.location,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      areaSqft: body.areaSqft,
      description: body.description,
    };

    if (!property || !property.title || !property.price) {
      return NextResponse.json(
        { error: "Property with listedPrice is required" },
        { status: 400 }
      );
    }

    const explanation = explainPrice(property);

    return NextResponse.json({
      success: true,
      data: explanation,
    });
  } catch (error) {
    console.error("Price explanation error:", error);
    return NextResponse.json(
      { error: "Failed to explain price" },
      { status: 500 }
    );
  }
}
