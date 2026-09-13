// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Operation Trace Context Service
// Creates and propagates safe request tracing metadata.
// Never puts raw messages, tokens, or secrets in trace.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import type { OperationTraceContext, TelemetryComponent } from '../contracts/task018Contracts';

export function createOperationTraceContext(input: {
  requestId?: string;
  correlationId?: string;
  routeName: string;
  component: TelemetryComponent;
  schoolId?: string;
  tutorLearnerId?: string;
  sessionId?: string;
}): OperationTraceContext {
  return {
    requestId: input.requestId || randomUUID(),
    correlationId: input.correlationId || randomUUID(),
    operationId: randomUUID(),
    routeName: input.routeName,
    component: input.component,
    schoolId: input.schoolId,
    tutorLearnerId: input.tutorLearnerId,
    sessionId: input.sessionId,
    startedAt: new Date().toISOString(),
  };
}

export function createChildTraceContext(
  parent: OperationTraceContext,
  override?: Partial<OperationTraceContext>,
): OperationTraceContext {
  return {
    ...parent,
    ...override,
    operationId: randomUUID(),
    startedAt: new Date().toISOString(),
  };
}

export function extractDiagnosticTraceSummary(
  context: OperationTraceContext,
): Record<string, unknown> {
  return {
    requestId: context.requestId,
    correlationId: context.correlationId,
    operationId: context.operationId,
    routeName: context.routeName,
    component: context.component,
    schoolId: context.schoolId,
    sessionId: context.sessionId,
    startedAt: context.startedAt,
  };
}
