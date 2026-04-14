import {
  FeatureContribution,
  ValuationInput,
  ValuationOutput,
} from "./types";
import { clamp, roundTo } from "./utils";

export function estimateFairPrice(input: ValuationInput): ValuationOutput {
  const contributions: FeatureContribution[] = [];

  const listedPrice = input.listedPrice;
  let multiplier = 1;

  const locationBoost = ((input.locationScore ?? 50) - 50) / 500;
  multiplier += locationBoost;
  contributions.push({
    feature: "locationScore",
    contribution: listedPrice * locationBoost,
    rationale: "Higher location desirability lifts fair value.",
  });

  const conditionBoost = ((input.conditionScore ?? 5) - 5) / 50;
  multiplier += conditionBoost;
  contributions.push({
    feature: "conditionScore",
    contribution: listedPrice * conditionBoost,
    rationale: "Better construction/interior condition commands premium.",
  });

  const greeneryBoost = ((input.greeneryIndex ?? 50) - 50) / 800;
  multiplier += greeneryBoost;
  contributions.push({
    feature: "greeneryIndex",
    contribution: listedPrice * greeneryBoost,
    rationale: "Neighborhood greenery increases livability and demand.",
  });

  const trafficPenalty = -((input.trafficCongestionIndex ?? 50) - 50) / 600;
  multiplier += trafficPenalty;
  contributions.push({
    feature: "trafficCongestionIndex",
    contribution: listedPrice * trafficPenalty,
    rationale: "Higher congestion lowers effective willingness-to-pay.",
  });

  const sentimentBoost = (input.sentimentScore ?? 0) / 250;
  multiplier += sentimentBoost;
  contributions.push({
    feature: "sentimentScore",
    contribution: listedPrice * sentimentBoost,
    rationale: "Positive local sentiment improves pricing power.",
  });

  const infraBoost = ((input.nearbyInfraScore ?? 50) - 50) / 700;
  multiplier += infraBoost;
  contributions.push({
    feature: "nearbyInfraScore",
    contribution: listedPrice * infraBoost,
    rationale: "Upcoming infrastructure influences long-term valuation.",
  });

  const areaAdjustment = input.areaSqft
    ? clamp((input.areaSqft - 1000) / 12000, -0.08, 0.1)
    : 0;
  multiplier += areaAdjustment;
  contributions.push({
    feature: "areaSqft",
    contribution: listedPrice * areaAdjustment,
    rationale: "Size-normalization against baseline area profile.",
  });

  const baseFairPrice = listedPrice * multiplier;

  const comparableBlendWeight =
    input.comparableMedianPrice && (input.comparableCount ?? 0) >= 3 ? 0.35 : 0;
  const fairPrice = Math.round(
    comparableBlendWeight > 0
      ? baseFairPrice * (1 - comparableBlendWeight) +
          (input.comparableMedianPrice as number) * comparableBlendWeight
      : baseFairPrice
  );
  const deltaVsListed = roundTo(((fairPrice - listedPrice) / listedPrice) * 100, 2);

  const confidenceSignals = [
    input.areaSqft ? 1 : 0,
    input.locationScore ? 1 : 0,
    input.conditionScore ? 1 : 0,
    input.greeneryIndex ? 1 : 0,
    input.trafficCongestionIndex ? 1 : 0,
    (input.comparableCount ?? 0) >= 3 ? 1 : 0,
  ].reduce((sum, value) => sum + value, 0);

  const confidence = clamp(0.45 + confidenceSignals * 0.1, 0.45, 0.95);

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    fairPrice,
    confidence: roundTo(confidence, 2),
    deltaVsListed,
    modelType: "xgboost-surrogate",
    contributions,
  };
}
