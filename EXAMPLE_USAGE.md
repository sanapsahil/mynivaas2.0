# Example Usage: New Intelligence Features

This file shows practical examples of using the new intelligence features in your application.

## Example 1: Simple Fraud Detection

```typescript
// pages/api/check-property.ts or component
import { detectFraud } from "@/lib/fraudDetector";

export async function checkProperty(propertyData: any) {
  const analysis = detectFraud(
    {
      id: propertyData.id,
      title: propertyData.title,
      listedPrice: propertyData.price,
      location: propertyData.location,
      description: propertyData.description,
    },
    {
      // Optional: compare against other listings
      otherTitles: [
        "2BHK flat in Delhi",
        "2BHK apartment South Delhi"
      ],
      marketAverage: 5000000,
    }
  );

  if (analysis.riskLevel === "high") {
    showWarning(`⚠️ High fraud risk detected: ${analysis.flags.join(", ")}`);
  }

  return analysis;
}
```

## Example 2: Display Price Explanation

```typescript
// components/PropertyCard.tsx
import { explainPrice } from "@/lib/genai";

export function PropertyCard({ property }: any) {
  const explanation = explainPrice({
    listedPrice: property.price,
    location: property.location,
    bedrooms: property.bhk,
    bathrooms: property.bathrooms,
    areaSqft: property.area,
    conditionScore: property.conditionScore,
  });

  return (
    <div className="property-card">
      <h3>{property.title}</h3>
      <p className="price">₹{property.price / 100000}L</p>
      
      {/* Show explanation */}
      <details>
        <summary>Why this price?</summary>
        <p>{explanation.reason}</p>
        <ul>
          {explanation.factors.map((factor) => (
            <li key={factor.name}>
              <strong>{factor.name}</strong> ({factor.impact})
              : {factor.description}
            </li>
          ))}
        </ul>
        <small>Confidence: {(explanation.confidence * 100).toFixed(0)}%</small>
      </details>

      {/* Trust indicator from fraud analysis */}
      <TrustScoreBadge property={property} />
    </div>
  );
}
```

## Example 3: Neighborhood Analysis in Search Results

```typescript
// pages/results.tsx
import { generateNeighborhoodReport } from "@/lib/neighborhood";

export default function ResultsPage({ properties }: any) {
  const [selectedProperty, setSelectedProperty] = useState(properties[0]);
  const neighborhoodReport = generateNeighborhoodReport(
    selectedProperty.location
  );

  return (
    <div className="results-grid">
      <div className="results-list">
        {properties.map((prop) => (
          <PropertyListItem
            key={prop.id}
            property={prop}
            isSelected={prop.id === selectedProperty.id}
            onClick={() => setSelectedProperty(prop)}
          />
        ))}
      </div>

      <div className="details-panel">
        <h2>{selectedProperty.title}</h2>
        
        {/* Neighborhood Card */}
        <NeighborhoodCard report={neighborhoodReport} />

        {/* Market Insights */}
        <MarketInsightsPanel location={selectedProperty.location} />
      </div>
    </div>
  );
}

function NeighborhoodCard({ report }: any) {
  return (
    <div className="neighborhood-card">
      <h3>Neighborhood Insights</h3>
      
      <div className="scores">
        <ScoreBadge label="Livability" score={report.livabilityScore} />
        <ScoreBadge label="Safety" score={report.safetyRating} />
        <ScoreBadge label="Amenities" score={report.amenityScore} />
      </div>

      <p>{report.summary}</p>

      <div className="highlights">
        <strong>Highlights:</strong>
        <ul>
          {report.highlights.map((h) => <li key={h}>{h}</li>)}
        </ul>
      </div>

      <details>
        <summary>Nearby Facilities</summary>
        <div className="facilities">
          {["schools", "hospitals", "shopping", "transport", "recreation"].map(
            (category) => (
              <div key={category} className="facility-group">
                <h4>{category}</h4>
                {report.facilities
                  .filter((f: any) => f.category === category)
                  .map((f: any) => (
                    <div key={f.name} className="facility">
                      <span className="name">{f.name}</span>
                      <span className="distance">{f.distance}</span>
                    </div>
                  ))}
              </div>
            )
          )}
        </div>
      </details>
    </div>
  );
}
```

## Example 4: Recommendations Based on User Preferences

```typescript
// components/SmartRecommendations.tsx
import { getRecommendations } from "@/lib/recommendation";

interface UserPrefs {
  budget: [number, number];
  locations: string[];
  bedrooms: number;
  minCondition: number;
}

export function SmartRecommendations({
  allProperties,
  userPreferences,
}: {
  allProperties: any[];
  userPreferences: UserPrefs;
}) {
  const recommendations = getRecommendations(
    allProperties.map((p) => ({
      id: p.id,
      title: p.title,
      listedPrice: p.price,
      location: p.location,
      bedrooms: p.bhk,
      bathrooms: p.bathrooms,
      areaSqft: p.area,
      conditionScore: p.conditionScore,
      greeneryIndex: p.greeneryIndex,
      trafficCongestionIndex: p.trafficIndex,
    })),
    {
      budget: {
        min: userPreferences.budget[0],
        max: userPreferences.budget[1],
      },
      location: userPreferences.locations,
      bedrooms: userPreferences.bedrooms,
      minConditionScore: userPreferences.minCondition,
    }
  );

  return (
    <div className="recommendations">
      <h2>🎯 Properties Matched to Your Preferences</h2>

      {recommendations.map((rec) => (
        <div
          key={rec.propertyId}
          className={`recommendation-card ${rec.priority}`}
        >
          <div className="header">
            <span className="match-score">{rec.matchScore}% Match</span>
            <span className={`priority priority-${rec.priority}`}>
              {rec.priority.toUpperCase()}
            </span>
          </div>

          <div className="reasons">
            <h4>Why this matches:</h4>
            <ul>
              {rec.matchReasons.map((reason) => (
                <li key={reason}>✓ {reason}</li>
              ))}
            </ul>
          </div>

          {rec.mismatchReasons.length > 0 && (
            <div className="mismatches">
              <h4>Considerations:</h4>
              <ul>
                {rec.mismatchReasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Example 5: Market Insights Display

```typescript
// components/MarketInsightsPanel.tsx
import { getMarketInsights } from "@/lib/marketInsights";

export function MarketInsightsPanel({ location }: { location: string }) {
  const insights = getMarketInsights(location);

  return (
    <div className="market-insights">
      <h3>📊 Market Analysis</h3>

      <div className="metrics">
        <MetricBox
          label="Price Trend"
          value={`${insights.priceTrend.toUpperCase()} ${
            insights.trendMagnitude > 0 ? "+" : ""
          }${insights.trendMagnitude.toFixed(1)}%`}
          icon={getTrendIcon(insights.priceTrend)}
          color={getTrendColor(insights.priceTrend)}
        />

        <MetricBox
          label="Demand Level"
          value={insights.demandLevel.toUpperCase()}
          icon={getDemandIcon(insights.demandLevel)}
          color={getDemandColor(insights.demandLevel)}
        />

        <MetricBox
          label="Investment Rating"
          value={insights.investmentRating.toUpperCase()}
          icon={getRatingIcon(insights.investmentRating)}
          color={getRatingColor(insights.investmentRating)}
        />
      </div>

      <p className="summary">{insights.summary}</p>

      <div className="insights-list">
        <h4>Key Insights:</h4>
        <ul>
          {insights.insights.map((insight, idx) => (
            <li key={idx}>💡 {insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`metric-box ${color}`}>
      <span className="icon">{icon}</span>
      <div className="content">
        <span className="label">{label}</span>
        <span className="value">{value}</span>
      </div>
    </div>
  );
}
```

## Example 6: Integrated Search Flow

```typescript
// pages/api/search-with-intelligence.ts
import { NextRequest, NextResponse } from "next/server";
import { searchProperties } from "@/lib/serpapi";
import {
  gatherExtendedIntelligence,
} from "@/lib/agentic/orchestratorExtension";

export async function POST(request: NextRequest) {
  const { query, userPreferences } = await request.json();

  // Step 1: Search for properties
  const properties = await searchProperties(query);

  // Step 2: Enrich with intelligence features
  const enrichedProperties = await Promise.all(
    properties.map(async (prop) => ({
      ...prop,
      intelligence: await gatherExtendedIntelligence(prop, {
        enableFraud: true,
        enablePriceExplanation: true,
        enableNeighborhood: true,
        enableMarketInsights: true,
      }),
    }))
  );

  return NextResponse.json({
    properties: enrichedProperties,
    count: enrichedProperties.length,
  });
}
```

## Example 7: TrustScore Indicator Component

```typescript
// components/TrustScoreIndicator.tsx
import { detectFraud } from "@/lib/fraudDetector";

export function TrustScoreIndicator({ property }: any) {
  const [fraud, setFraud] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const analysis = detectFraud({
      id: property.id,
      title: property.title,
      listedPrice: property.price,
      location: property.location,
    });
    setFraud(analysis);
    setLoading(false);
  }, [property]);

  if (loading) return <div className="skeleton"></div>;
  if (!fraud) return null;

  const getColor = (level: string) => {
    switch (level) {
      case "high":
        return "🔴 HIGH RISK";
      case "medium":
        return "🟡 MEDIUM RISK";
      case "low":
        return "🟢 LOW RISK";
      default:
        return "⚪ UNKNOWN";
    }
  };

  return (
    <div className={`trust-indicator ${fraud.riskLevel}`}>
      <div className="score">
        <div className="value">{fraud.trustScore}</div>
        <div className="label">Trust Score</div>
      </div>

      <div className="status">{getColor(fraud.riskLevel)}</div>

      {fraud.flags.length > 0 && (
        <div className="flags">
          {fraud.flags.map((flag) => (
            <div key={flag} className="flag">
              ⚠️ {flag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## CSS Styling Examples

```css
/* Trust Score Badge */
.trust-badge {
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 600;
  display: inline-block;
}

.trust-badge.low {
  background-color: #d4edda;
  color: #155724;
}

.trust-badge.medium {
  background-color: #fff3cd;
  color: #856404;
}

.trust-badge.high {
  background-color: #f8d7da;
  color: #721c24;
}

/* Match Score */
.recommendation-card.high {
  border-left: 4px solid #28a745;
  background-color: #f0f8f5;
}

.recommendation-card.medium {
  border-left: 4px solid #ffc107;
  background-color: #fefef0;
}

.recommendation-card.low {
  border-left: 4px solid #dc3545;
  background-color: #fef5f5;
}

.match-score {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
```

---

## Testing Examples

```typescript
// test/fraud-detection.test.ts
import { detectFraud } from "@/lib/fraudDetector";

describe("Fraud Detection", () => {
  test("should flag duplicate titles", () => {
    const analysis = detectFraud(
      { title: "3BHK Apartment", listedPrice: 5000000, location: "Delhi" },
      { otherTitles: ["3BHK Apartment"] }
    );

    expect(analysis.riskLevel).toBe("high");
    expect(analysis.details.titleDuplicate).toBe(true);
  });

  test("should flag price anomaly", () => {
    const analysis = detectFraud(
      { title: "Property", listedPrice: 3000000, location: "Delhi" },
      { marketAverage: 7500000 }
    );

    expect(analysis.details.priceAnomaly).toBe(true);
    expect(analysis.trustScore).toBeLessThan(80);
  });
});
```

