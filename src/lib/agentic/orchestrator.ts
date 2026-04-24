import { detectFraudClusters } from "./fraudGraph";
import { forecastPropertyValue } from "./forecast";
import { draftCounterOffer } from "./negotiator";
import { planGoal } from "./planner";
import { analyzeExternalSentiment } from "./sentiment";
import {
  AgenticEvaluation,
  DefectInsight,
  FraudNode,
  UserGoalInput,
  ValuationInput,
} from "./types";
import { estimateFairPrice } from "./valuation";
import { clamp, mean, roundTo } from "./utils";

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

function deriveDefects(property: OrchestratorPropertyInput): DefectInsight[] {
  const defects: DefectInsight[] = [];

  if ((property.conditionScore ?? 5) < 5) {
    defects.push({
      code: "LOW_CONDITION",
      label: "Below-average condition",
      severity: "high",
      evidence: `Condition score ${property.conditionScore ?? 0}/10 is below desirable threshold`,
    });
  }

  if ((property.trafficCongestionIndex ?? 50) > 65) {
    defects.push({
      code: "HIGH_TRAFFIC",
      label: "High traffic congestion",
      severity: "medium",
      evidence: `Traffic index ${property.trafficCongestionIndex}% indicates likely commute friction`,
    });
  }

  if ((property.greeneryIndex ?? 50) < 30) {
    defects.push({
      code: "LOW_GREENERY",
      label: "Low greenery coverage",
      severity: "low",
      evidence: `Greenery index ${property.greeneryIndex}% is below preferred livability band`,
    });
  }

  return defects;
}

function buildRecommendation(input: {
  fairDelta: number;
  fraudRisk: number;
  returnPct: number;
}): string {
  if (input.fraudRisk >= 0.65) {
    return "High caution: potential fraud/duplication risk detected. Verify title, ownership, and broker identity before proceeding.";
  }

  if (input.fairDelta < -5 && input.returnPct > 8) {
    return "Promising buy candidate: listed below or near fair value with strong projected upside.";
  }

  if (input.fairDelta > 8) {
    return "Likely overpriced: negotiate aggressively or compare alternate listings before committing.";
  }

  return "Moderate opportunity: proceed with negotiation and legal due diligence.";
}

export async function runAgenticEvaluation(
  goalInput: UserGoalInput,
  property: OrchestratorPropertyInput,
  peers: OrchestratorPropertyInput[] = []
): Promise<{ planner: ReturnType<typeof planGoal>; evaluation: AgenticEvaluation }> {
  const planner = planGoal(goalInput);
  const sentiment = await analyzeExternalSentiment(
    `${property.location} real estate ${goalInput.propertyType ?? ""}`.trim()
  );

  const sentimentScoreForModel = sentiment.confidence >= 0.35 ? sentiment.score * 100 : 0;

  const comparableCandidates = peers
    .map((peer) => peer.listedPrice)
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((left, right) => left - right);

  const comparableMedianPrice =
    comparableCandidates.length > 0
      ? comparableCandidates[Math.floor(comparableCandidates.length / 2)]
      : undefined;

  const valuationInput: ValuationInput = {
    listedPrice: property.listedPrice,
    areaSqft: property.areaSqft,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    conditionScore: property.conditionScore,
    greeneryIndex: property.greeneryIndex,
    trafficCongestionIndex: property.trafficCongestionIndex,
    sentimentScore: sentimentScoreForModel,
    locationScore: property.greeneryIndex
      ? Math.max(15, Math.min(95, property.greeneryIndex - (property.trafficCongestionIndex ?? 50) * 0.3 + 50))
      : 50,
    nearbyInfraScore: 55,
    comparableMedianPrice,
    comparableCount: comparableCandidates.length,
  };

  const fairValue = estimateFairPrice(valuationInput);
  const forecast = await forecastPropertyValue({
    currentPrice: fairValue.fairPrice,
    horizonMonths: goalInput.horizonMonths ?? 24,
    sentimentDrift: sentiment.score,
  });

  const allNodes: FraudNode[] = [property, ...peers].map((item) => ({
    id: item.id,
    title: item.title,
    location: item.location,
    price: item.listedPrice,
    phone: item.phone,
    brokerId: item.brokerId,
    imageHash: item.imageHash,
  }));

  const allFraudClusters = detectFraudClusters(allNodes);
  const fraudRisk = allFraudClusters.filter((cluster) =>
    cluster.listingIds.includes(property.id)
  );
  const defects = deriveDefects(property);
  const negotiation = draftCounterOffer({
    propertyTitle: property.title,
    listedPrice: property.listedPrice,
    fairPrice: fairValue.fairPrice,
    defects,
  });

  const recommendation = buildRecommendation({
    fairDelta: fairValue.deltaVsListed,
    fraudRisk: fraudRisk[0]?.riskScore ?? 0,
    returnPct: forecast.projectedReturnPct,
  });

  const confidenceSignals = [
    fairValue.confidence,
    sentiment.confidence,
    comparableCandidates.length >= 3 ? 0.8 : 0.4,
    fraudRisk.length > 0 ? 0.75 : 0.45,
  ];
  const overallConfidence = roundTo(clamp(mean(confidenceSignals), 0.2, 0.95), 2);

  const failedChecks: string[] = [];
  if (overallConfidence < 0.72) {
    failedChecks.push("overallConfidence<0.72");
  }
  if (fairValue.confidence < 0.65) {
    failedChecks.push("valuationConfidence<0.65");
  }
  if (comparableCandidates.length < 3) {
    failedChecks.push("insufficientComparables(<3)");
  }
  if (fraudRisk.length > 0 && fraudRisk[0].riskScore >= 0.9) {
    failedChecks.push("extremeFraudRisk(>=0.9)");
  }

  const passesStrictChecks = failedChecks.length === 0;

  return {
    planner,
    evaluation: {
      fairValue,
      forecast,
      fraudRisk,
      defects,
      sentiment,
      negotiation,
      recommendation,
      accuracy: {
        overallConfidence,
        isHighConfidence: overallConfidence >= 0.7,
        passesStrictChecks,
        failedChecks,
        comparableCount: comparableCandidates.length,
        dataSources: [
          {
            name: "valuation",
            source: "listing + comparable peer prices",
            confidence: fairValue.confidence,
            notes:
              comparableCandidates.length >= 3
                ? `Comparable anchor used (${comparableCandidates.length} peers)`
                : "Comparable anchor unavailable; model-only estimate",
          },
          {
            name: "fraudRisk",
            source: "cross-listing graph evidence",
            confidence: fraudRisk.length > 0 ? 0.75 : 0.45,
            notes:
              fraudRisk.length > 0
                ? `Cluster evidence found (${fraudRisk[0].reasons.join(", ")})`
                : "No strong fraud cluster evidence for this listing",
          },
          {
            name: "sentiment",
            source: sentiment.sources.join(", ") || "none",
            confidence: sentiment.confidence,
            notes:
              sentiment.confidence >= 0.35
                ? "Used in valuation adjustment"
                : "Low confidence; excluded from valuation impact",
          },
        ],
      },
    },
  };
}

// ===== EXTENDED INTELLIGENCE FEATURES (v2) =====
// These features extend the orchestrator without breaking backward compatibility

import {
  gatherExtendedIntelligence,
  OrchestratorPropertyInput as ExtendedPropertyInput,
} from "./orchestratorExtension";
import { UserPreferences } from "@/lib/recommendation";

/**
 * Run agentic evaluation with optional extended intelligence features
 * Fully backward compatible - returns same structure as before
 * New features available as optional fields in evaluation result
 */
export async function runAgenticEvaluationWithExtendedIntelligence(
  goalInput: UserGoalInput,
  property: OrchestratorPropertyInput,
  peers: OrchestratorPropertyInput[] = [],
  options?: {
    enableExtendedFeatures?: boolean;
    marketAverage?: number;
    userPreferences?: UserPreferences;
  }
): Promise<{
  planner: ReturnType<typeof planGoal>;
  evaluation: AgenticEvaluation;
}> {
  // Run standard evaluation first
  const result = await runAgenticEvaluation(goalInput, property, peers);

  // Optionally augment with extended intelligence
  if (options?.enableExtendedFeatures) {
    try {
      const extendedIntel = await gatherExtendedIntelligence(
        property as any,
        {
          otherTitles: peers.map((p) => p.title),
          marketAverage: options.marketAverage,
          enableFraud: true,
          enablePriceExplanation: true,
          enableNeighborhood: true,
          enableMarketInsights: true,
        }
      );

      // Merge extended features into evaluation (optional fields)
      result.evaluation.fraudAnalysis = extendedIntel.fraudAnalysis;
      result.evaluation.priceExplanation = extendedIntel.priceExplanation;
      result.evaluation.neighborhoodReport = extendedIntel.neighborhoodReport;
      result.evaluation.marketInsights = extendedIntel.marketInsights;
    } catch (error) {
      console.warn(
        "Extended intelligence features failed, continuing with standard evaluation:",
        error
      );
    }
  }

  return result;
}
