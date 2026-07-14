import { v4 as uuid } from 'uuid';
import { ExamAttemptTimingEvent, ExamTimingEventType } from '../contracts/examAttemptContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';

export class ExamTimingService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  private async recordEvent(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    eventType: ExamTimingEventType,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
    summary: string,
    metadata?: Record<string, unknown>,
  ): Promise<ExamAttemptTimingEvent> {
    return this.repos.timingEventRepository.create({
      timingEventId: uuid(),
      schoolId,
      attemptId,
      deliverySessionId,
      eventType,
      eventAt: new Date().toISOString(),
      durationSecondsUsed,
      durationSecondsRemaining,
      safeTimingSummary: summary,
      metadataJson: metadata ?? null,
    });
  }

  async recordAttemptStarted(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsAllowed: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'started', 0, durationSecondsAllowed, 'Attempt started');
  }

  async recordHeartbeat(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'heartbeat', durationSecondsUsed, durationSecondsRemaining, 'Heartbeat');
  }

  async recordPaused(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    await this.repos.attemptRepository.updateTiming(attemptId, new Date().toISOString(), durationSecondsUsed);
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'paused', durationSecondsUsed, durationSecondsRemaining, 'Attempt paused');
  }

  async recordResumed(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'resumed', durationSecondsUsed, durationSecondsRemaining, 'Attempt resumed');
  }

  async recordWarning(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'warning', durationSecondsUsed, durationSecondsRemaining, 'Time warning');
  }

  async recordExpired(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'expired', durationSecondsUsed, durationSecondsRemaining, 'Attempt expired');
  }

  async recordSubmitted(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'submitted', durationSecondsUsed, durationSecondsRemaining, 'Attempt submitted');
  }

  async recordAutoSubmitted(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'auto_submitted', durationSecondsUsed, durationSecondsRemaining, 'Attempt auto-submitted');
  }

  async recordCancelled(
    schoolId: string,
    attemptId: string,
    deliverySessionId: string,
    durationSecondsUsed: number,
    durationSecondsRemaining: number,
  ): Promise<ExamAttemptTimingEvent> {
    return this.recordEvent(schoolId, attemptId, deliverySessionId, 'cancelled', durationSecondsUsed, durationSecondsRemaining, 'Attempt cancelled');
  }

  computeDurationUsed(startedAt: string, now?: string): number {
    const start = new Date(startedAt).getTime();
    const end = now ? new Date(now).getTime() : Date.now();
    return Math.floor((end - start) / 1000);
  }

  computeDurationRemaining(durationSecondsAllowed: number, durationSecondsUsed: number): number {
    return Math.max(0, durationSecondsAllowed - durationSecondsUsed);
  }
}
