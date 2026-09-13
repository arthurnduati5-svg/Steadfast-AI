import prisma from '../lib/prisma';
import type { LearningSessionEventRecord, LearningSessionMode, TutorModeTransitionReasonCode } from './studentLearningSessionContracts';

function toRecord(row: any): LearningSessionEventRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    tutorLearnerId: row.tutorLearnerId,
    sessionId: row.sessionId,
    eventType: row.eventType,
    previousMode: row.previousMode ? (row.previousMode as LearningSessionMode) : undefined,
    nextMode: row.nextMode ? (row.nextMode as LearningSessionMode) : undefined,
    subject: row.subject ?? undefined,
    topic: row.topic ?? undefined,
    skillTag: row.skillTag ?? undefined,
    safeEventSummary: row.safeEventSummary ?? undefined,
    safeEvidenceRefs: Array.isArray(row.safeEvidenceRefs) ? row.safeEvidenceRefs : [],
    reasonCodes: Array.isArray(row.reasonCodes) ? row.reasonCodes as TutorModeTransitionReasonCode[] : [],
    privacyMetadata: (row.privacyMetadata && typeof row.privacyMetadata === 'object') ? row.privacyMetadata as Record<string, unknown> : {},
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export async function appendSessionEvent(input: {
  schoolId: string;
  tutorLearnerId: string;
  sessionId: string;
  eventType: string;
  previousMode?: string;
  nextMode?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeEventSummary?: string;
  safeEvidenceRefs?: string[];
  reasonCodes?: string[];
  privacyMetadata?: Record<string, unknown>;
}): Promise<LearningSessionEventRecord> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "StudentLearningSessionEvent"
     ("schoolId", "tutorLearnerId", "sessionId", "eventType",
      "previousMode", "nextMode",
      "subject", "topic", "skillTag",
      "safeEventSummary", "safeEvidenceRefs", "reasonCodes", "privacyMetadata",
      "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             $11::jsonb, $12::jsonb, $13::jsonb, NOW())
     RETURNING *`,
    input.schoolId,
    input.tutorLearnerId,
    input.sessionId,
    input.eventType,
    input.previousMode || null,
    input.nextMode || null,
    input.subject || null,
    input.topic || null,
    input.skillTag || null,
    input.safeEventSummary || null,
    JSON.stringify(input.safeEvidenceRefs || []),
    JSON.stringify(input.reasonCodes || []),
    JSON.stringify(input.privacyMetadata || {}),
  );
  return toRecord(rows[0]);
}

export async function listSessionEvents(
  schoolId: string,
  tutorLearnerId: string,
  sessionId: string,
  limit: number = 50,
): Promise<LearningSessionEventRecord[]> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudentLearningSessionEvent"
     WHERE "schoolId" = $1 AND "tutorLearnerId" = $2 AND "sessionId" = $3
     ORDER BY "createdAt" DESC LIMIT $4`,
    schoolId,
    tutorLearnerId,
    sessionId,
    limit,
  );
  return (rows || []).map(toRecord);
}
