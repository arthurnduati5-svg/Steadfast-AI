import { randomUUID } from 'crypto';
import type { BackendTraceContext, ParsedTraceparent } from '../contracts/traceContextContracts';

const TRACEPARENT_REGEX = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

export function parseTraceparent(value: string | undefined): ParsedTraceparent {
  if (!value || typeof value !== 'string') {
    return { valid: false };
  }
  const match = TRACEPARENT_REGEX.exec(value.trim());
  if (!match) {
    return { valid: false };
  }
  return {
    valid: true,
    version: match[1],
    traceId: match[2],
    parentSpanId: match[3],
    traceFlags: match[4],
  };
}

function generateHexString(length: number): string {
  const bytes = require('crypto').randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
}

function generateTraceId(): string {
  return generateHexString(32);
}

function generateSpanId(): string {
  return generateHexString(16);
}

export function createTraceContext(input: {
  incomingTraceparent?: string;
  incomingTracestate?: string;
  existingRequestId?: string;
}): BackendTraceContext {
  const requestId = input.existingRequestId || randomUUID();
  const parsed = parseTraceparent(input.incomingTraceparent);

  if (parsed.valid && parsed.traceId) {
    return {
      requestId,
      traceId: parsed.traceId,
      spanId: generateSpanId(),
      parentSpanId: parsed.parentSpanId,
      traceparent: input.incomingTraceparent,
      tracestate: input.incomingTracestate,
      source: 'incoming',
    };
  }

  const traceId = generateTraceId();
  const spanId = generateSpanId();
  return {
    requestId,
    traceId,
    spanId,
    source: 'generated',
  };
}

export function createChildSpan(input: BackendTraceContext): BackendTraceContext {
  return {
    requestId: input.requestId,
    traceId: input.traceId,
    spanId: generateSpanId(),
    parentSpanId: input.spanId || input.parentSpanId,
    source: 'generated',
  };
}

export function toTraceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}
