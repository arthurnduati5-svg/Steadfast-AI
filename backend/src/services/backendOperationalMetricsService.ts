const MAX_SAMPLES = 10_000;

type LatencySample = {
  name: string;
  durationMs: number;
  route?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  traceId?: string;
  timestamp: number;
};

const samples: LatencySample[] = [];

export function recordLatencySample(input: {
  name: string;
  durationMs: number;
  route?: string;
  method?: string;
  statusCode?: number;
  requestId?: string;
  traceId?: string;
}): void {
  const sample: LatencySample = {
    name: input.name,
    durationMs: input.durationMs,
    route: input.route,
    method: input.method,
    statusCode: input.statusCode,
    requestId: input.requestId,
    traceId: input.traceId,
    timestamp: Date.now(),
  };
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function getLatencySummary(input?: {
  name?: string;
  route?: string;
}): {
  count: number;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  maxMs: number | null;
} {
  let filtered = samples;
  if (input?.name) {
    filtered = filtered.filter((s) => s.name === input.name);
  }
  if (input?.route) {
    filtered = filtered.filter((s) => s.route === input.route);
  }
  const durations = filtered.map((s) => s.durationMs);
  return {
    count: durations.length,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    p99Ms: percentile(durations, 99),
    maxMs: durations.length > 0 ? Math.max(...durations) : null,
  };
}

export function resetOperationalMetricsForTests(): void {
  samples.length = 0;
}
