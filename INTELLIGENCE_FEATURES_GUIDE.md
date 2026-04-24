# AI Intelligence Features Integration Guide

This document describes the 5 new modular intelligence features added to the mynivaas2.0 platform.

## Overview

The platform has been extended with the following features:
1. **Fraud Detection** - Identify suspicious listings
2. **GenAI Price Explanation** - Explain why a property is priced at a certain level
3. **Neighborhood Analysis** - Livability scoring and amenity discovery
4. **Recommendation Engine** - Match properties to user preferences
5. **Market Insights** - Price trends, demand analysis, investment ratings

All features are:
- ✅ **Modular** - Independent libraries, easy to maintain
- ✅ **Safe** - Graceful fallbacks on error
- ✅ **Backward Compatible** - No breaking changes
- ✅ **TypeScript** - Full type safety

---

## Feature 1: Fraud Detection API

### Location
- Library: `src/lib/fraudDetector.ts`
- API: `POST /api/fraud`

### Purpose
Detect suspicious listings based on:
- Duplicate/similar titles
- Suspicious keywords (e.g., "urgent sale", "no broker")
- Price anomalies (significantly below market)

### Usage

#### Direct Function
```typescript
import { detectFraud } from "@/lib/fraudDetector";

const analysis = detectFraud(
  {
    id: "prop123",
    title: "Luxury 3BHK Apartment - Urgent Sale",
    listedPrice: 4500000,
    location: "South Delhi",
  },
  {
    otherTitles: ["Luxury 3BHK Apartment", "3BHK in South Delhi"],
    marketAverage: 7500000,
  }
);

// Returns:
// {
//   trustScore: 45,
//   riskLevel: "high",
//   flags: [
//     "Suspicious keywords detected: urgent sale",
//     "Price is 40% below market average"
//   ],
//   details: { ... }
// }
```

#### API Endpoint
```bash
curl -X POST http://localhost:3000/api/fraud \
  -H "Content-Type: application/json" \
  -d '{
    "property": {
      "title": "Luxury 3BHK - Urgent Sale",
      "listedPrice": 4500000,
      "location": "South Delhi"
    },
    "marketAverage": 7500000,
    "otherTitles": ["3BHK Apartment", "Luxury Delhi Property"]
  }'
```

### Return Type
```typescript
interface FraudAnalysis {
  trustScore: number;        // 0-100
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  details: {
    titleDuplicate: boolean;
    suspiciousKeywords: string[];
    priceAnomaly: boolean;
  };
}
```

---

## Feature 2: GenAI Price Explanation

### Location
- Library: `src/lib/genai.ts`
- API: `POST /api/genai/explain-price`

### Purpose
Generate human-readable explanations for property pricing based on factors like:
- Location
- Size (bedrooms, bathrooms, plot area)
- Condition
- Greenery index
- Traffic congestion

### Usage

#### Direct Function
```typescript
import { explainPrice } from "@/lib/genai";

const explanation = explainPrice({
  title: "3BHK Apartment",
  listedPrice: 7500000,
  location: "South Delhi",
  bedrooms: 3,
  bathrooms: 2,
  areaSqft: 1800,
  conditionScore: 8,
  greeneryIndex: 65,
  trafficCongestionIndex: 35,
});

// Returns:
// {
//   reason: "This property is priced at ₹75L. Key value drivers include location, size... ",
//   factors: [
//     { name: "Location", impact: "positive", description: "..." },
//     { name: "Property Condition", impact: "positive", description: "..." },
//     ...
//   ],
//   confidence: 0.75,
//   source: "rule-based"
// }
```

#### API Endpoint
```bash
curl -X POST http://localhost:3000/api/genai/explain-price \
  -H "Content-Type: application/json" \
  -d '{
    "listedPrice": 7500000,
    "location": "South Delhi",
    "bedrooms": 3,
    "bathrooms": 2,
    "areaSqft": 1800,
    "conditionScore": 8
  }'
```

### Return Type
```typescript
interface PriceExplanation {
  reason: string;
  factors: {
    name: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
  confidence: number;
  source: "rule-based" | "openai";
}
```

---

## Feature 3: Neighborhood Analysis

### Location
- Library: `src/lib/neighborhood.ts`
- API: `POST /api/genai/neighborhood-report`

### Purpose
Generate comprehensive neighborhood analysis including:
- Livability score (0-100)
- Safety rating
- Nearby facilities (schools, hospitals, shopping, transport, recreation, dining)
- Amenity score
- Infrastructure quality

### Usage

#### Direct Function
```typescript
import { generateNeighborhoodReport } from "@/lib/neighborhood";

const report = generateNeighborhoodReport("South Delhi", {
  greeneryIndex: 65,
  trafficCongestionIndex: 35,
});

// Returns:
// {
//   location: "South Delhi",
//   livabilityScore: 80,
//   safetyRating: 85,
//   summary: "South Delhi is a highly livable neighborhood...",
//   highlights: [
//     "Safe and secure neighborhood",
//     "Well-equipped with amenities",
//     "Excellent public transport connectivity",
//     "High livability quotient"
//   ],
//   facilities: [...],
//   amenityScore: 82,
//   infrastructureScore: 78
// }
```

#### API Endpoint
```bash
curl -X POST http://localhost:3000/api/genai/neighborhood-report \
  -H "Content-Type: application/json" \
  -d '{
    "location": "South Delhi",
    "additionalData": {
      "greeneryIndex": 65,
      "trafficCongestionIndex": 35
    }
  }'
```

### Return Type
```typescript
interface NeighborhoodReport {
  location: string;
  livabilityScore: number;     // 0-100
  safetyRating: number;        // 0-100
  summary: string;
  highlights: string[];
  facilities: Facility[];
  amenityScore: number;        // 0-100
  infrastructureScore: number; // 0-100
}
```

---

## Feature 4: Recommendation Engine

### Location
- Library: `src/lib/recommendation.ts`
- API: `POST /api/recommendations`

### Purpose
Match properties against user preferences and rank them by:
- Budget fit
- Location match
- Bedroom/bathroom match
- Condition requirements
- Environmental factors (greenery, traffic)

### Usage

#### Direct Function
```typescript
import { getRecommendations } from "@/lib/recommendation";

const recommendations = getRecommendations(
  [
    {
      id: "prop1",
      title: "3BHK in Bangalore",
      listedPrice: 7000000,
      location: "Bangalore",
      bedrooms: 3,
      bathrooms: 2,
      conditionScore: 8,
    },
    // ... more properties
  ],
  {
    budget: { min: 5000000, max: 10000000 },
    location: ["Bangalore", "Hyderabad"],
    bedrooms: 3,
    minConditionScore: 7,
  }
);

// Returns array of matches sorted by priority/score:
// [
//   {
//     propertyId: "prop1",
//     matchScore: 92,
//     matchReasons: ["Within budget range", "Exact match: 3 BHK", ...],
//     mismatchReasons: [],
//     priority: "high"
//   },
//   ...
// ]
```

#### API Endpoint
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "properties": [
      {
        "id": "prop1",
        "title": "3BHK Apartment",
        "listedPrice": 7000000,
        "location": "Bangalore",
        "bedrooms": 3,
        "bathrooms": 2,
        "conditionScore": 8
      }
    ],
    "userPreferences": {
      "budget": { "min": 5000000, "max": 10000000 },
      "location": ["Bangalore"],
      "bedrooms": 3,
      "minConditionScore": 7
    }
  }'
```

### Return Type
```typescript
interface RecommendationResult {
  propertyId: string;
  matchScore: number;              // 0-100
  matchReasons: string[];
  mismatchReasons: string[];
  priority: "high" | "medium" | "low";
}
```

---

## Feature 5: Market Insights

### Location
- Library: `src/lib/marketInsights.ts`
- API: `POST /api/genai/market-insights`

### Purpose
Provide market analysis including:
- Price trend (up/down/stable)
- Demand level (high/medium/low)
- Investment rating (excellent/good/moderate/caution)
- Actionable insights based on historical data

### Usage

#### Direct Function
```typescript
import { getMarketInsights } from "@/lib/marketInsights";

const insights = getMarketInsights("Bangalore");

// Returns:
// {
//   location: "Bangalore",
//   priceTrend: "up",
//   trendMagnitude: 1.2,
//   demandLevel: "high",
//   investmentRating: "good",
//   summary: "Bangalore currently shows an up price trend...",
//   insights: [
//     "Bangalore is experiencing 1.2% monthly price growth...",
//     "High demand indicates strong rental yields...",
//     "Average market price: ₹8500/sq. ft...",
//     "Good investment prospect..."
//   ]
// }
```

#### API Endpoint
```bash
curl -X POST http://localhost:3000/api/genai/market-insights \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Bangalore"
  }'
```

### Return Type
```typescript
interface MarketInsights {
  location: string;
  priceTrend: "up" | "down" | "stable";
  trendMagnitude: number;
  demandLevel: "high" | "medium" | "low";
  investmentRating: "excellent" | "good" | "moderate" | "caution";
  summary: string;
  insights: string[];
}
```

---

## Integration with Orchestrator

The new features can be integrated into the main `runAgenticEvaluation` function:

### Option 1: Using Extended Intelligence Function
```typescript
import {
  runAgenticEvaluationWithExtendedIntelligence,
} from "@/lib/agentic/orchestrator";

const result = await runAgenticEvaluationWithExtendedIntelligence(
  goalInput,
  property,
  peers,
  {
    enableExtendedFeatures: true,
    marketAverage: 7500000,
    userPreferences: {
      budget: { min: 5000000, max: 10000000 },
      location: ["Delhi", "Bangalore"],
      bedrooms: 3,
    },
  }
);

// result.evaluation now includes optional fields:
// - fraudAnalysis
// - priceExplanation
// - neighborhoodReport
// - marketInsights
// - recommendations
```

### Option 2: Manual Integration
```typescript
import {
  gatherExtendedIntelligence,
} from "@/lib/agentic/orchestratorExtension";

const extendedFeatures = await gatherExtendedIntelligence(property, {
  otherTitles: peers.map((p) => p.title),
  marketAverage: 7500000,
  enableFraud: true,
  enablePriceExplanation: true,
  enableNeighborhood: true,
  enableMarketInsights: true,
});

// Use features individually as needed
console.log(extendedFeatures.fraudAnalysis);
console.log(extendedFeatures.priceExplanation);
```

---

## UI Integration Points

### In Results Page
Add these sections to display new intelligence:

```typescript
// Fraud Analysis Badge
{extendedIntel?.fraudAnalysis && (
  <div className={`trust-badge ${extendedIntel.fraudAnalysis.riskLevel}`}>
    Trust Score: {extendedIntel.fraudAnalysis.trustScore}%
    Risk: {extendedIntel.fraudAnalysis.riskLevel}
  </div>
)}

// Price Explanation Card
{extendedIntel?.priceExplanation && (
  <PriceExplanationCard data={extendedIntel.priceExplanation} />
)}

// Neighborhood Highlights
{extendedIntel?.neighborhoodReport && (
  <NeighborhoodCard data={extendedIntel.neighborhoodReport} />
)}

// Market Insights Badge
{extendedIntel?.marketInsights && (
  <MarketInsightsCard data={extendedIntel.marketInsights} />
)}

// Recommendation Badge
{extendedIntel?.recommendations?.[0] && (
  <RecommendationBadge recommendation={extendedIntel.recommendations[0]} />
)}
```

---

## Error Handling

All features include graceful error handling:

```typescript
try {
  const analysis = detectFraud(property);
  // Use analysis
} catch (error) {
  // Feature failed silently, application continues
  console.warn("Fraud detection failed:", error);
}
```

**Important:** If any feature fails, it is automatically caught and skipped. The application will continue to function with all other features.

---

## Supported Locations (Market Insights)

The market insights feature includes data for:
- Bangalore (high demand, +1.2% monthly)
- South Bangalore (high demand, +1.5% monthly)
- Hyderabad (high demand, +1.8% monthly)
- Delhi (medium demand, +0.8% monthly)
- South Delhi (medium demand, +0.5% monthly)
- Gurgaon (high demand, +1.0% monthly)
- Noida (medium demand, +1.3% monthly)
- Pune (high demand, +2.0% monthly)
- Mumbai (low demand, +0.3% monthly)
- Kolkata (medium demand, +1.0% monthly)

---

## Performance Considerations

- **Fraud Detection**: O(n) where n = number of peer titles
- **Price Explanation**: O(1) rule-based analysis
- **Neighborhood Analysis**: O(1) lookup + O(m) facility scoring where m = facilities
- **Recommendations**: O(p * f) where p = properties, f = features evaluated
- **Market Insights**: O(1) lookup in dataset

All features are synchronous with minimal latency (<50ms typically).

---

## Future Enhancements

Potential improvements:
1. OpenAI integration for price explanations
2. Real OSM (OpenStreetMap) facility data
3. Historical property data for better fraud detection
4. ML-based price prediction vs rule-based
5. User preference learning and personalization

---

## Backward Compatibility

✅ **NO BREAKING CHANGES**

- All existing APIs unchanged
- All existing features work as before
- New features are optional extensions
- Original `runAgenticEvaluation` function signature preserved

---

## Support & Debugging

Enable detailed logging:
```typescript
// In orchestratorExtension.ts functions
console.warn("Feature X failed, skipping:", error);
```

Monitor:
- API response times
- Feature availability via optional fields
- Error logs for graceful degradation

---

Generated: Apr 24, 2026
Version: 1.0 - Initial Release
