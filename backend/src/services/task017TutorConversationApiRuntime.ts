import { v4 as uuidv4 } from 'uuid';
import type { TutorConversationTurnRequest, TutorConversationResponseEnvelope, TutorConversationErrorEnvelope, ConversationRuntimeErrorCode, ConversationAuditRecord } from './task017Contracts';
import { MODE_TO_LEARNER_ACTION } from './task017Contracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { EndToEndLearningLoopRequest, EndToEndLearningLoopResult } from './studentLearningSessionContracts';
import type { TutorStreamingResponseRuntime } from './task017TutorStreamingResponseRuntime';
import { validateConversationRequest } from './task017ConversationRequestValidationService';
import { buildSuccessEnvelope } from './task017ConversationResponseEnvelopeService';
import { mapErrorToEnvelope } from './task017ConversationRuntimeErrorMapper';
import { tryAcquireIdempotencyLock, releaseIdempotencyLock } from './task017ConversationIdempotencyService';
import { recordConversationAudit } from './task017ConversationAuditService';
import { runEndToEndLearningLoop } from './endToEndLearningLoopRuntime';
import { getSessionStateForLearner } from './studentLearningSessionStateRepository';
import { logger } from '../utils/logger';

export class TutorConversationApiRuntime {
  async processTurn(
    body: unknown,
    identity: ResolvedTutorIdentity,
    requestId: string,
    correlationId: string,
    route: string,
    streamRuntime?: TutorStreamingResponseRuntime,
  ): Promise<TutorConversationResponseEnvelope | TutorConversationErrorEnvelope> {
    const validationIdentity = { userId: identity.studentId, schoolId: identity.schoolId, role: identity.role };
    const validation = validateConversationRequest(body, validationIdentity);
    if (!validation.valid) {
      return this.handleError(requestId, correlationId, validation.error || 'UNKNOWN_SAFE_ERROR', validation.safeMessage);
    }

    const req = body as TutorConversationTurnRequest;

    if (req.sessionId) {
      const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, req.sessionId);
      if (!sessionState) {
        return this.handleError(requestId, correlationId, 'SESSION_NOT_FOUND');
      }
    }

    if (req.idempotencyKey) {
      const idempotencyResult = await tryAcquireIdempotencyLock(
        identity.schoolId,
        identity.studentId,
        req.idempotencyKey,
      );
      if (!idempotencyResult.acquired) {
        return this.handleError(requestId, correlationId, 'IDEMPOTENCY_CONFLICT');
      }
    }

    if (streamRuntime) {
      streamRuntime.sendStarted();
    }

    const sessionId = req.sessionId || 'new';

    if (streamRuntime) {
      streamRuntime.sendSessionResolved(sessionId, !!req.sessionId);
    }

    const learnerActionType = MODE_TO_LEARNER_ACTION[req.mode] || 'continue';
    const loopRequest: EndToEndLearningLoopRequest = {
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      studentId: identity.userId,
      sessionId: req.sessionId,
      subject: req.subject,
      topic: req.topic,
      skillTag: req.skillTag,
      learnerActionType,
      message: req.message,
      attemptText: req.attemptText,
      selectedOptionId: req.selectedOptionId,
      feedbackType: req.feedbackType,
      clientContext: req.clientContext,
    };

    if (streamRuntime) {
      streamRuntime.sendModeSelected(req.mode);
    }

    let loopResult: EndToEndLearningLoopResult;
    try {
      loopResult = await runEndToEndLearningLoop({
        identity,
        request: loopRequest,
        requestId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ requestId, error: errorMessage }, 'Learning loop execution failed');

      if (req.idempotencyKey) {
        await releaseIdempotencyLock(identity.schoolId, identity.studentId, req.idempotencyKey, 'failed', 'LEARNING_LOOP_FAILED');
      }
      if (streamRuntime) {
        streamRuntime.sendError('LEARNING_LOOP_FAILED', 'The learning service encountered an issue. Please try again.');
        streamRuntime.end();
      }

      return this.handleError(requestId, correlationId, 'LEARNING_LOOP_FAILED');
    }

    if (streamRuntime) {
      streamRuntime.sendSafetyChecked(true);
      streamRuntime.sendResponseCompleted(loopResult);
      if (loopResult.checkpointWritten) {
        streamRuntime.sendCheckpointSaved();
      }
    }

    if (req.idempotencyKey) {
      await releaseIdempotencyLock(identity.schoolId, identity.studentId, req.idempotencyKey, 'completed');
    }

    const envelope = buildSuccessEnvelope(requestId, correlationId, loopResult, !!req.stream, identity);

    const auditRecord: ConversationAuditRecord = {
      actorId: identity.studentId,
      actorRole: 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      sessionId: loopResult.sessionState.id,
      requestId,
      correlationId,
      route,
      mode: req.mode,
      streaming: !!req.stream,
      status: loopResult.sessionState.status,
      reasonCodes: loopResult.sessionState.reasonCodes,
      safeEvidenceRefs: loopResult.sessionState.safeEvidenceRefs,
      safetyDecision: 'passed',
      privacyDecision: 'learner_safe',
      deenSensitivityHandled: loopResult.mode === 'deen_safe_support' || loopResult.mode === 'deen_teacher_referral',
      safeguardingBoundaryApplied: loopResult.mode === 'safeguarding_pause',
      createdAt: envelope.createdAt,
    };

    await recordConversationAudit(auditRecord);

    if (streamRuntime) {
      streamRuntime.sendCompleted();
      streamRuntime.end();
    }

    return envelope;
  }

  private handleError(
    requestId: string,
    correlationId: string,
    errorCode: ConversationRuntimeErrorCode,
    safeMessage?: string,
  ): TutorConversationErrorEnvelope {
    const envelope = mapErrorToEnvelope(requestId, correlationId, errorCode);
    if (safeMessage) {
      envelope.safeMessage = safeMessage;
    }

    recordConversationAudit({
      actorId: 'unknown',
      actorRole: 'learner',
      schoolId: '',
      tutorLearnerId: '',
      requestId,
      correlationId,
      route: 'conversation',
      mode: 'error',
      streaming: false,
      status: 'error',
      errorCode,
      reasonCodes: [],
      safeEvidenceRefs: [],
      safetyDecision: 'error',
      privacyDecision: 'learner_safe',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: envelope.createdAt,
    }).catch(() => {});

    return envelope;
  }
}
