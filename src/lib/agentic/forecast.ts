import { ForecastInput, ForecastOutput } from "./types";
import { clamp, roundTo } from "./utils";

export function forecastPropertyValue(input: ForecastInput): ForecastOutput {
  const months = clamp(Math.floor(input.horizonMonths), 1, 24);
  const baseGrowth = input.monthlyGrowthBase ?? 0.005;
  const repoImpact = -(input.repoRateTrend ?? 0) * 0.0008;
  const infraImpact = (input.infrastructureBoost ?? 0) * 0.0015;
  const sentimentImpact = (input.sentimentDrift ?? 0) * 0.001;

  const monthlyDrift = baseGrowth + repoImpact + infraImpact + sentimentImpact;
  const points = [];
  let price = input.currentPrice;

  for (let month = 1; month <= months; month += 1) {
    const seasonality = Math.sin(month / 6) * 0.0015;
    const noiseDampener = 1 - month / 200;
    price = price * (1 + monthlyDrift + seasonality * noiseDampener);
    points.push({
      month,
      predictedPrice: Math.round(price),
    });
  }

  const projectedReturnPct = roundTo(
    ((points[points.length - 1].predictedPrice - input.currentPrice) /
      input.currentPrice) *
      100,
    2
  );

  return {
    architecture: "lstm-surrogate",
    horizonMonths: months,
    projectedReturnPct,
    points,
  };
}
