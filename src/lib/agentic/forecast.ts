import { ForecastInput, ForecastOutput } from "./types";
import { clamp, roundTo } from "./utils";
import { getLSTMForecast } from "../lstmForecast";

/**
 * Heuristic forecast (original, preserved)
 */
function forecastPropertyValueHeuristic(input: ForecastInput): ForecastOutput {
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

/**
 * Blend heuristic and LSTM forecasts: 60% heuristic + 40% LSTM
 */
function blendForecasts(
  heuristic: ForecastOutput,
  lstm: Awaited<ReturnType<typeof getLSTMForecast>>
): ForecastOutput {
  // Blend month-by-month predictions
  const blendedPoints = heuristic.points.map((hPoint, idx) => {
    const lstmPoint = lstm.monthlyPredictions[idx];
    const blendedPrice =
      hPoint.predictedPrice * 0.6 + lstmPoint.predictedPrice * 0.4;

    return {
      month: hPoint.month,
      predictedPrice: Math.round(blendedPrice),
    };
  });

  // Calculate blended return percentage
  const finalPrice = blendedPoints[blendedPoints.length - 1].predictedPrice;
  const blendedReturn = roundTo(
    ((finalPrice - heuristic.points[0].predictedPrice) /
      heuristic.points[0].predictedPrice) *
      100,
    2
  );

  return {
    architecture: "lstm-surrogate",
    horizonMonths: heuristic.horizonMonths,
    projectedReturnPct: blendedReturn,
    points: blendedPoints,
  };
}

/**
 * Generate property value forecast
 * Combines heuristic and LSTM-based predictions
 */
export async function forecastPropertyValue(input: ForecastInput): Promise<ForecastOutput> {
  try {
    // 1. Generate heuristic forecast (always available)
    const heuristicForecast = forecastPropertyValueHeuristic(input);

    // 2. Attempt LSTM forecast (non-blocking)
    let finalForecast = heuristicForecast;

    try {
      console.log("LSTM forecasting applied");
      const lstmForecast = await getLSTMForecast(input);

      // 3. Blend forecasts: 60% heuristic + 40% LSTM
      finalForecast = blendForecasts(heuristicForecast, lstmForecast);

      console.log(
        `Forecast blended: heuristic=${heuristicForecast.projectedReturnPct}% + LSTM=${lstmForecast.returnPercentage}% → final=${finalForecast.projectedReturnPct}%`
      );
    } catch (error) {
      // Fallback to heuristic if LSTM fails
      console.warn(
        "LSTM forecast failed, using heuristic only:",
        error instanceof Error ? error.message : String(error)
      );
      // finalForecast already set to heuristicForecast
    }

    return finalForecast;
  } catch (error) {
    console.error("Forecast generation error:", error);
    // Return neutral fallback forecast
    const months = clamp(Math.floor(input.horizonMonths), 1, 24);
    const fallbackPoints = [];
    for (let month = 1; month <= months; month++) {
      fallbackPoints.push({
        month,
        predictedPrice: input.currentPrice,
      });
    }

    return {
      architecture: "lstm-surrogate",
      horizonMonths: months,
      projectedReturnPct: 0,
      points: fallbackPoints,
    };
  }
}
