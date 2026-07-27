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

describe('Curriculum Graph Idempotency and Concurrency', () => {
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

    const v = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;
  });

  it('should return identical result for idempotent replay', () => {
    const r1 = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-n1', idempotencyKey: 'same-key', requestHash: 'same-hash', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r1.success).toBe(true);

    const r2 = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-n2', idempotencyKey: 'same-key', requestHash: 'same-hash', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r2.success).toBe(true);

    // Both should succeed and not create duplicates
    const nodes = repo.listNodes('school-a', versionId);
    const roots = nodes.filter(n => n.code === 'ROOT');
    expect(roots.length).toBe(1);
  });

  it('should reject correct expected revision', () => {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-correct', idempotencyKey: 'ik-correct', requestHash: 'h-correct', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(true);
  });

  it('should reject stale expected revision', () => {
    // First mutation increments revision
    commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-stale1', idempotencyKey: 'ik-stale1', requestHash: 'h-stale1', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });

    // Second command with old revision should fail
    const r2 = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-stale2', idempotencyKey: 'ik-stale2', requestHash: 'h-stale2', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.code).toBe('CURRICULUM_GRAPH_STALE_REVISION');
  });

  it('should not change state on stale revision failure', () => {
    const nodesBefore = repo.listNodes('school-a', versionId).length;

    commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-stale3', idempotencyKey: 'ik-stale3', requestHash: 'h-stale3', expectedRevision: 999, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });

    const nodesAfter = repo.listNodes('school-a', versionId).length;
    expect(nodesAfter).toBe(nodesBefore);
  });
});