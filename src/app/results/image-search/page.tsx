"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";

const MapView = lazy(() => import("@/components/MapView"));

interface SearchResult {
  id: string;
  similarity: number;
  similarityPercentage: number;
  property: {
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
    lat?: number;
    lng?: number;
  };
}

interface SearchStats {
  matchesFound: number;
  topSimilarity: number;
  avgSimilarity: number;
  embeddingDimensions: number;
}

export default function ImageSearchResults() {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [listingType, setListingType] = useState<string>("rent");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("imageSearchResults");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setResults(data.results || []);
        setStats(data.stats || null);
        setListingType(data.listingType || "rent");
        setError(null);
      } catch (err) {
        setError("Failed to load search results");
        console.error(err);
      }
    } else {
      setError("No search results found. Please search again.");
    }
    setIsLoading(false);
  }, []);

  const handleNewSearch = () => {
    sessionStorage.removeItem("imageSearchResults");
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-spin mb-4">⟳</div>
          <p className="text-gray-600 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", height: "calc(100vh - 70px)" }}>
          {/* Left: Results List */}
          <div
            style={{
              flex: showMap && results.length > 0 ? "0 0 55%" : "1 1 100%",
              overflowY: "auto",
              padding: "24px",
              transition: "flex 0.3s ease",
            }}
          >
            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                <p className="text-red-800 font-medium">❌ {error}</p>
                <button
                  onClick={handleNewSearch}
                  className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Try Another Search
                </button>
              </div>
            )}

            {/* Results Header */}
            {results.length > 0 && (
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: "20px" }}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-bold text-text" style={{ fontSize: "22px" }}>
                      Properties with Similar Aesthetics
                      {" "}<span className="text-primary">by Photo</span>
                    </h1>
                  </div>
                  <p
                    className="text-text-muted"
                    style={{ fontSize: "13px", marginTop: "4px" }}
                  >
                    {stats?.matchesFound || results.length} {(stats?.matchesFound || results.length) === 1 ? "property" : "properties"} found, sorted by similarity
                  </p>
                </div>

                <div className="flex items-center" style={{ gap: "12px" }}>
                  {!isLoading && results.length > 0 && (
                    <div
                      className="hidden sm:flex items-center text-text-muted"
                      style={{ gap: "6px", fontSize: "13px" }}
                    >
                      <svg
                        style={{ width: "14px", height: "14px" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                        />
                      </svg>
                      Highest Match First
                    </div>
                  )}

                  {/* Map toggle button */}
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center text-sm font-medium transition-colors cursor-pointer"
                    style={{
                      gap: "6px",
                      padding: "6px 14px",
                      borderRadius: "10px",
                      background: showMap ? "rgba(15,118,110,0.08)" : "#f1f5f9",
                      color: showMap ? "#0f766e" : "#64748b",
                      border: showMap ? "1px solid rgba(15,118,110,0.2)" : "1px solid #e2e8f0",
                    }}
                  >
                    <svg
                      style={{ width: "16px", height: "16px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    {showMap ? "Hide Map" : "Show Map"}
                  </button>
                </div>
              </div>
            )}

            {/* Results List */}
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => {
                  // Transform image search property data to match PropertyCard format
                  const transformedProperty = {
                    id: result.id,
                    title: result.property.title,
                    price: typeof result.property.price === 'string' 
                      ? parseInt(result.property.price) || 0 
                      : result.property.price,
                    priceFormatted: `₹${result.property.price}`,
                    location: result.property.location,
                    address: result.property.location,
                    type: 'apartment',
                    bedrooms: result.property.bedrooms,
                    bathrooms: result.property.bathrooms,
                    area: result.property.area,
                    furnishing: 'Unknown',
                    source: result.property.source,
                    link: result.property.link,
                    imageUrl: result.property.imageUrl,
                    locationIndices: result.property.locationIndices ? {
                      greeneryIndex: result.property.locationIndices.greeneryPercentage,
                      trafficCongestionIndex: result.property.locationIndices.trafficCongestionPercentage,
                    } : undefined,
                    conditionScore: result.property.conditionScore,
                  };

                  return (
                    <div
                      key={result.id}
                      onMouseEnter={() => setHoveredId(result.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        opacity: hoveredId && hoveredId !== result.id ? 0.6 : 1,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <PropertyCard property={transformedProperty as any} index={index} />

                      {/* Similarity Badge */}
                      {index === 0 && (
                        <div
                          className="bg-teal-600 text-white px-3 py-2 text-center font-semibold text-sm"
                          style={{ marginTop: "-16px", marginLeft: "16px", width: "fit-content" }}
                        >
                          ★ {Math.round(result.similarityPercentage)}% MATCH
                        </div>
                      )}

                      {/* Similarity Info */}
                      <div
                        className="text-xs text-text-muted mt-2 ml-3"
                        style={{ fontSize: "12px" }}
                      >
                        Visual Similarity: {result.similarity.toFixed(4)} ({Math.round(result.similarityPercentage)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No Similar Properties Found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try uploading a different room photo or adjust your search criteria
                </p>
                <button
                  onClick={handleNewSearch}
                  className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition font-medium"
                >
                  Try Another Search
                </button>
              </div>
            )}
          </div>

          {/* Right: Map */}
          {showMap && results.length > 0 && (
            <div
              style={{
                flex: "1 1 45%",
                position: "relative",
              }}
            >
              <Suspense fallback={<div className="w-full h-full bg-gray-200" />}>
                <MapView
                  properties={results.map((r) => r.property) as any}
                  center={null}
                  hoveredId={hoveredId}
                />
              </Suspense>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
