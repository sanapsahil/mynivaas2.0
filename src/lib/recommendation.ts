// Recommendation engine module - matches properties against user preferences

export interface UserPreferences {
  budget?: {
    min: number;
    max: number;
  };
  location?: string[];
  bedrooms?: number;
  bathrooms?: number;
  areaSqftMin?: number;
  propertyType?: string;
  maxCommute?: number; // in km
  minConditionScore?: number;
  investmentHorizon?: number; // in months
}

export interface PropertyForRecommendation {
  id: string;
  title: string;
  listedPrice: number;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
  fairValue?: number; // from valuation
}

export interface RecommendationResult {
  propertyId: string;
  matchScore: number; // 0-100
  matchReasons: string[];
  mismatchReasons: string[];
  priority: "high" | "medium" | "low";
}

function calculateBudgetMatch(
  price: number,
  budget: UserPreferences["budget"]
): { score: number; reason: string } {
  if (!budget) {
    return { score: 100, reason: "No budget constraint" };
  }

  if (price < budget.min) {
    return {
      score: 120,
      reason: `Below budget range by ₹${(budget.min - price) / 100000}L`,
    };
  }

  if (price > budget.max) {
    const excessPct = Math.round(((price - budget.max) / budget.max) * 100);
    return {
      score: Math.max(0, 100 - excessPct),
      reason: `Exceeds budget by ${excessPct}%`,
    };
  }

  // Within budget
  const midBudget = (budget.min + budget.max) / 2;
  const distanceFromMid = Math.abs(price - midBudget);
  const budgetRange = budget.max - budget.min;
  const score = Math.max(60, 100 - (distanceFromMid / budgetRange) * 40);

  return { score, reason: "Within budget range" };
}

function calculateLocationMatch(
  propertyLocation: string,
  preferredLocations: string[] | undefined
): { score: number; reason: string } {
  if (!preferredLocations || preferredLocations.length === 0) {
    return { score: 50, reason: "No location preference specified" };
  }

  const lowerPropertyLocation = propertyLocation.toLowerCase();

  for (const prefLocation of preferredLocations) {
    if (lowerPropertyLocation.includes(prefLocation.toLowerCase())) {
      return {
        score: 100,
        reason: `Matches preferred location: ${prefLocation}`,
      };
    }
  }

  // Partial match
  for (const prefLocation of preferredLocations) {
    if (
      lowerPropertyLocation.includes(prefLocation.toLowerCase().split(" ")[0])
    ) {
      return { score: 60, reason: `Partial location match` };
    }
  }

  return { score: 20, reason: `Not in preferred locations` };
}

function calculateBedroomMatch(
  bedrooms: number | undefined,
  preferredBedrooms: number | undefined
): { score: number; reason: string } {
  if (!preferredBedrooms) {
    return { score: 50, reason: "No bedroom preference" };
  }

  if (!bedrooms) {
    return { score: 30, reason: "Bedroom count not available" };
  }

  if (bedrooms === preferredBedrooms) {
    return { score: 100, reason: `Exact match: ${bedrooms} BHK` };
  }

  const diff = Math.abs(bedrooms - preferredBedrooms);
  if (diff === 1) {
    return {
      score: 70,
      reason: `Close match: ${bedrooms} BHK vs ${preferredBedrooms} BHK desired`,
    };
  }

  const score = Math.max(0, 100 - diff * 15);
  return {
    score,
    reason: `${bedrooms} BHK available (${preferredBedrooms} BHK preferred)`,
  };
}

function calculateConditionMatch(
  conditionScore: number | undefined,
  minCondition: number | undefined
): { score: number; reason: string } {
  if (!minCondition) {
    return { score: 50, reason: "No condition requirement" };
  }

  if (conditionScore === undefined) {
    return { score: 40, reason: "Condition score not available" };
  }

  if (conditionScore >= minCondition) {
    const bonus = Math.min(30, (conditionScore - minCondition) * 5);
    return {
      score: 100 + bonus,
      reason: `Condition score ${conditionScore}/10 exceeds minimum ${minCondition}`,
    };
  }

  return {
    score: (conditionScore / minCondition) * 70,
    reason: `Condition score ${conditionScore}/10 below minimum ${minCondition}`,
  };
}

function calculateEnvironmentMatch(
  greeneryIndex: number | undefined,
  trafficIndex: number | undefined
): { score: number; reason: string } {
  let score = 50;
  const reasons: string[] = [];

  if (greeneryIndex !== undefined) {
    if (greeneryIndex > 60) {
      score += 20;
      reasons.push("Good greenery index");
    } else if (greeneryIndex < 30) {
      score -= 15;
      reasons.push("Low greenery");
    }
  }

  if (trafficIndex !== undefined) {
    if (trafficIndex < 40) {
      score += 15;
      reasons.push("Low traffic");
    } else if (trafficIndex > 70) {
      score -= 15;
      reasons.push("High traffic congestion");
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reason: reasons.join(", ") || "Average environment quality",
  };
}

export function getRecommendations(
  properties: PropertyForRecommendation[],
  userPreferences: UserPreferences
): RecommendationResult[] {
  return properties
    .map((property) => {
      const matchReasons: string[] = [];
      const mismatchReasons: string[] = [];
      let totalScore = 0;
      let scoreCount = 0;

      // Budget match
      const budgetMatch = calculateBudgetMatch(
        property.listedPrice,
        userPreferences.budget
      );
      totalScore += budgetMatch.score;
      scoreCount++;
      if (budgetMatch.score >= 70) {
        matchReasons.push(budgetMatch.reason);
      } else {
        mismatchReasons.push(budgetMatch.reason);
      }

      // Location match
      const locationMatch = calculateLocationMatch(
        property.location,
        userPreferences.location
      );
      totalScore += locationMatch.score;
      scoreCount++;
      if (locationMatch.score >= 70) {
        matchReasons.push(locationMatch.reason);
      } else {
        mismatchReasons.push(locationMatch.reason);
      }

      // Bedroom match
      const bedroomMatch = calculateBedroomMatch(
        property.bedrooms,
        userPreferences.bedrooms
      );
      totalScore += bedroomMatch.score;
      scoreCount++;
      if (bedroomMatch.score >= 70) {
        matchReasons.push(bedroomMatch.reason);
      } else {
        mismatchReasons.push(bedroomMatch.reason);
      }

      // Condition match
      const conditionMatch = calculateConditionMatch(
        property.conditionScore,
        userPreferences.minConditionScore
      );
      totalScore += conditionMatch.score;
      scoreCount++;
      if (conditionMatch.score >= 70) {
        matchReasons.push(conditionMatch.reason);
      } else {
        mismatchReasons.push(conditionMatch.reason);
      }

      // Environment match
      const envMatch = calculateEnvironmentMatch(
        property.greeneryIndex,
        property.trafficCongestionIndex
      );
      totalScore += envMatch.score;
      scoreCount++;
      if (envMatch.score >= 60) {
        matchReasons.push(envMatch.reason);
      } else {
        mismatchReasons.push(envMatch.reason);
      }

      // Calculate average score (capped at 100)
      const matchScore = Math.min(100, Math.round(totalScore / scoreCount));

      // Determine priority based on match score
      let priority: "high" | "medium" | "low";
      if (matchScore >= 80) {
        priority = "high";
      } else if (matchScore >= 60) {
        priority = "medium";
      } else {
        priority = "low";
      }

      return {
        propertyId: property.id,
        matchScore,
        matchReasons,
        mismatchReasons,
        priority,
      };
    })
    .sort((a, b) => {
      // Sort by priority then score
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.matchScore - a.matchScore;
    });
}
