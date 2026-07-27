import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';
import { requireSuccess, expectVersionCreated, expectNodeMutation, expectEdgeMutation } from './curriculum-graph-test-helpers';
import type { CurriculumGraphNodeType, CurriculumGraphEdgeType } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Learning Path', () => {
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
  let currentRevision: number;
  let c1: string, c2: string, c3: string;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  function addEdge(edgeType: CurriculumGraphEdgeType, f: string, t: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: `cmd-e-${edgeType}-${f}-${t}`, idempotencyKey: `ik-e-${edgeType}-${f}-${t}`, requestHash: `h-e`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType, fromNodeId: f, toNodeId: t, sequence: 1, required: true, rationale: 't', metadata: {} });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
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
    actor = { schoolId: 'school-a', actorId: 'admin', actorRole: 'school_admin', requestId: 'req-1', correlationId: 'corr-1' };

    const v = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test', title: 'Test', description: '', metadata: {} });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;

    const a = addNode('concept', 'C1', currentRevision); c1 = expectNodeMutation(a).node.nodeId;
    const b = addNode('concept', 'C2', currentRevision); c2 = expectNodeMutation(b).node.nodeId;
    const d = addNode('concept', 'C3', currentRevision); c3 = expectNodeMutation(d).node.nodeId;

    // Setup: C1 -> C2 -> C3, and C3 targets LO1
    addEdge('prerequisite_of', c1, c2, currentRevision);
    addEdge('prerequisite_of', c2, c3, currentRevision);
  });

  it('should return ready for target with no prerequisites', () => {
    const path = traversal.resolveStructuralLearningPath('school-a', versionId, c1, [], 50);
    expect(path.pathStatus).toBe('ready');
    expect(path.reasonCodes).toContain('no_prerequisites');
  });

  it('should return prerequisites_required for target with prerequisites', () => {
    const path = traversal.resolveStructuralLearningPath('school-a', versionId, c3, [], 50);
    expect(path.pathStatus).toBe('prerequisites_required');
    expect(path.prerequisiteCount).toBeGreaterThan(0);
  });

  it('should exclude starting foundations from prerequisites', () => {
    const path = traversal.resolveStructuralLearningPath('school-a', versionId, c3, [c1], 50);
    expect(path.startingFoundations).toContain(c1);
    expect(path.orderedNodes.length).toBeLessThan(3);
  });

  it('should return blocked for cyclic graph', () => {
    // Add cycle edge directly via repo (bypasses command service cycle check)
    repo.saveEdge({
      edgeId: 'cycle-edge', schoolId: 'school-a', versionId,
      edgeType: 'prerequisite_of', fromNodeId: c3, toNodeId: c1,
      sequence: 1, required: true, rationale: '', createdBy: 'admin',
      createdAt: clock.now(), revision: 1, metadata: {},
    });
    const path = traversal.resolveStructuralLearningPath('school-a', versionId, c3, [], 50);
    expect(path.pathStatus).toBe('blocked');
    expect(path.reasonCodes).toContain('prerequisite_cycle');
  });

  it('should return deterministic order', () => {
    const path1 = traversal.resolveStructuralLearningPath('school-a', versionId, c3, [], 50);
    const path2 = traversal.resolveStructuralLearningPath('school-a', versionId, c3, [], 50);
    expect(path1.orderedNodes.map(n => n.nodeId)).toEqual(path2.orderedNodes.map(n => n.nodeId));
  });
});
