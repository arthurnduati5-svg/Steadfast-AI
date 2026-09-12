import type {
  CopilotHandoffResponse,
  CopilotHandoffErrorResponse,
  TutorClientContext,
} from './copilotHandoffContracts';
import type { SchoolAuthBridgeInput } from './schoolAuthBridgeContracts';
import { verifySchoolAuth, requireVerifiedLearnerContext } from './schoolAuthBridgeService';
import { findOrCreateTutorLearnerMapping } from './externalStudentIdentityMapper';
import { createOrResumeDefaultCopilotSession } from './tutorSessionContinuityService';
import { logger } from '../utils/logger';
import type { CopilotDisplayMode } from './copilotSessionContinuityContracts';

export async function buildCopilotHandoff(input: {
  authorizationHeader?: string;
  requestId: string;
  clientContext?: TutorClientContext;
}): Promise<CopilotHandoffResponse | CopilotHandoffErrorResponse> {
  const startTime = Date.now();

  try {
    logger.info({ requestId: input.requestId }, '[CopilotHandoff] Handoff requested');

    const authInput: SchoolAuthBridgeInput = {
      authorizationHeader: input.authorizationHeader,
      requestId: input.requestId,
    };

    const authResult = await verifySchoolAuth(authInput);

    if (!authResult.ok) {
      logger.warn(
        { requestId: input.requestId, failureCode: authResult.failure.authStatus },
        '[CopilotHandoff] Auth verification failed',
      );
      return {
        ok: false,
        requestId: input.requestId,
        errorCode: authResult.failure.authStatus,
        safeMessage: authResult.failure.safeMessage,
      };
    }

    const verified = authResult.context;

    const inactiveStatuses = ['completed', 'transferred', 'left_school'];
    if (inactiveStatuses.includes(verified.enrollmentStatus)) {
      logger.warn(
        {
          requestId: input.requestId,
          enrollmentStatus: verified.enrollmentStatus,
        },
        '[CopilotHandoff] Inactive student attempted handoff',
      );
      return {
        ok: false,
        requestId: input.requestId,
        errorCode: 'inactive_student',
        safeMessage: 'Your account does not have an active enrollment. Tutoring is not available.',
      };
    }

    const mapping = await findOrCreateTutorLearnerMapping({
      externalStudentId: verified.externalStudentId,
      schoolId: verified.schoolId,
      classId: verified.classId,
      grade: verified.grade,
      enrollmentStatus: verified.enrollmentStatus,
    });

    if (mapping.createdNew) {
      logger.info(
        {
          requestId: input.requestId,
          tutorLearnerId: mapping.tutorLearnerId,
        },
        '[CopilotHandoff] Learner mapping created',
      );
    } else {
      logger.info(
        {
          requestId: input.requestId,
          tutorLearnerId: mapping.tutorLearnerId,
        },
        '[CopilotHandoff] Learner mapping resumed',
      );
    }

    const inactiveMappingStatuses: string[] = ['completed', 'transferred', 'left_school'];
    if (inactiveMappingStatuses.includes(mapping.record.status)) {
      logger.warn(
        {
          requestId: input.requestId,
          tutorLearnerId: mapping.tutorLearnerId,
          mappingStatus: mapping.record.status,
        },
        '[CopilotHandoff] Inactive student mapping prevented handoff',
      );
      return {
        ok: false,
        requestId: input.requestId,
        errorCode: 'inactive_student',
        safeMessage: 'Your account does not have an active enrollment. Tutoring is not available.',
      };
    }

    const displayMode = input.clientContext?.displayMode as CopilotDisplayMode | undefined;
    const activeSchoolPage = input.clientContext?.activeSchoolPage;

    const session = await createOrResumeDefaultCopilotSession({
      requestId: input.requestId,
      tutorLearnerId: mapping.tutorLearnerId,
      schoolId: verified.schoolId,
      externalStudentId: verified.externalStudentId,
      displayMode,
      activeSchoolPage,
    });

    if (session.sessionStatus === 'created') {
      logger.info(
        {
          requestId: input.requestId,
          tutorSessionId: session.tutorSessionId,
        },
        '[CopilotHandoff] Tutor session created',
      );
    } else {
      logger.info(
        {
          requestId: input.requestId,
          tutorSessionId: session.tutorSessionId,
          continuityStatus: session.continuityStatus,
        },
        '[CopilotHandoff] Tutor session resumed',
      );
    }

    const response: CopilotHandoffResponse = {
      ok: true,
      requestId: input.requestId,
      tutorLearnerId: mapping.tutorLearnerId,
      tutorSessionId: session.tutorSessionId,
      schoolId: verified.schoolId,
      classId: verified.classId,
      grade: verified.grade,
      displayName: verified.displayName,
      enrollmentStatus: verified.enrollmentStatus,
      preferredLanguage: verified.preferredLanguage || 'english',
      curriculumTrack: verified.curriculumTrack || 'unknown',
      sessionStatus: session.sessionStatus,
      continuityStatus: session.continuityStatus,
      sessionPurpose: session.sessionPurpose,
      displayMode,
      activeSchoolPage,
      safeToStartTutor: true,
    };

    const duration = Date.now() - startTime;
    logger.info(
      {
        requestId: input.requestId,
        durationMs: duration,
        tutorLearnerId: mapping.tutorLearnerId,
        tutorSessionId: session.tutorSessionId,
        continuityStatus: session.continuityStatus,
      },
      '[CopilotHandoff] Handoff completed',
    );

    return response;
  } catch (err) {
    logger.error(
      { requestId: input.requestId, error: String(err) },
      '[CopilotHandoff] Unexpected error during handoff',
    );
    return {
      ok: false,
      requestId: input.requestId,
      errorCode: 'unknown',
      safeMessage: 'An unexpected error occurred. Please try again.',
    };
  }
}
