const PROTECTED_ANSWER_FIELDS = [
  'answer',
  'answerKey',
  'correctAnswer',
  'modelAnswer',
  'expectedAnswer',
  'markingScheme',
  'solution',
  'fullSolution',
  'finalAnswer',
  'teacherOnlyRubric',
  'hiddenReasoning',
  'chainOfThought',
];

const PROTECTED_ANSWER_PATTERNS = [
  /answer\s*key/i,
  /correct\s*answer/i,
  /model\s*answer/i,
  /expected\s*answer/i,
  /marking\s*scheme/i,
  /full\s*solution/i,
  /final\s*answer/i,
  /teacher.only\s*rubric/i,
  /hidden\s*reasoning/i,
  /chain\s*of\s*thought/i,
];

function findProtectedFields(data: unknown, path = ''): string[] {
  const found: string[] = [];
  if (!data || typeof data !== 'object') return found;
  for (const key of Object.keys(data as Record<string, unknown>)) {
    const fullPath = path ? `${path}.${key}` : key;
    if (PROTECTED_ANSWER_FIELDS.includes(key)) {
      found.push(fullPath);
    }
    const val = (data as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      found.push(...findProtectedFields(val, fullPath));
    }
    if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (val[i] && typeof val[i] === 'object') {
          found.push(...findProtectedFields(val[i], `${fullPath}[${i}]`));
        }
      }
    }
  }
  return found;
}

function containsProtectedPattern(text: string): boolean {
  return PROTECTED_ANSWER_PATTERNS.some(p => p.test(text));
}

function redactProtectedFields(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const result: Record<string, unknown> = {};
  if (Array.isArray(data)) return data.map(v => v && typeof v === 'object' ? redactProtectedFields(v) : v);
  for (const key of Object.keys(data as Record<string, unknown>)) {
    if (PROTECTED_ANSWER_FIELDS.includes(key)) {
      result[key] = '[REDACTED - PROTECTED ANSWER]';
      continue;
    }
    const val = (data as Record<string, unknown>)[key];
    if (typeof val === 'string' && containsProtectedPattern(val)) {
      result[key] = val.replace(/\[.*?\]/g, '[REDACTED]');
    } else if (val && typeof val === 'object') {
      result[key] = redactProtectedFields(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map((v: unknown) =>
        v && typeof v === 'object' ? redactProtectedFields(v) : v
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

export function containsProtectedAnswerField(data: unknown): boolean {
  return findProtectedFields(data).length > 0;
}

export function findProtectedAnswerFields(data: unknown): string[] {
  return findProtectedFields(data);
}

export function rejectProtectedAnswerFields(data: unknown): {
  safe: boolean;
  found: string[];
} {
  const found = findProtectedFields(data);
  return { safe: found.length === 0, found };
}

export function redactProtectedAnswerFields<T>(data: T): T {
  return redactProtectedFields(data) as T;
}

export function assertNoAnswerBotChallenge(data: Record<string, unknown>): void {
  const forbiddenContentKeys = ['answer', 'answerKey', 'correctAnswer', 'modelAnswer', 'expectedAnswer', 'markingScheme', 'solution', 'fullSolution', 'finalAnswer'];
  for (const key of Object.keys(data)) {
    if (forbiddenContentKeys.includes(key)) {
      throw new Error(`Challenge contains answer-bot field: ${key}`);
    }
  }
  const textFields = ['safeInstruction', 'learnerPrompt', 'safeSuccessCriteria'];
  for (const field of textFields) {
    const val = data[field];
    if (typeof val === 'string' && containsProtectedPattern(val)) {
      throw new Error(`Challenge ${field} contains protected answer pattern`);
    }
  }
}

export function assertNoAnswerKeyLeak(data: Record<string, unknown>): void {
  const answerKeyFields = ['answerKey', 'correctAnswer', 'modelAnswer', 'expectedAnswer', 'markingScheme'];
  for (const key of Object.keys(data)) {
    if (answerKeyFields.includes(key)) {
      throw new Error(`Answer key field detected: ${key}`);
    }
  }
}
