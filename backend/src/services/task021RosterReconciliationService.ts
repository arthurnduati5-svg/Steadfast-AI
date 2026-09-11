import type {
  RosterDiffEntry,
  RosterReconciliationDecision,
  ReconciliationAction,
} from './task021SchoolIntegrationContracts';
import {
  createOrResolveIdentityMapping,
  updateMappingStatus,
} from './task021SchoolIdentityMappingService';
import { logger } from '../utils/logger';
import { checkRosterBound, getR8GBoundsConfig } from '../config/r8gBackendBounds';

export interface ReconciliationResult {
  decisions: RosterReconciliationDecision[];
  appliedCount: number;
  quarantinedCount: number;
  skipCount: number;
  /**
   * R8-G: present only when the input exceeded the configured roster bound.
   * Nothing was applied. Callers must surface this as a failed/too-large
   * result — never as an empty success.
   */
  rejected?: { code: 'roster_payload_too_large'; limit: number; received: number };
}

export function reconcileRosterDiff(
  entries: RosterDiffEntry[],
  schoolId: string,
): ReconciliationResult {
  // R8-G: reject over-bound payloads BEFORE expensive reconciliation work.
  const bound = checkRosterBound(entries.length, getR8GBoundsConfig().config.rosterMaxRecords);
  if (!bound.allowed) {
    logger.warn(
      { schoolId, received: bound.total, limit: bound.limit },
      '[RosterReconciliation] Payload exceeds configured bound; nothing applied',
    );
    return {
      decisions: [],
      appliedCount: 0,
      quarantinedCount: 0,
      skipCount: 0,
      rejected: { code: 'roster_payload_too_large', limit: bound.limit, received: bound.total },
    };
  }

  const decisions: RosterReconciliationDecision[] = [];
  let appliedCount = 0;
  let quarantinedCount = 0;
  let skipCount = 0;

  for (const entry of entries) {
    const decision = makeReconciliationDecision(entry, schoolId);
    decisions.push(decision);

    switch (decision.action) {
      case 'create_mapping':
      case 'update_mapping':
      case 'reactivate_mapping':
      case 'inactivate_mapping':
        appliedCount++;
        break;
      case 'quarantine':
        quarantinedCount++;
        break;
      case 'skip':
        skipCount++;
        break;
    }
  }

  return { decisions, appliedCount, quarantinedCount, skipCount };
}

function makeReconciliationDecision(
  entry: RosterDiffEntry,
  schoolId: string,
): RosterReconciliationDecision {
  switch (entry.category) {
    case 'new_student_mapping_needed':
      return {
        action: 'create_mapping',
        entry,
        safeSummary: `Creating tutor learner mapping for student ${entry.externalId}`,
        reasonCodes: ['new_student_mapping_from_roster_sync'],
        preserveHistory: false,
      };

    case 'existing_student_unchanged':
      return {
        action: 'skip',
        entry,
        safeSummary: `Student ${entry.externalId} mapping unchanged`,
        reasonCodes: ['existing_mapping_unchanged'],
        preserveHistory: true,
      };

    case 'student_inactivated':
      return {
        action: 'inactivate_mapping',
        entry,
        safeSummary: `Inactivating tutor learner mapping for student ${entry.externalId}; learning history preserved`,
        reasonCodes: ['student_inactivated_from_roster_sync'],
        preserveHistory: true,
      };

    case 'student_reactivated':
      return {
        action: 'reactivate_mapping',
        entry,
        safeSummary: `Reactivating tutor learner mapping for student ${entry.externalId}`,
        reasonCodes: ['student_reactivated_from_roster_sync'],
        preserveHistory: true,
      };

    case 'student_transferred':
      return {
        action: 'update_mapping',
        entry,
        safeSummary: `Updating tutor learner mapping for transferred student ${entry.externalId}; learning history preserved`,
        reasonCodes: ['student_transferred_from_roster_sync'],
        preserveHistory: true,
      };

    case 'conflict_duplicate_external_id':
    case 'conflict_duplicate_tutor_mapping':
      return {
        action: 'quarantine',
        entry,
        safeSummary: `Conflict detected for ${entry.externalId}: ${entry.details || entry.category}`,
        reasonCodes: ['conflict_quarantined', entry.category],
        preserveHistory: true,
      };

    case 'teacher_assignment_added':
    case 'teacher_assignment_removed':
    case 'class_enrollment_added':
    case 'class_enrollment_removed':
    case 'subject_enrollment_changed':
      return {
        action: 'update_mapping',
        entry,
        safeSummary: `Processing roster change: ${entry.category} for ${entry.externalId}`,
        reasonCodes: [entry.category],
        preserveHistory: true,
      };

    default:
      return {
        action: 'skip',
        entry,
        safeSummary: `Unknown roster entry type: ${entry.category}`,
        reasonCodes: ['unknown_record_type_skipped'],
        preserveHistory: true,
      };
  }
}

export async function applyReconciliationDecision(
  decision: RosterReconciliationDecision,
): Promise<boolean> {
  try {
    switch (decision.action) {
      case 'create_mapping': {
        const extId = decision.entry.externalId;
        const role = decision.entry.role || 'student';
        const outcome = await createOrResolveIdentityMapping({
          schoolId: decision.entry.schoolId,
          externalUserId: extId,
          role,
          externalStudentId: role === 'student' ? extId : undefined,
          externalTeacherId: role === 'teacher' ? extId : undefined,
        });
        if (!outcome.ok) {
          logger.warn(
            { externalId: extId, error: outcome.error },
            '[RosterReconciliationService] Create mapping failed',
          );
          return false;
        }
        logger.info(
          { externalId: extId, tutorLearnerId: outcome.tutorLearnerId },
          '[RosterReconciliationService] Mapping created',
        );
        return true;
      }

      case 'inactivate_mapping': {
        const updated = await updateMappingStatus(
          decision.entry.schoolId,
          decision.entry.externalId,
          'inactive',
          decision.reasonCodes,
        );
        if (updated) {
          logger.info({ externalId: decision.entry.externalId }, '[RosterReconciliationService] Mapping inactivated');
        }
        return !!updated;
      }

      case 'reactivate_mapping': {
        const updated = await updateMappingStatus(
          decision.entry.schoolId,
          decision.entry.externalId,
          'active',
          decision.reasonCodes,
        );
        if (updated) {
          logger.info({ externalId: decision.entry.externalId }, '[RosterReconciliationService] Mapping reactivated');
        }
        return !!updated;
      }

      case 'quarantine': {
        const updated = await updateMappingStatus(
          decision.entry.schoolId,
          decision.entry.externalId,
          'quarantined',
          decision.reasonCodes,
        );
        if (updated) {
          logger.warn({ externalId: decision.entry.externalId }, '[RosterReconciliationService] Mapping quarantined');
        }
        return !!updated;
      }

      case 'skip':
        return true;

      default:
        return true;
    }
  } catch (error) {
    logger.error(
      { action: decision.action, externalId: decision.entry.externalId, error },
      '[RosterReconciliationService] Apply decision failed',
    );
    return false;
  }
}
