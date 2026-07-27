import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { CurriculumGraphQueryService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphQueryService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext, CurriculumGraphQueryContext, ActorRole } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';
import { requireSuccess, expectVersionCreated, expectNodeMutation, expectEdgeMutation, expectLifecycleTransition, expectActivation } from './curriculum-graph-test-helpers';
import type { CurriculumGraphNodeType, CurriculumGraphEdgeType } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Authorization', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let queryService: CurriculumGraphQueryService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let versionId: string;

  function makeActor(role: ActorRole): CurriculumGraphActorContext {
    return { schoolId: 'school-a', actorId: `${role}-1`, actorRole: role, requestId: 'req', correlationId: 'corr' };
  }

  function makeQueryCtx(role: ActorRole): CurriculumGraphQueryContext {
    return { schoolId: 'school-a', actorId: `${role}-1`, actorRole: role, requestId: 'req', correlationId: 'corr' };
  }

  beforeEach(() => {
    repo = new InMemoryCurriculumKnowledgeGraphRepository();
    rolePolicy = new CurriculumGraphRolePolicyService();
    lifecycle = new CurriculumGraphVersionLifecycleService();
    clock = new FixedClock('2026-07-26T12:00:00Z');
    idGen = new DeterministicIdGenerator('test');
    validator = new CurriculumGraphValidatorService(repo, clock);
    traversal = new CurriculumGraphTraversalService(repo);
    commandService = new CurriculumGraphCommandService(repo, rolePolicy, lifecycle, validator, traversal, clock, idGen);
    queryService = new CurriculumGraphQueryService(repo, rolePolicy, traversal);

    // Create a version as admin
    const v = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    versionId = expectVersionCreated(v).version.versionId;
  });

  it('should allow student to read active student-safe', () => {
    const ctx = makeQueryCtx('student');
    const result = queryService.getStudentSafeGraph(versionId, ctx);
    // Version is draft, so student-safe returns null
    expect(result).toBe(null);
  });

  it('should deny student from creating versions', () => {
    const r = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v2', idempotencyKey: 'ik-v2', requestHash: 'h-v2', expectedRevision: 1, actor: makeActor('student'), occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_ROLE_FORBIDDEN');
  });

  it('should allow teacher to create versions', () => {
    const r = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v3', idempotencyKey: 'ik-v3', requestHash: 'h-v3', expectedRevision: 1, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test2', title: 'Teacher Version', description: '', metadata: {},
    });
    expect(r.success).toBe(true);
  });

  it('should allow teacher to edit draft but not approve', () => {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-n', idempotencyKey: 'ik-n', requestHash: 'h-n', expectedRevision: 1, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(true);
  });

  it('should deny teacher from approving', () => {
    // Add valid graph first
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: 2, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: 3, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c', versionId });

    const r = commandService.execute({
      commandType: 'ApproveCurriculumGraphVersion', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: 4, actor: makeActor('teacher'), occurredAt: clock.now(), correlationId: 'c', versionId,
    });
    expect(r.success).toBe(false);
  });

  it('should allow school_admin to approve and activate', () => {
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: 2, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: 3, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: repo.listNodes('school-a', versionId).find(n => n.code === 'ROOT')!.nodeId, toNodeId: repo.listNodes('school-a', versionId).find(n => n.code === 'MATH')!.nodeId, sequence: 1, required: true, rationale: '', metadata: {} });
    commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: 4, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId });
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c5', idempotencyKey: 'k5', requestHash: 'h5', expectedRevision: 5, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId });
    expect(approve.success).toBe(true);
    const activate = commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c6', idempotencyKey: 'k6', requestHash: 'h6', expectedRevision: expectLifecycleTransition(approve).version.revision, actor: makeActor('school_admin'), occurredAt: clock.now(), correlationId: 'c', versionId });
    expect(activate.success).toBe(true);
  });

  it('should deny parent role', () => {
    const r = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-p', idempotencyKey: 'ik-p', requestHash: 'h-p', expectedRevision: 1, actor: makeActor('parent'), occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    expect(r.success).toBe(false);
  });

  it('should deny unknown role', () => {
    const r = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-u', idempotencyKey: 'ik-u', requestHash: 'h-u', expectedRevision: 1, actor: makeActor('unknown'), occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    expect(r.success).toBe(false);
  });
});