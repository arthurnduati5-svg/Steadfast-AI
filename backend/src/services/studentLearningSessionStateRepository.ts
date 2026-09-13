import prisma from '../lib/prisma';
import type { LearningSessionStateRecord, LearningSessionStatus, LearningSessionMode, TutorModeTransitionReasonCode } from './studentLearningSessionContracts';

function toRecord(row: any): LearningSessionStateRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    tutorLearnerId: row.tutorLearnerId,
    studentId: row.studentId ?? undefined,
    externalStudentId: row.externalStudentId ?? undefined,
    status: row.status as LearningSessionStatus,
    currentMode: row.currentMode as LearningSessionMode,
    previousMode: row.previousMode ? (row.previousMode as LearningSessionMode) : undefined,
    subject: row.subject ?? undefined,
    topic: row.topic ?? undefined,
    skillTag: row.skillTag ?? undefined,
    activeChallengeId: row.activeChallengeId ?? undefined,
    activeRemediationPathId: row.activeRemediationPathId ?? undefined,
    activeRevisionItemId: row.activeRevisionItemId ?? undefined,
    supportLevel: row.supportLevel ?? undefined,
    difficultyLevel: row.difficultyLevel ?? undefined,
    safeProgressSummary: row.safeProgressSummary ?? undefined,
    safeEvidenceRefs: Array.isArray(row.safeEvidenceRefs) ? row.safeEvidenceRefs : [],
    reasonCodes: Array.isArray(row.reasonCodes) ? row.reasonCodes as TutorModeTransitionReasonCode[] : [],
    privacyMetadata: (row.privacyMetadata && typeof row.privacyMetadata === 'object') ? row.privacyMetadata as Record<string, unknown> : {},
    lastTransitionAt: row.lastTransitionAt instanceof Date ? row.lastTransitionAt : new Date(row.lastTransitionAt),
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  };
}

export async function createSessionState(input: {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  externalStudentId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
}): Promise<LearningSessionStateRecord> {
  const row = await prisma.$queryRawUnsafe<any[]>(
    `INSERT INTO "StudentLearningSessionState"
     ("schoolId", "tutorLearnerId", "studentId", "externalStudentId",
      "status", "currentMode",
      "subject", "topic", "skillTag",
      "safeEvidenceRefs", "reasonCodes", "privacyMetadata",
      "lastTransitionAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'active', 'session_start',
             $5, $6, $7,
             '[]'::jsonb, '[]'::jsonb, '{}'::jsonb,
             NOW(), NOW(), NOW())
     RETURNING *`,
    input.schoolId,
    input.tutorLearnerId,
    input.studentId || null,
    input.externalStudentId || null,
    input.subject || null,
    input.topic || null,
    input.skillTag || null,
  );
  return toRecord(row[0]);
}

export async function getActiveSessionState(
  schoolId: string,
  tutorLearnerId: string,
): Promise<LearningSessionStateRecord | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudentLearningSessionState"
     WHERE "schoolId" = $1 AND "tutorLearnerId" = $2
       AND "status" IN ('active', 'paused')
     ORDER BY "updatedAt" DESC LIMIT 1`,
    schoolId,
    tutorLearnerId,
  );
  return rows && rows.length > 0 ? toRecord(rows[0]) : null;
}

export async function getSessionStateForLearner(
  schoolId: string,
  tutorLearnerId: string,
  sessionId: string,
): Promise<LearningSessionStateRecord | null> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudentLearningSessionState"
     WHERE id = $1 AND "schoolId" = $2 AND "tutorLearnerId" = $3`,
    sessionId,
    schoolId,
    tutorLearnerId,
  );
  return rows && rows.length > 0 ? toRecord(rows[0]) : null;
}

export async function updateSessionState(
  sessionId: string,
  updates: {
    status?: LearningSessionStatus;
    currentMode?: LearningSessionMode;
    previousMode?: LearningSessionMode;
    subject?: string | null;
    topic?: string | null;
    skillTag?: string | null;
    activeChallengeId?: string | null;
    activeRemediationPathId?: string | null;
    activeRevisionItemId?: string | null;
    supportLevel?: string | null;
    difficultyLevel?: string | null;
    safeProgressSummary?: string | null;
    safeEvidenceRefs?: string[];
    reasonCodes?: TutorModeTransitionReasonCode[];
    privacyMetadata?: Record<string, unknown>;
  },
): Promise<LearningSessionStateRecord> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (updates.status !== undefined) {
    setClauses.push(`"status" = $${paramIdx++}`);
    values.push(updates.status);
  }
  if (updates.currentMode !== undefined) {
    setClauses.push(`"currentMode" = $${paramIdx++}`);
    values.push(updates.currentMode);
  }
  if (updates.previousMode !== undefined) {
    setClauses.push(`"previousMode" = $${paramIdx++}`);
    values.push(updates.previousMode);
  }
  if (updates.subject !== undefined) {
    setClauses.push(`"subject" = $${paramIdx++}`);
    values.push(updates.subject);
  }
  if (updates.topic !== undefined) {
    setClauses.push(`"topic" = $${paramIdx++}`);
    values.push(updates.topic);
  }
  if (updates.skillTag !== undefined) {
    setClauses.push(`"skillTag" = $${paramIdx++}`);
    values.push(updates.skillTag);
  }
  if (updates.activeChallengeId !== undefined) {
    setClauses.push(`"activeChallengeId" = $${paramIdx++}`);
    values.push(updates.activeChallengeId);
  }
  if (updates.activeRemediationPathId !== undefined) {
    setClauses.push(`"activeRemediationPathId" = $${paramIdx++}`);
    values.push(updates.activeRemediationPathId);
  }
  if (updates.activeRevisionItemId !== undefined) {
    setClauses.push(`"activeRevisionItemId" = $${paramIdx++}`);
    values.push(updates.activeRevisionItemId);
  }
  if (updates.supportLevel !== undefined) {
    setClauses.push(`"supportLevel" = $${paramIdx++}`);
    values.push(updates.supportLevel);
  }
  if (updates.difficultyLevel !== undefined) {
    setClauses.push(`"difficultyLevel" = $${paramIdx++}`);
    values.push(updates.difficultyLevel);
  }
  if (updates.safeProgressSummary !== undefined) {
    setClauses.push(`"safeProgressSummary" = $${paramIdx++}`);
    values.push(updates.safeProgressSummary);
  }
  if (updates.safeEvidenceRefs !== undefined) {
    setClauses.push(`"safeEvidenceRefs" = $${paramIdx++}::jsonb`);
    values.push(JSON.stringify(updates.safeEvidenceRefs));
  }
  if (updates.reasonCodes !== undefined) {
    setClauses.push(`"reasonCodes" = $${paramIdx++}::jsonb`);
    values.push(JSON.stringify(updates.reasonCodes));
  }
  if (updates.privacyMetadata !== undefined) {
    setClauses.push(`"privacyMetadata" = $${paramIdx++}::jsonb`);
    values.push(JSON.stringify(updates.privacyMetadata));
  }

  setClauses.push(`"lastTransitionAt" = NOW()`);
  setClauses.push(`"updatedAt" = NOW()`);

  values.push(sessionId);
  const sql = `UPDATE "StudentLearningSessionState"
               SET ${setClauses.join(', ')}
               WHERE id = $${paramIdx}
               RETURNING *`;
  const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...values);
  return toRecord(rows[0]);
}

export async function closeSession(
  sessionId: string,
  status: 'completed' | 'expired' = 'completed',
): Promise<LearningSessionStateRecord> {
  return updateSessionState(sessionId, { status: status as LearningSessionStatus, currentMode: 'session_complete' as LearningSessionMode });
}

export async function pauseSession(sessionId: string): Promise<LearningSessionStateRecord> {
  return updateSessionState(sessionId, { status: 'paused', currentMode: 'session_paused' as LearningSessionMode });
}

export async function resumeSession(
  sessionId: string,
): Promise<LearningSessionStateRecord> {
  return updateSessionState(sessionId, { status: 'active', currentMode: 'context_hydration' as LearningSessionMode });
}
