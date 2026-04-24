"use client";

import { useState } from "react";

interface NeighborhoodCardProps {
  data: any;
  loading: boolean;
  error?: string | null;
}

export default function NeighborhoodCard({
  data,
  loading,
  error,
}: NeighborhoodCardProps) {
  const [showFacilities, setShowFacilities] = useState(false);

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
          <span className="text-gray-600">Analyzing neighborhood...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getLivabilityColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">🏘️ Neighborhood Report</h3>

      {/* Livability Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Livability Score</span>
          <span className={`text-2xl font-bold ${getLivabilityColor(data.livabilityScore || 0)}`}>
            {data.livabilityScore || 0}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              (data.livabilityScore || 0) >= 80
                ? "bg-green-500"
                : (data.livabilityScore || 0) >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${data.livabilityScore || 0}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4 pb-4 border-b border-green-200">
          <p className="text-gray-800 text-sm">{data.summary}</p>
        </div>
      )}

      {/* Facilities */}
      {data.facilities && data.facilities.length > 0 && (
        <div>
          <button
            onClick={() => setShowFacilities(!showFacilities)}
            className="text-sm font-semibold text-green-700 hover:text-green-900 mb-3 flex items-center gap-2"
          >
            {showFacilities ? "▼" : "▶"} Nearby Facilities ({data.facilities.length})
          </button>

          {showFacilities && (
            <div className="space-y-2">
              {data.facilities.map((facility: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white p-2 rounded-lg text-sm"
                >
                  <span className="text-green-500">✓</span>
                  <div>
                    <p className="font-medium">{facility.name}</p>
                    {facility.category && (
                      <p className="text-xs text-gray-500">{facility.category}</p>
                    )}
                    {facility.distance && (
                      <p className="text-xs text-gray-500">{facility.distance} away</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
