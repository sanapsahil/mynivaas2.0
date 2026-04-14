# Architecture Diagram: Property Search & Vector Store

## Current Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ GET /api/search                                                 │
│ ?location=Bangalore&propertyType=apartment&listingType=rent    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │ SerpAPI   │─── Google Search Results
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
    ┌───▼────┐    ┌──────▼──────┐   ┌────▼────┐
    │ Geocode │    │ Location     │   │ Image   │
    │         │    │ Analysis     │   │ Scoring │
    └───┬────┘    └──────┬──────┘   └────┬────┘
        │                │               │
        │           ┌─────▼─────┐        │
        │           │Satellite  │        │
        │           │Imagery    │        │
        │           └─────┬─────┘        │
        │                 │               │
        │           ┌─────▼──────┐       │
        │           │Scrape 3    │◄──────┘
        │           │Images from │
        │           │Listing URL │
        │           └─────┬──────┘
        │                 │
        │           ┌─────▼──────┐
        │           │Download &  │
        │           │Score with  │
        │           │CNN         │
        │           └─────┬──────┘
        │                 │
        │          property.imageUrl = first URL only
        │                 │
        │          ┌──────▼───────────────────┐
        └─────────►│ Property[] with:         │
                   │ ├─ id, title, price      │
                   │ ├─ location, bedrooms    │
                   │ ├─ imageUrl (SINGLE)     │
                   │ ├─ conditionScore        │
                   │ ├─ locationIndices       │
                   │ └─ agenticEvaluation     │
                   └────────┬─────────────────┘
                            │
                            ▼
                   Response to Client
                   
                   ❌ PROBLEM: No embeddings stored!
                   ❌ Only first image captured!
```

---

## Vector Store Schema

```
┌──────────────────────────────────────────────────────┐
│  /public/vector-store.json                          │
│                                                      │
│  VectorStoreIndex {                                 │
│    version: "1.0"                                   │
│    recordCount: 4250                                │
│    lastUpdated: 1704067200000                       │
│    records: [                                       │
│      {                                              │
│        id: "prop-1704067200-abc123"                 │
│        embedding: [0.123, -0.456, ...(512 total)]  │
│        propertyData: {                              │
│          title: "2 BHK Apartment in Koramangala"   │
│          price: "₹45 Lac"                          │
│          link: "https://..."                       │
│          imageUrl: "https://..."  ◄─ LINK          │
│          bedrooms: "2 BHK"                         │
│          bathrooms: "2 Bath"                       │
│          area: "1100 sq. ft"                       │
│          location: "Koramangala, Bangalore"        │
│          source: "Housing.com"                     │
│          conditionScore: 8.2                       │
│          locationIndices: {                        │
│            greeneryPercentage: 45,                 │
│            trafficCongestionPercentage: 62         │
│          }                                         │
│        }                                           │
│        timestamp: 1704067200000                    │
│      },                                            │
│      { ... more records ... }                      │
│    ]                                               │
│  }                                                 │
└──────────────────────────────────────────────────────┘
```

---

## Image Embedding Pipeline

```
Input: Image File (any size)
  │
  ▼
┌─────────────────────────────────┐
│ Check Embedding Cache           │
│ (by buffer hash)                │
└──────┬──────────────────────────┘
       │
    Yes│  No
    ┌──┴──────────────────────────┐
    │                             │
┌───▼──────┐           ┌──────────▼─────┐
│Return    │           │Resize to       │
│cached    │           │224x224 (JPEG)  │
└──────────┘           └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │Load CLIP Model  │
                       │(retry 3x)       │
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │Extract RGB      │
                       │pixel data       │
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │Pipeline         │
                       │inference        │
                       └────────┬────────┘
                                │
                    ┌───────────▼───────────┐
                    │512-dim vector         │
                    └───────────┬───────────┘
                                │
                       ┌────────▼────────┐
                       │L2 Normalize     │
                       │(cosine ready)   │
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │Cache result     │
                       └────────┬────────┘
                                │
                    Output: Float32Array(512)
```

---

## Search-Similar Endpoint Flow

```
POST /api/search-similar
FormData: { image: File, ?topK=30, ?threshold=0.45 }
  │
  ▼
┌──────────────────────────┐
│ Validate file            │
│ (type, size <10MB)       │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Convert to Buffer        │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│ generateImageEmbedding() │
│ → 512-dim vector         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ searchSimilarEmbeddings(          │
│   queryEmbedding,                │
│   topK=30,                       │
│   threshold=0.45                 │
│ )                                │
└──────┬───────────────────────────┘
       │
       ├─ Load vector store
       ├─ For each record:
       │  calculate cosine_similarity(query, record.embedding)
       ├─ Filter: keep if similarity >= 0.45
       ├─ Sort: descending by similarity
       └─ Return: top 30
       │
       ▼
┌──────────────────────────────┐
│ Response:                    │
│ {                            │
│   results: [{                │
│     id: "prop-123",          │
│     similarity: 0.8234,      │
│     property: {...},         │
│     similarityPercentage: 82 │
│   }, ...],                   │
│   stats: {...}               │
│ }                            │
└──────────────────────────────┘
```

---

## Image Scraping for Each Property

```
Property Listing URL
  │
  ▼
┌────────────────────────────────────────────┐
│ scrapePropertyImages(url, maxImages=3)     │
│                                            │
│ Try selectors (in priority order):         │
│ 1. img[class*="property"]                  │
│ 2. img[class*="gallery"]                   │
│ 3. img[alt*="apartment"]                   │
│ 4. div[class*="gallery"] img               │
│ 5. [data-testid*="image"] img              │
│ 6. (fallback) all img (filter logos)       │
└────┬─────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ Array of full Image URLs       │
│ [url1, url2, url3, ...]        │
└────┬───────────────────────────┘
     │
     ▼ For each URL
┌────────────────────────────────┐
│ downloadImage(url)             │
│ (Axios GET, 10s timeout)       │
└────┬───────────────────────────┘
     │
     ├─ Success: Buffer
     └─ Failure: null
     │
     ▼
┌────────────────────────────────┐
│ Filter valid buffers           │
│ (remove nulls)                 │
└────┬───────────────────────────┘
     │
     ▼
┌────────────────────────────────┐
│ scoreBestPropertyImage()        │
│ (CNN condition scoring)         │
└────┬───────────────────────────┘
     │
     ▼ Store in Property
┌────────────────────────────────┐
│ property.imageUrl =            │
│   imageUrls[0]  ◄─ FIRST ONLY  │
│ property.conditionScore = ...  │
└────────────────────────────────┘
```

---

## Data Linking

### Current (Incomplete)
```
Property {
  id: "prop-123"
  imageUrl: "https://image.jpg"  ◄─ SINGLE IMAGE
}

EmbeddingRecord {
  id: "embed-456"
  imageUrl: "https://image.jpg"
  propertyData: { ... }
}

❌ No link between property and embedding
❌ Embeddings not created during search
```

### Proposed
```
Property {
  id: "prop-123"
  imageUrl: "https://image1.jpg"           ◄─ PRIMARY
  imageUrls: [                             ◄─ ALL SCRAPED
    "https://image1.jpg",
    "https://image2.jpg",
    "https://image3.jpg"
  ]
  imageEmbeddingIds: [                     ◄─ LINKS
    "embed-123-0",
    "embed-123-1",
    "embed-123-2"
  ]
}

EmbeddingRecord {
  id: "embed-123-0"
  embedding: [0.123, -0.456, ...]
  propertyData: {
    propertyId: "prop-123"                 ◄─ BACK-LINK
    imageUrl: "https://image1.jpg"
    title: "2 BHK Apartment"
    price: "₹45 Lac"
    ...
  }
  timestamp: 1704067200000
}

✓ Multiple images per property
✓ Each image has embedding
✓ Bidirectional linking
✓ Can retrieve property from embedding
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│ FRONTEND                                                │
│ • Next.js API Routes                                    │
│ • FormData for image upload                             │
└────┬────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────┐
│ SEARCH BACKEND                                          │
│ • SerpAPI (Google search)                               │
│ • Cheerio (HTML parsing)                                │
│ • Axios (HTTP client)                                   │
└────┬────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────┐
│ ENRICHMENT SERVICES                                     │
│ • Satellite API (Google Maps)                           │
│ • CNN (condition scoring)                               │
│ • Agentic evaluation (AI valuation)                      │
└────┬────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────┐
│ IMAGE EMBEDDING                                         │
│ • CLIP-ViT (Xenova/transformers.js)                     │
│ • 512-dim L2-normalized vectors                         │
│ • Embedding cache (file system)                         │
└────┬────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────┐
│ VECTOR STORE                                            │
│ • JSON file storage (/public/vector-store.json)         │
│ • Cosine similarity search                              │
│ • Pinecone adapter (optional)                           │
└────┬────────────────────────────────────────────────────┘
     │
┌────▼────────────────────────────────────────────────────┐
│ SIMILARITY SEARCH                                       │
│ • POST /api/search-similar                              │
│ • Query embedding + threshold-based filtering           │
│ • Top-K results with similarity scores                  │
└─────────────────────────────────────────────────────────┘
```

