import { runAgenticEvaluation, OrchestratorPropertyInput } from "./orchestrator";
import { UserGoalInput } from "./types";

export interface ProactiveWorkflowInput {
  goals: UserGoalInput[];
  listings: OrchestratorPropertyInput[];
}

export interface ProactiveWorkflowItem {
  goal: UserGoalInput;
  topPickId?: string;
  topRecommendation: string;
}

export async function runProactiveWorkflow(
  input: ProactiveWorkflowInput
): Promise<ProactiveWorkflowItem[]> {
  const outputs: ProactiveWorkflowItem[] = [];

  for (const goal of input.goals) {
    let bestScore = Number.NEGATIVE_INFINITY;
    let bestListing: OrchestratorPropertyInput | undefined;
    let bestRecommendation = "No listing matched this goal.";

    for (const listing of input.listings) {
      const peers = input.listings.filter((item) => item.id !== listing.id);
      const result = await runAgenticEvaluation(goal, listing, peers);

      const score =
        -result.evaluation.fairValue.deltaVsListed +
        result.evaluation.forecast.projectedReturnPct -
        (result.evaluation.fraudRisk[0]?.riskScore ?? 0) * 100;

      if (score > bestScore) {
        bestScore = score;
        bestListing = listing;
        bestRecommendation = result.evaluation.recommendation;
      }
    }

    outputs.push({
      goal,
      topPickId: bestListing?.id,
      topRecommendation: bestRecommendation,
    });
  }

  return outputs;
}
