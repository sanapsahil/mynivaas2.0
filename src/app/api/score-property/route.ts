import { NextRequest, NextResponse } from "next/server";
import { scrapePropertyImages, downloadImage } from "@/lib/imageScraper";
import { scoreBestPropertyImage } from "@/lib/imageScoring";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Property URL is required" },
      { status: 400 }
    );
  }

  try {
    // Scrape images from the property URL
    const imageUrls = await scrapePropertyImages(url, 3);

    if (imageUrls.length === 0) {
      return NextResponse.json({
        score: null,
        message: "No images found on this property page",
      });
    }

    // Download the images
    const imageBuffers = (
      await Promise.all(imageUrls.map((imgUrl) => downloadImage(imgUrl)))
    ).filter((buffer): buffer is Buffer => buffer !== null);

    if (imageBuffers.length === 0) {
      return NextResponse.json({
        score: null,
        message: "Failed to download property images",
      });
    }

    // Score the best image
    const score = await scoreBestPropertyImage(imageBuffers);

    return NextResponse.json({
      score,
      imagesAnalyzed: imageBuffers.length,
    });
  } catch (error) {
    console.error("Image scoring error:", error);
    return NextResponse.json(
      { error: "Failed to score property images" },
      { status: 500 }
    );
  }
}
