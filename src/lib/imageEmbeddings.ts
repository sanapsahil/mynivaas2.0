import { pipeline, env, RawImage } from "@xenova/transformers";
import sharp from "sharp";
import { getCachedEmbedding, cacheEmbedding } from "./embeddingCache";

// Configure transformers.js for better compatibility
(env as any).localModelPath = process.cwd();
(env as any).allowRemoteModels = true;
(env as any).allowLocalModels = true;

// Use a small, fast model that's more reliable
const MODEL_ID = "Xenova/clip-vit-base-patch32";

let embeddingPipeline: any = null;
let initPromise: Promise<any> | null = null;
let initError: Error | null = null;

/**
 * Initialize the embedding pipeline with retry logic
 */
async function initializeEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  
  if (initError) {
    throw initError;
  }
  
  // Prevent multiple simultaneous initialization attempts
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log(`Loading embedding model: ${MODEL_ID}...`);
    let lastError: Error | null = null;
    
    // Retry logic for model loading (up to 3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Model load attempt ${attempt}/3...`);
        const options: any = {
          progress_callback: (progress: any) => {
            if (progress.status === "downloading") {
              console.log(`  Downloading: ${Math.round((progress.progress || 0) * 100)}%`);
            }
          },
        };

        embeddingPipeline = await Promise.race([
          pipeline("image-feature-extraction", MODEL_ID, options),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Model loading timeout after 120s")), 120000)
          ),
        ]);

        console.log("✓ Embedding model loaded successfully");
        initError = null;
        return embeddingPipeline;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Model load attempt ${attempt}/3 failed:`, lastError.message);

        if (attempt < 3) {
          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }
      }
    }

    // All attempts failed
    initPromise = null;
    initError = lastError || new Error("Failed to load embedding model after 3 attempts");
    console.error("Failed to initialize embedding pipeline:", initError);
    throw initError;
  })();

  return initPromise;
}

/**
 * Generate embedding for an image file/buffer
 * Returns a normalized vector embedding
 */
export async function generateImageEmbedding(
  imageBuffer: Buffer
): Promise<number[]> {
  try {
    // Check cache first
    const cached = await getCachedEmbedding(imageBuffer);
    if (cached) {
      return cached;
    }

    // Optimize image for embedding (resize to standard size)
    console.log(`Processing image (${imageBuffer.length} bytes)...`);
    const optimized = await sharp(imageBuffer)
      .resize(224, 224, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Load model
    console.log("Initializing embedding model...");
    const pipe = await initializeEmbeddingPipeline();

    // Generate embedding
    console.log("Generating embedding for image...");
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
      
      console.log(`Image metadata: ${rawData.info.width}x${rawData.info.height}, ${rawData.info.channels} channels`);

      // Create RawImage from pixel data
      const image = new RawImage(
        new Uint8ClampedArray(rawData.data),
        rawData.info.width,
        rawData.info.height,
        rawData.info.channels
      );

      embeddingResult = await pipe(image);
    } catch (pipeError) {
      console.error("Pipeline execution error:", pipeError);
      throw new Error(
        `Failed to generate embedding: ${
          pipeError instanceof Error ? pipeError.message : String(pipeError)
        }`
      );
    }

    // Extract tensor data
    let embeddingArray: number[] = [];

    if (!embeddingResult) {
      throw new Error("Pipeline returned empty result");
    }

    // Handle different output formats from CLIP/transformers.js
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
      console.error("Failed to extract embedding from result:", {
        resultType: typeof embeddingResult,
        resultStructure: Object.keys(embeddingResult || {}),
        resultKeys: embeddingResult ? Object.keys(embeddingResult) : [],
      });
      throw new Error(
        `Failed to extract embedding vector. Result type: ${typeof embeddingResult}`
      );
    }

    console.log(`Generated embedding with ${embeddingArray.length} dimensions`);

    // L2 normalization for cosine similarity
    const norm = Math.sqrt(
      embeddingArray.reduce((sum: number, val: number) => sum + val * val, 0)
    );

    if (norm === 0) {
      throw new Error("Embedding vector norm is zero - invalid output");
    }

    const normalized = embeddingArray.map((val: number) => val / (norm + 1e-8));

    // Cache for future use
    await cacheEmbedding(imageBuffer, normalized);

    return normalized;
  } catch (error) {
    console.error("Error generating embedding:", error);
    const errorMsg =
      error instanceof Error
        ? error.message
        : String(error);
    throw new Error(`Failed to generate embedding: ${errorMsg}`);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Returns score between 0 and 1 (1 = identical, 0 = completely different)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have same dimension");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Find top-k most similar embeddings from a list
 * Returns indices and scores of top matches
 */
export function findTopSimilar(
  queryEmbedding: number[],
  embeddings: number[][],
  topK: number = 30,
  similarityThreshold: number = 0.5
): Array<{ index: number; score: number }> {
  const similarities = embeddings.map((emb, idx) => ({
    index: idx,
    score: cosineSimilarity(queryEmbedding, emb),
  }));

  // Filter by threshold and sort by score
  return similarities
    .filter((item) => item.score >= similarityThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Batch generate embeddings for multiple images
 * Useful for pre-computing property image embeddings
 */
export async function generateBatchEmbeddings(
  imageBuffers: Buffer[]
): Promise<number[][]> {
  console.log(`Generating embeddings for ${imageBuffers.length} images...`);
  const embeddings: number[][] = [];

  for (let i = 0; i < imageBuffers.length; i++) {
    try {
      const embedding = await generateImageEmbedding(imageBuffers[i]);
      embeddings.push(embedding);

      // Progress logging
      if ((i + 1) % 10 === 0) {
        console.log(`✓ Processed ${i + 1}/${imageBuffers.length} images`);
      }
    } catch (error) {
      console.warn(`Failed to embed image ${i}:`, error);
      // Push zero vector on failure (won't match anything)
      embeddings.push(new Array(512).fill(0));
    }
  }

  console.log(`✓ Completed ${embeddings.length} embeddings`);
  return embeddings;
}
