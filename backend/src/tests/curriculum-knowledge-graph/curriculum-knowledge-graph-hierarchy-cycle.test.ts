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

describe('Curriculum Graph Hierarchy Cycle Detection', () => {
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
  let n1: string, n2: string, n3: string, n4: string;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  function addEdge(edgeType: CurriculumGraphEdgeType, f: string, t: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumEdge', commandId: `cmd-e-${edgeType}-${f}-${t}`, idempotencyKey: `ik-e-${edgeType}-${f}-${t}`, requestHash: `h-e`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, edgeType, fromNodeId: f, toNodeId: t, sequence: 1, required: true, rationale: 't', metadata: {},
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

    // Setup linear chain: root -> subject -> topic -> subtopic (valid hierarchy)
    const r = addNode('curriculum_root', 'ROOT', currentRevision); n1 = expectNodeMutation(r).node.nodeId;
    const a = addNode('subject', 'A', currentRevision); n2 = expectNodeMutation(a).node.nodeId;
    const b = addNode('topic', 'B', currentRevision); n3 = expectNodeMutation(b).node.nodeId;
    const c = addNode('subtopic', 'C', currentRevision); n4 = expectNodeMutation(c).node.nodeId;

    addEdge('contains', n1, n2, currentRevision);
    addEdge('contains', n2, n3, currentRevision);
    addEdge('contains', n3, n4, currentRevision);
  });

  it('should reject direct contains cycle (a -> b, b -> a)', () => {
    const r = addEdge('contains', n4, n3, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_HIERARCHY_CYCLE');
  });

  it('should reject indirect contains cycle', () => {
    const r = addEdge('contains', n4, n2, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_HIERARCHY_CYCLE');
  });

  it('should detect multiple roots via validation', () => {
    const r = addNode('curriculum_root', 'ROOT2', currentRevision);
    expect(r.success).toBe(true);
    const validation = validator.validateVersion(versionId, 'school-a');
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.code === 'MULTIPLE_ROOTS')).toBe(true);
  });

  it('should detect orphan nodes via validation', () => {
    const orphan = addNode('topic', 'ORPHAN', currentRevision);
    expect(orphan.success).toBe(true);
    const validation = validator.validateVersion(versionId, 'school-a');
    expect(validation.errors.some(e => e.code === 'CURRICULUM_GRAPH_ORPHAN_NODE')).toBe(true);
  });

  it('should detect missing root via validation', () => {
    const repo2 = new InMemoryCurriculumKnowledgeGraphRepository();
    const v2 = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v2', idempotencyKey: 'ik-v2', requestHash: 'h-v2', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test2', title: 'Test2', description: '', metadata: {},
    });
    const v2id = expectVersionCreated(v2).version.versionId;
    const validation = validator.validateVersion(v2id, 'school-a');
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.code === 'MISSING_ROOT')).toBe(true);
  });

  it('should validate correctly for a valid hierarchy', () => {
    const validation = validator.validateVersion(versionId, 'school-a');
    // Should pass - ROOT -> A -> B -> C -> D is a valid chain
    // But we need contains edges from root to subject which is valid
    expect(validation.valid).toBe(true);
  });
});
