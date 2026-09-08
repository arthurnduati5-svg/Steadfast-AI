/**
 * R8-A Backend Engineering Scanner — focused tests.
 *
 * All proof runs against a small synthetic repository fixture under the OS
 * temp directory. Nothing here depends on Steadfast production defects.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS, computeCycles, parsePrismaSchema, runScan } from './scanner';
import { buildDependencyGraph, renderRouteMap } from './reporters';

function writeFile(root: string, rel: string, content: string): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function buildFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'r8-scan-'));
  writeFile(root, 'package.json', JSON.stringify({ name: 'fixture', scripts: {} }, null, 2));
  writeFile(
    root,
    'tsconfig.json',
    JSON.stringify({ compilerOptions: { target: 'es2020', module: 'commonjs', moduleResolution: 'node', esModuleInterop: true, strict: true } }),
  );
  writeFile(root, 'prisma/schema.prisma', 'model User {\n  id String @id\n  email String @unique\n}\n');

  writeFile(
    root,
    'src/index.ts',
    `import express from 'express';\n` +
      `import usersRouter from './routes/users';\n` +
      `import dupARouter from './routes/dupA';\n` +
      `import dupBRouter from './routes/dupB';\n` +
      `const app = express();\n` +
      `app.use('/api/users', usersRouter);\n` +
      `app.use('/api/dup', dupARouter);\n` +
      `app.use('/api/dup', dupBRouter);\n` +
      `export default app;\n`,
  );
  writeFile(
    root,
    'src/routes/users.ts',
    `import { Router } from 'express';\n` +
      `import { listUsers } from '../services/userService';\n` +
      `const usersRouter = Router();\n` +
      `usersRouter.get('/list', listUsers);\n` +
      `export default usersRouter;\n`,
  );
  writeFile(
    root,
    'src/routes/dupA.ts',
    `import { Router } from 'express';\n` +
      `const dupARouter = Router();\n` +
      `dupARouter.get('/list', () => {});\n` +
      `export default dupARouter;\n`,
  );
  writeFile(
    root,
    'src/routes/dupB.ts',
    `import { Router } from 'express';\n` +
      `const dupBRouter = Router();\n` +
      `dupBRouter.get('/list', () => {});\n` +
      `export default dupBRouter;\n`,
  );
  writeFile(
    root,
    'src/routes/orphan.ts',
    `import { Router } from 'express';\n` +
      `const orphanRouter = Router();\n` +
      `orphanRouter.get('/orphan', () => {});\n` +
      `export default orphanRouter;\n`,
  );
  writeFile(root, 'src/services/userService.ts', `export function listUsers(): void {}\n`);
  writeFile(
    root,
    'src/services/userServiceLegacy.ts',
    `export function listUsersLegacy(): void {}\n`,
  );
  writeFile(root, 'src/services/a.ts', `import { b } from './b';\nexport const a = b;\n`);
  writeFile(root, 'src/services/b.ts', `import { a } from './a';\nexport const b = a;\n`);
  writeFile(
    root,
    'src/services/broken.ts',
    `import { x } from './spacedReviewService';\nexport const y = x;\n`,
  );
  writeFile(
    root,
    'src/state/cache.ts',
    `const cache = new Map<string, number>();\n` +
      `export function rank(items: string[]): string[] {\n` +
      `  const local = new Map<string, number>();\n` +
      `  return items.sort();\n` +
      `}\n` +
      `export { cache };\n`,
  );
  writeFile(
    root,
    'src/services/unbounded.ts',
    `import { prisma } from '../lib/prisma';\n` +
      `export async function all(): Promise<unknown> {\n` +
      `  return prisma.user.findMany();\n` +
      `}\n` +
      `export async function page(): Promise<unknown> {\n` +
      `  return prisma.user.findMany({ take: 10 });\n` +
      `}\n`,
  );
  writeFile(
    root,
    'src/services/writerA.ts',
    `import { prisma } from '../lib/prisma';\n` +
      `export async function createOne(): Promise<unknown> {\n` +
      `  return prisma.user.create({ data: { id: '1' } });\n` +
      `}\n`,
  );
  writeFile(
    root,
    'src/services/writerB.ts',
    `import { prisma } from '../lib/prisma';\n` +
      `export async function updateOne(): Promise<unknown> {\n` +
      `  return prisma.user.update({ where: { id: '1' }, data: {} });\n` +
      `}\n`,
  );
  writeFile(root, 'src/lib/prisma.ts', `export const prisma = {} as any;\n`);
  writeFile(
    root,
    'src/services/raw.ts',
    'import { prisma } from "../lib/prisma";\n' +
      'export async function raw(): Promise<unknown> {\n' +
      '  await prisma.$queryRaw`SELECT * FROM users`;\n' +
      '  await prisma.$executeRawUnsafe("DELETE FROM sessions");\n' +
      '  await prisma.$executeRaw`CREATE TABLE audit_log (id TEXT)`;\n' +
      '  return null;\n' +
      '}\n',
  );
  writeFile(
    root,
    'src/services/failures.ts',
    `export function silent(): void {\n  try {\n    throw new Error('x');\n  } catch (e) {\n  }\n}\n` +
      `export function broad(): void {\n  try {\n    throw new Error('x');\n  } catch (e) {\n    const x = 1;\n  }\n}\n`,
  );
  writeFile(
    root,
    'src/services/dyn.ts',
    `export async function load(name: string): Promise<unknown> {\n  return import(name);\n}\n`,
  );
  writeFile(root, 'src/types/a.ts', `export interface Widget {\n  a: string;\n}\n`);
  writeFile(root, 'src/types/b.ts', `export interface Widget {\n  a: string;\n}\n`);
  writeFile(root, 'src/types/c.ts', `export interface Widget {\n  b: number;\n}\n`);
  return root;
}

function scanFixture(): ReturnType<typeof runScan> {
  const backendRoot = buildFixture();
  return runScan({ ...DEFAULT_OPTIONS, repositoryRoot: path.dirname(backendRoot), backendRoot });
}

describe('r8 engineering scanner (synthetic fixture)', () => {
  it('resolves static imports and flags unresolved relative imports', () => {
    const { model } = scanFixture();
    const ok = model.imports.find(
      (i) => i.path === 'src/routes/users.ts' && i.specifier === '../services/userService',
    );
    expect(ok).toBeDefined();
    expect(ok!.resolution).toBe('internal_backend');
    expect(ok!.resolvedPath).toBe('src/services/userService.ts');
    const bad = model.imports.find((i) => i.specifier === './spacedReviewService');
    expect(bad).toBeDefined();
    expect(bad!.resolution).toBe('unresolved_internal');
    expect(model.findings.some((f) => f.code === 'UNRESOLVED_INTERNAL_IMPORT')).toBe(true);
  });

  it('detects dependency cycles', () => {
    const { model } = scanFixture();
    expect(model.cycles.length).toBeGreaterThan(0);
    const flat = model.cycles.flatMap((c) => c.members);
    expect(flat).toContain('src/services/a.ts');
    expect(flat).toContain('src/services/b.ts');
    expect(model.findings.some((f) => f.code === 'DEPENDENCY_CYCLE')).toBe(true);
  });

  it('composes direct mounts with endpoints into effective paths', () => {
    const { model } = scanFixture();
    const mount = model.routes.mounts.find((m) => m.mountPath === '/api/users' && m.routerSymbol === 'usersRouter');
    expect(mount).toBeDefined();
    expect(mount!.resolution).toBe('direct');
    const effective = model.routes.effectiveRoutes.find(
      (e) => e.method === 'GET' && e.effectivePath === '/api/users/list',
    );
    expect(effective).toBeDefined();
  });

  it('flags duplicate effective routes and unmounted route candidates', () => {
    const { model } = scanFixture();
    const dupes = model.duplicates.routeCandidates.filter((r) => r.kind === 'duplicate_effective_route');
    expect(dupes.some((d) => d.key === 'GET /api/dup/list')).toBe(true);
    expect(model.findings.some((f) => f.code === 'DUPLICATE_EFFECTIVE_ROUTE')).toBe(true);
    expect(model.reachability.unmountedRouteCandidates).toContain('src/routes/orphan.ts');
    expect(model.findings.some((f) => f.code === 'UNMOUNTED_ROUTE_CANDIDATE')).toBe(true);
  });

  it('classifies module-scope versus function-local Maps', () => {
    const { model } = scanFixture();
    const mod = model.runtimeState.mapSetAllocations.find((m) => m.symbol === 'cache');
    expect(mod).toBeDefined();
    expect(mod!.scope).toBe('module');
    const local = model.runtimeState.mapSetAllocations.find((m) => m.symbol === 'local');
    expect(local).toBeDefined();
    expect(local!.scope).toBe('function');
    expect(model.findings.some((f) => f.code === 'MODULE_SCOPE_MAP_SET')).toBe(true);
  });

  it('flags unbounded Prisma findMany without take/cursor', () => {
    const { model } = scanFixture();
    const unbounded = model.prisma.unboundedQueryCandidates.filter((u) => u.operation === 'findMany');
    expect(unbounded.length).toBe(1);
    expect(unbounded[0].path).toBe('src/services/unbounded.ts');
    expect(model.findings.some((f) => f.code === 'UNBOUNDED_PRISMA_QUERY_CANDIDATE')).toBe(true);
  });

  it('detects raw SQL and runtime DDL candidates', () => {
    const { model } = scanFixture();
    expect(model.prisma.rawSql.length).toBeGreaterThanOrEqual(3);
    expect(model.prisma.rawSql.some((r) => r.unsafe)).toBe(true);
    expect(model.prisma.rawSql.some((r) => r.tables.includes('users'))).toBe(true);
    expect(model.prisma.runtimeDdlCandidates.some((d) => d.operation.includes('CREATE TABLE'))).toBe(true);
    expect(model.findings.some((f) => f.code === 'DDL_IN_RUNTIME_SOURCE')).toBe(true);
  });

  it('detects silent and broad catch candidates', () => {
    const { model } = scanFixture();
    expect(model.findings.some((f) => f.code === 'SILENT_CATCH')).toBe(true);
    expect(model.findings.some((f) => f.code === 'BROAD_OR_SWALLOWED_CATCH_CANDIDATE')).toBe(true);
  });

  it('emits stable sorted finding IDs across runs', () => {
    const backendRoot = buildFixture();
    const opts = { ...DEFAULT_OPTIONS, repositoryRoot: path.dirname(backendRoot), backendRoot };
    const first = runScan(opts);
    const second = runScan(opts);
    expect(second.model.scan.sourceFingerprint).toBe(first.model.scan.sourceFingerprint);
    expect(second.model.findings.map((f) => f.id)).toEqual(first.model.findings.map((f) => f.id));
    const codes = first.model.findings.map((f) => `${f.code}:${f.id}`);
    expect([...codes].sort()).toEqual(codes);
    for (const f of first.model.findings) {
      expect(f.autoAction).toBe('NONE');
      expect(f.finalDisposition).toBeNull();
    }
  });

  it('produces the required artifact schemas and route map sections', () => {
    const { model, inventory } = scanFixture();
    for (const key of [
      'schemaVersion', 'scan', 'summary', 'files', 'imports', 'exports', 'components',
      'routes', 'prisma', 'runtimeState', 'external', 'tests', 'duplicates', 'reachability', 'findings',
    ]) {
      expect(inventory).toHaveProperty(key);
    }
    const graph = buildDependencyGraph(model);
    expect(graph.schemaVersion).toBe('1.0');
    expect(graph.sourceFingerprint).toBe(model.scan.sourceFingerprint);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    const map = renderRouteMap(model);
    for (const section of [
      '# Backend Runtime Route Map',
      'STATIC STRUCTURAL EVIDENCE — NOT RUNTIME EXECUTION PROOF',
      '## Direct Runtime Mounts',
      '## Effective Endpoints',
      '## Factory / Composition Mounts',
      '## Duplicate Exact Route Candidates',
      '## Shared Mount-Prefix Candidates',
      '## Unmounted Route Candidates',
      '## Unresolved Route Dependencies',
    ]) {
      expect(map).toContain(section);
    }
  });

  it('parses Prisma models deterministically and groups multiple writers', () => {
    const { model } = scanFixture();
    expect(model.prisma.models.map((m) => m.name)).toContain('User');
    const group = model.prisma.modelWriterGroups.find((g) => g.model === 'user');
    expect(group).toBeDefined();
    expect(new Set(group!.writers.map((w) => w.path)).size).toBeGreaterThan(1);
    expect(model.findings.some((f) => f.code === 'MULTIPLE_MODEL_WRITERS_CANDIDATE')).toBe(true);
    expect(parsePrismaSchema('model A {\n id String @id\n}\n')).toHaveLength(1);
  });

  it('computes small cycles without false positives on acyclic graphs', () => {
    const cycles = computeCycles(['a', 'b'], [
      { path: 'a', line: 1, specifier: './b', importKind: 'static', resolution: 'internal_backend', resolvedPath: 'b' },
    ]);
    expect(cycles).toHaveLength(0);
  });
});
