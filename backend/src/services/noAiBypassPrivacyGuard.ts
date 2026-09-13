import { NO_AI_BYPASS_FORBIDDEN_FIELDS } from '../contracts/noAiBypassContracts';

const forbiddenFieldSet = new Set<string>(NO_AI_BYPASS_FORBIDDEN_FIELDS as unknown as string[]);

function findForbiddenFields(obj: unknown, path: string = ''): string[] {
  const found: string[] = [];
  if (!obj || typeof obj !== 'object') return found;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (forbiddenFieldSet.has(key)) {
      found.push(fullPath);
    }
    if (typeof value === 'object' && value !== null) {
      found.push(...findForbiddenFields(value, fullPath));
    }
  }
  return found;
}

function containsForbiddenFields(obj: unknown): boolean {
  return findForbiddenFields(obj).length > 0;
}

function rejectForbiddenFields(
  obj: unknown,
): { valid: true } | { valid: false; forbiddenFields: string[] } {
  const found = findForbiddenFields(obj);
  if (found.length > 0) return { valid: false, forbiddenFields: found };
  return { valid: true };
}

function redactForbiddenFields(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (forbiddenFieldSet.has(key)) continue;
    if (typeof value === 'object' && value !== null) {
      result[key] = redactForbiddenFields(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function assertSafeInput(obj: unknown): void {
  const found = findForbiddenFields(obj);
  if (found.length > 0) {
    throw new Error(`Input contains forbidden fields: ${found.join(', ')}`);
  }
}

function assertSafeOutput(obj: unknown): void {
  assertSafeInput(obj);
}

function assertSafeAuditEvent(obj: unknown): void {
  assertSafeInput(obj);
}

function assertNoProviderPromptOrResponse(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key] of Object.entries(obj as Record<string, unknown>)) {
    const kl = key.toLowerCase();
    if (kl.includes('providerprompt') || kl.includes('providerresponse') || kl.includes('aiprompt') || kl.includes('airesponse')) {
      throw new Error(`Forbidden provider field: ${key}`);
    }
  }
}

function assertNoHiddenReasoning(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key] of Object.entries(obj as Record<string, unknown>)) {
    const kl = key.toLowerCase();
    if (kl.includes('hiddenreasoning') || kl.includes('chainofthought') || kl.includes('internalreasoning') || kl.includes('modelreasoning') || kl.includes('reasoningtrace') || kl.includes('scratchpad')) {
      throw new Error(`Forbidden reasoning field: ${key}`);
    }
  }
}

function assertNoProtectedAnswers(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key] of Object.entries(obj as Record<string, unknown>)) {
    const kl = key.toLowerCase();
    if (kl.includes('answerkey') || kl.includes('markingscheme') || kl.includes('modelanswer') || kl.includes('correctanswer') || kl.includes('expectedanswer')) {
      throw new Error(`Forbidden answer field: ${key}`);
    }
  }
}

function assertNoTeacherOnlyData(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key] of Object.entries(obj as Record<string, unknown>)) {
    const kl = key.toLowerCase();
    if (kl.includes('teacheronly') || kl.includes('teacherreport')) {
      throw new Error(`Forbidden teacher-only field: ${key}`);
    }
  }
}

function assertNoCredentials(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const kl = key.toLowerCase();
    if (kl === 'token' || kl === 'apikey' || kl === 'authorization' || kl === 'cookie' || kl === 'privatekey' || kl === 'databaseurl' || kl === 'connectionstring') {
      throw new Error(`Forbidden credential field: ${key}`);
    }
    if (typeof value === 'object' && value !== null) {
      assertNoCredentials(value);
    }
  }
}

export {
  findForbiddenFields,
  containsForbiddenFields,
  rejectForbiddenFields,
  redactForbiddenFields,
  assertSafeInput,
  assertSafeOutput,
  assertSafeAuditEvent,
  assertNoProviderPromptOrResponse,
  assertNoHiddenReasoning,
  assertNoProtectedAnswers,
  assertNoTeacherOnlyData,
  assertNoCredentials,
};
