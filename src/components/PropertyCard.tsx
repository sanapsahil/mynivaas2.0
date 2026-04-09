import { Property } from "@/lib/serpapi";

interface PropertyCardProps {
  property: Property;
  index: number;
}

// Source brand colors for visual distinction
const SOURCE_COLORS: Record<string, string> = {
  "99acres": "#d63031",
  "MagicBricks": "#e74c3c",
  "Housing.com": "#ff6b35",
  "NoBroker": "#e53935",
  "Makaan": "#8e44ad",
  "Square Yards": "#27ae60",
  "Nestaway": "#f39c12",
  "PropTiger": "#1abc9c",
  "Quikr Homes": "#2c3e50",
};

// Get color based on score (1-10 scale)
function getScoreColor(score: number): string {
  if (score >= 8) return "#0f766e"; // Teal - Excellent
  if (score >= 6) return "#ca8a04"; // Yellow - Good
  return "#dc2626"; // Red - Needs improvement
}

// Get color for location indices (0-100 scale)
// isGreenery: true for greenery (higher is better), false for traffic (lower is better)
function getIndexColor(value: number, isGreenery: boolean): string {
  if (isGreenery) {
    // Greenery: higher is better
    if (value >= 60) return "#22c55e"; // Green - Lots of greenery
    if (value >= 30) return "#ca8a04"; // Yellow - Moderate greenery
    return "#dc2626"; // Red - Low greenery
  } else {
    // Traffic: lower is better
    if (value <= 30) return "#22c55e"; // Green - Low traffic
    if (value <= 60) return "#ca8a04"; // Yellow - Moderate traffic
    return "#dc2626"; // Red - High traffic
  }
}

export default function PropertyCard({ property, index }: PropertyCardProps) {
  const isBestDeal = index === 0;
  const isTopThree = index < 3;
  const sourceColor = SOURCE_COLORS[property.source] || "#64748b";

  return (
    <a
      href={property.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div
        className="bg-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{
          borderRadius: "14px",
          border: isBestDeal ? "2px solid rgba(15,118,110,0.5)" : "1px solid #e2e8f0",
          boxShadow: isBestDeal ? "0 4px 20px rgba(15,118,110,0.12)" : "0 2px 8px rgba(0,0,0,0.04)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
          (e.currentTarget as HTMLDivElement).style.borderColor = sourceColor;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = isBestDeal
            ? "0 4px 20px rgba(15,118,110,0.12)"
            : "0 2px 8px rgba(0,0,0,0.04)";
          (e.currentTarget as HTMLDivElement).style.borderColor = isBestDeal
            ? "rgba(15,118,110,0.5)"
            : "#e2e8f0";
        }}
      >
        {/* Best Deal Banner */}
        {isBestDeal && (
          <div
            className="text-white text-xs font-bold text-center"
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
              letterSpacing: "0.08em",
            }}
          >
            ★ LOWEST PRICE FOUND
          </div>
        )}

        <div style={{ display: "flex", alignItems: "stretch" }}>
          {/* Left: Property Image/Placeholder */}
          <div
            style={{
              width: "160px",
              minHeight: "160px",
              background: property.imageUrl
                ? `url(${property.imageUrl}) center/cover`
                : `linear-gradient(135deg, ${sourceColor}10 0%, ${sourceColor}25 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {!property.imageUrl && (
              <svg
                style={{ width: "48px", height: "48px", opacity: 0.25 }}
                fill={sourceColor}
                viewBox="0 0 24 24"
              >
                <path d="M19 9.3V4h-3v2.6L12 3 2 12h3v8h5v-6h4v6h5v-8h3l-3-2.7zm-9 .7c0-1.1.9-2 2-2s2 .9 2 2h-4z" />
              </svg>
            )}
            {/* Rank badge for top 3 - Trivago style */}
            {isTopThree && (
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: index === 0 ? "#0f766e" : index === 1 ? "#475569" : "#94a3b8",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                #{index + 1}
              </div>
            )}
          </div>

          {/* Middle: Property Details */}
          <div style={{ flex: 1, padding: "18px 22px", minWidth: 0 }}>
            {/* Title */}
            <h3
              className="font-semibold text-text group-hover:text-primary transition-colors"
              style={{
                fontSize: "17px",
                lineHeight: "1.35",
                marginBottom: "8px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {property.title}
            </h3>

            {/* Location */}
            <div
              className="flex items-center text-text-muted"
              style={{ gap: "5px", fontSize: "13px", marginBottom: "12px" }}
            >
              <svg
                className="flex-shrink-0"
                style={{ width: "14px", height: "14px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{property.address || property.location}</span>
            </div>

            {/* Property Tags - Trivago style chips */}
            <div className="flex items-center flex-wrap" style={{ gap: "8px" }}>
              {property.bedrooms && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    color: "#334155",
                  }}
                >
                  {property.bedrooms}
                </span>
              )}
              {property.bathrooms && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  {property.bathrooms}
                </span>
              )}
              {property.area && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: "#f1f5f9",
                    color: "#475569",
                  }}
                >
                  {property.area}
                </span>
              )}
              {property.furnishing && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    background: property.furnishing.toLowerCase().includes("furnished") && !property.furnishing.toLowerCase().includes("un")
                      ? "#dcfce7"
                      : "#fef3c7",
                    color: property.furnishing.toLowerCase().includes("furnished") && !property.furnishing.toLowerCase().includes("un")
                      ? "#166534"
                      : "#92400e",
                  }}
                >
                  {property.furnishing}
                </span>
              )}
            </div>

            {/* CNN Condition Score - AI-powered analysis */}
            {property.conditionScore && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(15,118,110,0.05) 0%, rgba(20,184,166,0.05) 100%)",
                  border: "1px solid rgba(15,118,110,0.15)",
                }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: "6px", marginBottom: "8px" }}
                >
                  <svg
                    style={{ width: "14px", height: "14px" }}
                    fill="#0f766e"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#0f766e",
                      letterSpacing: "0.03em",
                    }}
                  >
                    AI CONDITION SCORE
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: getScoreColor(property.conditionScore.modernity),
                      }}
                    >
                      {property.conditionScore.modernity}/10
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                      Modernity
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: getScoreColor(property.conditionScore.wearAndTear),
                      }}
                    >
                      {property.conditionScore.wearAndTear}/10
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                      Condition
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: getScoreColor(property.conditionScore.lighting),
                      }}
                    >
                      {property.conditionScore.lighting}/10
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>
                      Lighting
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Satellite Location Analysis - ViT-powered */}
            {property.locationIndices && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(20,184,166,0.05) 100%)",
                  border: "1px solid rgba(34,197,94,0.15)",
                }}
              >
                <div
                  className="flex items-center"
                  style={{ gap: "6px", marginBottom: "8px" }}
                >
                  <svg
                    style={{ width: "14px", height: "14px" }}
                    fill="#22c55e"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#22c55e",
                      letterSpacing: "0.03em",
                    }}
                  >
                    SATELLITE ANALYSIS
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div className="flex items-center" style={{ gap: "4px", marginBottom: "4px" }}>
                      <svg
                        style={{ width: "12px", height: "12px" }}
                        fill="#22c55e"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.07-.02C8.24 17.58 9.7 14.45 17 12l-2.41-2.41L21 11l-1.41-7-7 1.41L17 8z" />
                      </svg>
                      <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                        Greenery
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: getIndexColor(property.locationIndices.greeneryIndex, true),
                      }}
                    >
                      {property.locationIndices.greeneryIndex}%
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center" style={{ gap: "4px", marginBottom: "4px" }}>
                      <svg
                        style={{ width: "12px", height: "12px" }}
                        fill="#dc2626"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                      </svg>
                      <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>
                        Traffic
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: getIndexColor(property.locationIndices.trafficCongestionIndex, false),
                      }}
                    >
                      {property.locationIndices.trafficCongestionIndex}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description preview */}
            {property.description && (
              <p
                className="text-text-muted"
                style={{
                  fontSize: "12px",
                  marginTop: "10px",
                  lineHeight: "1.5",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {property.description}
              </p>
            )}
          </div>

          {/* Right: Price & CTA - Trivago style */}
          <div
            style={{
              width: "180px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "center",
              borderLeft: "1px solid #f1f5f9",
              flexShrink: 0,
              background: isBestDeal ? "rgba(15,118,110,0.02)" : "transparent",
            }}
          >
            {/* Source Badge - Trivago style */}
            <div className="flex items-center" style={{ gap: "6px", marginBottom: "10px" }}>
              {property.sourceIcon && (
                <img
                  src={property.sourceIcon}
                  alt={property.source}
                  className="rounded"
                  style={{ width: "16px", height: "16px" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "4px",
                  background: `${sourceColor}12`,
                  color: sourceColor,
                  letterSpacing: "0.02em",
                }}
              >
                {property.source}
              </span>
            </div>

            {/* Price - Large & prominent like Trivago */}
            {property.isAggregated && (
              <div
                className="text-text-muted"
                style={{ fontSize: "10px", marginBottom: "2px", fontWeight: 500 }}
              >
                Prices from
              </div>
            )}
            <div
              className={isBestDeal ? "text-primary" : "text-text"}
              style={{
                fontSize: "26px",
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: "4px",
              }}
            >
              {property.priceFormatted}
            </div>
            <div
              className="text-text-muted"
              style={{ fontSize: "11px", marginBottom: "14px" }}
            >
              {property.type === "rent" || property.type === "pg" ? "per month" : "onwards"}
            </div>

            {/* CTA Button - Trivago style */}
            <div
              className="text-white font-semibold text-center transition-all group-hover:scale-105"
              style={{
                fontSize: "13px",
                padding: "10px 20px",
                borderRadius: "8px",
                background: isBestDeal
                  ? "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)"
                  : sourceColor,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              View Deal →
            </div>

            {/* Posted date */}
            {property.postedDate && (
              <span className="text-text-muted" style={{ fontSize: "10px", marginTop: "8px" }}>
                {property.postedDate}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
