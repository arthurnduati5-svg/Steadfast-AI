import { FORBIDDEN_ADAPTIVE_TUNING_FIELDS } from '../contracts/adaptiveRecommendationTuningContracts';
import type { AdaptiveTuningPrivacyResult, AdaptiveTuningPolicyDecision, AdaptiveTuningReasonCode } from '../contracts/adaptiveRecommendationTuningContracts';

const FORBIDDEN_FIELDS_SET = new Set<string>(FORBIDDEN_ADAPTIVE_TUNING_FIELDS as unknown as string[]);

function containsForbiddenAdaptiveTuningFields(data: unknown, depth = 0): boolean {
  if (depth > 10 || typeof data !== 'object' || data === null) return false;
  for (const key of Object.keys(data as Record<string, unknown>)) {
    if (FORBIDDEN_FIELDS_SET.has(key)) return true;
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null) {
      if (containsForbiddenAdaptiveTuningFields(val, depth + 1)) return true;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'object' && item !== null) {
          if (containsForbiddenAdaptiveTuningFields(item, depth + 1)) return true;
        }
      }
    }
  }
  return false;
}

function findForbiddenAdaptiveTuningFields(data: unknown, depth = 0): string[] {
  if (depth > 10 || typeof data !== 'object' || data === null) return [];
  const found: string[] = [];
  for (const key of Object.keys(data as Record<string, unknown>)) {
    if (FORBIDDEN_FIELDS_SET.has(key)) found.push(key);
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null) {
      found.push(...findForbiddenAdaptiveTuningFields(val, depth + 1));
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === 'object' && item !== null) {
          found.push(...findForbiddenAdaptiveTuningFields(item, depth + 1));
        }
      }
    }
  }
  return [...new Set(found)];
}

function rejectForbiddenAdaptiveTuningFields(data: unknown): AdaptiveTuningPrivacyResult {
  const forbidden = findForbiddenAdaptiveTuningFields(data);
  if (forbidden.length > 0) {
    return {
      safe: false,
      policyDecision: 'blocked_forbidden_raw_field' as AdaptiveTuningPolicyDecision,
      forbiddenFieldsFound: forbidden,
      safeReasonCodes: ['forbidden_raw_field_detected' as AdaptiveTuningReasonCode],
    };
  }
  return {
    safe: true,
    policyDecision: 'allowed' as AdaptiveTuningPolicyDecision,
    forbiddenFieldsFound: [],
    safeReasonCodes: [],
  };
}

function redactForbiddenAdaptiveTuningFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (FORBIDDEN_FIELDS_SET.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      result[key] = redactForbiddenAdaptiveTuningFields(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      result[key] = val.map((item) =>
        typeof item === 'object' && item !== null
          ? redactForbiddenAdaptiveTuningFields(item as Record<string, unknown>)
          : item,
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

function assertSafeAdaptiveTuningInput(data: unknown): void {
  const result = rejectForbiddenAdaptiveTuningFields(data);
  if (!result.safe) {
    throw new Error(`Forbidden fields in input: ${result.forbiddenFieldsFound.join(', ')}`);
  }
}

function assertSafeAdaptiveTuningOutput(data: unknown): void {
  const result = rejectForbiddenAdaptiveTuningFields(data);
  if (!result.safe) {
    throw new Error(`Forbidden fields in output: ${result.forbiddenFieldsFound.join(', ')}`);
  }
}

function assertSafePreferenceFeedbackRecord(data: unknown): void {
  assertSafeAdaptiveTuningOutput(data);
}

function assertSafeChoiceSignalRecord(data: unknown): void {
  assertSafeAdaptiveTuningOutput(data);
}

function assertSafeTuningSnapshot(data: unknown): void {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.rawPrivateDataIncluded !== false) throw new Error('Snapshot must have rawPrivateDataIncluded: false');
    if (d.hiddenReasoningIncluded !== false) throw new Error('Snapshot must have hiddenReasoningIncluded: false');
    if (d.teacherOnlyDataIncluded !== false) throw new Error('Snapshot must have teacherOnlyDataIncluded: false');
    if (d.answerKeyIncluded !== false) throw new Error('Snapshot must have answerKeyIncluded: false');
  }
  assertSafeAdaptiveTuningOutput(data);
}

function assertSafeClosedLoopPersonalizationPacket(data: unknown): void {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (d.rawPrivateDataIncluded !== false) throw new Error('Packet must have rawPrivateDataIncluded: false');
    if (d.hiddenReasoningIncluded !== false) throw new Error('Packet must have hiddenReasoningIncluded: false');
  }
  assertSafeAdaptiveTuningOutput(data);
}

export {
  containsForbiddenAdaptiveTuningFields,
  findForbiddenAdaptiveTuningFields,
  rejectForbiddenAdaptiveTuningFields,
  redactForbiddenAdaptiveTuningFields,
  assertSafeAdaptiveTuningInput,
  assertSafeAdaptiveTuningOutput,
  assertSafePreferenceFeedbackRecord,
  assertSafeChoiceSignalRecord,
  assertSafeTuningSnapshot,
  assertSafeClosedLoopPersonalizationPacket,
};
