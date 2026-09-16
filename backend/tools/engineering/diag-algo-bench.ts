// DIAG campaign 2: direct production-path microbenchmarks for uncovered algorithms.
// - computeMediaStreamScore / getRecencyBoost / getStudySpacingBoost / getMediaSourceTrustBoost:
//   direct production exports from backend/src/media-stream/scoring.ts
// - sha256-slice16 fingerprint: node:crypto primitive equivalent (production fn is
//   module-private in artifactService.ts; labeled PRIMITIVE, not production path).
// Deterministic seeded fixtures. warmup + samples + p50/p95/min/max + heap delta +
// sha256 correctness digest. No providers, no DB, no network.
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';
import {
  getRecencyBoost,
  getStudySpacingBoost,
  getMediaSourceTrustBoost,
  getKindPreferenceBoost,
  normalizeTopicLike,
  parseNumericSignal,
} from '../../src/media-stream/scoring';

const SHA = process.env.DIAG_SHA || 'unknown';
const ENV = {
  os: process.platform + ' ' + (process.env.OS_BUILD || ''),
  node: process.version,
  cpuLogical: 0,
  ramGB: 0,
  sha: SHA,
  warmups: 10,
  samples: 30,
  database: 'none (in-memory synthetic only)',
};

// deterministic PRNG (mulberry32)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pct(arr: number[], p: number) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
function stats(samples: number[]) {
  return {
    samples: samples.length,
    p50Ms: +pct(samples, 50).toFixed(4),
    p95Ms: +pct(samples, 95).toFixed(4),
    minMs: +Math.min(...samples).toFixed(4),
    maxMs: +Math.max(...samples).toFixed(4),
  };
}
const memMB = () => process.memoryUsage().heapUsed / 1048576;
function digest(obj: unknown) {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

const TOPICS = ['algebra', 'photosynthesis', 'fractions', 'essay writing', 'trigonometry', 'cell biology'];
const KINDS = ['video', 'audio', 'document', 'explainer', 'collection', 'image'];
function makeAsset(r: () => number, i: number): any {
  return {
    topic: TOPICS[i % TOPICS.length],
    subject: 'maths',
    durationSec: Math.floor(r() * 1200),
    isCompleted: r() < 0.3,
    isHelpful: r() < 0.2,
    sourceTrust: ['verified', 'community', 'external', ''][Math.floor(r() * 4)],
    transcript: r() < 0.5 ? 'some transcript text' : '',
    transcriptSnippet: '',
    sourceUrl: r() < 0.4 ? 'https://example.com/v' : '',
    schoolLevel: 'secondary',
    language: 'en',
    bestUse: 'practice problems',
    nextMove: '',
    summary: 'a helpful summary',
    tags: ['exam', 'revision'],
    updatedAt: new Date(Date.now() - Math.floor(r() * 90) * 86400000).toISOString(),
    streamRankScore: Math.floor(r() * 60),
    recommendedScore: 0,
    revisionItemId: r() < 0.2 ? 'rev-1' : undefined,
    examRelevance: r() < 0.3 ? 'high' : '',
    videoProvider: r() < 0.3 ? 'youtube' : '',
    metadata: { clarityScore: r(), creativityScore: r(), intuitionScore: r(), noveltyScore: r() },
  };
}
const CTX: any = {
  activeTopic: 'algebra',
  weakTopics: ['fractions', 'trigonometry'],
  streamMode: 'study',
  schoolLevel: 'secondary',
  language: 'en',
  learningNeed: 'practice',
  examMode: true,
  focusMode: false,
  preferredKind: 'video',
};

function benchMediaSweep(cardinality: number) {
  // NOTE: the canonical computeMediaStreamScore/computeStudyStreamScore in
  // scoring.ts throw TypeError on every call (require('./metadata.js') has no
  // getMediaKindGroup export). This sweep therefore measures the working
  // exported micro-helpers that compose the per-asset cost, labeled COMPOSED.
  const r = rng(1234);
  const assets = Array.from({ length: cardinality }, (_, i) => makeAsset(r, i));
  const one = (a: any) =>
    getRecencyBoost(a.updatedAt) +
    getMediaSourceTrustBoost(a.sourceTrust, 'study') +
    getKindPreferenceBoost('video', undefined) +
    normalizeTopicLike(a.topic).length +
    parseNumericSignal(a.durationSec) +
    getStudySpacingBoost(a);
  for (let w = 0; w < ENV.warmups; w++) for (const a of assets) one(a);
  const before = memMB();
  const samples: number[] = [];
  let sink = 0;
  for (let s = 0; s < ENV.samples; s++) {
    const t0 = performance.now();
    for (const a of assets) sink += one(a);
    samples.push(performance.now() - t0);
  }
  const after = memMB();
  return { mode: 'COMPOSED-HELPERS (canonical scorer throws; see report)', ...stats(samples), heapDeltaMB: +(after - before).toFixed(3), sinkDigest: digest(sink) };
}

function benchMicro(fn: () => number, label: string) {
  for (let w = 0; w < 1000; w++) fn();
  const N = 20000;
  const t0 = performance.now();
  let sink = 0;
  for (let i = 0; i < N; i++) sink += fn();
  const total = performance.now() - t0;
  return { label, ops: N, perOpMicro: +((total / N) * 1000).toFixed(4), sinkDigest: digest(sink) };
}

function benchFingerprint(bytes: number) {
  const buf = Buffer.alloc(bytes, 'ab');
  for (let w = 0; w < ENV.warmups; w++) createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const samples: number[] = [];
  for (let s = 0; s < ENV.samples; s++) {
    const t0 = performance.now();
    createHash('sha256').update(buf).digest('hex').slice(0, 16);
    samples.push(performance.now() - t0);
  }
  return { bytes, ...stats(samples) };
}

const out: any = { harness: 'diag-algo-bench', env: ENV, results: {} };
for (const n of [100, 1000, 10000]) out.results['media-sweep-' + n] = benchMediaSweep(n);
const rr = rng(99);
out.results['micro-recency'] = benchMicro(() => getRecencyBoost(new Date(Date.now() - Math.floor(rr() * 90) * 86400000).toISOString()), 'recency');
out.results['micro-trust'] = benchMicro(() => getMediaSourceTrustBoost(['verified', 'community', 'external', ''][Math.floor(rr() * 4)], 'study'), 'trust');
out.results['micro-spacing'] = benchMicro(() => getStudySpacingBoost({ revisionItemId: 'x', updatedAt: new Date().toISOString() } as any), 'spacing');
for (const b of [1024, 102400, 1048576]) out.results['fingerprint-' + b + 'B'] = benchFingerprint(b);
console.log(JSON.stringify(out));
