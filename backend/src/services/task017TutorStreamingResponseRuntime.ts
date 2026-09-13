import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createStreamEvent } from './task017StreamingEventContractService';
import { sanitizeStreamPayload } from './task017StreamingEventSafetyGuardService';
import type { TutorStreamingEvent, TutorStreamingEventType } from './task017Contracts';
import type { EndToEndLearningLoopResult } from './studentLearningSessionContracts';

export class TutorStreamingResponseRuntime {
  private sequence = 0;
  private requestId: string;
  private correlationId: string;
  private sessionId: string;

  constructor(
    private res: Response,
    requestId: string,
    correlationId: string,
    sessionId: string,
  ) {
    this.requestId = requestId;
    this.correlationId = correlationId;
    this.sessionId = sessionId;
  }

  private sendEvent(event: TutorStreamingEvent): void {
    const safePayload = sanitizeStreamPayload(event.payload);
    const safeEvent = { ...event, payload: safePayload.sanitized };
    this.res.write(`event: ${event.eventType}\ndata: ${JSON.stringify(safeEvent)}\n\n`);
  }

  sendStarted(): void {
    this.sequence = 0;
    const event = createStreamEvent(
      'conversation.started',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { mode: 'initiated' },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendSessionResolved(sessionId: string, resumed: boolean): void {
    const event = createStreamEvent(
      'session.resolved',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { sessionId, resumed },
      sessionId,
    );
    this.sendEvent(event);
  }

  sendModeSelected(mode: string): void {
    const event = createStreamEvent(
      'mode.selected',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { mode },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendSafetyChecked(passed: boolean): void {
    const event = createStreamEvent(
      'safety.checked',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { passed },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendDelta(chunk: string): void {
    const event = createStreamEvent(
      'response.delta',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { text: chunk },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendResponseCompleted(result: EndToEndLearningLoopResult): void {
    const event = createStreamEvent(
      'response.completed',
      this.requestId,
      this.correlationId,
      this.sequence++,
      {
        mode: result.mode,
        sessionId: result.sessionState.id,
        hasWhyThisNext: !!result.whyThisNext,
      },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendRecommendationReady(): void {
    const event = createStreamEvent(
      'recommendation.ready',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { ready: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendChallengeReady(): void {
    const event = createStreamEvent(
      'challenge.ready',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { ready: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendRemediationReady(): void {
    const event = createStreamEvent(
      'remediation.ready',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { ready: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendRevisionReady(): void {
    const event = createStreamEvent(
      'revision.ready',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { ready: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendEvidencePersisted(): void {
    const event = createStreamEvent(
      'evidence.persisted',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { persisted: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendCheckpointSaved(): void {
    const event = createStreamEvent(
      'checkpoint.saved',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { saved: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendCompleted(): void {
    const event = createStreamEvent(
      'conversation.completed',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { complete: true },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  sendError(errorCode: string, safeMessage: string): void {
    const event = createStreamEvent(
      'conversation.error',
      this.requestId,
      this.correlationId,
      this.sequence++,
      { errorCode, message: safeMessage },
      this.sessionId,
    );
    this.sendEvent(event);
  }

  end(): void {
    this.res.end();
  }
}
