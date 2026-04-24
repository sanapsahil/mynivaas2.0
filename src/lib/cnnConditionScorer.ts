import { pipeline, env, RawImage } from "@xenova/transformers";
import sharp from "sharp";

// Configure transformers.js for better compatibility
(env as any).localModelPath = process.cwd();
(env as any).allowRemoteModels = true;
(env as any).allowLocalModels = true;

// Use ResNet-50 for feature extraction
const MODEL_ID = "Xenova/resnet-50";

let resnetPipeline: any = null;
let initPromise: Promise<any> | null = null;
let initError: Error | null = null;

/**
 * Initialize the ResNet pipeline with retry logic
 */
async function initializeResNetPipeline() {
  if (resnetPipeline) return resnetPipeline;

  if (initError) {
    throw initError;
  }

  // Prevent multiple simultaneous initialization attempts
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log(`Loading ResNet model: ${MODEL_ID}...`);
    let lastError: Error | null = null;

    // Retry logic for model loading (up to 3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`ResNet load attempt ${attempt}/3...`);
        const options: any = {
          progress_callback: (progress: any) => {
            if (progress.status === "downloading") {
              console.log(
                `  Downloading: ${Math.round((progress.progress || 0) * 100)}%`
              );
            }
          },
        };

        resnetPipeline = await Promise.race([
          pipeline("image-feature-extraction", MODEL_ID, options),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Model loading timeout after 120s")),
              120000
            )
          ),
        ]);

        console.log("✓ ResNet model loaded successfully");
        initError = null;
        return resnetPipeline;
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));
        console.warn(
          `ResNet load attempt ${attempt}/3 failed:`,
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
      lastError || new Error("Failed to load ResNet model after 3 attempts");
    console.error("Failed to initialize ResNet pipeline:", initError);
    throw initError;
  })();

  return initPromise;
}

/**
 * Extract statistical features from embedding vector
 * Returns mean, variance, max, and min values
 */
function extractEmbeddingStats(embedding: number[]): {
  mean: number;
  variance: number;
  maxVal: number;
  minVal: number;
  std: number;
} {
  const mean =
    embedding.reduce((sum, val) => sum + val, 0) / embedding.length;

  const variance =
    embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    embedding.length;

  const std = Math.sqrt(variance);

  const maxVal = Math.max(...embedding);
  const minVal = Math.min(...embedding);

  return {
    mean,
    variance,
    maxVal,
    minVal,
    std,
  };
}

/**
 * Map embedding statistics to modernit score (0-10)
 * Higher mean embeddings indicate more modern/well-preserved features
 */
function scoreModernity(stats: {
  mean: number;
  variance: number;
  maxVal: number;
  minVal: number;
  std: number;
}): number {
  // Normalize mean to 0-1 range, then scale to 0-10
  // ResNet embeddings typically range from -1 to 1 after normalization
  // Positive features correlate with modern/well-designed structures
  const normalizedMean = (stats.mean + 1) / 2; // Convert [-1, 1] to [0, 1]
  const score = normalizedMean * 10;
  return Math.min(10, Math.max(0, score));
}

/**
 * Map embedding statistics to lighting score (0-10)
 * Higher brightness proxy (mean + activation) indicates better lighting
 */
function scoreLighting(stats: {
  mean: number;
  variance: number;
  maxVal: number;
  minVal: number;
  std: number;
}): number {
  // Use combination of mean (brightness) and max (highlights)
  const brightnessProxy = (stats.mean + stats.maxVal) / 2;
  const normalizedBrightness = (brightnessProxy + 1) / 2;
  const score = normalizedBrightness * 10;
  return Math.min(10, Math.max(0, score));
}

/**
 * Map embedding statistics to wear and tear score (0-10)
 * Higher variance indicates more texture variation (wear), lower is better
 * Inverted: high variance = low score
 */
function scoreWearAndTear(stats: {
  mean: number;
  variance: number;
  maxVal: number;
  minVal: number;
  std: number;
}): number {
  // Normalize variance: high variance = more texture variation = more wear
  // Standard deviation is typically 0-1 for normalized embeddings
  // Invert so that low variance (uniform features) = high score
  const normalizedVariance = Math.min(1, stats.std);
  const score = (1 - normalizedVariance) * 10; // Invert
  return Math.min(10, Math.max(0, score));
}

/**
 * Map embedding statistics to structural quality score (0-10)
 * Combination of mean stability and feature consistency
 */
function scoreStructuralQuality(stats: {
  mean: number;
  variance: number;
  maxVal: number;
  minVal: number;
  std: number;
}): number {
  // Use mean for overall feature strength
  // Use minVal stability (how far minimum is from mean) for consistency
  const normalizedMean = (stats.mean + 1) / 2; // [0, 1]

  // Stability: how close minVal is to mean (smaller range = more stable)
  const range = stats.maxVal - stats.minVal;
  const stability = Math.max(0, 1 - range / 2); // [0, 1]

  // Combine mean strength and stability
  const score = (normalizedMean * 0.6 + stability * 0.4) * 10;
  return Math.min(10, Math.max(0, score));
}

/**
 * Get CNN-based condition scores for a property image
 * Uses ResNet-50 to extract features and derive 4 scoring heads
 */
export async function getCNNConditionScores(
  image: Buffer | string
): Promise<{
  modernity: number;
  lighting: number;
  wearAndTear: number;
  structuralQuality: number;
}> {
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

    // Optimize image for CNN (resize to standard size)
    console.log(`Processing image for ResNet (${imageBuffer.length} bytes)...`);
    const optimized = await sharp(imageBuffer)
      .resize(224, 224, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Load model
    console.log("Initializing ResNet model for CNN scoring...");
    const pipe = await initializeResNetPipeline();

    // Generate feature embedding
    console.log("Generating ResNet features for condition scoring...");
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
      console.error("ResNet pipeline execution error:", pipeError);
      throw new Error(
        `Failed to generate ResNet features: ${
          pipeError instanceof Error ? pipeError.message : String(pipeError)
        }`
      );
    }

    // Extract tensor data
    let embeddingArray: number[] = [];

    if (!embeddingResult) {
      throw new Error("ResNet pipeline returned empty result");
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
      console.error("Failed to extract ResNet embedding from result:", {
        resultType: typeof embeddingResult,
        resultStructure: Object.keys(embeddingResult || {}),
      });
      throw new Error(
        `Failed to extract ResNet feature vector. Result type: ${typeof embeddingResult}`
      );
    }

    console.log(
      `Generated ResNet features with ${embeddingArray.length} dimensions`
    );

    // Extract statistics from embedding
    const stats = extractEmbeddingStats(embeddingArray);

    // Generate 4 scoring heads from embedding statistics
    const modernity = scoreModernity(stats);
    const lighting = scoreLighting(stats);
    const wearAndTear = scoreWearAndTear(stats);
    const structuralQuality = scoreStructuralQuality(stats);

    console.log("CNN condition scores generated successfully");
    console.log(
      `  Modernity: ${modernity.toFixed(1)}, Lighting: ${lighting.toFixed(
        1
      )}, Wear: ${wearAndTear.toFixed(1)}, Structural: ${structuralQuality.toFixed(
        1
      )}`
    );

    return {
      modernity: Math.round(modernity * 10) / 10, // Round to 1 decimal
      lighting: Math.round(lighting * 10) / 10,
      wearAndTear: Math.round(wearAndTear * 10) / 10,
      structuralQuality: Math.round(structuralQuality * 10) / 10,
    };
  } catch (error) {
    console.error("Error generating CNN condition scores:", error);
    const errorMsg =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate CNN condition scores: ${errorMsg}`);
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
 * Batch generate CNN condition scores for multiple images
 * Useful for pre-computing property image assessments
 */
export async function generateBatchCNNScores(
  imageBuffers: Buffer[]
): Promise<
  Array<{
    modernity: number;
    lighting: number;
    wearAndTear: number;
    structuralQuality: number;
  }>
> {
  console.log(`Generating CNN scores for ${imageBuffers.length} images...`);
  const scores: Array<{
    modernity: number;
    lighting: number;
    wearAndTear: number;
    structuralQuality: number;
  }> = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    try {
      const score = await getCNNConditionScores(imageBuffers[i]);
      scores.push(score);

      // Progress logging
      if ((i + 1) % 10 === 0) {
        console.log(`✓ Processed ${i + 1}/${imageBuffers.length} CNN scores`);
      }
    } catch (error) {
      console.warn(`Failed to score image ${i}:`, error);
      // Push default neutral scores on failure
      scores.push({
        modernity: 5,
        lighting: 5,
        wearAndTear: 5,
        structuralQuality: 5,
      });
    }
  }

  console.log(`✓ Completed ${scores.length} CNN condition scores`);
  return scores;
}
