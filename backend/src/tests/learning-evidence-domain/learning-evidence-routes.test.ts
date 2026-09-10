import { describe, it, expect, beforeEach } from 'vitest';
import express, { Request, Response, NextFunction } from 'express';
import { createLearningEvidenceRouter } from '../../domains/learning-evidence/routes/learningEvidenceRoutes';
import { InMemoryLearningEvidenceEventStoreRepository } from '../../domains/learning-evidence/repositories/inMemoryLearningEvidenceEventStoreRepository';

// Test-only stand-in for the verified server-side context that
// schoolAuthMiddleware + requireVerifiedSchoolContext establish in production.
// This mirrors the production identity shape (req.user.id, req.user.role,
// req.schoolId) without introducing a second auth framework.
function setVerifiedIdentity(
  verified: { id: string; role: string; schoolId: string },
): (req: Request, _res: Response, next: NextFunction) => void {
  return (req, _res, next) => {
    (req as any).user = {
      id: verified.id,
      role: verified.role,
      schoolId: verified.schoolId,
    };
    (req as any).schoolId = verified.schoolId;
    next();
  };
}

function createApp(
  repo: InMemoryLearningEvidenceEventStoreRepository = new InMemoryLearningEvidenceEventStoreRepository(),
  verified?: { id: string; role: string; schoolId: string },
) {
  const app = express();
  app.use(express.json());
  const mount: Parameters<typeof app.use> = ['/api/copilot/evidence'];
  if (verified) {
    mount.push(setVerifiedIdentity(verified));
  }
  mount.push(createLearningEvidenceRouter(repo));
  // @ts-expect-error variadic mount composition
  app.use(...mount);
  return app;
}

const VERIFIED_STUDENT = { id: 'learner-1', role: 'student', schoolId: 'school-1' };
const VERIFIED_TEACHER = { id: 'teacher-1', role: 'teacher', schoolId: 'school-1' };
const VERIFIED_SCHOOL_ADMIN = { id: 'admin-1', role: 'school_admin', schoolId: 'school-1' };
const VERIFIED_INTERNAL_OPERATOR = { id: 'operator-1', role: 'internal_operator', schoolId: 'school-1' };

function validCandidateBody(learnerId: string) {
  return {
    learnerId,
    sourceLineage: { sourceType: 'tutor_attempt', sourceRecordId: 'r1', sourceVersion: '1.0', schoolId: 'school-1', learnerId, occurredAt: new Date().toISOString(), outcome: 'correct', integrityState: 'clear', finalizationState: 'not_applicable', policyVersion: '1.0' },
    safePayload: { outcome: 'correct', independence: 'independent', evidenceMode: 'recall', confidenceState: 'high', integrityState: 'clear', finalizationState: 'not_applicable', sourceVersion: '1.0', eligibilityReasonCodes: [] },
    idempotencyKey: `idem-${learnerId}-${Date.now()}`,
  };
}

async function fetchJson(app: express.Express, method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; body: any }> {
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const addr = server.address() as any;
  const base = `http://127.0.0.1:${addr.port}`;
  try {
    const opts: RequestInit = { method, headers: { ...headers } };
    if (body && method !== 'GET') {
      opts.headers = { ...opts.headers, 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(`${base}${path}`, opts);
    const text = await res.text();
    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return { status: res.status, body: parsed };
  } finally {
    server.close();
  }
}

describe('Learning Evidence Routes', () => {
  let repo: InMemoryLearningEvidenceEventStoreRepository;
  let app: express.Express;

  beforeEach(() => {
    repo = new InMemoryLearningEvidenceEventStoreRepository();
    app = createApp(repo, VERIFIED_STUDENT);
  });

  it('POST /candidates returns 400 without verified school context', async () => {
    const unauthenticated = createApp(repo);
    const res = await fetchJson(unauthenticated, 'POST', '/api/copilot/evidence/candidates', {});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /candidates returns 400 with missing fields', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', {});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('POST /candidates returns 201 with valid data', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', validCandidateBody('learner-route-1'));
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.evidenceCandidateId).toBeDefined();
  });

  it('GET /learners/:id/evidence returns 200 for verified teacher', async () => {
    const teacherApp = createApp(repo, VERIFIED_TEACHER);
    await fetchJson(teacherApp, 'POST', '/api/copilot/evidence/candidates', validCandidateBody('learner-route-2'));
    const res = await fetchJson(teacherApp, 'GET', '/api/copilot/evidence/learners/learner-route-2/evidence');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /learners/:id/evidence returns 200 for verified student on own evidence', async () => {
    await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', validCandidateBody('learner-route-2'));
    const res = await fetchJson(app, 'GET', '/api/copilot/evidence/learners/learner-route-2/evidence');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /internal/streams/:id/integrity returns 200 for verified school_admin', async () => {
    const adminApp = createApp(repo, VERIFIED_SCHOOL_ADMIN);
    const res = await fetchJson(adminApp, 'GET', '/api/copilot/evidence/internal/streams/learner-x/integrity');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /internal/seeds returns 201 for verified school_admin', async () => {
    const adminApp = createApp(repo, VERIFIED_SCHOOL_ADMIN);
    const res = await fetchJson(adminApp, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'seed-route' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  // --- R8-SEC-01 continuation proofs ---

  it('P1: incomplete verified actor context fails closed (missing role)', async () => {
    const incompleteApp = createApp(repo, { id: 'learner-1', role: '', schoolId: 'school-1' });
    const res = await fetchJson(incompleteApp, 'POST', '/api/copilot/evidence/candidates', validCandidateBody('learner-1'));
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('EVIDENCE_SCHOOL_CONTEXT_REQUIRED');
    // No domain mutation occurred.
    const events = await repo.getEventsForLearner('school-1', 'learner-1');
    expect(events).toHaveLength(0);
  });

  it('P2: verified student is denied all internal administrative endpoints', async () => {
    const rebuild = await fetchJson(app, 'POST', '/api/copilot/evidence/internal/projections/rebuild', { learnerId: 'learner-1' });
    expect(rebuild.status).toBe(403);
    expect(rebuild.body.error.code).toBe('EVIDENCE_ROLE_FORBIDDEN');

    const integrity = await fetchJson(app, 'GET', '/api/copilot/evidence/internal/streams/learner-1/integrity');
    expect(integrity.status).toBe(403);
    expect(integrity.body.error.code).toBe('EVIDENCE_ROLE_FORBIDDEN');

    const seeds = await fetchJson(app, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'learner-1' });
    expect(seeds.status).toBe(403);
    expect(seeds.body.error.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
  });

  it('P2b: verified teacher is denied internal administrative endpoints', async () => {
    const teacherApp = createApp(repo, VERIFIED_TEACHER);
    const rebuild = await fetchJson(teacherApp, 'POST', '/api/copilot/evidence/internal/projections/rebuild', { learnerId: 'learner-1' });
    expect(rebuild.status).toBe(403);
    expect(rebuild.body.error.code).toBe('EVIDENCE_ROLE_FORBIDDEN');

    const integrity = await fetchJson(teacherApp, 'GET', '/api/copilot/evidence/internal/streams/learner-1/integrity');
    expect(integrity.status).toBe(403);

    const seeds = await fetchJson(teacherApp, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'learner-1' });
    expect(seeds.status).toBe(403);
  });

  it('P3: verified school_admin succeeds on all internal endpoints', async () => {
    const adminApp = createApp(repo, VERIFIED_SCHOOL_ADMIN);
    const rebuild = await fetchJson(adminApp, 'POST', '/api/copilot/evidence/internal/projections/rebuild', { learnerId: 'learner-1' });
    expect(rebuild.status).toBe(200);
    expect(rebuild.body.ok).toBe(true);

    const integrity = await fetchJson(adminApp, 'GET', '/api/copilot/evidence/internal/streams/learner-1/integrity');
    expect(integrity.status).toBe(200);
    expect(integrity.body.ok).toBe(true);

    const seeds = await fetchJson(adminApp, 'POST', '/api/copilot/evidence/internal/seeds', { learnerId: 'learner-1' });
    expect(seeds.status).toBe(201);
    expect(seeds.body.ok).toBe(true);
  });

  it('P3b: verified internal_operator is allowed on internal endpoints', async () => {
    const opApp = createApp(repo, VERIFIED_INTERNAL_OPERATOR);
    const integrity = await fetchJson(opApp, 'GET', '/api/copilot/evidence/internal/streams/learner-1/integrity');
    expect(integrity.status).toBe(200);
    expect(integrity.body.ok).toBe(true);
  });

  // --- R8-SEC-01 regression proofs ---

  it('Proof A: spoofed identity headers are ignored — authoritative context remains verified identity', async () => {
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates', validCandidateBody('learner-1'), {
      'x-school-id': 'school-evil',
      'x-actor-id': 'attacker-id',
      'x-actor-role': 'internal_operator',
      'x-request-id': 'req-spoof-proof',
      'x-correlation-id': 'corr-spoof-proof',
    });

    // Command must succeed under the VERIFIED student identity, not the spoofed one.
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    const evidenceCandidateId: string = res.body.data.evidenceCandidateId;
    expect(evidenceCandidateId).toBeDefined();

    // Event ledger records the verified actor/school, not the spoofed headers.
    const events = await repo.getEventsForLearner('school-1', 'learner-1');
    expect(events.length).toBeGreaterThan(0);
    const created = events.find((e: any) => e.eventType === 'EVIDENCE_CANDIDATE_CREATED' && e.evidenceCandidateId === evidenceCandidateId);
    expect(created).toBeDefined();
    expect(created.schoolId).toBe('school-1');
    expect(created.actorId).toBe('learner-1');
    expect(created.actorRole).toBe('student');

    // Nothing was written under the spoofed school scope.
    const evilEvents = await repo.getEventsForLearner('school-evil', 'learner-1');
    expect(evilEvents).toHaveLength(0);
  });

  it('Proof B: verified student cannot escalate via x-actor-role to a restricted command', async () => {
    // StartEvidenceValidation is restricted by LearningEvidenceCommandService to
    // teacher / school_admin / internal_operator.
    const res = await fetchJson(app, 'POST', '/api/copilot/evidence/candidates/cand-1/validate', {}, {
      'x-actor-role': 'internal_operator',
      'x-request-id': 'req-role-proof',
      'x-correlation-id': 'corr-role-proof',
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe('EVIDENCE_ROLE_FORBIDDEN');
    // Rejection is based on the verified student role; no spoofed role was honored.
    expect(res.body.error.message).toBe('Only teachers or admins can validate evidence');
  });
});
