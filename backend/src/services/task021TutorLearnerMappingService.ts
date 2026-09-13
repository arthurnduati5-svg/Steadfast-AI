import type {
  VerifiedSchoolIdentity,
  TutorLearnerMapping,
  SchoolIntegrationErrorCode,
} from './task021SchoolIntegrationContracts';
import { nowISO } from './task021SchoolIntegrationContracts';
import {
  createOrResolveIdentityMapping,
  findMappingByTutorLearnerId,
  resolveExternalIdentity,
  updateMappingStatus,
} from './task021SchoolIdentityMappingService';
import { logger } from '../utils/logger';

export interface TutorLearnerMappingResult {
  tutorLearnerId: string;
  createdNew: boolean;
  mapping: TutorLearnerMapping;
}

export async function resolveTutorLearnerFromVerifiedIdentity(
  identity: VerifiedSchoolIdentity,
): Promise<TutorLearnerMappingResult> {
  if (identity.role !== 'student') {
    throw new Error(`Cannot create tutor learner mapping for non-student role: ${identity.role}`);
  }

  if (!identity.externalStudentId) {
    throw new Error('externalStudentId is required for tutor learner mapping');
  }

  const outcome = await createOrResolveIdentityMapping({
    schoolId: identity.schoolId,
    externalUserId: identity.externalUserId,
    role: 'student',
    externalStudentId: identity.externalStudentId,
    externalTeacherId: identity.externalTeacherId,
  });

  if (!outcome.ok) {
    throw new Error(`Identity mapping failed: ${outcome.error} - ${outcome.reasonCodes.join(', ')}`);
  }

  if (!outcome.tutorLearnerId) {
    throw new Error('Tutor learner ID was not created for student role');
  }

  const mapping: TutorLearnerMapping = {
    tutorLearnerId: outcome.tutorLearnerId,
    externalStudentId: identity.externalStudentId,
    schoolId: identity.schoolId,
    externalUserId: identity.externalUserId,
    classId: identity.classId,
    status: 'active',
    role: 'student',
    firstSeenAt: outcome.mapping.createdAt,
    lastSeenAt: outcome.mapping.updatedAt,
    reasonCodes: outcome.mapping.reasonCodes,
  };

  return {
    tutorLearnerId: outcome.tutorLearnerId,
    createdNew: outcome.createdNew,
    mapping,
  };
}

export async function getMappingForLearner(tutorLearnerId: string): Promise<TutorLearnerMapping | undefined> {
  const record = await findMappingByTutorLearnerId(tutorLearnerId);
  if (!record) return undefined;

  return {
    tutorLearnerId: record.tutorLearnerId!,
    externalStudentId: record.externalStudentId || '',
    schoolId: record.schoolId,
    externalUserId: record.externalUserId,
    status: record.status === 'active' ? 'active' : record.status === 'inactive' ? 'inactive' : record.status === 'transferred' ? 'transferred' : 'archived',
    role: 'student',
    firstSeenAt: record.createdAt,
    lastSeenAt: record.updatedAt,
    reasonCodes: record.reasonCodes,
  };
}

export function checkMappingActive(mapping: TutorLearnerMapping): boolean {
  return mapping.status === 'active';
}

export function checkMappingSchoolScope(mapping: TutorLearnerMapping, schoolId: string): boolean {
  return mapping.schoolId === schoolId;
}

export async function inactivateLearnerMapping(
  tutorLearnerId: string,
  reasonCodes: string[],
): Promise<boolean> {
  const record = await findMappingByTutorLearnerId(tutorLearnerId);
  if (!record) return false;

  const updated = await updateMappingStatus(
    record.schoolId,
    record.externalUserId,
    'inactive',
    reasonCodes,
  );
  if (updated) {
    logger.info(
      { tutorLearnerId, schoolId: record.schoolId, reasonCodes },
      '[TutorLearnerMappingService] Mapping inactivated',
    );
    return true;
  }
  return false;
}

export async function reactivateLearnerMapping(
  tutorLearnerId: string,
  reasonCodes: string[],
): Promise<boolean> {
  const record = await findMappingByTutorLearnerId(tutorLearnerId);
  if (!record) return false;

  const updated = await updateMappingStatus(
    record.schoolId,
    record.externalUserId,
    'active',
    reasonCodes,
  );
  if (updated) {
    logger.info(
      { tutorLearnerId, schoolId: record.schoolId, reasonCodes },
      '[TutorLearnerMappingService] Mapping reactivated',
    );
    return true;
  }
  return false;
}
