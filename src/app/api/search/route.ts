import { NextRequest, NextResponse } from "next/server";
import { searchProperties } from "@/lib/serpapi";
import { geocodeLocation, scatterCoordinates } from "@/lib/geocode";
import { scrapePropertyImages, downloadImage } from "@/lib/imageScraper";
import { scoreBestPropertyImage } from "@/lib/imageScoring";
import { fetchSatelliteImage, fetchRoadmapImage } from "@/lib/satelliteImagery";
import { analyzeSatelliteImagery } from "@/lib/satelliteAnalysis";

export const maxDuration = 300; // Allow up to 5 minutes for this API route (processing all properties)

async function scoreProperty(propertyUrl: string) {
  try {
    const imageUrls = await scrapePropertyImages(propertyUrl, 3);
    if (imageUrls.length === 0) return { score: null, imageUrl: null };

    const imageBuffers = (
      await Promise.all(imageUrls.map((url) => downloadImage(url)))
    ).filter((buffer): buffer is Buffer => buffer !== null);

    if (imageBuffers.length === 0) return { score: null, imageUrl: null };

    const score = await scoreBestPropertyImage(imageBuffers);
    return {
      score,
      imageUrl: imageUrls[0], // Return first image URL for display
    };
  } catch (error) {
    console.error(`Failed to score property ${propertyUrl}:`, error);
    return { score: null, imageUrl: null };
  }
}

async function analyzeLocation(lat: number, lng: number) {
  try {
    const [satelliteImage, roadmapImage] = await Promise.all([
      fetchSatelliteImage({ lat, lng, zoom: 17 }),
      fetchRoadmapImage(lat, lng, 17),
    ]);

    if (!satelliteImage) return null;

    return await analyzeSatelliteImagery(satelliteImage, roadmapImage);
  } catch (error) {
    console.error("Failed to analyze location:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const location = searchParams.get("location");
  const propertyType = searchParams.get("propertyType") || "apartment";
  const listingType = searchParams.get("listingType") || "rent";
  const bhk = searchParams.get("bhk") || "any";

  if (!location) {
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 }
    );
  }

  try {
    const [properties, center] = await Promise.all([
      searchProperties({ location, propertyType, listingType, bhk }),
      geocodeLocation(location),
    ]);

    // Attach scattered coordinates to each property
    if (center && properties.length > 0) {
      const positions = scatterCoordinates(center, properties.length);
      for (let i = 0; i < properties.length; i++) {
        properties[i].lat = positions[i].lat;
        properties[i].lng = positions[i].lng;
      }
    }

    // Analyze EVERY property's location with satellite imagery
    const locationPromises = properties.map(async (property, idx) => {
      if (!property.lat || !property.lng) return;

      try {
        const indices = await Promise.race([
          analyzeLocation(property.lat, property.lng),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)), // 3s timeout per location
        ]);
        if (indices) {
          properties[idx].locationIndices = indices;
        }
      } catch (error) {
        console.error(`Error analyzing location ${idx}:`, error);
      }
    });

    // Score images for ALL properties
    const scoringPromises = properties.map(async (property, idx) => {
      try {
        const result = await Promise.race([
          scoreProperty(property.link),
          new Promise<{ score: null; imageUrl: null }>((resolve) =>
            setTimeout(() => resolve({ score: null, imageUrl: null }), 5000)
          ), // 5s timeout per property
        ]);
        if (result.score) {
          properties[idx].conditionScore = result.score;
        }
        if (result.imageUrl) {
          properties[idx].imageUrl = result.imageUrl;
        }
      } catch (error) {
        console.error(`Error scoring property ${idx}:`, error);
      }
    });

    // Run all analyses in parallel (NO race condition - let all promises complete)
    // Individual timeouts per property ensure completion or graceful failure
    await Promise.all([...locationPromises, ...scoringPromises]);

    return NextResponse.json({
      results: properties,
      total: properties.length,
      query: { location, propertyType, listingType, bhk },
      center: center || null,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property listings. Please try again." },
      { status: 500 }
    );
  }
}
