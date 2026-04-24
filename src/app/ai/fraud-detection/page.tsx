"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FraudResult {
  title: string;
  trustScore: number;
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  details: {
    titleDuplicate: boolean;
    suspiciousKeywords: string[];
    priceAnomaly: boolean;
  };
}

export default function FraudDetectionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          listedPrice: parseInt(price),
          marketAverage: parseInt(price) * 1.5,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to analyze");
      }
    } catch (err) {
      setError("Error analyzing fraud risk");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-50 border-green-300 text-green-900";
      case "medium":
        return "bg-yellow-50 border-yellow-300 text-yellow-900";
      case "high":
        return "bg-red-50 border-red-300 text-red-900";
      default:
        return "bg-gray-50 border-gray-300 text-gray-900";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text mb-2">
              🛡️ Fraud Detection
            </h1>
            <p className="text-text-muted">
              Analyze property listings for suspicious indicators and potential fraud.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Form */}
            <div className="bg-white rounded-lg border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">Analyze Property</h2>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Property Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., URGENT SALE - Luxury Apartment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Property description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Listed Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 5000000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Analyzing..." : "🔍 Analyze Listing"}
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
                <div className={`border rounded-lg p-6 ${getRiskColor(result.riskLevel)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Analysis Result</h3>
                    <span className="text-3xl font-bold">{result.trustScore}/100</span>
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          result.trustScore >= 80
                            ? "bg-green-500"
                            : result.trustScore >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${result.trustScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold mb-2">Risk Level:</p>
                    <p className="text-lg font-bold">
                      {result.riskLevel.toUpperCase()}
                    </p>
                  </div>

                  {result.flags.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2">Warning Flags:</p>
                      <ul className="space-y-1">
                        {result.flags.map((flag, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.flags.length === 0 && (
                    <p className="text-green-700">✅ No fraud indicators detected</p>
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
