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

describe('Curriculum Graph Edge Validation', () => {
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
  let rootId: string;
  let subjId: string;
  let currentRevision: number;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  function addEdge(edgeType: CurriculumGraphEdgeType, fromId: string, toId: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumEdge', commandId: `cmd-e-${edgeType}-${fromId}-${toId}`, idempotencyKey: `ik-e-${edgeType}-${fromId}-${toId}`, requestHash: `h-e`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, edgeType: edgeType, fromNodeId: fromId, toNodeId: toId, sequence: 1, required: true, rationale: 'test', metadata: {},
    });
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

    const v = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;

    // Setup nodes
    const root = addNode('curriculum_root', 'ROOT', currentRevision);
    rootId = expectNodeMutation(root).node.nodeId;
    const subj = addNode('subject', 'MATH', currentRevision);
    subjId = expectNodeMutation(subj).node.nodeId;
  });

  it('should add a valid contains edge', () => {
    const r = addEdge('contains', rootId, subjId, currentRevision);
    expect(r.success).toBe(true);
  });

  it('should reject self-edge', () => {
    const r = addEdge('contains', rootId, rootId, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_SELF_EDGE');
  });

  it('should reject edge with missing endpoint', () => {
    const r = addEdge('contains', rootId, 'nonexistent', currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_INVALID_EDGE_ENDPOINT');
  });

  it('should reject duplicate semantic edge', () => {
    addEdge('contains', rootId, subjId, currentRevision);
    const r2 = commandService.execute({
      commandType: 'AddCurriculumEdge', commandId: 'cmd-e-dup', idempotencyKey: 'ik-e-dup', requestHash: 'h-e-dup',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, edgeType: 'contains', fromNodeId: rootId, toNodeId: subjId, sequence: 1, required: true, rationale: 'test', metadata: {},
    });
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.code).toBe('CURRICULUM_GRAPH_DUPLICATE_EDGE');
  });

  it('should allow different edge types between same nodes', () => {
    addEdge('contains', rootId, subjId, currentRevision);
    // related_to is fine between same nodes
    const r2 = addEdge('related_to', rootId, subjId, currentRevision);
    expect(r2.success).toBe(true);
  });

  it('should reject invalid objective_targets_concept endpoint types', () => {
    const r = addEdge('objective_targets_concept', rootId, subjId, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_INVALID_EDGE_TYPE');
  });

  it('should reject invalid objective_develops_skill endpoint types', () => {
    const r = addEdge('objective_develops_skill', rootId, subjId, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_INVALID_EDGE_TYPE');
  });

  it('should accept valid prerequisite_of between compatible types', () => {
    addEdge('contains', rootId, subjId, currentRevision);
    // Add two concepts
    const c1 = addNode('concept', 'C1', currentRevision);
    const c2 = addNode('concept', 'C2', currentRevision);
    const c1Id = expectNodeMutation(c1).node.nodeId;
    const c2Id = expectNodeMutation(c2).node.nodeId;
    const r = addEdge('prerequisite_of', c1Id, c2Id, currentRevision);
    expect(r.success).toBe(true);
  });

  it('should reject stale revision for edge addition', () => {
    const r = addEdge('contains', rootId, subjId, 999);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_STALE_REVISION');
  });
});
