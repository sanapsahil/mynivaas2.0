# Vector Store Integration Analysis

## QUICK REFERENCE

### 1. Property Fetching Flow (/api/search)

**Location:** `/src/app/api/search/route.ts`

```
GET /api/search?location=Bangalore&propertyType=apartment&listingType=rent
    ↓
1. searchProperties() via SerpAPI → ~30-50 properties
2. geocodeLocation() → get center coordinates
3. Parallel enrichment (3 pipelines):
   ├─ Location Analysis: satellite imagery + greenery/traffic indices
   ├─ Image Scoring: scrape images → score condition → store URL
   └─ Agentic Evaluation: AI valuation against peers
    ↓
Response with enriched Property[] array
```

---

## 2. Property Data Structure

**File:** `/src/lib/serpapi.ts` (Lines 15-41)

### Core Property Interface
```typescript
interface Property {
  // Identity & Basics
  id: string                              // Unique ID
  title: string                           // Property title
  type: string                            // apartment/house/plot
  source: string                          // 99acres/Housing.com/etc
  link: string                            // Direct listing URL
  
  // Location & Address
  location: string                        // Main location + locality
  address?: string
  lat?: number                            // Map coordinates
  lng?: number
  
  // Property Details
  price: number                           // Normalized numeric
  priceFormatted: string                  // "₹X Lac"
  bedrooms?: string                       // "2 BHK"
  bathrooms?: string                      // "2 Bath"
  area?: string                           // "1200 sq. ft"
  furnishing?: string                     // furnished/unfurnished
  
  // Media & Content
  imageUrl?: string                       // SINGLE image URL (FIRST scraped)
  description?: string                    // Max 200 chars
  sourceIcon?: string
  postedDate?: string
  
  // Enrichment Data
  conditionScore?: {                      // CNN-based analysis
    modernity: 1-10
    wearAndTear: 1-10 (10=pristine)
    lighting: 1-10
    overall: 1-10 average
  }
  
  locationIndices?: {                     // Satellite analysis
    greeneryIndex: 0-100 (% coverage)
    trafficCongestionIndex: 0-100
  }
  
  agenticEvaluation?: AgenticEvaluation   // AI valuation
  agenticSuppressedReason?: string
  isAggregated?: boolean                  // Prices from snippets
}
```

### Key Points
- **Image Storage:** `imageUrl` contains FIRST scraped image only
- **Price Format:** Stored as number (normalized from Lac/Crore/K)
- **Coordinates:** Scattered randomly around geocoded center (±0.01°)
- **Condition Score:** Derived from CNN analysis of property photos

---

## 3. Vector Store Schema

**File:** `/src/lib/vectorStore.ts` (Lines 4-31)

### EmbeddingRecord Structure
```typescript
interface EmbeddingRecord {
  id: string                              // Property ID or image hash
  embedding: number[]                     // 512-dim CLIP-ViT vector (L2 normalized)
  propertyData: {
    title: string
    price: string                         // Stored as string in vector store
    link: string
    imageUrl: string                      // ← IMAGE URL LINK
    bedrooms?: string
    bathrooms?: string
    area?: string
    location?: string
    source?: string
    locationIndices?: {
      greeneryPercentage: number
      trafficCongestionPercentage: number
    }
    conditionScore?: number               // Overall 1-10 score
  }
  timestamp: number                       // Unix timestamp when added
}

interface VectorStoreIndex {
  version: string                         // "1.0"
  recordCount: number                     // Total records
  lastUpdated: number                     // Unix timestamp
  records: EmbeddingRecord[]              // All stored embeddings
}
```

### Storage
- **Location:** `/public/vector-store.json`
- **Format:** JSON (human-readable)
- **Persistence:** File system (can swap with Pinecone)
- **Scalability:** Good for ~100K-1M records

### Key Functions
```typescript
loadVectorStore()                                      // Load from disk
saveVectorStore(store)                                // Save to disk
addToVectorStore(record, autoSave=true)              // Add/update single
batchAddToVectorStore(records[])                     // Bulk add/update
searchSimilarEmbeddings(queryEmb, topK=30, threshold=0.45) // Search
getVectorStoreStats()                                // Get stats
clearVectorStore()                                   // Clear all
```

---

## 4. How /api/search-similar Works

**File:** `/src/app/api/search-similar/route.ts`

### POST /api/search-similar

**Request:**
```
FormData:
  - image: File (image/*)
  - ?topK=30 (1-100)
  - ?threshold=0.45 (0-1)
```

**Flow:**
```
1. Validate file (type, size <10MB)
2. Convert to Buffer
3. generateImageEmbedding(buffer) → 512-dim vector
4. searchSimilarEmbeddings(queryEmbedding, topK, threshold)
   └─ Cosine similarity against all records
   └─ Filter by threshold
   └─ Sort by similarity
   └─ Return top-K
5. Return results with similarity scores
```

**Response:**
```typescript
{
  success: true,
  results: [{
    id: string
    similarity: number                    // 0-1 (4 decimals)
    property: EmbeddingRecord.propertyData
    similarityPercentage: number          // 0-100 display
  }],
  stats: {
    matchesFound: number
    topSimilarity: number
    avgSimilarity: number
    embeddingDimensions: 512
  }
}
```

### GET /api/search-similar (Stats)
Returns vector store statistics (record count, version, last updated)

---

## 5. Image Handling Pipeline

### A. Image Scraping
**File:** `/src/lib/imageScraper.ts`

```typescript
scrapePropertyImages(url, maxImages=5)
  ├─ Fetch HTML with 8s timeout
  ├─ Try selectors (in order):
  │  ├─ img[class*="property/gallery/photo"]
  │  ├─ img[alt*="property/apartment"]
  │  ├─ div[class*="gallery/slider"] img
  │  └─ [data-testid*="image"] img
  └─ Fallback: all images (filter logos/icons)
  └─ Return: array of full URLs
```

### B. Image Downloading
```typescript
downloadImage(imageUrl)
  ├─ Axios GET with 10s timeout, 10MB limit
  ├─ Spoof User-Agent (avoid blocking)
  └─ Return: Buffer or null
```

### C. Image Embedding
**File:** `/src/lib/imageEmbeddings.ts`

```typescript
generateImageEmbedding(imageBuffer)
  ├─ Check cache first (by buffer hash)
  ├─ Resize to 224x224 (JPEG quality 80)
  ├─ Load CLIP-ViT model (retry 3x if needed)
  ├─ Extract raw pixel data (RGB)
  ├─ Pipeline inference → 512-dim vector
  ├─ L2 normalize
  ├─ Cache result
  └─ Return: normalized Float32Array
```

**Model:** `Xenova/clip-vit-base-patch32`
- Dimensions: 512
- Speed: ~5-10s (cold), ~2-3s (cached)
- Output: L2-normalized vectors

### D. Current Flow in /api/search

```
For each property:
  1. scrapePropertyImages(property.link, 3)
  2. Promise.all(downloadImage for each) with 5s timeout
  3. scoreBestPropertyImage(buffers) → CNN condition score
  4. Store property.imageUrl = first URL
  
Result: Property.imageUrl has single image
Problem: Only one image stored, no embeddings created!
```

---

## 6. CURRENT GAPS

### What's Missing for Vector Store Integration
1. ❌ **No embedding generation during search** - Images aren't being embedded
2. ❌ **No automatic vector store population** - Embeddings aren't being stored
3. ❌ **Single image storage only** - Property.imageUrl is first image only
4. ❌ **No bulk image processing** - No batch embedding pipeline
5. ❌ **No property ID in vector records** - Can't link back to original property
6. ❌ **No multiple images per property** - Only first image captured

### What Needs to Change
1. **Store all scraped images** not just first
2. **Generate embeddings for all images** during/after search
3. **Populate vector store** with EmbeddingRecords
4. **Link embeddings back to properties** via ID
5. **Create batch pipeline** for efficient processing

---

## 7. HOW TO EXTRACT IMAGE URLs

### Current Image Extraction
```typescript
// In /api/search/route.ts (lines 121-139)
const imageUrls = await scrapePropertyImages(propertyUrl, 3);
const imageBuffers = await Promise.all(
  imageUrls.map(url => downloadImage(url))
);
const score = await scoreBestPropertyImage(imageBuffers);

// Only first URL is stored:
property.imageUrl = imageUrls[0];
```

### To Extract ALL Images
```typescript
// Modify Property interface:
interface Property {
  imageUrl?: string;           // Primary image (for backward compat)
  imageUrls?: string[];        // All scraped images
  imageEmbeddingIds?: string[]; // Links to vector store records
}

// During search:
property.imageUrls = imageUrls;  // Store all

// After scoring:
for (const imageUrl of imageUrls) {
  const buffer = await downloadImage(imageUrl);
  const embedding = await generateImageEmbedding(buffer);
  
  // Create vector record
  const record: EmbeddingRecord = {
    id: `embed-${property.id}-${imageIndex}`,
    embedding,
    propertyData: {
      title: property.title,
      price: property.priceFormatted,
      link: property.link,
      imageUrl,                              // ← STORE HERE
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      location: property.location,
      source: property.source,
      locationIndices: property.locationIndices,
      conditionScore: property.conditionScore?.overall,
    },
    timestamp: Date.now(),
  };
  
  await addToVectorStore(record, autoSave=false);
}
await saveVectorStore(store);  // Batch save
```

---

## 8. EMBEDDING MODEL DETAILS

**Model:** CLIP-ViT-base-patch32 (via Xenova/transformers.js)
- **Type:** Vision-language model
- **Output Dimensions:** 512
- **Normalization:** L2 (cosine similarity ready)
- **Input:** Images (any size, auto-resized to 224x224)
- **Speed:** 
  - First run (model download): ~30-60s
  - Subsequent runs: ~5-10s per image (cold cache)
  - Cached embeddings: instant (~0.1s)

**Cosine Similarity:** 
- Range: 0 to 1
- 1.0 = identical images
- 0.0 = completely different
- Default threshold: 0.45 (~42% similarity)

---

## 9. SIMILARITY SEARCH ALGORITHM

```typescript
searchSimilarEmbeddings(queryEmbedding, topK=30, threshold=0.45):
  1. Load vector store (all records)
  2. For each record:
     similarity = cosineSimilarity(queryEmbedding, record.embedding)
  3. Filter: keep only if similarity >= threshold
  4. Sort: descending by similarity
  5. Return: top K results
```

**Complexity:** O(n) where n = number of records
- 10K records: ~50-100ms
- 100K records: ~500ms-1s
- 1M records: ~5-10s

---

## 10. KEY FILE LOCATIONS SUMMARY

| File | Purpose | Key Functions |
|------|---------|----------------|
| `/src/app/api/search/route.ts` | Property search endpoint | GET handler, image scraping |
| `/src/lib/serpapi.ts` | Search property interface | Property parsing, price normalization |
| `/src/app/api/search-similar/route.ts` | Similar property search | POST handler, embedding generation |
| `/src/lib/vectorStore.ts` | Vector store operations | Load, save, add, search |
| `/src/lib/imageEmbeddings.ts` | Image embedding pipeline | CLIP model, L2 normalization |
| `/src/lib/imageScraper.ts` | Web scraping for images | Cheerio selectors, download |
| `/src/lib/embeddingCache.ts` | Embedding cache | Cache by image buffer hash |
| `public/vector-store.json` | Vector store persistence | JSON file storage |

---

## 11. INTEGRATION CHECKLIST

To fully integrate images into vector store:

- [ ] Extract all image URLs during search (not just first)
- [ ] Generate embeddings for each image in batch
- [ ] Create EmbeddingRecords with imageUrl and property data
- [ ] Upsert records to vector store
- [ ] Link embeddings back to properties (imageEmbeddingIds)
- [ ] Test similarity search with uploaded images
- [ ] Add monitoring for embedding cache hits
- [ ] Handle image failures gracefully (skip, don't block)
- [ ] Batch processing for efficiency
- [ ] Cache warmup on startup

---

## NEXT STEPS

1. **Modify search endpoint** to generate embeddings for all images
2. **Create batch embedding service** for efficiency
3. **Enhance Property interface** to store multiple images
4. **Link embeddings to vector store** with proper record IDs
5. **Test similar property search** with real images
6. **Monitor performance** (embedding time, search latency)
7. **Optimize with caching** (embedding cache warmup)

