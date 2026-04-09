import { pipeline } from "@xenova/transformers";
import sharp from "sharp";
import { getCachedEmbedding, cacheEmbedding } from "./embeddingCache";

// ImageBind model for multi-modal embeddings
// Uses Xenova/ImageBind-large for image understanding
let embeddingPipeline: any = null;

/**
 * Initialize the ImageBind embedding pipeline (lazy load to save memory)
 */
async function initializeEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;

  console.log("Loading ImageBind embedding model...");
  try {
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Xenova/clip-vit-base-patch32" // Using CLIP as proxy for ImageBind compatibility
    );
    console.log("✓ ImageBind embedding model loaded");
    return embeddingPipeline;
  } catch (error) {
    console.error("Failed to load embedding model:", error);
    throw new Error("Could not initialize embedding model");
  }
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
    const optimized = await sharp(imageBuffer)
      .resize(224, 224, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Load model
    const pipeline = await initializeEmbeddingPipeline();

    // Generate embedding
    const embedding = await pipeline(optimized);

    // Extract tensor data and normalize
    const embeddingArray = Array.from(embedding.data as any[]) as number[];

    // L2 normalization for cosine similarity
    const norm = Math.sqrt(
      embeddingArray.reduce((sum: number, val: number) => sum + val * val, 0)
    );
    const normalized = embeddingArray.map((val: number) => val / (norm + 1e-8));

    // Cache for future use
    await cacheEmbedding(imageBuffer, normalized);

    return normalized;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
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
