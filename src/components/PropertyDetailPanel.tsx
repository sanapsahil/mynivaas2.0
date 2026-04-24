"use client";

import { useState } from "react";
import { Property } from "@/lib/serpapi";
import IntelligenceFeaturesPanel from "@/components/IntelligenceFeatures/IntelligenceFeaturesPanel";

interface PropertyDetailPanelProps {
  property: Property | null;
  isVisible: boolean;
}

export default function PropertyDetailPanel({
  property,
  isVisible,
}: PropertyDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "insights">("overview");

  if (!isVisible || !property) {
    return null;
  }

  // Parse numeric values from strings
  const bedrooms = property.bedrooms ? parseInt(property.bedrooms) : undefined;
  const bathrooms = property.bathrooms ? parseInt(property.bathrooms) : undefined;
  const areaSqft = property.area ? parseInt(property.area) : undefined;
  const conditionScore = property.conditionScore?.overall;
  const greeneryIndex = property.locationIndices?.greeneryIndex;
  const trafficIndex = property.locationIndices?.trafficCongestionIndex;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{property.title}</h2>
        <p className="text-gray-600 mt-1">{property.location}</p>
      </div>

      {/* Price */}
      <div className="border-t border-b py-4">
        <p className="text-gray-600 text-sm">Listed Price</p>
        <p className="text-3xl font-bold text-blue-600">
          {property.priceFormatted || `₹${property.price.toLocaleString("en-IN")}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "insights"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🤖 AI Insights
        </button>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            {bedrooms && (
              <div>
                <p className="text-gray-600 text-sm">Bedrooms</p>
                <p className="text-2xl font-bold">{bedrooms}</p>
              </div>
            )}
            {bathrooms && (
              <div>
                <p className="text-gray-600 text-sm">Bathrooms</p>
                <p className="text-2xl font-bold">{bathrooms}</p>
              </div>
            )}
            {areaSqft && (
              <div>
                <p className="text-gray-600 text-sm">Area</p>
                <p className="text-2xl font-bold">{areaSqft} sq.ft</p>
              </div>
            )}
            {property.furnishing && (
              <div>
                <p className="text-gray-600 text-sm">Furnishing</p>
                <p className="text-2xl font-bold">{property.furnishing}</p>
              </div>
            )}
          </div>

          {/* Condition Score */}
          {conditionScore && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Property Condition</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Overall Score</span>
                <span className="text-2xl font-bold text-blue-600">
                  {conditionScore}/10
                </span>
              </div>
            </div>
          )}

          {/* Location Indices */}
          {(greeneryIndex !== undefined || trafficIndex !== undefined) && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Location Quality</h3>
              <div className="space-y-2">
                {greeneryIndex !== undefined && (
                  <div className="flex justify-between">
                    <span>Greenery Index</span>
                    <span className="font-semibold">{greeneryIndex}%</span>
                  </div>
                )}
                {trafficIndex !== undefined && (
                  <div className="flex justify-between">
                    <span>Traffic Level</span>
                    <span className="font-semibold">{trafficIndex}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Website Link */}
          {property.link && (
            <a
              href={property.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-center transition-colors"
            >
              View Full Details
            </a>
          )}
        </div>
      )}

      {activeTab === "insights" && (
        <div>
          <IntelligenceFeaturesPanel
            property={{
              id: property.id,
              title: property.title,
              listedPrice: property.price,
              location: property.location,
              description: property.description,
              bedrooms,
              bathrooms,
              areaSqft,
              conditionScore,
              greeneryIndex,
              trafficCongestionIndex: trafficIndex,
            }}
            marketAverage={undefined}
            otherTitles={undefined}
          />
        </div>
      )}
    </div>
  );
}
