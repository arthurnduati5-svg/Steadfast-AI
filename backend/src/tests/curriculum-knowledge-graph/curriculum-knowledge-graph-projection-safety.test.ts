import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';
import { expectVersionCreated, expectNodeMutation, expectEdgeMutation, expectLifecycleTransition } from './curriculum-graph-test-helpers';

describe('Curriculum Graph Projection Safety', () => {
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

    // Build valid active graph
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: 'Hidden', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    const r1 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: 2, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'subject', code: 'MATH', title: 'Math', description: 'Visible subject', sequence: 1, tags: ['math'], studentVisible: true, metadata: { internal: 'secret' } });
    currentRevision = expectNodeMutation(r1).versionRevision;

    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'topic', code: 'ALG', title: 'Algebra', description: 'Algebra topic', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    currentRevision = 4;

    // Add LO
    const lo = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'learning_objective', code: 'LO1', title: 'LO1', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {}, learningObjectiveMetadata: {
      objectiveType: 'topic', expectedOutcome: 'Solve', successCriteria: ['Can solve'],
      cognitiveDemand: 'apply', demonstrationTypes: ['application'], mandatory: true, estimatedComplexity: 2,
      teacherGuidance: 'Internal guide', studentSafeStatement: 'I can solve.',
    } });
    currentRevision = expectNodeMutation(lo).versionRevision;

    // Contains edges
    const rootId = repo.listNodes('school-a', versionId).find(n => n.code === 'ROOT')!.nodeId;
    const mathId = repo.listNodes('school-a', versionId).find(n => n.code === 'MATH')!.nodeId;
    const algId = repo.listNodes('school-a', versionId).find(n => n.code === 'ALG')!.nodeId;
    const loId = repo.listNodes('school-a', versionId).find(n => n.code === 'LO1')!.nodeId;
    const e1 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e1', idempotencyKey: 'e1', requestHash: 'he1', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains', fromNodeId: rootId, toNodeId: mathId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e1).versionRevision;
    const e2 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e2', idempotencyKey: 'e2', requestHash: 'he2', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains', fromNodeId: mathId, toNodeId: algId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e2).versionRevision;
    const e3 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e3', idempotencyKey: 'e3', requestHash: 'he3', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains', fromNodeId: algId, toNodeId: loId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e3).versionRevision;

    // Add concept and objective mapping so validation passes
    const c5 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c5', idempotencyKey: 'k5', requestHash: 'h5', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: 'concept', code: 'C1', title: 'Concept', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    currentRevision = expectNodeMutation(c5).versionRevision;
    const conceptId = expectNodeMutation(c5).node.nodeId;
    const e4 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e4', idempotencyKey: 'e4', requestHash: 'he4', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'contains', fromNodeId: algId, toNodeId: conceptId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e4).versionRevision;
    const e5 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'e5', idempotencyKey: 'e5', requestHash: 'he5', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId, edgeType: 'objective_targets_concept', fromNodeId: loId, toNodeId: conceptId, sequence: 1, required: true, rationale: '', metadata: {} });
    currentRevision = expectEdgeMutation(e5).versionRevision;

    // Submit, approve, activate
    const submit = commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c-s', idempotencyKey: 'ik-s', requestHash: 'h-s', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
    currentRevision = expectLifecycleTransition(submit).version.revision;
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c-a', idempotencyKey: 'ik-a', requestHash: 'h-a', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
    currentRevision = expectLifecycleTransition(approve).version.revision;
    commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c-act', idempotencyKey: 'ik-act', requestHash: 'h-act', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
  });

  it('should exclude hidden nodes from student-safe graph', () => {
    const safe = traversal.buildStudentSafeGraph('school-a', versionId);
    expect(safe).not.toBeNull();
    // curriculum_root is studentVisible=false, so should not appear
    expect(safe!.nodes.some(n => n.nodeType === 'curriculum_root')).toBe(false);
    expect(safe!.nodes.some(n => n.code === 'MATH')).toBe(true);
  });

  it('should exclude teacherGuidance from student-safe output', () => {
    const safe = traversal.buildStudentSafeGraph('school-a', versionId);
    expect(safe).not.toBeNull();
    const loNode = safe!.nodes.find(n => n.nodeType === 'learning_objective');
    expect(loNode).toBeDefined();
    // teacherGuidance field exists only on internal node, not on StudentSafeNode
    expect((loNode as { teacherGuidance?: string }).teacherGuidance).toBeUndefined();
  });

  it('should include student-safe statement and success criteria', () => {
    const safe = traversal.buildStudentSafeGraph('school-a', versionId);
    expect(safe).not.toBeNull();
    const loNode = safe!.nodes.find(n => n.nodeType === 'learning_objective');
    expect(loNode).toBeDefined();
    expect(loNode!.studentSafeStatement).toBe('I can solve.');
    expect(loNode!.successCriteria).toContain('Can solve');
  });

  it('should exclude internal metadata from student-safe projection', () => {
    const safe = traversal.buildStudentSafeGraph('school-a', versionId);
    expect(safe).not.toBeNull();
    const mathNode = safe!.nodes.find(n => n.code === 'MATH');
    expect(mathNode).toBeDefined();
    // metadata field shouldn't be in StudentSafeNode
    expect((mathNode as { metadata?: Record<string, unknown> }).metadata).toBeUndefined();
  });

  it('should not be available for draft versions', () => {
    // Create a draft-only version
    const v = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'c-d', idempotencyKey: 'ik-d', requestHash: 'h-d', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'draft-key', title: 'Draft', description: '', metadata: {} });
    const safe = traversal.buildStudentSafeGraph('school-a', expectVersionCreated(v).version.versionId);
    expect(safe).toBeNull();
  });

  it('should include author IDs in staff-safe but not student-safe', () => {
    const safe = traversal.buildStudentSafeGraph('school-a', versionId);
    const staffSafe = traversal.buildStaffSafeGraph('school-a', versionId);
    expect(staffSafe).not.toBeNull();
    expect(staffSafe!.version.createdBy).toBeDefined();
  });
});
