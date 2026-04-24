import * as tf from "@tensorflow/tfjs";
import { ForecastInput, ForecastPoint } from "./agentic/types";

// Global model instance
let lstmModel: tf.LayersModel | null = null;
let modelInitPromise: Promise<tf.LayersModel> | null = null;

/**
 * Build and initialize LSTM model for price forecasting
 * Architecture:
 * - Input: [timesteps=12, features=1]
 * - LSTM(32, returnSequences=false)
 * - Dense(16, relu)
 * - Dense(1) for output
 */
async function buildLSTMModel(): Promise<tf.LayersModel> {
  console.log("Building LSTM model for price forecasting...");

  const model = tf.sequential({
    layers: [
      // LSTM layer (12 timesteps, 1 feature)
      tf.layers.lstm({
        units: 32,
        returnSequences: false,
        inputShape: [12, 1],
        activation: "relu",
      }),

      // Dense layer
      tf.layers.dense({
        units: 16,
        activation: "relu",
      }),

      // Output layer
      tf.layers.dense({
        units: 1,
      }),
    ],
  });

  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
    metrics: ["mae"],
  });

  console.log("✓ LSTM model built successfully");
  return model;
}

/**
 * Get or initialize the LSTM model
 */
async function getLSTMModel(): Promise<tf.LayersModel> {
  if (lstmModel) {
    return lstmModel;
  }

  // Prevent multiple simultaneous initialization
  if (modelInitPromise) {
    return modelInitPromise;
  }

  modelInitPromise = buildLSTMModel();
  lstmModel = await modelInitPromise;
  return lstmModel;
}

/**
 * Prepare synthetic historical time-series data (12 months)
 * Based on property characteristics
 */
function prepareTimeSeries(input: ForecastInput): number[] {
  const basePrice = input.currentPrice;
  const series: number[] = [];

  // Monthly growth factors
  const monthlyGrowth = input.monthlyGrowthBase ?? 0.005;
  const repoImpact = -(input.repoRateTrend ?? 0) * 0.0008;
  const infraImpact = (input.infrastructureBoost ?? 0) * 0.0015;
  const sentimentImpact = (input.sentimentDrift ?? 0) * 0.001;

  const totalMonthlyDrift = monthlyGrowth + repoImpact + infraImpact + sentimentImpact;

  // Generate 12 months of synthetic historical data
  // Start from a lower point and trend towards current price
  let price = basePrice * 0.96; // Start 4% lower 12 months ago

  for (let month = 1; month <= 12; month++) {
    // Add realistic price fluctuations
    const seasonality = Math.sin((month / 6) * Math.PI) * 0.015; // Seasonal pattern
    const drift = totalMonthlyDrift * (month / 12); // Increasing trend
    const noise = (Math.random() - 0.5) * 0.005; // Random fluctuations

    price = price * (1 + seasonality + drift + noise);
    series.push(price);
  }

  return series;
}

/**
 * Normalize array to [0, 1] range
 */
function normalizeData(data: number[]): { normalized: number[]; min: number; max: number } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  const normalized = data.map((val) => (val - min) / range);

  return { normalized, min, max };
}

/**
 * Denormalize value from [0, 1] back to original range
 */
function denormalizeValue(normalized: number, min: number, max: number): number {
  const range = max - min || 1;
  return normalized * range + min;
}

/**
 * Generate LSTM-based 24-month price forecast
 */
export async function getLSTMForecast(input: ForecastInput): Promise<{
  monthlyPredictions: ForecastPoint[];
  returnPercentage: number;
  architecture: "lstm-surrogate";
}> {
  try {
    console.log("Generating LSTM forecast for property...");

    // 1. Prepare historical time-series data (12 months)
    const historicalData = prepareTimeSeries(input);
    console.log(`Generated ${historicalData.length}-month historical data`);

    // 2. Normalize data
    const { normalized, min, max } = normalizeData(historicalData);
    console.log(`Data normalized: range [${min.toFixed(0)}, ${max.toFixed(0)}]`);

    // 3. Get model
    const model = await getLSTMModel();

    // 4. Initialize forecast with historical data
    const predictions: ForecastPoint[] = [];
    let currentSequence = [...normalized]; // Start with normalized history

    // 5. Recursive prediction: predict next month, append, predict again
    for (let forecastMonth = 1; forecastMonth <= 24; forecastMonth++) {
      // Get last 12 values as input
      const inputSequence = currentSequence.slice(-12);

      // Reshape for LSTM: [1, 12, 1] (batch, timesteps, features)
      const inputTensor = tf.tensor3d([inputSequence.map((v) => [v])]);

      // Predict next value
      const outputTensor = model.predict(inputTensor) as tf.Tensor;
      const predictedNormalized = (await outputTensor.data())[0];

      // Clean up tensors
      inputTensor.dispose();
      outputTensor.dispose();

      // 6. Denormalize prediction
      const predictedPrice = denormalizeValue(predictedNormalized, min, max);

      // Ensure price is positive
      const finalPrice = Math.max(100, Math.round(predictedPrice));

      predictions.push({
        month: forecastMonth,
        predictedPrice: finalPrice,
      });

      // 7. Append to sequence for next iteration
      currentSequence.push(predictedNormalized);
    }

    // 8. Calculate return percentage
    const finalPrice = predictions[predictions.length - 1].predictedPrice;
    const returnPercentage = ((finalPrice - input.currentPrice) / input.currentPrice) * 100;

    console.log("✓ LSTM forecast generated successfully");
    console.log(
      `  24-month return: ${returnPercentage.toFixed(2)}% (${input.currentPrice} → ${finalPrice})`
    );

    return {
      monthlyPredictions: predictions,
      returnPercentage: Math.round(returnPercentage * 100) / 100,
      architecture: "lstm-surrogate",
    };
  } catch (error) {
    console.error("LSTM forecast generation failed:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate LSTM forecast: ${errorMsg}`);
  }
}

/**
 * Clean up TensorFlow resources
 */
export function cleanupTensorFlow(): void {
  console.log("Cleaning up TensorFlow resources...");
  tf.disposeVariables();
}

/**
 * Batch generate LSTM forecasts for multiple properties
 */
export async function generateBatchLSTMForecasts(
  inputs: ForecastInput[]
): Promise<
  Array<{
    monthlyPredictions: ForecastPoint[];
    returnPercentage: number;
    architecture: "lstm-surrogate";
  }>
> {
  console.log(`Generating LSTM forecasts for ${inputs.length} properties...`);
  const forecasts: Array<{
    monthlyPredictions: ForecastPoint[];
    returnPercentage: number;
    architecture: "lstm-surrogate";
  }> = [];

  for (let i = 0; i < inputs.length; i++) {
    try {
      const forecast = await getLSTMForecast(inputs[i]);
      forecasts.push(forecast);

      // Progress logging
      if ((i + 1) % 5 === 0) {
        console.log(`✓ Generated ${i + 1}/${inputs.length} LSTM forecasts`);
      }
    } catch (error) {
      console.warn(`Failed to generate forecast ${i}:`, error);
      // Skip failed forecasts
    }
  }

  console.log(`✓ Completed ${forecasts.length} LSTM forecasts`);
  return forecasts;
}
