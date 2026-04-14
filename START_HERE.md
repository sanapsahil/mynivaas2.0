# 🎯 START HERE - Codebase Analysis

## What You Asked

You wanted to understand:
1. ✅ How properties are fetched in `/api/search` endpoint
2. ✅ What property data structure looks like
3. ✅ Current vector store schema and how embeddings are stored
4. ✅ How `/api/search-similar` works and what it expects
5. ✅ How images are currently handled in property listings

## What You Got

**5 comprehensive analysis documents** created specifically for your questions:

| Document | Size | Purpose | Read Time |
|----------|------|---------|-----------|
| **QUICK_SUMMARY.txt** ⭐ | 13K | Direct answers to all 4 questions | 5-10 min |
| **README_ANALYSIS.md** | 8.2K | Guide to all documents | 5 min |
| **VECTOR_STORE_ANALYSIS.md** | 12K | Deep technical details | 15 min |
| **ARCHITECTURE_DIAGRAM.md** | 17K | Visual data flow diagrams | 10 min |
| **IMPLEMENTATION_GUIDE.md** | 11K | Code to implement integration | 15 min |

## Quick Answers

### Q1: How are properties fetched?
**File:** `/src/app/api/search/route.ts`

```
SerpAPI search → geocode location → parallel enrichment (3 pipelines):
  1. Location analysis (satellite imagery, 3s timeout)
  2. Image scoring (scrape, score condition, 5s timeout)
  3. Agentic evaluation (AI valuation, 2.5s timeout)
→ Return Property[] with enrichment data
```

### Q2: What does Property data structure look like?
**File:** `/src/lib/serpapi.ts`

- 30+ fields: id, title, price, location, bedrooms, bathrooms, area
- Media: **imageUrl** (FIRST image only) ← LIMITATION
- Enrichment: conditionScore, locationIndices, agenticEvaluation
- Coordinates: lat/lng (randomly scattered for map display)

### Q3: Vector store schema?
**File:** `/src/lib/vectorStore.ts` → `/public/vector-store.json`

```typescript
EmbeddingRecord {
  id: string
  embedding: number[]                 // 512-dim CLIP-ViT, L2 normalized
  propertyData: {
    title, price, link, imageUrl,     // ← HAS IMAGE URL!
    bedrooms, bathrooms, area, location, source, conditionScore
  }
  timestamp: number
}
```

**⚠️ CRITICAL:** Vector store is **EMPTY** - embeddings not generated during search!

### Q4: How does /api/search-similar work?
**File:** `/src/app/api/search-similar/route.ts`

```
POST /api/search-similar (FormData: {image, topK=30, threshold=0.45})
  1. Validate file (type, size <10MB)
  2. Convert to Buffer
  3. generateImageEmbedding(buffer) → 512-dim vector
  4. searchSimilarEmbeddings(queryEmbedding, topK, threshold)
     └─ Cosine similarity against all stored embeddings
     └─ Filter by threshold (0.45 = ~42% similar)
     └─ Return top-K results
→ { results: [{id, similarity, property, similarityPercentage}] }
```

### Q5: How are images handled?
**File:** `/src/lib/imageScraper.ts` + `/src/lib/imageEmbeddings.ts`

**Scraping:** Cheerio CSS selectors → extracts multiple image URLs per property
**Downloading:** Axios (10s timeout, 10MB max)
**Embedding:** CLIP-ViT model (512-dim, L2-normalized)

**Problem:** All infrastructure works but:
- Only FIRST image stored in Property.imageUrl
- NO embeddings generated during search
- Vector store NEVER populated
- Multiple images per property NOT linked

## Key Finding

### ✅ What's Ready
- Image scraping (Cheerio)
- Image downloading (Axios)
- Embedding generation (CLIP-ViT)
- Vector store (JSON file)
- Similarity search endpoint

### ❌ What's Missing
- Embeddings NOT generated during search
- Only first image stored (not all scraped)
- Vector store NOT populated
- Multiple images NOT linked
- **Solution:** Generate embeddings for all images → batch upsert

## Which Document to Read

### 🚀 Quick Overview (5 min)
→ Read **QUICK_SUMMARY.txt**

### 🔍 Understand the Flow (10 min)
→ Read **ARCHITECTURE_DIAGRAM.md**

### 🛠️ Implement the Solution (15 min)
→ Read **IMPLEMENTATION_GUIDE.md**

### 📚 Deep Technical Dive (15 min)
→ Read **VECTOR_STORE_ANALYSIS.md**

### 🧭 Navigate All Documents
→ Read **README_ANALYSIS.md**

## File Locations (Quick Reference)

```
Property Search:     /src/app/api/search/route.ts (226 lines)
Property Structure:  /src/lib/serpapi.ts (Lines 15-41)
Image Scraping:      /src/lib/imageScraper.ts (135 lines)
Image Embedding:     /src/lib/imageEmbeddings.ts (282 lines)
Vector Store:        /src/lib/vectorStore.ts (262 lines)
Storage File:        /public/vector-store.json
Similar Search:      /src/app/api/search-similar/route.ts (156 lines)
```

## What You Need to Do

To fully integrate images with vector store:

1. ✏️ Modify `/src/app/api/search/route.ts`
   - Generate embeddings for ALL images
   - Batch upsert to vector store

2. ✏️ Extend `/src/lib/serpapi.ts`
   - Add `imageUrls[]` field
   - Add `imageEmbeddingIds[]` field

3. ✏️ Store multiple images per property
   - Instead of just first image

4. ✅ Test with real images
   - See IMPLEMENTATION_GUIDE.md

## Summary Table

| Item | Status | Location | Details |
|------|--------|----------|---------|
| Property Scraping | ✅ Working | `/src/app/api/search/route.ts` | Fetches 30-50 properties |
| Image Scraping | ✅ Working | `/src/lib/imageScraper.ts` | Extracts 3-5 images per property |
| Image Downloading | ✅ Working | `/src/lib/imageScraper.ts` | Downloads with Axios |
| Embedding Generation | ✅ Working | `/src/lib/imageEmbeddings.ts` | CLIP-ViT 512-dim |
| Vector Store | ✅ Built | `/src/lib/vectorStore.ts` | JSON file, ready to use |
| Vector Store Population | ❌ **MISSING** | `/src/app/api/search/route.ts` | Needs integration |
| Similarity Search | ✅ Ready | `/src/app/api/search-similar/route.ts` | Waiting for data |

## Next Action

1. **For understanding:** Open `QUICK_SUMMARY.txt`
2. **For implementation:** Open `IMPLEMENTATION_GUIDE.md`
3. **For architecture:** Open `ARCHITECTURE_DIAGRAM.md`
4. **For reference:** Open `VECTOR_STORE_ANALYSIS.md`

All documents have:
- ✓ Specific file paths
- ✓ Line numbers
- ✓ Code examples
- ✓ Step-by-step guidance
- ✓ Diagrams and flows

---

**Created:** 2024  
**Scope:** Complete property search + vector store integration analysis  
**Location:** /Users/sahil/Desktop/capstone
