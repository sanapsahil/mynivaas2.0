"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface MarketInsightsResult {
  location: string;
  priceTrend: "up" | "down" | "stable";
  demandLevel: "high" | "medium" | "low";
  investmentRating: number;
  summary: string;
  details: {
    avgPrice: number;
    priceChange: string;
    investmentPotential: string;
  };
}

export default function MarketInsightsPage() {
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MarketInsightsResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/genai/market-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to get market insights");
      }
    } catch (err) {
      setError("Error analyzing market");
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "📈 Upward";
      case "down":
        return "📉 Downward";
      default:
        return "➡️ Stable";
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "bg-green-50 border-green-300 text-green-900";
      case "down":
        return "bg-red-50 border-red-300 text-red-900";
      default:
        return "bg-blue-50 border-blue-300 text-blue-900";
    }
  };

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "high":
        return "bg-orange-50 border-orange-300 text-orange-900";
      case "medium":
        return "bg-yellow-50 border-yellow-300 text-yellow-900";
      default:
        return "bg-blue-50 border-blue-300 text-blue-900";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">
              📊 Market Insights
            </h1>
            <p className="text-text-muted">
              Get market trends, demand levels, and investment ratings for any
              location.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-lg border border-border p-6 h-fit">
              <h2 className="text-xl font-semibold mb-4">Analyze Market</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai, Bangalore, Delhi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter city name for market analysis
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Analyzing..." : "🔍 Get Insights"}
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
                  {/* Price Trend */}
                  <div
                    className={`border rounded-lg p-4 ${getTrendColor(result.priceTrend)}`}
                  >
                    <h3 className="font-semibold mb-2">Price Trend</h3>
                    <p className="text-2xl font-bold">
                      {getTrendIcon(result.priceTrend)}
                    </p>
                  </div>

                  {/* Demand Level */}
                  <div
                    className={`border rounded-lg p-4 ${getDemandColor(result.demandLevel)}`}
                  >
                    <h3 className="font-semibold mb-2">Demand Level</h3>
                    <p className="text-lg font-bold capitalize">
                      {result.demandLevel}
                    </p>
                  </div>

                  {/* Investment Rating */}
                  <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Investment Rating</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-purple-600">
                        {result.investmentRating}/10
                      </span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < Math.round(result.investmentRating / 2)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-text leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  {/* Details */}
                  {result.details && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Market Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Average Price</span>
                          <span className="font-semibold">
                            ₹
                            {result.details.avgPrice
                              .toLocaleString("en-IN")
                              .split(".")[0]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Price Change</span>
                          <span className="font-semibold">
                            {result.details.priceChange}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-sm">Investment Potential</span>
                          <span className="font-semibold">
                            {result.details.investmentPotential}
                          </span>
                        </div>
                      </div>
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
