# EstateCompare

EstateCompare is an AI-powered real-estate comparison app built with Next.js.
It aggregates listings from multiple property platforms, ranks them by price, and enriches each listing with:

- Property condition scoring (image-based)
- Location quality indices (greenery and traffic from map tiles)
- Visual similarity search from an uploaded room photo

---

## 1) Core Features

### A. Aggregated property search (Buy / Rent / PG)
- Search by location, property type, listing type, and BHK
- Queries multiple real-estate domains via SerpAPI (Google engine)
- Parses listing snippets, normalizes prices, deduplicates URLs
- Filters unrealistic prices and listing-type mismatches
- Sorts final results by lowest price first

### B. Interactive compare view with map
- Result list with ranked cards (best deal highlighted)
- Lazy-loaded map (`leaflet` + `react-leaflet`) with price markers
- Marker hover sync and external-link redirect to source listing
- Toggle to show/hide map panel

### C. AI-based property condition score
- Scrapes candidate images from listing pages
- Downloads and scores images using `sharp`-based computer-vision heuristics
- Computes:
	- Modernity (1–10)
	- Wear & tear (1–10)
	- Lighting (1–10)
	- Overall (1–10)

### D. Satellite location intelligence
- Geocodes search location using OpenStreetMap Nominatim
- Scatters listing markers around center coordinates for visibility
- Fetches:
	- Satellite tile (ESRI World Imagery)
	- Roadmap tile (OpenStreetMap)
- Computes:
	- Greenery index (0–100)
	- Traffic congestion index (0–100)

### E. “Search by room photo”
- Modal-based image upload with drag-and-drop
- Validates image type and max size (10 MB)
- Generates embedding using `@xenova/transformers` (CLIP-based feature extractor)
- Performs vector similarity search against stored property embeddings
- Shows ranked similar properties with similarity metrics and stats

---

## 2) Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 + custom CSS tokens
- **Maps:** Leaflet + React Leaflet
- **Image/vision processing:** `sharp`, `cheerio`, `axios`
- **AI embeddings:** `@xenova/transformers`
- **Search source:** SerpAPI (Google Search API)
- **Data persistence:** JSON-based vector store at `public/vector-store.json`

---

## 3) Project Structure

```text
src/
	app/
		page.tsx                         # Landing page + search + image-search CTA
		results/page.tsx                 # Listing comparison results + map
		results/image-search/page.tsx    # Similar-image search results
		api/
			search/route.ts                # Main aggregated listing pipeline
			analyze-location/route.ts      # Standalone greenery/traffic analysis
			score-property/route.ts        # Standalone property image scoring
			embed-image/route.ts           # Generate embedding for uploaded image
			search-similar/route.ts        # Find similar listings by image embedding

	components/
		SearchForm.tsx
		PropertyCard.tsx
		MapView.tsx
		ImageUploadModal.tsx
		Header.tsx
		Footer.tsx
		LoadingCard.tsx

	lib/
		serpapi.ts                       # Query building, parsing, normalization
		geocode.ts                       # Geocode + marker coordinate scattering
		imageScraper.ts                  # Scrape and download listing images
		imageScoring.ts                  # Condition score computation
		satelliteImagery.ts              # Tile fetching helpers
		satelliteAnalysis.ts             # Greenery / traffic analysis
		imageEmbeddings.ts               # Embedding generation + similarity utils
		embeddingCache.ts                # Local embedding cache (.embedding-cache)
		vectorStore.ts                   # JSON vector store CRUD + similarity search
```

---

## 4) Environment Variables

Create `.env` in project root:

```env
SERPAPI_KEY=your_serpapi_api_key
```

### Required
- `SERPAPI_KEY`: required for `/api/search`.

Without this key, listing search will fail with: `SERPAPI_KEY environment variable not set`.

---

## 5) Setup & Run

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
```

### Development
```bash
npm run dev
```

Open `http://localhost:3000`.

### Production
```bash
npm run build
npm run start
```

### Lint
```bash
npm run lint
```

---

## 6) API Documentation

### `GET /api/search`
Aggregates real-estate listings and enriches them with AI signals.

**Query params**
- `location` (required)
- `propertyType` (default: `apartment`)
- `listingType` (default: `rent`) — `buy | rent | pg`
- `bhk` (default: `any`)
- `strictAgentic` (optional, default: `true`) — when `true`, low-confidence agentic insights are suppressed

**Behavior**
- Searches multiple domains via SerpAPI
- Geocodes location center
- Scatters marker coordinates
- For each property (best-effort with per-property timeout):
	- Image condition scoring
	- Satellite-based location analysis

**Returns**
- `results[]`, `total`, `query`, `center`
- Each result may include `agenticEvaluation` with:
	- `fairValue` (fair price, delta vs listed, feature contributions)
	- `forecast` (12-24 month projected return and points)
	- `fraudRisk` (cluster risk score)
	- `sentiment` (external sentiment signal)
	- `negotiation` (counter-offer suggestion + drafted message)
	- `recommendation` (final actionable summary)
	- `accuracy` (confidence, strict-check pass/fail, failed checks, source-level confidence)
- If strict mode suppresses uncertain insights, result includes:
	- `agenticSuppressedReason`

---

### `GET /api/analyze-location`
Standalone location intelligence endpoint.

**Query params**
- `lat` (required)
- `lng` (required)

**Returns**
- `indices: { greeneryIndex, trafficCongestionIndex }`

---

### `GET /api/score-property`
Standalone property image scoring endpoint.

**Query params**
- `url` (required) — property listing page URL

**Returns**
- `score` object (or `null` if no valid images)
- `imagesAnalyzed`

---

### `POST /api/embed-image`
Generates embedding for uploaded image.

**Body**
- `multipart/form-data`
- `image` file (required)

**Validation**
- Must be `image/*`
- Max size 10 MB

**Returns**
- `embedding`, `dimensions`, `fileName`

---

### `POST /api/search-similar`
Finds visually similar property images from vector store.

**Query params**
- `topK` (default `30`, allowed `1..100`)
- `threshold` (default `0.45`, allowed `0..1`)

**Body**
- `multipart/form-data`
- `image` file (required)

**Returns**
- `results[]` with similarity scores
- `stats` (matchesFound, topSimilarity, avgSimilarity, dimensions)

---

### `GET /api/search-similar`
Vector-store status endpoint.

**Returns**
- `vectorStore: { recordCount, lastUpdated, version }`

---

## 7) Data Flow

1. User submits search from homepage or results bar.
2. Frontend hits `/api/search`.
3. Backend gets listings from SerpAPI and normalizes them.
4. Backend enriches each listing with:
	 - image score (`imageScraper` + `imageScoring`)
	 - location indices (`satelliteImagery` + `satelliteAnalysis`)
5. Frontend renders cards + map markers.
6. User can upload an image for style-based search.
7. `/api/search-similar` computes embedding and runs cosine-similarity retrieval from vector store.

---

## 8) Important Operational Notes

### A. Image-search dependency
Image-based similarity search requires pre-populated embeddings in:

- `public/vector-store.json`

If the file is empty/missing records, the endpoint returns no matches.

### B. Approximate listing pricing
`serpapi.ts` marks results as aggregated (`isAggregated: true`) because prices are parsed from search snippets and may differ from live source pages.

### C. External-source variability
Image scraping and snippet parsing depend on third-party site structure and can partially fail; APIs are designed to degrade gracefully.

### D. Performance safeguards
- `/api/search` max duration: 300s
- `/api/embed-image` and `/api/search-similar` max duration: 120s
- Per-property timeout guards are used for enrichment steps

---

## 9) UX Capabilities Implemented

- Landing page with guided search and “How it works” section
- Buy/Rent/PG tab-based search with BHK + property-type filters
- Results page with:
	- loading, error, empty states
	- ranked cards and “lowest price found” badge
	- map/list split view toggle
- AI detail display per property:
	- condition metrics (modernity, wear-and-tear, lighting)
	- satellite indices (greenery, traffic)
- Upload modal with drag-and-drop photo search
- Image search result dashboard with match quality statistics

---

## 10) Potential Next Improvements

- Add an indexing route/CLI to automatically populate `vector-store.json` from fresh listings
- Persist vector store in a database (instead of JSON file)
- Replace heuristic scoring with trained CV models
- Add caching/rate-limit guards for third-party API and scraping layers
- Add unit/integration tests for parsers and route handlers

---

## 11) Agentic AI Modules Added (Phase 1)

The following previously-missing capabilities are now implemented as backend modules and APIs:

- Multi-agent orchestration (planner + evaluator + report synthesis)
- Dedicated negotiator agent (counter-offer drafting with defect-aware reasoning)
- Trust & safety fraud clustering (graph-style relationship scoring)
- Fair-price valuation with feature contribution explainability
- 12-24 month forecasting (LSTM/GRU surrogate forecasting module)
- Automated virtual staging pipeline hook (Stable Diffusion provider adapter)
- Multimodal RAG retrieval (text + optional image query)
- Production vector-DB adapter layer (Pinecone adapter + pluggable fallback)
- Graph DB sync adapter for Neo4j
- Agentic scraping module (behavioral fetch + optional LLM field extraction)
- External sentiment fusion module (reddit-based signal ingestion)
- Autonomous proactive workflow runner (goal-first planner loop)

---

## 12) New Agentic API Endpoints

### `POST /api/agentic/plan`
Builds a decomposed multi-agent task plan from a user goal.

### `POST /api/agentic/evaluate`
Runs agentic evaluation for a property (valuation, risk, forecast, sentiment, negotiation).

### `GET /api/agentic/scrape?url=...`
Runs agentic scraping with heuristic + optional LLM extraction.

### `GET /api/agentic/sentiment?query=...`
Returns fused external sentiment for locality/developer search terms.

### `POST /api/agentic/stage-room`
Runs virtual staging adapter (uses provider if configured, otherwise simulated response).

### `POST /api/agentic/rag/query`
Runs multimodal retrieval over indexed docs with optional image query.

### `POST /api/agentic/vector/upsert`
Upserts vectors to configured vector database adapter.

### `POST /api/agentic/vector/query`
Queries vectors from configured vector database adapter.

### `POST /api/agentic/graph/sync`
Upserts nodes and relationships to Neo4j via HTTP transactional endpoint.

### `POST /api/agentic/workflow/run`
Runs proactive planner workflow across goals and candidate listings.

---

## 13) Additional Environment Variables (Optional)

```env
# Virtual staging
STABILITY_API_KEY=

# LLM-assisted scraping
OPENAI_API_KEY=

# Vector DB (Pinecone)
VECTOR_DB_PROVIDER=pinecone
PINECONE_API_KEY=
PINECONE_INDEX_URL=

# Graph DB (Neo4j)
NEO4J_HTTP_URL=
NEO4J_USERNAME=
NEO4J_PASSWORD=

# Strict confidence gate for search response insights
AGENTIC_STRICT_MODE=true
```

If these are not set, modules degrade gracefully with safe fallbacks.
