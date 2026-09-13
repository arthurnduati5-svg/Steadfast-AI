export type BackendTraceContext = {
  requestId: string;
  traceId: string;
  spanId?: string;
  parentSpanId?: string;
  traceparent?: string;
  tracestate?: string;
  source: 'generated' | 'incoming' | 'restored';
};

export type ParsedTraceparent = {
  valid: boolean;
  version?: string;
  traceId?: string;
  parentSpanId?: string;
  traceFlags?: string;
};

export type BackendTraceCarrier = {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  traceparent?: string;
  tracestate?: string;
};
