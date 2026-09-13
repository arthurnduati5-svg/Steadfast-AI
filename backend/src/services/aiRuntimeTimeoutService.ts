import type { AiTimeoutPolicy } from '../contracts/aiRuntimeReliabilityContracts';
import { classifyAiProviderError } from './aiProviderErrorClassifierService';

const DEFAULT_TIMEOUTS: Record<string, { timeoutMs: number; hardDeadlineMs: number }> = {
  chat_completion: { timeoutMs: 30000, hardDeadlineMs: 60000 },
  tool_call: { timeoutMs: 15000, hardDeadlineMs: 30000 },
  embedding: { timeoutMs: 10000, hardDeadlineMs: 20000 },
  classification: { timeoutMs: 15000, hardDeadlineMs: 30000 },
  unknown: { timeoutMs: 30000, hardDeadlineMs: 60000 },
};

export function getAiTimeoutPolicy(input: {
  operation: AiTimeoutPolicy['operation'];
  overrideMs?: number;
}): AiTimeoutPolicy {
  const defaults = DEFAULT_TIMEOUTS[input.operation] || DEFAULT_TIMEOUTS.unknown;
  return {
    operation: input.operation,
    timeoutMs: input.overrideMs ?? defaults.timeoutMs,
    hardDeadlineMs: Math.max(input.overrideMs ?? defaults.timeoutMs, defaults.hardDeadlineMs),
  };
}

export async function runWithAiTimeout<T>(input: {
  operation: AiTimeoutPolicy['operation'];
  timeoutMs?: number;
  fn: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  const policy = getAiTimeoutPolicy({
    operation: input.operation,
    overrideMs: input.timeoutMs,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), policy.timeoutMs);

  try {
    const result = await input.fn(controller.signal);
    return result;
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error(`AI operation timed out after ${policy.timeoutMs}ms`);
      timeoutError.name = 'AiTimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
