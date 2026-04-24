/**
 * Property Description Analyzer
 * Extracts features from property text using pattern matching and heuristics
 */

export async function analyzePropertyDescription(description: string): Promise<string[]> {
  const features: string[] = [];

  if (!description) return features;

  const lowerDesc = description.toLowerCase();

  // Location/Area Features
  if (lowerDesc.includes("beach")) features.push("beach-facing");
  if (lowerDesc.includes("park")) features.push("park-nearby");
  if (lowerDesc.includes("market")) features.push("market-area");
  if (lowerDesc.includes("lake")) features.push("water-body");
  if (lowerDesc.includes("river")) features.push("river-view");
  if (lowerDesc.includes("mountain")) features.push("mountain-view");
  if (lowerDesc.includes("tree") || lowerDesc.includes("garden") || lowerDesc.includes("green"))
    features.push("green-area");
  if (lowerDesc.includes("downtown") || lowerDesc.includes("central"))
    features.push("central-location");
  if (lowerDesc.includes("suburban") || lowerDesc.includes("gated"))
    features.push("residential-area");

  // Amenities
  if (lowerDesc.includes("gym") || lowerDesc.includes("fitness"))
    features.push("gym-facility");
  if (lowerDesc.includes("pool") || lowerDesc.includes("swimming"))
    features.push("swimming-pool");
  if (lowerDesc.includes("parking")) features.push("parking");
  if (lowerDesc.includes("lift") || lowerDesc.includes("elevator"))
    features.push("elevator");
  if (lowerDesc.includes("ac") || lowerDesc.includes("air")) features.push("air-conditioned");
  if (lowerDesc.includes("security") || lowerDesc.includes("guard"))
    features.push("security");
  if (lowerDesc.includes("playground") || lowerDesc.includes("kids"))
    features.push("kids-area");
  if (lowerDesc.includes("restaurant") || lowerDesc.includes("cafe"))
    features.push("food-court");

  // Connectivity
  if (lowerDesc.includes("metro")) features.push("metro-connected");
  if (lowerDesc.includes("bus") || lowerDesc.includes("transport"))
    features.push("public-transport");
  if (lowerDesc.includes("highway")) features.push("highway-access");
  if (lowerDesc.includes("airport")) features.push("airport-near");

  // Condition/Features
  if (lowerDesc.includes("new") || lowerDesc.includes("under-construction"))
    features.push("newly-constructed");
  if (lowerDesc.includes("spacious") || lowerDesc.includes("large"))
    features.push("spacious");
  if (lowerDesc.includes("bright") || lowerDesc.includes("open"))
    features.push("bright-open");
  if (lowerDesc.includes("modern")) features.push("modern-design");
  if (lowerDesc.includes("balcony") || lowerDesc.includes("terrace"))
    features.push("outdoor-space");
  if (lowerDesc.includes("natural-light")) features.push("natural-light");
  if (lowerDesc.includes("wooden") || lowerDesc.includes("wood"))
    features.push("wooden-flooring");

  // Property specific
  if (lowerDesc.includes("duplex")) features.push("duplex");
  if (lowerDesc.includes("villa")) features.push("villa");
  if (lowerDesc.includes("cottage")) features.push("cottage");
  if (lowerDesc.includes("studio")) features.push("studio");
  if (lowerDesc.includes("penthouse")) features.push("penthouse");

  return [...new Set(features)]; // Remove duplicates
}

/**
 * Extract numeric features from property data
 */
export function extractNumericFeatures(property: any): Record<string, number> {
  return {
    bedrooms: parseInt(property.bedrooms || "0") || 1,
    bathrooms: parseInt(property.bathrooms || "0") || 1,
    area: extractAreaNumeric(property.area),
    pricePerSqFt: calculatePricePerSqFt(property.price, property.area),
  };
}

function extractAreaNumeric(areaStr?: string): number {
  if (!areaStr) return 500; // Default
  const match = areaStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 500;
}

function calculatePricePerSqFt(price: number | string | undefined, area?: string): number {
  if (!area) return 0;

  // Handle price input - could be number or string (for backward compatibility)
  let finalPrice: number;
  
  if (typeof price === 'number') {
    finalPrice = price;
  } else if (typeof price === 'string') {
    // Parse string price for backward compatibility
    const priceNumMatch = price.match(/(\d+(?:\.\d+)?)/);
    if (!priceNumMatch) return 0;
    
    const priceNum = parseFloat(priceNumMatch[1]);
    
    // Handle price multipliers (Lac, Cr, K)
    finalPrice = priceNum;
    if (price.includes("Cr")) finalPrice *= 10000000;
    else if (price.includes("Lac")) finalPrice *= 100000;
    else if (price.includes("K")) finalPrice *= 1000;
  } else {
    return 0;
  }

  const areaNumMatch = area.match(/(\d+(?:\.\d+)?)/);
  if (!areaNumMatch) return 0;
  
  const areaNum = parseFloat(areaNumMatch[1]);
  return areaNum > 0 ? finalPrice / areaNum : 0;
}
