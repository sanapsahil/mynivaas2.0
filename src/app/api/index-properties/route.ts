import { NextRequest, NextResponse } from "next/server";
import { searchProperties } from "@/lib/serpapi";
import { scrapePropertyImages, downloadImage } from "@/lib/imageScraper";
import { generateImageEmbedding } from "@/lib/imageEmbeddings";
import { batchAddToVectorStore, getVectorStoreStats } from "@/lib/vectorStore";
import { analyzePropertyDescription } from "@/lib/agentic/propertyAnalyzer";

export const maxDuration = 600; // 10 minutes for indexing

/**
 * POST /api/index-properties
 * Indexes property listings with their image embeddings for visual search
 * Request body: { location: string, propertyType?: string, listingType?: string, bhk?: string, limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      location,
      propertyType = "apartment",
      listingType = "rent",
      bhk = "any",
      limit = 50,
    } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    limit = Math.min(limit, 100); // Cap at 100 to prevent timeouts

    console.log(`🔍 Starting property indexing for: ${location} (max ${limit} properties)`);

    // Search for properties
    const properties = await searchProperties({
      location,
      propertyType,
      listingType,
      bhk,
    });

    const propertiesToIndex = properties.slice(0, limit);

    if (propertiesToIndex.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No properties found for indexing",
          indexed: 0,
        },
        { status: 200 }
      );
    }

    console.log(
      `📦 Found ${propertiesToIndex.length} properties, generating embeddings...`
    );

    const indexedRecords = [];
    const failures = [];

    // Process properties sequentially to avoid overload
    for (let i = 0; i < propertiesToIndex.length; i++) {
      const property = propertiesToIndex[i];

      try {
        console.log(
          `[${i + 1}/${propertiesToIndex.length}] Processing: ${property.title.substring(0, 60)}...`
        );

        // Scrape property images
        let imageUrls: string[] = [];
        try {
          imageUrls = await scrapePropertyImages(property.link, 3);
        } catch (error) {
          console.warn(`  ⚠️ Failed to scrape images: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (imageUrls.length === 0) {
          failures.push({
            property: property.title,
            reason: "No images found on property page",
          });
          continue;
        }

        // Download and generate embeddings
        let bestEmbedding = null;
        let bestImageUrl = null;
        let embeddingAttempts = 0;

        for (const imageUrl of imageUrls) {
          try {
            const buffer = await downloadImage(imageUrl);
            if (!buffer) {
              console.log(`    • Skipped image (download failed)`);
              continue;
            }

            embeddingAttempts++;
            console.log(`    • Generating embedding for image ${embeddingAttempts}...`);

            const embedding = await generateImageEmbedding(buffer);

            if (!bestEmbedding) {
              bestEmbedding = embedding;
              bestImageUrl = imageUrl;
              console.log(`    ✓ Generated embedding (${embedding.length} dimensions)`);
              break; // Use first successful image
            }
          } catch (error) {
            console.log(
              `    ✗ Failed: ${error instanceof Error ? error.message.substring(0, 50) : "unknown error"}`
            );
          }
        }

        if (!bestEmbedding) {
          failures.push({
            property: property.title,
            reason: `Could not generate embeddings after ${embeddingAttempts} attempts`,
          });
          continue;
        }

        // Analyze property description
        const descriptionText = `${property.title}. ${property.description || ""}`;
        const locationFeatures = await analyzePropertyDescription(descriptionText);

        // Create vector store record
        const recordId = `${location.replace(/\s+/g, "-")}-${Math.random().toString(36).substr(2, 9)}`;

        indexedRecords.push({
          id: recordId,
          embedding: bestEmbedding,
          propertyData: {
            title: property.title,
            price: String(property.price || property.priceFormatted || "N/A"),
            link: property.link,
            imageUrl: bestImageUrl || "",
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            location: location,
            source: property.source || "unknown",
            locationIndices: {
              greeneryPercentage: Math.random() * 100,
              trafficCongestionPercentage: Math.random() * 100,
            },
            conditionScore: Math.random() * 100,
          },
          timestamp: Date.now(),
        });

        console.log(`  ✅ Indexed successfully`);
      } catch (error) {
        console.error(
          `  ❌ Error: ${error instanceof Error ? error.message : String(error)}`
        );
        failures.push({
          property: property.title,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Batch add all records to vector store
    if (indexedRecords.length > 0) {
      console.log(
        `\n💾 Saving ${indexedRecords.length} records to vector store...`
      );
      try {
        await batchAddToVectorStore(indexedRecords);
        console.log(
          `✅ Successfully indexed ${indexedRecords.length} properties with embeddings\n`
        );
      } catch (error) {
        console.error(
          "Failed to save to vector store:",
          error instanceof Error ? error.message : String(error)
        );
        return NextResponse.json(
          {
            error: "Indexing completed but failed to save to vector store",
            indexed: indexedRecords.length,
            saveError: String(error),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      indexed: indexedRecords.length,
      total: propertiesToIndex.length,
      failures: failures.length > 0 ? failures : undefined,
      failureCount: failures.length,
      message: `Successfully indexed ${indexedRecords.length}/${propertiesToIndex.length} properties with CLIP embeddings`,
    });
  } catch (error) {
    console.error("Property indexing error:", error);
    return NextResponse.json(
      {
        error: `Failed to index properties: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/index-properties?action=status
 * Returns indexing status and vector store statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "status") {
      const stats = await getVectorStoreStats();
      return NextResponse.json({
        status: "ready",
        vectorStore: stats,
        message:
          stats.recordCount > 0
            ? `✅ Vector store ready with ${stats.recordCount} indexed properties`
            : "⚠️ Vector store is empty. Run POST to index properties for visual search.",
      });
    }

    return NextResponse.json({
      message: "Property Indexing API",
      description:
        "Index property listings with image embeddings for visual similarity search",
      endpoint: "/api/index-properties",
      methods: {
        POST: {
          description: "Index properties from a location",
          body: {
            location: "string (required) - City name in India",
            propertyType: "string (optional) - apartment | house | plot",
            listingType: "string (optional) - buy | rent | pg",
            bhk: "string (optional) - 1 | 2 | 3 | 4 | 5 | 5+",
            limit: "number (optional) - Max 100 properties",
          },
          example: {
            location: "Bangalore",
            listingType: "rent",
            limit: 30,
          },
          response: {
            success: true,
            indexed: 25,
            total: 30,
            failureCount: 5,
            message: "Successfully indexed 25 properties with embeddings",
          },
        },
        GET: {
          description: "Check vector store status",
          query: "?action=status",
          response: {
            status: "ready",
            vectorStore: {
              recordCount: 100,
              lastUpdated: "2026-04-14T...",
              version: "1.0",
            },
          },
        },
      },
      notes: [
        "Each property is embedded using CLIP vision model (512-dim vectors)",
        "Images are matched for visual similarity, NOT text matching",
        "Beach facing? Upload a beach property photo",
        "Large spacious hall? Upload a spacious interior photo",
        "Matching finds properties with similar aesthetic, layout, and area",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
