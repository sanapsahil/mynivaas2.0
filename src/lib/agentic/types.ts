export type AgentTaskType =
  | "search"
  | "valuation"
  | "risk"
  | "vision"
  | "forecast"
  | "sentiment"
  | "negotiate"
  | "report";

export interface UserGoalInput {
  goal: string;
  location?: string;
  budget?: number;
  propertyType?: string;
  bedrooms?: number;
  horizonMonths?: number;
}

export interface AgentTask {
  id: string;
  type: AgentTaskType;
  description: string;
  dependsOn?: string[];
}

export interface PlannerOutput {
  normalizedGoal: UserGoalInput;
  tasks: AgentTask[];
}

export interface DefectInsight {
  code: string;
  label: string;
  severity: "low" | "medium" | "high";
  evidence: string;
}

export interface ValuationInput {
  listedPrice: number;
  areaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  locationScore?: number;
  conditionScore?: number;
  greeneryIndex?: number;
  trafficCongestionIndex?: number;
  sentimentScore?: number;
  nearbyInfraScore?: number;
  comparableMedianPrice?: number;
  comparableCount?: number;
  visualFeature?: number; // EfficientNet visual feature (5-10% weight)
}

export interface FeatureContribution {
  feature: string;
  contribution: number;
  rationale: string;
}

export interface ValuationOutput {
  fairPrice: number;
  confidence: number;
  deltaVsListed: number;
  modelType: "dnn-surrogate" | "xgboost-surrogate";
  contributions: FeatureContribution[];
}

export interface ForecastInput {
  currentPrice: number;
  horizonMonths: number;
  monthlyGrowthBase?: number;
  repoRateTrend?: number;
  infrastructureBoost?: number;
  sentimentDrift?: number;
}

export interface ForecastPoint {
  month: number;
  predictedPrice: number;
}

export interface ForecastOutput {
  architecture: "lstm-surrogate" | "gru-surrogate";
  horizonMonths: number;
  projectedReturnPct: number;
  points: ForecastPoint[];
}

export interface FraudNode {
  id: string;
  imageHash?: string;
  phone?: string;
  brokerId?: string;
  price: number;
  location: string;
  title: string;
}

export interface FraudCluster {
  clusterId: string;
  listingIds: string[];
  riskScore: number;
  reasons: string[];
}

export interface NegotiationInput {
  propertyTitle: string;
  listedPrice: number;
  fairPrice: number;
  defects: DefectInsight[];
  buyerName?: string;
}

export interface NegotiationOutput {
  counterOfferPrice: number;
  discountPct: number;
  emailSubject: string;
  emailBody: string;
}

export interface SentimentOutput {
  query: string;
  score: number;
  confidence: number;
  highlights: string[];
  sources: string[];
}

// New feature interfaces for extended intelligence platform

export interface FraudAnalysis {
  trustScore: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  details: {
    titleDuplicate: boolean;
    suspiciousKeywords: string[];
    priceAnomaly: boolean;
  };
}

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

export interface Facility {
  name: string;
  type: string;
  distance: string;
  category: string;
}

export interface NeighborhoodReport {
  location: string;
  livabilityScore: number;
  safetyRating: number;
  summary: string;
  highlights: string[];
  facilities: Facility[];
  amenityScore: number;
  infrastructureScore: number;
}

export interface MarketInsights {
  location: string;
  priceTrend: "up" | "down" | "stable";
  trendMagnitude: number;
  demandLevel: "high" | "medium" | "low";
  investmentRating: "excellent" | "good" | "moderate" | "caution";
  summary: string;
  insights: string[];
}

export interface RecommendationResult {
  propertyId: string;
  matchScore: number;
  matchReasons: string[];
  mismatchReasons: string[];
  priority: "high" | "medium" | "low";
}

export interface AgenticEvaluation {
  fairValue: ValuationOutput;
  forecast: ForecastOutput;
  fraudRisk: FraudCluster[];
  defects: DefectInsight[];
  sentiment: SentimentOutput;
  negotiation: NegotiationOutput;
  recommendation: string;
  accuracy: {
    overallConfidence: number;
    isHighConfidence: boolean;
    passesStrictChecks: boolean;
    failedChecks: string[];
    comparableCount: number;
    dataSources: Array<{
      name: string;
      source: string;
      confidence: number;
      notes: string;
    }>;
  };
  // Extended intelligence features (optional)
  fraudAnalysis?: FraudAnalysis;
  priceExplanation?: PriceExplanation;
  neighborhoodReport?: NeighborhoodReport;
  marketInsights?: MarketInsights;
  recommendations?: RecommendationResult[];
}
