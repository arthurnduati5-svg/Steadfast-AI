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

describe('Curriculum Graph Version Lifecycle', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let actor: CurriculumGraphActorContext;

  beforeEach(() => {
    repo = new InMemoryCurriculumKnowledgeGraphRepository();
    rolePolicy = new CurriculumGraphRolePolicyService();
    lifecycle = new CurriculumGraphVersionLifecycleService();
    clock = new FixedClock('2026-07-26T12:00:00Z');
    idGen = new DeterministicIdGenerator('test');
    validator = new CurriculumGraphValidatorService(repo, clock);
    traversal = new CurriculumGraphTraversalService(repo);
    commandService = new CurriculumGraphCommandService(repo, rolePolicy, lifecycle, validator, traversal, clock, idGen);
    actor = {
      schoolId: 'school-a',
      actorId: 'teacher-1',
      actorRole: 'school_admin',
      requestId: 'req-1',
      correlationId: 'corr-1',
    };
  });

  function createVersion() {
    return commandService.execute({
      commandType: 'CreateCurriculumGraphVersion',
      commandId: 'cmd-1',
      idempotencyKey: 'ik-1',
      requestHash: 'hash-1',
      expectedRevision: 1,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      curriculumKey: 'test-curriculum',
      title: 'Test Curriculum',
      description: 'Test',
      metadata: {},
    });
  }

  it('should create a draft version', () => {
    const r = createVersion();
    expect(r.success).toBe(true);
    if (r.success) {
      expect(expectVersionCreated(r).version.status).toBe('draft');
      expect(expectVersionCreated(r).version.revision).toBe(1);
    }
  });

  it('should transition draft -> under_review', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;
    const { version } = expectVersionCreated(v);
    const r = commandService.execute({
      commandType: 'SubmitCurriculumGraphForReview',
      commandId: 'cmd-2',
      idempotencyKey: 'ik-2',
      requestHash: 'hash-2',
      expectedRevision: 1,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: version.versionId,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(expectLifecycleTransition(r).version.status).toBe('under_review');
  });

  it('should transition under_review -> approved', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;
    const { version: ver } = expectVersionCreated(v);

    // Add root first so validation passes
    const addRoot = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: 'cmd-root',
      idempotencyKey: 'ik-root',
      requestHash: 'hash-root',
      expectedRevision: ver.revision,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: ver.versionId,
      nodeType: 'curriculum_root',
      code: 'ROOT',
      title: 'Root',
      description: '',
      sequence: 0,
      tags: [],
      studentVisible: false,
      metadata: {},
    });
    expect(addRoot.success).toBe(true);
    if (!addRoot.success) return;

    const addSubject = commandService.execute({
      commandType: 'AddCurriculumNode',
      commandId: 'cmd-subj',
      idempotencyKey: 'ik-subj',
      requestHash: 'hash-subj',
      expectedRevision: expectNodeMutation(addRoot).versionRevision,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: ver.versionId,
      nodeType: 'subject',
      code: 'MATH',
      title: 'Math',
      description: '',
      sequence: 1,
      tags: [],
      studentVisible: true,
      metadata: {},
    });
    expect(addSubject.success).toBe(true);
    if (!addSubject.success) return;
    const subjRev = expectNodeMutation(addSubject).versionRevision;

    // Add contains edge so validation passes
    const addEdge = commandService.execute({
      commandType: 'AddCurriculumEdge',
      commandId: 'cmd-edge1',
      idempotencyKey: 'ik-edge1',
      requestHash: 'hash-edge1',
      expectedRevision: subjRev,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: ver.versionId,
      edgeType: 'contains',
      fromNodeId: expectNodeMutation(addRoot).node.nodeId,
      toNodeId: expectNodeMutation(addSubject).node.nodeId,
      sequence: 1, required: true, rationale: '', metadata: {},
    });
    expect(addEdge.success).toBe(true);
    if (!addEdge.success) return;
    const edgeRev = expectEdgeMutation(addEdge).versionRevision;

    // Submit
    const submit = commandService.execute({
      commandType: 'SubmitCurriculumGraphForReview',
      commandId: 'cmd-3',
      idempotencyKey: 'ik-3',
      requestHash: 'hash-3',
      expectedRevision: edgeRev,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: ver.versionId,
    });
    expect(submit.success).toBe(true);
    if (!submit.success) return;

    // Approve
    const approve = commandService.execute({
      commandType: 'ApproveCurriculumGraphVersion',
      commandId: 'cmd-4',
      idempotencyKey: 'ik-4',
      requestHash: 'hash-4',
      expectedRevision: expectLifecycleTransition(submit).version.revision,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: ver.versionId,
    });
    expect(approve.success).toBe(true);
    if (approve.success) expect(expectLifecycleTransition(approve).version.status).toBe('approved');
  });

  it('should transition approved -> active', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;
    const { version: ver } = expectVersionCreated(v);

    // Add valid graph
    const r1 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    expect(r1.success).toBe(true); if (!r1.success) return;
    const r2 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: expectNodeMutation(r1).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, nodeType: 'subject', code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    expect(r2.success).toBe(true); if (!r2.success) return;
    const subRev = expectNodeMutation(r2).versionRevision;

    const r3 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: subRev, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, edgeType: 'contains', fromNodeId: expectNodeMutation(r1).node.nodeId, toNodeId: expectNodeMutation(r2).node.nodeId, sequence: 1, required: true, rationale: '', metadata: {} });
    expect(r3.success).toBe(true); if (!r3.success) return;
    const edgeRev = expectEdgeMutation(r3).versionRevision;

    const submit = commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: edgeRev, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId });
    expect(submit.success).toBe(true); if (!submit.success) return;
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: expectLifecycleTransition(submit).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId });
    expect(approve.success).toBe(true); if (!approve.success) return;

    const activate = commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c5', idempotencyKey: 'k5', requestHash: 'h5', expectedRevision: expectLifecycleTransition(approve).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId });
    expect(activate.success).toBe(true);
    if (activate.success) expect(expectActivation(activate).activatedVersion.status).toBe('active');
  });

  it('should reject invalid lifecycle transitions', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;

    // Can't approve a draft directly
    const approve = commandService.execute({
      commandType: 'ApproveCurriculumGraphVersion',
      commandId: 'cmd-bad',
      idempotencyKey: 'ik-bad',
      requestHash: 'hash-bad',
      expectedRevision: 1,
      actor,
      occurredAt: clock.now(),
      correlationId: 'corr-1',
      versionId: expectVersionCreated(v).version.versionId,
    });
    expect(approve.success).toBe(false);
  });

  it('should make approved and active versions immutable', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;
    const { version: ver } = expectVersionCreated(v);

    // Add nodes, submit, approve
    const r1 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    const r2 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: expectNodeMutation(r1).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, nodeType: 'subject', code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    const r3 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: expectNodeMutation(r2).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, edgeType: 'contains', fromNodeId: expectNodeMutation(r1).node.nodeId, toNodeId: expectNodeMutation(r2).node.nodeId, sequence: 1, required: true, rationale: '', metadata: {} });
    const submit = commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: expectEdgeMutation(r3).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId });
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c5', idempotencyKey: 'k5', requestHash: 'h5', expectedRevision: expectLifecycleTransition(submit).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId });
    expect(approve.success).toBe(true);

    // Try to add a node to the approved version
    const addAfterApprove = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c6', idempotencyKey: 'k6', requestHash: 'h6', expectedRevision: expectLifecycleTransition(approve).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver.versionId, nodeType: 'topic', code: 'NEW', title: 'New', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    expect(addAfterApprove.success).toBe(false);
  });

  it('should allow only one active version per curriculum key', () => {
    const v1 = createVersion();
    expect(v1.success).toBe(true);
    if (!v1.success) return;
    const { version: ver1 } = expectVersionCreated(v1);

    // Complete v1 lifecycle
    const r1 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    const r2 = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c2', idempotencyKey: 'k2', requestHash: 'h2', expectedRevision: expectNodeMutation(r1).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId, nodeType: 'subject', code: 'MATH', title: 'Math', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
    const r3 = commandService.execute({ commandType: 'AddCurriculumEdge', commandId: 'c3', idempotencyKey: 'k3', requestHash: 'h3', expectedRevision: expectNodeMutation(r2).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId, edgeType: 'contains', fromNodeId: expectNodeMutation(r1).node.nodeId, toNodeId: expectNodeMutation(r2).node.nodeId, sequence: 1, required: true, rationale: '', metadata: {} });
    const submit = commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'c4', idempotencyKey: 'k4', requestHash: 'h4', expectedRevision: expectEdgeMutation(r3).versionRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId });
    const approve = commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'c5', idempotencyKey: 'k5', requestHash: 'h5', expectedRevision: expectLifecycleTransition(submit).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId });
    const activate = commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c6', idempotencyKey: 'k6', requestHash: 'h6', expectedRevision: expectLifecycleTransition(approve).version.revision, actor, occurredAt: clock.now(), correlationId: 'c', versionId: ver1.versionId });
    expect(activate.success).toBe(true);

    // Create v2
    const v2 = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'c6', idempotencyKey: 'k6', requestHash: 'h6', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test-curriculum', title: 'V2', description: 'V2', metadata: {} });
    expect(v2.success).toBe(true);
    if (!v2.success) return;

    // Try to activate v2 directly (should fail - not approved)
    const activate2 = commandService.execute({ commandType: 'ActivateCurriculumGraphVersion', commandId: 'c7', idempotencyKey: 'k7', requestHash: 'h7', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId: expectVersionCreated(v2).version.versionId });
    expect(activate2.success).toBe(false);
  });

  it('should increment revision on every mutation', () => {
    const v = createVersion();
    expect(v.success).toBe(true);
    if (!v.success) return;
    expect(expectVersionCreated(v).version.revision).toBe(1);

    const add = commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'c1', idempotencyKey: 'k1', requestHash: 'h1', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId: expectVersionCreated(v).version.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 0, tags: [], studentVisible: false, metadata: {} });
    expect(add.success).toBe(true);
    if (add.success) expect(expectNodeMutation(add).versionRevision).toBe(2);
  });
});
