import { NextRequest, NextResponse } from "next/server";
import { generateImageEmbedding } from "@/lib/imageEmbeddings";
import { searchSimilarEmbeddings } from "@/lib/vectorStore";

export const maxDuration = 120; // 2 minutes for embedding + search

/**
 * POST /api/search-similar
 * Finds properties with images similar to uploaded photo
 * Body: FormData with 'image' file
 * Query params: ?topK=30&threshold=0.45
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const topK = parseInt(searchParams.get("topK") || "30");
    const threshold = parseFloat(searchParams.get("threshold") || "0.45");

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image must be smaller than 10MB" },
        { status: 400 }
      );
    }

    // Validate parameters
    if (topK < 1 || topK > 100) {
      return NextResponse.json(
        { error: "topK must be between 1 and 100" },
        { status: 400 }
      );
    }

    if (threshold < 0 || threshold > 1) {
      return NextResponse.json(
        { error: "threshold must be between 0 and 1" },
        { status: 400 }
      );
    }

    console.log(`Searching similar to: ${file.name} (topK=${topK}, threshold=${threshold})`);

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Generate embedding for uploaded image
    console.log("Generating embedding for uploaded image...");
    const queryEmbedding = await generateImageEmbedding(imageBuffer);

    // Search for similar embeddings
    console.log("Searching vector store for similar properties...");
    const results = await searchSimilarEmbeddings(
      queryEmbedding,
      topK,
      threshold
    );

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: true,
          results: [],
          message: "No similar properties found. Try adjusting the threshold or upload a different image.",
          stats: {
            querySimilarities: [],
            totalChecked: 0,
            matchesFound: 0,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        results: results.map((r) => ({
          id: r.id,
          similarity: Number(r.similarity.toFixed(4)), // Round to 4 decimals
          property: r.property,
          similarityPercentage: Math.round(r.similarity * 100), // For display
        })),
        stats: {
          matchesFound: results.length,
          topSimilarity: Number(results[0].similarity.toFixed(4)),
          avgSimilarity: Number(
            (results.reduce((sum, r) => sum + r.similarity, 0) / results.length).toFixed(4)
          ),
          embeddingDimensions: queryEmbedding.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search-similar error:", error);
    return NextResponse.json(
      { error: `Failed to search similar properties: ${error}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search-similar
 * Returns vector store statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchSimilarEmbeddings: _, ...vectorStore } = await import(
      "@/lib/vectorStore"
    );
    const { getVectorStoreStats } = await import("@/lib/vectorStore");

    const stats = await getVectorStoreStats();

    return NextResponse.json(
      {
        success: true,
        vectorStore: stats,
        message: stats.recordCount > 0
          ? `Vector store ready with ${stats.recordCount} property embeddings`
          : "Vector store is empty. Properties need to be indexed first.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
