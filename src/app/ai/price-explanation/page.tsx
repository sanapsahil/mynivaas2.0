"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PriceResult {
  reason: string;
  factors: Array<{
    name: string;
    description: string;
    impact: "positive" | "negative" | "neutral";
  }>;
}

export default function PriceExplanationPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/genai/explain-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: parseInt(price),
          location,
          bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
          bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
          areaSqft: area ? parseInt(area) : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to explain price");
      }
    } catch (err) {
      setError("Error analyzing price");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">
              💰 Why This Price?
            </h1>
            <p className="text-text-muted">
              Understand the factors that influence property pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Analyze Price</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Property Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3BHK Apartment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 8500000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bangalore, Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
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
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Area (sq.ft)
                    </label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Analyzing..." : "📊 Explain Price"}
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
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-6 text-text">
                  <h3 className="text-xl font-bold mb-4">Price Analysis</h3>

                  <div className="mb-6 p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-text leading-relaxed">{result.reason}</p>
                  </div>

                  {result.factors.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Key Factors:</h4>
                      <div className="space-y-3">
                        {result.factors.map((factor, i) => {
                          const impactEmoji =
                            factor.impact === "positive"
                              ? "📈"
                              : factor.impact === "negative"
                              ? "📉"
                              : "➡️";
                          const bgColor =
                            factor.impact === "positive"
                              ? "bg-green-100"
                              : factor.impact === "negative"
                              ? "bg-red-100"
                              : "bg-gray-100";

                          return (
                            <div
                              key={i}
                              className={`${bgColor} p-3 rounded-lg border border-gray-300`}
                            >
                              <div className="flex items-start gap-2">
                                <span className="text-xl">{impactEmoji}</span>
                                <div className="flex-1">
                                  <p className="font-semibold">{factor.name}</p>
                                  <p className="text-sm text-gray-700">
                                    {factor.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
