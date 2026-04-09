import fs from "fs/promises";
import path from "path";

interface EmbeddingRecord {
  id: string; // Property ID or image URL hash
  embedding: number[];
  propertyData: {
    title: string;
    price: string;
    link: string;
    imageUrl: string;
    bedrooms?: string;
    bathrooms?: string;
    area?: string;
    location?: string;
    source?: string;
    locationIndices?: {
      greeneryPercentage: number;
      trafficCongestionPercentage: number;
    };
    conditionScore?: number;
  };
  timestamp: number;
}

interface VectorStoreIndex {
  version: string;
  recordCount: number;
  lastUpdated: number;
  records: EmbeddingRecord[];
}

const VECTOR_STORE_PATH = path.join(process.cwd(), "public", "vector-store.json");
const VECTOR_STORE_DIR = path.join(process.cwd(), "public");

/**
 * Initialize vector store directory if it doesn't exist
 */
async function ensureVectorStoreDir() {
  try {
    await fs.mkdir(VECTOR_STORE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create vector store directory:", error);
  }
}

/**
 * Load vector store from file
 * Returns existing store or empty store if doesn't exist
 */
export async function loadVectorStore(): Promise<VectorStoreIndex> {
  try {
    await ensureVectorStoreDir();

    try {
      const data = await fs.readFile(VECTOR_STORE_PATH, "utf-8");
      const store = JSON.parse(data) as VectorStoreIndex;
      console.log(`✓ Loaded vector store with ${store.recordCount} embeddings`);
      return store;
    } catch (error) {
      // File doesn't exist yet - return empty store
      console.log("Vector store not found, initializing new store");
      return {
        version: "1.0",
        recordCount: 0,
        lastUpdated: Date.now(),
        records: [],
      };
    }
  } catch (error) {
    console.error("Error loading vector store:", error);
    throw new Error("Failed to load vector store");
  }
}

/**
 * Save vector store to file
 * Persists all embeddings and property metadata
 */
export async function saveVectorStore(store: VectorStoreIndex): Promise<void> {
  try {
    await ensureVectorStoreDir();
    await fs.writeFile(VECTOR_STORE_PATH, JSON.stringify(store, null, 2));
    console.log(`✓ Saved vector store with ${store.recordCount} embeddings`);
  } catch (error) {
    console.error("Error saving vector store:", error);
    throw new Error("Failed to save vector store");
  }
}

/**
 * Add or update an embedding record in the store
 */
export async function addToVectorStore(
  record: EmbeddingRecord,
  autoSave: boolean = true
): Promise<void> {
  try {
    const store = await loadVectorStore();

    // Check if record already exists
    const existingIdx = store.records.findIndex((r) => r.id === record.id);

    if (existingIdx >= 0) {
      // Update existing
      store.records[existingIdx] = record;
      console.log(`Updated embedding for ${record.id}`);
    } else {
      // Add new
      store.records.push(record);
      console.log(`Added new embedding for ${record.id}`);
    }

    store.recordCount = store.records.length;
    store.lastUpdated = Date.now();

    if (autoSave) {
      await saveVectorStore(store);
    }

    return;
  } catch (error) {
    console.error("Error adding to vector store:", error);
    throw new Error("Failed to add embedding to store");
  }
}

/**
 * Batch add multiple embeddings to the store
 * More efficient than adding one-by-one
 */
export async function batchAddToVectorStore(
  records: EmbeddingRecord[]
): Promise<void> {
  try {
    const store = await loadVectorStore();

    for (const record of records) {
      const existingIdx = store.records.findIndex((r) => r.id === record.id);
      if (existingIdx >= 0) {
        store.records[existingIdx] = record;
      } else {
        store.records.push(record);
      }
    }

    store.recordCount = store.records.length;
    store.lastUpdated = Date.now();

    await saveVectorStore(store);
    console.log(`✓ Batch added ${records.length} embeddings`);

    return;
  } catch (error) {
    console.error("Error batch adding to vector store:", error);
    throw new Error("Failed to batch add embeddings");
  }
}

/**
 * Search for similar embeddings using cosine similarity
 */
export async function searchSimilarEmbeddings(
  queryEmbedding: number[],
  topK: number = 30,
  similarityThreshold: number = 0.45
): Promise<
  Array<{
    id: string;
    similarity: number;
    property: EmbeddingRecord["propertyData"];
  }>
> {
  try {
    const store = await loadVectorStore();

    if (store.records.length === 0) {
      console.warn("Vector store is empty");
      return [];
    }

    // Calculate similarities
    const similarities = store.records.map((record) => {
      const similarity = cosineSimilarity(queryEmbedding, record.embedding);
      return {
        id: record.id,
        similarity,
        property: record.propertyData,
      };
    });

    // Filter by threshold and sort
    const results = similarities
      .filter((item) => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`✓ Found ${results.length} similar properties (threshold: ${similarityThreshold})`);
    return results;
  } catch (error) {
    console.error("Error searching embeddings:", error);
    throw new Error("Failed to search embeddings");
  }
}

/**
 * Cosine similarity calculation (duplicate from imageEmbeddings.ts for independence)
 */
function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    return 0;
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
 * Get store statistics
 */
export async function getVectorStoreStats(): Promise<{
  recordCount: number;
  lastUpdated: string;
  version: string;
}> {
  const store = await loadVectorStore();
  return {
    recordCount: store.recordCount,
    lastUpdated: new Date(store.lastUpdated).toISOString(),
    version: store.version,
  };
}

/**
 * Clear vector store (use with caution!)
 */
export async function clearVectorStore(): Promise<void> {
  try {
    const emptyStore: VectorStoreIndex = {
      version: "1.0",
      recordCount: 0,
      lastUpdated: Date.now(),
      records: [],
    };
    await saveVectorStore(emptyStore);
    console.log("✓ Vector store cleared");
  } catch (error) {
    console.error("Error clearing vector store:", error);
    throw new Error("Failed to clear vector store");
  }
}
