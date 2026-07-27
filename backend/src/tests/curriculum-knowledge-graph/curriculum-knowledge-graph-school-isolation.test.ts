import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { CurriculumGraphQueryService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphQueryService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext, CurriculumGraphQueryContext, ActorRole } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';
import { requireSuccess, expectVersionCreated, expectNodeMutation } from './curriculum-graph-test-helpers';

describe('Curriculum Graph School Isolation', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let queryService: CurriculumGraphQueryService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;

  function actorA(role: ActorRole = 'school_admin'): CurriculumGraphActorContext {
    return { schoolId: 'school-a', actorId: 'admin-a', actorRole: role, requestId: 'req', correlationId: 'corr' };
  }

  function actorB(role: ActorRole = 'school_admin'): CurriculumGraphActorContext {
    return { schoolId: 'school-b', actorId: 'admin-b', actorRole: role, requestId: 'req', correlationId: 'corr' };
  }

  function queryCtx(schoolId: string, role: ActorRole = 'school_admin'): CurriculumGraphQueryContext {
    return { schoolId, actorId: `admin-${schoolId}`, actorRole: role, requestId: 'req', correlationId: 'corr' };
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
    queryService = new CurriculumGraphQueryService(repo, rolePolicy, traversal);

    // Create versions for both schools with same code
    const va = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'va', idempotencyKey: 'ika', requestHash: 'ha', expectedRevision: 1, actor: actorA(), occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test', title: 'School A', description: '', metadata: {} });
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'na', idempotencyKey: 'ika2', requestHash: 'ha2', expectedRevision: 1, actor: actorA(), occurredAt: clock.now(), correlationId: 'c', versionId: expectVersionCreated(va).version.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });

    const vb = commandService.execute({ commandType: 'CreateCurriculumGraphVersion', commandId: 'vb', idempotencyKey: 'ikb', requestHash: 'hb', expectedRevision: 1, actor: actorB(), occurredAt: clock.now(), correlationId: 'c', curriculumKey: 'test', title: 'School B', description: '', metadata: {} });
    commandService.execute({ commandType: 'AddCurriculumNode', commandId: 'nb', idempotencyKey: 'ikb2', requestHash: 'hb2', expectedRevision: 1, actor: actorB(), occurredAt: clock.now(), correlationId: 'c', versionId: expectVersionCreated(vb).version.versionId, nodeType: 'curriculum_root', code: 'ROOT', title: 'Root', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {} });
  });

  it('should isolate versions between schools', () => {
    const aVersions = queryService.listVersions(queryCtx('school-a'));
    const bVersions = queryService.listVersions(queryCtx('school-b'));
    expect(aVersions.length).toBe(1);
    expect(bVersions.length).toBe(1);
    // Each should have exactly 1 version for their own school
    expect(aVersions.every(v => v.schoolId === 'school-a')).toBe(true);
    expect(bVersions.every(v => v.schoolId === 'school-b')).toBe(true);
  });

  it('should not allow cross-school reads by empty school context', () => {
    const result = queryService.listVersions(queryCtx(''));
    expect(result.length).toBe(0);
  });

  it('should allow same codes across schools', () => {
    const aNodes = repo.listNodes('school-a', repo.listVersions('school-a')[0].versionId);
    const bNodes = repo.listNodes('school-b', repo.listVersions('school-b')[0].versionId);
    const aCodes = aNodes.map(n => n.code);
    const bCodes = bNodes.map(n => n.code);
    // Both have code 'ROOT' without conflict
    expect(aCodes).toContain('ROOT');
    expect(bCodes).toContain('ROOT');
  });

  it('should deny editing school B while acting as school A', () => {
    const bVersions = repo.listVersions('school-b');
    const bVersionId = bVersions[0].versionId;
    const r = commandService.execute({
      commandType: 'AddCurriculumNode', commandId: 'cx', idempotencyKey: 'ikx', requestHash: 'hx', expectedRevision: 1, actor: actorA(), occurredAt: clock.now(), correlationId: 'c',
      versionId: bVersionId, nodeType: 'subject', code: 'HACK', title: 'Hack', description: '', sequence: 1, tags: [], studentVisible: true, metadata: {},
    });
    expect(r.success).toBe(false);
  });
});
