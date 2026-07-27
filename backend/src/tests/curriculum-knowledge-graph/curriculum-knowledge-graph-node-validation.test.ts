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
import type { CurriculumGraphNodeType } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Node Validation', () => {
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
    actor = { schoolId: 'school-a', actorId: 'teacher-1', actorRole: 'school_admin', requestId: 'req-1', correlationId: 'corr-1' };

    const v = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion',
      commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test', title: 'Test', description: '', metadata: {},
    });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;
  });

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number, loMeta?: any) {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`,
      expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {}, learningObjectiveMetadata: loMeta,
    });
    if (r.success) currentRevision = expectNodeMutation(r).versionRevision;
    return r;
  }

  it('should add a valid node', () => {
    const r = addNode('curriculum_root', 'ROOT', currentRevision);
    expect(r.success).toBe(true);
  });

  it('should reject duplicate node code within same type', () => {
    addNode('curriculum_root', 'ROOT', currentRevision);
    const r2 = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: 'cmd-ROOT2', idempotencyKey: 'ik-ROOT2', requestHash: 'h-ROOT2',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'ROOT', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r2.success).toBe(false);
    if (!r2.success) expect(r2.error.code).toBe('CURRICULUM_GRAPH_DUPLICATE_NODE_CODE');
  });

  it('should allow same code for different node types', () => {
    addNode('curriculum_root', 'ROOT', currentRevision);
    const r2 = addNode('subject', 'ROOT', currentRevision);
    expect(r2.success).toBe(true);
  });

  it('should reject empty code', () => {
    const r = addNode('subject', '', currentRevision);
    expect(r.success).toBe(false);
  });

  it('should reject empty title', () => {
    const r = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: 'cmd-bad', idempotencyKey: 'ik-bad', requestHash: 'h-bad',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject', code: 'MATH', title: '', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(false);
  });

  it('should reject stale version revision', () => {
    const r = addNode('curriculum_root', 'ROOT', 999);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_STALE_REVISION');
  });

  it('should reject node mutation on published version', () => {
    // Add valid graph and activate
    addNode('curriculum_root', 'ROOT', currentRevision);
    addNode('subject', 'MATH', currentRevision);
    const edge = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'c-e', idempotencyKey: 'ik-e', requestHash: 'h-e', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains', fromNodeId: repo.listNodes('school-a', versionId).find(n => n.code === 'ROOT')!.nodeId, toNodeId: repo.listNodes('school-a', versionId).find(n => n.code === 'MATH')!.nodeId, sequence: 1, required: true, rationale: '', metadata: {} });
    const submit = commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c-s', idempotencyKey: 'ik-s', requestHash: 'h-s', expectedRevision: expectEdgeMutation(edge).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c-a', idempotencyKey: 'ik-a', requestHash: 'h-a', expectedRevision: expectLifecycleTransition(submit).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
    const activate = commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c-act', idempotencyKey: 'ik-act', requestHash: 'h-act', expectedRevision: expectLifecycleTransition(approve).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });

    // Try adding node to active version
    const addActive = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c-new', idempotencyKey: 'ik-new', requestHash: 'h-new', expectedRevision: expectActivation(activate).activatedVersion.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'topic', code: 'NEW', title: 'New', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    expect(addActive.success).toBe(false);
  });

  it('should reject incomplete learning objective', () => {
    const r = addNode('learning_objective', 'LO-1', currentRevision, {
      objectiveType: 'topic',
      expectedOutcome: '',
      successCriteria: [],
      cognitiveDemand: 'understand',
      demonstrationTypes: [],
      mandatory: true,
      estimatedComplexity: 1,
      teacherGuidance: '',
      studentSafeStatement: '',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.code).toBe('CURRICULUM_GRAPH_OBJECTIVE_INCOMPLETE');
  });

  it('should accept complete learning objective', () => {
    addNode('curriculum_root', 'ROOT', currentRevision);
    const r = addNode('learning_objective', 'LO-1', currentRevision, {
      objectiveType: 'topic',
      expectedOutcome: 'Solve problems',
      successCriteria: ['Can solve'],
      cognitiveDemand: 'apply',
      demonstrationTypes: ['application'],
      mandatory: true,
      estimatedComplexity: 2,
      teacherGuidance: 'Guide them',
      studentSafeStatement: 'I can solve problems.',
    });
    expect(r.success).toBe(true);
  });

  it('should normalize and deduplicate tags', () => {
    addNode('curriculum_root', 'ROOT', currentRevision);
    const r = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: 'cmd-t', idempotencyKey: 'ik-t', requestHash: 'h-t',
      expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId, nodeType: 'subject', code: 'MATH', title: 'Math', description: '', sequence: 1,
      tags: [' math ', 'math', ' algebra ', ''],
      studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(expectNodeMutation(r).node.tags).toEqual(['math', 'algebra']);
    }
  });
});
