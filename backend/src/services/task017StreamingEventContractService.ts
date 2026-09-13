import { v4 as uuidv4 } from 'uuid';
import type { TutorStreamingEvent, TutorStreamingEventType } from './task017Contracts';
import { STREAM_EVENT_TYPES } from './task017Contracts';

export function createStreamEvent(
  eventType: TutorStreamingEventType,
  requestId: string,
  correlationId: string,
  sequence: number,
  payload: Record<string, unknown>,
  sessionId?: string,
): TutorStreamingEvent {
  if (!STREAM_EVENT_TYPES.includes(eventType)) {
    throw new Error(`Invalid stream event type: ${eventType}`);
  }
  return {
    eventId: uuidv4(),
    eventType,
    requestId,
    correlationId,
    sessionId,
    sequence,
    payload,
    privacyMetadata: { dataMinimized: true, noRawData: true },
    createdAt: new Date().toISOString(),
  };
}

export function validateStreamEvent(event: TutorStreamingEvent): boolean {
  if (!event.eventId || !event.eventType || !event.requestId || !event.correlationId) return false;
  if (typeof event.sequence !== 'number' || event.sequence < 0) return false;
  if (!STREAM_EVENT_TYPES.includes(event.eventType)) return false;
  return true;
}
