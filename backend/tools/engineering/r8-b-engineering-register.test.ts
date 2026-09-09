/**
 * R8-B engineering register — focused fixture tests.
 *
 * All fixtures are synthetic. No test depends on current production defects;
 * each test proves one deterministic grouping/classification contract of
 * ./r8-b-engineering-register.
 */
import { describe, expect, it } from 'vitest';
import {
  AccessLike,
  InventoryLike,
  WriterGroupLike,
  assertNoDestructiveDisposition,
  attachStructuralEvidence,
  buildLogicId,
  buildRegisterContext,
  candidateServiceMatches,
  classifyDirectAccess,
  classifyFamily,
  classifyRuntimeCollection,
  classifyWriterGroup,
  completenessFor,
  findWriterCoordination,
  groupModelsByFamily,
  groupRoutesToCapabilities,
  inspectionFor,
  inspectionCoversFullBehavior,
  renderLogicRegister,
  renderOwnershipMatrix,
  requiredMatrixSections,
  requiredRegisterSections,
  resolveAuthorization,
  resolveStructuralDownstream,
  selectCanonicalWriterFromAccesses,
} from './r8-b-engineering-register';

function fixtureInventory(): InventoryLike {
  return {
    scan: { scannerVersion: '1.0.0', generatedAt: '2026-09-09T00:00:00.000Z', sourceFingerprint: 'sf-fixture', git: { branch: 'main', head: 'abc123' } },
    summary: { files: 10, typescriptFiles: 9, routeModules: 3, routeMounts: 3, routeEndpoints: 6, prismaModels: 4, unresolvedInternalImports: 1, cycles: 1, findings: 2 },
    files: [
      { path: 'src/index.ts', roleTags: ['runtime_entrypoint'], classificationSignals: [] },
      { path: 'src/routes/memory.ts', roleTags: ['route'], classificationSignals: [] },
      { path: 'src/routes/legacyQuiz.ts', roleTags: ['route'], classificationSignals: ['legacy_signal:v1'] },
      { path: 'src/tests/memory.test.ts', roleTags: ['test'], classificationSignals: [] },
    ],
    components: {
      services: [{ path: 'src/services/learnerMemoryService.ts', symbol: 'learnerMemoryService', line: 1 }],
      repositories: [{ path: 'src/services/learnerMemoryRepository.ts', symbol: 'learnerMemoryRepository', line: 1 }],
      contracts: [],
    },
    routes: {
      mounts: [
        { path: 'src/index.ts', line: 10, mountPath: '/api/copilot/learner-memory', routerSymbol: 'learnerMemoryRoutes', middleware: ['schoolAuthMiddleware'], importOrigin: 'src/routes/memory.ts', resolution: 'direct' },
        { path: 'src/index.ts', line: 20, mountPath: '/api/health', routerSymbol: 'healthRoutes', middleware: [], importOrigin: null, resolution: 'direct' },
        { path: 'src/tests/memory.test.ts', line: 5, mountPath: '/api/copilot/learner-memory', routerSymbol: 'learnerMemoryRoutes', middleware: [], importOrigin: null, resolution: 'direct' },
      ],
    },
    prisma: {
      schemaPath: 'prisma/schema.prisma',
      models: [{ name: 'LearnerMemoryItem' }, { name: 'ChatSession' }, { name: 'MysteryWidget' }, { name: 'ExamPaperRecord' }],
      accesses: [
        { path: 'src/services/learnerMemoryService.ts', line: 3, clientSymbol: 'prisma', model: 'LearnerMemoryItem', operation: 'create', readWrite: 'write', layerSignal: 'service' },
        { path: 'src/services/learnerMemoryRepository.ts', line: 4, clientSymbol: 'prisma', model: 'LearnerMemoryItem', operation: 'findMany', readWrite: 'read', layerSignal: 'repository' },
      ],
      rawSql: [],
      runtimeDdlCandidates: [],
      modelWriterGroups: [
        { model: 'LearnerMemoryItem', writers: [{ path: 'src/services/learnerMemoryService.ts', symbol: 'prisma', line: 3 }] },
        { model: 'ChatSession', writers: [{ path: 'src/tests/chat.test.ts', symbol: 'prisma', line: 7 }] },
        { model: 'MysteryWidget', writers: [] },
        {
          model: 'ExamPaperRecord',
          writers: [
            { path: 'src/domains/assessment/examPaperService.ts', symbol: 'prisma', line: 11 },
            { path: 'src/domains/curriculum/examPaperSync.ts', symbol: 'prisma', line: 22 },
          ],
        },
      ],
    },
    runtimeState: { mapSetAllocations: [], cacheCandidates: [] },
    duplicates: { serviceCandidates: [], repositoryCandidates: [], routeCandidates: [] },
    cycles: [{ id: 'f-fixture', members: ['src/a.ts', 'src/b.ts'] }],
    reachability: { unmountedRouteCandidates: ['src/routes/legacyQuiz.ts'] },
    findings: [
      { id: 'f1', code: 'MULTIPLE_MODEL_WRITERS_CANDIDATE', category: 'persistence', severity: 'warning', confidence: 'medium', message: 'm', evidence: [{ path: 'src/x.ts', line: 1 }], relatedPaths: ['src/x.ts'] },
      { id: 'f2', code: 'SHARED_MOUNT_PREFIX_CANDIDATE', category: 'routing', severity: 'info', confidence: 'medium', message: 'm', evidence: [{ path: 'src/index.ts', line: 10 }], relatedPaths: ['src/index.ts'] },
    ],
  };
}

const GRAPH_FIXTURE = {
  unresolvedImports: [{ path: 'src/broken.ts', line: 9, column: 1, specifier: './missing-module', resolution: 'unresolved_internal', resolvedPath: null }],
};

describe('r8-b model to writer/readers grouping', () => {
  it('maps a single production writer to CLEAR and keeps test-only writers UNRESOLVED', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    expect(ctx.writerByModel.get('LearnerMemoryItem')?.status).toBe('CLEAR');
    expect(ctx.writerByModel.get('LearnerMemoryItem')?.canonicalWriter).toBe('src/services/learnerMemoryService.ts');
    expect(ctx.writerByModel.get('ChatSession')?.status).toBe('UNRESOLVED');
    expect(ctx.writerByModel.get('ChatSession')?.canonicalWriter).toBe('UNRESOLVED');
    expect(ctx.writerByModel.get('MysteryWidget')?.status).toBe('UNRESOLVED');
    const memory = ctx.families.find((f) => f.family.id === 'learner-memory');
    expect(memory?.models).toContain('LearnerMemoryItem');
    expect(memory?.prodReaders).toContain('src/services/learnerMemoryRepository.ts');
  });

  it('joins writer groups case-insensitively to canonical model names', () => {
    const inv = fixtureInventory();
    inv.prisma.modelWriterGroups = [
      { model: 'learnerMemoryItem', writers: [{ path: 'src/services/learnerMemoryService.ts', symbol: 'prisma', line: 3 }] },
    ];
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    expect(ctx.writerByModel.get('LearnerMemoryItem')?.status).toBe('CLEAR');
    expect(ctx.coverage.writerGroupsAccounted).toBe(1);
  });
});

describe('r8-b multi-writer classification', () => {
  it('flags cross-domain production writers as DUPLICATE_WRITER_CANDIDATE', () => {
    const group: WriterGroupLike = {
      model: 'ExamPaperRecord',
      writers: [
        { path: 'src/domains/assessment/examPaperService.ts', symbol: 'prisma', line: 11 },
        { path: 'src/domains/curriculum/examPaperSync.ts', symbol: 'prisma', line: 22 },
      ],
    };
    expect(classifyWriterGroup(group).status).toBe('DUPLICATE_WRITER_CANDIDATE');
  });

  it('treats repository/service filenames alone as DUPLICATE_WRITER_CANDIDATE (never SHARED_BY_DESIGN)', () => {
    const group: WriterGroupLike = {
      model: 'LearnerMemoryItem',
      writers: [
        { path: 'src/services/learnerMemoryService.ts', symbol: 'prisma', line: 3 },
        { path: 'src/services/learnerMemoryRepository.ts', symbol: 'prisma', line: 9 },
      ],
    };
    // Filename co-occurrence is candidate signal only without coordination proof.
    expect(classifyWriterGroup(group).status).toBe('DUPLICATE_WRITER_CANDIDATE');
  });

  it('establishes SHARED_BY_DESIGN only with explicit dependency/delegation evidence', () => {
    const group: WriterGroupLike = {
      model: 'LearnerMemoryItem',
      writers: [
        { path: 'src/services/learnerMemoryService.ts', symbol: 'prisma', line: 3 },
        { path: 'src/services/learnerMemoryRepository.ts', symbol: 'prisma', line: 9 },
      ],
    };
    const withProof = classifyWriterGroup(group, {
      coordination: { kind: 'dependency-edge', detail: 'src/services/learnerMemoryService.ts imports src/services/learnerMemoryRepository.ts (02 dependency graph)' },
    });
    expect(withProof.status).toBe('SHARED_BY_DESIGN');
  });

  it('classifies direct access shapes deterministically', () => {
    const svc: AccessLike = { path: 'src/services/x.ts', line: 1, clientSymbol: 'prisma', model: 'M', operation: 'create', readWrite: 'write', layerSignal: 'service' };
    const route: AccessLike = { path: 'src/routes/x.ts', line: 1, clientSymbol: 'prisma', model: 'M', operation: 'findMany', readWrite: 'read', layerSignal: 'route' };
    const test: AccessLike = { path: 'src/tests/x.test.ts', line: 1, clientSymbol: 'prisma', model: 'M', operation: 'create', readWrite: 'write', layerSignal: 'service' };
    expect(classifyDirectAccess(svc)).toBe('EXPECTED_LAYER_ACCESS');
    expect(classifyDirectAccess(route)).toBe('OWNERSHIP_REVIEW_REQUIRED');
    expect(classifyDirectAccess(test)).toBe('TEST_PROOF');
    expect(classifyRuntimeCollection({ path: 'src/svc.ts', line: 1, symbol: 'tmp', scope: 'function', collectionType: 'Map', cacheSignal: null })).toBe('ALGORITHM_LOCAL_TEMPORARY');
    expect(classifyRuntimeCollection({ path: 'src/svc.ts', line: 2, symbol: 'inflight', scope: 'module', collectionType: 'Map', cacheSignal: 'coalesce' })).toBe('MODULE_CACHE');
  });
});

describe('r8-b route to service/data grouping', () => {
  it('groups production mounts by prefix and excludes test mounts', () => {
    const inv = fixtureInventory();
    const groups = groupRoutesToCapabilities(inv.routes.mounts);
    const keys = groups.map((g) => g.key);
    expect(keys).toContain('/api/copilot/learner-memory');
    expect(keys.some((k) => k.startsWith('/api/health'))).toBe(true);
    for (const g of groups) {
      expect(g.mounts.every((m) => m.path === 'src/index.ts')).toBe(true);
    }
    const memory = groups.find((g) => g.key === '/api/copilot/learner-memory');
    expect(memory?.logicId.startsWith('LOGIC-')).toBe(true);
    expect(memory?.middleware).toContain('schoolAuthMiddleware');
  });
});

describe('r8-b unresolved ownership preservation', () => {
  it('keeps models without production writers in the unresolved section', () => {
    const ctx = buildRegisterContext(fixtureInventory(), GRAPH_FIXTURE);
    const matrix = renderOwnershipMatrix(ctx);
    expect(matrix).toContain('## Unresolved Data Ownership');
    expect(matrix).toContain('ChatSession');
    expect(matrix).toContain('MysteryWidget');
    expect(ctx.coverage.modelsAccounted).toBe(ctx.coverage.modelsTotal);
  });
});

describe('r8-b stable logic ids and ordering', () => {
  it('produces deterministic ids sorted lexicographically', () => {
    expect(buildLogicId('Memory', '/api/copilot/learner-memory')).toBe('LOGIC-memory-api-copilot-learner-memory');
    const inv = fixtureInventory();
    const first = groupRoutesToCapabilities(inv.routes.mounts).map((g) => g.logicId);
    const second = groupRoutesToCapabilities(inv.routes.mounts).map((g) => g.logicId);
    expect(first).toEqual(second);
    expect([...first].sort()).toEqual(first);
    expect(groupModelsByFamily(inv.prisma.models).get('unclassified')).toContain('MysteryWidget');
    expect(classifyFamily('LearnerMemoryItem').id).toBe('learner-memory');
  });
});

describe('r8-b prisma-model accounting', () => {
  it('accounts every model including unclassified ones', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    const all = new Set<string>();
    for (const f of ctx.families) for (const m of f.models) all.add(m);
    for (const m of inv.prisma.models) expect(all.has(m.name)).toBe(true);
    expect(ctx.coverage.modelsAccounted).toBe(4);
    expect(ctx.coverage.writerGroupsAccounted).toBe(4);
    expect(ctx.coverage.routeModulesRepresented).toBe(ctx.coverage.routeModulesTotal);
  });
});

describe('r8-b destructive disposition prohibition', () => {
  it('rejects forbidden disposition tokens and renders clean artifacts', () => {
    expect(() => assertNoDestructiveDisposition('plan: DELETE the table')).toThrow();
    expect(() => assertNoDestructiveDisposition('plan: merge the services')).toThrow();
    expect(() => assertNoDestructiveDisposition('plan: move the file')).toThrow();
    expect(() => assertNoDestructiveDisposition('plan: replace the router')).toThrow();
    const ctx = buildRegisterContext(fixtureInventory(), GRAPH_FIXTURE);
    const matrix = renderOwnershipMatrix(ctx);
    const register = renderLogicRegister(ctx);
    expect(() => assertNoDestructiveDisposition(matrix)).not.toThrow();
    expect(() => assertNoDestructiveDisposition(register)).not.toThrow();
  });
});

describe('r8-b required artifact sections', () => {
  it('renders every frozen matrix and register section', () => {
    const ctx = buildRegisterContext(fixtureInventory(), GRAPH_FIXTURE);
    const matrix = renderOwnershipMatrix(ctx);
    const register = renderLogicRegister(ctx);
    for (const section of requiredMatrixSections()) expect(matrix).toContain(section);
    for (const section of requiredRegisterSections()) expect(register).toContain(section);
    expect(register).toContain('## Unresolved Logic');
    expect(register).toContain('## Completeness Summary');
    expect(register).toContain('UNRESOLVED_INTERNAL_IMPORT');
    expect(register).toContain('f-fixture');
    expect(completenessFor(ctx.capabilities[0], fixtureInventory())).toMatch(/^L[1-4]$/);
  });
});

describe('r8-b evidence-hierarchy repair (frozen continuation C1-C9)', () => {
  it('C1: model-name-only family evidence does NOT produce authoritative high-confidence ownership', () => {
    const inv = fixtureInventory();
    inv.prisma.models = [{ name: 'VoiceGrantRecord' }];
    inv.prisma.accesses = [];
    inv.prisma.modelWriterGroups = [];
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    const voice = ctx.families.find((f) => f.family.id === 'voice');
    expect(voice).toBeDefined();
    expect(voice?.isCandidateOnly).toBe(true);
    expect(voice?.status).toBe('UNRESOLVED');
    expect(voice?.confidence).toBe('low');
    expect(voice?.evidenceKinds).toContain('CANDIDATE_SIGNAL');
    const matrix = renderOwnershipMatrix(ctx);
    expect(matrix).toContain('CANDIDATE FAMILY');
  });

  it('C3: single real write path establishes a canonical mutation path', () => {
    const accesses: AccessLike[] = [
      { path: 'src/services/learnerMemoryService.ts', line: 3, clientSymbol: 'prisma', model: 'LearnerMemoryItem', operation: 'create', readWrite: 'write', layerSignal: 'service' },
      { path: 'src/services/learnerMemoryService.ts', line: 9, clientSymbol: 'prisma', model: 'LearnerMemoryItem', operation: 'update', readWrite: 'write', layerSignal: 'service' },
    ];
    const pick = selectCanonicalWriterFromAccesses(accesses);
    expect(pick?.path).toBe('src/services/learnerMemoryService.ts');
    const verdict = classifyWriterGroup(
      { model: 'LearnerMemoryItem', writers: [{ path: 'src/services/learnerMemoryService.ts', symbol: 'prisma', line: 3 }] },
      { writeAccesses: accesses },
    );
    expect(verdict.canonicalWriter).toBe('src/services/learnerMemoryService.ts');
    expect(verdict.evidenceKinds).toContain('PRISMA_WRITE_ACCESS');
  });

  it('C2: service+repository filenames alone do NOT establish SHARED_BY_DESIGN', () => {
    const verdict = classifyWriterGroup({
      model: 'M',
      writers: [
        { path: 'src/services/mService.ts', symbol: 'prisma', line: 1 },
        { path: 'src/services/mRepository.ts', symbol: 'prisma', line: 2 },
      ],
    });
    expect(verdict.status).not.toBe('SHARED_BY_DESIGN');
    expect(verdict.status).toBe('DUPLICATE_WRITER_CANDIDATE');
  });

  it('C2: explicit dependency evidence CAN establish SHARED_BY_DESIGN', () => {
    const graph = {
      unresolvedImports: [],
      edges: [{ from: 'file:src/services/a.ts', to: 'file:src/services/b.ts', type: 'imports', sourcePath: 'src/services/a.ts', line: 1 }],
    };
    const coord = findWriterCoordination('M', ['src/services/a.ts', 'src/services/b.ts'], graph, []);
    expect(coord?.kind).toBe('dependency-edge');
    const verdict = classifyWriterGroup(
      {
        model: 'M',
        writers: [
          { path: 'src/services/a.ts', symbol: 'prisma', line: 1 },
          { path: 'src/services/b.ts', symbol: 'prisma', line: 2 },
        ],
      },
      { coordination: coord },
    );
    expect(verdict.status).toBe('SHARED_BY_DESIGN');
  });

  it('C4: route-service association requires structural dependency, not keyword overlap', () => {
    const inv = fixtureInventory();
    const groups = groupRoutesToCapabilities(inv.routes.mounts);
    // Keyword overlap alone suggests a candidate (never proof).
    const memory = groups.find((g) => g.key === '/api/copilot/learner-memory');
    expect(memory).toBeDefined();
    const candidates = candidateServiceMatches(memory?.keywords ?? [], inv.components.services.map((s) => s.path));
    expect(candidates).toContain('src/services/learnerMemoryService.ts');
    // Without graph edges the group stays unresolved with PRIMARY SERVICE UNRESOLVED.
    attachStructuralEvidence(groups, inv, GRAPH_FIXTURE);
    expect(memory?.isConfirmed).toBe(false);
    const register = renderLogicRegister(buildRegisterContext(inv, GRAPH_FIXTURE));
    expect(register).toContain('UNRESOLVED — no structural dependency');
  });

  it('C4: structural edges prove route-service-data linkage', () => {
    const inv = fixtureInventory();
    const graph = {
      unresolvedImports: [],
      edges: [
        { from: 'file:src/routes/memory.ts', to: 'file:src/services/learnerMemoryService.ts', type: 'imports', sourcePath: 'src/routes/memory.ts', line: 1 },
        { from: 'file:src/services/learnerMemoryService.ts', to: 'file:src/services/learnerMemoryRepository.ts', type: 'imports', sourcePath: 'src/services/learnerMemoryService.ts', line: 2 },
      ],
    };
    const down = resolveStructuralDownstream(['src/routes/memory.ts'], graph);
    expect(down.services).toContain('src/services/learnerMemoryService.ts');
    const groups = groupRoutesToCapabilities(inv.routes.mounts);
    attachStructuralEvidence(groups, inv, graph);
    // Fixture importOrigin is src/routes/memory.ts so the memory group confirms.
    const memory = groups.find((g) => g.key === '/api/copilot/learner-memory');
    expect(memory?.structuralServices).toContain('src/services/learnerMemoryService.ts');
    expect(memory?.isConfirmed).toBe(true);
  });

  it('C5: URL prefix does not establish role authorization', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    const adminish = ctx.capabilities.find((c) => c.key.includes('/api/health'));
    expect(adminish).toBeDefined();
    const authz = resolveAuthorization(adminish!);
    expect(authz.authorization).toContain('UNRESOLVED');
    expect(authz.authorization).not.toMatch(/prefix scoping/i);
    const register = renderLogicRegister(ctx);
    expect(register).not.toMatch(/ROLE AUTHORIZATION = route-prefix/i);
    expect(register).not.toContain('route-prefix scoping');
  });

  it('C7: L4 cannot be obtained by path/name matching only', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    for (const c of ctx.capabilities) {
      // No fixture group has source inspection + structural proof together.
      expect(completenessFor(c, inv)).not.toBe('L4');
    }
  });

  it('C7: source-confirmed coherent capability can obtain L4', () => {
    const insp = inspectionFor('/api/copilot/learner-memory');
    expect(insp).not.toBeNull();
    expect(inspectionCoversFullBehavior(insp!)).toBe(true);
    const inv = fixtureInventory();
    const graph = {
      unresolvedImports: [],
      edges: [
        { from: 'file:src/routes/memory.ts', to: 'file:src/services/learnerMemoryService.ts', type: 'imports', sourcePath: 'src/routes/memory.ts', line: 1 },
      ],
    };
    const ctx = buildRegisterContext(inv, graph);
    const memory = ctx.capabilities.find((g) => g.key === '/api/copilot/learner-memory');
    expect(memory?.isConfirmed).toBe(true);
    expect(completenessFor(memory!, inv)).toBe('L4');
  });

  it('C6: unresolved route groups remain in Unresolved Logic', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    const register = renderLogicRegister(ctx);
    expect(register).toContain('## Unresolved Logic');
    expect(register).toContain('Unresolved route-group candidates');
    const unresolved = ctx.capabilities.filter((c) => !c.isConfirmed);
    expect(unresolved.length).toBeGreaterThan(0);
    for (const c of unresolved) {
      expect(register).toContain(c.logicId);
    }
  });

  it('C10-C12: synthetic accounting stays intact (models, writers, route modules)', () => {
    const inv = fixtureInventory();
    const ctx = buildRegisterContext(inv, GRAPH_FIXTURE);
    expect(ctx.coverage.modelsAccounted).toBe(ctx.coverage.modelsTotal);
    expect(ctx.coverage.writerGroupsAccounted).toBe(inv.prisma.modelWriterGroups.length);
    expect(ctx.coverage.routeModulesRepresented).toBe(ctx.coverage.routeModulesTotal);
  });

  it('C13-C14: deterministic IDs and truthfulness labels hold', () => {
    expect(buildLogicId('Memory', '/api/copilot/learner-memory')).toBe('LOGIC-memory-api-copilot-learner-memory');
    const ctx = buildRegisterContext(fixtureInventory(), GRAPH_FIXTURE);
    const matrix = renderOwnershipMatrix(ctx);
    const register = renderLogicRegister(ctx);
    expect(matrix).toContain('EVIDENCE KIND');
    expect(register).toContain('EVIDENCE KIND');
    expect(register).toContain('CANDIDATE_SIGNAL');
  });
});
