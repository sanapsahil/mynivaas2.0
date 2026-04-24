import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendation";

// Generate mock properties for testing
function generateMockProperties(userPreferences: any) {
  const locations = ["Mumbai", "Bangalore", "Delhi", "Hyderabad", "Pune"];
  const selectedLocation = userPreferences.location || locations[0];
  const properties = [];

  // Generate 8 mock properties around the user's preferences
  for (let i = 0; i < 8; i++) {
    const budgetVariation = (Math.random() - 0.5) * 0.4; // ±20%
    const price = Math.round(
      userPreferences.budget * (1 + budgetVariation)
    );

    const bedroomVariation =
      Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const bedrooms =
      (userPreferences.bedrooms || 3) + bedroomVariation;
    const bathrooms =
      (userPreferences.bathrooms || 2) + (Math.random() > 0.5 ? 1 : 0);
    const areaSqft = 1000 + Math.random() * 2000;

    properties.push({
      id: `prop_${i + 1}`,
      title: `${bedrooms}BHK Apartment in ${selectedLocation}`,
      listedPrice: Math.max(1000000, price), // Min ₹10L
      location: selectedLocation,
      bedrooms,
      bathrooms,
      areaSqft: Math.round(areaSqft),
      conditionScore: 7 + Math.random() * 3,
      greeneryIndex: 30 + Math.random() * 50,
      trafficCongestionIndex: 20 + Math.random() * 60,
    });
  }

  return properties;
}

// Transform recommendations to property-like format for display
function formatRecommendations(
  recommendations: any[],
  mockProperties: any[]
) {
  return recommendations.map((rec, idx) => {
    const property = mockProperties.find(
      (p) => p.id === rec.propertyId
    );
    if (!property) return null;

    return {
      id: property.id,
      title: property.title,
      price: property.listedPrice,
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      matchScore: rec.matchScore,
      reasons: rec.matchReasons,
    };
  }).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { properties, userPreferences } = body;

    if (!userPreferences || typeof userPreferences !== "object") {
      return NextResponse.json(
        { error: "userPreferences object is required" },
        { status: 400 }
      );
    }

    // Use provided properties or generate mock ones
    let propertiesToAnalyze = properties;
    if (!Array.isArray(properties) || properties.length === 0) {
      propertiesToAnalyze = generateMockProperties(userPreferences);
    }

    const recommendations = getRecommendations(
      propertiesToAnalyze,
      {
        budget: {
          min: Math.round(userPreferences.budget * 0.8),
          max: Math.round(userPreferences.budget * 1.2),
        },
        location: userPreferences.location ? [userPreferences.location] : [],
        bedrooms: userPreferences.bedrooms,
        bathrooms: userPreferences.bathrooms,
      }
    );

    // Format for UI display
    const formattedResults = formatRecommendations(
      recommendations,
      propertiesToAnalyze
    );

    return NextResponse.json({
      success: true,
      data: formattedResults,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
