import { FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS } from '../contracts/studentLearningSessionContracts';

const forbiddenSet = new Set<string>(FORBIDDEN_STUDENT_LEARNING_SESSION_FIELDS);

function findFields(data: unknown): string[] {
  const found: string[] = [];
  try {
    if (!data || typeof data !== 'object') return found;
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        found.push(...findFields(data[i]));
      }
      return found;
    }
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (forbiddenSet.has(key)) {
        found.push(key);
      }
      if (val && typeof val === 'object') {
        found.push(...findFields(val));
      }
    }
  } catch {
    return found;
  }
  return found;
}

export function containsForbiddenStudentLearningSessionFields(data: unknown): boolean {
  return findFields(data).length > 0;
}

export function findForbiddenStudentLearningSessionFields(data: unknown): string[] {
  return findFields(data);
}

export function rejectForbiddenStudentLearningSessionFields(data: unknown): void {
  const found = findFields(data);
  if (found.length > 0) {
    throw new Error(`Forbidden student learning session fields detected: ${found.join(', ')}`);
  }
}

export function redactForbiddenStudentLearningSessionFields(data: Record<string, unknown>): Record<string, unknown> {
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, unknown> = {};
  if (Array.isArray(data)) return data.map(v => v && typeof v === 'object' ? redactForbiddenStudentLearningSessionFields(v as Record<string, unknown>) : v) as unknown as Record<string, unknown>;
  for (const [key, val] of Object.entries(data)) {
    if (forbiddenSet.has(key)) continue;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = redactForbiddenStudentLearningSessionFields(val as Record<string, unknown>);
    } else if (Array.isArray(val)) {
      result[key] = val.map((v: unknown) => v && typeof v === 'object' ? redactForbiddenStudentLearningSessionFields(v as Record<string, unknown>) : v);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function throwIfUnsafe(data: unknown, context: string): void {
  const found = findFields(data);
  if (found.length > 0) {
    throw new Error(`Forbidden fields in ${context}: ${found.join(', ')}`);
  }
}

function failClosed<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ...args: TArgs): void {
  try {
    fn(...args);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith('Forbidden fields')) throw e;
    throw new Error('Safety inspection failed — treating as unsafe');
  }
}

export function assertSafeStudentLearningSessionInput(data: unknown): void {
  failClosed(throwIfUnsafe, data, 'input');
}

export function assertSafeStudentLearningSessionOutput(data: unknown): void {
  failClosed(throwIfUnsafe, data, 'output');
}

export function assertSafeStudentLearningSessionRecord(record: unknown): void {
  failClosed(throwIfUnsafe, record, 'StudentLearningSessionRecord');
}

export function assertSafeStudentLearningSessionSnapshot(snapshot: unknown): void {
  failClosed(throwIfUnsafe, snapshot, 'StudentLearningSessionSnapshot');
}

export function assertSafeStudentLearningSessionResumeContext(context: unknown): void {
  failClosed(throwIfUnsafe, context, 'StudentLearningSessionResumeContext');
}

export function assertSafeStudentLearningSessionExitSummary(summary: unknown): void {
  failClosed(throwIfUnsafe, summary, 'StudentLearningSessionExitSummary');
}

export function assertSafeStudentLearningSessionAuditEvent(event: unknown): void {
  failClosed(throwIfUnsafe, event, 'StudentLearningSessionAuditEvent');
}
