import type {
  Phase3ObjectiveAuditEvent,
  Phase3AuditEventType,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';

function nowISO(): string {
  return new Date().toISOString();
}

function buildEvent(
  eventType: Phase3AuditEventType,
  schoolId: string,
  actorId: string,
  actorRole: string,
  extras?: Partial<Phase3ObjectiveAuditEvent>,
): Phase3ObjectiveAuditEvent {
  return {
    eventId: '',
    schoolId,
    actorId,
    actorRole,
    eventType,
    reasonCodes: [],
    safeEvidenceRefs: [],
    createdAt: nowISO(),
    ...extras,
  };
}

export class Phase3ObjectiveAuditService {
  recordObjectiveCreated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
    classId?: string,
    subjectId?: string,
    topicId?: string,
    skillId?: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_created', schoolId, actorId, actorRole, {
        objectiveId,
        classId,
        subjectId,
        topicId,
        skillId,
      }),
    );
  }

  recordObjectiveUpdated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_updated', schoolId, actorId, actorRole, { objectiveId }),
    );
  }

  recordObjectiveArchived(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_archived', schoolId, actorId, actorRole, { objectiveId }),
    );
  }

  recordObjectiveCheckBlueprintCreated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_check_blueprint_created', schoolId, actorId, actorRole, { objectiveId }),
    );
  }

  recordObjectiveEvidenceLinked(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
    targetLearnerId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_evidence_linked', schoolId, actorId, actorRole, {
        objectiveId,
        targetLearnerId,
      }),
    );
  }

  recordObjectiveMasteryUpdated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
    targetLearnerId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('objective_mastery_updated', schoolId, actorId, actorRole, {
        objectiveId,
        targetLearnerId,
      }),
    );
  }

  recordTeacherObjectiveProgressViewed(
    schoolId: string,
    actorId: string,
    actorRole: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('teacher_objective_progress_viewed', schoolId, actorId, actorRole),
    );
  }

  recordLearnerObjectiveProgressViewed(
    schoolId: string,
    actorId: string,
    actorRole: string,
    targetLearnerId?: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('learner_objective_progress_viewed', schoolId, actorId, actorRole, {
        targetLearnerId,
      }),
    );
  }

  recordDailyObjectiveSeedCreated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId: string,
  ): Phase3ObjectiveAuditEvent {
    return phase3ObjectiveRepository.createAuditEvent(
      buildEvent('daily_objective_seed_created', schoolId, actorId, actorRole, { objectiveId }),
    );
  }
}

export const phase3ObjectiveAuditService = new Phase3ObjectiveAuditService();
