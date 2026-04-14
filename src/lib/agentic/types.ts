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
}
