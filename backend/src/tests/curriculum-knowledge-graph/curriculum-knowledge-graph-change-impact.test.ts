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

describe('Curriculum Graph Change Impact Analysis', () => {
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
  let rootId: string, mathId: string;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  function addEdge(edgeType: CurriculumGraphEdgeType, f: string, t: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: `cmd-e-${edgeType}-${f}-${t}`, idempotencyKey: `ik-e-${edgeType}-${f}-${t}`, requestHash: `h-e`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType, fromNodeId: f, toNodeId: t, sequence: 1, required: true, rationale: 't', metadata: {} });
    if (r.success) currentRevision = expectEdgeMutation(r).versionRevision;
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

    const root = addNode('curriculum_root', 'ROOT', currentRevision); rootId = expectNodeMutation(root).node.nodeId;
    const math = addNode('subject', 'MATH', currentRevision); mathId = expectNodeMutation(math).node.nodeId;
    const alg = addNode('strand', 'ALG', currentRevision);
    const topic = addNode('topic', 'EQ', currentRevision);
    const lo = addNode('concept', 'CONCEPT1', currentRevision);

    addEdge('contains', rootId, mathId, currentRevision);
    addEdge('contains', mathId, expectNodeMutation(alg).node.nodeId, currentRevision);
    addEdge('contains', expectNodeMutation(alg).node.nodeId, expectNodeMutation(topic).node.nodeId, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, expectNodeMutation(lo).node.nodeId, currentRevision);
  });

  it('should return descendants for a node', () => {
    const impact = traversal.analyzeChangeImpact('school-a', versionId, mathId);
    expect(impact.descendants.length).toBeGreaterThan(0);
    expect(impact.operationType).toBe('update');
  });

  it('should return affected hierarchy paths', () => {
    const impact = traversal.analyzeChangeImpact('school-a', versionId, mathId);
    expect(impact.affectedHierarchyPaths.length).toBeGreaterThan(0);
  });

  it('should be read-only and not mutate the graph', () => {
    const nodesBefore = repo.listNodes('school-a', versionId).length;
    traversal.analyzeChangeImpact('school-a', versionId, mathId);
    const nodesAfter = repo.listNodes('school-a', versionId).length;
    expect(nodesAfter).toBe(nodesBefore);
  });

  it('should return blocked reasons for removal with children', () => {
    const impact = traversal.analyzeChangeImpact('school-a', versionId, mathId, undefined, 'remove');
    expect(impact.blockedOperationReasons.length).toBeGreaterThan(0);
  });
});
