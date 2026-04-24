import sharp from "sharp";
import { getEfficientNetEmbedding } from "./efficientNetEmbeddings";
import { getCNNConditionScores } from "./cnnConditionScorer";

export interface PropertyScore {
  modernity: number; // 1-10 (heuristic score)
  wearAndTear: number; // 1-10 (heuristic score)
  lighting: number; // 1-10 (heuristic score)
  overall: number; // 1-10 average (combined heuristic + CNN)
  efficientNetEmbedding?: number[]; // Optional: EfficientNet feature vector
  cnnScores?: {
    // Optional: CNN-based condition scores (ResNet-50)
    modernity: number;
    lighting: number;
    wearAndTear: number;
    structuralQuality: number;
  };
}

/**
 * Analyzes an image buffer and returns quality scores.
 * Combines heuristic scoring with CNN-based assessment.
 */
export async function scorePropertyImage(
  imageBuffer: Buffer
): Promise<PropertyScore> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Extract RGB statistics
    const stats = calculateImageStats(data, info.channels);

    // Heuristic scoring (existing method)
    const heuristicModernity = calculateModernityScore(stats);
    const heuristicWearAndTear = calculateWearAndTearScore(stats);
    const heuristicLighting = calculateLightingScore(stats);
    const heuristicOverall = Math.round(
      (heuristicModernity + heuristicWearAndTear + heuristicLighting) / 3
    );

    // Attempt to generate CNN condition scores (non-blocking)
    let cnnScores: {
      modernity: number;
      lighting: number;
      wearAndTear: number;
      structuralQuality: number;
    } | undefined;
    let combinedOverall = heuristicOverall;

    try {
      console.log("Generating CNN condition scores...");
      cnnScores = await getCNNConditionScores(imageBuffer);
      console.log("CNN condition scoring applied");

      // Combine heuristic and CNN scores: 60% heuristic + 40% CNN
      const cnnAverage = (
        cnnScores.modernity +
        cnnScores.lighting +
        cnnScores.wearAndTear +
        cnnScores.structuralQuality
      ) / 4;

      combinedOverall = Math.round(
        heuristicOverall * 0.6 + cnnAverage * 0.4
      );
    } catch (error) {
      // Don't fail the entire scoring if CNN fails
      console.warn(
        "CNN condition scoring failed, using heuristic scores only:",
        error instanceof Error ? error.message : String(error)
      );
    }

    // Attempt to generate EfficientNet embedding (non-blocking)
    let efficientNetEmbedding: number[] | undefined;
    try {
      console.log("Generating EfficientNet embedding for image scoring...");
      efficientNetEmbedding = await getEfficientNetEmbedding(imageBuffer);
      console.log(
        `✓ EfficientNet embedding generated (${efficientNetEmbedding.length} dimensions)`
      );
    } catch (error) {
      // Don't fail the entire scoring if EfficientNet fails
      console.warn(
        "EfficientNet embedding generation failed, continuing without it:",
        error instanceof Error ? error.message : String(error)
      );
    }

    return {
      modernity: Math.min(10, Math.max(1, heuristicModernity)),
      wearAndTear: Math.min(10, Math.max(1, heuristicWearAndTear)),
      lighting: Math.min(10, Math.max(1, heuristicLighting)),
      overall: Math.min(10, Math.max(1, combinedOverall)),
      efficientNetEmbedding,
      cnnScores,
    };
  } catch (error) {
    console.error("Image scoring error:", error);
    // Return neutral scores on error
    return {
      modernity: 5,
      wearAndTear: 5,
      lighting: 5,
      overall: 5,
    };
  }
}

interface ImageStats {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  colorfulness: number;
}

function calculateImageStats(
  data: Buffer,
  channels: number
): ImageStats {
  const pixels = data.length / channels;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  let rVar = 0,
    gVar = 0,
    bVar = 0;
  let brightnessSum = 0;

  // First pass: calculate means
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    rSum += r;
    gSum += g;
    bSum += b;
    brightnessSum += (r + g + b) / 3;
  }

  const rMean = rSum / pixels;
  const gMean = gSum / pixels;
  const bMean = bSum / pixels;
  const brightness = brightnessSum / pixels;

  // Second pass: calculate variance
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    rVar += Math.pow(r - rMean, 2);
    gVar += Math.pow(g - gMean, 2);
    bVar += Math.pow(b - bMean, 2);
  }

  const rStd = Math.sqrt(rVar / pixels);
  const gStd = Math.sqrt(gVar / pixels);
  const bStd = Math.sqrt(bVar / pixels);

  // Contrast (standard deviation of brightness)
  const contrast = (rStd + gStd + bStd) / 3;

  // Saturation (how colorful vs grayscale)
  const saturation = Math.sqrt(
    (Math.pow(rMean - gMean, 2) +
      Math.pow(rMean - bMean, 2) +
      Math.pow(gMean - bMean, 2)) /
      3
  );

  // Sharpness approximation (contrast is a proxy)
  const sharpness = contrast;

  // Colorfulness (RMS of RGB stdev)
  const colorfulness = Math.sqrt((rVar + gVar + bVar) / (3 * pixels));

  return {
    brightness,
    contrast,
    saturation,
    sharpness,
    colorfulness,
  };
}

function calculateModernityScore(stats: ImageStats): number {
  // Modern interiors tend to have:
  // - High saturation (vibrant colors)
  // - Good contrast (sharp, clear)
  // - Balanced brightness

  const saturationScore = Math.min(10, (stats.saturation / 50) * 10);
  const contrastScore = Math.min(10, (stats.contrast / 60) * 10);
  const brightnessScore =
    stats.brightness > 100 && stats.brightness < 200 ? 10 : 5;

  return Math.round((saturationScore + contrastScore + brightnessScore) / 3);
}

function calculateWearAndTearScore(stats: ImageStats): number {
  // Good condition interiors have:
  // - High sharpness (crisp details)
  // - Good colorfulness (not washed out)
  // - Balanced variance (not noisy/grainy)

  const sharpnessScore = Math.min(10, (stats.sharpness / 60) * 10);
  const colorScore = Math.min(10, (stats.colorfulness / 40) * 10);

  // Invert noise (lower variance = better)
  const noiseScore = stats.contrast < 80 ? 10 : 5;

  return Math.round((sharpnessScore + colorScore + noiseScore) / 3);
}

function calculateLightingScore(stats: ImageStats): number {
  // Good lighting has:
  // - Optimal brightness (not too dark, not blown out)
  // - Good contrast (dynamic range)
  // - No extreme shadows or highlights

  let brightnessScore = 10;
  if (stats.brightness < 80) brightnessScore = 4; // Too dark
  else if (stats.brightness > 220) brightnessScore = 4; // Overexposed
  else if (stats.brightness >= 120 && stats.brightness <= 160)
    brightnessScore = 10; // Perfect
  else brightnessScore = 7;

  const contrastScore = Math.min(10, (stats.contrast / 50) * 10);

  return Math.round((brightnessScore + contrastScore) / 2);
}

/**
 * Scores multiple images and returns the best (highest overall) score.
 */
export async function scoreBestPropertyImage(
  imageBuffers: Buffer[]
): Promise<PropertyScore | null> {
  if (imageBuffers.length === 0) return null;

  const scores = await Promise.all(
    imageBuffers.map((buffer) => scorePropertyImage(buffer))
  );

  // Return the score with the highest overall rating
  return scores.reduce((best, current) =>
    current.overall > best.overall ? current : best
  );
}
