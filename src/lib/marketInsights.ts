// Market insights module - price trends, demand levels, and investment ratings

export interface MarketInsights {
  location: string;
  priceTrend: "up" | "down" | "stable";
  trendMagnitude: number; // percentage change over period
  demandLevel: "high" | "medium" | "low";
  investmentRating: "excellent" | "good" | "moderate" | "caution";
  summary: string;
  insights: string[];
}

// Simple market dataset for common locations (in INR per sq ft, approximate)
const MARKET_DATA: Record<
  string,
  {
    avgPrice: number;
    trend: number; // monthly growth %
    demandLevel: "high" | "medium" | "low";
  }
> = {
  bangalore: {
    avgPrice: 8500,
    trend: 1.2,
    demandLevel: "high",
  },
  "south bangalore": {
    avgPrice: 10000,
    trend: 1.5,
    demandLevel: "high",
  },
  hyderabad: {
    avgPrice: 5500,
    trend: 1.8,
    demandLevel: "high",
  },
  delhi: {
    avgPrice: 9000,
    trend: 0.8,
    demandLevel: "medium",
  },
  "south delhi": {
    avgPrice: 12000,
    trend: 0.5,
    demandLevel: "medium",
  },
  gurgaon: {
    avgPrice: 7500,
    trend: 1.0,
    demandLevel: "high",
  },
  noida: {
    avgPrice: 5000,
    trend: 1.3,
    demandLevel: "medium",
  },
  pune: {
    avgPrice: 7000,
    trend: 2.0,
    demandLevel: "high",
  },
  mumbai: {
    avgPrice: 15000,
    trend: 0.3,
    demandLevel: "low",
  },
  kolkata: {
    avgPrice: 3500,
    trend: 1.0,
    demandLevel: "medium",
  },
};

function findMarketData(
  location: string
): { avgPrice: number; trend: number; demandLevel: "high" | "medium" | "low" } | null {
  const lowerLocation = location.toLowerCase();

  // Exact or partial match
  for (const [key, data] of Object.entries(MARKET_DATA)) {
    if (lowerLocation.includes(key) || key.includes(lowerLocation)) {
      return data;
    }
  }

  // Default fallback
  return {
    avgPrice: 7000,
    trend: 1.0,
    demandLevel: "medium",
  };
}

function calculatePriceTrend(
  historicalMonthlyGrowth: number
): { trend: "up" | "down" | "stable"; magnitude: number } {
  if (historicalMonthlyGrowth > 0.5) {
    return { trend: "up", magnitude: historicalMonthlyGrowth };
  } else if (historicalMonthlyGrowth < -0.5) {
    return { trend: "down", magnitude: Math.abs(historicalMonthlyGrowth) };
  } else {
    return { trend: "stable", magnitude: 0 };
  }
}

function calculateInvestmentRating(
  demand: "high" | "medium" | "low",
  trend: "up" | "down" | "stable",
  trendMagnitude: number
): "excellent" | "good" | "moderate" | "caution" {
  if (demand === "high" && trend === "up") {
    if (trendMagnitude > 1.5) {
      return "excellent";
    }
    return "good";
  }

  if (demand === "high" && trend === "stable") {
    return "good";
  }

  if (demand === "medium" && trend === "up") {
    return "good";
  }

  if (demand === "medium" && trend === "stable") {
    return "moderate";
  }

  if (demand === "high" && trend === "down") {
    return "moderate";
  }

  if (demand === "low" || trend === "down") {
    return "caution";
  }

  return "moderate";
}

export function getMarketInsights(location: string): MarketInsights {
  const marketData = findMarketData(location);

  if (!marketData) {
    return {
      location,
      priceTrend: "stable",
      trendMagnitude: 0,
      demandLevel: "medium",
      investmentRating: "moderate",
      summary: "Limited market data available for this location.",
      insights: ["Conduct local market research before investing"],
    };
  }

  const { trend: priceTrend, magnitude: trendMagnitude } =
    calculatePriceTrend(marketData.trend);

  const investmentRating = calculateInvestmentRating(
    marketData.demandLevel,
    priceTrend,
    trendMagnitude
  );

  // Generate insights
  const insights: string[] = [];

  if (priceTrend === "up") {
    insights.push(
      `${location} is experiencing ${trendMagnitude.toFixed(1)}% monthly price growth - strong appreciation potential`
    );
  } else if (priceTrend === "down") {
    insights.push(
      `Price declining at ${trendMagnitude.toFixed(1)}% monthly - wait for market stabilization`
    );
  } else {
    insights.push(`${location} market is stable - predictable appreciation`);
  }

  if (marketData.demandLevel === "high") {
    insights.push(
      "High demand indicates strong rental yields and resale potential"
    );
  } else if (marketData.demandLevel === "medium") {
    insights.push("Moderate demand - good balance between growth and stability");
  } else {
    insights.push(
      "Low demand - limited liquidity, consider risk vs. potential upside"
    );
  }

  // Average price context
  insights.push(
    `Average market price: ₹${marketData.avgPrice}/sq. ft. - validate against listing`
  );

  // Investment recommendation
  if (investmentRating === "excellent") {
    insights.push(
      "Excellent investment opportunity - high growth potential with strong demand"
    );
  } else if (investmentRating === "good") {
    insights.push(
      "Good investment prospect - solid fundamentals and growth trajectory"
    );
  } else if (investmentRating === "moderate") {
    insights.push(
      "Moderate opportunity - suitable for risk-aware investors with longer horizon"
    );
  } else {
    insights.push(
      "Proceed with caution - monitor market trends before committing capital"
    );
  }

  const summary =
    `${location} currently shows a ${priceTrend} price trend with ${marketData.demandLevel} demand. ` +
    `Investment outlook is ${investmentRating}. ` +
    `Monitor market fundamentals and compare pricing against comparable properties before making investment decisions.`;

  return {
    location,
    priceTrend,
    trendMagnitude,
    demandLevel: marketData.demandLevel,
    investmentRating,
    summary,
    insights,
  };
}
