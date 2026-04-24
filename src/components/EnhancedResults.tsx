"use client";

import { useEffect, useState, useCallback } from "react";
import { Property } from "@/lib/serpapi";
import PropertyCard from "@/components/PropertyCard";
import PropertyDetailPanel from "@/components/PropertyDetailPanel";
import { LoadingGrid } from "@/components/LoadingCard";

interface EnhancedResultsProps {
  location: string;
  propertyType: string;
  listingType: string;
  bhk: string;
}

export default function EnhancedResults({
  location,
  propertyType,
  listingType,
  bhk,
}: EnhancedResultsProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showMap, setShowMap] = useState(true);

  const fetchProperties = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        location,
        propertyType,
        listingType,
        bhk,
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch listings");
      }

      setProperties(data.results);
      if (data.results.length > 0) {
        setSelectedProperty(data.results[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [location, propertyType, listingType, bhk]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  if (loading) {
    return <LoadingGrid />;
  }

  return (
    <div style={{ display: "flex", height: "100%", gap: "16px" }}>
      {/* Left Panel: Results List */}
      <div
        style={{
          flex: "0 0 45%",
          overflowY: "auto",
          paddingRight: "16px",
          borderRight: "1px solid #e0e0e0",
        }}
      >
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
            <p className="text-red-900">{error}</p>
            <button
              onClick={fetchProperties}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && properties.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No listings found</p>
          </div>
        )}

        {properties.map((property) => (
          <div
            key={property.id}
            onClick={() => setSelectedProperty(property)}
            className={`mb-3 cursor-pointer rounded-lg border-2 transition-all ${
              selectedProperty?.id === property.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <PropertyCard property={property} index={0} />
          </div>
        ))}
      </div>

      {/* Right Panel: Detail & Insights */}
      <div
        style={{
          flex: "1",
          overflowY: "auto",
          paddingLeft: "16px",
        }}
      >
        <PropertyDetailPanel
          property={selectedProperty}
          isVisible={selectedProperty !== null}
        />
      </div>
    </div>
  );
}
