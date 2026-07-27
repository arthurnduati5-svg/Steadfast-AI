import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { CurriculumGraphSeedService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphSeedService';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Seeds', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let seedService: CurriculumGraphSeedService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let actorA: CurriculumGraphActorContext;
  let actorB: CurriculumGraphActorContext;

  beforeEach(() => {
    repo = new InMemoryCurriculumKnowledgeGraphRepository();
    rolePolicy = new CurriculumGraphRolePolicyService();
    lifecycle = new CurriculumGraphVersionLifecycleService();
    clock = new FixedClock('2026-07-26T12:00:00Z');
    idGen = new DeterministicIdGenerator('seed');
    validator = new CurriculumGraphValidatorService(repo, clock);
    traversal = new CurriculumGraphTraversalService(repo);
    commandService = new CurriculumGraphCommandService(repo, rolePolicy, lifecycle, validator, traversal, clock, idGen);
    seedService = new CurriculumGraphSeedService(commandService, repo, clock, idGen);
    actorA = { schoolId: 'seed-school-a', actorId: 'seed-actor', actorRole: 'internal_operator', requestId: 'seed-req', correlationId: 'seed-corr' };
    actorB = { schoolId: 'seed-school-b', actorId: 'seed-actor', actorRole: 'internal_operator', requestId: 'seed-req', correlationId: 'seed-corr' };
  });

  it('should seed School A with an active version', () => {
    const summary = seedService.seedSchoolA(actorA);
    expect(summary.versionsCreated).toBe(2);
    expect(summary.nodesCreated).toBeGreaterThan(0);
    expect(summary.edgesCreated).toBeGreaterThan(0);
    expect(summary.replayed).toBe(false);
    expect(summary.idempotent).toBe(false);

    const versions = repo.listVersions('seed-school-a');
    expect(versions.length).toBeGreaterThanOrEqual(1);
    const active = versions.find(v => v.status === 'active');
    expect(active).toBeDefined();
  });

  it('should seed School B with an active version', () => {
    const summary = seedService.seedSchoolB(actorB);
    expect(summary.versionsCreated).toBe(1);
    expect(summary.replayed).toBe(false);
    expect(summary.idempotent).toBe(false);
  });

  it('should keep School A and School B isolated', () => {
    seedService.seedSchoolA(actorA);
    seedService.seedSchoolB(actorB);

    const aVersions = repo.listVersions('seed-school-a');
    const bVersions = repo.listVersions('seed-school-b');
    expect(aVersions.length).toBeGreaterThan(0);
    expect(bVersions.length).toBeGreaterThan(0);
    expect(aVersions.every(v => v.schoolId === 'seed-school-a')).toBe(true);
    expect(bVersions.every(v => v.schoolId === 'seed-school-b')).toBe(true);
  });

  it('should not auto-seed at import time', () => {
    const versionsBefore = repo.listVersions('seed-school-a');
    expect(versionsBefore.length).toBe(0);
  });

  it('should be idempotent when seed commands are replayed for School A', () => {
    const s1 = seedService.seedSchoolA(actorA);
    expect(s1.nodesCreated).toBeGreaterThan(0);
    expect(s1.replayed).toBe(false);

    const s2 = seedService.seedSchoolA(actorA);
    expect(s2.versionsCreated).toBe(0);
    expect(s2.nodesCreated).toBe(0);
    expect(s2.edgesCreated).toBe(0);
    expect(s2.replayed).toBe(true);
    expect(s2.idempotent).toBe(true);

    const v1Versions = repo.listVersions('seed-school-a');
    expect(v1Versions.length).toBe(2);
  });

  it('should not create duplicate version on replay', () => {
    seedService.seedSchoolA(actorA);
    seedService.seedSchoolA(actorA);

    const versions = repo.listVersions('seed-school-a');
    const activeVersions = versions.filter(v => v.status === 'active');
    expect(activeVersions.length).toBe(1);
  });

  it('should not create duplicate nodes on replay', () => {
    seedService.seedSchoolA(actorA);
    const nodesAfterFirst = repo.listNodes('seed-school-a', repo.listVersions('seed-school-a')[0].versionId);
    const firstCount = nodesAfterFirst.length;

    seedService.seedSchoolA(actorA);
    const versions = repo.listVersions('seed-school-a');
    const nodesAfterSecond = repo.listNodes('seed-school-a', versions[0].versionId);
    expect(nodesAfterSecond.length).toBe(firstCount);
  });

  it('should not create duplicate edges on replay', () => {
    seedService.seedSchoolA(actorA);
    const versions = repo.listVersions('seed-school-a');
    const edgesAfterFirst = repo.listEdges('seed-school-a', versions[0].versionId);
    const firstCount = edgesAfterFirst.length;

    seedService.seedSchoolA(actorA);
    const edgesAfterSecond = repo.listEdges('seed-school-a', versions[0].versionId);
    expect(edgesAfterSecond.length).toBe(firstCount);
    expect(firstCount).toBeGreaterThan(0);
  });

  it('should preserve the same active version ID on replay', () => {
    const s1 = seedService.seedSchoolA(actorA);
    const s2 = seedService.seedSchoolA(actorA);
    expect(s2.activeVersionId).toBe(s1.activeVersionId);
  });

  it('should preserve the same draft successor on replay', () => {
    const s1 = seedService.seedSchoolA(actorA);
    const s2 = seedService.seedSchoolA(actorA);
    expect(s2.draftSuccessorVersionId).toBe(s1.draftSuccessorVersionId);
  });

  it('should not advance version revisions on identical replay', () => {
    seedService.seedSchoolA(actorA);
    const versionsAfterFirst = repo.listVersions('seed-school-a');
    const activeAfterFirst = versionsAfterFirst.find(v => v.status === 'active')!;
    const firstRevision = activeAfterFirst.revision;

    seedService.seedSchoolA(actorA);
    const versionsAfterSecond = repo.listVersions('seed-school-a');
    const activeAfterSecond = versionsAfterSecond.find(v => v.status === 'active')!;
    expect(activeAfterSecond.revision).toBe(firstRevision);
  });

  it('should keep graph snapshots equal after replay', () => {
    seedService.seedSchoolA(actorA);
    const versions1 = repo.listVersions('seed-school-a');
    const vId1 = versions1[0].versionId;
    const snap1 = {
      nodes: JSON.parse(JSON.stringify(repo.listNodes('seed-school-a', vId1))),
      edges: JSON.parse(JSON.stringify(repo.listEdges('seed-school-a', vId1))),
    };

    seedService.seedSchoolA(actorA);
    const versions2 = repo.listVersions('seed-school-a');
    const vId2 = versions2[0].versionId;
    const snap2 = {
      nodes: JSON.parse(JSON.stringify(repo.listNodes('seed-school-a', vId2))),
      edges: JSON.parse(JSON.stringify(repo.listEdges('seed-school-a', vId2))),
    };

    expect(snap2).toEqual(snap1);
  });

  it('should keep School A replay isolated from School B', () => {
    const sA = seedService.seedSchoolA(actorA);
    seedService.seedSchoolA(actorA);
    const sB = seedService.seedSchoolB(actorB);
    expect(sB.replayed).toBe(false);
    expect(sB.idempotent).toBe(false);
  });

  it('should keep School B replay isolated from School A', () => {
    const sB = seedService.seedSchoolB(actorB);
    seedService.seedSchoolB(actorB);
    const sA = seedService.seedSchoolA(actorA);
    expect(sA.replayed).toBe(false);
    expect(sA.idempotent).toBe(false);
  });

  it('should create a draft successor for School A', () => {
    seedService.seedSchoolA(actorA);
    const versions = repo.listVersions('seed-school-a');
    const drafts = versions.filter(v => v.status === 'draft');
    expect(drafts.length).toBeGreaterThanOrEqual(1);
  });
});
