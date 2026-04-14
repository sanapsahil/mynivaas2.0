# Codebase Analysis - Complete Documentation

This directory contains comprehensive analysis of the property search and vector store integration system.

## Documents Generated

### 1. **QUICK_SUMMARY.txt** ⭐ START HERE
- Executive summary of all 4 main questions
- Quick reference for each component
- Key findings and critical gaps
- ~25 KB, comprehensive but readable

### 2. **VECTOR_STORE_ANALYSIS.md**
- Detailed breakdown of each component
- 11 sections covering full architecture
- Data structures and interfaces
- Key file locations with line numbers
- Integration checklist
- ~25 KB

### 3. **ARCHITECTURE_DIAGRAM.md**
- Visual ASCII diagrams of data flows
- Current data flow from search to response
- Vector store schema visualization
- Image embedding pipeline
- Search-similar endpoint flow
- Data linking diagrams (current vs proposed)
- Technology stack overview
- ~35 KB

### 4. **IMPLEMENTATION_GUIDE.md**
- Step-by-step implementation instructions
- Code examples for each modification
- How to extract and link images
- Alternative: batch embedding service
- Testing procedures
- Performance considerations
- Error handling patterns
- Monitoring & debugging tips
- ~22 KB

---

## Analysis Answers Quick Links

### Question 1: How properties are fetched in /api/search endpoint
**File:** `/src/app/api/search/route.ts` (226 lines)

**Short Answer:** 
- SerpAPI Google search (~30-50 properties)
- 3 parallel enrichment pipelines: location analysis, image scoring, agentic evaluation
- Each with individual timeouts for resilience
- All run in parallel with Promise.all()

**Detailed Info:**
- QUICK_SUMMARY.txt (lines 14-25)
- VECTOR_STORE_ANALYSIS.md (section 1)
- ARCHITECTURE_DIAGRAM.md (first diagram)

---

### Question 2: Property data structure (title, price, images, location, etc.)
**File:** `/src/lib/serpapi.ts` (Lines 15-41)

**Short Answer:**
- 30+ fields covering identity, location, pricing, details, enrichment
- Stores only FIRST image URL
- Includes CNN condition score & satellite analysis
- AI valuation data

**Detailed Info:**
- QUICK_SUMMARY.txt (lines 33-73)
- VECTOR_STORE_ANALYSIS.md (section 2)
- ARCHITECTURE_DIAGRAM.md (schema section)

---

### Question 3: Vector store schema and how embeddings are stored
**File:** `/src/lib/vectorStore.ts` (Lines 4-31)

**Short Answer:**
- JSON file at `/public/vector-store.json`
- EmbeddingRecord: id, 512-dim embedding, propertyData (with imageUrl), timestamp
- CLIP-ViT model (512 dimensions, L2 normalized)
- Cosine similarity search with threshold filtering

**Detailed Info:**
- QUICK_SUMMARY.txt (lines 75-141)
- VECTOR_STORE_ANALYSIS.md (section 3)
- ARCHITECTURE_DIAGRAM.md (schema visualization)
- **CRITICAL:** Currently EMPTY - no embeddings generated during search!

---

### Question 4: How /api/search-similar works and what it expects
**File:** `/src/app/api/search-similar/route.ts` (156 lines)

**Short Answer:**
- POST endpoint with FormData image upload
- Generates embedding for uploaded image
- Searches vector store using cosine similarity
- Returns top-K similar properties with scores

**Detailed Info:**
- QUICK_SUMMARY.txt (lines 143-195)
- VECTOR_STORE_ANALYSIS.md (section 4)
- ARCHITECTURE_DIAGRAM.md (search-similar flow)
- IMPLEMENTATION_GUIDE.md (testing section)

---

### Question 5: How images are currently handled
**File:** `/src/lib/imageScraper.ts` (135 lines) + `/src/lib/imageEmbeddings.ts` (282 lines)

**Short Answer:**
- Cheerio HTML parsing extracts multiple image URLs
- Downloaded with Axios (10s timeout, 10MB max)
- Embedded with CLIP-ViT model (512-dim vectors)
- Only first image stored in Property.imageUrl
- NO embeddings created during search

**Detailed Info:**
- QUICK_SUMMARY.txt (lines 197-243)
- VECTOR_STORE_ANALYSIS.md (section 5)
- ARCHITECTURE_DIAGRAM.md (image scraping & embedding flows)
- **KEY ISSUE:** All infrastructure exists but not integrated!

---

## Key Findings

### ✅ What's Already Built
- Image scraping infrastructure (Cheerio + CSS selectors)
- Image downloading pipeline (Axios with timeouts)
- Embedding generation (CLIP-ViT model with caching)
- Vector store with persistence (JSON file)
- Similarity search endpoint (ready to use)
- All data structures prepared

### ❌ What's Missing
- Embeddings NOT generated during search
- Only first image stored (not all scraped images)
- Vector store NOT populated during search
- Multiple images per property NOT linked to embeddings
- No batch processing pipeline

### 🔧 Solution Required
1. Generate embeddings for ALL images during search
2. Store multiple image URLs per property
3. Populate vector store with EmbeddingRecords
4. Link embeddings back to property IDs
5. See IMPLEMENTATION_GUIDE.md for detailed code

---

## File Locations Summary

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| **Property Search** | `/src/app/api/search/route.ts` | 226 | Working |
| **Property Interface** | `/src/lib/serpapi.ts` | 428 | Ready for extension |
| **Image Scraping** | `/src/lib/imageScraper.ts` | 135 | Working |
| **Image Embedding** | `/src/lib/imageEmbeddings.ts` | 282 | Working |
| **Embedding Cache** | `/src/lib/embeddingCache.ts` | ? | Working |
| **Vector Store** | `/src/lib/vectorStore.ts` | 262 | Empty (waiting for data) |
| **Search-Similar** | `/src/app/api/search-similar/route.ts` | 156 | Ready to use |
| **Vector Store File** | `/public/vector-store.json` | ? | Empty |

---

## Technical Specifications

### Embedding Model
- **Name:** CLIP-ViT-base-patch32 (via Xenova/transformers.js)
- **Dimensions:** 512
- **Normalization:** L2 (cosine similarity ready)
- **Speed:** 5-10s (cold), 2-3s (warm cache), 0.1s (cached)

### Similarity Search
- **Algorithm:** Cosine similarity
- **Range:** 0 to 1 (1 = identical)
- **Default Threshold:** 0.45 (~42% similarity)
- **Default Top-K:** 30 results
- **Complexity:** O(n) linear scan

### Storage
- **Format:** JSON (human-readable)
- **Location:** `/public/vector-store.json`
- **Scalability:** Good for 100K-1M records
- **Alternative:** Pinecone adapter available

---

## Next Steps

1. **Read QUICK_SUMMARY.txt** - Get overview in 5 minutes
2. **Review ARCHITECTURE_DIAGRAM.md** - Understand visual flows
3. **Study VECTOR_STORE_ANALYSIS.md** - Deep dive into each component
4. **Follow IMPLEMENTATION_GUIDE.md** - Implement the integration
5. **Test with code examples** - Verify everything works

---

## How to Use These Documents

### For Quick Understanding
Start with **QUICK_SUMMARY.txt** - it answers all 4 questions directly.

### For Implementation
Follow **IMPLEMENTATION_GUIDE.md** - it has step-by-step code changes needed.

### For Architecture Review
Study **ARCHITECTURE_DIAGRAM.md** - it shows data flows visually.

### For Deep Technical Dive
Reference **VECTOR_STORE_ANALYSIS.md** - it covers every detail with line numbers.

---

## File Locations in Codebase

```
/Users/sahil/Desktop/capstone/
├── src/
│   ├── app/api/
│   │   ├── search/route.ts                 ← Main search endpoint
│   │   ├── search-similar/route.ts         ← Similarity search
│   │   └── embed-image/route.ts            ← Image embedding endpoint
│   └── lib/
│       ├── serpapi.ts                      ← Property interface
│       ├── imageScraper.ts                 ← Image extraction
│       ├── imageEmbeddings.ts              ← Embedding generation
│       ├── embeddingCache.ts               ← Cache management
│       ├── vectorStore.ts                  ← Vector store operations
│       └── agentic/vectorDb.ts             ← Pinecone adapter
├── public/
│   └── vector-store.json                   ← Vector storage file
├── QUICK_SUMMARY.txt                       ← THIS analysis (summary)
├── VECTOR_STORE_ANALYSIS.md                ← Detailed analysis
├── ARCHITECTURE_DIAGRAM.md                 ← Visual diagrams
└── IMPLEMENTATION_GUIDE.md                 ← Implementation steps
```

---

## Contact & Questions

All analysis documents are self-contained and reference specific file paths and line numbers for easy navigation.

**Last Updated:** 2024
**Analysis Scope:** Complete property search + vector store integration
**Codebase Location:** /Users/sahil/Desktop/capstone

