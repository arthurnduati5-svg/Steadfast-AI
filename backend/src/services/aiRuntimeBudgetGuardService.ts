import type { AiBudgetDecision } from '../contracts/aiRuntimeReliabilityContracts';
import { DEFAULT_AI_COST_BUDGET_CONFIG, type AiCostBudgetConfig } from '../contracts/aiRuntimeCostContracts';

type BudgetUsage = {
  inputTokens: number;
  outputTokens: number;
  costEstimateMinorUnits: number;
};

type BudgetKey = string;

const usageStore = new Map<BudgetKey, BudgetUsage>();

function makeKey(prefix: string, id: string, date: string): BudgetKey {
  return `${prefix}:${id}:${date}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getOrCreateUsage(key: BudgetKey): BudgetUsage {
  let u = usageStore.get(key);
  if (!u) {
    u = { inputTokens: 0, outputTokens: 0, costEstimateMinorUnits: 0 };
    usageStore.set(key, u);
  }
  return u;
}

export function estimateAiTokens(input: {
  text?: string;
  messages?: Array<{ role: string; content: string }>;
  maxOutputTokens?: number;
}): {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedTotalTokens: number;
} {
  let totalChars = 0;

  if (input.text) {
    totalChars += input.text.length;
  }

  if (input.messages) {
    for (const msg of input.messages) {
      totalChars += msg.content.length;
    }
  }

  const estimatedInputTokens = Math.ceil(totalChars / 4) + 10;
  const estimatedOutputTokens = input.maxOutputTokens ?? 500;
  const estimatedTotalTokens = estimatedInputTokens + estimatedOutputTokens;

  return { estimatedInputTokens, estimatedOutputTokens, estimatedTotalTokens };
}

export function checkAiBudget(input: {
  provider: string;
  model?: string;
  operation: string;
  actorType?: string;
  actorId?: string;
  schoolId?: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  config?: AiCostBudgetConfig;
}): AiBudgetDecision {
  const config = input.config ?? DEFAULT_AI_COST_BUDGET_CONFIG;
  const date = today();

  const estimatedTotal = input.estimatedInputTokens + input.estimatedOutputTokens;

  if (estimatedTotal > config.maxTokensPerRequest) {
    return {
      allowed: false,
      reason: 'estimated_tokens_exceed_limit',
      estimatedInputTokens: input.estimatedInputTokens,
      estimatedOutputTokens: input.estimatedOutputTokens,
      maxAllowedTokens: config.maxTokensPerRequest,
    };
  }

  if (input.actorType === 'student' && input.actorId) {
    const key = makeKey('student', input.actorId, date);
    const usage = getOrCreateUsage(key);
    if (usage.inputTokens + input.estimatedInputTokens > config.maxDailyInputTokensPerStudent) {
      return { allowed: false, reason: 'student_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyInputTokensPerStudent };
    }
    if (usage.outputTokens + input.estimatedOutputTokens > config.maxDailyOutputTokensPerStudent) {
      return { allowed: false, reason: 'student_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyOutputTokensPerStudent };
    }
  }

  if (input.schoolId) {
    const key = makeKey('school', input.schoolId, date);
    const usage = getOrCreateUsage(key);
    if (usage.inputTokens + input.estimatedInputTokens > config.maxDailyInputTokensPerSchool) {
      return { allowed: false, reason: 'school_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyInputTokensPerSchool };
    }
    if (usage.outputTokens + input.estimatedOutputTokens > config.maxDailyOutputTokensPerSchool) {
      return { allowed: false, reason: 'school_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyOutputTokensPerSchool };
    }
  }

  const providerKey = makeKey('provider', input.provider, date);
  const providerUsage = getOrCreateUsage(providerKey);
  if (providerUsage.inputTokens + input.estimatedInputTokens > config.maxDailyInputTokensPerProvider) {
    return { allowed: false, reason: 'provider_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyInputTokensPerProvider };
  }
  if (providerUsage.outputTokens + input.estimatedOutputTokens > config.maxDailyOutputTokensPerProvider) {
    return { allowed: false, reason: 'provider_budget_exceeded', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens, maxAllowedTokens: config.maxDailyOutputTokensPerProvider };
  }

  return { allowed: true, reason: 'allowed', estimatedInputTokens: input.estimatedInputTokens, estimatedOutputTokens: input.estimatedOutputTokens };
}

export function recordAiBudgetUsage(input: {
  provider: string;
  model?: string;
  operation: string;
  actorType?: string;
  actorId?: string;
  schoolId?: string;
  inputTokens: number;
  outputTokens: number;
  costEstimateMinorUnits?: number;
}): void {
  const date = today();
  const cost = input.costEstimateMinorUnits ?? (input.inputTokens * 1 + input.outputTokens * 3);

  if (input.actorType === 'student' && input.actorId) {
    const key = makeKey('student', input.actorId, date);
    const usage = getOrCreateUsage(key);
    usage.inputTokens += input.inputTokens;
    usage.outputTokens += input.outputTokens;
    usage.costEstimateMinorUnits += cost;
  }

  if (input.schoolId) {
    const key = makeKey('school', input.schoolId, date);
    const usage = getOrCreateUsage(key);
    usage.inputTokens += input.inputTokens;
    usage.outputTokens += input.outputTokens;
    usage.costEstimateMinorUnits += cost;
  }

  const providerKey = makeKey('provider', input.provider, date);
  const providerUsage = getOrCreateUsage(providerKey);
  providerUsage.inputTokens += input.inputTokens;
  providerUsage.outputTokens += input.outputTokens;
  providerUsage.costEstimateMinorUnits += cost;
}

export function resetAiBudgetStateForTests(): void {
  usageStore.clear();
}
