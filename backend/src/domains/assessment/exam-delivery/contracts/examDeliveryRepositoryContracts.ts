import {
  ExamDeliverySession,
  ExamDeliverySessionState,
  ExamDeliverySessionStatus,
  ExamDeliverySessionMode,
  ExamDeliveryActivationMode,
} from './examDeliverySessionContracts';
import {
  ExamVariantAssignment,
  ExamVariantAssignmentStatus,
  LearnerRefType,
  AssignmentStrategy,
} from './examVariantAssignmentContracts';
import {
  ExamAttempt,
  ExamAttemptQuestionSnapshot,
  ExamAttemptStatus,
  ExamAttemptTimingEvent,
  ExamTimingEventType,
} from './examAttemptContracts';
import {
  ExamAnswerSubmission,
  ExamAnswerSubmissionStatus,
} from './examAnswerSubmissionContracts';
import {
  ExamAttemptSubmissionSnapshot,
  ExamAttemptSubmissionSnapshotStatus,
  ExamDeliveryAuditEvent,
  ExamDeliveryIdempotencyEntry,
} from './examDeliverySnapshotContracts';
import { ExamDeliveryCommandContext } from './examDeliveryContracts';

// ── ExamDeliverySessionRepository ──

export interface ExamDeliverySessionRepository {
  create(data: Omit<ExamDeliverySession, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySession>;
  getById(deliverySessionId: string): Promise<ExamDeliverySession | null>;
  listBySchool(schoolId: string): Promise<ExamDeliverySession[]>;
  listBySchoolAndStatus(schoolId: string, status: ExamDeliverySessionStatus): Promise<ExamDeliverySession[]>;
  updateStatus(deliverySessionId: string, status: ExamDeliverySessionStatus, openedAt?: string | null, closedAt?: string | null): Promise<ExamDeliverySession>;
  archive(deliverySessionId: string): Promise<ExamDeliverySession>;
}

// ── ExamDeliverySessionStateRepository ──

export interface ExamDeliverySessionStateRepository {
  create(data: Omit<ExamDeliverySessionState, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySessionState>;
  getByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliverySessionState | null>;
  update(
    deliverySessionId: string,
    data: Partial<Pick<ExamDeliverySessionState, 'status' | 'activeAttemptCount' | 'submittedAttemptCount' | 'pausedAttemptCount' | 'blockedAttemptCount' | 'lastStateChangeReason' | 'safeStateSummary'>>,
    expectedVersion: number,
  ): Promise<ExamDeliverySessionState>;
}

// ── ExamVariantAssignmentRepository ──

export interface ExamVariantAssignmentRepository {
  create(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>): Promise<ExamVariantAssignment>;
  createMany(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>[]): Promise<ExamVariantAssignment[]>;
  getById(variantAssignmentId: string): Promise<ExamVariantAssignment | null>;
  getByDeliverySessionAndStudent(deliverySessionId: string, studentRef: string): Promise<ExamVariantAssignment | null>;
  listByDeliverySessionId(deliverySessionId: string): Promise<ExamVariantAssignment[]>;
  listBySchool(schoolId: string): Promise<ExamVariantAssignment[]>;
  updateStatus(variantAssignmentId: string, status: ExamVariantAssignmentStatus, revokedAt?: string | null): Promise<ExamVariantAssignment>;
}

// ── ExamAttemptRepository ──

export interface ExamAttemptRepository {
  create(data: Omit<ExamAttempt, 'createdAt' | 'updatedAt'>): Promise<ExamAttempt>;
  getById(attemptId: string): Promise<ExamAttempt | null>;
  getByAssignmentAndStudent(variantAssignmentId: string, studentRef: string): Promise<ExamAttempt | null>;
  listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttempt[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ExamAttempt[]>;
  listBySchool(schoolId: string): Promise<ExamAttempt[]>;
  updateStatus(attemptId: string, status: ExamAttemptStatus): Promise<ExamAttempt>;
  updateTiming(attemptId: string, lastSeenAt: string, durationSecondsUsed: number): Promise<ExamAttempt>;
  updateSubmitted(attemptId: string, submittedAt: string): Promise<ExamAttempt>;
}

// ── ExamAttemptQuestionSnapshotRepository ──

export interface ExamAttemptQuestionSnapshotRepository {
  create(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>): Promise<ExamAttemptQuestionSnapshot>;
  createMany(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>[]): Promise<ExamAttemptQuestionSnapshot[]>;
  listByAttemptId(attemptId: string): Promise<ExamAttemptQuestionSnapshot[]>;
  updateSnapshotStatus(attemptQuestionSnapshotId: string, snapshotStatus: string): Promise<ExamAttemptQuestionSnapshot>;
}

// ── ExamAnswerSubmissionRepository ──

export interface ExamAnswerSubmissionRepository {
  create(data: Omit<ExamAnswerSubmission, 'createdAt' | 'updatedAt'>): Promise<ExamAnswerSubmission>;
  update(data: Partial<ExamAnswerSubmission> & { answerSubmissionId: string }): Promise<ExamAnswerSubmission>;
  getById(answerSubmissionId: string): Promise<ExamAnswerSubmission | null>;
  getByQuestionSnapshotId(attemptQuestionSnapshotId: string): Promise<ExamAnswerSubmission | null>;
  listByAttemptId(attemptId: string): Promise<ExamAnswerSubmission[]>;
  updateStatus(answerSubmissionId: string, status: ExamAnswerSubmissionStatus): Promise<ExamAnswerSubmission>;
}

// ── ExamAttemptTimingEventRepository ──

export interface ExamAttemptTimingEventRepository {
  create(data: Omit<ExamAttemptTimingEvent, 'createdAt'>): Promise<ExamAttemptTimingEvent>;
  listByAttemptId(attemptId: string): Promise<ExamAttemptTimingEvent[]>;
  listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttemptTimingEvent[]>;
}

// ── ExamAttemptSubmissionSnapshotRepository ──

export interface ExamAttemptSubmissionSnapshotRepository {
  create(data: Omit<ExamAttemptSubmissionSnapshot, 'createdAt'>): Promise<ExamAttemptSubmissionSnapshot>;
  getById(submissionSnapshotId: string): Promise<ExamAttemptSubmissionSnapshot | null>;
  getByAttemptId(attemptId: string): Promise<ExamAttemptSubmissionSnapshot | null>;
  updateStatus(submissionSnapshotId: string, snapshotStatus: ExamAttemptSubmissionSnapshotStatus, sealedAt?: string | null): Promise<ExamAttemptSubmissionSnapshot>;
}

// ── ExamDeliveryAuditRepository ──

export interface ExamDeliveryAuditRepository {
  create(data: Omit<ExamDeliveryAuditEvent, 'createdAt'>): Promise<ExamDeliveryAuditEvent>;
  listByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliveryAuditEvent[]>;
  listByAttemptId(attemptId: string): Promise<ExamDeliveryAuditEvent[]>;
  listBySchool(schoolId: string): Promise<ExamDeliveryAuditEvent[]>;
}

// ── ExamDeliveryIdempotencyRepository ──

export interface ExamDeliveryIdempotencyRepository {
  create(data: Omit<ExamDeliveryIdempotencyEntry, 'createdAt' | 'updatedAt'>): Promise<ExamDeliveryIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ExamDeliveryIdempotencyEntry | null>;
  updateStatus(deliveryIdempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ExamDeliveryIdempotencyEntry>;
}

export interface ExamDeliveryAllRepositories {
  sessionRepository: ExamDeliverySessionRepository;
  sessionStateRepository: ExamDeliverySessionStateRepository;
  variantAssignmentRepository: ExamVariantAssignmentRepository;
  attemptRepository: ExamAttemptRepository;
  questionSnapshotRepository: ExamAttemptQuestionSnapshotRepository;
  answerSubmissionRepository: ExamAnswerSubmissionRepository;
  timingEventRepository: ExamAttemptTimingEventRepository;
  submissionSnapshotRepository: ExamAttemptSubmissionSnapshotRepository;
  auditRepository: ExamDeliveryAuditRepository;
  idempotencyRepository: ExamDeliveryIdempotencyRepository;
}
