import { pipeline, env, RawImage } from "@xenova/transformers";
import sharp from "sharp";
import {
  getCachedEfficientNetEmbedding,
  cacheEfficientNetEmbedding,
} from "./embeddingCache";

// Configure transformers.js for better compatibility
(env as any).localModelPath = process.cwd();
(env as any).allowRemoteModels = true;
(env as any).allowLocalModels = true;

// Use EfficientNet-B0 model for visual feature extraction
const MODEL_ID = "Xenova/efficientnet-b0";

let efficientNetPipeline: any = null;
let initPromise: Promise<any> | null = null;
let initError: Error | null = null;

/**
 * Initialize the EfficientNet pipeline with retry logic
 */
async function initializeEfficientNetPipeline() {
  if (efficientNetPipeline) return efficientNetPipeline;

  if (initError) {
    throw initError;
  }

  // Prevent multiple simultaneous initialization attempts
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log(`Loading EfficientNet model: ${MODEL_ID}...`);
    let lastError: Error | null = null;

    // Retry logic for model loading (up to 3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`EfficientNet load attempt ${attempt}/3...`);
        const options: any = {
          progress_callback: (progress: any) => {
            if (progress.status === "downloading") {
              console.log(
                `  Downloading: ${Math.round((progress.progress || 0) * 100)}%`
              );
            }
          },
        };

        efficientNetPipeline = await Promise.race([
          pipeline("image-feature-extraction", MODEL_ID, options),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Model loading timeout after 120s")),
              120000
            )
          ),
        ]);

        console.log("✓ EfficientNet model loaded successfully");
        initError = null;
        return efficientNetPipeline;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));
        console.warn(
          `EfficientNet load attempt ${attempt}/3 failed:`,
          lastError.message
        );

        if (attempt < 3) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    // All attempts failed
    initPromise = null;
    initError =
      lastError || new Error("Failed to load EfficientNet model after 3 attempts");
    console.error("Failed to initialize EfficientNet pipeline:", initError);
    throw initError;
  })();

  return initPromise;
}

/**
 * Generate EfficientNet embedding for an image file/buffer
 * Returns a normalized vector embedding (1280 dimensions)
 * This extracts visual features, NOT classification logits
 */
export async function getEfficientNetEmbedding(
  image: Buffer | string
): Promise<number[]> {
  try {
    // Convert URL to buffer if needed
    let imageBuffer: Buffer;
    if (image instanceof Buffer) {
      imageBuffer = image;
    } else if (typeof image === "string") {
      imageBuffer = await downloadImageBuffer(image);
    } else {
      throw new Error("Image must be a Buffer or string URL");
    }

    // Check cache first using EfficientNet-specific cache
    const cached = await getCachedEfficientNetEmbedding(imageBuffer);
    if (cached) {
      return cached;
    }

    // Optimize image for embedding (resize to standard size)
    console.log(`Processing image for EfficientNet (${imageBuffer.length} bytes)...`);
    const optimized = await sharp(imageBuffer)
      .resize(224, 224, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Load model
    console.log("Initializing EfficientNet model...");
    const pipe = await initializeEfficientNetPipeline();

    // Generate embedding
    console.log("Generating EfficientNet embedding for image...");
    let embeddingResult: any;
    try {
      // Convert optimized JPEG buffer to raw pixel data
      const metadata = await sharp(optimized).metadata();

      if (!metadata.width || !metadata.height || !metadata.channels) {
        throw new Error(`Invalid image metadata: ${JSON.stringify(metadata)}`);
      }

      // Extract raw pixel data (RGB format, 8-bit)
      const rawData = await sharp(optimized)
        .raw()
        .toBuffer({ resolveWithObject: true });

      console.log(
        `Image metadata: ${rawData.info.width}x${rawData.info.height}, ${rawData.info.channels} channels`
      );

      // Create RawImage from pixel data
      const img = new RawImage(
        new Uint8ClampedArray(rawData.data),
        rawData.info.width,
        rawData.info.height,
        rawData.info.channels
      );

      embeddingResult = await pipe(img);
    } catch (pipeError) {
      console.error("EfficientNet pipeline execution error:", pipeError);
      throw new Error(
        `Failed to generate EfficientNet embedding: ${
          pipeError instanceof Error ? pipeError.message : String(pipeError)
        }`
      );
    }

    // Extract tensor data
    let embeddingArray: number[] = [];

    if (!embeddingResult) {
      throw new Error("EfficientNet pipeline returned empty result");
    }

    // Handle different output formats
    if (embeddingResult && embeddingResult.data) {
      // ONNX Runtime tensor or similar
      embeddingArray = Array.from(embeddingResult.data);
    } else if (Array.isArray(embeddingResult)) {
      // Direct array output
      embeddingArray = embeddingResult as number[];
    } else if (typeof embeddingResult === "object") {
      // Try to extract from various object formats
      if (embeddingResult.data) {
        embeddingArray = Array.from(embeddingResult.data);
      } else if (typeof embeddingResult[Symbol.iterator] === "function") {
        // Iterable object
        embeddingArray = Array.from(embeddingResult);
      } else {
        // Last resort: extract numeric values
        embeddingArray = Object.values(embeddingResult).filter(
          (v): v is number => typeof v === "number"
        );
      }
    }

    if (!embeddingArray || embeddingArray.length === 0) {
      console.error("Failed to extract EfficientNet embedding from result:", {
        resultType: typeof embeddingResult,
        resultStructure: Object.keys(embeddingResult || {}),
      });
      throw new Error(
        `Failed to extract EfficientNet embedding vector. Result type: ${typeof embeddingResult}`
      );
    }

    console.log(
      `Generated EfficientNet embedding with ${embeddingArray.length} dimensions`
    );

    // L2 normalization for consistent comparison
    const norm = Math.sqrt(
      embeddingArray.reduce((sum: number, val: number) => sum + val * val, 0)
    );

    if (norm === 0) {
      throw new Error("EfficientNet embedding vector norm is zero - invalid output");
    }

    const normalized = embeddingArray.map((val: number) => val / (norm + 1e-8));

    // Cache for future use
    await cacheEfficientNetEmbedding(imageBuffer, normalized);

    return normalized;
  } catch (error) {
    console.error("Error generating EfficientNet embedding:", error);
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate EfficientNet embedding: ${errorMsg}`);
  }
}

/**
 * Download image buffer from URL (helper for URL inputs)
 */
async function downloadImageBuffer(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Error(
      `Failed to download image from URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Extract reduced features from EfficientNet embedding
 * Returns mean and variance for use in valuation
 */
export function extractReducedFeatures(embedding: number[]): {
  mean: number;
  variance: number;
  norm: number;
} {
  const mean =
    embedding.reduce((sum, val) => sum + val, 0) / embedding.length;

  const variance =
    embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    embedding.length;

  const norm = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  return {
    mean,
    variance,
    norm: norm / embedding.length, // normalized by dimension count
  };
}

/**
 * Batch generate EfficientNet embeddings for multiple images
 * Useful for pre-computing property image embeddings
 */
export async function generateBatchEfficientNetEmbeddings(
  imageBuffers: Buffer[]
): Promise<number[][]> {
  console.log(
    `Generating EfficientNet embeddings for ${imageBuffers.length} images...`
  );
  const embeddings: number[][] = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    try {
      const embedding = await getEfficientNetEmbedding(imageBuffers[i]);
      embeddings.push(embedding);

      // Progress logging
      if ((i + 1) % 10 === 0) {
        console.log(
          `✓ Processed ${i + 1}/${imageBuffers.length} EfficientNet embeddings`
        );
      }
    } catch (error) {
      console.warn(`Failed to embed image ${i}:`, error);
      // Push zero vector on failure (won't match anything)
      embeddings.push(new Array(1280).fill(0));
    }
  }

  console.log(`✓ Completed ${embeddings.length} EfficientNet embeddings`);
  return embeddings;
}
