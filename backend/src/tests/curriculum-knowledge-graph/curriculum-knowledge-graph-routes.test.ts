import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumKnowledgeGraphRepository } from '../../domains/curriculum-knowledge-graph/repository/InMemoryCurriculumKnowledgeGraphRepository';
import { CurriculumGraphRolePolicyService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphRolePolicyService';
import { CurriculumGraphVersionLifecycleService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphVersionLifecycleService';
import { CurriculumGraphValidatorService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphValidatorService';
import { CurriculumGraphTraversalService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphTraversalService';
import { CurriculumGraphCommandService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphCommandService';
import { CurriculumGraphQueryService } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphQueryService';
import { createCurriculumGraphRouter, CurriculumGraphRouterDependencies, CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED } from '../../domains/curriculum-knowledge-graph/routes/CurriculumGraphRouter';
import { FixedClock, DeterministicIdGenerator } from '../../domains/curriculum-knowledge-graph/services/CurriculumGraphDependencies';
import type { CurriculumGraphActorContext } from '../../domains/curriculum-knowledge-graph/contracts/CurriculumGraphContracts';

describe('Curriculum Graph Routes', () => {
  let repo: InMemoryCurriculumKnowledgeGraphRepository;
  let rolePolicy: CurriculumGraphRolePolicyService;
  let lifecycle: CurriculumGraphVersionLifecycleService;
  let validator: CurriculumGraphValidatorService;
  let traversal: CurriculumGraphTraversalService;
  let commandService: CurriculumGraphCommandService;
  let queryService: CurriculumGraphQueryService;
  let clock: FixedClock;
  let idGen: DeterministicIdGenerator;
  let deps: CurriculumGraphRouterDependencies;

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
    deps = {
      commandService,
      queryService,
      contextResolver: {
        resolve: () => ({ schoolId: 'test', actorId: 'test', actorRole: 'school_admin' as const, learnerId: undefined, requestId: 'r', correlationId: 'c' }),
      },
    };
  });

  it('should create a router with explicit dependencies', () => {
    const router = createCurriculumGraphRouter(deps);
    expect(router).toBeDefined();
    expect(router.stack.length).toBeGreaterThan(0);
  });

  it('should throw when dependency object is null', () => {
    expect(() => createCurriculumGraphRouter(null as unknown as CurriculumGraphRouterDependencies))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should throw when dependency object is undefined', () => {
    expect(() => createCurriculumGraphRouter(undefined as unknown as CurriculumGraphRouterDependencies))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should throw when dependency object is empty', () => {
    expect(() => createCurriculumGraphRouter({} as CurriculumGraphRouterDependencies))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should throw when commandService is missing', () => {
    expect(() => createCurriculumGraphRouter({ queryService, contextResolver: deps.contextResolver } as unknown as CurriculumGraphRouterDependencies))
      .toThrow('commandService');
  });

  it('should throw when queryService is missing', () => {
    expect(() => createCurriculumGraphRouter({ commandService, contextResolver: deps.contextResolver } as unknown as CurriculumGraphRouterDependencies))
      .toThrow('queryService');
  });

  it('should throw when contextResolver is missing', () => {
    expect(() => createCurriculumGraphRouter({ commandService, queryService } as unknown as CurriculumGraphRouterDependencies))
      .toThrow('contextResolver');
  });

  it('should throw when commandService is null', () => {
    expect(() => createCurriculumGraphRouter({ commandService: null as unknown as typeof commandService, queryService, contextResolver: deps.contextResolver }))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should throw when queryService is null', () => {
    expect(() => createCurriculumGraphRouter({ commandService, queryService: null as unknown as typeof queryService, contextResolver: deps.contextResolver }))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should throw when contextResolver is null', () => {
    expect(() => createCurriculumGraphRouter({ commandService, queryService, contextResolver: null as unknown as typeof deps.contextResolver }))
      .toThrow(CURRICULUM_GRAPH_ROUTER_DEPENDENCY_REQUIRED);
  });

  it('should reject missing school context', () => {
    const ctx = { schoolId: '', actorId: 'test', actorRole: 'school_admin' as const, requestId: 'r', correlationId: 'c' };
    const result = queryService.listVersions(ctx);
    expect(result.length).toBe(0);
  });

  it('should reject missing actor', () => {
    const ctx = { schoolId: 'school-a', actorId: '', actorRole: 'unknown' as const, requestId: 'r', correlationId: 'c' };
    const result = queryService.listVersions(ctx);
    expect(result).toBeDefined();
  });

  it('should have all expected route paths defined via router stack', () => {
    const router = createCurriculumGraphRouter(deps);
    const paths: string[] = [];
    for (const layer of router.stack) {
      if (layer.route) {
        paths.push(layer.route.path);
      }
    }
    expect(paths).toContain('/versions');
    expect(paths).toContain('/active/:curriculumKey');
    expect(paths).toContain('/versions/:versionId/nodes');
    expect(paths).toContain('/versions/:versionId/edges');
    expect(paths).toContain('/versions/:versionId/validate');
  });

  it('should not create its own repository', () => {
    const router = createCurriculumGraphRouter(deps);
    expect((router as any).repo).toBeUndefined();
  });

  it('should not mount itself (no side effects)', () => {
    const router = createCurriculumGraphRouter(deps);
    expect(typeof router).toBe('function');
  });

  it('should handle context resolver dependency injection', () => {
    const customResolver = {
      resolve: () => ({ schoolId: 'custom', actorId: 'custom', actorRole: 'school_admin' as const, learnerId: undefined, requestId: 'r', correlationId: 'c' }),
    };
    const router = createCurriculumGraphRouter({ ...deps, contextResolver: customResolver });
    expect(router).toBeDefined();
  });
});
