import { ExamDeliverySessionStatus, ExamDeliverySessionMode, ExamDeliveryActivationMode } from './examDeliverySessionContracts';
import { ExamVariantAssignmentStatus, LearnerRefType, AssignmentStrategy } from './examVariantAssignmentContracts';
import { ExamAttemptStatus, ExamTimingEventType } from './examAttemptContracts';
import { ExamAnswerSubmissionStatus } from './examAnswerSubmissionContracts';
import { ExamAttemptSubmissionSnapshotStatus } from './examDeliverySnapshotContracts';

export interface ExamDeliveryCommandContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  correlationId: string;
  idempotencyKey: string;
}

export interface ExamDeliveryPolicyDecision {
  allowed: boolean;
  reasonCode: string;
  safeMessage: string;
  blockedOperation: string;
}

export interface ExamDeliverySafeEnvelope {
  ok: boolean;
  requestId: string;
  correlationId: string;
  resourceId: string;
  resourceVersion: number | null;
  status: string;
  safeMessage: string;
  reasonCode: string;
  policyDecision: ExamDeliveryPolicyDecision | null;
  nextAllowedActions: string[];
  data: Record<string, unknown>;
}

export interface ExamDeliveryTeacherProjection {
  deliverySessionId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  sessionStatus: ExamDeliverySessionStatus;
  sessionMode: ExamDeliverySessionMode;
  title: string;
  safeInstructions: string;
  intendedAudienceType: string;
  activationMode: ExamDeliveryActivationMode;
  openedAt: string | null;
  closedAt: string | null;
  stateSummary: string;
  activeAttemptCount: number;
  submittedAttemptCount: number;
  assignments: ExamVariantAssignmentTeacherView[];
}

export interface ExamVariantAssignmentTeacherView {
  variantAssignmentId: string;
  studentRef: string;
  learnerRefType: LearnerRefType;
  assignmentStatus: ExamVariantAssignmentStatus;
  assignmentStrategy: AssignmentStrategy;
  variantId: string;
  safeAssignmentSummary: string;
}

export interface ExamDeliveryStudentAttemptProjection {
  attemptId: string;
  deliverySessionId: string;
  paperVersionId: string;
  variantId: string;
  status: ExamAttemptStatus;
  startedAt: string | null;
  lastSeenAt: string | null;
  durationSecondsAllowed: number;
  durationSecondsUsed: number;
  safeAttemptSummary: string;
  questions: ExamAttemptQuestionStudentView[];
  savedAnswerStatus: ExamAnswerSubmissionStatus | null;
  submissionStatus: ExamAttemptSubmissionSnapshotStatus | null;
}

export interface ExamAttemptQuestionStudentView {
  attemptQuestionSnapshotId: string;
  displayOrder: number;
  marksAvailable: number;
  studentVisiblePromptSafe: string;
  answerInputType: string;
  snapshotStatus: string;
}

export interface ExamDeliveryAdminProjection {
  deliverySessionId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  deliveryBridgeId: string;
  accessPolicyId: string;
  sessionStatus: ExamDeliverySessionStatus;
  sessionMode: ExamDeliverySessionMode;
  activationMode: ExamDeliveryActivationMode;
  title: string;
  state: {
    activeAttemptCount: number;
    submittedAttemptCount: number;
    pausedAttemptCount: number;
    blockedAttemptCount: number;
    version: number;
    safeStateSummary: string;
  };
  createdByActorId: string;
  createdByRole: string;
  openedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STUDENT_PROJECTION_FORBIDDEN_FIELDS = [
  'answerKeySafeRef',
  'answerKeyText',
  'correctAnswerSummary',
  'rubricInternal',
  'rubricText',
  'markingNotesTeacherOnly',
  'teacherOnlyNotes',
  'selectionReasonInternal',
  'variantAlgorithmInternals',
  'sourceDraftScoringInternals',
  'hiddenReasoning',
  'chainOfThought',
  'rawQuestionMetadata',
  'deliveryActivationToken',
  'markingResult',
  'score',
  'finalGrade',
  'parentReleaseStatus',
  'masteryMutation',
];
