/**
 * R8-A Backend Engineering Scanner — shared types.
 *
 * These types define the exact contracts for the three generated artifacts:
 *   01_BACKEND_SYSTEM_INVENTORY.json
 *   02_BACKEND_DEPENDENCY_GRAPH.json
 *   03_BACKEND_RUNTIME_ROUTE_MAP.md (rendered by reporters.ts)
 */

export type RoleTag =
  | 'runtime_entrypoint'
  | 'runtime_source'
  | 'route'
  | 'service'
  | 'repository'
  | 'contract'
  | 'domain'
  | 'middleware'
  | 'test'
  | 'proof_candidate'
  | 'worker'
  | 'script'
  | 'prisma_schema'
  | 'migration'
  | 'unknown';

export type ImportResolution =
  | 'internal_backend'
  | 'cross_lane_internal'
  | 'external_package'
  | 'unresolved_internal'
  | 'dynamic_unknown';

export type RuntimeReachability = 'reachable' | 'unreachable_candidate' | 'unknown';

export interface FileRecord {
  path: string;
  extension: string;
  bytes: number;
  lines: number;
  sha256: string;
  roleTags: RoleTag[];
  runtimeReachability: RuntimeReachability;
  classificationSignals: string[];
}

export interface ImportRecord {
  path: string;
  line: number;
  column?: number;
  symbol?: string;
  excerpt?: string;
  specifier: string;
  importKind: 'static' | 'export_from' | 'dynamic' | 'require' | 'non_literal_dynamic';
  resolution: ImportResolution;
  resolvedPath: string | null;
}

export interface DeclarationRecord {
  path: string;
  line: number;
  symbol: string;
  kind: 'interface' | 'type' | 'class' | 'enum' | 'function' | 'const';
  exported: boolean;
  fingerprint: string;
}

export interface ComponentRecord {
  path: string;
  symbol: string;
  line: number;
  roleTags: RoleTag[];
  exports: string[];
}

export interface RouteMountRecord {
  path: string;
  line: number;
  mountPath: string;
  routerSymbol: string;
  middleware: string[];
  importOrigin: string | null;
  resolution: 'direct' | 'factory' | 'unknown';
}

export interface RouteEndpointRecord {
  path: string;
  line: number;
  routerSymbol: string;
  method: string;
  localPath: string;
  middleware: string[];
}

export interface EffectiveRouteRecord {
  method: string;
  effectivePath: string;
  routeSource: string;
  routeLine: number;
  mountSource: string;
  mountLine: number;
  middleware: string[];
}

export interface RouteCompositionRecord {
  path: string;
  line: number;
  mountPath: string;
  routerSymbol: string;
  reason: string;
}

export interface PrismaModelRecord {
  name: string;
  line: number;
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    list: boolean;
    attributes: string[];
  }>;
  modelAttributes: Array<{ name: string; value: string; line: number }>;
}

export interface PrismaAccessRecord {
  path: string;
  line: number;
  clientSymbol: string;
  model: string | null;
  operation: string;
  readWrite: 'read' | 'write';
  layerSignal: string;
}

export interface RawSqlRecord {
  path: string;
  line: number;
  api: string;
  queryKind: string | null;
  tables: string[];
  unsafe: boolean;
}

export interface RuntimeDdlRecord {
  path: string;
  line: number;
  operation: string;
  excerpt: string;
}

export interface UnboundedQueryRecord {
  path: string;
  line: number;
  model: string | null;
  operation: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface PrismaModelWriterGroup {
  model: string;
  writers: Array<{ path: string; symbol: string; line: number }>;
}

export interface RuntimeCollectionRecord {
  path: string;
  line: number;
  symbol: string;
  scope: 'module' | 'class' | 'function' | 'unknown';
  collectionType: 'Map' | 'Set';
  cacheSignal: string | null;
}

export interface ExternalDependencyRecord {
  name: string;
  kind: 'dependency' | 'devDependency';
  version: string;
}

export interface ExternalProviderRecord {
  path: string;
  line: number;
  provider: string;
  specifier: string;
}

export interface AICallRecord {
  path: string;
  line: number;
  symbol: string;
  excerpt: string;
}

export interface TestRecord {
  path: string;
  line: number;
  kind: 'test_file' | 'proof_candidate';
  signals: string[];
}

export interface DuplicateDeclarationRecord {
  name: string;
  kind: string;
  sameFingerprint: boolean;
  fingerprint: string;
  occurrences: Array<{ path: string; line: number }>;
}

export interface DuplicateComponentRecord {
  normalizedKey: string;
  originalNames: string[];
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  paths: string[];
}

export interface DuplicateRouteRecord {
  kind: 'duplicate_effective_route' | 'shared_mount_prefix';
  key: string;
  occurrences: Array<{ path: string; line: number; detail: string }>;
}

export interface DuplicateStateOwnerRecord {
  normalizedKey: string;
  originalSymbols: string[];
  paths: string[];
  reason: string;
}

export interface FindingEvidence {
  path: string;
  line: number;
  column?: number;
  symbol?: string;
  excerpt?: string;
}

export type FindingCategory =
  | 'dependency'
  | 'routing'
  | 'persistence'
  | 'runtime_state'
  | 'failure_handling'
  | 'duplication'
  | 'reachability'
  | 'organization'
  | 'external_dependency'
  | 'scale';

export interface FindingRecord {
  id: string;
  code: string;
  category: FindingCategory;
  severity: 'error' | 'warning' | 'info';
  confidence: 'high' | 'medium' | 'low';
  message: string;
  evidence: FindingEvidence[];
  relatedPaths: string[];
  finalDisposition: null;
  autoAction: 'NONE';
}

export interface ScanModel {
  schemaVersion: '1.0';
  scan: BackendSystemInventory['scan'];
  summary: BackendSystemInventory['summary'];
  files: FileRecord[];
  imports: ImportRecord[];
  exports: DeclarationRecord[];
  components: {
    services: ComponentRecord[];
    repositories: ComponentRecord[];
    contracts: ComponentRecord[];
  };
  routes: {
    mounts: RouteMountRecord[];
    endpoints: RouteEndpointRecord[];
    effectiveRoutes: EffectiveRouteRecord[];
    unresolvedCompositions: RouteCompositionRecord[];
  };
  prisma: BackendSystemInventory['prisma'];
  runtimeState: {
    mapSetAllocations: RuntimeCollectionRecord[];
    cacheCandidates: RuntimeCollectionRecord[];
  };
  external: {
    packageDependencies: ExternalDependencyRecord[];
    providerImports: ExternalProviderRecord[];
    aiCallCandidates: AICallRecord[];
  };
  tests: TestRecord[];
  duplicates: BackendSystemInventory['duplicates'];
  catchSignals: Array<{
    path: string;
    line: number;
    kind: 'silent' | 'broad';
    confidence: 'high' | 'medium' | 'low';
  }>;
  cycles: Array<{ id: string; members: string[] }>;
  reachability: {
    runtimeEntrypoints: string[];
    auxiliaryEntrypoints: string[];
    reachableSourceFiles: string[];
    unreachableCandidates: string[];
    unmountedRouteCandidates: string[];
  };
  findings: FindingRecord[];
}

export interface BackendSystemInventory {
  schemaVersion: '1.0';
  scan: {
    scannerVersion: string;
    generatedAt: string;
    sourceFingerprint: string;
    git: { branch: string | null; head: string | null };
    scope: {
      repositoryRoot: string;
      backendRoot: string;
      includedRoots: string[];
      excludedPatterns: string[];
    };
    heuristics: { largeFileLines: number; largeFileBytes: number };
  };
  summary: {
    files: number;
    typescriptFiles: number;
    testFiles: number;
    routeModules: number;
    routeMounts: number;
    routeEndpoints: number;
    services: number;
    repositories: number;
    contracts: number;
    prismaModels: number;
    unresolvedInternalImports: number;
    cycles: number;
    findings: number;
  };
  files: FileRecord[];
  imports: ImportRecord[];
  exports: DeclarationRecord[];
  components: {
    services: ComponentRecord[];
    repositories: ComponentRecord[];
    contracts: ComponentRecord[];
  };
  routes: {
    mounts: RouteMountRecord[];
    endpoints: RouteEndpointRecord[];
    effectiveRoutes: EffectiveRouteRecord[];
    unresolvedCompositions: RouteCompositionRecord[];
  };
  prisma: {
    schemaPath: string | null;
    models: PrismaModelRecord[];
    accesses: PrismaAccessRecord[];
    rawSql: RawSqlRecord[];
    runtimeDdlCandidates: RuntimeDdlRecord[];
    unboundedQueryCandidates: UnboundedQueryRecord[];
    modelWriterGroups: PrismaModelWriterGroup[];
  };
  runtimeState: {
    mapSetAllocations: RuntimeCollectionRecord[];
    cacheCandidates: RuntimeCollectionRecord[];
  };
  external: {
    packageDependencies: ExternalDependencyRecord[];
    providerImports: ExternalProviderRecord[];
    aiCallCandidates: AICallRecord[];
  };
  tests: TestRecord[];
  catchSignals: ScanModel['catchSignals'];
  duplicates: {
    declarationCandidates: DuplicateDeclarationRecord[];
    serviceCandidates: DuplicateComponentRecord[];
    repositoryCandidates: DuplicateComponentRecord[];
    routeCandidates: DuplicateRouteRecord[];
    stateOwnerCandidates: DuplicateStateOwnerRecord[];
  };
  reachability: ScanModel['reachability'];
  findings: FindingRecord[];
}

export interface BackendDependencyGraph {
  schemaVersion: '1.0';
  sourceFingerprint: string;
  nodes: Array<{
    id: string;
    type: 'source_file' | 'route' | 'prisma_model' | 'external_package' | 'cross_lane_source';
    path?: string;
    name?: string;
    roleTags?: string[];
  }>;
  edges: Array<{
    from: string;
    to: string;
    type:
      | 'imports'
      | 'exports_from'
      | 'dynamic_import'
      | 'require'
      | 'mounts'
      | 'uses_prisma_model'
      | 'writes_prisma_model'
      | 'uses_external_package';
    sourcePath?: string;
    line?: number;
  }>;
  entrypoints: { runtime: string[]; auxiliary: string[] };
  cycles: Array<{ id: string; members: string[] }>;
  unresolvedImports: ImportRecord[];
  reachability: { reachable: string[]; unreachableCandidates: string[] };
}
