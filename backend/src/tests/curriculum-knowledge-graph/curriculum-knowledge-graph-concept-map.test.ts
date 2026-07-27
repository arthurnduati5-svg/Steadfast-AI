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

describe('Curriculum Graph Concept Map', () => {
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
  let c1: string, c2: string, c3: string, loId: string;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number, loMeta?: any) {
    const r = commandService.execute({ commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {}, learningObjectiveMetadata: loMeta });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  function addEdge(et: CurriculumGraphEdgeType, f: string, t: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: `cmd-e-${et}-${f}-${t}`, idempotencyKey: `ik-e-${et}-${f}-${t}`, requestHash: `h-e`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: et, fromNodeId: f, toNodeId: t, sequence: 1, required: true, rationale: 't', metadata: {} });
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

    addNode('curriculum_root', 'ROOT', currentRevision);
    const subj = addNode('subject', 'MATH', currentRevision);
    const topic = addNode('topic', 'ALG', currentRevision);
    const a = addNode('concept', 'C1', currentRevision); c1 = expectNodeMutation(a).node.nodeId;
    const b = addNode('concept', 'C2', currentRevision); c2 = expectNodeMutation(b).node.nodeId;
    const d = addNode('concept', 'C3', currentRevision); c3 = expectNodeMutation(d).node.nodeId;

    const lo = addNode('learning_objective', 'LO1', currentRevision, {
      objectiveType: 'topic', expectedOutcome: 'Outcome', successCriteria: ['C1'], cognitiveDemand: 'understand', demonstrationTypes: ['recall'], mandatory: true, estimatedComplexity: 1, teacherGuidance: 'Guide', studentSafeStatement: 'I can.',
    }); loId = expectNodeMutation(lo).node.nodeId;

    addEdge('contains', expectNodeMutation(subj).node.nodeId, expectNodeMutation(topic).node.nodeId, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, c1, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, c2, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, c3, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, loId, currentRevision);

    addEdge('prerequisite_of', c1, c2, currentRevision);
    addEdge('prerequisite_of', c2, c3, currentRevision);
    addEdge('objective_targets_concept', loId, c1, currentRevision);
    addEdge('builds_on', c1, c2, currentRevision);
    addEdge('related_to', c1, c3, currentRevision);
  });

  it('should return prerequisite concepts', () => {
    const map = traversal.getConceptMap('school-a', versionId, c2);
    expect(map).not.toBeNull();
    expect(map!.prerequisiteConcepts.length).toBe(1);
    expect(map!.prerequisiteConcepts[0].nodeId).toBe(c1);
  });

  it('should return dependent concepts', () => {
    const map = traversal.getConceptMap('school-a', versionId, c1);
    expect(map!.dependentConcepts.length).toBe(1);
    expect(map!.dependentConcepts[0].nodeId).toBe(c2);
  });

  it('should return targeting objectives', () => {
    const map = traversal.getConceptMap('school-a', versionId, c1);
    expect(map!.targetingObjectives.length).toBe(1);
    expect(map!.targetingObjectives[0].nodeId).toBe(loId);
  });

  it('should return related concepts', () => {
    const map = traversal.getConceptMap('school-a', versionId, c1);
    expect(map!.relatedConcepts.length).toBe(1);
  });

  it('should return build-on relationships', () => {
    const map = traversal.getConceptMap('school-a', versionId, c1);
    expect(map!.buildOnRelationships.length).toBe(1);
  });

  it('should return hierarchy location', () => {
    const map = traversal.getConceptMap('school-a', versionId, c1);
    expect(map!.hierarchyLocation.length).toBeGreaterThan(0);
  });

  it('should return null for non-concept node', () => {
    const map = traversal.getConceptMap('school-a', versionId, loId);
    expect(map).toBeNull();
  });
});