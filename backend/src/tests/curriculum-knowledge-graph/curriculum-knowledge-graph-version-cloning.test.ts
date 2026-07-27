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

describe('Curriculum Graph Version Cloning', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let commandService: CurriculumGraphCommandService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let actor: CurriculumGraphActorContext;
  let versionId: string;
  let currentRevision: number;

  function addNode(type: CurriculumGraphNodeType, code: string, rev: number) {
    const r = commandService.execute({ commandType: 'AddCurriculumNode', commandId: `cmd-${code}`, idempotencyKey: `ik-${code}`, requestHash: `h-${code}`, expectedRevision: rev, actor, occurredAt: clock.now(), correlationId: 'c', versionId, nodeType: type, code, title: code, description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
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

    const v = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-v', idempotencyKey: 'ik-v', requestHash: 'h-v', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test', title: 'V1', description: '', metadata: {} });
    versionId = expectVersionCreated(v).version.versionId;
    currentRevision = 1;

    // Add structure
    addNode('curriculum_root', 'ROOT', currentRevision);
    addNode('subject', 'MATH', currentRevision);
    addNode('topic', 'ALG', currentRevision);
    addNode('concept', 'VAR', currentRevision);
    addNode('concept', 'EQ', currentRevision);

    // Add contains edges
    addEdge('contains', repo.listNodes('school-a', versionId).find(n => n.code === 'ROOT')!.nodeId, repo.listNodes('school-a', versionId).find(n => n.code === 'MATH')!.nodeId, currentRevision);
    addEdge('contains', repo.listNodes('school-a', versionId).find(n => n.code === 'MATH')!.nodeId, repo.listNodes('school-a', versionId).find(n => n.code === 'ALG')!.nodeId, currentRevision);
    addEdge('contains', repo.listNodes('school-a', versionId).find(n => n.code === 'ALG')!.nodeId, repo.listNodes('school-a', versionId).find(n => n.code === 'VAR')!.nodeId, currentRevision);
    addEdge('contains', repo.listNodes('school-a', versionId).find(n => n.code === 'ALG')!.nodeId, repo.listNodes('school-a', versionId).find(n => n.code === 'EQ')!.nodeId, currentRevision);

    // Submit and approve
    commandService.execute({ commandType: 'SubmitCurriculumGraphForReview', commandId: 'cmd-sub', idempotencyKey: 'ik-sub', requestHash: 'h-sub', expectedRevision: currentRevision, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
    commandService.execute({ commandType: 'ApproveCurriculumGraphVersion', commandId: 'cmd-app', idempotencyKey: 'ik-app', requestHash: 'h-app', expectedRevision: currentRevision + 1, actor, occurredAt: clock.now(), correlationId: 'c', versionId });
  });

  it('should create a draft successor from an approved version', () => {
    const result: any = commandService.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId: 'cmd-succ', idempotencyKey: 'ik-succ', requestHash: 'h-succ', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      sourceVersionId: versionId, title: 'V2', description: 'Successor', metadata: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.successorVersion.status).toBe('draft');
      expect(result.nodesCopied).toBeGreaterThan(0);
      expect(result.edgesCopied).toBeGreaterThan(0);
    }
  });

  it('should clone node identities as version-scoped', () => {
    const result: any = commandService.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId: 'cmd-succ2', idempotencyKey: 'ik-succ2', requestHash: 'h-succ2', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      sourceVersionId: versionId, title: 'V2', description: 'Successor', metadata: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const sourceNodes = repo.listNodes('school-a', versionId);
      const succNodes = repo.listNodes('school-a', result.successorVersion.versionId);
      // IDs should be different
      for (const sn of sourceNodes) {
        expect(succNodes.some(sn2 => sn2.originNodeId === sn.nodeId)).toBe(true);
      }
    }
  });

  it('should preserve lineage through originNodeId', () => {
    const result: any = commandService.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId: 'cmd-succ3', idempotencyKey: 'ik-succ3', requestHash: 'h-succ3', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      sourceVersionId: versionId, title: 'V2', description: 'Successor', metadata: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const succNodes = repo.listNodes('school-a', result.successorVersion.versionId);
      for (const n of succNodes) {
        expect(n.originNodeId).toBeDefined();
      }
    }
  });

  it('should not mutate source version when editing successor', () => {
    const result: any = commandService.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId: 'cmd-succ4', idempotencyKey: 'ik-succ4', requestHash: 'h-succ4', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      sourceVersionId: versionId, title: 'V2', description: 'Successor', metadata: {},
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    const sourceNodesBefore = repo.listNodes('school-a', versionId).length;
    const succId = result.successorVersion.versionId;

    // Add a node to successor
    commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cmd-new', idempotencyKey: 'ik-new', requestHash: 'h-new', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      versionId: succId, nodeType: 'topic' as CurriculumGraphNodeType, code: 'NEW', title: 'New', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });

    const sourceNodesAfter = repo.listNodes('school-a', versionId).length;
    expect(sourceNodesAfter).toBe(sourceNodesBefore);
  });

  it('should reject successor from draft version', () => {
    // Create a fresh draft
    const draft: any = commandService.execute({
      commandType: 'CreateCurriculumGraphVersion', commandId: 'cmd-draft', idempotencyKey: 'ik-draft', requestHash: 'h-draft', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      curriculumKey: 'test2', title: 'Draft', description: '', metadata: {},
    });
    expect(draft.success).toBe(true);
    if (!draft.success) return;

    const result: any = commandService.execute({
      commandType: 'CreateSuccessorCurriculumGraphVersion',
      commandId: 'cmd-bad', idempotencyKey: 'ik-bad', requestHash: 'h-bad', expectedRevision: 1, actor, occurredAt: clock.now(), correlationId: 'c',
      sourceVersionId: draft.version.versionId, title: 'Bad', description: '', metadata: {},
    });
    expect(result.success).toBe(false);
  });
});