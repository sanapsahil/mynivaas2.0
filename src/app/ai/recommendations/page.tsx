"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface RecommendedProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  matchScore: number;
  reasons: string[];
}

export default function RecommendationsPage() {
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendedProperty[]>([]);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPreferences: {
            budget: parseInt(budget),
            location,
            bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
            bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.data || []);
        if (!data.data || data.data.length === 0) {
          setError("No matching properties found. Try adjusting criteria.");
        }
      } else {
        setError(data.error || "Failed to get recommendations");
      }
    } catch (err) {
      setError("Error fetching recommendations");
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-700 border-green-300";
    if (score >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-red-100 text-red-700 border-red-300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">
              ⭐ Recommendations
            </h1>
            <p className="text-text-muted">
              Find properties matching your preferences with intelligent scoring.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Preferences</h2>
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 8500000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bedrooms
                </label>
                <input
                  type="number"
                  placeholder="3"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bathrooms
                </label>
                <input
                  type="number"
                  placeholder="2"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Searching..." : "🔍 Search"}
                </button>
              </div>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-900 mb-8">
              {error}
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {results.length > 0 && (
              <h3 className="text-lg font-semibold text-text">
                Found {results.length} matching properties
              </h3>
            )}

            {results.map((property) => (
              <div
                key={property.id}
                className="bg-white rounded-lg border border-gray-300 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Property Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      📍 {property.location}
                    </p>
                    <p className="text-2xl font-bold text-primary mb-2">
                      ₹{(property.price / 1000000).toFixed(2)}Cr
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>🛏️ {property.bedrooms} BHK</span>
                      <span>🚿 {property.bathrooms} Bath</span>
                      <span>📐 {property.areaSqft} sq.ft</span>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex flex-col justify-center">
                    <div
                      className={`p-4 rounded-lg border-2 text-center ${getMatchScoreColor(property.matchScore)}`}
                    >
                      <p className="text-sm font-medium mb-1">Match Score</p>
                      <p className="text-3xl font-bold">
                        {property.matchScore}%
                      </p>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div>
                    <p className="font-semibold mb-2">Why Recommended:</p>
                    <ul className="space-y-1">
                      {property.reasons.map((reason, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && results.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-text-muted">
                Enter your preferences above to see recommendations
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
