"use client";

import { useEffect, useState, useCallback, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import PropertyCard from "@/components/PropertyCard";
import { LoadingGrid } from "@/components/LoadingCard";
import { Property } from "@/lib/serpapi";

const MapView = lazy(() => import("@/components/MapView"));

function ResultsContent() {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";
  const propertyType = searchParams.get("propertyType") || "apartment";
  const listingType = searchParams.get("listingType") || "rent";
  const bhk = searchParams.get("bhk") || "any";

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const listingLabel =
    listingType === "buy" ? "Buy" : listingType === "pg" ? "PG" : "Rent";
  const bhkLabel = bhk !== "any" ? `${bhk} BHK ` : "";

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
      setTotal(data.total);
      if (data.center) setCenter(data.center);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [location, propertyType, listingType, bhk]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />

      {/* Search Bar */}
      <div
        className="bg-white border-b border-border"
        style={{ padding: "16px 24px" }}
      >
        <div className="max-w-7xl mx-auto">
          <SearchForm
            initialLocation={location}
            initialPropertyType={propertyType}
            initialListingType={listingType}
            initialBhk={bhk}
            compact
          />
        </div>
      </div>

      <main className="flex-1" style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>
          {/* Left: Results List */}
          <div
            style={{
              flex: showMap ? "0 0 55%" : "1 1 100%",
              overflowY: "auto",
              padding: "24px",
              transition: "flex 0.3s ease",
            }}
          >
            {/* Results Header */}
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: "20px" }}
            >
              <div>
                <h1 className="font-bold text-text" style={{ fontSize: "22px" }}>
                  {bhkLabel}
                  {listingLabel === "PG"
                    ? "PG Accommodations"
                    : propertyType.charAt(0).toUpperCase() +
                      propertyType.slice(1) + "s"}
                  {" "}for {listingLabel} in{" "}
                  <span className="text-primary">{location}</span>
                </h1>
                {!loading && !error && (
                  <p
                    className="text-text-muted"
                    style={{ fontSize: "13px", marginTop: "4px" }}
                  >
                    {total} {total === 1 ? "listing" : "listings"} found, sorted
                    by price (lowest first)
                  </p>
                )}
              </div>

              <div className="flex items-center" style={{ gap: "12px" }}>
                {!loading && properties.length > 0 && (
                  <div
                    className="hidden sm:flex items-center text-text-muted"
                    style={{ gap: "6px", fontSize: "13px" }}
                  >
                    <svg
                      style={{ width: "14px", height: "14px" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                    Cheapest First
                  </div>
                )}

                {/* Map toggle button */}
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="flex items-center text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "10px",
                    background: showMap ? "rgba(15,118,110,0.08)" : "#f1f5f9",
                    color: showMap ? "#0f766e" : "#64748b",
                    border: showMap ? "1px solid rgba(15,118,110,0.2)" : "1px solid #e2e8f0",
                  }}
                >
                  <svg
                    style={{ width: "16px", height: "16px" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && <LoadingGrid />}

            {/* Error */}
            {error && (
              <div
                className="text-center"
                style={{
                  padding: "48px 32px",
                  borderRadius: "16px",
                  background: "rgba(239,68,68,0.04)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <svg
                  className="text-error mx-auto"
                  style={{ width: "48px", height: "48px", marginBottom: "16px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3
                  className="font-semibold text-text"
                  style={{ fontSize: "18px", marginBottom: "8px" }}
                >
                  Unable to fetch listings
                </h3>
                <p
                  className="text-text-muted"
                  style={{ marginBottom: "16px" }}
                >
                  {error}
                </p>
                <button
                  onClick={fetchProperties}
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors cursor-pointer"
                  style={{ padding: "10px 24px", borderRadius: "12px" }}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && properties.length === 0 && (
              <div
                className="bg-white text-center border border-border"
                style={{ padding: "64px 32px", borderRadius: "16px" }}
              >
                <svg
                  className="mx-auto"
                  style={{
                    width: "64px",
                    height: "64px",
                    marginBottom: "16px",
                    color: "rgba(100,116,139,0.25)",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3
                  className="font-semibold text-text"
                  style={{ fontSize: "18px", marginBottom: "8px" }}
                >
                  No listings found
                </h3>
                <p className="text-text-muted">
                  Try adjusting your search criteria or searching for a different
                  location.
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && !error && properties.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {properties.map((property, index) => (
                  <div
                    key={property.id}
                    onMouseEnter={() => setHoveredId(property.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <PropertyCard
                      property={property}
                      index={index}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Live Data Notice */}
            {!loading && properties.length > 0 && (
              <div className="text-center" style={{ marginTop: "24px", paddingBottom: "24px" }}>
                <p
                  className="text-text-muted flex items-center justify-center"
                  style={{ fontSize: "12px", gap: "6px" }}
                >
                  <span
                    className="bg-success rounded-full animate-pulse"
                    style={{ width: "8px", height: "8px", display: "inline-block" }}
                  />
                  Live listings from real estate platforms. Click any listing to
                  visit the original source.
                </p>
              </div>
            )}
          </div>

          {/* Right: Map */}
          {showMap && (
            <div
              style={{
                flex: "0 0 45%",
                position: "relative",
                borderLeft: "1px solid #e2e8f0",
              }}
            >
              {!loading && properties.length > 0 ? (
                <Suspense
                  fallback={
                    <div
                      className="flex items-center justify-center"
                      style={{ height: "100%", background: "#f1f5f9" }}
                    >
                      <p className="text-text-muted text-sm">Loading map...</p>
                    </div>
                  }
                >
                  <MapView
                    properties={properties}
                    center={center}
                    hoveredId={hoveredId}
                  />
                </Suspense>
              ) : (
                <div
                  className="flex items-center justify-center"
                  style={{ height: "100%", background: "#f8fafc" }}
                >
                  <div className="text-center">
                    <svg
                      className="mx-auto"
                      style={{
                        width: "48px",
                        height: "48px",
                        marginBottom: "12px",
                        color: "rgba(100,116,139,0.2)",
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    <p className="text-text-muted text-sm">
                      {loading ? "Loading listings..." : "Search to see properties on the map"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-center">
            <div
              className="border-primary rounded-full animate-spin mx-auto"
              style={{
                width: "40px",
                height: "40px",
                borderWidth: "3px",
                borderTopColor: "transparent",
                marginBottom: "16px",
              }}
            />
            <p className="text-text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
