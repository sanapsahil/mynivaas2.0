"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PropertyCard from "@/components/PropertyCard";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load results from sessionStorage
    const stored = sessionStorage.getItem("imageSearchResults");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setResults(data.results || []);
        setStats(data.stats || null);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-spin mb-4">⟳</div>
          <p className="text-gray-600 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleNewSearch}
            className="mb-4 text-blue-100 hover:text-white text-sm font-medium flex items-center gap-2"
          >
            ← New Search
          </button>
          <h1 className="text-3xl font-bold">Similar Properties Found</h1>
          <p className="text-blue-100 mt-2">
            Based on your room photo, here are properties with similar aesthetics and style
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
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

        {/* Stats */}
        {stats && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-blue-600">{stats.matchesFound}</div>
              <p className="text-gray-600 text-sm mt-2">Properties Found</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-green-600">
                {Math.round(stats.topSimilarity * 100)}%
              </div>
              <p className="text-gray-600 text-sm mt-2">Best Match</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(stats.avgSimilarity * 100)}%
              </div>
              <p className="text-gray-600 text-sm mt-2">Average Match</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-3xl font-bold text-orange-600">
                {stats.embeddingDimensions}D
              </div>
              <p className="text-gray-600 text-sm mt-2">Embedding Space</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Top Matches ({results.length} results)
            </h2>

            {results.map((result, index) => (
              <div key={result.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                {/* Similarity Badge */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-white">
                      <span className="text-2xl font-bold">#{index + 1}</span>
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-lg">
                        {Math.round(result.similarityPercentage)}% Similar
                      </p>
                      <p className="text-blue-100 text-sm">
                        Similarity Score: {result.similarity.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
                      {result.property.imageUrl ? (
                        <Image
                          src={result.property.imageUrl}
                          alt={result.property.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100px, 150px"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {result.property.title}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-blue-600">
                      {result.property.price}
                    </span>
                    {result.property.bedrooms && (
                      <span className="text-gray-600">
                        {result.property.bedrooms} BHK
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    {result.property.bedrooms && (
                      <div className="text-gray-600">
                        <span className="font-medium">Bedrooms:</span> {result.property.bedrooms}
                      </div>
                    )}
                    {result.property.bathrooms && (
                      <div className="text-gray-600">
                        <span className="font-medium">Bathrooms:</span> {result.property.bathrooms}
                      </div>
                    )}
                    {result.property.area && (
                      <div className="text-gray-600">
                        <span className="font-medium">Area:</span> {result.property.area}
                      </div>
                    )}
                    {result.property.location && (
                      <div className="text-gray-600">
                        <span className="font-medium">Location:</span> {result.property.location}
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {result.property.locationIndices && (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Greenery
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width: `${result.property.locationIndices.greeneryPercentage}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-green-600">
                              {result.property.locationIndices.greeneryPercentage}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Traffic
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500"
                                style={{
                                  width: `${result.property.locationIndices.trafficCongestionPercentage}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold text-red-600">
                              {result.property.locationIndices.trafficCongestionPercentage}%
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {result.property.conditionScore && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                          Condition
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${(result.property.conditionScore / 10) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-blue-600">
                            {result.property.conditionScore.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={result.property.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    View Property →
                  </a>
                </div>
              </div>
            ))}
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
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Try Another Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
