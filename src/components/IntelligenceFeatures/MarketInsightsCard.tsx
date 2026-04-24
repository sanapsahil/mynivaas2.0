"use client";

interface MarketInsightsCardProps {
  data: any;
  loading: boolean;
  error?: string | null;
}

export default function MarketInsightsCard({
  data,
  loading,
  error,
}: MarketInsightsCardProps) {
  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <p className="text-yellow-900 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
          <span className="text-gray-600">Analyzing market trends...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "📈";
    if (trend === "down") return "📉";
    return "→";
  };

  const getDemandColor = (demand: string) => {
    if (demand === "high") return "text-red-600";
    if (demand === "medium") return "text-yellow-600";
    return "text-green-600";
  };

  const getInvestmentColor = (rating: string) => {
    if (rating === "strong") return "bg-green-100 text-green-800";
    if (rating === "moderate") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="bg-purple-50 border border-purple-300 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">📊 Market Insights</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Price Trend */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Price Trend</p>
          <div className="text-2xl">
            {getTrendIcon(data.priceTrend || "stable")}{" "}
            <span className="text-lg font-semibold">
              {data.priceTrend
                ? data.priceTrend.charAt(0).toUpperCase() +
                  data.priceTrend.slice(1)
                : "Stable"}
            </span>
          </div>
        </div>

        {/* Demand Level */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <p className="text-sm text-gray-600 mb-1">Demand Level</p>
          <div className={`text-lg font-semibold ${getDemandColor(data.demandLevel || "medium")}`}>
            {data.demandLevel
              ? data.demandLevel.charAt(0).toUpperCase() +
                data.demandLevel.slice(1)
              : "Medium"}
          </div>
        </div>

        {/* Growth Rate */}
        {data.growthRate !== undefined && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">YoY Growth</p>
            <p className="text-lg font-semibold text-blue-600">
              {data.growthRate > 0 ? "+" : ""}
              {data.growthRate.toFixed(1)}%
            </p>
          </div>
        )}

        {/* Investment Rating */}
        {data.investmentRating && (
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Investment Rating</p>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${getInvestmentColor(data.investmentRating)}`}>
              {data.investmentRating.charAt(0).toUpperCase() +
                data.investmentRating.slice(1)}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-sm text-gray-800">{data.summary}</p>
        </div>
      )}
    </div>
  );
}
