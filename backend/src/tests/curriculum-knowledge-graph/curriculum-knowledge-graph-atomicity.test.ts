import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';
import { requireSuccess, expectVersionCreated, expectNodeMutation, expectEdgeMutation, expectLifecycleTransition, expectActivation } from './curriculum-graph-test-helpers';
import type { CurriculumGraphNodeType, CurriculumGraphEdgeType } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Atomicity', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let actor: CurriculumGraphActorContext;
  let versionId: string;
  let currentRevision: number;

  beforeEach(() => {
    repo = new InMemoryCurriculumKnowledgeGraphRepository();
    rolePolicy = new CurriculumGraphRolePolicyService();
    lifecycle = new CurriculumGraphVersionLifecycleService();
    clock = new FixedClock('2026-07-26T12:00:00Z');
    idGen = new DeterministicIdGenerator('test');
    validator = new CurriculumGraphValidatorService(repo, clock);
    traversal = new CurriculumGraphTraversalService(repo);
    commandService = new CurriculumGraphCommandService(repo, rolePolicy, lifecycle, validator, traversal, clock, idGen);
    actor = { schoolId: 'school-a', actorId: 'admin', actorRole: 'school_admin', requestId: 'req-1', correlationId: 'corr-1' };

    const v = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test', title: 'Test', description: '', metadata: {} });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;
  });

  it('should leave graph unchanged on failed edge mutation', () => {
    const nodesBefore = repo.listNodes('school-a', versionId).length;

    const r = commandService.execute({
      commandType: 'AddCurriculumEdge', commandId: 'cmd-e-fail', idempotencyKey: 'ik-e-fail', requestHash: 'h-e',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: 'nonexistent', toNodeId: 'also-nonexistent',
      sequence: 1, required: true, rationale: '', metadata: {},
    });
    expect(r.success).toBe(false);

    const nodesAfter = repo.listNodes('school-a', versionId).length;
    expect(nodesAfter).toBe(nodesBefore);
  });

  it('should leave version unchanged on failed lifecycle transition', () => {
    const versionBefore = repo.getVersion('school-a', versionId);
    const revBefore = versionBefore!.revision;

    const r = commandService.execute({
      commandType: 'ApproveCurriculumGraphVersion', commandId: 'cmd-bad', idempotencyKey: 'ik-bad', requestHash: 'h-bad',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId,
    });
    expect(r.success).toBe(false);

    const versionAfter = repo.getVersion('school-a', versionId);
    expect(versionAfter!.revision).toBe(revBefore);
  });

  it('should not increment revision on failed mutation', () => {
    const v = repo.getVersion('school-a', versionId);
    const revBefore = v!.revision;

    commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-bad', idempotencyKey: 'ik-bad', requestHash: 'h-bad',
      expectedRevision: 999, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });

    const vAfter = repo.getVersion('school-a', versionId);
    expect(vAfter!.revision).toBe(revBefore);
  });

  it('should not create node in repository on stale revision', () => {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-stale', idempotencyKey: 'ik-stale', requestHash: 'h-stale',
      expectedRevision: 999, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(false);

    const node = repo.getNode('school-a', versionId, 'MATH');
    expect(node).toBeUndefined();
  });

  it('should run successful mutations atomically', () => {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-good', idempotencyKey: 'ik-good', requestHash: 'h-good',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(true);

    const node = repo.getNode('school-a', versionId, expectNodeMutation(r).node.nodeId);
    expect(node).toBeDefined();
  });
});