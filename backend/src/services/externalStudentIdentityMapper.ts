import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type {
  TutorLearnerIdentityMapRecord,
  TutorLearnerMappingInput,
  TutorLearnerMappingResult,
} from './tutorLearnerIdentityContracts';
import type { EnrollmentStatus } from './schoolAuthBridgeContracts';
import { logger } from '../utils/logger';

function mapDbStatusToDomain(dbStatus: string): TutorLearnerIdentityMapRecord['status'] {
  const validStatuses: TutorLearnerIdentityMapRecord['status'][] = [
    'active', 'completed', 'transferred', 'left_school', 'archived',
  ];
  if (validStatuses.includes(dbStatus as TutorLearnerIdentityMapRecord['status'])) {
    return dbStatus as TutorLearnerIdentityMapRecord['status'];
  }
  return 'active';
}

function enrollmentToStatus(enrollmentStatus: EnrollmentStatus): string {
  if (enrollmentStatus === 'active') return 'active';
  if (enrollmentStatus === 'completed') return 'completed';
  if (enrollmentStatus === 'transferred') return 'transferred';
  if (enrollmentStatus === 'left_school') return 'left_school';
  return 'active';
}

export async function findTutorLearnerByExternalIdentity(
  input: TutorLearnerMappingInput,
): Promise<TutorLearnerIdentityMapRecord | null> {
  const record = await prisma.tutorLearnerIdentityMap.findUnique({
    where: {
      externalStudentId_schoolId: {
        externalStudentId: input.externalStudentId,
        schoolId: input.schoolId,
      },
    },
  });

  if (!record) return null;

  return {
    tutorLearnerId: record.tutorLearnerId,
    externalStudentId: record.externalStudentId,
    schoolId: record.schoolId,
    classId: record.classId || undefined,
    grade: record.grade || undefined,
    status: mapDbStatusToDomain(record.status),
    firstSeenAt: record.firstSeenAt.toISOString(),
    lastSeenAt: record.lastSeenAt.toISOString(),
  };
}

export async function createTutorLearnerMapping(
  input: TutorLearnerMappingInput,
): Promise<TutorLearnerIdentityMapRecord> {
  const tutorLearnerId = `tl_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

  const record = await prisma.tutorLearnerIdentityMap.create({
    data: {
      tutorLearnerId,
      externalStudentId: input.externalStudentId,
      schoolId: input.schoolId,
      classId: input.classId || null,
      grade: input.grade || null,
      status: enrollmentToStatus(input.enrollmentStatus),
    },
  });

  logger.info(
    {
      tutorLearnerId,
      externalStudentId: input.externalStudentId,
      schoolId: input.schoolId,
    },
    '[ExternalStudentIdentityMapper] Created tutor learner mapping',
  );

  return {
    tutorLearnerId: record.tutorLearnerId,
    externalStudentId: record.externalStudentId,
    schoolId: record.schoolId,
    classId: record.classId || undefined,
    grade: record.grade || undefined,
    status: mapDbStatusToDomain(record.status),
    firstSeenAt: record.firstSeenAt.toISOString(),
    lastSeenAt: record.lastSeenAt.toISOString(),
  };
}

export async function findOrCreateTutorLearnerMapping(
  input: TutorLearnerMappingInput,
): Promise<TutorLearnerMappingResult> {
  const existing = await findTutorLearnerByExternalIdentity(input);

  if (existing) {
    const updated = await updateTutorLearnerMappingFromSchoolContext(input);
    return {
      tutorLearnerId: updated.tutorLearnerId,
      createdNew: false,
      record: updated,
    };
  }

  const created = await createTutorLearnerMapping(input);
  return {
    tutorLearnerId: created.tutorLearnerId,
    createdNew: true,
    record: created,
  };
}

export async function updateTutorLearnerMappingFromSchoolContext(
  input: TutorLearnerMappingInput,
): Promise<TutorLearnerIdentityMapRecord> {
  const record = await prisma.tutorLearnerIdentityMap.update({
    where: {
      externalStudentId_schoolId: {
        externalStudentId: input.externalStudentId,
        schoolId: input.schoolId,
      },
    },
    data: {
      classId: input.classId || null,
      grade: input.grade || null,
      status: enrollmentToStatus(input.enrollmentStatus),
    },
  });

  return {
    tutorLearnerId: record.tutorLearnerId,
    externalStudentId: record.externalStudentId,
    schoolId: record.schoolId,
    classId: record.classId || undefined,
    grade: record.grade || undefined,
    status: mapDbStatusToDomain(record.status),
    firstSeenAt: record.firstSeenAt.toISOString(),
    lastSeenAt: record.lastSeenAt.toISOString(),
  };
}
