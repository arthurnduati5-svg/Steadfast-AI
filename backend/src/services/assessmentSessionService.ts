import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import { recordLearningEffectEvent } from './learningEffectivenessService';
import { getWeakTopics } from './studySupportService';
import { logger } from '../utils/logger';

export type AssessmentWorkspaceMode = 'exam' | 'focus';
export type AssessmentModeType =
  | 'quick_drill'
  | 'timed_practice'
  | 'mini_mock'
  | 'weak_topic_drill'
  | 'focus_session';
export type AssessmentQuestionStyle =
  | 'multiple_choice'
  | 'short_answer'
  | 'worked_response'
  | 'numeric'
  | 'mixed';
export type AssessmentStrictness = 'strict_exam' | 'light_support' | 'review_after_attempt';
export type AssessmentReviewMode = 'immediate' | 'delayed_block' | 'flag_and_review' | 'post_mock';
export type AssessmentSessionStatus = 'created' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
export type AssessmentQuestionStatus = 'pending' | 'answered' | 'skipped';
export type AssessmentTimerUrgency = 'normal' | 'warning' | 'critical' | 'expired';

type AssessmentQuestionTypeResolved = Exclude<AssessmentQuestionStyle, 'mixed'>;

export type AssessmentStartArgs = {
  userId: string;
  workspaceMode: AssessmentWorkspaceMode;
  modeType?: AssessmentModeType;
  subject?: string | null;
  topic?: string | null;
  schoolLevel?: string | null;
  questionStyle?: AssessmentQuestionStyle;
  strictness?: AssessmentStrictness;
  reviewMode?: AssessmentReviewMode;
  questionCount?: number | null;
  timedMinutes?: number | null;
  resumeLatest?: boolean;
  createIfNone?: boolean;
};

export type AssessmentAnswerArgs = {
  userId: string;
  sessionId: string;
  questionId?: string | null;
  answer?: unknown;
  selectedOptionId?: string | null;
  workedSteps?: string | null;
  unsure?: boolean;
  flagForReview?: boolean;
  responseTimeSec?: number | null;
};

export type AssessmentNavigateArgs = {
  userId: string;
  sessionId: string;
  direction: 'next' | 'previous' | 'jump' | 'unanswered' | 'review_flagged' | 'skip_current';
  targetIndex?: number | null;
  flagReason?: string | null;
};

export type AssessmentHintArgs = {
  userId: string;
  sessionId: string;
  questionId?: string | null;
};

export type AssessmentFinishArgs = {
  userId: string;
  sessionId: string;
  reason?: string | null;
};

export type AssessmentSession = {
  id: string;
  userId: string;
  workspaceMode: AssessmentWorkspaceMode;
  modeType: AssessmentModeType;
  questionStyle: AssessmentQuestionStyle;
  strictness: AssessmentStrictness;
  reviewMode: AssessmentReviewMode;
  status: AssessmentSessionStatus;
  subject?: string | null;
  topic?: string | null;
  schoolLevel?: string | null;
  totalQuestions: number;
  currentIndex: number;
  answeredCount: number;
  skippedCount: number;
  flaggedCount: number;
  remainingCount: number;
  timerDurationSec?: number | null;
  timerRemainingSec?: number | null;
  timerStartedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type AssessmentQuestionOption = {
  id: string;
  label: string;
};

export type AssessmentQuestion = {
  id: string;
  sessionId: string;
  position: number;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  questionType: AssessmentQuestionTypeResolved;
  prompt: string;
  options?: AssessmentQuestionOption[] | null;
  status: AssessmentQuestionStatus;
  isFlagged: boolean;
  unsureMarked: boolean;
  metadata?: Record<string, unknown> | null;
};

export type AssessmentAttempt = {
  id: string;
  sessionId: string;
  questionId: string;
  attemptIndex: number;
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  responseTimeSec?: number | null;
  answerPreview?: string | null;
  feedbackShort?: string | null;
  memoryNote?: string | null;
  submittedAt: string;
};

export type AssessmentNextMove = {
  label: string;
  description: string;
  destination: 'revision' | 'growth' | 'media' | 'exam' | 'focus' | 'new_session';
  intent?: string | null;
  topic?: string | null;
  subject?: string | null;
};

export type AssessmentResult = {
  id: string;
  sessionId: string;
  userId: string;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  completedAt: string;
  topicBreakdown: Array<{
    topic: string;
    subject?: string | null;
    total: number;
    correct: number;
    partial: number;
    incorrect: number;
  }>;
  mistakeClusters: Array<{
    pattern: string;
    count: number;
    topic?: string | null;
    subject?: string | null;
  }>;
  weakTopicTriggers: string[];
  improvementSignals: string[];
  timeUsedSec?: number | null;
  bestNextMove: AssessmentNextMove;
  followupPaths: AssessmentNextMove[];
};

export type AssessmentSessionSnapshot = {
  session: AssessmentSession;
  currentQuestion: AssessmentQuestion | null;
  questions: AssessmentQuestion[];
  latestAttempt?: AssessmentAttempt | null;
  policy: {
    strictness: AssessmentStrictness;
    reviewMode: AssessmentReviewMode;
    preSubmitHelpAllowed: boolean;
    hintsPerQuestion: number;
  };
  progress: {
    currentQuestionNumber: number;
    totalQuestions: number;
    answeredCount: number;
    skippedCount: number;
    flaggedCount: number;
    remainingCount: number;
    progressPercent: number;
  };
  timer: {
    durationSec?: number | null;
    remainingSec?: number | null;
    percentRemaining?: number | null;
    urgency: AssessmentTimerUrgency;
    isPaused: boolean;
  };
  review: {
    pendingCount: number;
    flaggedCount: number;
    canReviewNow: boolean;
  };
  resultsReady: boolean;
  resumed?: boolean;
  nextMove?: AssessmentNextMove | null;
};

export type AssessmentAnswerResponse = {
  snapshot: AssessmentSessionSnapshot;
  attempt: AssessmentAttempt;
  feedback: {
    status: 'correct' | 'incorrect' | 'partial';
    headline: string;
    explanation: string;
    remember: string;
    nextActionLabel: string;
    handoff?: AssessmentNextMove | null;
  };
};

export type AssessmentHintResponse = {
  snapshot: AssessmentSessionSnapshot;
  hint: string;
  remainingHints: number;
};

type AssessmentSessionRow = {
  id: string;
  userId: string;
  workspaceMode: string;
  modeType: string;
  questionStyle: string;
  strictness: string;
  reviewMode: string;
  status: string;
  subject: string | null;
  topic: string | null;
  schoolLevel: string | null;
  totalQuestions: number;
  currentIndex: number;
  answeredCount: number;
  skippedCount: number;
  flaggedCount: number;
  remainingCount: number;
  timerDurationSec: number | null;
  timerRemainingSec: number | null;
  timerStartedAt: Date | string | null;
  metadata: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type AssessmentQuestionRow = {
  id: string;
  sessionId: string;
  position: number;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  questionType: string;
  prompt: string;
  options: unknown;
  expectedAnswer: unknown;
  explanation: string | null;
  hint: string | null;
  whyNow: string | null;
  thingToNotice: string | null;
  bestFor: string | null;
  status: string;
  isFlagged: boolean;
  unsureMarked: boolean;
  metadata: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type AssessmentAttemptRow = {
  id: string;
  sessionId: string;
  questionId: string;
  attemptIndex: number;
  answer: unknown;
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  responseTimeSec: number | null;
  feedbackShort: string | null;
  memoryNote: string | null;
  submittedAt: Date | string;
  metadata: unknown;
};

type AssessmentResultRow = {
  id: string;
  sessionId: string;
  userId: string;
  scorePercent: number;
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  timeUsedSec: number | null;
  topicBreakdown: unknown;
  mistakeClusters: unknown;
  weakTopicTriggers: unknown;
  improvementSignals: unknown;
  bestNextMove: unknown;
  followupPaths: unknown;
  metadata: unknown;
  completedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ModePreset = {
  modeType: AssessmentModeType;
  questionStyle: AssessmentQuestionStyle;
  strictness: AssessmentStrictness;
  reviewMode: AssessmentReviewMode;
  questionCount: number;
  timedMinutes: number | null;
  allowBacktrack: boolean;
};

type QuestionBlueprint = {
  position: number;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  questionType: AssessmentQuestionTypeResolved;
  prompt: string;
  options: AssessmentQuestionOption[] | null;
  expectedAnswer: Record<string, unknown>;
  explanation: string;
  hint: string;
  whyNow: string;
  thingToNotice: string;
  bestFor: string;
  metadata: Record<string, unknown>;
};

type EvaluationOutcome = {
  isCorrect: boolean;
  isPartial: boolean;
  score: number;
  primaryIssue: string;
  remember: string;
  explanation: string;
};

const SECOND_MS = 1_000;
const MAX_QUESTION_COUNT = 24;
const MIN_QUESTION_COUNT = 1;
const DEFAULT_EXAM_TOPIC = 'Exam readiness';
const DEFAULT_FOCUS_TOPIC = 'Focused practice';
const DEFAULT_SUBJECT = 'General';
let ensureAssessmentTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalizeText(value: unknown): string {
  return safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(' ').filter(Boolean);
}

function resolveModePreset(workspaceMode: AssessmentWorkspaceMode, requestedMode?: AssessmentModeType): ModePreset {
  const presetMap: Record<AssessmentModeType, ModePreset> = {
    quick_drill: {
      modeType: 'quick_drill',
      questionStyle: 'mixed',
      strictness: 'light_support',
      reviewMode: 'immediate',
      questionCount: 3,
      timedMinutes: null,
      allowBacktrack: true,
    },
    timed_practice: {
      modeType: 'timed_practice',
      questionStyle: 'mixed',
      strictness: 'strict_exam',
      reviewMode: 'delayed_block',
      questionCount: 10,
      timedMinutes: 15,
      allowBacktrack: false,
    },
    mini_mock: {
      modeType: 'mini_mock',
      questionStyle: 'mixed',
      strictness: 'strict_exam',
      reviewMode: 'post_mock',
      questionCount: 20,
      timedMinutes: 35,
      allowBacktrack: false,
    },
    weak_topic_drill: {
      modeType: 'weak_topic_drill',
      questionStyle: 'mixed',
      strictness: 'light_support',
      reviewMode: 'immediate',
      questionCount: 6,
      timedMinutes: 10,
      allowBacktrack: true,
    },
    focus_session: {
      modeType: 'focus_session',
      questionStyle: 'mixed',
      strictness: 'light_support',
      reviewMode: 'immediate',
      questionCount: 5,
      timedMinutes: null,
      allowBacktrack: true,
    },
  };
  if (requestedMode && presetMap[requestedMode]) return presetMap[requestedMode];
  return workspaceMode === 'focus' ? presetMap.focus_session : presetMap.quick_drill;
}

function resolveQuestionType(style: AssessmentQuestionStyle, position: number): AssessmentQuestionTypeResolved {
  if (style !== 'mixed') return style;
  const cycle: AssessmentQuestionTypeResolved[] = ['multiple_choice', 'short_answer', 'numeric', 'worked_response'];
  return cycle[position % cycle.length];
}

function estimateTimerDurationSec(modeType: AssessmentModeType, questionCount: number, timedMinutes?: number | null): number | null {
  if (typeof timedMinutes === 'number' && timedMinutes > 0) {
    return clampNumber(Math.round(timedMinutes * 60), 60, 3 * 60 * 60);
  }
  if (modeType === 'timed_practice') return clampNumber(questionCount * 90, 6 * 60, 35 * 60);
  if (modeType === 'mini_mock') return clampNumber(questionCount * 105, 10 * 60, 75 * 60);
  if (modeType === 'weak_topic_drill') return clampNumber(questionCount * 70, 4 * 60, 20 * 60);
  return null;
}

function buildQuestionBlueprints(args: {
  subject: string | null;
  topic: string | null;
  questionCount: number;
  questionStyle: AssessmentQuestionStyle;
  schoolLevel: string | null;
  workspaceMode: AssessmentWorkspaceMode;
}): QuestionBlueprint[] {
  const subject = safeString(args.subject).trim() || DEFAULT_SUBJECT;
  const topic = safeString(args.topic).trim() || (args.workspaceMode === 'exam' ? DEFAULT_EXAM_TOPIC : DEFAULT_FOCUS_TOPIC);
  const questionCount = clampNumber(Math.round(args.questionCount), MIN_QUESTION_COUNT, MAX_QUESTION_COUNT);

  return Array.from({ length: questionCount }).map((_, index) => {
    const questionType = resolveQuestionType(args.questionStyle, index);
    const serial = index + 1;
    const microTopic = `${topic} step ${serial}`;
    if (questionType === 'multiple_choice') {
      const options: AssessmentQuestionOption[] = [
        { id: 'A', label: 'Start with the final answer and reverse everything.' },
        { id: 'B', label: 'Identify the target, isolate it, and justify each operation.' },
        { id: 'C', label: 'Replace unknown values with random numbers first.' },
        { id: 'D', label: 'Skip directly to memorized formula output.' },
      ];
      return {
        position: index,
        subject,
        topic,
        subtopic: microTopic,
        questionType,
        prompt: `Question ${serial}: In ${topic}, what is the best first move under exam pressure?`,
        options,
        expectedAnswer: { optionId: 'B', keywords: ['identify', 'isolate', 'justify'] },
        explanation: 'Exams reward clear, justifiable operations. Isolating the target before solving lowers avoidable mistakes.',
        hint: 'Think: what gives the cleanest structure before you compute anything?',
        whyNow: 'This addresses a common first-step mistake pattern under time pressure.',
        thingToNotice: 'Whether you define the target before manipulating expressions.',
        bestFor: 'Exam accuracy under timed conditions',
        metadata: { estimatedMinutes: 2, schoolLevel: args.schoolLevel, source: 'assessment_generator' },
      };
    }
    if (questionType === 'numeric') {
      const base = serial + 4;
      const correct = base * 3 - 2;
      return {
        position: index,
        subject,
        topic,
        subtopic: microTopic,
        questionType,
        prompt: `Question ${serial}: Calculate ${base} × 3 − 2.`,
        options: null,
        expectedAnswer: { numeric: correct, tolerance: 0 },
        explanation: 'The sequence is multiplication first, then subtraction. Keep order of operations explicit to avoid slips.',
        hint: 'Compute the multiplication result first, then adjust once.',
        whyNow: 'This checks attention control and arithmetic reliability in fast exam blocks.',
        thingToNotice: 'Order of operations and arithmetic sign control.',
        bestFor: 'Speed + accuracy calibration',
        metadata: { estimatedMinutes: 1, schoolLevel: args.schoolLevel, source: 'assessment_generator' },
      };
    }
    if (questionType === 'worked_response') {
      return {
        position: index,
        subject,
        topic,
        subtopic: microTopic,
        questionType,
        prompt: `Question ${serial}: Show your working for one strategy that solves this ${topic} task reliably.`,
        options: null,
        expectedAnswer: { keywords: ['step', 'reason', 'check'] },
        explanation: 'Strong worked responses include a clear step, the reason behind it, and a short check.',
        hint: 'Write one step, then explain why that step is valid.',
        whyNow: 'Worked steps expose hidden gaps that short answers can hide.',
        thingToNotice: 'Whether your method is explicit and verifiable.',
        bestFor: 'Method clarity and transferable exam structure',
        metadata: { estimatedMinutes: 3, schoolLevel: args.schoolLevel, source: 'assessment_generator' },
      };
    }
    return {
      position: index,
      subject,
      topic,
      subtopic: microTopic,
      questionType: 'short_answer',
      prompt: `Question ${serial}: In one or two lines, explain the key idea behind ${topic}.`,
      options: null,
      expectedAnswer: { keywords: ['key', 'idea', 'step', 'reason'] },
      explanation: 'A concise explanation should mention the key idea and why that step matters.',
      hint: 'Name the key idea first, then one reason it matters.',
      whyNow: 'Short-response discipline improves exam communication under limited time.',
      thingToNotice: 'Clarity before length.',
      bestFor: 'Concise explanation under pressure',
      metadata: { estimatedMinutes: 2, schoolLevel: args.schoolLevel, source: 'assessment_generator' },
    };
  });
}

function coerceSessionStatus(value: unknown): AssessmentSessionStatus {
  const normalized = safeString(value).trim();
  if (normalized === 'created' || normalized === 'in_progress' || normalized === 'paused' || normalized === 'completed' || normalized === 'abandoned') {
    return normalized;
  }
  return 'created';
}

function coerceQuestionStatus(value: unknown): AssessmentQuestionStatus {
  const normalized = safeString(value).trim();
  if (normalized === 'answered' || normalized === 'skipped' || normalized === 'pending') return normalized;
  return 'pending';
}

function coerceQuestionType(value: unknown): AssessmentQuestionTypeResolved {
  const normalized = safeString(value).trim();
  if (normalized === 'multiple_choice' || normalized === 'short_answer' || normalized === 'worked_response' || normalized === 'numeric') {
    return normalized;
  }
  return 'short_answer';
}

function coerceWorkspaceMode(value: unknown): AssessmentWorkspaceMode {
  return safeString(value).trim() === 'focus' ? 'focus' : 'exam';
}

function coerceModeType(value: unknown): AssessmentModeType {
  const normalized = safeString(value).trim();
  if (normalized === 'quick_drill' || normalized === 'timed_practice' || normalized === 'mini_mock' || normalized === 'weak_topic_drill' || normalized === 'focus_session') {
    return normalized;
  }
  return 'quick_drill';
}

function coerceQuestionStyle(value: unknown): AssessmentQuestionStyle {
  const normalized = safeString(value).trim();
  if (normalized === 'multiple_choice' || normalized === 'short_answer' || normalized === 'worked_response' || normalized === 'numeric' || normalized === 'mixed') {
    return normalized;
  }
  return 'mixed';
}

function coerceStrictness(value: unknown): AssessmentStrictness {
  const normalized = safeString(value).trim();
  if (normalized === 'strict_exam' || normalized === 'light_support' || normalized === 'review_after_attempt') {
    return normalized;
  }
  return 'light_support';
}

function coerceReviewMode(value: unknown): AssessmentReviewMode {
  const normalized = safeString(value).trim();
  if (normalized === 'immediate' || normalized === 'delayed_block' || normalized === 'flag_and_review' || normalized === 'post_mock') {
    return normalized;
  }
  return 'immediate';
}

function toSessionDto(row: AssessmentSessionRow): AssessmentSession {
  return {
    id: row.id,
    userId: row.userId,
    workspaceMode: coerceWorkspaceMode(row.workspaceMode),
    modeType: coerceModeType(row.modeType),
    questionStyle: coerceQuestionStyle(row.questionStyle),
    strictness: coerceStrictness(row.strictness),
    reviewMode: coerceReviewMode(row.reviewMode),
    status: coerceSessionStatus(row.status),
    subject: row.subject || null,
    topic: row.topic || null,
    schoolLevel: row.schoolLevel || null,
    totalQuestions: Number(row.totalQuestions || 0),
    currentIndex: Number(row.currentIndex || 0),
    answeredCount: Number(row.answeredCount || 0),
    skippedCount: Number(row.skippedCount || 0),
    flaggedCount: Number(row.flaggedCount || 0),
    remainingCount: Number(row.remainingCount || 0),
    timerDurationSec: typeof row.timerDurationSec === 'number' ? row.timerDurationSec : null,
    timerRemainingSec: typeof row.timerRemainingSec === 'number' ? row.timerRemainingSec : null,
    timerStartedAt: row.timerStartedAt ? toIso(row.timerStartedAt) : null,
    metadata: parseJsonValue<Record<string, unknown> | null>(row.metadata, null),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toQuestionDto(row: AssessmentQuestionRow): AssessmentQuestion {
  return {
    id: row.id,
    sessionId: row.sessionId,
    position: Number(row.position || 0),
    subject: row.subject || null,
    topic: row.topic || null,
    subtopic: row.subtopic || null,
    questionType: coerceQuestionType(row.questionType),
    prompt: safeString(row.prompt).trim(),
    options: parseJsonValue<AssessmentQuestionOption[] | null>(row.options, null),
    status: coerceQuestionStatus(row.status),
    isFlagged: Boolean(row.isFlagged),
    unsureMarked: Boolean(row.unsureMarked),
    metadata: {
      ...(parseJsonValue<Record<string, unknown>>(row.metadata, {})),
      hint: safeString(row.hint).trim() || null,
      whyNow: safeString(row.whyNow).trim() || null,
      thingToNotice: safeString(row.thingToNotice).trim() || null,
      bestFor: safeString(row.bestFor).trim() || null,
    },
  };
}

function toAttemptDto(row: AssessmentAttemptRow): AssessmentAttempt {
  const answerPayload = parseJsonValue<Record<string, unknown>>(row.answer, {});
  return {
    id: row.id,
    sessionId: row.sessionId,
    questionId: row.questionId,
    attemptIndex: Number(row.attemptIndex || 1),
    isCorrect: Boolean(row.isCorrect),
    isPartial: Boolean(row.isPartial),
    score: Number(row.score || 0),
    responseTimeSec: typeof row.responseTimeSec === 'number' ? row.responseTimeSec : null,
    answerPreview: safeString(answerPayload.preview || answerPayload.value).trim() || null,
    feedbackShort: safeString(row.feedbackShort).trim() || null,
    memoryNote: safeString(row.memoryNote).trim() || null,
    submittedAt: toIso(row.submittedAt),
  };
}

function timerUrgency(durationSec: number | null, remainingSec: number | null): AssessmentTimerUrgency {
  if (durationSec == null || remainingSec == null) return 'normal';
  if (remainingSec <= 0) return 'expired';
  const ratio = remainingSec / Math.max(1, durationSec);
  if (ratio <= 0.05) return 'critical';
  if (ratio <= 0.2) return 'warning';
  return 'normal';
}

function toResultDto(row: AssessmentResultRow): AssessmentResult {
  const bestNextMove = parseJsonValue<AssessmentNextMove | null>(row.bestNextMove, null) || {
    label: 'Open Revision',
    description: 'Convert today’s mistakes into revision items and retry in one short round.',
    destination: 'revision',
    intent: 'open_revision',
  };
  const followupPaths = parseJsonValue<AssessmentNextMove[] | null>(row.followupPaths, null) || [bestNextMove];
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    scorePercent: Number(row.scorePercent || 0),
    correctCount: Number(row.correctCount || 0),
    incorrectCount: Number(row.incorrectCount || 0),
    partialCount: Number(row.partialCount || 0),
    completedAt: toIso(row.completedAt),
    topicBreakdown: parseJsonValue<Array<{
      topic: string;
      subject?: string | null;
      total: number;
      correct: number;
      partial: number;
      incorrect: number;
    }>>(row.topicBreakdown, []),
    mistakeClusters: parseJsonValue<Array<{ pattern: string; count: number; topic?: string | null; subject?: string | null }>>(row.mistakeClusters, []),
    weakTopicTriggers: parseJsonValue<string[]>(row.weakTopicTriggers, []),
    improvementSignals: parseJsonValue<string[]>(row.improvementSignals, []),
    timeUsedSec: typeof row.timeUsedSec === 'number' ? row.timeUsedSec : null,
    bestNextMove,
    followupPaths,
  };
}

function derivePolicy(strictness: AssessmentStrictness, reviewMode: AssessmentReviewMode) {
  const hintsPerQuestion = strictness === 'light_support' ? 1 : 0;
  return {
    strictness,
    reviewMode,
    preSubmitHelpAllowed: strictness === 'light_support',
    hintsPerQuestion,
  };
}

function canReviewNow(args: {
  reviewMode: AssessmentReviewMode;
  sessionStatus: AssessmentSessionStatus;
  answeredCount: number;
  flaggedCount: number;
}): boolean {
  if (args.sessionStatus === 'completed') return true;
  if (args.reviewMode === 'immediate') return true;
  if (args.reviewMode === 'delayed_block') {
    return args.answeredCount > 0 && args.answeredCount % 5 === 0;
  }
  if (args.reviewMode === 'flag_and_review') {
    return args.flaggedCount > 0;
  }
  return false;
}

function shouldDeferDetailedFeedback(strictness: AssessmentStrictness, reviewMode: AssessmentReviewMode): boolean {
  if (strictness === 'review_after_attempt') return true;
  return reviewMode === 'delayed_block' || reviewMode === 'flag_and_review' || reviewMode === 'post_mock';
}

function deriveNextMoveFromSession(session: AssessmentSession): AssessmentNextMove {
  const hasNeedsSupport = session.remainingCount > 0 || session.answeredCount < session.totalQuestions;
  if (hasNeedsSupport) {
    return {
      label: 'Continue session',
      description: 'Keep this momentum and finish the remaining exam items.',
      destination: session.workspaceMode,
      intent: 'continue_assessment',
      topic: session.topic || null,
      subject: session.subject || null,
    };
  }
  return {
    label: 'Open Revision',
    description: 'Turn this attempt into focused revision before your next run.',
    destination: 'revision',
    intent: 'open_revision',
    topic: session.topic || null,
    subject: session.subject || null,
  };
}

function evaluateAnswer(questionRow: AssessmentQuestionRow, args: AssessmentAnswerArgs): EvaluationOutcome {
  const expected = parseJsonValue<Record<string, unknown>>(questionRow.expectedAnswer, {});
  const questionType = coerceQuestionType(questionRow.questionType);
  const selectedOption = safeString(args.selectedOptionId).trim().toUpperCase();
  const answerText = safeString(args.answer).trim();
  const workedSteps = safeString(args.workedSteps).trim();
  const normalizedAnswer = normalizeText(answerText || workedSteps || selectedOption);

  if (questionType === 'multiple_choice') {
    const expectedOption = safeString(expected.optionId).trim().toUpperCase();
    const isCorrect = Boolean(selectedOption) && selectedOption === expectedOption;
    return {
      isCorrect,
      isPartial: false,
      score: isCorrect ? 1 : 0,
      primaryIssue: isCorrect ? 'None' : `You selected ${selectedOption || 'no option'} instead of ${expectedOption || 'the best strategy option'}.`,
      remember: isCorrect ? 'Keep choosing the step that is easiest to justify under exam pressure.' : 'Prioritize options that isolate the target and justify each move.',
      explanation: safeString(questionRow.explanation).trim() || 'Focus on the most justifiable first move.',
    };
  }

  if (questionType === 'numeric') {
    const expectedValue = Number(expected.numeric);
    const tolerance = typeof expected.tolerance === 'number' ? Number(expected.tolerance) : 0;
    const numericAnswer = Number(answerText);
    if (Number.isFinite(expectedValue) && Number.isFinite(numericAnswer)) {
      const difference = Math.abs(numericAnswer - expectedValue);
      const isCorrect = difference <= tolerance;
      return {
        isCorrect,
        isPartial: !isCorrect && difference <= Math.max(1, tolerance + 1),
        score: isCorrect ? 1 : difference <= Math.max(1, tolerance + 1) ? 0.5 : 0,
        primaryIssue: isCorrect ? 'None' : 'Arithmetic accuracy dropped near the final step.',
        remember: isCorrect ? 'Great. Preserve this same order-of-operations discipline.' : 'Write one quick intermediate line before finalizing the number.',
        explanation: safeString(questionRow.explanation).trim() || 'Re-check operation order and signs.',
      };
    }
    return {
      isCorrect: false,
      isPartial: false,
      score: 0,
      primaryIssue: 'The response is not a valid numeric answer.',
      remember: 'Submit one exact number with no extra text in numeric mode.',
      explanation: 'Numeric prompts need an exact number to score accurately.',
    };
  }

  const keywords = parseJsonValue<string[]>(expected.keywords, []).map((entry) => normalizeText(entry)).filter(Boolean);
  if (!keywords.length) {
    const hasAnswer = Boolean(normalizedAnswer);
    return {
      isCorrect: hasAnswer,
      isPartial: false,
      score: hasAnswer ? 1 : 0,
      primaryIssue: hasAnswer ? 'None' : 'No answer submitted.',
      remember: hasAnswer ? 'Keep your response concise and structured.' : 'Even a short first attempt is better than skipping.',
      explanation: safeString(questionRow.explanation).trim() || 'Concise structure is preferred in exam mode.',
    };
  }

  const answerTokens = new Set(tokenize(normalizedAnswer));
  let hits = 0;
  for (const keyword of keywords) {
    const keywordTokens = tokenize(keyword);
    const matched = keywordTokens.every((token) => answerTokens.has(token));
    if (matched) hits += 1;
  }
  const coverage = hits / keywords.length;
  const isCorrect = coverage >= 0.75;
  const isPartial = !isCorrect && coverage >= 0.35;
  const missingKeyword = keywords.find((keyword) => {
    const keywordTokens = tokenize(keyword);
    return !keywordTokens.every((token) => answerTokens.has(token));
  });
  return {
    isCorrect,
    isPartial,
    score: isCorrect ? 1 : isPartial ? 0.5 : 0,
    primaryIssue: isCorrect ? 'None' : `Missing key element: ${safeString(missingKeyword).trim() || 'core reasoning link'}.`,
    remember: isCorrect
      ? 'Strong structure. Keep explaining the key step and why it is valid.'
      : 'State the key step first, then give one reason it works.',
    explanation: safeString(questionRow.explanation).trim() || 'Mention both the core step and the reason behind it.',
  };
}

async function selectTargetContext(args: {
  userId: string;
  modeType: AssessmentModeType;
  topic?: string | null;
  subject?: string | null;
}): Promise<{ topic: string | null; subject: string | null }> {
  const topic = safeString(args.topic).trim();
  const subject = safeString(args.subject).trim();
  if (topic || subject) return { topic: topic || null, subject: subject || null };
  try {
    const weakTopics = await getWeakTopics(args.userId);
    const firstWeak = weakTopics[0] || null;
    if (firstWeak && (safeString(firstWeak.topic).trim() || safeString(firstWeak.subject).trim())) {
      return {
        topic: safeString(firstWeak.topic).trim() || null,
        subject: safeString(firstWeak.subject).trim() || null,
      };
    }
  } catch {
    // fallback
  }
  return { topic: null, subject: null };
}

function calculateSnapshot(args: {
  sessionRow: AssessmentSessionRow;
  questionRows: AssessmentQuestionRow[];
  latestAttempt: AssessmentAttemptRow | null;
  resultRow: AssessmentResultRow | null;
  resumed?: boolean;
}): AssessmentSessionSnapshot {
  const session = toSessionDto(args.sessionRow);
  const questions = args.questionRows
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .map((row) => toQuestionDto(row));
  const boundedCurrentIndex = clampNumber(session.currentIndex, 0, Math.max(0, questions.length - 1));
  const currentQuestion = questions[boundedCurrentIndex] || null;
  const duration = session.timerDurationSec ?? null;
  const remaining = session.timerRemainingSec ?? null;
  const timer = {
    durationSec: duration,
    remainingSec: remaining,
    percentRemaining: duration && remaining != null ? Number((remaining / Math.max(1, duration)).toFixed(3)) : null,
    urgency: timerUrgency(duration, remaining),
    isPaused: session.status === 'paused',
  };
  const progressPercent = session.totalQuestions > 0
    ? Number((Math.min(session.totalQuestions, session.answeredCount + session.skippedCount) / session.totalQuestions).toFixed(2))
    : 0;
  return {
    session,
    currentQuestion,
    questions,
    latestAttempt: args.latestAttempt ? toAttemptDto(args.latestAttempt) : null,
    policy: derivePolicy(session.strictness, session.reviewMode),
    progress: {
      currentQuestionNumber: Math.min(questions.length, boundedCurrentIndex + 1),
      totalQuestions: session.totalQuestions,
      answeredCount: session.answeredCount,
      skippedCount: session.skippedCount,
      flaggedCount: session.flaggedCount,
      remainingCount: session.remainingCount,
      progressPercent,
    },
    timer,
    review: {
      pendingCount: session.remainingCount,
      flaggedCount: session.flaggedCount,
      canReviewNow: canReviewNow({
        reviewMode: session.reviewMode,
        sessionStatus: session.status,
        answeredCount: session.answeredCount,
        flaggedCount: session.flaggedCount,
      }),
    },
    resultsReady: Boolean(args.resultRow || session.status === 'completed'),
    resumed: Boolean(args.resumed),
    nextMove: session.status === 'completed'
      ? args.resultRow
        ? toResultDto(args.resultRow).bestNextMove
        : deriveNextMoveFromSession(session)
      : deriveNextMoveFromSession(session),
  };
}

async function loadSessionRow(userId: string, sessionId: string): Promise<AssessmentSessionRow | null> {
  const [row] = await prisma.$queryRawUnsafe<AssessmentSessionRow[]>(
    `SELECT * FROM "AssessmentSession" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    sessionId,
    userId
  );
  return row || null;
}

async function loadQuestionRows(sessionId: string): Promise<AssessmentQuestionRow[]> {
  return prisma.$queryRawUnsafe<AssessmentQuestionRow[]>(
    `SELECT * FROM "AssessmentQuestion" WHERE "sessionId" = $1 ORDER BY "position" ASC`,
    sessionId
  );
}

async function loadLatestAttempt(sessionId: string, questionId: string): Promise<AssessmentAttemptRow | null> {
  const [row] = await prisma.$queryRawUnsafe<AssessmentAttemptRow[]>(
    `SELECT * FROM "AssessmentAttempt" WHERE "sessionId" = $1 AND "questionId" = $2 ORDER BY "attemptIndex" DESC LIMIT 1`,
    sessionId,
    questionId
  );
  return row || null;
}

async function loadResultRow(sessionId: string): Promise<AssessmentResultRow | null> {
  const [row] = await prisma.$queryRawUnsafe<AssessmentResultRow[]>(
    `SELECT * FROM "AssessmentResult" WHERE "sessionId" = $1 ORDER BY "completedAt" DESC LIMIT 1`,
    sessionId
  );
  return row || null;
}

async function refreshCounters(sessionId: string): Promise<{
  total: number;
  answered: number;
  skipped: number;
  flagged: number;
  remaining: number;
}> {
  const rows = await prisma.$queryRawUnsafe<AssessmentQuestionRow[]>(
    `SELECT * FROM "AssessmentQuestion" WHERE "sessionId" = $1`,
    sessionId
  );
  let answered = 0;
  let skipped = 0;
  let flagged = 0;
  for (const row of rows) {
    const status = coerceQuestionStatus(row.status);
    if (status === 'answered') answered += 1;
    if (status === 'skipped') skipped += 1;
    if (Boolean(row.isFlagged)) flagged += 1;
  }
  const total = rows.length;
  const remaining = Math.max(0, total - answered - skipped);
  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
      SET "totalQuestions" = $2,
          "answeredCount" = $3,
          "skippedCount" = $4,
          "flaggedCount" = $5,
          "remainingCount" = $6,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    sessionId,
    total,
    answered,
    skipped,
    flagged,
    remaining
  );
  return { total, answered, skipped, flagged, remaining };
}

async function recordAssessmentEvent(args: {
  userId: string;
  sessionId: string;
  questionId?: string | null;
  eventType: string;
  stage: string;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AssessmentEvent"
      ("id", "userId", "sessionId", "questionId", "eventType", "stage", "metadata", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)`,
    randomUUID(),
    args.userId,
    args.sessionId,
    safeString(args.questionId).trim() || null,
    safeString(args.eventType).trim() || 'assessment_event',
    safeString(args.stage).trim() || 'unknown',
    JSON.stringify(args.metadata || {})
  );
}

function buildFollowupPaths(result: {
  topic?: string | null;
  subject?: string | null;
  scorePercent: number;
  workspaceMode: AssessmentWorkspaceMode;
}): AssessmentNextMove[] {
  const topic = safeString(result.topic).trim() || null;
  const subject = safeString(result.subject).trim() || null;
  const needsSupport = result.scorePercent < 70;
  const rerunDestination: AssessmentNextMove['destination'] = result.workspaceMode === 'focus' ? 'focus' : 'exam';
  return needsSupport
    ? [
        {
          label: 'Open Revision',
          description: 'Save and correct the weak steps before your next drill.',
          destination: 'revision',
          intent: 'open_revision',
          topic,
          subject,
        },
        {
          label: 'Rescue weak topic',
          description: 'Run one weak-topic recovery cycle in Growth.',
          destination: 'growth',
          intent: 'weak_topic_recovery',
          topic,
          subject,
        },
        {
          label: 'Visual recap',
          description: 'Use one short media recap after the attempt.',
          destination: 'media',
          intent: 'open_study_stream',
          topic,
          subject,
        },
      ]
    : [
        {
          label: 'Start similar drill',
          description: result.workspaceMode === 'focus'
            ? 'Keep the calm rhythm with one more short focused drill.'
            : 'Reinforce momentum with one more short exam drill.',
          destination: rerunDestination,
          intent: 'start_similar_drill',
          topic,
          subject,
        },
        {
          label: 'Save best method',
          description: 'Save your successful method into Revision.',
          destination: 'revision',
          intent: 'save_revision_method',
          topic,
          subject,
        },
      ];
}

async function maybeFinalizeTimedOutSession(userId: string, sessionId: string): Promise<AssessmentSessionSnapshot | null> {
  const row = await loadSessionRow(userId, sessionId);
  if (!row) return null;
  const session = toSessionDto(row);
  if (session.status !== 'in_progress' || session.timerDurationSec == null || session.timerRemainingSec == null) {
    return null;
  }
  const startedAt = session.timerStartedAt ? new Date(session.timerStartedAt).getTime() : null;
  if (!startedAt) return null;
  const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAt) / SECOND_MS));
  const remainingSec = Math.max(0, session.timerRemainingSec - elapsedSec);
  if (remainingSec > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE "AssessmentSession"
       SET "timerRemainingSec" = $2, "timerStartedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $1`,
      sessionId,
      remainingSec
    );
    return null;
  }
  const questionRows = await loadQuestionRows(sessionId);
  const currentQuestion =
    questionRows.find((entry) => Number(entry.position || 0) === session.currentIndex) ||
    questionRows.find((entry) => coerceQuestionStatus(entry.status) === 'pending') ||
    null;
  if (currentQuestion && coerceQuestionStatus(currentQuestion.status) === 'pending') {
    await prisma.$executeRawUnsafe(
      `UPDATE "AssessmentQuestion"
       SET "status" = 'skipped', "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $1`,
      currentQuestion.id
    );
    await recordAssessmentEvent({
      userId,
      sessionId,
      questionId: currentQuestion.id,
      eventType: 'assessment_question_forced_finalize',
      stage: 'timer_expired',
      metadata: {
        reason: 'timer_expired',
        forcedStatus: 'skipped',
      },
    });
    await refreshCounters(sessionId);
  }
  const finishResult = await finishAssessmentSession({
    userId,
    sessionId,
    reason: 'timer_expired',
  });
  return finishResult.snapshot;
}

async function buildSnapshotById(args: {
  userId: string;
  sessionId: string;
  resumed?: boolean;
}): Promise<AssessmentSessionSnapshot | null> {
  await maybeFinalizeTimedOutSession(args.userId, args.sessionId);
  const row = await loadSessionRow(args.userId, args.sessionId);
  if (!row) return null;
  const questionRows = await loadQuestionRows(args.sessionId);
  const sessionDto = toSessionDto(row);
  const currentRow = questionRows.find((entry) => Number(entry.position || 0) === sessionDto.currentIndex) || questionRows[0] || null;
  const latestAttempt = currentRow ? await loadLatestAttempt(args.sessionId, currentRow.id) : null;
  const resultRow = await loadResultRow(args.sessionId);
  return calculateSnapshot({
    sessionRow: row,
    questionRows,
    latestAttempt,
    resultRow,
    resumed: args.resumed,
  });
}

async function finalizeResultRow(args: {
  userId: string;
  sessionId: string;
  reason?: string | null;
}): Promise<AssessmentResult> {
  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  const questionRows = await loadQuestionRows(args.sessionId);
  const attempts = await prisma.$queryRawUnsafe<AssessmentAttemptRow[]>(
    `SELECT * FROM "AssessmentAttempt" WHERE "sessionId" = $1 ORDER BY "attemptIndex" DESC`,
    args.sessionId
  );
  const latestAttemptByQuestion = new Map<string, AssessmentAttemptRow>();
  for (const attempt of attempts) {
    if (!latestAttemptByQuestion.has(attempt.questionId)) latestAttemptByQuestion.set(attempt.questionId, attempt);
  }

  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  const topicMap = new Map<string, { topic: string; subject: string | null; total: number; correct: number; partial: number; incorrect: number }>();
  const mistakeMap = new Map<string, { pattern: string; count: number; topic: string | null; subject: string | null }>();
  const weakTopicTriggers = new Set<string>();
  const improvementSignals: string[] = [];

  for (const question of questionRows) {
    const key = `${safeString(question.subject).trim() || DEFAULT_SUBJECT}::${safeString(question.topic).trim() || 'General'}`;
    const topicEntry = topicMap.get(key) || {
      topic: safeString(question.topic).trim() || 'General',
      subject: safeString(question.subject).trim() || null,
      total: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
    };
    topicEntry.total += 1;
    const status = coerceQuestionStatus(question.status);
    const attempt = latestAttemptByQuestion.get(question.id) || null;
    if (status === 'answered' && attempt?.isCorrect) {
      correctCount += 1;
      topicEntry.correct += 1;
    } else if (status === 'answered' && attempt?.isPartial) {
      partialCount += 1;
      topicEntry.partial += 1;
    } else {
      incorrectCount += 1;
      topicEntry.incorrect += 1;
      weakTopicTriggers.add(safeString(question.topic).trim() || safeString(question.subtopic).trim() || 'General');
      const meta = parseJsonValue<Record<string, unknown>>(attempt?.metadata, {});
      const pattern = safeString(meta.primaryIssue).trim() || 'Missed core reasoning step';
      const patternKey = `${pattern}::${topicEntry.topic}`;
      const current = mistakeMap.get(patternKey) || {
        pattern,
        count: 0,
        topic: topicEntry.topic,
        subject: topicEntry.subject,
      };
      current.count += 1;
      mistakeMap.set(patternKey, current);
    }
    topicMap.set(key, topicEntry);
  }

  if (correctCount > 0) improvementSignals.push('You converted some questions cleanly under exam pacing.');
  if (partialCount > 0) improvementSignals.push('Partial answers show progress, but one key reasoning layer still needs tightening.');
  if (!improvementSignals.length) improvementSignals.push('This attempt created a clear diagnosis map for your next revision move.');

  const gradedTotal = Math.max(1, questionRows.length);
  const scorePercent = Math.round(((correctCount + partialCount * 0.5) / gradedTotal) * 100);
  const sessionCreatedMs = new Date(session.createdAt).getTime();
  const nowMs = Date.now();
  const timedDuration = session.timerDurationSec ?? null;
  const remaining = session.timerRemainingSec ?? null;
  const timeUsedSec = timedDuration != null && remaining != null
    ? Math.max(0, timedDuration - remaining)
    : Math.max(0, Math.round((nowMs - sessionCreatedMs) / SECOND_MS));
  const followupPaths = buildFollowupPaths({
    topic: session.topic,
    subject: session.subject,
    scorePercent,
    workspaceMode: session.workspaceMode,
  });
  const bestNextMove = followupPaths[0];
  const resultId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "AssessmentResult"
      ("id", "sessionId", "userId", "scorePercent", "correctCount", "incorrectCount", "partialCount", "timeUsedSec",
       "topicBreakdown", "mistakeClusters", "weakTopicTriggers", "improvementSignals", "bestNextMove", "followupPaths", "metadata", "completedAt", "createdAt", "updatedAt")
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("sessionId") DO UPDATE SET
        "scorePercent" = EXCLUDED."scorePercent",
        "correctCount" = EXCLUDED."correctCount",
        "incorrectCount" = EXCLUDED."incorrectCount",
        "partialCount" = EXCLUDED."partialCount",
        "timeUsedSec" = EXCLUDED."timeUsedSec",
        "topicBreakdown" = EXCLUDED."topicBreakdown",
        "mistakeClusters" = EXCLUDED."mistakeClusters",
        "weakTopicTriggers" = EXCLUDED."weakTopicTriggers",
        "improvementSignals" = EXCLUDED."improvementSignals",
        "bestNextMove" = EXCLUDED."bestNextMove",
        "followupPaths" = EXCLUDED."followupPaths",
        "metadata" = EXCLUDED."metadata",
        "completedAt" = CURRENT_TIMESTAMP,
        "updatedAt" = CURRENT_TIMESTAMP`,
    resultId,
    args.sessionId,
    args.userId,
    scorePercent,
    correctCount,
    incorrectCount,
    partialCount,
    timeUsedSec,
    JSON.stringify(Array.from(topicMap.values())),
    JSON.stringify(Array.from(mistakeMap.values()).sort((a, b) => b.count - a.count).slice(0, 6)),
    JSON.stringify(Array.from(weakTopicTriggers)),
    JSON.stringify(improvementSignals),
    JSON.stringify(bestNextMove),
    JSON.stringify(followupPaths),
    JSON.stringify({ reason: safeString(args.reason).trim() || 'manual_finish', generatedAt: new Date().toISOString() })
  );

  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
     SET "status" = 'completed',
         "timerStartedAt" = NULL,
         "timerRemainingSec" = $2,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $1`,
    args.sessionId,
    Math.max(0, session.timerRemainingSec || 0)
  );
  const counters = await refreshCounters(args.sessionId);
  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
      SET "currentIndex" = $2,
          "totalQuestions" = $3,
          "answeredCount" = $4,
          "skippedCount" = $5,
          "flaggedCount" = $6,
          "remainingCount" = $7,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    args.sessionId,
    Math.max(0, Math.min(counters.total - 1, session.currentIndex)),
    counters.total,
    counters.answered,
    counters.skipped,
    counters.flagged,
    counters.remaining
  );
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    eventType: 'assessment_session_completed',
    stage: 'completed',
    metadata: {
      scorePercent,
      correctCount,
      incorrectCount,
      partialCount,
      weakTopicTriggers: Array.from(weakTopicTriggers),
      reason: safeString(args.reason).trim() || 'manual_finish',
    },
  });
  await recordLearningEffectEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    subject: session.subject || null,
    topic: session.topic || null,
    eventType: 'assessment_session_completed',
    outcome: scorePercent >= 70 ? 'completed' : 'struggled',
    metadata: {
      modeType: session.modeType,
      workspaceMode: session.workspaceMode,
      scorePercent,
      weakTopicTriggers: Array.from(weakTopicTriggers),
      timeUsedSec,
    },
  }).catch(() => undefined);
  if (weakTopicTriggers.size > 0) {
    await recordLearningEffectEvent({
      userId: args.userId,
      sessionId: args.sessionId,
      subject: session.subject || null,
      topic: session.topic || null,
      eventType: 'assessment_weak_topic_signal',
      outcome: 'struggled',
      metadata: {
        weakTopicTriggers: Array.from(weakTopicTriggers),
        scorePercent,
      },
    }).catch(() => undefined);
  }
  if (mistakeMap.size > 0) {
    await recordLearningEffectEvent({
      userId: args.userId,
      sessionId: args.sessionId,
      subject: session.subject || null,
      topic: session.topic || null,
      eventType: 'assessment_mistake_journal_signal',
      outcome: scorePercent >= 70 ? 'partial' : 'struggled',
      metadata: {
        topMistakePatterns: Array.from(mistakeMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 3),
      },
    }).catch(() => undefined);
  }
  const mediaFollowup = followupPaths.find((entry) => entry.destination === 'media') || null;
  if (mediaFollowup) {
    await recordLearningEffectEvent({
      userId: args.userId,
      sessionId: args.sessionId,
      subject: session.subject || null,
      topic: session.topic || null,
      eventType: 'assessment_media_handoff_signal',
      outcome: scorePercent >= 70 ? 'completed' : 'partial',
      metadata: {
        nextMove: mediaFollowup,
      },
    }).catch(() => undefined);
  }
  const growthFollowup = followupPaths.find((entry) => entry.destination === 'growth') || null;
  if (growthFollowup) {
    await recordLearningEffectEvent({
      userId: args.userId,
      sessionId: args.sessionId,
      subject: session.subject || null,
      topic: session.topic || null,
      eventType: 'assessment_growth_handoff_signal',
      outcome: scorePercent >= 70 ? 'completed' : 'partial',
      metadata: {
        nextMove: growthFollowup,
      },
    }).catch(() => undefined);
  }

  const resultRow = await loadResultRow(args.sessionId);
  if (!resultRow) throw new Error('Failed to create assessment result.');
  return toResultDto(resultRow);
}

export async function ensureAssessmentTables() {
  if (!ensureAssessmentTablesPromise) {
    ensureAssessmentTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentSession" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "workspaceMode" TEXT NOT NULL,
          "modeType" TEXT NOT NULL,
          "questionStyle" TEXT NOT NULL,
          "strictness" TEXT NOT NULL,
          "reviewMode" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'created',
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "schoolLevel" TEXT NULL,
          "totalQuestions" INTEGER NOT NULL DEFAULT 0,
          "currentIndex" INTEGER NOT NULL DEFAULT 0,
          "answeredCount" INTEGER NOT NULL DEFAULT 0,
          "skippedCount" INTEGER NOT NULL DEFAULT 0,
          "flaggedCount" INTEGER NOT NULL DEFAULT 0,
          "remainingCount" INTEGER NOT NULL DEFAULT 0,
          "timerDurationSec" INTEGER NULL,
          "timerRemainingSec" INTEGER NULL,
          "timerStartedAt" TIMESTAMP(3) NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentQuestion" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "position" INTEGER NOT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "subtopic" TEXT NULL,
          "questionType" TEXT NOT NULL,
          "prompt" TEXT NOT NULL,
          "options" JSONB NULL,
          "expectedAnswer" JSONB NULL,
          "explanation" TEXT NULL,
          "hint" TEXT NULL,
          "whyNow" TEXT NULL,
          "thingToNotice" TEXT NULL,
          "bestFor" TEXT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "isFlagged" BOOLEAN NOT NULL DEFAULT false,
          "unsureMarked" BOOLEAN NOT NULL DEFAULT false,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentAttempt" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "attemptIndex" INTEGER NOT NULL DEFAULT 1,
          "answer" JSONB NULL,
          "isCorrect" BOOLEAN NOT NULL DEFAULT false,
          "isPartial" BOOLEAN NOT NULL DEFAULT false,
          "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "responseTimeSec" INTEGER NULL,
          "feedbackShort" TEXT NULL,
          "memoryNote" TEXT NULL,
          "metadata" JSONB NULL,
          "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentFlag" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "reason" TEXT NULL,
          "status" TEXT NOT NULL DEFAULT 'flagged',
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentResult" (
          "id" TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL UNIQUE,
          "userId" TEXT NOT NULL,
          "scorePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "correctCount" INTEGER NOT NULL DEFAULT 0,
          "incorrectCount" INTEGER NOT NULL DEFAULT 0,
          "partialCount" INTEGER NOT NULL DEFAULT 0,
          "timeUsedSec" INTEGER NULL,
          "topicBreakdown" JSONB NULL,
          "mistakeClusters" JSONB NULL,
          "weakTopicTriggers" JSONB NULL,
          "improvementSignals" JSONB NULL,
          "bestNextMove" JSONB NULL,
          "followupPaths" JSONB NULL,
          "metadata" JSONB NULL,
          "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AssessmentEvent" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "questionId" TEXT NULL,
          "eventType" TEXT NOT NULL,
          "stage" TEXT NOT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_updatedAt_idx" ON "AssessmentSession" ("userId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentSession_userId_status_idx" ON "AssessmentSession" ("userId", "status", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_position_idx" ON "AssessmentQuestion" ("sessionId", "position");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentQuestion_session_status_idx" ON "AssessmentQuestion" ("sessionId", "status");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentAttempt_session_question_idx" ON "AssessmentAttempt" ("sessionId", "questionId", "attemptIndex" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentFlag_session_question_idx" ON "AssessmentFlag" ("sessionId", "questionId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentResult_userId_completedAt_idx" ON "AssessmentResult" ("userId", "completedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentEvent_userId_createdAt_idx" ON "AssessmentEvent" ("userId", "createdAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AssessmentEvent_session_stage_idx" ON "AssessmentEvent" ("sessionId", "stage", "createdAt" DESC);`);
    })().catch((error) => {
      ensureAssessmentTablesPromise = null;
      throw error;
    });
  }
  await ensureAssessmentTablesPromise;
}

function formatAnswerPreview(args: AssessmentAnswerArgs): string | null {
  if (typeof args.answer === 'number' && Number.isFinite(args.answer)) {
    return String(args.answer);
  }
  const directAnswer = safeString(args.answer).trim();
  if (directAnswer) return directAnswer.slice(0, 220);
  const selectedOption = safeString(args.selectedOptionId).trim().toUpperCase();
  if (selectedOption) return `Option ${selectedOption}`;
  const workedSteps = safeString(args.workedSteps).trim();
  if (workedSteps) return workedSteps.slice(0, 220);
  return null;
}

function resolveFeedbackStatus(outcome: EvaluationOutcome): 'correct' | 'incorrect' | 'partial' {
  if (outcome.isCorrect) return 'correct';
  if (outcome.isPartial) return 'partial';
  return 'incorrect';
}

function buildAnswerFeedback(args: {
  session: AssessmentSession;
  question: AssessmentQuestionRow;
  outcome: EvaluationOutcome;
}): AssessmentAnswerResponse['feedback'] {
  const status = resolveFeedbackStatus(args.outcome);
  const deferred = shouldDeferDetailedFeedback(args.session.strictness, args.session.reviewMode);
  const conciseMode = args.session.strictness === 'strict_exam';
  const headline =
    status === 'correct'
      ? 'Good control.'
      : status === 'partial'
        ? 'Partly right.'
        : 'Not yet.';

  let explanation = args.outcome.explanation;
  let remember = args.outcome.remember;
  let nextActionLabel = status === 'correct' ? 'Next question' : 'Try next question';

  if (deferred) {
    explanation = 'Answer recorded. Detailed review unlocks during block or session review.';
    remember = 'Keep pacing steady and complete the block first.';
    nextActionLabel = 'Continue block';
  } else if (conciseMode) {
    if (status === 'correct') {
      explanation = 'Correct. Keep this exact structure under pressure.';
    } else {
      explanation = `Not yet. ${args.outcome.primaryIssue}`;
    }
    remember = status === 'correct'
      ? 'Repeat the same disciplined structure on the next item.'
      : 'Name the target step first, then justify the operation.';
  }

  const handoff: AssessmentNextMove | null =
    status === 'correct'
      ? null
      : {
          label: 'Save correction',
          description: 'Capture this fix in Revision before it repeats.',
          destination: 'revision',
          intent: 'save_revision_correction',
          topic: safeString(args.question.topic).trim() || args.session.topic || null,
          subject: safeString(args.question.subject).trim() || args.session.subject || null,
        };

  return {
    status,
    headline,
    explanation,
    remember,
    nextActionLabel,
    handoff,
  };
}

function resolveJumpIndex(targetIndex: number | null | undefined, totalQuestions: number): number | null {
  if (typeof targetIndex !== 'number' || !Number.isFinite(targetIndex)) return null;
  const rounded = Math.round(targetIndex);
  if (rounded >= 1 && rounded <= totalQuestions) return rounded - 1;
  if (rounded >= 0 && rounded < totalQuestions) return rounded;
  return null;
}

function resolveQuestionRowForSession(args: {
  session: AssessmentSession;
  questionRows: AssessmentQuestionRow[];
  questionId?: string | null;
}): AssessmentQuestionRow | null {
  const requestedId = safeString(args.questionId).trim();
  if (requestedId) {
    return args.questionRows.find((row) => row.id === requestedId) || null;
  }
  const byCurrentIndex =
    args.questionRows.find((row) => Number(row.position || 0) === args.session.currentIndex) || null;
  if (byCurrentIndex) return byCurrentIndex;
  return args.questionRows[0] || null;
}

async function computeTimerStateForActiveSession(session: AssessmentSession): Promise<{
  remainingSec: number | null;
  startedAtIso: string | null;
}> {
  if (session.timerDurationSec == null || session.timerRemainingSec == null) {
    return {
      remainingSec: null,
      startedAtIso: null,
    };
  }
  const startedAtMs = session.timerStartedAt ? new Date(session.timerStartedAt).getTime() : Date.now();
  const elapsedSec = Math.max(0, Math.floor((Date.now() - startedAtMs) / SECOND_MS));
  const remainingSec = Math.max(0, session.timerRemainingSec - elapsedSec);
  return {
    remainingSec,
    startedAtIso: remainingSec > 0 ? new Date().toISOString() : null,
  };
}

export async function startAssessmentSession(args: AssessmentStartArgs): Promise<AssessmentSessionSnapshot> {
  await ensureAssessmentTables();
  const preset = resolveModePreset(args.workspaceMode, args.modeType);
  if (Boolean(args.resumeLatest)) {
    const [active] = await prisma.$queryRawUnsafe<AssessmentSessionRow[]>(
      `SELECT * FROM "AssessmentSession"
       WHERE "userId" = $1 AND "workspaceMode" = $2 AND "status" IN ('created','in_progress','paused')
       ORDER BY "updatedAt" DESC
       LIMIT 1`,
      args.userId,
      args.workspaceMode
    );
    if (active) {
      return (await buildSnapshotById({
        userId: args.userId,
        sessionId: active.id,
        resumed: true,
      })) as AssessmentSessionSnapshot;
    }
    if (args.createIfNone === false) {
      throw new Error('No resumable session found.');
    }
  }

  const resolvedContext = await selectTargetContext({
    userId: args.userId,
    modeType: args.modeType || preset.modeType,
    topic: args.topic,
    subject: args.subject,
  });
  const subject = safeString(args.subject).trim() || resolvedContext.subject || DEFAULT_SUBJECT;
  const topic = safeString(args.topic).trim() || resolvedContext.topic || (args.workspaceMode === 'focus' ? DEFAULT_FOCUS_TOPIC : DEFAULT_EXAM_TOPIC);
  const questionStyle = args.questionStyle || preset.questionStyle;
  const strictness = args.strictness || preset.strictness;
  const reviewMode = args.reviewMode || preset.reviewMode;
  const modeType = args.modeType || preset.modeType;
  const questionCount = clampNumber(
    Math.round(typeof args.questionCount === 'number' ? args.questionCount : preset.questionCount),
    MIN_QUESTION_COUNT,
    MAX_QUESTION_COUNT
  );
  const timerDurationSec = estimateTimerDurationSec(modeType, questionCount, args.timedMinutes ?? preset.timedMinutes);
  const sessionId = randomUUID();
  const questionBlueprints = buildQuestionBlueprints({
    subject,
    topic,
    questionCount,
    questionStyle,
    schoolLevel: safeString(args.schoolLevel).trim() || null,
    workspaceMode: args.workspaceMode,
  });

  await prisma.$executeRawUnsafe(
    `INSERT INTO "AssessmentSession"
      ("id", "userId", "workspaceMode", "modeType", "questionStyle", "strictness", "reviewMode", "status",
       "subject", "topic", "schoolLevel", "totalQuestions", "currentIndex", "answeredCount", "skippedCount",
       "flaggedCount", "remainingCount", "timerDurationSec", "timerRemainingSec", "timerStartedAt", "metadata", "createdAt", "updatedAt")
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, 'in_progress', $8, $9, $10, $11, 0, 0, 0, 0, $12, $13, $14, $15, $16::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    sessionId,
    args.userId,
    args.workspaceMode,
    modeType,
    questionStyle,
    strictness,
    reviewMode,
    subject,
    topic,
    safeString(args.schoolLevel).trim() || null,
    questionCount,
    questionCount,
    timerDurationSec,
    timerDurationSec,
    timerDurationSec != null ? new Date().toISOString() : null,
    JSON.stringify({
      preset: modeType,
      allowBacktrack: preset.allowBacktrack,
      source: 'assessment_session_service',
      createdFrom: args.resumeLatest ? 'resume_or_create' : 'new',
    })
  );

  for (const blueprint of questionBlueprints) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AssessmentQuestion"
        ("id", "sessionId", "position", "subject", "topic", "subtopic", "questionType", "prompt", "options",
         "expectedAnswer", "explanation", "hint", "whyNow", "thingToNotice", "bestFor", "status",
         "isFlagged", "unsureMarked", "metadata", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15, 'pending', false, false, $16::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      randomUUID(),
      sessionId,
      blueprint.position,
      blueprint.subject,
      blueprint.topic,
      blueprint.subtopic,
      blueprint.questionType,
      blueprint.prompt,
      JSON.stringify(blueprint.options || null),
      JSON.stringify(blueprint.expectedAnswer || {}),
      blueprint.explanation,
      blueprint.hint,
      blueprint.whyNow,
      blueprint.thingToNotice,
      blueprint.bestFor,
      JSON.stringify(blueprint.metadata || {})
    );
  }

  await refreshCounters(sessionId);
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId,
    eventType: 'assessment_session_started',
    stage: 'created',
    metadata: {
      workspaceMode: args.workspaceMode,
      modeType,
      strictness,
      reviewMode,
      questionCount,
      timerDurationSec,
      subject,
      topic,
    },
  });

  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId,
  });
  if (!snapshot) throw new Error('Failed to start assessment session.');
  return snapshot;
}

export async function getAssessmentSession(args: {
  userId: string;
  sessionId: string;
}): Promise<AssessmentSessionSnapshot> {
  await ensureAssessmentTables();
  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId: args.sessionId,
  });
  if (!snapshot) throw new Error('Assessment session not found.');
  return snapshot;
}

export async function answerAssessmentQuestion(args: AssessmentAnswerArgs): Promise<AssessmentAnswerResponse> {
  await ensureAssessmentTables();
  await maybeFinalizeTimedOutSession(args.userId, args.sessionId);

  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  if (session.status === 'completed') throw new Error('Assessment session already completed.');
  if (session.status === 'paused') throw new Error('Assessment session is paused. Resume before submitting.');
  if (session.status === 'abandoned') throw new Error('Assessment session is not active.');

  const questionRows = await loadQuestionRows(args.sessionId);
  const questionRow = resolveQuestionRowForSession({
    session,
    questionRows,
    questionId: args.questionId,
  });
  if (!questionRow) throw new Error('Assessment question not found.');

  const outcome = evaluateAnswer(questionRow, args);
  const answerPreview = formatAnswerPreview(args);
  const [attemptIndexRow] = await prisma.$queryRawUnsafe<Array<{ maxIndex: number | null }>>(
    `SELECT MAX("attemptIndex")::int AS "maxIndex"
       FROM "AssessmentAttempt"
      WHERE "sessionId" = $1 AND "questionId" = $2`,
    args.sessionId,
    questionRow.id
  );
  const attemptIndex = Number(attemptIndexRow?.maxIndex || 0) + 1;
  const attemptId = randomUUID();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "AssessmentAttempt"
      ("id", "sessionId", "questionId", "userId", "attemptIndex", "answer", "isCorrect", "isPartial", "score",
       "responseTimeSec", "feedbackShort", "memoryNote", "metadata", "submittedAt")
     VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13::jsonb, CURRENT_TIMESTAMP)`,
    attemptId,
    args.sessionId,
    questionRow.id,
    args.userId,
    attemptIndex,
    JSON.stringify({
      value: args.answer ?? null,
      selectedOptionId: safeString(args.selectedOptionId).trim() || null,
      workedSteps: safeString(args.workedSteps).trim() || null,
      unsure: Boolean(args.unsure),
      flagForReview: Boolean(args.flagForReview),
      preview: answerPreview,
    }),
    outcome.isCorrect,
    outcome.isPartial,
    outcome.score,
    typeof args.responseTimeSec === 'number' && Number.isFinite(args.responseTimeSec)
      ? clampNumber(Math.round(args.responseTimeSec), 0, 24 * 60 * 60)
      : null,
    outcome.primaryIssue,
    outcome.remember,
    JSON.stringify({
      primaryIssue: outcome.primaryIssue,
      explanation: outcome.explanation,
      strictness: session.strictness,
      reviewMode: session.reviewMode,
    })
  );

  const nextFlaggedState = Boolean(args.flagForReview || questionRow.isFlagged);
  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentQuestion"
        SET "status" = 'answered',
            "isFlagged" = $2,
            "unsureMarked" = $3,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    questionRow.id,
    nextFlaggedState,
    Boolean(args.unsure || questionRow.unsureMarked)
  );

  if (args.flagForReview) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "AssessmentFlag"
        ("id", "sessionId", "questionId", "userId", "reason", "status", "metadata", "createdAt", "updatedAt")
       VALUES
        ($1, $2, $3, $4, $5, 'flagged', $6::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("id") DO NOTHING`,
      randomUUID(),
      args.sessionId,
      questionRow.id,
      args.userId,
      'Marked for review',
      JSON.stringify({
        source: 'answer_submission',
      })
    );
  }

  const currentPosition = clampNumber(Number(questionRow.position || session.currentIndex), 0, Math.max(0, questionRows.length - 1));
  const nextIndex = currentPosition < questionRows.length - 1 ? currentPosition + 1 : currentPosition;
  const timerState = await computeTimerStateForActiveSession(session);
  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
        SET "currentIndex" = $2,
            "status" = 'in_progress',
            "timerRemainingSec" = COALESCE($3, "timerRemainingSec"),
            "timerStartedAt" = $4,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    args.sessionId,
    nextIndex,
    timerState.remainingSec,
    timerState.startedAtIso
  );
  const counters = await refreshCounters(args.sessionId);

  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    questionId: questionRow.id,
    eventType: 'assessment_answer_submitted',
    stage: 'in_progress',
    metadata: {
      attemptId,
      attemptIndex,
      isCorrect: outcome.isCorrect,
      isPartial: outcome.isPartial,
      score: outcome.score,
      primaryIssue: outcome.primaryIssue,
      reviewMode: session.reviewMode,
      strictness: session.strictness,
      flagged: nextFlaggedState,
      unsure: Boolean(args.unsure),
      remaining: counters.remaining,
    },
  });

  if (timerState.remainingSec != null && timerState.remainingSec <= 0) {
    const finished = await finishAssessmentSession({
      userId: args.userId,
      sessionId: args.sessionId,
      reason: 'timer_expired_after_submission',
    });
    const [attemptRow] = await prisma.$queryRawUnsafe<AssessmentAttemptRow[]>(
      `SELECT * FROM "AssessmentAttempt" WHERE "id" = $1 LIMIT 1`,
      attemptId
    );
    if (!attemptRow) throw new Error('Failed to load assessment attempt.');
    return {
      snapshot: finished.snapshot,
      attempt: toAttemptDto(attemptRow),
      feedback: buildAnswerFeedback({
        session: finished.snapshot.session,
        question: questionRow,
        outcome,
      }),
    };
  }

  const shouldAutoFinish =
    counters.remaining <= 0 &&
    (session.reviewMode === 'immediate' || session.reviewMode === 'delayed_block' || session.reviewMode === 'post_mock');

  if (shouldAutoFinish) {
    const finished = await finishAssessmentSession({
      userId: args.userId,
      sessionId: args.sessionId,
      reason: 'auto_complete',
    });
    const [attemptRow] = await prisma.$queryRawUnsafe<AssessmentAttemptRow[]>(
      `SELECT * FROM "AssessmentAttempt" WHERE "id" = $1 LIMIT 1`,
      attemptId
    );
    if (!attemptRow) throw new Error('Failed to load assessment attempt.');
    return {
      snapshot: finished.snapshot,
      attempt: toAttemptDto(attemptRow),
      feedback: buildAnswerFeedback({
        session: finished.snapshot.session,
        question: questionRow,
        outcome,
      }),
    };
  }

  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId: args.sessionId,
  });
  const [attemptRow] = await prisma.$queryRawUnsafe<AssessmentAttemptRow[]>(
    `SELECT * FROM "AssessmentAttempt" WHERE "id" = $1 LIMIT 1`,
    attemptId
  );
  if (!snapshot || !attemptRow) throw new Error('Failed to refresh assessment state.');
  return {
    snapshot,
    attempt: toAttemptDto(attemptRow),
    feedback: buildAnswerFeedback({
      session: snapshot.session,
      question: questionRow,
      outcome,
    }),
  };
}

export async function navigateAssessmentSession(args: AssessmentNavigateArgs): Promise<{ snapshot: AssessmentSessionSnapshot }> {
  await ensureAssessmentTables();
  await maybeFinalizeTimedOutSession(args.userId, args.sessionId);

  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  if (session.status === 'completed') {
    const snapshot = await buildSnapshotById({
      userId: args.userId,
      sessionId: args.sessionId,
    });
    if (!snapshot) throw new Error('Assessment session not found.');
    return { snapshot };
  }
  if (session.status === 'paused') {
    throw new Error('Assessment session is paused. Resume before navigating.');
  }

  const questionRows = await loadQuestionRows(args.sessionId);
  if (!questionRows.length) throw new Error('No questions available in this session.');
  const ordered = [...questionRows].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  const total = ordered.length;
  let nextIndex = clampNumber(session.currentIndex, 0, Math.max(0, total - 1));

  if (args.direction === 'next') {
    nextIndex = Math.min(total - 1, nextIndex + 1);
  } else if (args.direction === 'previous') {
    nextIndex = Math.max(0, nextIndex - 1);
  } else if (args.direction === 'jump') {
    const jumpIndex = resolveJumpIndex(args.targetIndex, total);
    if (jumpIndex == null) throw new Error('Invalid target index for jump navigation.');
    nextIndex = jumpIndex;
  } else if (args.direction === 'unanswered') {
    const target = ordered.find((row) => coerceQuestionStatus(row.status) === 'pending') || null;
    if (target) nextIndex = clampNumber(Number(target.position || 0), 0, total - 1);
  } else if (args.direction === 'review_flagged') {
    const target = ordered.find((row) => Boolean(row.isFlagged)) || null;
    if (target) nextIndex = clampNumber(Number(target.position || 0), 0, total - 1);
  } else if (args.direction === 'skip_current') {
    const currentRow =
      ordered.find((row) => Number(row.position || 0) === nextIndex) || ordered[nextIndex] || null;
    if (currentRow && coerceQuestionStatus(currentRow.status) === 'pending') {
      await prisma.$executeRawUnsafe(
        `UPDATE "AssessmentQuestion"
            SET "status" = 'skipped',
                "isFlagged" = CASE WHEN $2 THEN true ELSE "isFlagged" END,
                "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = $1`,
        currentRow.id,
        Boolean(safeString(args.flagReason).trim())
      );
      if (safeString(args.flagReason).trim()) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "AssessmentFlag"
            ("id", "sessionId", "questionId", "userId", "reason", "status", "metadata", "createdAt", "updatedAt")
           VALUES
            ($1, $2, $3, $4, $5, 'flagged', $6::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          randomUUID(),
          args.sessionId,
          currentRow.id,
          args.userId,
          safeString(args.flagReason).trim(),
          JSON.stringify({
            source: 'navigate_skip_current',
          })
        );
      }
    }
    nextIndex = Math.min(total - 1, nextIndex + 1);
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
        SET "currentIndex" = $2,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    args.sessionId,
    nextIndex
  );
  const counters = await refreshCounters(args.sessionId);
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    eventType: 'assessment_navigate',
    stage: 'in_progress',
    metadata: {
      direction: args.direction,
      targetIndex: args.targetIndex ?? null,
      resolvedIndex: nextIndex,
      flagReason: safeString(args.flagReason).trim() || null,
      remaining: counters.remaining,
    },
  });

  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId: args.sessionId,
  });
  if (!snapshot) throw new Error('Failed to refresh assessment session.');
  return { snapshot };
}

export async function requestAssessmentHint(args: AssessmentHintArgs): Promise<AssessmentHintResponse> {
  await ensureAssessmentTables();
  await maybeFinalizeTimedOutSession(args.userId, args.sessionId);

  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  if (session.status !== 'in_progress') {
    throw new Error('Assessment session must be in progress to request a hint.');
  }
  const policy = derivePolicy(session.strictness, session.reviewMode);
  if (!policy.preSubmitHelpAllowed || policy.hintsPerQuestion <= 0) {
    throw new Error('Hints are disabled for this assessment strictness.');
  }

  const questionRows = await loadQuestionRows(args.sessionId);
  const questionRow = resolveQuestionRowForSession({
    session,
    questionRows,
    questionId: args.questionId,
  });
  if (!questionRow) throw new Error('Assessment question not found.');
  if (coerceQuestionStatus(questionRow.status) === 'answered') {
    throw new Error('Hints are only available before submitting this question.');
  }

  const [usageRow] = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*)::int AS "count"
       FROM "AssessmentEvent"
      WHERE "sessionId" = $1
        AND "questionId" = $2
        AND "eventType" = 'assessment_hint_requested'`,
    args.sessionId,
    questionRow.id
  );
  const used = Number(usageRow?.count || 0);
  if (used >= policy.hintsPerQuestion) {
    throw new Error('Hint limit reached for this question.');
  }

  const hintText = safeString(questionRow.hint).trim() || 'Start with the first verifiable step and keep it concise.';
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    questionId: questionRow.id,
    eventType: 'assessment_hint_requested',
    stage: 'in_progress',
    metadata: {
      usedHints: used + 1,
      allowedHints: policy.hintsPerQuestion,
      strictness: session.strictness,
      reviewMode: session.reviewMode,
    },
  });

  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId: args.sessionId,
  });
  if (!snapshot) throw new Error('Failed to refresh assessment session.');
  return {
    snapshot,
    hint: hintText,
    remainingHints: Math.max(0, policy.hintsPerQuestion - (used + 1)),
  };
}

export async function pauseAssessmentSession(args: {
  userId: string;
  sessionId: string;
}): Promise<AssessmentSessionSnapshot> {
  await ensureAssessmentTables();
  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  if (session.status === 'completed') {
    const snapshot = await buildSnapshotById(args);
    if (!snapshot) throw new Error('Assessment session not found.');
    return snapshot;
  }
  if (session.status === 'paused') {
    const snapshot = await buildSnapshotById(args);
    if (!snapshot) throw new Error('Assessment session not found.');
    return snapshot;
  }

  const timerState = await computeTimerStateForActiveSession(session);
  if (timerState.remainingSec != null && timerState.remainingSec <= 0) {
    const finished = await finishAssessmentSession({
      userId: args.userId,
      sessionId: args.sessionId,
      reason: 'timer_expired_on_pause',
    });
    return finished.snapshot;
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
        SET "status" = 'paused',
            "timerRemainingSec" = COALESCE($2, "timerRemainingSec"),
            "timerStartedAt" = NULL,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    args.sessionId,
    timerState.remainingSec
  );
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    eventType: 'assessment_session_paused',
    stage: 'paused',
    metadata: {
      timerRemainingSec: timerState.remainingSec,
    },
  });
  const snapshot = await buildSnapshotById(args);
  if (!snapshot) throw new Error('Assessment session not found.');
  return snapshot;
}

export async function resumeAssessmentSession(args: {
  userId: string;
  sessionId: string;
}): Promise<AssessmentSessionSnapshot> {
  await ensureAssessmentTables();
  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  if (session.status === 'completed') {
    const snapshot = await buildSnapshotById({
      ...args,
      resumed: true,
    });
    if (!snapshot) throw new Error('Assessment session not found.');
    return snapshot;
  }
  if (session.timerDurationSec != null && (session.timerRemainingSec ?? 0) <= 0) {
    const finished = await finishAssessmentSession({
      userId: args.userId,
      sessionId: args.sessionId,
      reason: 'timer_expired_on_resume',
    });
    return finished.snapshot;
  }

  await prisma.$executeRawUnsafe(
    `UPDATE "AssessmentSession"
        SET "status" = 'in_progress',
            "timerStartedAt" = CASE WHEN "timerDurationSec" IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END,
            "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1`,
    args.sessionId
  );
  await recordAssessmentEvent({
    userId: args.userId,
    sessionId: args.sessionId,
    eventType: 'assessment_session_resumed',
    stage: 'in_progress',
    metadata: {
      timerRemainingSec: session.timerRemainingSec,
    },
  });
  const snapshot = await buildSnapshotById({
    ...args,
    resumed: true,
  });
  if (!snapshot) throw new Error('Assessment session not found.');
  return snapshot;
}

export async function finishAssessmentSession(args: AssessmentFinishArgs): Promise<{
  snapshot: AssessmentSessionSnapshot;
  results: AssessmentResult;
}> {
  await ensureAssessmentTables();
  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);

  let results: AssessmentResult;
  if (session.status === 'completed') {
    const existing = await loadResultRow(args.sessionId);
    if (existing) {
      results = toResultDto(existing);
    } else {
      results = await finalizeResultRow(args);
    }
  } else {
    results = await finalizeResultRow(args);
  }

  const snapshot = await buildSnapshotById({
    userId: args.userId,
    sessionId: args.sessionId,
  });
  if (!snapshot) throw new Error('Failed to refresh completed assessment session.');
  return { snapshot, results };
}

export async function getAssessmentResults(args: {
  userId: string;
  sessionId: string;
}): Promise<{
  sessionId: string;
  results: AssessmentResult | null;
}> {
  await ensureAssessmentTables();
  const sessionRow = await loadSessionRow(args.userId, args.sessionId);
  if (!sessionRow) throw new Error('Assessment session not found.');
  const session = toSessionDto(sessionRow);
  let resultRow = await loadResultRow(args.sessionId);
  if (!resultRow && session.status === 'completed') {
    const finalized = await finalizeResultRow({
      userId: args.userId,
      sessionId: args.sessionId,
      reason: 'results_requested',
    });
    return {
      sessionId: args.sessionId,
      results: finalized,
    };
  }
  return {
    sessionId: args.sessionId,
    results: resultRow ? toResultDto(resultRow) : null,
  };
}

export const __assessmentSessionServiceInternals = {
  resolveModePreset,
  derivePolicy,
  canReviewNow,
  shouldDeferDetailedFeedback,
  timerUrgency,
};
