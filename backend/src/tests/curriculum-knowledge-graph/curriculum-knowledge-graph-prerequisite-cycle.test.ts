import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Prerequisite Cycle Detection', () => {
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
  let c1: string, c2: string, c3: string, c4: string;

  function addNode(type: string, code: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: type as any, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    if (r.success) currentRevision = (r as any).versionRevision;
    return r;
  }

  function addEdge(et: string, f: string, t: string, rev: number) {
    const r = commandService.execute({
      commandType: 'AddCurriculumEdge', commandId: `cmd-e-${et}-${f}-${t}`, idempotencyKey: `ik-e-${et}-${f}-${t}`, requestHash: `h-e`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, edgeType: et as any, fromNodeId: f, toNodeId: t, sequence: 1, required: true, rationale: 't', metadata: {},
    });
    if (r.success) currentRevision = (r as any).versionRevision;
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
    versionId = (v as any).version.versionId;
    currentRevision = 1;

    const r = addNode('concept', 'C1', currentRevision); c1 = (r as any).node.nodeId;
    const a = addNode('concept', 'C2', currentRevision); c2 = (a as any).node.nodeId;
    const b = addNode('concept', 'C3', currentRevision); c3 = (b as any).node.nodeId;
    const d = addNode('concept', 'C4', currentRevision); c4 = (d as any).node.nodeId;

    addEdge('prerequisite_of', c1, c2, currentRevision);
    addEdge('prerequisite_of', c2, c3, currentRevision);
  });

  it('should reject direct prerequisite cycle', () => {
    const r = addEdge('prerequisite_of', c3, c2, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_PREREQUISITE_CYCLE');
  });

  it('should reject transitive prerequisite cycle', () => {
    const r = addEdge('prerequisite_of', c3, c1, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_PREREQUISITE_CYCLE');
  });

  it('should accept non-cyclic prerequisites', () => {
    // Chain: C1 -> C2 -> C3 -> C4 is fine
    const r = addEdge('prerequisite_of', c3, c4, currentRevision);
    expect(r.success).toBe(true);
  });

  it('should not confuse builds_on with prerequisite cycle', () => {
    // builds_on should not create false cycle detection
    const r = addEdge('builds_on', c3, c2, currentRevision);
    // builds_on from c3 to c2 should be accepted since it's not prerequisite_of
    expect(r.success).toBe(true);
  });

  it('should reject cycle added at end of chain', () => {
    addEdge('prerequisite_of', c3, c4, currentRevision);
    const r = addEdge('prerequisite_of', c4, c1, currentRevision);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_PREREQUISITE_CYCLE');
  });

  it('should detect cycle in validation', () => {
    // Add cycle edge directly via repo (bypasses command service cycle check)
    repo.saveEdge({
      edgeId: 'cycle-edge', schoolId: 'school-a', versionId,
      edgeType: 'prerequisite_of', fromNodeId: c3, toNodeId: c2,
      sequence: 1, required: true, rationale: '', createdBy: 'admin',
      createdAt: clock.now(), revision: 1, metadata: {},
    });
    const validation = validator.validateVersion(versionId, 'school-a');
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.code === 'CURRICULUM_GRAPH_PREREQUISITE_CYCLE')).toBe(true);
  });
});
