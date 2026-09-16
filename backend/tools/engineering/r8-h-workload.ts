/**
 * R8-H Algorithm Optimization workload harness.
 *
 * ONE bounded harness for R8-H candidate targets (no per-algorithm scripts).
 * Target-selectable; imports ONLY explicit target services; synthetic
 * fixtures only; no production providers, no live school data, no DB.
 *
 * Targets (selected with --target):
 *   rate-limit   AI runtime sliding-window limiter check+record pairs
 *   daily-feed   Daily-learning-feed dedupe + priority sort pipeline
 *
 * Usage:
 *   npx tsx tools/engineering/r8-h-workload.ts --target rate-limit
 *   npx tsx tools/engineering/r8-h-workload.ts --target daily-feed
 *
 * Properties: deterministic seeded fixtures, warmup >= 10, samples >= 30,
 * SMALL / REPRESENTATIVE / LARGE / STRESS sizes, p50/p95/min/max latency,
 * heap deltas, correctness digest, machine metadata.
 */

import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import * as os from 'node:os';

const args = process.argv.slice(2);
function argValue(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const target = argValue('--target');

if (!target) {
  console.error('usage: tsx tools/engineering/r8-h-workload.ts --target <rate-limit|daily-feed>');
  process.exit(2);
}

// ── deterministic RNG (mulberry32) ─────────────────────────────────────
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── stats ──────────────────────────────────────────────────────────────
function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return NaN;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}
function memMB(): number {
  return process.memoryUsage().heapUsed / 1024 / 1024;
}
function statsOf(samples: number[]): Record<string, number> {
  return {
    samples: samples.length,
    p50Ms: Number(percentile(samples, 50).toFixed(4)),
    p95Ms: Number(percentile(samples, 95).toFixed(4)),
    minMs: Number(Math.min(...samples).toFixed(4)),
    maxMs: Number(Math.max(...samples).toFixed(4)),
  };
}
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}
function digestOf(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16);
}
function envRecord(): Record<string, unknown> {
  return {
    os: `${os.platform()} ${os.release()}`,
    node: process.version,
    cpuLogical: os.cpus().length,
    cpuModel: os.cpus()[0]?.model ?? 'unknown',
    ramGB: Number((os.totalmem() / 1024 / 1024 / 1024).toFixed(1)),
    sha: process.env.R8H_SHA ?? 'recorded-in-report',
    warmups: 10,
    database: 'none (in-memory synthetic only)',
  };
}

// ════════════════════════════════════════════════════════════════════════
// TARGET: rate-limit — check+record pairs against saturated windows
// ════════════════════════════════════════════════════════════════════════
async function runRateLimit(): Promise<void> {
  const rl = await import('../../src/services/aiRuntimeRateLimitGuardService');

  const WINDOW_MS = 60000;
  const T0 = 1000000;

  // Fill one scope window with w synthetic timestamps spread over the window.
  function fillScope(prefix: string, id: string, w: number, provider: string, op: string): void {
    for (let i = 0; i < w; i++) {
      const t = T0 + Math.floor((i / Math.max(1, w)) * (WINDOW_MS - 1));
      rl.recordAiRateLimitUsage({ actorType: 'x', actorId: `${prefix}-${id}`, schoolId: undefined, provider, operation: op, nowMs: t });
    }
  }

  type Scenario = {
    name: string;
    size: 'SMALL' | 'REPRESENTATIVE' | 'LARGE' | 'STRESS';
    setup: () => { input: Record<string, unknown>; opsPerSample: number };
  };

  const scenarios: Scenario[] = [
    {
      name: 'student-scope-saturated',
      size: 'SMALL',
      setup: () => {
        rl.resetAiRateLimitStateForTests();
        fillScope('student', 's-small', 30, 'openai', 'chat');
        const input = { actorType: 'student', actorId: 'student-s-small', provider: 'openai', operation: 'chat' };
        return { input: input as Record<string, unknown>, opsPerSample: 500 };
      },
    },
    {
      name: 'three-scope-representative',
      size: 'REPRESENTATIVE',
      setup: () => {
        rl.resetAiRateLimitStateForTests();
        fillScope('student', 's-rep', 30, 'openai', 'chat');
        // school scope: 500 events under one school id
        for (let i = 0; i < 500; i++) {
          const t = T0 + Math.floor((i / 500) * (WINDOW_MS - 1));
          rl.recordAiRateLimitUsage({ schoolId: 'school-rep', provider: 'openai', operation: 'chat', nowMs: t });
        }
        // provider scope: 1000 events
        for (let i = 0; i < 1000; i++) {
          const t = T0 + Math.floor((i / 1000) * (WINDOW_MS - 1));
          rl.recordAiRateLimitUsage({ provider: 'openai', operation: 'chat', nowMs: t });
        }
        const input = {
          actorType: 'student', actorId: 'student-s-rep', schoolId: 'school-rep',
          provider: 'openai', operation: 'chat',
        };
        return { input: input as Record<string, unknown>, opsPerSample: 200 };
      },
    },
    {
      name: 'provider-scope-denial',
      size: 'LARGE',
      setup: () => {
        rl.resetAiRateLimitStateForTests();
        for (let i = 0; i < 1000; i++) {
          const t = T0 + Math.floor((i / 1000) * (WINDOW_MS - 1));
          rl.recordAiRateLimitUsage({ provider: 'openai', operation: 'chat', nowMs: t });
        }
        const input = { provider: 'openai', operation: 'chat' };
        return { input: input as Record<string, unknown>, opsPerSample: 500 };
      },
    },
    {
      name: 'oversize-window-slope',
      size: 'STRESS',
      setup: () => {
        rl.resetAiRateLimitStateForTests();
        for (let i = 0; i < 2000; i++) {
          const t = T0 + Math.floor((i / 2000) * (WINDOW_MS - 1));
          rl.recordAiRateLimitUsage({ provider: 'openai', operation: 'stress', nowMs: t });
        }
        const input = { provider: 'openai', operation: 'stress' };
        return { input: input as Record<string, unknown>, opsPerSample: 200 };
      },
    },
  ];

  const WARMUPS = 10;
  const SAMPLES = 30;

  for (const sc of scenarios) {
    const { input, opsPerSample } = sc.setup();
    const typed = input as { actorType?: string; actorId?: string; schoolId?: string; provider: string; operation: string };
    // Warmup (unmeasured, same call shape).
    for (let w = 0; w < WARMUPS; w++) {
      for (let o = 0; o < opsPerSample; o++) {
        const nowMs = T0 + WINDOW_MS - 2;
        const d = rl.checkAiRateLimit({ ...typed, nowMs });
        if (d.allowed) rl.recordAiRateLimitUsage({ ...typed, nowMs });
      }
    }
    // Re-setup so measured samples start from the identical saturated state.
    const fresh = sc.setup();
    const samples: number[] = [];
    let allowed = 0;
    let denied = 0;
    for (let s = 0; s < SAMPLES; s++) {
      const t0 = performance.now();
      for (let o = 0; o < fresh.opsPerSample; o++) {
        const nowMs = T0 + WINDOW_MS - 2;
        const d = rl.checkAiRateLimit({ ...(fresh.input as typeof typed), nowMs });
        if (d.allowed) { allowed++; rl.recordAiRateLimitUsage({ ...(fresh.input as typeof typed), nowMs }); }
        else denied++;
      }
      samples.push((performance.now() - t0) / fresh.opsPerSample);
    }
    const memBefore = memMB();
    // Heap effect of one more saturated burst (outside the timer).
    for (let o = 0; o < fresh.opsPerSample; o++) {
      rl.recordAiRateLimitUsage({ ...(fresh.input as typeof typed), nowMs: T0 + WINDOW_MS - 2 });
    }
    const memAfter = memMB();
    console.log(JSON.stringify({
      target: `rate-limit:${sc.name}`,
      size: sc.size,
      opsPerSample: fresh.opsPerSample,
      perOpMs: statsOf(samples),
      allowed,
      denied,
      heapDeltaMB: Number((memAfter - memBefore).toFixed(3)),
    }));
  }

  // Correctness digest: fixed decision script (admit → saturate → deny →
  // window-expiry admit → isolation across scopes). Inputs use explicit nowMs.
  {
    rl.resetAiRateLimitStateForTests();
    const script: unknown[] = [];
    const actor = { actorType: 'student', actorId: 'digest-stu', schoolId: 'digest-sch', provider: 'openai', operation: 'digest' };
    for (let i = 0; i < 30; i++) {
      const d = rl.checkAiRateLimit({ ...actor, nowMs: T0 + i });
      script.push(d.allowed ? 1 : 0);
      if (d.allowed) rl.recordAiRateLimitUsage({ ...actor, nowMs: T0 + i });
    }
    script.push(rl.checkAiRateLimit({ ...actor, nowMs: T0 + 30 }).allowed ? 1 : 0); // 31st: denied
    script.push(rl.checkAiRateLimit({ ...actor, nowMs: T0 + WINDOW_MS + 1000 }).allowed ? 1 : 0); // expired: admitted
    script.push(rl.checkAiRateLimit({ actorType: 'student', actorId: 'other-stu', provider: 'openai', operation: 'digest', nowMs: T0 + 31 }).allowed ? 1 : 0); // isolation
    console.log(JSON.stringify({ target: 'rate-limit:correctness-digest', digest: digestOf(script), decisions: script }));
  }

  console.log(JSON.stringify({ target: 'rate-limit', env: envRecord(), decision: 'sweep complete' }));
}

// ════════════════════════════════════════════════════════════════════════
// TARGET: daily-feed — dedupe + priority sort pipeline
// ════════════════════════════════════════════════════════════════════════
async function runDailyFeed(): Promise<void> {
  const { Phase3DailyLearningFeedRankingService } = await import('../../src/services/phase3DailyLearningFeedRankingService');
  const svc = new Phase3DailyLearningFeedRankingService();

  const ITEM_TYPES = [
    'objective_check', 'objective_recheck', 'objective_rescue', 'teacher_support',
    'source_required', 'completed_today', 'continue_check', 'confidence_followup',
    'teach_back_required', 'transfer_check_required', 'delayed_recall_required', 'review_ready',
  ];
  const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

  function buildFixture(n: number, seed: number): Record<string, unknown>[] {
    const rand = mulberry32(seed);
    const uniqueObjectives = Math.max(1, Math.floor(n / 3));
    const items: Record<string, unknown>[] = [];
    for (let i = 0; i < n; i++) {
      const objIdx = Math.floor(rand() * uniqueObjectives);
      const type = ITEM_TYPES[Math.floor(rand() * ITEM_TYPES.length)];
      const priority = PRIORITIES[Math.floor(rand() * PRIORITIES.length)];
      const dueRoll = rand();
      const dueAt = dueRoll < 0.4
        ? new Date(Date.UTC(2026, 0, 1) + Math.floor(rand() * 300 * 86400000)).toISOString()
        : dueRoll < 0.7
          ? new Date(Date.UTC(2026, 5, 1) + Math.floor(rand() * 300 * 86400000)).toISOString()
          : undefined;
      items.push({
        itemId: `fi-${i}`,
        objectiveId: `obj-${objIdx}`,
        itemType: type,
        priority,
        dueAt,
        createdAt: new Date(Date.UTC(2026, 2, 1) + Math.floor(rand() * 100 * 86400000)).toISOString(),
      });
    }
    return items;
  }

  const SIZES: Array<{ n: number; size: string }> = [
    { n: 100, size: 'SMALL' },
    { n: 1000, size: 'REPRESENTATIVE' },
    { n: 10000, size: 'LARGE' },
    { n: 100000, size: 'STRESS' },
  ];

  const WARMUPS = 10;
  const SAMPLES = 30;

  for (const { n, size } of SIZES) {
    const fixture = buildFixture(n, 20260916);
    for (let w = 0; w < WARMUPS; w++) {
      svc.rankDailyLearningFeedItems(fixture as never[]);
    }
    const samples: number[] = [];
    let outLen = 0;
    const memBefore = memMB();
    for (let s = 0; s < SAMPLES; s++) {
      const t0 = performance.now();
      const out = svc.rankDailyLearningFeedItems(fixture as never[]);
      samples.push(performance.now() - t0);
      outLen = (out as unknown[]).length;
    }
    const memAfter = memMB();
    console.log(JSON.stringify({
      target: 'daily-feed:rank',
      size,
      cardinality: n,
      ...statsOf(samples),
      outputItems: outLen,
      heapDeltaMB: Number((memAfter - memBefore).toFixed(3)),
    }));
  }

  // Correctness digest over a fixed small fixture (duplicates, ties,
  // boundary dueAt, missing dueAt, unknown-type fallback via crafted item).
  {
    const edge = [
      { itemId: 'a', objectiveId: 'o1', itemType: 'review_ready', priority: 'low', createdAt: '2026-03-01T00:00:00.000Z' },
      { itemId: 'b', objectiveId: 'o1', itemType: 'teacher_support', priority: 'urgent', createdAt: '2026-03-02T00:00:00.000Z' },
      { itemId: 'c', objectiveId: 'o2', itemType: 'objective_check', priority: 'medium', dueAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z' },
      { itemId: 'd', objectiveId: 'o2', itemType: 'objective_check', priority: 'medium', dueAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-03-01T00:00:00.000Z' },
      { itemId: 'e', objectiveId: 'o3', itemType: 'review_ready', priority: 'low', createdAt: '2026-03-01T00:00:00.000Z' },
    ];
    const out = svc.rankDailyLearningFeedItems(edge as never[]) as Array<Record<string, unknown>>;
    console.log(JSON.stringify({
      target: 'daily-feed:correctness-digest',
      digest: digestOf(out.map((i) => [i.itemId, i.objectiveId, i.itemType, i.priority])),
      order: out.map((i) => i.itemId),
    }));
  }

  console.log(JSON.stringify({ target: 'daily-feed', env: envRecord(), decision: 'sweep complete' }));
}

// ── main ────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  if (target === 'rate-limit') await runRateLimit();
  else if (target === 'daily-feed') await runDailyFeed();
  else {
    console.error(`unknown target: ${target}`);
    process.exit(2);
  }
}

const t0 = performance.now();
main()
  .then(() => {
    console.log(JSON.stringify({ harness: 'r8-h-workload', target, totalMs: Number((performance.now() - t0).toFixed(0)) }));
  })
  .catch((err) => {
    console.error(JSON.stringify({ target, fatal: String(err).slice(0, 400) }));
    process.exit(1);
  });
