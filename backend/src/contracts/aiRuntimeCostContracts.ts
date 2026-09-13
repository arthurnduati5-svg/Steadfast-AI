export type AiTokenEstimate = {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
};

export type AiCostBudgetConfig = {
  maxTokensPerRequest: number;
  maxDailyInputTokensPerStudent: number;
  maxDailyOutputTokensPerStudent: number;
  maxDailyInputTokensPerSchool: number;
  maxDailyOutputTokensPerSchool: number;
  maxDailyInputTokensPerProvider: number;
  maxDailyOutputTokensPerProvider: number;
  costPerInputTokenMinorUnits: number;
  costPerOutputTokenMinorUnits: number;
};

export const DEFAULT_AI_COST_BUDGET_CONFIG: AiCostBudgetConfig = {
  maxTokensPerRequest: 16000,
  maxDailyInputTokensPerStudent: 100000,
  maxDailyOutputTokensPerStudent: 50000,
  maxDailyInputTokensPerSchool: 5000000,
  maxDailyOutputTokensPerSchool: 2500000,
  maxDailyInputTokensPerProvider: 10000000,
  maxDailyOutputTokensPerProvider: 5000000,
  costPerInputTokenMinorUnits: 1,
  costPerOutputTokenMinorUnits: 3,
};
