import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import type {
  CopilotDisplayMode,
  CopilotSessionPurpose,
  CopilotSessionContinuityStatus,
} from './copilotSessionContinuityContracts';

interface TutorSessionRow {
  id: string;
  tutorLearnerId: string;
  schoolId: string;
  externalStudentId: string;
  status: string;
  sessionPurpose: string;
  displayMode: string | null;
  lastActiveSchoolPage: string | null;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function createOrResumeDefaultCopilotSession(input: {
  requestId: string;
  tutorLearnerId: string;
  schoolId: string;
  externalStudentId: string;
  displayMode?: CopilotDisplayMode;
  activeSchoolPage?: string;
}): Promise<{
  tutorSessionId: string;
  sessionStatus: 'created' | 'resumed';
  continuityStatus: CopilotSessionContinuityStatus;
  sessionPurpose: CopilotSessionPurpose;
}> {
  const existing = await prisma.$queryRawUnsafe<TutorSessionRow[]>(
    `SELECT id, "tutorLearnerId", "schoolId", "externalStudentId", status, "sessionPurpose",
            "displayMode", "lastActiveSchoolPage", "lastSeenAt", "createdAt", "updatedAt"
     FROM "TutorSession"
     WHERE "tutorLearnerId" = $1 AND "schoolId" = $2
       AND "sessionPurpose" = 'copilot_default' AND status = 'active'
     ORDER BY "updatedAt" DESC LIMIT 1`,
    input.tutorLearnerId,
    input.schoolId,
  );

  if (existing && existing.length > 0) {
    const session = existing[0];

    const shouldUpdateDisplayMode =
      input.displayMode && session.displayMode !== input.displayMode;
    const shouldUpdateSchoolPage =
      input.activeSchoolPage !== undefined &&
      session.lastActiveSchoolPage !== input.activeSchoolPage;

    if (shouldUpdateDisplayMode || shouldUpdateSchoolPage) {
      await prisma.$executeRawUnsafe(
        `UPDATE "TutorSession"
         SET "displayMode" = COALESCE($1, "displayMode"),
             "lastActiveSchoolPage" = COALESCE($2, "lastActiveSchoolPage"),
             "lastSeenAt" = NOW(),
             "updatedAt" = NOW()
         WHERE id = $3`,
        input.displayMode || null,
        input.activeSchoolPage || null,
        session.id,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "TutorSession" SET "lastSeenAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
        session.id,
      );
    }

    const continuityStatus: CopilotSessionContinuityStatus =
      shouldUpdateDisplayMode || shouldUpdateSchoolPage ? 'mode_updated' : 'resumed';

    logger.info(
      {
        requestId: input.requestId,
        tutorSessionId: session.id,
        tutorLearnerId: input.tutorLearnerId,
        continuityStatus,
        displayMode: input.displayMode,
      },
      '[TutorSessionContinuity] Default copilot session resumed',
    );

    return {
      tutorSessionId: session.id,
      sessionStatus: 'resumed',
      continuityStatus,
      sessionPurpose: 'copilot_default',
    };
  }

  const tutorSessionId = `ts_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "TutorSession" (id, "tutorLearnerId", "schoolId", "externalStudentId",
                                  status, "sessionPurpose", "displayMode", "lastActiveSchoolPage",
                                  "lastSeenAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 'active', 'copilot_default', $5, $6, NOW(), NOW(), NOW())`,
    tutorSessionId,
    input.tutorLearnerId,
    input.schoolId,
    input.externalStudentId,
    input.displayMode || null,
    input.activeSchoolPage || null,
  );

  logger.info(
    {
      requestId: input.requestId,
      tutorSessionId,
      tutorLearnerId: input.tutorLearnerId,
      displayMode: input.displayMode,
    },
    '[TutorSessionContinuity] Default copilot session created',
  );

  return {
    tutorSessionId,
    sessionStatus: 'created',
    continuityStatus: 'created',
    sessionPurpose: 'copilot_default',
  };
}

export async function updateCopilotDisplayMode(input: {
  requestId: string;
  tutorSessionId: string;
  tutorLearnerId: string;
  schoolId: string;
  displayMode?: CopilotDisplayMode;
  activeSchoolPage?: string;
}): Promise<{
  tutorSessionId: string;
  continuityStatus: CopilotSessionContinuityStatus;
}> {
  await assertCopilotSessionOwnership({
    requestId: input.requestId,
    tutorSessionId: input.tutorSessionId,
    tutorLearnerId: input.tutorLearnerId,
    schoolId: input.schoolId,
  });

  await prisma.$executeRawUnsafe(
    `UPDATE "TutorSession"
     SET "displayMode" = COALESCE($1, "displayMode"),
         "lastActiveSchoolPage" = COALESCE($2, "lastActiveSchoolPage"),
         "lastSeenAt" = NOW(),
         "updatedAt" = NOW()
     WHERE id = $3`,
    input.displayMode || null,
    input.activeSchoolPage || null,
    input.tutorSessionId,
  );

  logger.info(
    {
      requestId: input.requestId,
      tutorSessionId: input.tutorSessionId,
      displayMode: input.displayMode,
    },
    '[TutorSessionContinuity] Display mode updated',
  );

  return {
    tutorSessionId: input.tutorSessionId,
    continuityStatus: 'mode_updated',
  };
}

export async function assertCopilotSessionOwnership(input: {
  requestId: string;
  tutorSessionId: string;
  tutorLearnerId: string;
  schoolId: string;
}): Promise<void> {
  const sessions = await prisma.$queryRawUnsafe<TutorSessionRow[]>(
    `SELECT id, "tutorLearnerId", "schoolId", "externalStudentId", status, "sessionPurpose",
            "displayMode", "lastActiveSchoolPage", "lastSeenAt", "createdAt", "updatedAt"
     FROM "TutorSession" WHERE id = $1`,
    input.tutorSessionId,
  );

  if (!sessions || sessions.length === 0) {
    logger.warn(
      {
        requestId: input.requestId,
        requestedTutorSessionId: input.tutorSessionId,
      },
      '[TutorSessionContinuity] Session not found',
    );
    const err = new Error('session_not_found') as Error & {
      errorCode: string; httpStatus: number; safeMessage: string;
    };
    err.errorCode = 'session_not_found';
    err.httpStatus = 404;
    err.safeMessage = 'The tutoring session could not be found.';
    throw err;
  }

  const session = sessions[0];

  if (session.tutorLearnerId !== input.tutorLearnerId) {
    logger.warn(
      {
        requestId: input.requestId,
        requestedTutorSessionId: input.tutorSessionId,
        requestedTutorLearnerId: input.tutorLearnerId,
        actualTutorLearnerId: session.tutorLearnerId,
      },
      '[TutorSessionContinuity] Cross-learner session ownership mismatch',
    );
    const err = new Error('session_ownership_mismatch') as Error & {
      errorCode: string; httpStatus: number; safeMessage: string;
    };
    err.errorCode = 'session_ownership_mismatch';
    err.httpStatus = 403;
    err.safeMessage = 'This tutor session could not be verified for your school account. Please reopen the copilot from your student dashboard.';
    throw err;
  }

  if (session.schoolId !== input.schoolId) {
    logger.warn(
      {
        requestId: input.requestId,
        tutorSessionId: input.tutorSessionId,
        expectedSchoolId: input.schoolId,
        actualSchoolId: session.schoolId,
      },
      '[TutorSessionContinuity] Cross-school session ownership mismatch',
    );
    const err = new Error('session_ownership_mismatch') as Error & {
      errorCode: string; httpStatus: number; safeMessage: string;
    };
    err.errorCode = 'session_ownership_mismatch';
    err.httpStatus = 403;
    err.safeMessage = 'This tutor session could not be verified for your school account. Please reopen the copilot from your student dashboard.';
    throw err;
  }

  if (session.status === 'closed' || session.status === 'archived') {
    logger.warn(
      {
        requestId: input.requestId,
        tutorSessionId: input.tutorSessionId,
        sessionStatus: session.status,
      },
      '[TutorSessionContinuity] Session is closed or archived',
    );
    const err = new Error('session_closed') as Error & {
      errorCode: string; httpStatus: number; safeMessage: string;
    };
    err.errorCode = 'session_closed';
    err.httpStatus = 409;
    err.safeMessage = 'This tutor session is no longer active. Please reopen the copilot from your student dashboard.';
    throw err;
  }

  logger.info(
    {
      requestId: input.requestId,
      tutorSessionId: input.tutorSessionId,
    },
    '[TutorSessionContinuity] Session ownership verified',
  );
}
