import {
  Task036LaunchEventInput,
  Task036LaunchEventRecord,
  createTask036SafeId,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export function intakeEvent(sessionId: string, input: Task036LaunchEventInput): Task036LaunchEventRecord {
  const eventType = (input.eventType as string) || 'unknown';
  const safeSummary = (input.safeSummary as string) || '';
  const event: Task036LaunchEventRecord = {
    eventId: createTask036SafeId(),
    sessionId,
    eventType,
    safeSummary,
    timestamp: createTask036SafeTimestamp(),
  };
  task036Repository.saveLaunchEvent(event);
  return event;
}

export function getSafeSummary(sessionId: string): string {
  const events = task036Repository.listLaunchEventsForSession(sessionId);
  if (events.length === 0) return 'No events recorded for this session.';
  return `Session ${sessionId} has ${events.length} event(s). Last event: ${events[events.length - 1].eventType} at ${events[events.length - 1].timestamp}.`;
}

export function getEventsBySession(sessionId: string): Task036LaunchEventRecord[] {
  return task036Repository.listLaunchEventsForSession(sessionId);
}
