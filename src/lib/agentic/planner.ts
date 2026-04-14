import { AgentTask, PlannerOutput, UserGoalInput } from "./types";

export function planGoal(input: UserGoalInput): PlannerOutput {
  const normalizedGoal: UserGoalInput = {
    ...input,
    horizonMonths: input.horizonMonths ?? 24,
  };

  const tasks: AgentTask[] = [
    {
      id: "task_search",
      type: "search",
      description: "Find candidate listings matching location, budget, and constraints.",
    },
    {
      id: "task_vision",
      type: "vision",
      description: "Score property condition and neighborhood imagery quality.",
      dependsOn: ["task_search"],
    },
    {
      id: "task_sentiment",
      type: "sentiment",
      description: "Collect external sentiment for locality and developer mentions.",
      dependsOn: ["task_search"],
    },
    {
      id: "task_valuation",
      type: "valuation",
      description: "Estimate fair market price and explain drivers.",
      dependsOn: ["task_vision", "task_sentiment"],
    },
    {
      id: "task_risk",
      type: "risk",
      description: "Detect suspicious duplicate/fraud clusters across listings.",
      dependsOn: ["task_search"],
    },
    {
      id: "task_forecast",
      type: "forecast",
      description: "Forecast 12-24 month value trajectory.",
      dependsOn: ["task_valuation", "task_sentiment"],
    },
    {
      id: "task_negotiate",
      type: "negotiate",
      description: "Draft defect-aware counter-offer communication.",
      dependsOn: ["task_valuation", "task_risk"],
    },
    {
      id: "task_report",
      type: "report",
      description: "Synthesize outputs into recommendation and trust summary.",
      dependsOn: [
        "task_valuation",
        "task_risk",
        "task_forecast",
        "task_negotiate",
      ],
    },
  ];

  return {
    normalizedGoal,
    tasks,
  };
}
