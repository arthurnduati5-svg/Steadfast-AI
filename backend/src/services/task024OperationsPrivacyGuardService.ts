import type { Task024OperationsPrivacyGuardResult } from '../contracts/task024OperationsReadinessContracts';
import { TASK024_FORBIDDEN_OPERATION_FIELDS } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepStripForbidden(obj: unknown, path: string[] = []): { result: unknown; stripped: string[] } {
  if (obj === null || obj === undefined) return { result: obj, stripped: [] };
  if (typeof obj === 'string') return { result: obj, stripped: [] };
  if (typeof obj === 'number' || typeof obj === 'boolean') return { result: obj, stripped: [] };

  if (Array.isArray(obj)) {
    const stripped: string[] = [];
    const mapped = obj.map((item, i) => {
      const { result: r, stripped: s } = deepStripForbidden(item, [...path, `[${i}]`]);
      stripped.push(...s);
      return r;
    });
    return { result: mapped, stripped };
  }

  if (isRecord(obj)) {
    const result: Record<string, unknown> = {};
    const stripped: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const upperKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
      const isForbidden = TASK024_FORBIDDEN_OPERATION_FIELDS.some(f => f.toUpperCase() === upperKey || f === key);
      if (isForbidden) {
        stripped.push([...path, key].join('.'));
        result[key] = '[REDACTED]';
      } else {
        const { result: r, stripped: s } = deepStripForbidden(value, [...path, key]);
        result[key] = r;
        stripped.push(...s);
      }
    }
    return { result, stripped };
  }
  return { result: obj, stripped: [] };
}

export function redactOperationsPayload(input: Record<string, unknown>): Record<string, unknown> {
  const { result } = deepStripForbidden(input);
  return result as Record<string, unknown>;
}

export function stripSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripRawLearnerData(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripRawSafeguardingData(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripPrivateDeenText(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripProviderPayloads(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripAnswerArtifacts(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function stripRawBackupRestorePayloads(obj: Record<string, unknown>): Record<string, unknown> {
  return redactOperationsPayload(obj);
}

export function detectForbiddenOperationFields(input: Record<string, unknown>): string[] {
  const { stripped } = deepStripForbidden(input);
  return stripped;
}

export async function evaluateOperationsPrivacy(input: Record<string, unknown>): Promise<Task024OperationsPrivacyGuardResult> {
  const forbiddenFields = detectForbiddenOperationFields(input);
  const secretsStripped = forbiddenFields.some(f =>
    f.toUpperCase().includes('SECRET') || f.toUpperCase().includes('KEY') || f.toUpperCase().includes('TOKEN'));
  const rawLearnerDataStripped = forbiddenFields.some(f =>
    f.toLowerCase().includes('learner') || f.toLowerCase().includes('student'));
  const rawSafeguardingDataStripped = forbiddenFields.some(f => f.toLowerCase().includes('safeguarding'));
  const privateDeenTextStripped = forbiddenFields.some(f => f.toLowerCase().includes('deen'));
  const providerPayloadsStripped = forbiddenFields.some(f => f.toLowerCase().includes('provider'));
  const answerArtifactsStripped = forbiddenFields.some(f =>
    f.toLowerCase().includes('answer') || f.toLowerCase().includes('marking'));
  const rawBackupRestorePayloadsStripped = forbiddenFields.some(f =>
    f.toLowerCase().includes('backup') || f.toLowerCase().includes('restore') || f.toLowerCase().includes('dump'));

  const result: Task024OperationsPrivacyGuardResult = {
    passed: forbiddenFields.length === 0 || (secretsStripped && rawLearnerDataStripped && rawSafeguardingDataStripped && privateDeenTextStripped),
    secretsStripped,
    rawLearnerDataStripped,
    rawSafeguardingDataStripped,
    privateDeenTextStripped,
    providerPayloadsStripped,
    answerArtifactsStripped,
    rawBackupRestorePayloadsStripped,
    forbiddenFieldsDetected: forbiddenFields,
    safeSummary: forbiddenFields.length === 0
      ? 'Operations privacy guard: no forbidden fields detected'
      : `Forbidden fields detected and redacted: ${forbiddenFields.join(', ')}`,
  };
  await task024ReadinessRepository.recordOperationsPrivacyGuardResult(result);
  return result;
}

export async function buildOperationsPrivacyGuardResult(input: Record<string, unknown>): Promise<Task024OperationsPrivacyGuardResult> {
  return evaluateOperationsPrivacy(input);
}
