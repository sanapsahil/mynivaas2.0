// Extension to orchestrator with new intelligence features
// This file provides functions to safely integrate the new AI features

import { detectFraud } from "@/lib/fraudDetector";
import { explainPrice } from "@/lib/genai";
import { generateNeighborhoodReport } from "@/lib/neighborhood";
import { getRecommendations, UserPreferences } from "@/lib/recommendation";
import { getMarketInsights } from "@/lib/marketInsights";
import {
  FraudAnalysis,
  PriceExplanation,
  NeighborhoodReport,
  MarketInsights,
  RecommendationResult,
} from "./types";

export interface OrchestratorPropertyInput {
  id: string;
  title: string;
  listedPrice: number;
  location: string;
  areaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
  phone?: string;
  brokerId?: string;
  imageHash?: string;
}

export interface ExtendedIntelligence {
  fraudAnalysis?: FraudAnalysis;
  priceExplanation?: PriceExplanation;
  neighborhoodReport?: NeighborhoodReport;
  marketInsights?: MarketInsights;
  recommendations?: RecommendationResult[];
}

/**
 * Safely execute fraud detection with fallback
 */
export async function safeDetectFraud(
  property: OrchestratorPropertyInput,
  otherTitles?: string[],
  marketAverage?: number
): Promise<FraudAnalysis | undefined> {
  try {
    return detectFraud(
      {
        id: property.id,
        title: property.title,
        listedPrice: property.listedPrice,
        location: property.location,
      },
      {
        otherTitles,
        marketAverage,
      }
    );
  } catch (error) {
    console.warn("Fraud detection failed, skipping:", error);
    return undefined;
  }
}

/**
 * Safely execute price explanation with fallback
 */
export async function safeExplainPrice(
  property: OrchestratorPropertyInput
): Promise<PriceExplanation | undefined> {
  try {
    return explainPrice({
      title: property.title,
      listedPrice: property.listedPrice,
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqft: property.areaSqft,
      conditionScore: property.conditionScore,
      greeneryIndex: property.greeneryIndex,
      trafficCongestionIndex: property.trafficCongestionIndex,
    });
  } catch (error) {
    console.warn("Price explanation failed, skipping:", error);
    return undefined;
  }
}

/**
 * Safely generate neighborhood report with fallback
 */
export async function safeGenerateNeighborhoodReport(
  property: OrchestratorPropertyInput
): Promise<NeighborhoodReport | undefined> {
  try {
    return generateNeighborhoodReport(property.location, {
      greeneryIndex: property.greeneryIndex,
      trafficCongestionIndex: property.trafficCongestionIndex,
    });
  } catch (error) {
    console.warn("Neighborhood report failed, skipping:", error);
    return undefined;
  }
}

/**
 * Safely get market insights with fallback
 */
export async function safeGetMarketInsights(
  location: string
): Promise<MarketInsights | undefined> {
  try {
    return getMarketInsights(location);
  } catch (error) {
    console.warn("Market insights failed, skipping:", error);
    return undefined;
  }
}

/**
 * Safely get recommendations with fallback
 */
export async function safeGetRecommendations(
  properties: OrchestratorPropertyInput[],
  userPreferences: UserPreferences
): Promise<RecommendationResult[] | undefined> {
  try {
    return getRecommendations(
      properties.map((p) => ({
        id: p.id,
        title: p.title,
        listedPrice: p.listedPrice,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqft: p.areaSqft,
        conditionScore: p.conditionScore,
        greeneryIndex: p.greeneryIndex,
        trafficCongestionIndex: p.trafficCongestionIndex,
      })),
      userPreferences
    );
  } catch (error) {
    console.warn("Recommendations failed, skipping:", error);
    return undefined;
  }
}

/**
 * Gather all extended intelligence features for a single property
 */
export async function gatherExtendedIntelligence(
  property: OrchestratorPropertyInput,
  options?: {
    otherTitles?: string[];
    marketAverage?: number;
    enableFraud?: boolean;
    enablePriceExplanation?: boolean;
    enableNeighborhood?: boolean;
    enableMarketInsights?: boolean;
  }
): Promise<ExtendedIntelligence> {
  const enabledFeatures = {
    enableFraud: options?.enableFraud !== false,
    enablePriceExplanation: options?.enablePriceExplanation !== false,
    enableNeighborhood: options?.enableNeighborhood !== false,
    enableMarketInsights: options?.enableMarketInsights !== false,
  };

  const [fraudAnalysis, priceExplanation, neighborhoodReport, marketInsights] =
    await Promise.all([
      enabledFeatures.enableFraud
        ? safeDetectFraud(property, options?.otherTitles, options?.marketAverage)
        : Promise.resolve(undefined),
      enabledFeatures.enablePriceExplanation
        ? safeExplainPrice(property)
        : Promise.resolve(undefined),
      enabledFeatures.enableNeighborhood
        ? safeGenerateNeighborhoodReport(property)
        : Promise.resolve(undefined),
      enabledFeatures.enableMarketInsights
        ? safeGetMarketInsights(property.location)
        : Promise.resolve(undefined),
    ]);

  return {
    fraudAnalysis,
    priceExplanation,
    neighborhoodReport,
    marketInsights,
  };
}
