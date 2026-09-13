import prisma from '../lib/prisma';

export interface EvidenceRef {
  source: string;
  id: string;
  type: string;
  timestamp: string;
}

export async function collectSafeEvidenceForStudent(
  schoolId: string,
  studentId: string,
  limit = 100,
): Promise<{
  signals: any[];
  attempts: any[];
  hintEvents: any[];
  exitSummaries: any[];
  practiceAttempts: any[];
  skillSnapshots: any[];
}> {
  const [signals, attempts, hintEvents, exitSummaries, practiceAttempts, skillSnapshots] = await Promise.all([
    prisma.learningModeSignal.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeAttempt.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeHintEvent.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeExitSummary.findMany({
      where: { schoolId, studentId },
      take: limit,
    }),
    prisma.practiceAttempt.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.skillMasterySnapshot.findMany({
      where: { schoolId, studentId },
    }),
  ]);

  return { signals, attempts, hintEvents, exitSummaries, practiceAttempts, skillSnapshots };
}

export async function collectSafeEvidenceForTopic(
  schoolId: string,
  studentId: string,
  topicId: string,
  limit = 50,
): Promise<{
  signals: any[];
  attempts: any[];
  hintEvents: any[];
}> {
  const [signals, attempts, hintEvents] = await Promise.all([
    prisma.learningModeSignal.findMany({
      where: { schoolId, studentId, topicId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeAttempt.findMany({
      where: { schoolId, studentId, topicId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeHintEvent.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ]);

  return { signals, attempts, hintEvents };
}

export async function collectSafeEvidenceForSkill(
  schoolId: string,
  studentId: string,
  skillId: string,
  limit = 50,
): Promise<{
  signals: any[];
  attempts: any[];
}> {
  const [signals, attempts] = await Promise.all([
    prisma.learningModeSignal.findMany({
      where: { schoolId, studentId, skillId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.learningModeAttempt.findMany({
      where: { schoolId, studentId, skillId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  ]);

  return { signals, attempts };
}

export function buildSafeEvidenceRefs(
  signals: any[],
  attempts: any[],
  hintEvents: any[],
  maxRefs = 20,
): EvidenceRef[] {
  const refs: EvidenceRef[] = [];

  for (const s of signals.slice(0, 10)) {
    refs.push({
      source: 'learningModeSignal',
      id: s.id,
      type: s.signalType,
      timestamp: s.createdAt?.toISOString?.() || new Date().toISOString(),
    });
  }
  for (const a of attempts.slice(0, 5)) {
    refs.push({
      source: 'learningModeAttempt',
      id: a.id,
      type: `attempt_${a.attemptNumber}`,
      timestamp: a.createdAt?.toISOString?.() || new Date().toISOString(),
    });
  }
  for (const h of hintEvents.slice(0, 5)) {
    refs.push({
      source: 'learningModeHintEvent',
      id: h.id,
      type: h.hintLevel,
      timestamp: h.createdAt?.toISOString?.() || new Date().toISOString(),
    });
  }

  return refs.slice(0, maxRefs);
}
