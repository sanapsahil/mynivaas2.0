"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const propertyTypes = [
  { value: "apartment", label: "Apartment / Flat" },
  { value: "house", label: "House / Villa" },
  { value: "studio", label: "Studio" },
  { value: "commercial", label: "Commercial" },
  { value: "plot", label: "Plot / Land" },
];

const bhkOptions = [
  { value: "any", label: "Any BHK" },
  { value: "1", label: "1 BHK" },
  { value: "2", label: "2 BHK" },
  { value: "3", label: "3 BHK" },
  { value: "4", label: "4 BHK" },
  { value: "5", label: "5+ BHK" },
];

const listingTypes = [
  { value: "buy", label: "Buy", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { value: "rent", label: "Rent", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { value: "pg", label: "PG", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
];

interface SearchFormProps {
  initialLocation?: string;
  initialPropertyType?: string;
  initialListingType?: string;
  initialBhk?: string;
  compact?: boolean;
}

export default function SearchForm({
  initialLocation = "",
  initialPropertyType = "apartment",
  initialListingType = "rent",
  initialBhk = "any",
  compact = false,
}: SearchFormProps) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [listingType, setListingType] = useState(initialListingType);
  const [bhk, setBhk] = useState(initialBhk);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    const params = new URLSearchParams({
      location: location.trim(),
      propertyType,
      listingType,
      bhk,
    });

    router.push(`/results?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full flex-wrap lg:flex-nowrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] rounded-xl border border-border bg-surface"
          style={{ padding: "10px 16px" }}
        >
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter location..."
            className="bg-transparent outline-none text-sm w-full text-text placeholder:text-text-muted"
          />
        </div>

        <select
          value={bhk}
          onChange={(e) => setBhk(e.target.value)}
          className="rounded-xl border border-border bg-surface text-sm text-text outline-none cursor-pointer"
          style={{ padding: "10px 14px" }}
        >
          {bhkOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>

        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="rounded-xl border border-border bg-surface text-sm text-text outline-none cursor-pointer"
          style={{ padding: "10px 14px" }}
        >
          {propertyTypes.map((pt) => (
            <option key={pt.value} value={pt.value}>{pt.label}</option>
          ))}
        </select>

        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="rounded-xl border border-border bg-surface text-sm text-text outline-none cursor-pointer"
          style={{ padding: "10px 14px" }}
        >
          {listingTypes.map((lt) => (
            <option key={lt.value} value={lt.value}>{lt.label}</option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-colors flex-shrink-0 cursor-pointer"
          style={{ padding: "10px 24px" }}
        >
          Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Listing Type Tabs */}
      <div className="flex justify-center gap-3" style={{ marginBottom: "32px" }}>
        {listingTypes.map((lt) => (
          <button
            key={lt.value}
            type="button"
            onClick={() => setListingType(lt.value)}
            className={`flex items-center gap-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              listingType === lt.value
                ? "bg-primary text-white shadow-lg"
                : "bg-white text-text hover:bg-surface-dark border border-border hover:border-primary/50"
            }`}
            style={{
              padding: "12px 28px",
              boxShadow: listingType === lt.value ? "0 8px 20px rgba(15,118,110,0.3)" : "0 2px 8px rgba(0,0,0,0.04)",
              transform: listingType === lt.value ? "translateY(-2px)" : "none",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={lt.icon} />
            </svg>
            {lt.label}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div
        className="bg-white rounded-2xl border border-border backdrop-blur-sm"
        style={{ 
          padding: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Location Input */}
          <div
            className="flex items-center gap-3 flex-1 bg-surface rounded-xl hover:bg-surface-dark transition-colors focus-within:ring-2 focus-within:ring-primary/20"
            style={{ padding: "14px 18px" }}
          >
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city, neighborhood..."
              className="bg-transparent outline-none w-full text-text placeholder:text-text-muted font-medium"
              style={{ fontSize: "16px" }}
              required
            />
          </div>

          {/* BHK Selector */}
          <div
            className="flex items-center gap-3 bg-surface rounded-xl hover:bg-surface-dark transition-colors focus-within:ring-2 focus-within:ring-primary/20"
            style={{ padding: "14px 18px", minWidth: "150px" }}
          >
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <select
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
              className="bg-transparent outline-none w-full text-text cursor-pointer font-medium"
              style={{ fontSize: "16px" }}
            >
              {bhkOptions.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>

          {/* Property Type */}
          <div
            className="flex items-center gap-3 bg-surface rounded-xl hover:bg-surface-dark transition-colors focus-within:ring-2 focus-within:ring-primary/20"
            style={{ padding: "14px 18px", minWidth: "180px" }}
          >
            <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="bg-transparent outline-none w-full text-text cursor-pointer font-medium"
              style={{ fontSize: "16px" }}
            >
              {propertyTypes.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-1"
            style={{ 
              padding: "14px 32px", 
              fontSize: "16px",
              boxShadow: "0 4px 12px rgba(15,118,110,0.2)",
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Compare Prices
          </button>
        </div>
      </div>
    </form>
  );
}
