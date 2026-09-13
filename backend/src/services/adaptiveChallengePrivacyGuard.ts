import {
  FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS,
} from '../contracts/adaptiveChallengeContracts';

function findForbiddenFields(data: unknown, path = ''): string[] {
  const found: string[] = [];
  if (!data || typeof data !== 'object') return found;
  for (const key of Object.keys(data as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS.includes(key as any)) {
      found.push(fullPath);
    }
    const val = (data as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      found.push(...findForbiddenFields(val, fullPath));
    }
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (val[i] && typeof val[i] === 'object') {
          found.push(...findForbiddenFields(val[i], `${fullPath}[${i}]`));
        }
      }
    }
  }
  return found;
}

function redactForbiddenFields(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, unknown> = {};
  if (Array.isArray(data)) return data.map(v => v && typeof v === 'object' ? redactForbiddenFields(v) : v);
  for (const key of Object.keys(data as Record<string, unknown>)) {
    if (FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS.includes(key as any)) {
      result[key] = '[REDACTED]';
      continue;
    }
    const val = (data as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      result[key] = redactForbiddenFields(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((v: unknown) =>
        v && typeof v === 'object' ? redactForbiddenFields(v) : v
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function containsForbiddenAdaptiveChallengeFields(data: unknown): boolean {
  return findForbiddenFields(data).length > 0;
}

export function rejectForbiddenAdaptiveChallengeFields(data: unknown): {
  safe: boolean;
  found: string[];
} {
  const found = findForbiddenFields(data);
  return { safe: found.length === 0, found };
}

export function redactForbiddenAdaptiveChallengeFields<T>(data: T): T {
  return redactForbiddenFields(data) as T;
}

export function assertSafeAdaptiveChallengeInput(data: unknown): void {
  const { safe, found } = rejectForbiddenAdaptiveChallengeFields(data);
  if (!safe) {
    throw new Error(`Forbidden fields in input: ${found.join(', ')}`);
  }
}

export function assertSafeAdaptiveChallengeOutput(data: unknown): void {
  const { safe, found } = rejectForbiddenAdaptiveChallengeFields(data);
  if (!safe) {
    throw new Error(`Forbidden fields in output: ${found.join(', ')}`);
  }
}

export function assertSafeChallengeBlueprint(blueprint: Record<string, unknown>): void {
  const fieldChecks = [
    'rawPrivateDataIncluded',
    'hiddenReasoningIncluded',
    'teacherOnlyDataIncluded',
    'answerKeyIncluded',
    'modelAnswerIncluded',
    'markingSchemeIncluded',
    'correctAnswerIncluded',
    'safeguardingRawDetailIncluded',
    'deenSensitivePrivateTextIncluded',
  ];
  for (const field of fieldChecks) {
    if (blueprint[field] !== false) {
      throw new Error(`Blueprint privacy flag ${field} must be false`);
    }
  }
}

export function assertSafeChallengeAttemptMetadata(metadata: Record<string, unknown>): void {
  const forbidden = ['rawAnswer', 'rawExplanation', 'correctAnswer', 'answerKey', 'modelAnswer', 'markingScheme'];
  for (const key of Object.keys(metadata)) {
    if (forbidden.includes(key)) {
      throw new Error(`Attempt metadata contains forbidden field: ${key}`);
    }
  }
}

export function assertSafeRemediationPath(path: Record<string, unknown>): void {
  const forbidden = ['rawAnswer', 'rawExplanation', 'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme', 'hiddenReasoning', 'teacherOnlyDetails', 'safeguardingRawDetails', 'privateDeenText'];
  for (const key of Object.keys(path)) {
    if (forbidden.includes(key)) {
      throw new Error(`Remediation path contains forbidden field: ${key}`);
    }
  }
}

export function assertSafeChallengeAuditEvent(event: Record<string, unknown>): void {
  const forbidden = ['rawText', 'rawMessage', 'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme', 'hiddenReasoning', 'chainOfThought', 'teacherOnlyData', 'safeguardingRawDetail', 'deenSensitivePrivateText', 'transcript'];
  for (const key of Object.keys(event)) {
    if (forbidden.includes(key)) {
      throw new Error(`Audit event contains forbidden field: ${key}`);
    }
  }
}

export {
  findForbiddenFields as findForbiddenAdaptiveChallengeFields,
};
