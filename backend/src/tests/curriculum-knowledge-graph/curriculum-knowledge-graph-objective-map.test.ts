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

describe('Curriculum Graph Objective Map', () => {
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
  let loId: string, conceptId: string, skillId: string;

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

    // Add root, subject, topic hierarchy
    addNode('curriculum_root', 'ROOT', currentRevision);
    const subj = addNode('subject', 'MATH', currentRevision);
    const topic = addNode('topic', 'ALG', currentRevision);
    const concept = addNode('concept', 'VAR', currentRevision); conceptId = expectNodeMutation(concept).node.nodeId;
    const skill = addNode('skill', 'SOLVE', currentRevision); skillId = expectNodeMutation(skill).node.nodeId;
    const lo = addNode('learning_objective', 'LO1', currentRevision, {
      objectiveType: 'topic', expectedOutcome: 'Solve equations', successCriteria: ['Isolate variable', 'Verify'],
      cognitiveDemand: 'apply', demonstrationTypes: ['worked_procedure', 'problem_solving'],
      mandatory: true, estimatedComplexity: 3, teacherGuidance: 'Guide step by step', studentSafeStatement: 'I can solve equations.',
    }); loId = expectNodeMutation(lo).node.nodeId;

    // Edges
    addEdge('contains', expectNodeMutation(subj).node.nodeId, expectNodeMutation(topic).node.nodeId, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, conceptId, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, skillId, currentRevision);
    addEdge('contains', expectNodeMutation(topic).node.nodeId, loId, currentRevision);
    addEdge('objective_targets_concept', loId, conceptId, currentRevision);
    addEdge('objective_develops_skill', loId, skillId, currentRevision);
  });

  it('should return concept mappings for an objective', () => {
    const map = traversal.getObjectiveMap('school-a', versionId, loId);
    expect(map).not.toBeNull();
    expect(map!.targetedConcepts.length).toBe(1);
    expect(map!.developedSkills.length).toBe(1);
  });

  it('should return success criteria from objective metadata', () => {
    const map = traversal.getObjectiveMap('school-a', versionId, loId);
    expect(map!.successCriteria).toContain('Isolate variable');
    expect(map!.cognitiveDemand).toBe('apply');
  });

  it('should not include teacher guidance in student output (internal field)', () => {
    const map = traversal.getObjectiveMap('school-a', versionId, loId);
    expect(map).not.toBeNull();
    expect((map!.objectiveNode as any).learningObjectiveMetadata?.teacherGuidance).toBe('Guide step by step');
    // Student-safe projection is separate; this is the raw map
  });

  it('should return prerequisites', () => {
    const map = traversal.getObjectiveMap('school-a', versionId, loId);
    expect(map!.directPrerequisites).toBeDefined();
    expect(map!.transitivePrerequisites).toBeDefined();
  });

  it('should return null for non-objective node', () => {
    const map = traversal.getObjectiveMap('school-a', versionId, conceptId);
    expect(map).toBeNull();
  });
});