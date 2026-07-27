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

describe('Curriculum Graph Traversal', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let actor: CurriculumGraphActorContext;
  let versionId: string;
  let rootId: string, mathId: string, sciId: string, algId: string, numId: string;
  let currentRevision: number;
  let c1Id: string, c2Id: string;

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

    const root = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-R', idempotencyKey: 'ik-R', requestHash: 'h-R', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'curriculum_root' as CurriculumGraphNodeType, code: 'ROOT', title: 'Root', description: '', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    rootId = expectNodeMutation(root).node.nodeId; currentRevision = expectNodeMutation(root).versionRevision;

    const math = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-M', idempotencyKey: 'ik-M', requestHash: 'h-M', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    mathId = expectNodeMutation(math).node.nodeId; currentRevision = expectNodeMutation(math).versionRevision;

    const sci = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-S', idempotencyKey: 'ik-S', requestHash: 'h-S', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'subject' as CurriculumGraphNodeType, code: 'SCI', title: 'Science', description: '', sequence: 2, tags: [], studentVisible: true, metadata: {} });
    sciId = expectNodeMutation(sci).node.nodeId; currentRevision = expectNodeMutation(sci).versionRevision;

    const alg = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-A', idempotencyKey: 'ik-A', requestHash: 'h-A', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'strand' as CurriculumGraphNodeType, code: 'ALG', title: 'Algebra', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    algId = expectNodeMutation(alg).node.nodeId; currentRevision = expectNodeMutation(alg).versionRevision;

    const num = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-N', idempotencyKey: 'ik-N', requestHash: 'h-N', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'strand' as CurriculumGraphNodeType, code: 'NUM', title: 'Number', description: '', sequence: 2, tags: [], studentVisible: true, metadata: {} });
    numId = expectNodeMutation(num).node.nodeId; currentRevision = expectNodeMutation(num).versionRevision;

    // Add contains edges: ROOT -> MATH, ROOT -> SCI, MATH -> ALG, MATH -> NUM
    const e1 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e1', idempotencyKey: 'e1', requestHash: 'h-e1', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: rootId, toNodeId: mathId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e1).versionRevision;

    const e2 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e2', idempotencyKey: 'e2', requestHash: 'h-e2', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: rootId, toNodeId: sciId, sequence: 2, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e2).versionRevision;

    const e3 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e3', idempotencyKey: 'e3', requestHash: 'h-e3', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: mathId, toNodeId: algId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e3).versionRevision;

    const e4 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e4', idempotencyKey: 'e4', requestHash: 'h-e4', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains' as CurriculumGraphEdgeType, fromNodeId: mathId, toNodeId: numId, sequence: 2, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e4).versionRevision;

    // Add concepts with prerequisites
    const c1 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-C1', idempotencyKey: 'ik-C1', requestHash: 'h-C1', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'concept' as CurriculumGraphNodeType, code: 'FRAC', title: 'Fractions', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    c1Id = expectNodeMutation(c1).node.nodeId; currentRevision = expectNodeMutation(c1).versionRevision;

    const c2 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-C2', idempotencyKey: 'ik-C2', requestHash: 'h-C2', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'concept' as CurriculumGraphNodeType, code: 'DEC', title: 'Decimals', description: '', sequence: 2, tags: [], studentVisible: true, metadata: {} });
    c2Id = expectNodeMutation(c2).node.nodeId; currentRevision = expectNodeMutation(c2).versionRevision;

    const e5 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e5', idempotencyKey: 'e5', requestHash: 'h-e5', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'prerequisite_of' as CurriculumGraphEdgeType, fromNodeId: c1Id, toNodeId: c2Id, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e5).versionRevision;
  });

  it('should return direct children', () => {
    const children = traversal.getChildren('school-a', versionId, rootId);
    expect(children.length).toBe(2);
    expect(children.map(c => c.code)).toContain('MATH');
    expect(children.map(c => c.code)).toContain('SCI');
  });

  it('should return ancestors', () => {
    const ancestors = traversal.getAncestors('school-a', versionId, algId);
    expect(ancestors.length).toBeGreaterThanOrEqual(1);
    expect(ancestors[0].nodeId).toBe(mathId);
  });

  it('should return descendants', () => {
    const desc = traversal.getDescendants('school-a', versionId, rootId, 10);
    expect(desc.nodes.length).toBeGreaterThanOrEqual(4);
    expect(desc.rootNodeId).toBe(rootId);
  });

  it('should enforce depth limit', () => {
    const desc = traversal.getDescendants('school-a', versionId, rootId, 1);
    expect(desc.truncated).toBe(true);
  });

  it('should return direct prerequisites', () => {
    const prereqs = traversal.getDirectPrerequisites('school-a', versionId, c2Id);
    expect(prereqs.length).toBe(1);
    expect(prereqs[0].nodeId).toBe(c1Id);
  });

  it('should return transitive prerequisites', () => {
    // Add another layer: C0 -> C1 -> C2
    const c0 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'cmd-C0', idempotencyKey: 'ik-C0', requestHash: 'h-C0', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'concept' as CurriculumGraphNodeType, code: 'INT', title: 'Integers', description: '', sequence: 0, tags: [], studentVisible: true, metadata: {} });
    const c0Id = expectNodeMutation(c0).node.nodeId;
    commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e0', idempotencyKey: 'e0', requestHash: 'h-e0', expectedRevision: expectNodeMutation(c0).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'prerequisite_of' as CurriculumGraphEdgeType, fromNodeId: c0Id, toNodeId: c1Id, sequence: 1, required: true, rationale: '', metadata: {} });

    const prereqs = traversal.getTransitivePrerequisites('school-a', versionId, c2Id);
    expect(prereqs.length).toBe(2);
  });

  it('should return direct dependents', () => {
    const deps = traversal.getDirectDependents('school-a', versionId, c1Id);
    expect(deps.length).toBe(1);
    expect(deps[0].nodeId).toBe(c2Id);
  });

  it('should return transitive dependents', () => {
    const deps = traversal.getTransitiveDependents('school-a', versionId, c1Id);
    expect(deps.length).toBe(1);
  });

  it('should return deterministic ordering', () => {
    const children1 = traversal.getChildren('school-a', versionId, rootId);
    const children2 = traversal.getChildren('school-a', versionId, rootId);
    expect(children1.map(c => c.nodeId)).toEqual(children2.map(c => c.nodeId));
  });
});