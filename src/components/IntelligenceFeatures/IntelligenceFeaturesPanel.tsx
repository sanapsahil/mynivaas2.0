"use client";

import { useEffect, useState } from "react";
import FraudDetectionCard from "./FraudDetectionCard";
import PriceExplanationCard from "./PriceExplanationCard";
import NeighborhoodCard from "./NeighborhoodCard";
import MarketInsightsCard from "./MarketInsightsCard";
import RecommendationBadge from "./RecommendationBadge";

export interface PropertyForAnalysis {
  id: string;
  title: string;
  listedPrice: number;
  location: string;
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
}

interface IntelligenceFeaturesPanelProps {
  property: PropertyForAnalysis;
  marketAverage?: number;
  otherTitles?: string[];
}

interface FeatureState {
  fraud: any;
  price: any;
  neighborhood: any;
  market: any;
  recommendation: any;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

export default function IntelligenceFeaturesPanel({
  property,
  marketAverage,
  otherTitles,
}: IntelligenceFeaturesPanelProps) {
  const [state, setState] = useState<FeatureState>({
    fraud: null,
    price: null,
    neighborhood: null,
    market: null,
    recommendation: null,
    loading: {
      fraud: true,
      price: true,
      neighborhood: true,
      market: true,
      recommendation: true,
    },
    errors: {},
  });

  const updateFeature = (
    feature: string,
    data: any,
    error?: string
  ) => {
    setState((prev) => ({
      ...prev,
      [feature]: data,
      loading: { ...prev.loading, [feature]: false },
      errors: { ...prev.errors, [feature]: error || null },
    }));
  };

  // Load all features in parallel
  useEffect(() => {
    const loadFeatures = async () => {
      // Fraud Detection
      try {
        const fraudRes = await fetch("/api/fraud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: property.title,
            description: property.description || "",
            listedPrice: property.listedPrice,
            otherTitles: otherTitles || [],
            marketAverage: marketAverage,
          }),
        });
        const fraudData = await fraudRes.json();
        updateFeature(
          "fraud",
          fraudData,
          fraudRes.ok ? undefined : "Failed to analyze fraud risk"
        );
      } catch (err) {
        updateFeature("fraud", null, "Fraud detection unavailable");
      }

      // Price Explanation
      try {
        const priceRes = await fetch("/api/genai/explain-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: property.title,
            price: property.listedPrice,
            location: property.location,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            areaSqft: property.areaSqft,
            description: property.description || "",
          }),
        });
        const priceData = await priceRes.json();
        updateFeature(
          "price",
          priceData,
          priceRes.ok ? undefined : "Failed to explain price"
        );
      } catch (err) {
        updateFeature("price", null, "Price explanation unavailable");
      }

      // Neighborhood Report
      try {
        const neighborhoodRes = await fetch(
          "/api/genai/neighborhood-report",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: property.location,
            }),
          }
        );
        const neighborhoodData = await neighborhoodRes.json();
        updateFeature(
          "neighborhood",
          neighborhoodData,
          neighborhoodRes.ok ? undefined : "Failed to get neighborhood info"
        );
      } catch (err) {
        updateFeature("neighborhood", null, "Neighborhood info unavailable");
      }

      // Market Insights
      try {
        const marketRes = await fetch("/api/genai/market-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: property.location,
          }),
        });
        const marketData = await marketRes.json();
        updateFeature(
          "market",
          marketData,
          marketRes.ok ? undefined : "Failed to get market insights"
        );
      } catch (err) {
        updateFeature("market", null, "Market insights unavailable");
      }

      // Recommendations
      try {
        const recRes = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: property.id,
            userPreferences: {
              minPrice: property.listedPrice * 0.8,
              maxPrice: property.listedPrice * 1.2,
              bedrooms: property.bedrooms,
              location: property.location,
            },
          }),
        });
        const recData = await recRes.json();
        updateFeature(
          "recommendation",
          recData,
          recRes.ok ? undefined : "Failed to get recommendations"
        );
      } catch (err) {
        updateFeature("recommendation", null, "Recommendations unavailable");
      }
    };

    loadFeatures();
  }, [property, marketAverage, otherTitles]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Fraud Detection */}
        <FraudDetectionCard
          data={state.fraud}
          loading={state.loading.fraud}
          error={state.errors.fraud}
        />

        {/* Price Explanation */}
        <PriceExplanationCard
          data={state.price}
          loading={state.loading.price}
          error={state.errors.price}
        />

        {/* Neighborhood Report */}
        <NeighborhoodCard
          data={state.neighborhood}
          loading={state.loading.neighborhood}
          error={state.errors.neighborhood}
        />

        {/* Market Insights */}
        <MarketInsightsCard
          data={state.market}
          loading={state.loading.market}
          error={state.errors.market}
        />

        {/* Recommendation Badge */}
        <RecommendationBadge
          data={state.recommendation}
          loading={state.loading.recommendation}
          error={state.errors.recommendation}
        />
      </div>
    </div>
  );
}
