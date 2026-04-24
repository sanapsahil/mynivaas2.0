// GenAI price explanation module - rule-based explanations with optional OpenAI fallback

export interface PriceExplanation {
  reason: string;
  factors: {
    name: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
  confidence: number;
  source: "rule-based" | "openai";
}

function generateRuleBasedExplanation(property: {
  title?: string;
  listedPrice: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
}): PriceExplanation {
  const factors: PriceExplanation["factors"] = [];

  // Location factor
  if (property.location) {
    factors.push({
      name: "Location",
      impact: "positive",
      description: `Located in ${property.location}`,
    });
  }

  // Size factor
  if (property.bedrooms && property.bathrooms) {
    const bedroomText =
      property.bedrooms === 1
        ? "1 bedroom"
        : `${property.bedrooms} bedrooms`;
    const bathroomText =
      property.bathrooms === 1
        ? "1 bathroom"
        : `${property.bathrooms} bathrooms`;
    factors.push({
      name: "Size",
      impact: property.bedrooms >= 3 ? "positive" : "neutral",
      description: `${bedroomText}, ${bathroomText}`,
    });
  }

  // Area factor
  if (property.areaSqft && property.areaSqft > 2000) {
    factors.push({
      name: "Plot Size",
      impact: "positive",
      description: `Spacious ${property.areaSqft} sq. ft.`,
    });
  } else if (property.areaSqft && property.areaSqft < 800) {
    factors.push({
      name: "Plot Size",
      impact: "negative",
      description: `Compact ${property.areaSqft} sq. ft.`,
    });
  }

  // Condition factor
  if (property.conditionScore !== undefined) {
    const conditionText =
      property.conditionScore >= 8
        ? "Excellent condition"
        : property.conditionScore >= 6
          ? "Good condition"
          : property.conditionScore >= 4
            ? "Fair condition"
            : "Poor condition";

    factors.push({
      name: "Property Condition",
      impact:
        property.conditionScore >= 7
          ? "positive"
          : property.conditionScore <= 4
            ? "negative"
            : "neutral",
      description: conditionText,
    });
  }

  // Greenery factor
  if (property.greeneryIndex !== undefined) {
    if (property.greeneryIndex > 60) {
      factors.push({
        name: "Greenery",
        impact: "positive",
        description: "High greenery index - good environmental quality",
      });
    } else if (property.greeneryIndex < 30) {
      factors.push({
        name: "Greenery",
        impact: "negative",
        description: "Low greenery index - limited environmental amenities",
      });
    }
  }

  // Traffic factor
  if (property.trafficCongestionIndex !== undefined) {
    if (property.trafficCongestionIndex > 70) {
      factors.push({
        name: "Traffic",
        impact: "negative",
        description: "High traffic congestion - potential commute friction",
      });
    } else if (property.trafficCongestionIndex < 40) {
      factors.push({
        name: "Traffic",
        impact: "positive",
        description: "Low traffic congestion - good commute accessibility",
      });
    }
  }

  // Generate reason text
  const positiveFactors = factors.filter((f) => f.impact === "positive");
  const negativeFactors = factors.filter((f) => f.impact === "negative");

  let reason = `This property is priced at ₹${(property.listedPrice / 100000).toFixed(1)}L. `;

  if (positiveFactors.length > 0) {
    reason += `Key value drivers include ${positiveFactors
      .map((f) => f.name.toLowerCase())
      .join(", ")}. `;
  }

  if (negativeFactors.length > 0) {
    reason += `However, ${negativeFactors
      .map((f) => f.name.toLowerCase())
      .join(", ")} may impact valuation. `;
  }

  reason += "Compare with similar listings in the area to validate pricing.";

  return {
    reason,
    factors,
    confidence: Math.min(0.85, 0.6 + factors.length * 0.05),
    source: "rule-based",
  };
}

export function explainPrice(property: {
  title?: string;
  listedPrice: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
}): PriceExplanation {
  // Use rule-based explanation (OpenAI integration can be added later)
  return generateRuleBasedExplanation(property);
}
