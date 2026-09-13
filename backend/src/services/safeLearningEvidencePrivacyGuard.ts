import { FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS } from '../contracts/safeLearningEvidenceContracts';

const forbiddenFieldSet = new Set<string>(FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS);

function recursiveFindForbidden(
  obj: unknown,
  path: string,
  results: Array<{ path: string; key: string }>,
): void {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      recursiveFindForbidden(obj[i], `${path}[${i}]`, results);
    }
    return;
  }
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (forbiddenFieldSet.has(key)) {
      results.push({ path: fullPath, key });
    }
    if (val && typeof val === 'object') {
      recursiveFindForbidden(val, fullPath, results);
    }
  }
}

function recursiveRedact(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => recursiveRedact(item));
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (forbiddenFieldSet.has(key)) {
      result[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      result[key] = recursiveRedact(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

export class SafeLearningEvidencePrivacyGuard {
  containsForbiddenEvidenceFields(input: unknown): boolean {
    return this.findForbiddenEvidenceFields(input).length > 0;
  }

  findForbiddenEvidenceFields(input: unknown): Array<{ path: string; key: string }> {
    const results: Array<{ path: string; key: string }> = [];
    recursiveFindForbidden(input, '', results);
    return results;
  }

  rejectForbiddenEvidenceFields(input: unknown): { allowed: boolean; forbidden: Array<{ path: string; key: string }> } {
    const forbidden = this.findForbiddenEvidenceFields(input);
    return { allowed: forbidden.length === 0, forbidden };
  }

  redactForbiddenEvidenceFields(input: unknown): unknown {
    return recursiveRedact(input);
  }

  assertSafeEvidenceInput(input: unknown): void {
    const forbidden = this.findForbiddenEvidenceFields(input);
    if (forbidden.length > 0) {
      const keys = forbidden.map((f) => f.key).join(', ');
      throw new Error(`Forbidden evidence fields detected in input: ${keys}`);
    }
  }

  assertSafeEvidenceOutput(output: unknown): void {
    const forbidden = this.findForbiddenEvidenceFields(output);
    if (forbidden.length > 0) {
      const keys = forbidden.map((f) => f.key).join(', ');
      throw new Error(`Forbidden evidence fields detected in output: ${keys}`);
    }
  }

  assertSafeTeacherEvidenceView(view: unknown): void {
    const forbidden = this.findForbiddenEvidenceFields(view);
    if (forbidden.length > 0) {
      const keys = forbidden.map((f) => f.key).join(', ');
      throw new Error(`Forbidden fields detected in teacher evidence view: ${keys}`);
    }
  }

  assertSafeLearnerEvidenceView(view: unknown): void {
    const forbidden = this.findForbiddenEvidenceFields(view);
    if (forbidden.length > 0) {
      const keys = forbidden.map((f) => f.key).join(', ');
      throw new Error(`Forbidden fields detected in learner evidence view: ${keys}`);
    }
  }
}

export const safeLearningEvidencePrivacyGuard = new SafeLearningEvidencePrivacyGuard();
