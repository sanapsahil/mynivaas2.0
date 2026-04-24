"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Facility {
  name: string;
  category: string;
  distance?: string;
}

interface NeighborhoodResult {
  location: string;
  livabilityScore: number;
  safetyRating: number;
  summary: string;
  facilities: Facility[];
}

export default function NeighborhoodPage() {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NeighborhoodResult | null>(null);
  const [error, setError] = useState("");
  const [showFacilities, setShowFacilities] = useState(true);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/genai/neighborhood-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to get neighborhood info");
      }
    } catch (err) {
      setError("Error analyzing neighborhood");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-300";
    if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-300";
    return "text-red-600 bg-red-50 border-red-300";
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">
              🏘️ Neighborhood Report
            </h1>
            <p className="text-text-muted">
              Analyze area livability, safety, and nearby facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-lg border border-border p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">Get Report</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location/Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bangalore, Mumbai, Delhi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter city or specific area name
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Analyzing..." : "🔍 Get Report"}
                </button>
              </form>
            </div>

            {/* Results */}
            <div>
              {error && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-900">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Scores */}
                  <div className={`border rounded-lg p-4 ${getScoreColor(result.livabilityScore)}`}>
                    <h3 className="text-lg font-semibold mb-3">Livability Score</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span>Score</span>
                      <span className="text-3xl font-bold">
                        {result.livabilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          result.livabilityScore >= 80
                            ? "bg-green-500"
                            : result.livabilityScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${result.livabilityScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Safety Rating</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.safetyRating}/100
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-text leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  {/* Facilities */}
                  {result.facilities.length > 0 && (
                    <div className="bg-white border border-gray-300 rounded-lg p-4">
                      <button
                        onClick={() => setShowFacilities(!showFacilities)}
                        className="w-full text-left font-semibold flex items-center justify-between mb-3 hover:text-primary"
                      >
                        <span>
                          📍 Nearby Facilities ({result.facilities.length})
                        </span>
                        <span>{showFacilities ? "▼" : "▶"}</span>
                      </button>

                      {showFacilities && (
                        <div className="space-y-2">
                          {result.facilities.map((facility, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                            >
                              <span className="text-green-500 mt-0.5">✓</span>
                              <div>
                                <p className="font-medium text-sm">
                                  {facility.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {facility.category}
                                  {facility.distance && ` • ${facility.distance}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
