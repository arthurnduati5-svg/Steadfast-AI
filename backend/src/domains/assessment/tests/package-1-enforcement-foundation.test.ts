import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentPolicyRegistry } from '../policies/assessmentPolicyRegistry';
import {
  assertProjectionAllowed,
  stripForbiddenFieldsForRole,
  defaultForbiddenFieldRegistry,
} from '../projections/assessmentProjectionGuard';
import { AssessmentIdempotencyService } from '../idempotency/assessmentIdempotencyService';
import { assertExpectedVersion, createVersionConflict } from '../concurrency/assessmentConcurrencyService';
import { AssessmentAuditService } from '../audit/assessmentAuditService';
import { AssessmentOutboxService } from '../outbox/assessmentOutboxService';
import { AssessmentCommandEnforcementService } from '../assessmentCommandEnforcementService';
import {
  InMemoryIdempotencyRepository,
  InMemoryAuditWriter,
  InMemoryOutboxRepository,
  InMemoryInboxRepository,
} from '../repositories/inMemoryAssessmentRepositories';
import type { AssessmentCommandContext, AssessmentGovernedCommand } from '../contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily, AssessmentPolicyDefinition, AssessmentPolicyStatus } from '../contracts/assessmentPolicyContracts';
import type { ProjectionRole } from '../contracts/assessmentProjectionContracts';
import { FORBIDDEN_FIELDS } from '../contracts/assessmentProjectionContracts';

function makeContext(overrides?: Partial<AssessmentCommandContext>): AssessmentCommandContext {
  return {
    actorId: 'actor-1',
    actorRole: 'teacher',
    schoolId: 'school-1',
    correlationId: 'corr-1',
    idempotencyKey: 'ik-1',
    source: 'api',
    now: new Date().toISOString(),
    ...overrides,
  };
}

function makeCommand(overrides?: Partial<AssessmentGovernedCommand>): AssessmentGovernedCommand {
  return {
    context: makeContext(),
    commandType: 'create_question_draft',
    commandFingerprint: 'hash-1',
    aggregateType: 'question',
    aggregateId: 'q-1',
    expectedVersion: 1,
    body: { title: 'test question' },
    ...overrides,
  };
}

// ─── 8.1 Command Context Tests ───────────────────────────────────

describe('Command Context', () => {
  it('blocks missing schoolId', async () => {
    const ctx = makeContext({ schoolId: '' });
    const result = await new AssessmentCommandEnforcementService({
      policyRegistry: new AssessmentPolicyRegistry(),
      idempotencyService: new AssessmentIdempotencyService(new InMemoryIdempotencyRepository()),
      auditService: new AssessmentAuditService(new InMemoryAuditWriter()),
    }).enforceGovernedCommand(makeCommand({ context: ctx }));
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasonCode).toBe('invalid_command_context');
  });

  it('blocks missing actorId', async () => {
    const ctx = makeContext({ actorId: '' });
    const result = await new AssessmentCommandEnforcementService({
      policyRegistry: new AssessmentPolicyRegistry(),
      idempotencyService: new AssessmentIdempotencyService(new InMemoryIdempotencyRepository()),
      auditService: new AssessmentAuditService(new InMemoryAuditWriter()),
    }).enforceGovernedCommand(makeCommand({ context: ctx }));
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it('blocks missing actorRole', async () => {
    const ctx = makeContext({ actorRole: '' as any });
    const result = await new AssessmentCommandEnforcementService({
      policyRegistry: new AssessmentPolicyRegistry(),
      idempotencyService: new AssessmentIdempotencyService(new InMemoryIdempotencyRepository()),
      auditService: new AssessmentAuditService(new InMemoryAuditWriter()),
    }).enforceGovernedCommand(makeCommand({ context: ctx }));
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
  });

  it('requires idempotencyKey for mutating governed commands', async () => {
    const ctx = makeContext({ idempotencyKey: undefined, source: 'api' });
    const result = await new AssessmentCommandEnforcementService({
      policyRegistry: new AssessmentPolicyRegistry(),
      idempotencyService: new AssessmentIdempotencyService(new InMemoryIdempotencyRepository()),
      auditService: new AssessmentAuditService(new InMemoryAuditWriter()),
    }).enforceGovernedCommand(makeCommand({ context: ctx }));
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('invalid_command_context');
  });

  it('allows generated correlationId', () => {
    const ctx = makeContext({ correlationId: 'gen-corr-123' });
    expect(ctx.correlationId).toBe('gen-corr-123');
  });

  it('does not require direct student PII', () => {
    const ctx = makeContext();
    expect((ctx as any).studentToken).toBeUndefined();
  });
});

// ─── 8.2 Policy Registry Tests ──────────────────────────────────

describe('Policy Registry', () => {
  let registry: AssessmentPolicyRegistry;

  beforeEach(() => {
    registry = new AssessmentPolicyRegistry();
  });

  it('missing policy returns allowed=false', () => {
    const decision = registry.resolve('LEGAL_CONSENT_RETENTION');
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe('MISSING');
  });

  it('disabled policy returns allowed=false', () => {
    registry.register({
      family: 'LEGAL_CONSENT_RETENTION',
      status: 'DISABLED',
      policyKeys: ['consent_v1'],
      requiredOwner: 'school_admin',
      policyVersionRef: '1.0',
      reasonCode: 'policy_disabled',
      safeMessage: 'Legal consent retention is disabled',
    });
    const decision = registry.resolve('LEGAL_CONSENT_RETENTION');
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe('DISABLED');
  });

  it('blocked policy returns allowed=false', () => {
    registry.register({
      family: 'AI_OCR_ELIGIBILITY',
      status: 'BLOCKED',
      policyKeys: [],
      requiredOwner: 'admin',
      policyVersionRef: '1.0',
      reasonCode: 'policy_blocked',
      safeMessage: 'OCR is blocked for this school',
    });
    const decision = registry.resolve('AI_OCR_ELIGIBILITY');
    expect(decision.allowed).toBe(false);
    expect(decision.status).toBe('BLOCKED');
  });

  it('configured policy can allow operation', () => {
    registry.register({
      family: 'USAGE_MODE',
      status: 'CONFIGURED',
      policyKeys: ['mode_exam_allowed'],
      requiredOwner: 'school_admin',
      policyVersionRef: '1.0',
      reasonCode: 'policy_configured',
      safeMessage: 'Usage mode is configured',
    });
    const decision = registry.resolve('USAGE_MODE');
    expect(decision.allowed).toBe(true);
    expect(decision.status).toBe('CONFIGURED');
  });

  it('safe message contains no sensitive fields', () => {
    const decision = registry.resolve('FINALIZATION');
    expect(decision.safeMessage).not.toContain('secret');
    expect(decision.safeMessage).not.toContain('token');
    expect(decision.safeMessage).not.toContain('apiKey');
    expect(decision.safeMessage).not.toContain('answerKey');
  });

  it('no invented policy default exists', () => {
    const families: AssessmentPolicyFamily[] = [
      'LEGAL_CONSENT_RETENTION',
      'CURRICULUM_CONTENT_AUTHORITY',
      'ROLE_APPROVAL_MODERATION',
      'QUESTION_TYPE_SCORING',
      'MASTERY_EVIDENCE_WEIGHTING',
      'AI_OCR_ELIGIBILITY',
      'SECURITY_EXPOSURE_LEAK_RESPONSE',
      'SLO_BACKUP_ROLLOUT',
      'FUTURE_EXTENSION_SCOPE',
      'USAGE_MODE',
      'PROJECTION',
      'FINALIZATION',
      'PARENT_RELEASE',
    ];
    for (const f of families) {
      const d = registry.resolve(f);
      expect(d.allowed).toBe(false);
      expect(d.status).toBe('MISSING');
    }
  });
});

// ─── 8.3 Projection Guard Tests ─────────────────────────────────

describe('Projection Guard', () => {
  it('student projection strips answer keys', () => {
    const payload = { title: 'Q1', answerKey: 'secret', body: 'text' };
    const stripped = stripForbiddenFieldsForRole('student', payload);
    expect(stripped.answerKey).toBeUndefined();
    expect(stripped.title).toBe('Q1');
  });

  it('parent projection strips raw answers and integrity signals', () => {
    const payload = { title: 'Q1', rawStudentAnswer: 'my answer', rawIntegritySignal: 'sig' };
    const stripped = stripForbiddenFieldsForRole('parent', payload);
    expect(stripped.rawStudentAnswer).toBeUndefined();
    expect(stripped.rawIntegritySignal).toBeUndefined();
  });

  it('teacher projection does not receive cross-school data by default', () => {
    const payload = { title: 'Q1', token: 'abc', apiKey: 'key' };
    const stripped = stripForbiddenFieldsForRole('teacher', payload);
    expect(stripped.token).toBeUndefined();
    expect(stripped.apiKey).toBeUndefined();
    expect(stripped.title).toBe('Q1');
  });

  it('system_marking receives only minimal fields', () => {
    const payload = {
      questionId: 'q-1',
      rawStudentAnswer: 'student work',
      chainOfThought: 'reasoning',
      apiKey: 'sk-xxx',
      hiddenReasoning: 'deep',
    };
    const stripped = stripForbiddenFieldsForRole('system_marking', payload);
    expect(stripped.rawStudentAnswer).toBe('student work');
    expect(stripped.chainOfThought).toBeUndefined();
    expect(stripped.apiKey).toBeUndefined();
    expect(stripped.hiddenReasoning).toBeUndefined();
  });

  it('assertProjectionAllowed blocks when forbidden fields exist', () => {
    const payload = { answerKey: 'secret', modelAnswer: 'answer' };
    const decision = assertProjectionAllowed('student', payload);
    expect(decision.allowed).toBe(false);
    expect(decision.forbiddenFieldsFound).toContain('answerKey');
    expect(decision.forbiddenFieldsFound).toContain('modelAnswer');
  });

  it('forbidden fields registry catches all required fields', () => {
    const requiredFields = [
      'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
      'rubricInternal', 'teacherOnlyNotes', 'hiddenReasoning',
      'chainOfThought', 'secret', 'token', 'apiKey',
    ];
    for (const field of requiredFields) {
      expect(defaultForbiddenFieldRegistry.isForbidden(field)).toBe(true);
    }
  });

  it('forbidden fields registry finds nested forbidden fields', () => {
    const payload = { nested: { chainOfThought: 'test' } };
    expect(defaultForbiddenFieldRegistry.findForbidden(payload)).toContain('nested.chainOfThought');
  });
});

// ─── 8.4 Idempotency Tests ──────────────────────────────────────

describe('Idempotency', () => {
  let repo: InMemoryIdempotencyRepository;
  let service: AssessmentIdempotencyService;

  beforeEach(() => {
    repo = new InMemoryIdempotencyRepository();
    service = new AssessmentIdempotencyService(repo);
  });

  it('same command fingerprint returns same result', async () => {
    const ctx = makeContext();
    const r1 = await service.checkOrCreate(ctx, 'create_question', 'hash-1');
    expect(r1.status).toBe('accepted');

    const r2 = await service.checkOrCreate(ctx, 'create_question', 'hash-1');
    expect(r2.status).toBe('accepted');
  });

  it('same key with different fingerprint conflicts', async () => {
    const ctx = makeContext();
    await service.checkOrCreate(ctx, 'create_question', 'hash-1');
    const r2 = await service.checkOrCreate(ctx, 'create_question', 'hash-2');
    expect(r2.status).toBe('conflict');
  });

  it('same key cannot replay across schools', async () => {
    const ctx1 = makeContext({ schoolId: 'school-1' });
    const ctx2 = makeContext({ schoolId: 'school-2' });
    await service.checkOrCreate(ctx1, 'create_question', 'hash-1');
    const r2 = await service.checkOrCreate(ctx2, 'create_question', 'hash-1');
    expect(r2.status).toBe('accepted');
  });

  it('same key cannot replay across actors', async () => {
    const ctx1 = makeContext({ actorId: 'actor-1' });
    const ctx2 = makeContext({ actorId: 'actor-2' });
    await service.checkOrCreate(ctx1, 'create_question', 'hash-1');
    const r2 = await service.checkOrCreate(ctx2, 'create_question', 'hash-1');
    expect(r2.status).toBe('accepted');
  });

  it('missing key blocks mutating governed command', async () => {
    const ctx = makeContext({ idempotencyKey: undefined });
    const result = await service.checkOrCreate(ctx, 'create_question', 'hash-1');
    expect(result.status).toBe('missing');
  });
});

// ─── 8.5 Concurrency Tests ──────────────────────────────────────

describe('Concurrency', () => {
  it('matching expectedVersion passes', () => {
    const result = assertExpectedVersion({
      aggregateType: 'question',
      aggregateId: 'q-1',
      expectedVersion: 5,
      actualVersion: 5,
      commandId: 'cmd-1',
      conflictReason: 'OK',
    });
    expect(result.ok).toBe(true);
    expect(result.conflictReason).toBe('OK');
  });

  it('stale expectedVersion returns VERSION_CONFLICT', () => {
    const result = assertExpectedVersion({
      aggregateType: 'question',
      aggregateId: 'q-1',
      expectedVersion: 5,
      actualVersion: 7,
      commandId: 'cmd-1',
      conflictReason: 'VERSION_CONFLICT',
    });
    expect(result.ok).toBe(false);
    expect(result.conflictReason).toBe('VERSION_CONFLICT');
  });

  it('missing expectedVersion blocks versioned transition', () => {
    const result = assertExpectedVersion({
      aggregateType: 'question',
      aggregateId: 'q-1',
      expectedVersion: undefined,
      actualVersion: 5,
      commandId: 'cmd-1',
      conflictReason: 'MISSING_EXPECTED_VERSION',
    });
    expect(result.ok).toBe(false);
    expect(result.conflictReason).toBe('MISSING_EXPECTED_VERSION');
  });

  it('createVersionConflict returns stable conflict', () => {
    const result = createVersionConflict(3, 5, 'cmd-1');
    expect(result.ok).toBe(false);
    expect(result.conflictReason).toBe('VERSION_CONFLICT');
    expect(result.expectedVersion).toBe(3);
    expect(result.actualVersion).toBe(5);
  });
});

// ─── 8.6 Audit Tests ────────────────────────────────────────────

describe('Audit', () => {
  let writer: InMemoryAuditWriter;
  let service: AssessmentAuditService;

  beforeEach(() => {
    writer = new InMemoryAuditWriter();
    service = new AssessmentAuditService(writer);
  });

  it('audit event redacts forbidden metadata', async () => {
    await service.writeAuditEvent({
      eventType: 'assessment_command_executed',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      reasonCode: 'test',
      safeSummary: 'test',
      metadata: { answerKey: 'secret', chainOfThought: 'reasoning', safeField: 'ok' },
    });
    const event = writer.events[0];
    expect(event.metadata.answerKey).toBe('[REDACTED]');
    expect(event.metadata.chainOfThought).toBe('[REDACTED]');
    expect(event.metadata.safeField).toBe('ok');
  });

  it('audit write failure blocks governed transition when audit is required', async () => {
    writer.failWrites = true;
    const result = await service.writeAuditEvent({
      eventType: 'assessment_command_executed',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      reasonCode: 'test',
      safeSummary: 'test',
    });
    expect(result.ok).toBe(false);
  });

  it('audit event includes correlationId and causationId', async () => {
    const ctx = makeContext({ correlationId: 'corr-1', causationId: 'cause-1' });
    await service.writeAuditEvent({
      eventType: 'assessment_command_executed',
      context: ctx,
      aggregateType: 'question',
      aggregateId: 'q-1',
      reasonCode: 'test',
      safeSummary: 'test',
    });
    const event = writer.events[0];
    expect(event.correlationId).toBe('corr-1');
    expect(event.causationId).toBe('cause-1');
  });

  it('audit event includes actor, role, school, aggregate, version, reasonCode', async () => {
    const ctx = makeContext({ actorId: 'actor-1', actorRole: 'teacher', schoolId: 'school-1' });
    await service.writeAuditEvent({
      eventType: 'assessment_command_executed',
      context: ctx,
      aggregateType: 'question',
      aggregateId: 'q-1',
      aggregateVersion: 3,
      reasonCode: 'enforcement_passed',
      safeSummary: 'test summary',
    });
    const event = writer.events[0];
    expect(event.actorId).toBe('actor-1');
    expect(event.actorRole).toBe('teacher');
    expect(event.schoolId).toBe('school-1');
    expect(event.aggregateType).toBe('question');
    expect(event.aggregateId).toBe('q-1');
    expect(event.aggregateVersion).toBe(3);
    expect(event.reasonCode).toBe('enforcement_passed');
  });
});

// ─── 8.7 Outbox/Inbox Tests ─────────────────────────────────────

describe('Outbox/Inbox', () => {
  let outboxRepo: InMemoryOutboxRepository;
  let inboxRepo: InMemoryInboxRepository;
  let outboxService: AssessmentOutboxService;

  beforeEach(() => {
    outboxRepo = new InMemoryOutboxRepository();
    inboxRepo = new InMemoryInboxRepository();
    outboxService = new AssessmentOutboxService(outboxRepo, inboxRepo, true);
  });

  it('outbox payload rejects answer keys', async () => {
    const result = await outboxService.publish({
      eventType: 'question.created',
      schemaVersion: '1.0',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      payload: { answerKey: 'secret' },
    });
    expect(result.ok).toBe(false);
    expect(result.failureReason).toContain('forbidden');
  });

  it('outbox payload rejects raw answers', async () => {
    const result = await outboxService.publish({
      eventType: 'question.created',
      schemaVersion: '1.0',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      payload: { rawStudentAnswer: 'answer' },
    });
    expect(result.ok).toBe(false);
  });

  it('outbox payload rejects PII fields', async () => {
    const result = await outboxService.publish({
      eventType: 'question.created',
      schemaVersion: '1.0',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      payload: { secret: 'pii', apiKey: 'key' },
    });
    expect(result.ok).toBe(false);
  });

  it('event schemaVersion is required', async () => {
    const result = await outboxService.publish({
      eventType: 'question.created',
      schemaVersion: '',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      payload: { data: 'ok' },
    });
    expect(result.ok).toBe(false);
    expect(result.failureReason).toBe('schemaVersion_required');
  });

  it('duplicate inbox receipt is idempotent', async () => {
    const r1 = await outboxService.processInbox('evt-1', 'consumer-1', 'school-1');
    expect(r1.status).toBe('received');
    const r2 = await outboxService.processInbox('evt-1', 'consumer-1', 'school-1');
    expect(r2.status).toBe('duplicate');
  });

  it('outbox write failure blocks transition when outbox is required', async () => {
    outboxRepo.failWrites = true;
    const result = await outboxService.publish({
      eventType: 'question.created',
      schemaVersion: '1.0',
      context: makeContext(),
      aggregateType: 'question',
      aggregateId: 'q-1',
      payload: { data: 'ok' },
    });
    expect(result.ok).toBe(false);
  });
});

// ─── 8.8 No-Duplication Contract Tests ──────────────────────────

describe('No-Duplication Contract', () => {
  it('assessment domain does not import React or frontend modules', () => {
    const files = getNonTestTsFiles();
    for (const file of files) {
      const content = readFile(file);
      expect(content).not.toMatch(/from ['"]react['"]/);
      expect(content).not.toMatch(/from ['"]next\//);
      expect(content).not.toMatch(/\.[t|j]sx['"]/);
      expect(content).not.toMatch(/JSX\./);
    }
  });

  it('assessment domain does not import AI provider modules directly', () => {
    const files = getNonTestTsFiles();
    for (const file of files) {
      const content = readFile(file);
      expect(content).not.toMatch(/from ['"]openai['"]/);
      expect(content).not.toMatch(/from ['"]@pinecone-database\//);
    }
  });

  it('no frontend files changed', () => {
    const files = getNonTestTsFiles();
    expect(files.every(f => f.endsWith('.ts') && !f.endsWith('.tsx'))).toBe(true);
  });

  it('FORBIDDEN_FIELDS constant includes all required protected fields', () => {
    const required: string[] = [
      'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
      'rubricInternal', 'teacherOnlyNotes', 'rawStudentAnswer',
      'rawStudentWork', 'rawIntegritySignal', 'peerIdentifiableData',
      'rawParentData', 'rawTeacherData', 'rawPrompt', 'rawProviderResponse',
      'chainOfThought', 'hiddenReasoning', 'scratchpad', 'secret',
      'token', 'apiKey',
    ];
    for (const field of required) {
      expect(FORBIDDEN_FIELDS).toContain(field);
    }
  });
});

// ─── Enforcement Orchestrator Tests ──────────────────────────────

describe('Enforcement Orchestrator', () => {
  let policyRegistry: AssessmentPolicyRegistry;
  let idempotencyRepo: InMemoryIdempotencyRepository;
  let auditWriter: InMemoryAuditWriter;
  let outboxRepo: InMemoryOutboxRepository;
  let inboxRepo: InMemoryInboxRepository;
  let orchestrator: AssessmentCommandEnforcementService;

  beforeEach(() => {
    policyRegistry = new AssessmentPolicyRegistry();
    idempotencyRepo = new InMemoryIdempotencyRepository();
    auditWriter = new InMemoryAuditWriter();
    outboxRepo = new InMemoryOutboxRepository();
    inboxRepo = new InMemoryInboxRepository();
    orchestrator = new AssessmentCommandEnforcementService({
      policyRegistry,
      idempotencyService: new AssessmentIdempotencyService(idempotencyRepo),
      auditService: new AssessmentAuditService(auditWriter),
      outboxService: new AssessmentOutboxService(outboxRepo, inboxRepo, false),
    }, true, true, false);
  });

  it('passes with valid command and no policy requirements', async () => {
    const result = await orchestrator.enforceGovernedCommand(makeCommand());
    expect(result.ok).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it('blocks when required policy is missing', async () => {
    const result = await orchestrator.enforceGovernedCommand(makeCommand(), {
      requiredPolicies: ['LEGAL_CONSENT_RETENTION'],
    });
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasonCode).toBe('policy_blocked');
  });

  it('blocks when projection role detects forbidden fields', async () => {
    const cmd = makeCommand({ body: { answerKey: 'secret' } });
    const result = await orchestrator.enforceGovernedCommand(cmd, {
      projectionRole: 'student',
    });
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasonCode).toBe('projection_forbidden_fields_detected');
  });

  it('blocks on idempotency conflict', async () => {
    const ctx = makeContext();
    const cmd1 = makeCommand({ context: ctx, commandFingerprint: 'hash-1' });
    const cmd2 = makeCommand({ context: ctx, commandFingerprint: 'hash-2' });
    await orchestrator.enforceGovernedCommand(cmd1);
    const result = await orchestrator.enforceGovernedCommand(cmd2);
    expect(result.ok).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.reasonCode).toBe('idempotency_fingerprint_mismatch');
  });

  it('supports dry run', async () => {
    const result = await orchestrator.enforceGovernedCommand(makeCommand(), {
      dryRun: true,
    });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
  });

  it('fails closed when audit write fails', async () => {
    auditWriter.failWrites = true;
    const orchestrator2 = new AssessmentCommandEnforcementService({
      policyRegistry,
      idempotencyService: new AssessmentIdempotencyService(idempotencyRepo),
      auditService: new AssessmentAuditService(auditWriter),
    }, true, true, false);
    const result = await orchestrator2.enforceGovernedCommand(makeCommand());
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('audit_write_failed');
  });
});

// ─── Helpers ────────────────────────────────────────────────────

function getNonTestTsFiles(): string[] {
  const fs = require('fs');
  const path = require('path');
  const domainDir = path.resolve(__dirname, '..');
  const files: string[] = [];
  function walk(d: string) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'tests') {
        walk(full);
      } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) && !e.name.endsWith('.test.ts')) {
        files.push(full);
      }
    }
  }
  walk(domainDir);
  return files;
}

function readFile(filePath: string): string {
  return require('fs').readFileSync(filePath, 'utf-8');
}
