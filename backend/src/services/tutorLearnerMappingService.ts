import type {
  ExternalSchoolIdentityPayload,
  SchoolContextVerificationResult,
  TutorLearnerMappingDecision,
} from '../contracts/schoolSystemBridgeContracts';
import { SCHOOL_CONNECTOR_SAFE_IDENTIFIERS } from '../contracts/schoolSystemBridgeContracts';
import { normalizeRole, nowISO } from './task021SchoolIntegrationContracts';

export interface TutorLearnerMappingResult {
  decision: TutorLearnerMappingDecision;
  tutorLearnerId?: string;
  externalStudentId?: string;
  schoolId?: string;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
}

const existingMappings = new Map<string, string>();

export function clearMappingStore(): void {
  existingMappings.clear();
}

export function seedMapping(tutorLearnerId: string, externalStudentId: string, schoolId: string): void {
  existingMappings.set(`${schoolId}::${externalStudentId}`, tutorLearnerId);
}

export function getMappingCount(): number {
  return existingMappings.size;
}

export function mapExternalStudentToTutorLearner(
  verifiedPayload: ExternalSchoolIdentityPayload,
  verificationResult: SchoolContextVerificationResult,
): TutorLearnerMappingResult {
  if (!verificationResult.verified) {
    return {
      decision: 'blocked_missing_verified_identity',
      reasonCodes: ['identity_not_verified', ...verificationResult.reasonCodes],
      privacyMetadata: { verifiedAt: nowISO(), blockedBy: 'verification' },
    };
  }

  const normalizedRole = normalizeRole(verifiedPayload.role);
  if (normalizedRole !== 'student') {
    return {
      decision: 'blocked_not_student',
      reasonCodes: ['role_not_student', `actual_role:${normalizedRole}`],
      privacyMetadata: { verifiedAt: nowISO() },
    };
  }

  if (!verifiedPayload.externalStudentId) {
    return {
      decision: 'blocked_conflict',
      reasonCodes: ['external_student_id_missing'],
      privacyMetadata: { verifiedAt: nowISO() },
    };
  }

  const mappingKey = `${verifiedPayload.schoolId}::${verifiedPayload.externalStudentId}`;
  const existing = existingMappings.get(mappingKey);

  if (existing) {
    const isDuplicate = Array.from(existingMappings.entries()).filter(
      ([k, v]) => k !== mappingKey && v === existing,
    );
    if (isDuplicate.length > 0) {
      return {
        decision: 'blocked_duplicate_tutor_mapping',
        tutorLearnerId: existing,
        externalStudentId: verifiedPayload.externalStudentId,
        schoolId: verifiedPayload.schoolId,
        reasonCodes: ['duplicate_tutor_mapping', 'same_tutor_learner_mapped_to_multiple_external_ids'],
        privacyMetadata: { verifiedAt: nowISO() },
      };
    }

    return {
      decision: 'mapped_existing',
      tutorLearnerId: existing,
      externalStudentId: verifiedPayload.externalStudentId,
      schoolId: verifiedPayload.schoolId,
      reasonCodes: ['existing_mapping_found', 'student_already_mapped'],
      privacyMetadata: { verifiedAt: nowISO() },
    };
  }

  const tutorLearnerId = `tl-${verifiedPayload.externalStudentId}-${verifiedPayload.schoolId}`;
  existingMappings.set(mappingKey, tutorLearnerId);

  return {
    decision: 'mapped_created_dry_run',
    tutorLearnerId,
    externalStudentId: verifiedPayload.externalStudentId,
    schoolId: verifiedPayload.schoolId,
    reasonCodes: ['dry_run_mapping_created', 'no_live_write_performed'],
    privacyMetadata: { verifiedAt: nowISO(), mode: 'dry_run' },
  };
}
