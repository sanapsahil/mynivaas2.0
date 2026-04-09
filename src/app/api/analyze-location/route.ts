import { NextRequest, NextResponse } from "next/server";
import { fetchSatelliteImage, fetchRoadmapImage } from "@/lib/satelliteImagery";
import { analyzeSatelliteImagery } from "@/lib/satelliteAnalysis";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch satellite and roadmap imagery from free tile servers
    const [satelliteImage, roadmapImage] = await Promise.all([
      fetchSatelliteImage({ lat, lng, zoom: 17 }),
      fetchRoadmapImage(lat, lng, 17),
    ]);

    if (!satelliteImage) {
      return NextResponse.json({
        indices: null,
        message: "Failed to fetch satellite imagery",
      });
    }

    // Analyze the imagery using ViT-inspired analysis
    const indices = await analyzeSatelliteImagery(satelliteImage, roadmapImage);

    return NextResponse.json({
      indices,
      coordinates: { lat, lng },
    });
  } catch (error) {
    console.error("Satellite analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze satellite imagery" },
      { status: 500 }
    );
  }
}
