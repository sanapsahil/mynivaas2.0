import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

interface CacheEntry {
  hash: string;
  embedding: number[];
  timestamp: number;
}

const CACHE_DIR = path.join(process.cwd(), ".embedding-cache");

/**
 * Create MD5 hash of image buffer for cache key
 */
function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * Initialize cache directory
 */
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error("Failed to create cache directory:", error);
  }
}

/**
 * Get cache file path for a given hash
 */
function getCachePath(hash: string): string {
  return path.join(CACHE_DIR, `${hash}.json`);
}

/**
 * Get cached embedding if it exists and is fresh (< 30 days old)
 */
export async function getCachedEmbedding(
  buffer: Buffer
): Promise<number[] | null> {
  try {
    await ensureCacheDir();

    const hash = hashBuffer(buffer);
    const cachePath = getCachePath(hash);

    try {
      const data = await fs.readFile(cachePath, "utf-8");
      const entry = JSON.parse(data) as CacheEntry;

      // Check if cache is fresh (30 days)
      const ageMs = Date.now() - entry.timestamp;
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      if (ageMs < thirtyDaysMs) {
        console.log(`✓ Cache hit for embedding (age: ${Math.round(ageMs / 1000)}s)`);
        return entry.embedding;
      } else {
        console.log("Cache expired, regenerating...");
        return null;
      }
    } catch (error) {
      // Cache miss
      return null;
    }
  } catch (error) {
    console.warn("Cache retrieval failed, will regenerate:", error);
    return null;
  }
}

/**
 * Store embedding in cache
 */
export async function cacheEmbedding(
  buffer: Buffer,
  embedding: number[]
): Promise<void> {
  try {
    await ensureCacheDir();

    const hash = hashBuffer(buffer);
    const cachePath = getCachePath(hash);

    const entry: CacheEntry = {
      hash,
      embedding,
      timestamp: Date.now(),
    };

    await fs.writeFile(cachePath, JSON.stringify(entry));
    console.log(`✓ Cached embedding for hash ${hash.substring(0, 8)}...`);
  } catch (error) {
    console.warn("Failed to cache embedding:", error);
    // Not critical - continue without caching
  }
}

/**
 * Clear all cache entries older than maxAgeMs
 */
export async function cleanCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
  try {
    await ensureCacheDir();

    const files = await fs.readdir(CACHE_DIR);
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stat = await fs.stat(filePath);

      if (Date.now() - stat.mtime.getTime() > maxAgeMs) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }

    console.log(`✓ Cleaned ${cleaned} expired cache entries`);
    return cleaned;
  } catch (error) {
    console.error("Cache cleanup failed:", error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  totalSizeBytes: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}> {
  try {
    await ensureCacheDir();

    const files = await fs.readdir(CACHE_DIR);
    let totalSize = 0;
    let oldestTime = Date.now();
    let newestTime = 0;

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);
      const stat = await fs.stat(filePath);
      totalSize += stat.size;

      if (stat.mtime.getTime() < oldestTime) {
        oldestTime = stat.mtime.getTime();
      }
      if (stat.mtime.getTime() > newestTime) {
        newestTime = stat.mtime.getTime();
      }
    }

    return {
      totalEntries: files.length,
      totalSizeBytes: totalSize,
      oldestEntry: oldestTime === Date.now() ? null : new Date(oldestTime).toISOString(),
      newestEntry: newestTime === 0 ? null : new Date(newestTime).toISOString(),
    };
  } catch (error) {
    console.error("Failed to get cache stats:", error);
    return {
      totalEntries: 0,
      totalSizeBytes: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
}
