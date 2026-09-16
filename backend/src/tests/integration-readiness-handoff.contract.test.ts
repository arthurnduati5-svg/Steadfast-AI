// BACKEND-INTEGRATION-READINESS-HANDOFF — deterministic integration contract proof.
//
// Covers representative external contracts through REAL production paths:
// mounted Express routers, real schoolAuthMiddleware, real
// requireVerifiedSchoolContext, real validators/services, deterministic
// in-memory repository doubles. No live provider, no live school system,
// no live email/SMS/push, no real AI invocation. Synthetic identifiers only.
//
// Integration contract baseline SHA: b9ed75960f33fd99af39687e4183818ca5c509a9
// Handoff contract version: 1

import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import healthRoutes from '../routes/health';
import { createLearningEvidenceRouter } from '../domains/learning-evidence/routes/learningEvidenceRoutes';
import { InMemoryLearningEvidenceEventStoreRepository } from '../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';
import { EVIDENCE_ERROR_CODES } from '../domains/learning-evidence/contracts/learningEvidenceCommandContracts';
import { ProviderHealthService } from '../services/aiGateway/providerHealthService';
import { DisabledLiveSchoolSystemAdapter } from '../services/disabledLiveSchoolSystemAdapter';
import { getDefaultSchoolProviderMode } from '../contracts/schoolSystemBridgeContracts';

vi.mock('../services/task019AbuseDetectionService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/task019AbuseDetectionService')>();
  return {
    ...actual,
    checkAbuse: vi.fn(async () => ({
      isAbusive: true,
      cooldownRemainingMs: 5000,
      confidence: 1,
      recommendedAction: 'block',
    })),
  };
});

process.env.JWT_SECRET ??= 'steadfast-integration-readiness-handoff-test-secret';

type AuthMod = typeof import('../middleware/schoolAuthMiddleware');
type GuardMod = typeof import('../middleware/schoolContextGuardMiddleware');
type RateLimitMod = typeof import('../middleware/task019RateLimitMiddleware');

let schoolAuthMiddleware: AuthMod['schoolAuthMiddleware'];
let requireVerifiedSchoolContext: GuardMod['requireVerifiedSchoolContext'];
let checkRateLimit: RateLimitMod['checkRateLimit'];
let getRateLimitOptions: RateLimitMod['getRateLimitOptions'];
let configureRouteRateLimit: RateLimitMod['configureRouteRateLimit'];

const TEST_JWT_SECRET = String(process.env.JWT_SECRET);

function signJwt(claims: Record<string, unknown>): string {
  return jwt.sign(claims, TEST_JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

const STUDENT_A = { userId: 'learner-a1', schoolId: 'school-a', role: 'student' };
const STUDENT_B = { userId: 'learner-b1', schoolId: 'school-b', role: 'student' };
const TEACHER_A = { userId: 'teacher-a1', schoolId: 'school-a', role: 'teacher' };
const ADMIN_A = { userId: 'admin-a1', schoolId: 'school-a', role: 'school_admin' };

function candidateBody(learnerId: string, schoolId: string, idempotencyKey: string) {
  return {
    learnerId,
    sourceLineage: {
      sourceType: 'tutor_attempt',
      sourceRecordId: 'rec-1',
      sourceVersion: '1.0',
      schoolId,
      learnerId,
      occurredAt: '2026-09-16T00:00:00.000Z',
      outcome: 'correct',
      integrityState: 'clear',
      finalizationState: 'not_applicable',
      policyVersion: '1.0',
    },
    safePayload: {
      outcome: 'correct',
      independence: 'independent',
      evidenceMode: 'recall',
      confidenceState: 'high',
      integrityState: 'clear',
      finalizationState: 'not_applicable',
      sourceVersion: '1.0',
      eligibilityReasonCodes: [],
    },
    idempotencyKey,
  };
}

async function fetchJson(
  app: express.Express,
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  const server = await new Promise<{ address: () => unknown; close: (cb: () => void) => void }>(
    (resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s as unknown as { address: () => unknown; close: (cb: () => void) => void }));
    },
  );
  const addr = server.address() as { port: number };
  try {
    const res = await fetch(`http://127.0.0.1:${addr.port}${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(headers || {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    return { status: res.status, body: parsed };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function buildEvidenceApp(repo: InMemoryLearningEvidenceEventStoreRepository): express.Express {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/copilot/evidence',
    schoolAuthMiddleware,
    requireVerifiedSchoolContext,
    createLearningEvidenceRouter(repo),
  );
  return app;
}

function errorCodeOf(res: { status: number; body: unknown }): string {
  const b = res.body as { error?: { code?: string }; code?: string; errorCode?: string };
  return b?.error?.code || b?.code || b?.errorCode || '';
}

beforeAll(async () => {
  const auth = await import('../middleware/schoolAuthMiddleware');
  const guard = await import('../middleware/schoolContextGuardMiddleware');
  const rate = await import('../middleware/task019RateLimitMiddleware');
  schoolAuthMiddleware = auth.schoolAuthMiddleware;
  requireVerifiedSchoolContext = guard.requireVerifiedSchoolContext;
  checkRateLimit = rate.checkRateLimit;
  getRateLimitOptions = rate.getRateLimitOptions;
  configureRouteRateLimit = rate.configureRouteRateLimit;
});

describe('integration handoff: public health contract (real router, no auth)', () => {
  it('GET /live returns 200 with live status', async () => {
    const app = express();
    app.use('/api/health', healthRoutes);
    const res = await fetchJson(app, 'GET', '/api/health/live');
    expect(res.status).toBe(200);
    const body = res.body as { ok?: boolean; status?: string };
    expect(body.ok).toBe(true);
    expect(body.status).toBe('live');
  });

  it('GET /ready returns a deterministic readiness verdict (200 or 503 with ok boolean)', async () => {
    const app = express();
    app.use('/api/health', healthRoutes);
    const res = await fetchJson(app, 'GET', '/api/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(typeof (res.body as { ok?: unknown }).ok).toBe('boolean');
  });
});

describe('integration handoff: authentication provenance (real schoolAuthMiddleware)', () => {
  function probeApp(capture: { user?: unknown; schoolId?: unknown; body?: unknown }) {
    const app = express();
    app.use(express.json());
    app.use(schoolAuthMiddleware, (req: Request, res: Response) => {
      capture.user = req.user;
      capture.schoolId = (req as unknown as { schoolId?: unknown }).schoolId;
      capture.body = req.body;
      res.status(200).json({ ok: true });
    });
    return app;
  }

  it('missing token is rejected 401 without touching downstream', async () => {
    const capture: { user?: unknown } = {};
    const res = await fetchJson(probeApp(capture), 'GET', '/probe');
    expect(res.status).toBe(401);
    expect((res.body as { success?: boolean }).success).toBe(false);
    expect(capture.user).toBeUndefined();
  });

  it('malformed and forged tokens are rejected 401', async () => {
    const capture: { user?: unknown } = {};
    const app = probeApp(capture);
    const badScheme = await fetchJson(app, 'GET', '/probe', undefined, { authorization: 'Token abc' });
    expect(badScheme.status).toBe(401);
    const forged = await fetchJson(app, 'GET', '/probe', undefined, {
      authorization: `Bearer ${jwt.sign({ userId: 'x', schoolId: 'school-a' }, 'wrong-secret')}`,
    });
    expect(forged.status).toBe(401);
    expect(capture.user).toBeUndefined();
  });

  it('valid JWT establishes verified identity; body schoolId is NOT authoritative', async () => {
    const capture: { user?: unknown; schoolId?: unknown } = {};
    const token = signJwt(STUDENT_A);
    const res = await fetchJson(
      probeApp(capture),
      'POST',
      '/probe',
      { schoolId: 'school-spoofed', learnerId: 'someone-else' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(200);
    expect(capture.user).toMatchObject({ id: 'learner-a1', schoolId: 'school-a', role: 'student' });
    expect(capture.schoolId).toBe('school-a');
  });
});

describe('integration handoff: verified school context (real requireVerifiedSchoolContext)', () => {
  function guardApp() {
    const app = express();
    app.use(express.json());
    app.use(schoolAuthMiddleware, requireVerifiedSchoolContext, (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });
    return app;
  }

  it('authenticated request without school scope is rejected 401 SCHOOL_CONTEXT_REQUIRED', async () => {
    const app = express();
    app.use(express.json());
    app.use(
      (req: Request, _res: Response, next: NextFunction) => {
        req.user = { id: 'lonely-user' };
        next();
      },
      requireVerifiedSchoolContext,
      (_req: Request, res: Response) => {
        res.status(200).json({ ok: true });
      },
    );
    const res = await fetchJson(app, 'GET', '/guarded');
    expect(res.status).toBe(401);
    expect(errorCodeOf(res)).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('verified student context passes and stamps verified identity', async () => {
    const res = await fetchJson(guardApp(), 'GET', '/guarded', undefined, {
      authorization: `Bearer ${signJwt(STUDENT_A)}`,
    });
    expect(res.status).toBe(200);
  });

  it('unknown role fails closed 403 SCHOOL_CONTEXT_INVALID', async () => {
    const res = await fetchJson(guardApp(), 'GET', '/guarded', undefined, {
      authorization: `Bearer ${signJwt({ userId: 'u1', schoolId: 'school-a', role: 'not-a-real-role' })}`,
    });
    expect(res.status).toBe(403);
    expect(errorCodeOf(res)).toBe('SCHOOL_CONTEXT_INVALID');
  });
});

describe('integration handoff: learning evidence family (real chain + deterministic store)', () => {
  it('protected endpoint without token is 401 before any domain work', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', candidateBody('learner-a1', 'school-a', 'k-noauth'));
    expect(res.status).toBe(401);
  });

  it('validation failure returns 400 VALIDATION_ERROR (no false 2xx)', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', { learnerId: 'learner-a1' }, {
      authorization: `Bearer ${signJwt(STUDENT_A)}`,
    });
    expect(res.status).toBe(400);
    expect(errorCodeOf(res)).toBe('VALIDATION_ERROR');
  });

  it('durable mutation returns 201 and is visible on the read contract', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const headers = { authorization: `Bearer ${signJwt(STUDENT_A)}` };
    const create = await fetchJson(
      app,
      'POST',
      '/api/copilot/evidence/candidates',
      candidateBody('learner-a1', 'school-a', 'k-durable-1'),
      headers,
    );
    expect(create.status).toBe(201);
    const created = (create.body as { ok?: boolean; data?: { evidenceCandidateId?: string } });
    expect(created.ok).toBe(true);
    expect(typeof created.data?.evidenceCandidateId).toBe('string');

    const list = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence', undefined, headers);
    expect(list.status).toBe(200);
    const listed = (list.body as { ok?: boolean; data?: unknown[] }).data || [];
    expect(listed.length).toBeGreaterThan(0);
  });

  it('same idempotency key with identical request replays the same candidate', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const headers = { authorization: `Bearer ${signJwt(STUDENT_A)}` };
    const body = candidateBody('learner-a1', 'school-a', 'k-replay-1');
    const first = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', body, headers);
    const second = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', body, headers);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect((second.body as { data?: { evidenceCandidateId?: string } }).data?.evidenceCandidateId).toBe(
      (first.body as { data?: { evidenceCandidateId?: string } }).data?.evidenceCandidateId,
    );
  });

  it('same idempotency key with changed request is a conflict (stable code, never false 2xx)', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const headers = { authorization: `Bearer ${signJwt(STUDENT_A)}` };
    const first = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', candidateBody('learner-a1', 'school-a', 'k-conflict-1'), headers);
    expect(first.status).toBe(201);
    const changed = candidateBody('learner-a1', 'school-a', 'k-conflict-1');
    changed.safePayload.confidenceState = 'low';
    const second = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', changed, headers);
    expect(second.status).toBe(400);
    expect(errorCodeOf(second)).toBe(EVIDENCE_ERROR_CODES.IDEMPOTENCY_CONFLICT);
  });

  // Contract truth (verified against learningEvidenceCommandService.ts:206 and
  // learningEvidenceRoutes.ts:57-67): on POST /candidates the actor learnerId
  // echoes the body learnerId, so the student/self comparison is satisfied by
  // construction; school scoping and role allow-lists ARE verified-enforced.
  // Teacher cross-learner writes within the verified school are permitted.
  it('teacher may create evidence for a learner in the verified school (201)', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const res = await fetchJson(
      app,
      'POST',
      '/api/copilot/evidence/candidates',
      candidateBody('learner-a1', 'school-a', 'k-teacher-write-1'),
      { authorization: `Bearer ${signJwt(TEACHER_A)}` },
    );
    expect(res.status).toBe(201);
    expect((res.body as { ok?: boolean }).ok).toBe(true);
  });

  it('cross-school read is school-scoped: school B sees empty, never school A rows', async () => {
    const repo = new InMemoryLearningEvidenceEventStoreRepository();
    const app = buildEvidenceApp(repo);
    const create = await fetchJson(
      app,
      'POST',
      '/api/copilot/evidence/candidates',
      candidateBody('learner-a1', 'school-a', 'k-xschool-1'),
      { authorization: `Bearer ${signJwt(STUDENT_A)}` },
    );
    expect(create.status).toBe(201);

    const foreign = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence', undefined, {
      authorization: `Bearer ${signJwt(STUDENT_B)}`,
    });
    expect(foreign.status).toBe(200);
    expect((foreign.body as { data?: unknown[] }).data).toEqual([]);
  });

  it('caller-supplied school headers/body do not override verified school scope', async () => {
    const repo = new InMemoryLearningEvidenceEventStoreRepository();
    const app = buildEvidenceApp(repo);
    const spoofed = candidateBody('learner-a1', 'school-b', 'k-spoof-1');
    (spoofed as Record<string, unknown>).schoolId = 'school-b';
    const create = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', spoofed, {
      authorization: `Bearer ${signJwt(STUDENT_A)}`,
      'x-school-id': 'school-b',
      'x-actor-id': 'intruder',
      'x-actor-role': 'school_admin',
    });
    expect(create.status).toBe(201);

    const ownScope = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence', undefined, {
      authorization: `Bearer ${signJwt(STUDENT_A)}`,
    });
    expect(((ownScope.body as { data?: unknown[] }).data || []).length).toBeGreaterThan(0);

    const foreignScope = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence', undefined, {
      authorization: `Bearer ${signJwt(STUDENT_B)}`,
    });
    expect((foreignScope.body as { data?: unknown[] }).data).toEqual([]);
  });

  it('unknown evidence id returns 404 (no false 2xx)', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const res = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence/does-not-exist', undefined, {
      authorization: `Bearer ${signJwt(TEACHER_A)}`,
    });
    expect(res.status).toBe(404);
    expect(errorCodeOf(res)).toBe('EVIDENCE_NOT_FOUND');
  });

  it('internal operations are role-gated: student 403, school_admin allowed', async () => {
    const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
    const denied = await fetchJson(app, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'learner-a1' }, {
      authorization: `Bearer ${signJwt(STUDENT_A)}`,
    });
    expect(denied.status).toBe(403);
    expect(errorCodeOf(denied)).toBe('EVIDENCE_ROLE_FORBIDDEN');

    const allowed = await fetchJson(app, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'learner-a1' }, {
      authorization: `Bearer ${signJwt(ADMIN_A)}`,
    });
    expect(allowed.status).toBe(201);
  });
});

describe('integration handoff: rate-limit contract (real decision function)', () => {
  it('public health paths are exempt from route rate limiting', () => {
    const opts = getRateLimitOptions('/api/health/live');
    expect(opts.useBackpressure).toBe(false);
    expect(opts.useAbuseDetection).toBe(false);
    expect(opts.useQuotas).toBe(false);
    expect(opts.useMultiTenant).toBe(false);
  });

  it('abusive caller receives deterministic 429 with Retry-After semantics', async () => {
    configureRouteRateLimit('/handoff-abuse-probe', { useBackpressure: false, useAbuseDetection: true, useQuotas: false, useMultiTenant: false });
    const req = {
      method: 'POST',
      path: '/handoff-abuse-probe',
      route: { path: '/handoff-abuse-probe' },
      user: { id: 'learner-a1' },
    } as unknown as Request;
    const res = {} as Response;
    const result = await checkRateLimit(req, res);
    expect(result.passed).toBe(false);
    expect(result.statusCode).toBe(429);
    expect(result.headers['Retry-After']).toBe(5);
    expect(result.retryAfterMs).toBe(5000);
    expect((result.body as { retryAfterSec?: number }).retryAfterSec).toBe(5);
  });
});

describe('integration handoff: external ports stay mock/disabled (no live activation)', () => {
  it('governed model port resolves to the deterministic mock adapter by default', async () => {
    const health = new ProviderHealthService();
    const adapter = health.getAdapter('mock-provider');
    expect(adapter).toBeDefined();
    expect(await adapter!.getStatus()).toBe('available');
    const result = await adapter!.generate({
      requestId: 'handoff-probe-1',
      providerId: 'mock-provider',
      modelId: 'mock-model-v1',
      prompt: 'synthetic probe prompt',
      generationMode: 'socratic_tutoring',
    });
    expect(result.ok).toBe(true);
    expect(typeof result.text).toBe('string');
  });

  it('default school provider mode is mock_only and the live adapter returns empty shells', () => {
    expect(getDefaultSchoolProviderMode()).toBe('mock_only');
    const disabled = new DisabledLiveSchoolSystemAdapter();
    expect(disabled.mode).toBe('disabled_live');
    const roster = disabled.fetchRoster('school-a');
    expect(roster.students).toEqual([]);
    const identity = disabled.fetchVerifiedIdentity('user-1', 'school-a');
    expect(identity.role).toBe('unknown');
  });

  it('contract proof performs zero external network calls (loopback-only fetch)', async () => {
    const seen: string[] = [];
    const originalFetch = globalThis.fetch;
    const guard = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url);
      seen.push(url);
      if (!url.startsWith('http://127.0.0.1:')) {
        throw new Error(`live network call blocked in contract proof: ${url}`);
      }
      return originalFetch(input as RequestInfo, init);
    };
    vi.spyOn(globalThis, 'fetch').mockImplementation(guard as typeof fetch);
    try {
      const app = buildEvidenceApp(new InMemoryLearningEvidenceEventStoreRepository());
      const headers = { authorization: `Bearer ${signJwt(STUDENT_A)}` };
      const create = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', candidateBody('learner-a1', 'school-a', 'k-offline-1'), headers);
      expect(create.status).toBe(201);
      const list = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-a1/evidence', undefined, headers);
      expect(list.status).toBe(200);
    } finally {
      vi.restoreAllMocks();
    }
    expect(seen.length).toBeGreaterThan(0);
    for (const url of seen) {
      expect(url.startsWith('http://127.0.0.1:')).toBe(true);
    }
  });
});
