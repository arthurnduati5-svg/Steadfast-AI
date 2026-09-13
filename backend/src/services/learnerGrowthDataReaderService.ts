import prisma from '../lib/prisma';

export async function readLearnerGrowthDataAvailability(input: {
  studentId: string;
  schoolId?: string | null;
  classId?: string | null;
}): Promise<{
  hasLearnerMemory: boolean;
  hasTutorState: boolean;
  hasMasteryEvidence: boolean;
  hasPracticeAttempts: boolean;
  hasRevisionItems: boolean;
  hasArtifactSignals: boolean;
  hasVideoSignals: boolean;
  hasTeacherSafeSignals: boolean;
  sourceCounts: {
    learnerMemory: number;
    tutorState: number;
    masteryEvidence: number;
    practiceAttempts: number;
    revisionItems: number;
    artifactSignals: number;
    videoSignals: number;
    teacherSafeSignals: number;
  };
  latestEvidenceAt?: string;
}> {
  const { studentId, schoolId } = input;
  const schoolFilter = schoolId ? { schoolId } : {};

  let latestEvidenceAt: string | undefined;

  async function safeCount(modelFn: () => Promise<number>): Promise<number> {
    try {
      return await modelFn();
    } catch {
      return 0;
    }
  }

  const learnerMemoryCount = await safeCount(async () => {
    const items = await prisma.learnerMemoryItem.count({
      where: { studentId, ...schoolFilter, softDeletedAt: null },
    });
    return items;
  });

  const tutorStateCount = await safeCount(async () => {
    const items = await prisma.tutorState.count({
      where: { studentId, ...schoolFilter },
    });
    return items;
  });

  const masteryEvidenceCount = await safeCount(async () => {
    const items = await prisma.skillMasterySnapshot.count({
      where: { studentId, ...schoolFilter },
    });
    return items;
  });

  const practiceAttemptsCount = await safeCount(async () => {
    const items = await prisma.practiceAttempt.count({
      where: { studentId, ...schoolFilter },
    });
    return items;
  });

  const revisionItemsCount = await safeCount(async () => {
    const items = await prisma.revisionItem.count({
      where: { userId: studentId },
    });
    return items;
  });

  const artifactSignalsCount = await safeCount(async () => {
    const items = await prisma.learningArtifact.count({
      where: { ownerStudentId: studentId, ...schoolFilter },
    });
    return items;
  });

  const tutorStateWithVideo = await safeCount(async () => {
    if (tutorStateCount === 0) return 0;
    const states = await prisma.tutorState.findMany({
      where: { studentId, ...schoolFilter, activeVideoId: { not: null } },
      select: { id: true },
      take: 1,
    });
    return states.length;
  });

  const teacherSafeSignalsCount = await safeCount(async () => {
    const items = await prisma.teacherInterventionAssignment.count({
      where: { studentId, ...schoolFilter },
    });
    return items;
  });

  const latestTimestamps: string[] = [];

  async function safeLatestDate(
    model: string,
    where: Record<string, unknown>,
    dateField: string
  ): Promise<void> {
    try {
      const records = await (prisma as any)[model].findMany({
        where,
        orderBy: { [dateField]: 'desc' as const },
        select: { [dateField]: true },
        take: 1,
      });
      if (records.length > 0) {
        const val = (records[0] as Record<string, unknown>)[dateField];
        if (val instanceof Date) {
          latestTimestamps.push(val.toISOString());
        } else if (typeof val === 'string') {
          latestTimestamps.push(val);
        }
      }
    } catch {
    }
  }

  await safeLatestDate('learnerMemoryItem', { studentId, ...schoolFilter }, 'updatedAt');
  await safeLatestDate('tutorState', { studentId, ...schoolFilter }, 'updatedAt');
  await safeLatestDate('skillMasterySnapshot', { studentId, ...schoolFilter }, 'updatedAt');
  await safeLatestDate('practiceAttempt', { studentId, ...schoolFilter }, 'createdAt');
  await safeLatestDate('revisionItem', { userId: studentId }, 'updatedAt');

  if (latestTimestamps.length > 0) {
    latestTimestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    latestEvidenceAt = latestTimestamps[0];
  }

  return {
    hasLearnerMemory: learnerMemoryCount > 0,
    hasTutorState: tutorStateCount > 0,
    hasMasteryEvidence: masteryEvidenceCount > 0,
    hasPracticeAttempts: practiceAttemptsCount > 0,
    hasRevisionItems: revisionItemsCount > 0,
    hasArtifactSignals: artifactSignalsCount > 0,
    hasVideoSignals: tutorStateWithVideo > 0,
    hasTeacherSafeSignals: teacherSafeSignalsCount > 0,
    sourceCounts: {
      learnerMemory: learnerMemoryCount,
      tutorState: tutorStateCount,
      masteryEvidence: masteryEvidenceCount,
      practiceAttempts: practiceAttemptsCount,
      revisionItems: revisionItemsCount,
      artifactSignals: artifactSignalsCount,
      videoSignals: tutorStateWithVideo,
      teacherSafeSignals: teacherSafeSignalsCount,
    },
    latestEvidenceAt,
  };
}
