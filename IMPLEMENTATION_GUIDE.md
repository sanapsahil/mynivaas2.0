# Implementation Guide: Extract & Link Images to Vector Store

## Overview
This guide explains how to extract image URLs from property listings and link them to the vector store for image-based similarity search.

---

## Part 1: Current State

### Property Fetching (GET /api/search)
- **Location:** `/src/app/api/search/route.ts`
- **Images Scraped:** 3 per property
- **Images Stored:** Only first one (`property.imageUrl`)
- **Embeddings Created:** None
- **Vector Store Updated:** Never

### Image Scraping
- **Tool:** Cheerio HTML parser
- **Function:** `scrapePropertyImages(url, maxImages=5)`
- **Output:** Array of full image URLs

### Embedding Generation
- **Tool:** CLIP-ViT (Xenova)
- **Function:** `generateImageEmbedding(buffer)`
- **Output:** 512-dim L2-normalized vector

### Vector Storage
- **File:** `/public/vector-store.json`
- **Function:** `addToVectorStore(record)` / `batchAddToVectorStore(records[])`
- **Structure:** EmbeddingRecord with propertyData including imageUrl

---

## Part 2: What Needs to Change

### 1. Update Property Interface
**File:** `/src/lib/serpapi.ts`

```typescript
interface Property {
  // ... existing fields ...
  
  imageUrl?: string;              // KEEP: Primary image for backward compat
  imageUrls?: string[];           // NEW: All scraped images
  imageEmbeddingIds?: string[];   // NEW: Links to vector store records
}
```

### 2. Modify Search Endpoint
**File:** `/src/app/api/search/route.ts`

After image scoring, generate embeddings for all images:

```typescript
// Around line 143, after all location & scoring promises resolve:

// NEW: Generate embeddings for all images
const embeddingPromises = properties.map(async (property, idx) => {
  if (!property.imageUrl) return;  // No images scraped
  
  try {
    // Use the image URLs we already scraped
    const imageUrls = property.imageUrls || (property.imageUrl ? [property.imageUrl] : []);
    const embeddingIds: string[] = [];
    const records: EmbeddingRecord[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];
        const buffer = await downloadImage(imageUrl);
        
        if (!buffer) continue;
        
        // Generate embedding
        const embedding = await generateImageEmbedding(buffer);
        
        // Create vector store record
        const recordId = `embed-${property.id}-${i}`;
        const record: EmbeddingRecord = {
          id: recordId,
          embedding,
          propertyData: {
            title: property.title,
            price: property.priceFormatted,
            link: property.link,
            imageUrl,
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
        
        records.push(record);
        embeddingIds.push(recordId);
      } catch (imageError) {
        console.warn(`Failed to embed image ${i} for property ${idx}:`, imageError);
      }
    }
    
    // Store embedding IDs in property
    if (embeddingIds.length > 0) {
      properties[idx].imageEmbeddingIds = embeddingIds;
    }
    
    // Batch upsert to vector store
    if (records.length > 0) {
      await batchAddToVectorStore(records);
    }
  } catch (error) {
    console.error(`Error generating embeddings for property ${idx}:`, error);
  }
});

await Promise.all(embeddingPromises);
```

### 3. Import Vector Store Functions
**File:** `/src/app/api/search/route.ts` (add to imports)

```typescript
import { 
  addToVectorStore, 
  batchAddToVectorStore 
} from "@/lib/vectorStore";
```

### 4. Store All Scraped Images
**File:** `/src/app/api/search/route.ts` (around line 133)

Currently:
```typescript
if (result.imageUrl) {
  properties[idx].imageUrl = result.imageUrl;
}
```

Change to:
```typescript
if (result.imageUrls) {
  properties[idx].imageUrls = result.imageUrls;
  properties[idx].imageUrl = result.imageUrls[0];  // Keep first for backward compat
}
```

And modify `scoreProperty()` function:
```typescript
async function scoreProperty(propertyUrl: string) {
  try {
    const imageUrls = await scrapePropertyImages(propertyUrl, 3);
    if (imageUrls.length === 0) return { score: null, imageUrls: [] };

    const imageBuffers = (
      await Promise.all(imageUrls.map((url) => downloadImage(url)))
    ).filter((buffer): buffer is Buffer => buffer !== null);

    if (imageBuffers.length === 0) return { score: null, imageUrls: [] };

    const score = await scoreBestPropertyImage(imageBuffers);
    return {
      score,
      imageUrls,  // RETURN ALL
    };
  } catch (error) {
    console.error(`Failed to score property ${propertyUrl}:`, error);
    return { score: null, imageUrls: [] };
  }
}
```

---

## Part 3: Alternative: Create Batch Embedding Service

If you want separate batch processing (recommended for scalability):

**File:** `/src/lib/embeddingService.ts` (new file)

```typescript
import { EmbeddingRecord, addToVectorStore, batchAddToVectorStore } from "@/lib/vectorStore";
import { generateImageEmbedding } from "@/lib/imageEmbeddings";
import { downloadImage } from "@/lib/imageScraper";

interface PropertyWithImages {
  id: string;
  title: string;
  price: string;
  link: string;
  imageUrls: string[];
  bedrooms?: string;
  bathrooms?: string;
  area?: string;
  location?: string;
  source?: string;
  locationIndices?: any;
  conditionScore?: number;
}

export async function embedPropertyImages(
  property: PropertyWithImages
): Promise<EmbeddingRecord[]> {
  const records: EmbeddingRecord[] = [];
  
  for (let i = 0; i < property.imageUrls.length; i++) {
    try {
      const imageUrl = property.imageUrls[i];
      const buffer = await downloadImage(imageUrl);
      
      if (!buffer) {
        console.warn(`Failed to download image ${imageUrl}`);
        continue;
      }
      
      const embedding = await generateImageEmbedding(buffer);
      
      const record: EmbeddingRecord = {
        id: `embed-${property.id}-${i}`,
        embedding,
        propertyData: {
          title: property.title,
          price: property.price,
          link: property.link,
          imageUrl,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          location: property.location,
          source: property.source,
          locationIndices: property.locationIndices,
          conditionScore: property.conditionScore,
        },
        timestamp: Date.now(),
      };
      
      records.push(record);
    } catch (error) {
      console.error(`Error embedding image ${i} for property ${property.id}:`, error);
    }
  }
  
  return records;
}

export async function embedBatchProperties(
  properties: PropertyWithImages[]
): Promise<number> {
  let totalEmbedded = 0;
  
  for (const property of properties) {
    try {
      const records = await embedPropertyImages(property);
      if (records.length > 0) {
        await batchAddToVectorStore(records);
        totalEmbedded += records.length;
      }
    } catch (error) {
      console.error(`Error processing property ${property.id}:`, error);
    }
  }
  
  return totalEmbedded;
}
```

---

## Part 4: Test the Integration

### Test 1: Verify Images are Stored
```bash
# After running a search
curl "http://localhost:3000/api/search?location=Bangalore&propertyType=apartment&listingType=rent"

# Check if properties have imageUrls array
# Example response should have:
# {
#   "imageUrls": ["url1", "url2", "url3"],
#   "imageUrl": "url1",
#   "imageEmbeddingIds": ["embed-prop-123-0", "embed-prop-123-1", ...]
# }
```

### Test 2: Check Vector Store
```bash
# View vector store stats
curl "http://localhost:3000/api/search-similar"

# Should show increased recordCount:
# {
#   "vectorStore": {
#     "recordCount": 150,  // Should be > 0
#     "lastUpdated": "2024-01-01T12:00:00.000Z",
#     "version": "1.0"
#   }
# }
```

### Test 3: Search Similar
```bash
# Upload an image to find similar properties
curl -X POST "http://localhost:3000/api/search-similar" \
  -F "image=@/path/to/test-image.jpg" \
  -F "topK=10" \
  -F "threshold=0.4"

# Should return properties with high image similarity
```

---

## Part 5: Performance Considerations

### Embedding Time
- First image in session: ~10-15s (model loading)
- Subsequent images: ~2-3s each
- Cached embeddings: ~0.1s

### Optimization Strategies
1. **Warmup on startup:** Load model once
2. **Batch processing:** Process multiple properties in parallel
3. **Image caching:** Already implemented via buffer hash
4. **Compression:** Only store best quality images

### Storage
- 512-dim vector: ~2KB (float32)
- EmbeddingRecord metadata: ~0.5KB
- Per property (3 images): ~7.5KB total
- 1000 properties: ~7.5MB
- 10000 properties: ~75MB

---

## Part 6: Error Handling

### Common Issues

1. **Image not scraped:**
   ```typescript
   // Property has no images
   if (!property.imageUrls || property.imageUrls.length === 0) {
     console.warn(`No images for property: ${property.id}`);
     continue;
   }
   ```

2. **Image download fails:**
   ```typescript
   // Handled in loop - continues with next image
   if (!buffer) continue;
   ```

3. **Embedding generation fails:**
   ```typescript
   // Caught and logged, property still searchable by text
   console.error(`Error generating embedding: ${error}`);
   ```

4. **Vector store full:**
   ```typescript
   // No limit enforced - JSON file grows
   // Monitor file size and implement cleanup if needed
   ```

---

## Part 7: Monitoring & Debugging

### Check Embedding Cache
```bash
# View cached embeddings
ls -la .embedding-cache/
```

### Monitor Vector Store Growth
```bash
# Check file size
ls -lh public/vector-store.json

# Count records
jq '.recordCount' public/vector-store.json
```

### Debug Image Scraping
```typescript
// In search endpoint, log all URLs
console.log(`Scraped images for ${property.id}:`, imageUrls);
```

### Verify Embeddings
```bash
# Check first record structure
jq '.records[0]' public/vector-store.json
```

---

## Summary

### Changes Required
1. ✅ Import vector store functions in search endpoint
2. ✅ Update Property interface with `imageUrls[]` and `imageEmbeddingIds[]`
3. ✅ Modify `scoreProperty()` to return all image URLs
4. ✅ Generate embeddings for all images after enrichment
5. ✅ Batch upsert to vector store
6. ✅ Test similarity search

### Files to Modify
- `/src/app/api/search/route.ts` - Add embedding generation
- `/src/lib/serpapi.ts` - Update Property interface
- `/src/app/api/search-similar/route.ts` - Already supports this!

### Files Already Ready
- ✓ `/src/lib/vectorStore.ts` - Ready to receive embeddings
- ✓ `/src/lib/imageEmbeddings.ts` - Ready to generate
- ✓ `/src/lib/imageScraper.ts` - Already scrapes multiple images
- ✓ `/public/vector-store.json` - Already storing imageUrl

