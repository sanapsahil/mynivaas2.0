import sharp from "sharp";

export interface LocationIndices {
  greeneryIndex: number; // 0-100 (% of green coverage)
  trafficCongestionIndex: number; // 0-100 (0 = no traffic, 100 = heavy congestion)
}

/**
 * Analyzes satellite imagery using Vision Transformer-inspired analysis.
 * Calculates Greenery Index and Traffic Congestion Index.
 *
 * This implementation uses computer vision techniques as a foundation,
 * ready to be replaced with a trained ViT model for production use.
 */
export async function analyzeSatelliteImagery(
  satelliteBuffer: Buffer,
  roadmapBuffer: Buffer | null
): Promise<LocationIndices> {
  try {
    // Analyze satellite image for greenery
    const greeneryIndex = await calculateGreeneryIndex(satelliteBuffer);

    // Analyze roadmap for traffic congestion
    const trafficIndex = roadmapBuffer
      ? await calculateTrafficIndexFromOSM(roadmapBuffer)
      : 50; // Default to medium if no roadmap

    return {
      greeneryIndex: Math.round(Math.min(100, Math.max(0, greeneryIndex))),
      trafficCongestionIndex: Math.round(Math.min(100, Math.max(0, trafficIndex))),
    };
  } catch (error) {
    console.error("Satellite analysis error:", error);
    return { greeneryIndex: 50, trafficCongestionIndex: 50 };
  }
}

/**
 * Calculate Greenery Index using color-based segmentation.
 * Detects green vegetation in satellite imagery.
 */
async function calculateGreeneryIndex(imageBuffer: Buffer): Promise<number> {
  const image = sharp(imageBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = data.length / info.channels;
  let greenPixels = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detect greenery: High green channel, low red/blue
    // This mimics vegetation indices like NDVI
    if (isVegetationPixel(r, g, b)) {
      greenPixels++;
    }
  }

  return (greenPixels / pixels) * 100;
}

/**
 * Vegetation detection using color thresholds.
 * Mimics spectral indices used in remote sensing.
 */
function isVegetationPixel(r: number, g: number, b: number): boolean {
  // Green vegetation characteristics:
  // 1. Green channel dominates
  // 2. Red and blue are lower
  // 3. Not too dark (shadows) or too bright (buildings)

  const brightness = (r + g + b) / 3;

  // Check if green dominates
  const greenDominance = g > r && g > b;

  // Calculate ExG (Excess Green Index) - common in vegetation detection
  const exg = 2 * g - r - b;

  return (
    greenDominance &&
    exg > 30 && // Threshold for vegetation
    brightness > 40 && brightness < 220 && // Ignore shadows and overexposed
    g > 60 // Minimum green intensity
  );
}

/**
 * Calculate Traffic Congestion Index from OpenStreetMap tiles.
 * Analyzes road density and urban infrastructure patterns.
 */
async function calculateTrafficIndexFromOSM(imageBuffer: Buffer): Promise<number> {
  const image = sharp(imageBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const pixels = data.length / info.channels;
  const width = info.width;
  const height = info.height;

  const roadMask = new Uint8Array(pixels);
  const highwayMask = new Uint8Array(pixels);

  let urbanDensityPixels = 0; // Buildings and dense areas

  for (let i = 0; i < data.length; i += info.channels) {
    const pixelIndex = i / info.channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detect highways and major roads first
    if (isHighwayPixel(r, g, b)) {
      highwayMask[pixelIndex] = 1;
      roadMask[pixelIndex] = 1;
    }
    else if (isMajorRoadPixel(r, g, b)) {
      roadMask[pixelIndex] = 1;
    }
    else if (isUrbanDensityPixel(r, g, b)) {
      urbanDensityPixels++;
    }
  }

  let connectedRoadPixels = 0;
  let connectedHighwayPixels = 0;
  let intersectionPixels = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!roadMask[idx]) continue;

      const roadNeighbors = countRoadNeighbors(roadMask, width, height, x, y);

      // Ignore isolated color matches that are unlikely to be roads.
      if (roadNeighbors >= 2) {
        connectedRoadPixels++;
      }

      // Higher-order connectivity indicates intersections and complex junctions.
      if (roadNeighbors >= 4) {
        intersectionPixels++;
      }

      if (highwayMask[idx]) {
        const highwayNeighbors = countRoadNeighbors(highwayMask, width, height, x, y);
        if (highwayNeighbors >= 1) {
          connectedHighwayPixels++;
        }
      }
    }
  }

  const highwayDensity = (connectedHighwayPixels / pixels) * 100;
  const roadDensity = (connectedRoadPixels / pixels) * 100;
  const intersectionDensity = (intersectionPixels / pixels) * 100;
  const urbanDensity = (urbanDensityPixels / pixels) * 100;

  const weightedTrafficSignal =
    highwayDensity * 4.0 +
    roadDensity * 1.8 +
    intersectionDensity * 3.0 +
    urbanDensity * 0.6;

  // Non-linear calibration to avoid over-penalizing moderate-density areas.
  const scaledSignal = weightedTrafficSignal * 2.2;
  return 100 * (1 - Math.exp(-scaledSignal / 55));
}

function countRoadNeighbors(
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number
): number {
  let count = 0;

  for (let yOffset = -1; yOffset <= 1; yOffset++) {
    for (let xOffset = -1; xOffset <= 1; xOffset++) {
      if (xOffset === 0 && yOffset === 0) continue;

      const neighborX = x + xOffset;
      const neighborY = y + yOffset;

      if (neighborX < 0 || neighborX >= width || neighborY < 0 || neighborY >= height) {
        continue;
      }

      if (mask[neighborY * width + neighborX]) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Detects highway pixels in OSM tiles (orange/yellow).
 */
function isHighwayPixel(r: number, g: number, b: number): boolean {
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);

  // OSM primary/highways are generally orange-yellow.
  return (
    hue >= 18 &&
    hue <= 52 &&
    saturation >= 0.35 &&
    saturation <= 0.95 &&
    lightness >= 0.42 &&
    lightness <= 0.82
  );
}

/**
 * Detects major road pixels in OSM tiles (white/light gray).
 */
function isMajorRoadPixel(r: number, g: number, b: number): boolean {
  const { saturation, lightness } = rgbToHsl(r, g, b);
  const brightness = (r + g + b) / 3;

  // Roads are white/light gray with minimal color variation
  return (
    saturation <= 0.14 &&
    lightness >= 0.72 &&
    lightness <= 0.96 &&
    brightness > 200 &&
    brightness < 248
  );
}

/**
 * Detects urban density pixels (buildings, developed areas).
 */
function isUrbanDensityPixel(r: number, g: number, b: number): boolean {
  const { hue, saturation, lightness } = rgbToHsl(r, g, b);

  // Buildings in OSM are tan/beige/light brown
  // Moderate brightness and warm-neutral hue.
  return (
    hue >= 24 &&
    hue <= 50 &&
    saturation >= 0.08 &&
    saturation <= 0.4 &&
    lightness >= 0.62 &&
    lightness <= 0.88
  );
}

function rgbToHsl(r: number, g: number, b: number): {
  hue: number;
  saturation: number;
  lightness: number;
} {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;

  let hue = 0;
  if (chroma !== 0) {
    if (max === red) {
      hue = ((green - blue) / chroma) % 6;
    } else if (max === green) {
      hue = (blue - red) / chroma + 2;
    } else {
      hue = (red - green) / chroma + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  const lightness = (max + min) / 2;
  const saturation =
    chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));

  return { hue, saturation, lightness };
}

/**
 * Multi-scale analysis combining street-level and neighborhood-level imagery.
 * Provides more accurate indices by considering context at different scales.
 */
export async function analyzeMultiScaleSatellite(
  streetSatellite: Buffer,
  neighborhoodSatellite: Buffer,
  streetRoadmap: Buffer | null,
  neighborhoodRoadmap: Buffer | null
): Promise<LocationIndices> {
  const [streetAnalysis, neighborhoodAnalysis] = await Promise.all([
    analyzeSatelliteImagery(streetSatellite, streetRoadmap),
    analyzeSatelliteImagery(neighborhoodSatellite, neighborhoodRoadmap),
  ]);

  // Weight street-level more for traffic, neighborhood more for greenery
  return {
    greeneryIndex: Math.round(
      streetAnalysis.greeneryIndex * 0.4 + neighborhoodAnalysis.greeneryIndex * 0.6
    ),
    trafficCongestionIndex: Math.round(
      streetAnalysis.trafficCongestionIndex * 0.7 + neighborhoodAnalysis.trafficCongestionIndex * 0.3
    ),
  };
}
