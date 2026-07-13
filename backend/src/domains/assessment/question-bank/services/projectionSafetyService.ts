import { stripForbiddenFieldsForRole } from '../../projections/assessmentProjectionGuard';

const ANSWER_KEY_FIELDS = [
  'answerKey',
  'answerKeySafeRef',
  'correctAnswerSummary',
  'correctAnswer',
  'modelAnswer',
  'markingScheme',
  'markingNotesTeacherOnly',
  'markingNotes',
];

const RAW_ANSWER_FIELDS = [
  'rawStudentAnswer',
  'rawStudentWork',
  'rawIntegritySignal',
];

const INTERNAL_RUBRIC_FIELDS = [
  'rubricInternal',
  'criteriaJson',
  'markingNotesTeacherOnly',
];

const TEACHER_ONLY_FIELDS = [
  'teacherExplanation',
  'teacherNotes',
];

const SECRETS_FIELDS = [
  'secret',
  'token',
  'apiKey',
  'rawProviderResponse',
];

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function stripFields<T extends Record<string, unknown>>(obj: T, fields: string[]): T {
  const clone = deepClone(obj);
  for (const field of fields) {
    if (field in clone) {
      delete clone[field];
    }
  }
  return clone;
}

export interface SafeQuestionView {
  questionVersionId: string;
  stemSafeText: string;
  questionType: string;
  difficultyBand: string;
  language: string;
  studentSafeExplanation: string;
  estimatedTimeSeconds: number;
  parts?: Array<{
    partKey: string;
    promptSafeText: string;
    marksAvailable: number;
    studentInputMode: string;
  }>;
  assets?: Array<{
    assetType: string;
    studentVisible: boolean;
    altText: string;
  }>;
}

export interface TeacherQuestionView extends SafeQuestionView {
  teacherExplanation?: string;
  markingNotesTeacherOnly?: string;
  rubricPublicSummary?: string;
  answerKeyExists: boolean;
  versionNumber: number;
}

export interface ParentQuestionView {
  questionVersionId: string;
  stemSafeText: string;
  questionType: string;
  difficultyBand: string;
  studentSafeExplanation: string;
  estimatedTimeSeconds: number;
}

export function toStudentQuestionSafeView(
  version: Record<string, unknown>,
  parts?: Array<Record<string, unknown>>,
  assets?: Array<Record<string, unknown>>,
): SafeQuestionView {
  let safe = stripFields(version, [
    ...ANSWER_KEY_FIELDS,
    ...INTERNAL_RUBRIC_FIELDS,
    ...TEACHER_ONLY_FIELDS,
    ...SECRETS_FIELDS,
    ...RAW_ANSWER_FIELDS,
  ]);

  const result: SafeQuestionView = {
    questionVersionId: String(safe.questionVersionId ?? ''),
    stemSafeText: String(safe.stemSafeText ?? ''),
    questionType: String(safe.questionType ?? ''),
    difficultyBand: String(safe.difficultyBand ?? ''),
    language: String(safe.language ?? ''),
    studentSafeExplanation: String(safe.studentSafeExplanation ?? ''),
    estimatedTimeSeconds: Number(safe.estimatedTimeSeconds ?? 0),
  };

  if (parts && parts.length > 0) {
    result.parts = parts.map(p => ({
      partKey: String(p.partKey ?? ''),
      promptSafeText: String(p.promptSafeText ?? ''),
      marksAvailable: Number(p.marksAvailable ?? 0),
      studentInputMode: String(p.studentInputMode ?? 'text'),
    }));
  }

  if (assets && assets.length > 0) {
    result.assets = assets
      .filter(a => a.studentVisible === true)
      .map(a => ({
        assetType: String(a.assetType ?? ''),
        studentVisible: Boolean(a.studentVisible),
        altText: String(a.altText ?? ''),
      }));
  }

  return result;
}

export function toTeacherQuestionSafeView(
  version: Record<string, unknown>,
  answerKeyExists: boolean,
): TeacherQuestionView {
  const base = toStudentQuestionSafeView(version);
  const teacherVersion = stripFields(version as Record<string, unknown>, SECRETS_FIELDS);

  return {
    ...base,
    teacherExplanation: String(teacherVersion.teacherExplanation ?? ''),
    answerKeyExists,
    versionNumber: Number(version.versionNumber ?? 0),
  };
}

export function toParentQuestionSafeView(
  version: Record<string, unknown>,
): ParentQuestionView {
  const safe = stripFields(version as Record<string, unknown>, [
    ...ANSWER_KEY_FIELDS,
    ...RAW_ANSWER_FIELDS,
    ...INTERNAL_RUBRIC_FIELDS,
    ...TEACHER_ONLY_FIELDS,
    ...SECRETS_FIELDS,
  ]);

  return {
    questionVersionId: String(safe.questionVersionId ?? ''),
    stemSafeText: String(safe.stemSafeText ?? ''),
    questionType: String(safe.questionType ?? ''),
    difficultyBand: String(safe.difficultyBand ?? ''),
    studentSafeExplanation: String(safe.studentSafeExplanation ?? ''),
    estimatedTimeSeconds: Number(safe.estimatedTimeSeconds ?? 0),
  };
}

export function toSystemQuestionSafeView(
  version: Record<string, unknown>,
): Record<string, unknown> {
  const systemView = stripFields(version as Record<string, unknown>, SECRETS_FIELDS);
  return systemView;
}

export function isOutboxPayloadAnswerKeySafe(payload: Record<string, unknown>): { safe: boolean; reason?: string } {
  for (const field of ANSWER_KEY_FIELDS) {
    if (field in payload && payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
      return { safe: false, reason: `payload contains answer key field: ${field}` };
    }
  }
  return { safe: true };
}

export function getAnswerKeySafeMetadata(repo: { findByQuestionVersionId: (id: string) => Promise<{ status: string } | null> }, questionVersionId: string): Promise<{ hasAnswerKey: boolean; answerKeyStatus: string | null }> {
  return repo.findByQuestionVersionId(questionVersionId).then(k => ({
    hasAnswerKey: k !== null,
    answerKeyStatus: k?.status ?? null,
  }));
}
