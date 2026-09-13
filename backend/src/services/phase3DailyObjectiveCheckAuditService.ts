import type {
  Phase3DailyObjectiveCheckAuditEvent,
  Phase3DailyObjectiveAuditEventType,
} from '../contracts/phase3DailyObjectiveCheckContracts';
import { phase3DailyObjectiveCheckRepository } from './phase3DailyObjectiveCheckRepository';

function nowISO(): string {
  return new Date().toISOString();
}

function buildEvent(
  eventType: Phase3DailyObjectiveAuditEventType,
  schoolId: string,
  actorId: string,
  actorRole: string,
  studentId: string,
  objectiveId: string,
  checkSessionId: string,
  extras?: Partial<Phase3DailyObjectiveCheckAuditEvent>,
): Phase3DailyObjectiveCheckAuditEvent {
  const event: Phase3DailyObjectiveCheckAuditEvent = {
    eventId: '',
    schoolId,
    actorId,
    actorRole,
    studentId,
    objectiveId,
    checkSessionId,
    eventType,
    safeReasonCodes: [],
    safeEvidenceRefs: [],
    createdAt: nowISO(),
    ...extras,
  };
  return phase3DailyObjectiveCheckRepository.createAuditEvent(event);
}

export class Phase3DailyObjectiveCheckAuditService {
  recordDailyObjectiveCheckSessionStarted(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
    dailySeedId?: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_session_started', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId, { dailySeedId });
  }

  recordDailyObjectiveConfidenceBeforeRecorded(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_confidence_before_recorded', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveAttemptSignalRecorded(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_attempt_signal_recorded', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveRequiredStepCompleted(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_required_step_completed', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveConfidenceAfterRecorded(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_confidence_after_recorded', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveCheckCompleted(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
    dailySeedId?: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_completed', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId, { dailySeedId });
  }

  recordDailyObjectiveCheckNeedsRecheck(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_needs_recheck', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveCheckNeedsRescue(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_needs_rescue', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveCheckNeedsTeacherSupport(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_needs_teacher_support', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveCheckBlocked(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_blocked', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }

  recordDailyObjectiveCheckExpired(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId: string,
    objectiveId: string,
    checkSessionId: string,
  ): Phase3DailyObjectiveCheckAuditEvent {
    return buildEvent('daily_objective_check_expired', schoolId, actorId, actorRole, studentId, objectiveId, checkSessionId);
  }
}

export const phase3DailyObjectiveCheckAuditService = new Phase3DailyObjectiveCheckAuditService();
