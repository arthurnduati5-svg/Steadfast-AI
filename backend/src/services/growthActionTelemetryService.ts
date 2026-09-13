import { v4 as uuidv4 } from 'uuid';
import type {
  GrowthActionEventType,
  GrowthActionIntent,
  GrowthActionDestination,
  GrowthActionExecutionStatus,
  GrowthActionRouteEvent,
} from '../contracts/growthActionContracts';

export interface TelemetryInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  growthActionPlanId?: string;
  eventType: GrowthActionEventType;
  sourceSurface?: string;
  growthIntent: GrowthActionIntent;
  resolvedDestination: GrowthActionDestination;
  executedDestination?: GrowthActionDestination;
  executionStatus: GrowthActionExecutionStatus;
  failureReasonCode?: string;
  safeMetadata?: Record<string, unknown>;
  safeEvidenceRefs?: string[];
}

const telemetryStore: GrowthActionRouteEvent[] = [];

export function recordGrowthActionEvent(input: TelemetryInput): GrowthActionRouteEvent {
  const event: GrowthActionRouteEvent = {
    id: uuidv4(),
    schoolId: input.schoolId,
    studentId: input.studentId,
    tutorLearnerId: input.tutorLearnerId,
    growthActionPlanId: input.growthActionPlanId,
    eventType: input.eventType,
    sourceSurface: input.sourceSurface,
    growthIntent: input.growthIntent,
    resolvedDestination: input.resolvedDestination,
    executedDestination: input.executedDestination,
    executionStatus: input.executionStatus,
    failureReasonCode: input.failureReasonCode,
    safeMetadata: input.safeMetadata || {},
    safeEvidenceRefs: input.safeEvidenceRefs || [],
    createdAt: new Date().toISOString(),
  };

  telemetryStore.push(event);
  return event;
}

export function getEventsByPlanId(growthActionPlanId: string): GrowthActionRouteEvent[] {
  return telemetryStore.filter(e => e.growthActionPlanId === growthActionPlanId);
}

export function getEventsByStudent(schoolId: string, studentId: string): GrowthActionRouteEvent[] {
  return telemetryStore.filter(e => e.schoolId === schoolId && e.studentId === studentId);
}

export function getEventsByType(eventType: GrowthActionEventType): GrowthActionRouteEvent[] {
  return telemetryStore.filter(e => e.eventType === eventType);
}

export function clearTelemetryStore(): void {
  telemetryStore.length = 0;
}
