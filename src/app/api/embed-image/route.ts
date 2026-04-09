import { NextRequest, NextResponse } from "next/server";
import { generateImageEmbedding } from "@/lib/imageEmbeddings";

export const maxDuration = 120; // 2 minutes for embedding generation

/**
 * POST /api/embed-image
 * Generates ImageBind embedding from uploaded image
 * Body: FormData with 'image' file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    console.log(`Embedding image: ${file.name} (${file.size} bytes)`);

    // Generate embedding
    const embedding = await generateImageEmbedding(imageBuffer);

    return NextResponse.json(
      {
        success: true,
        embedding,
        dimensions: embedding.length,
        fileName: file.name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json(
      { error: `Failed to embed image: ${error}` },
      { status: 500 }
    );
  }
}
