import { buildAutomationPolicy } from './socraticTutorAutomationPolicyService';
import { selectHintLevel } from './socraticHintLadderService';
import { selectQuestionType } from './socraticQuestionLadderService';
import { classifyGrowthEvidence } from './socraticGrowthEvidenceService';
import { decideSocraticCachePolicy } from './socraticTutorCachePolicy';
import { getSafeguardingStudentResponse } from './safeguardingExceptionPolicyService';
import type {
  AcademicIntegritySignal,
  SocraticRuntimePolicyPacket,
} from './socraticTutorPolicyContracts';

type ImmediateResponseType =
  | 'socratic_redirect'
  | 'academic_integrity_redirect'
  | 'safeguarding_safe_response'
  | 'privacy_safe_response'
  | 'clarification_request';

export interface BuildSocraticRuntimePolicyForTurnInput {
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
  message: string;
  subject?: string | null;
  topic?: string | null;
  gradeLevel?: string | null;
  educationLevel?: string | null;
  learnerPreferences?: Record<string, unknown>;
  masteryContext?: unknown;
  growthContext?: unknown;
  tutorState?: unknown;
  requestId?: string;
  traceId?: string;
}

export interface SocraticRuntimePolicyForTurnOutput {
  policyPacket: SocraticRuntimePolicyPacket;
  shouldCallAi: boolean;
  immediateResponse?: {
    responseType: ImmediateResponseType;
    message: string;
    rawPrivateDataIncluded: false;
  };
  safePromptInstructions: string[];
  safeContextSummary: string;
  audit: {
    eventType: string;
    severity: 'info' | 'warning' | 'critical';
    safeSummary: string;
    rawPrivateDataIncluded: false;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readNumber(source: unknown, keys: string[]): number | null {
  const record = asRecord(source);
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function readStringArray(source: unknown, keys: string[]): string[] {
  const record = asRecord(source);
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item;
          const itemRecord = asRecord(item);
          return String(itemRecord.label || itemRecord.summary || '').trim();
        })
        .filter(Boolean)
        .slice(0, 8);
    }
  }
  return [];
}

function readCount(source: unknown, keys: string[]): number {
  const record = asRecord(source);
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.length;
  }
  return 0;
}

function buildSafeContextSummary(input: {
  subject?: string | null;
  topic?: string | null;
  gradeLevel?: string | null;
  educationLevel?: string | null;
  masteryLevel: number | null;
  confidenceLevel: number | null;
  weakAreaCount: number;
  misconceptionCount: number;
  artifactRefs: number;
  videoRefs: number;
  sparseLearnerState: boolean;
}): string {
  return [
    `subject=${input.subject || 'unknown'}`,
    `topic=${input.topic || 'unknown'}`,
    `gradeLevel=${input.gradeLevel || 'unknown'}`,
    `educationLevel=${input.educationLevel || 'unknown'}`,
    `mastery=${input.masteryLevel === null ? 'unknown' : input.masteryLevel}`,
    `confidence=${input.confidenceLevel === null ? 'unknown' : input.confidenceLevel}`,
    `weakAreaCount=${input.weakAreaCount}`,
    `misconceptionCount=${input.misconceptionCount}`,
    `artifactRefs=${input.artifactRefs}`,
    `videoRefs=${input.videoRefs}`,
    `sparseLearnerState=${input.sparseLearnerState}`,
  ].join('; ');
}

function isActiveIntegritySignal(signal: AcademicIntegritySignal): boolean {
  return signal !== 'none' && signal !== 'allowed_learning_help';
}

function hasAcademicShortcutLanguage(message: string): boolean {
  return /\b(solve|do|complete|finish)\b.{0,50}\b(homework|assignment|worksheet|problem)\b.{0,50}\b(for me)\b/i.test(message) ||
    /\b(homework|assignment|worksheet)\b.{0,50}\b(answer|solution)\b/i.test(message);
}

function buildClarificationPacket(studentId: string): SocraticRuntimePolicyPacket {
  const { packet } = buildAutomationPolicy({
    studentId: studentId || 'unknown_student',
    message: '',
    weakAreas: [],
    misconceptions: [],
  });
  return {
    ...packet,
    noFinalAnswerRequired: true,
    recommendedTutorMove: 'Ask a clarifying question before tutoring.',
    forbiddenTutorMoves: [...new Set([...packet.forbiddenTutorMoves, 'give_final_answer', 'provide_solution'])],
    auditWarnings: [...new Set([...packet.auditWarnings, 'missing_required_runtime_identity_or_message'])],
  };
}

export async function buildSocraticRuntimePolicyForTurn(
  input: BuildSocraticRuntimePolicyForTurnInput,
): Promise<SocraticRuntimePolicyForTurnOutput> {
  const studentId = String(input.studentId || '').trim();
  const message = String(input.message || '').trim();
  const tutorState = asRecord(input.tutorState);
  const topic = input.topic || (tutorState.activeTopic as string | undefined) || 'current topic';
  const subject = input.subject || (tutorState.activeSubject as string | undefined) || null;

  if (!studentId || !message) {
    const policyPacket = buildClarificationPacket(studentId);
    return {
      policyPacket,
      shouldCallAi: false,
      immediateResponse: {
        responseType: 'clarification_request',
        message: 'Could you share what you want help understanding? I will guide you step by step.',
        rawPrivateDataIncluded: false,
      },
      safePromptInstructions: [
        'Socratic runtime policy: ask a clarification question before giving help.',
        'Do not provide final answers or answer keys.',
        'Do not include raw private learner data.',
      ],
      safeContextSummary: buildSafeContextSummary({
        subject,
        topic,
        gradeLevel: input.gradeLevel || null,
        educationLevel: input.educationLevel || null,
        masteryLevel: null,
        confidenceLevel: null,
        weakAreaCount: 0,
        misconceptionCount: 0,
        artifactRefs: 0,
        videoRefs: 0,
        sparseLearnerState: true,
      }),
      audit: {
        eventType: 'socratic_runtime_policy',
        severity: 'warning',
        safeSummary: 'Socratic runtime policy failed closed because required identity or message was missing.',
        rawPrivateDataIncluded: false,
      },
    };
  }

  const masteryLevel = readNumber(input.masteryContext, ['masteryLevel', 'mastery', 'averageMastery']);
  const confidenceLevel = readNumber(input.masteryContext, ['confidenceLevel', 'confidence', 'averageConfidence']);
  const attemptCount = readNumber(input.growthContext, ['attemptCount', 'recentAttemptCount', 'attempts']) ?? 0;
  const weakAreas = readStringArray(input.masteryContext, ['weakAreas', 'weaknesses']);
  const misconceptions = [
    ...readStringArray(input.growthContext, ['misconceptions', 'misconceptionSignals']),
    ...readStringArray(input.masteryContext, ['misconceptions', 'misconceptionSignals']),
  ].slice(0, 8);
  const artifactRefs = readCount(input.growthContext, ['artifactIds', 'activeArtifactIds']);
  const videoRefs = readCount(input.growthContext, ['videoIds', 'recommendedVideoIds']);
  const sparseLearnerState = masteryLevel === null && confidenceLevel === null && weakAreas.length === 0 && misconceptions.length === 0;

  const automation = buildAutomationPolicy({
    studentId,
    message,
    topic,
    gradeLevel: input.gradeLevel || null,
    masteryLevel,
    confidenceLevel,
    attemptCount,
    recentIntegritySignals: [],
    weakAreas,
    misconceptions,
    artifactContext: artifactRefs > 0 ? { artifactRefs } : undefined,
    learningMode: tutorState.learningMode as string | undefined || null,
  });

  const hint = selectHintLevel({
    topic,
    masteryLevel,
    confidenceLevel,
    attemptCount,
    challengeLevel: automation.packet.challengeLevel,
    integritySignalActive: isActiveIntegritySignal(automation.packet.integritySignal),
  });

  const question = selectQuestionType({
    topic,
    masteryLevel,
    confidenceLevel,
    attemptCount,
    challengeLevel: automation.packet.challengeLevel,
    hasMisconception: misconceptions.length > 0,
    isFirstInteraction: attemptCount <= 0,
  });

  const growthEvidence = classifyGrowthEvidence({
    activityType: message.length > 20 ? 'learner_message' : 'unknown',
    learnerResponse: message,
    attemptCount,
  });

  const cacheDecision = decideSocraticCachePolicy({
    supportMode: automation.packet.supportMode,
    riskLevel: automation.packet.safeguardingRiskLevel,
    hasStudentId: true,
    hasSafeguardingSignal: automation.packet.safeguardingSignal !== 'none',
    hasIntegritySignal: isActiveIntegritySignal(automation.packet.integritySignal),
  });

  const safeContextSummary = buildSafeContextSummary({
    subject,
    topic,
    gradeLevel: input.gradeLevel || null,
    educationLevel: input.educationLevel || null,
    masteryLevel,
    confidenceLevel,
    weakAreaCount: weakAreas.length,
    misconceptionCount: misconceptions.length,
    artifactRefs,
    videoRefs,
    sparseLearnerState,
  });

  const academicShortcutOverride = hasAcademicShortcutLanguage(message) &&
    !isActiveIntegritySignal(automation.packet.integritySignal);

  const policyPacket: SocraticRuntimePolicyPacket = {
    ...automation.packet,
    supportMode: academicShortcutOverride ? 'guided_steps' : automation.packet.supportMode,
    integritySignal: academicShortcutOverride
      ? 'possible_homework_answer_request'
      : automation.packet.integritySignal,
    noFinalAnswerRequired: automation.packet.noFinalAnswerRequired || academicShortcutOverride,
    recommendedTutorMove: academicShortcutOverride
      ? 'I can help you learn the method without solving it for you. What is the first step you would try?'
      : automation.packet.recommendedTutorMove,
    forbiddenTutorMoves: academicShortcutOverride
      ? [...new Set([...automation.packet.forbiddenTutorMoves, 'solve_exact_problem', 'give_final_answer', 'provide_solution'])]
      : automation.packet.forbiddenTutorMoves,
    auditWarnings: [
      ...new Set([
        ...automation.packet.auditWarnings,
        cacheDecision.reason,
        `hint_level_${hint.selectedLevel}`,
        `question_type_${question.selectedType}`,
        `growth_evidence_${growthEvidence.level}`,
        ...(sparseLearnerState ? ['sparse_learner_state_no_fake_mastery'] : []),
        ...(academicShortcutOverride ? ['academic_shortcut_language_runtime_override'] : []),
      ]),
    ],
  };

  const safePromptInstructions = [
    'Socratic runtime policy: guide the learner with questions, hints, and reasoning checks before explanations.',
    'Do not provide final answers, answer keys, copy-paste solutions, raw prompts, raw AI responses, raw transcripts, or raw learner memory.',
    `Use support mode: ${policyPacket.supportMode}.`,
    `Use challenge calibration: ${policyPacket.challengeLevel}.`,
    `Use hint ladder level ${hint.selectedLevel}: ${hint.nextRecommendedAction}.`,
    `Use question ladder type ${question.selectedType}: ${question.nextRecommendedAction}.`,
    `Recommended tutor move: ${policyPacket.recommendedTutorMove}`,
    `Safe context summary: ${safeContextSummary}`,
    `Privacy mode: ${policyPacket.privacyMode}.`,
    'Do not cache this personalized Socratic tutor turn.',
    ...(sparseLearnerState ? ['Do not infer mastery from sparse data; ask a diagnostic Socratic question first.'] : []),
    ...(policyPacket.teacherAdminInsightAllowed ? ['Teacher insight is automated safe metadata only; no manual approval workflow is created.'] : []),
  ];

  if (policyPacket.safeguardingSignal !== 'none') {
    return {
      policyPacket,
      shouldCallAi: false,
      immediateResponse: {
        responseType: 'safeguarding_safe_response',
        message: getSafeguardingStudentResponse(policyPacket.safeguardingRiskLevel, policyPacket.safeguardingSignal),
        rawPrivateDataIncluded: false,
      },
      safePromptInstructions,
      safeContextSummary,
      audit: {
        eventType: 'socratic_runtime_policy_safeguarding',
        severity: policyPacket.safeguardingRiskLevel === 'urgent' ? 'critical' : 'warning',
        safeSummary: `Safeguarding runtime policy activated for signal=${policyPacket.safeguardingSignal}; minimum necessary disclosure only.`,
        rawPrivateDataIncluded: false,
      },
    };
  }

  if (isActiveIntegritySignal(policyPacket.integritySignal)) {
    return {
      policyPacket,
      shouldCallAi: false,
      immediateResponse: {
        responseType: 'academic_integrity_redirect',
        message: policyPacket.recommendedTutorMove || 'I will not give the final answer, but I can guide you through the first step. What have you tried so far?',
        rawPrivateDataIncluded: false,
      },
      safePromptInstructions,
      safeContextSummary,
      audit: {
        eventType: 'socratic_runtime_policy_academic_integrity',
        severity: 'warning',
        safeSummary: `Academic integrity redirect applied for signal=${policyPacket.integritySignal}; no AI generation needed.`,
        rawPrivateDataIncluded: false,
      },
    };
  }

  return {
    policyPacket,
    shouldCallAi: true,
    safePromptInstructions,
    safeContextSummary,
    audit: {
      eventType: 'socratic_runtime_policy',
      severity: 'info',
      safeSummary: `Socratic runtime policy built for topic=${topic}; raw private data excluded.`,
      rawPrivateDataIncluded: false,
    },
  };
}
