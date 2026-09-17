/**
 * P0-1 — Verified assessment identity & school-scope closure.
 *
 * Proves that protected assessment HTTP commands derive authoritative
 * actor/school identity exclusively from req.verifiedSchoolIdentity
 * (schoolAuthMiddleware + requireVerifiedSchoolContext) and never from
 * caller-controlled headers/body fields.
 *
 * Synthetic identifiers only (school-a/school-b/teacher-a/student-a).
 * No PII, no live provider, no production DB.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Test-only JWT secret. Set BEFORE the auth middleware module is imported,
// because the middleware captures configured secrets at module load time.
const TEST_JWT_SECRET = 'p0-1-synthetic-test-secret-only';

type LoadedModules = {
  schoolAuthMiddleware: (req: any, res: any, next: any) => unknown;
  requireVerifiedSchoolContext: (req: any, res: any, next: any) => void;
  questionBankRoutes: any;
  examBlueprintRoutes: any;
  extractVerifiedAssessmentActorContext: (req: any) => any;
  AssessmentPolicyRegistry: any;
  AssessmentIdempotencyService: any;
  AssessmentAuditService: any;
  InMemoryIdempotencyRepository: any;
  InMemoryAuditWriter: any;
  GovernedQuestionCommandService: any;
  QuestionApprovalService: any;
  InMemoryQuestionBankItemRepository: any;
  InMemoryQuestionVersionRepository: any;
  InMemoryQuestionPartVersionRepository: any;
  InMemoryQuestionAssetVersionRepository: any;
  InMemoryAnswerKeyVersionRepository: any;
  InMemoryRubricVersionRepository: any;
  InMemoryQuestionObjectiveMappingRepository: any;
  InMemoryQuestionSourceRecordRepository: any;
  InMemoryQuestionGovernanceRepository: any;
  InMemoryQuestionApprovalRequestRepository: any;
  InMemoryQuestionApprovalRecordRepository: any;
};

let mods: LoadedModules;
let app: express.Express;

function signJwt(params: { userId: string; schoolId?: string; role?: string }): string {
  const payload: Record<string, string> = { userId: params.userId };
  if (params.schoolId !== undefined) payload['schoolId'] = params.schoolId;
  if (params.role !== undefined) payload['role'] = params.role;
  return jwt.sign(payload, TEST_JWT_SECRET);
}

function fakeVerifiedReq(verified: {
  schoolId: string;
  externalUserId: string;
  role: string;
  classId?: string;
  subjectId?: string;
}): any {
  return {
    verifiedSchoolIdentity: {
      verified: true as const,
      schoolId: verified.schoolId,
      externalUserId: verified.externalUserId,
      role: verified.role,
      classId: verified.classId,
      subjectId: verified.subjectId,
      scope: {
        schoolId: verified.schoolId,
        classIds: [],
        subjectIds: [],
        teacherAssignmentIds: [],
        enrollmentStatus: 'active' as const,
      },
      reasonCodes: ['school_context_verified'],
      privacyMetadata: {},
    },
    headers: {},
    body: {},
    query: {},
  };
}

const DRAFT_BODY = {
  subjectId: 'subject-a',
  topicId: 'topic-a',
  skillId: 'skill-a',
  curriculumVersionId: 'cv-a',
  primaryObjectiveId: 'obj-a',
};

const BLUEPRINT_BODY = {
  title: 'Synthetic blueprint',
  subjectId: 'subject-a',
  curriculumVersionId: 'cv-a',
};

beforeAll(async () => {
  process.env['JWT_SECRET'] = TEST_JWT_SECRET;

  const auth = await import('../middleware/schoolAuthMiddleware');
  const guard = await import('../middleware/schoolContextGuardMiddleware');
  const qb = await import('../routes/questionBank');
  const eb = await import('../routes/examBlueprint');
  const adapter = await import(
    '../domains/assessment/question-bank/services/extractVerifiedAssessmentActorContext'
  );
  const { AssessmentPolicyRegistry } = await import(
    '../domains/assessment/policies/assessmentPolicyRegistry'
  );
  const { AssessmentIdempotencyService } = await import(
    '../domains/assessment/idempotency/assessmentIdempotencyService'
  );
  const { AssessmentAuditService } = await import(
    '../domains/assessment/audit/assessmentAuditService'
  );
  const { InMemoryIdempotencyRepository, InMemoryAuditWriter } = await import(
    '../domains/assessment/repositories/inMemoryAssessmentRepositories'
  );
  const { GovernedQuestionCommandService } = await import(
    '../domains/assessment/question-bank/services/governedQuestionCommandService'
  );
  const { QuestionApprovalService } = await import(
    '../domains/assessment/question-bank/services/questionApprovalService'
  );
  const repos = await import(
    '../domains/assessment/question-bank/repositories/inMemoryQuestionBankRepositories'
  );

  mods = {
    schoolAuthMiddleware: auth.schoolAuthMiddleware,
    requireVerifiedSchoolContext: guard.requireVerifiedSchoolContext,
    questionBankRoutes: qb.default,
    examBlueprintRoutes: eb.default,
    extractVerifiedAssessmentActorContext: adapter.extractVerifiedAssessmentActorContext,
    AssessmentPolicyRegistry,
    AssessmentIdempotencyService,
    AssessmentAuditService,
    InMemoryIdempotencyRepository,
    InMemoryAuditWriter,
    GovernedQuestionCommandService,
    QuestionApprovalService,
    InMemoryQuestionBankItemRepository: repos.InMemoryQuestionBankItemRepository,
    InMemoryQuestionVersionRepository: repos.InMemoryQuestionVersionRepository,
    InMemoryQuestionPartVersionRepository: repos.InMemoryQuestionPartVersionRepository,
    InMemoryQuestionAssetVersionRepository: repos.InMemoryQuestionAssetVersionRepository,
    InMemoryAnswerKeyVersionRepository: repos.InMemoryAnswerKeyVersionRepository,
    InMemoryRubricVersionRepository: repos.InMemoryRubricVersionRepository,
    InMemoryQuestionObjectiveMappingRepository:
      repos.InMemoryQuestionObjectiveMappingRepository,
    InMemoryQuestionSourceRecordRepository: repos.InMemoryQuestionSourceRecordRepository,
    InMemoryQuestionGovernanceRepository: repos.InMemoryQuestionGovernanceRepository,
    InMemoryQuestionApprovalRequestRepository:
      repos.InMemoryQuestionApprovalRequestRepository,
    InMemoryQuestionApprovalRecordRepository:
      repos.InMemoryQuestionApprovalRecordRepository,
  };

  // Mirror the production mount boundary from backend/src/index.ts:
  // schoolAuthMiddleware → requireVerifiedSchoolContext → assessment router.
  const composed = express();
  composed.use(express.json());
  composed.use(
    '/api/question-bank',
    mods.schoolAuthMiddleware as any,
    mods.requireVerifiedSchoolContext as any,
    mods.questionBankRoutes,
  );
  composed.use(
    '/api/question-bank',
    mods.schoolAuthMiddleware as any,
    mods.requireVerifiedSchoolContext as any,
    mods.examBlueprintRoutes,
  );
  app = composed;
});

describe('P0-1 assessment verified identity', () => {
  // A. Missing authentication → denied.
  it('A: rejects requests with no JWT', async () => {
    const res = await request(app)
      .post('/api/question-bank/drafts')
      .set('x-idempotency-key', 'p01-a-key')
      .send(DRAFT_BODY);
    expect(res.status).toBe(401);
  });

  // B. Authenticated but missing valid school context → denied.
  it('B: rejects authenticated JWT without school context', async () => {
    const token = signJwt({ userId: 'teacher-a', role: 'teacher' });
    const res = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-b-key')
      .send(DRAFT_BODY);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  // C. Valid teacher identity → verified context (unit) and passes identity
  // gate at HTTP level (reaches service; unconfigured policy reports 400,
  // never 401/403).
  it('C: derives teacher command context exclusively from verified identity', async () => {
    const req = fakeVerifiedReq({
      schoolId: 'school-a',
      externalUserId: 'teacher-a',
      role: 'teacher',
    });
    req.headers['x-school-id'] = 'school-b';
    req.headers['x-actor-id'] = 'intruder';
    req.headers['x-actor-role'] = 'admin';
    req.body = { schoolId: 'school-b', createdByActorId: 'intruder', createdByRole: 'admin' };

    // Spoofed caller fields must trigger scope rejection, never silent merge.
    expect(() => mods.extractVerifiedAssessmentActorContext(req)).toThrow(
      'SCHOOL_SCOPE_MISMATCH',
    );

    const clean = fakeVerifiedReq({
      schoolId: 'school-a',
      externalUserId: 'teacher-a',
      role: 'teacher',
    });
    const context = mods.extractVerifiedAssessmentActorContext(clean);
    expect(context.schoolId).toBe('school-a');
    expect(context.actorId).toBe('teacher-a');
    expect(context.actorRole).toBe('teacher');
    expect(context.source).toBe('api');

    const token = signJwt({ userId: 'teacher-a', schoolId: 'school-a', role: 'teacher' });
    const res = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-c-key')
      .send(DRAFT_BODY);
    expect([400]).toContain(res.status);
    expect(res.body.reasonCode).toBe('DRAFT_CREATION_FAILED');
  });

  // D. Valid school admin → assessment admin (unit); HTTP passes the role
  // gate and only stops at unconfigured policy (never role denial).
  it('D: maps verified school_admin to assessment admin', async () => {
    const context = mods.extractVerifiedAssessmentActorContext(
      fakeVerifiedReq({ schoolId: 'school-a', externalUserId: 'admin-a', role: 'school_admin' }),
    );
    expect(context.actorRole).toBe('admin');
    expect(context.schoolId).toBe('school-a');
    expect(context.actorId).toBe('admin-a');

    const token = signJwt({ userId: 'admin-a', schoolId: 'school-a', role: 'school_admin' });
    const res = await request(app)
      .post('/api/question-bank/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-d-key')
      .send(BLUEPRINT_BODY);
    expect(res.status).toBe(400);
    expect(res.body.reasonCode).toBe('BLUEPRINT_CREATION_FAILED');
    expect(String(res.body.safeMessage || '')).not.toContain('actor role not allowed');
  });

  // E. Body school spoof → rejected mismatch, never authoritative.
  it('E: rejects body schoolId that disagrees with verified school', async () => {
    const token = signJwt({ userId: 'teacher-a', schoolId: 'school-a', role: 'teacher' });
    const res = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-e-key')
      .send({ ...DRAFT_BODY, schoolId: 'school-b' });
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('SCHOOL_SCOPE_MISMATCH');
  });

  // F. Header school spoof → cannot switch context.
  it('F: rejects x-school-id header that disagrees with verified school', async () => {
    const token = signJwt({ userId: 'teacher-a', schoolId: 'school-a', role: 'teacher' });
    const res = await request(app)
      .post('/api/question-bank/blueprints')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-f-key')
      .set('x-school-id', 'school-b')
      .send(BLUEPRINT_BODY);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('SCHOOL_SCOPE_MISMATCH');
  });

  // G. Actor spoof → command actor remains the verified actor.
  it('G: ignores caller actor identity fields', async () => {
    const clean = fakeVerifiedReq({
      schoolId: 'school-a',
      externalUserId: 'teacher-a',
      role: 'teacher',
    });
    const spoofed: any = fakeVerifiedReq({
      schoolId: 'school-a',
      externalUserId: 'teacher-a',
      role: 'teacher',
    });
    spoofed.headers['x-actor-id'] = 'another-user';
    spoofed.body = { createdByActorId: 'another-user', approvedByActorId: 'another-user' };

    const cleanCtx = mods.extractVerifiedAssessmentActorContext(clean);
    const spoofedCtx = mods.extractVerifiedAssessmentActorContext(spoofed);
    expect(spoofedCtx.actorId).toBe('teacher-a');
    expect(spoofedCtx.actorId).toBe(cleanCtx.actorId);
    expect(spoofedCtx.schoolId).toBe(cleanCtx.schoolId);

    const token = signJwt({ userId: 'teacher-a', schoolId: 'school-a', role: 'teacher' });
    const withSpoof = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-g-spoof-key')
      .set('x-actor-id', 'another-user')
      .send({ ...DRAFT_BODY, createdByActorId: 'another-user' });
    const withoutSpoof = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-g-clean-key')
      .send(DRAFT_BODY);
    expect(withSpoof.status).toBe(withoutSpoof.status);
    expect(withSpoof.body.reasonCode).toBe(withoutSpoof.body.reasonCode);
  });

  // H. Role spoof → verified student cannot become admin.
  it('H: ignores caller role fields; verified student stays student', async () => {
    const spoofed: any = fakeVerifiedReq({
      schoolId: 'school-a',
      externalUserId: 'student-a',
      role: 'student',
    });
    spoofed.headers['x-actor-role'] = 'admin';
    spoofed.body = { createdByRole: 'admin' };
    const context = mods.extractVerifiedAssessmentActorContext(spoofed);
    expect(context.actorRole).toBe('student');

    const token = signJwt({ userId: 'student-a', schoolId: 'school-a', role: 'student' });
    const res = await request(app)
      .get('/api/question-bank/drafts/draft-a')
      .set('Authorization', `Bearer ${token}`)
      .set('x-actor-role', 'admin')
      .send({ createdByRole: 'admin' } as any);
    expect(res.status).toBe(403);
  });

  // I. Unknown / unsupported verified roles fail closed.
  it('I: fails closed for unsupported verified roles', async () => {
    for (const role of ['unknown', 'safeguarding_officer', 'system_admin', 'internal_operator']) {
      const req = fakeVerifiedReq({
        schoolId: 'school-a',
        externalUserId: 'user-a',
        role,
      });
      expect(() => mods.extractVerifiedAssessmentActorContext(req)).toThrow('POLICY_BLOCKED');
    }

    const token = signJwt({
      userId: 'guard-a',
      schoolId: 'school-a',
      role: 'safeguarding_officer',
    });
    const res = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${token}`)
      .set('x-idempotency-key', 'p01-i-key')
      .send(DRAFT_BODY);
    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('POLICY_BLOCKED');

    const unknownToken = signJwt({ userId: 'user-a', schoolId: 'school-a', role: 'unknown' });
    const unknownRes = await request(app)
      .post('/api/question-bank/drafts')
      .set('Authorization', `Bearer ${unknownToken}`)
      .set('x-idempotency-key', 'p01-i-unknown-key')
      .send(DRAFT_BODY);
    expect(unknownRes.status).toBe(403);
    expect(unknownRes.body.code).toBe('SCHOOL_CONTEXT_INVALID');
  });

  // J. Cross-school resource access: writes land strictly in the verified
  // school and school-B cannot read school-A scoped resources, using the real
  // services and in-memory repositories.
  it('J: school A writes stay in A and school B cannot list A resources', async () => {
    const registry = new mods.AssessmentPolicyRegistry();
    const configured = (family: string) => ({
      family,
      status: 'CONFIGURED' as const,
      policyKeys: [family],
      requiredOwner: 'school_admin',
      policyVersionRef: 'test-v1',
      reasonCode: 'policy_configured',
      safeMessage: `${family} configured for test`,
    });
    registry.register(configured('QUESTION_DRAFT_CREATION'));
    registry.register(configured('QUESTION_APPROVAL'));

    const idempotencyService = new mods.AssessmentIdempotencyService(
      new mods.InMemoryIdempotencyRepository(),
    );
    const auditService = new mods.AssessmentAuditService(new mods.InMemoryAuditWriter());
    const enforcement = {
      policyRegistry: registry,
      idempotencyService,
      auditService,
    };
    const { AssessmentCommandEnforcementService } = await import(
      '../domains/assessment/assessmentCommandEnforcementService'
    );
    const enforcementService = new AssessmentCommandEnforcementService(enforcement);

    const itemRepo = new mods.InMemoryQuestionBankItemRepository();
    const governed = new mods.GovernedQuestionCommandService({
      enforcementService,
      questionBankItemRepository: itemRepo,
      questionVersionRepository: new mods.InMemoryQuestionVersionRepository(),
      questionPartVersionRepository: new mods.InMemoryQuestionPartVersionRepository(),
      questionAssetVersionRepository: new mods.InMemoryQuestionAssetVersionRepository(),
      answerKeyVersionRepository: new mods.InMemoryAnswerKeyVersionRepository(),
      rubricVersionRepository: new mods.InMemoryRubricVersionRepository(),
      questionObjectiveMappingRepository:
        new mods.InMemoryQuestionObjectiveMappingRepository(),
      questionSourceRecordRepository: new mods.InMemoryQuestionSourceRecordRepository(),
      questionGovernanceRepository: new mods.InMemoryQuestionGovernanceRepository(),
    });

    const context = mods.extractVerifiedAssessmentActorContext(
      fakeVerifiedReq({ schoolId: 'school-a', externalUserId: 'teacher-a', role: 'teacher' }),
    );
    context.idempotencyKey = 'p01-j-draft-key';
    const created = await governed.createQuestionDraft({
      context,
      commandType: 'question:draft:create',
      commandFingerprint: 'p01-j-draft-fingerprint',
      body: {
        schoolId: context.schoolId,
        subjectId: 'subject-a',
        topicId: 'topic-a',
        skillId: 'skill-a',
        curriculumVersionId: 'cv-a',
        primaryObjectiveId: 'obj-a',
        sourceType: 'teacher_created',
        securityClass: 'practice_safe',
      },
    });
    expect(created.ok).toBe(true);
    expect(created.data.schoolId).toBe('school-a');
    expect(created.data.createdByActorId).toBe('teacher-a');

    // Seed a pending approval for school-a through the real service, then
    // prove school-b scope cannot observe it.
    const versionRepo = new mods.InMemoryQuestionVersionRepository();
    const approvalRequestRepo = new mods.InMemoryQuestionApprovalRequestRepository();
    const approvalService = new mods.QuestionApprovalService(
      enforcementService,
      approvalRequestRepo,
      new mods.InMemoryQuestionApprovalRecordRepository(),
      itemRepo,
      versionRepo,
    );
    const version: any = {
      questionVersionId: 'p01-j-version-a',
      questionId: created.data.questionId,
      versionNumber: 1,
      status: 'draft',
      stemSafeText: 'synthetic',
      questionType: 'short_answer',
      difficultyBand: 'recall',
      language: 'English',
      studentSafeExplanation: '',
      teacherExplanation: '',
      estimatedTimeSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await versionRepo.create(version);
    await versionRepo.updateStatus('p01-j-version-a', 'pending_approval');

    const approvalContext = { ...context, idempotencyKey: 'p01-j-approval-key' };
    const approvalRequest = await approvalService.createApprovalRequest({
      schoolId: context.schoolId,
      questionId: created.data.questionId,
      questionVersionId: 'p01-j-version-a',
      requestReason: 'synthetic cross-school proof',
      context: approvalContext,
    });
    expect(approvalRequest.schoolId).toBe('school-a');
    expect(approvalRequest.requestedByActorId).toBe('teacher-a');

    const visibleToA = await approvalService.listPendingApprovalRequests('school-a');
    const visibleToB = await approvalService.listPendingApprovalRequests('school-b');
    expect(visibleToA.map((r: any) => r.approvalRequestId)).toContain(
      approvalRequest.approvalRequestId,
    );
    expect(visibleToB).toHaveLength(0);
  });

  // K. Idempotency regression: same verified command + same key preserves
  // replay semantics; same key + changed fingerprint conflicts.
  it('K: preserves idempotency replay semantics for verified commands', async () => {
    const service = new mods.AssessmentIdempotencyService(
      new mods.InMemoryIdempotencyRepository(),
    );
    const context = mods.extractVerifiedAssessmentActorContext(
      fakeVerifiedReq({ schoolId: 'school-a', externalUserId: 'teacher-a', role: 'teacher' }),
    );
    context.idempotencyKey = 'p01-k-key';

    const first = await service.checkOrCreate(context, 'question:draft:create', 'fp-1');
    expect(first.status).toBe('accepted');
    const replay = await service.checkOrCreate(context, 'question:draft:create', 'fp-1');
    expect(replay.status).toBe('accepted');
    expect(replay.reasonCode).toBe('idempotency_replay_accepted');
    const conflict = await service.checkOrCreate(context, 'question:draft:create', 'fp-2');
    expect(conflict.status).toBe('conflict');
  });

  // L. Existing role denial: student remains denied by assessment policy.
  it('L: preserves existing student denial on blueprint creation and approval', async () => {
    const studentToken = signJwt({ userId: 'student-a', schoolId: 'school-a', role: 'student' });
    const res = await request(app)
      .post('/api/question-bank/blueprints')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('x-idempotency-key', 'p01-l-key')
      .send(BLUEPRINT_BODY);
    expect(res.status).toBe(400);
    expect(String(res.body.safeMessage || '')).toContain('actor role not allowed');

    const registry = new mods.AssessmentPolicyRegistry();
    const enforcement = {
      policyRegistry: registry,
      idempotencyService: new mods.AssessmentIdempotencyService(
        new mods.InMemoryIdempotencyRepository(),
      ),
      auditService: new mods.AssessmentAuditService(new mods.InMemoryAuditWriter()),
    };
    const { AssessmentCommandEnforcementService } = await import(
      '../domains/assessment/assessmentCommandEnforcementService'
    );
    const approvalService = new mods.QuestionApprovalService(
      new AssessmentCommandEnforcementService(enforcement),
      new mods.InMemoryQuestionApprovalRequestRepository(),
      new mods.InMemoryQuestionApprovalRecordRepository(),
      new mods.InMemoryQuestionBankItemRepository(),
      new mods.InMemoryQuestionVersionRepository(),
    );
    const studentContext = mods.extractVerifiedAssessmentActorContext(
      fakeVerifiedReq({ schoolId: 'school-a', externalUserId: 'student-a', role: 'student' }),
    );
    await expect(
      approvalService.recordApprovalDecision({
        approvalRequestId: 'missing',
        schoolId: 'school-a',
        questionId: 'q-a',
        questionVersionId: 'v-a',
        decision: 'approved',
        decisionReason: 'synthetic',
        context: studentContext,
      }),
    ).rejects.toThrow('POLICY_BLOCKED');
  });
});
