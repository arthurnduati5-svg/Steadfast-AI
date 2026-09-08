/**
 * R8-A Backend Engineering Scanner — CLI entrypoint.
 *
 * Usage (from backend/):
 *   npx tsx tools/engineering/r8-engineering-scan.ts --repo-root ..
 *
 * Scanner failures (unparseable source tree, corrupt output, uncaught
 * exception, unwritable artifacts) exit non-zero. Repository findings
 * (unresolved imports, cycles, runtime DDL, ...) are evidence and exit zero.
 */
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { DEFAULT_OPTIONS, SCANNER_VERSION, runScan } from './scanner';
import { buildDependencyGraph, buildInventoryDocument, renderRouteMap } from './reporters';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq >= 0) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else {
      out[arg.slice(2)] = 'true';
    }
  }
  return out;
}

function resolveRoots(cwd: string, args: Record<string, string>): { repositoryRoot: string; backendRoot: string } {
  const hasBackendMarkers = (dir: string): boolean =>
    fs.existsSync(path.join(dir, 'src')) && fs.existsSync(path.join(dir, 'package.json'));

  let backendRoot: string;
  let repositoryRoot: string;

  if (args['backend-root']) {
    backendRoot = path.resolve(cwd, args['backend-root']);
  } else if (hasBackendMarkers(cwd)) {
    backendRoot = cwd;
  } else if (hasBackendMarkers(path.join(cwd, 'backend'))) {
    backendRoot = path.join(cwd, 'backend');
  } else {
    backendRoot = cwd;
  }

  if (args['repo-root']) {
    repositoryRoot = path.resolve(cwd, args['repo-root']);
  } else if (hasBackendMarkers(cwd) && path.basename(cwd) === 'backend') {
    repositoryRoot = path.dirname(cwd);
  } else {
    repositoryRoot = path.dirname(backendRoot);
  }

  return { repositoryRoot, backendRoot };
}

function gitMeta(backendRoot: string, repositoryRoot: string): { branch: string | null; head: string | null } {
  // Bounded Git metadata only; failures degrade to null, never to scan failure.
  for (const dir of [repositoryRoot, backendRoot]) {
    try {
      const branch = execFileSync('git', ['branch', '--show-current'], { cwd: dir, encoding: 'utf8', timeout: 15000 }).trim() || null;
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8', timeout: 15000 }).trim() || null;
      if (head) return { branch, head };
    } catch {
      continue;
    }
  }
  return { branch: null, head: null };
}

function assertArtifactInvariants(inventory: Record<string, unknown>): void {
  const fail = (msg: string): never => {
    throw new Error(`artifact invariant violated: ${msg}`);
  };
  const scan = inventory.scan as Record<string, unknown>;
  if (!scan || typeof scan !== 'object') fail('missing scan block');
  if (!(scan as { sourceFingerprint?: unknown }).sourceFingerprint) fail('missing sourceFingerprint');
  if (!(scan as { generatedAt?: unknown }).generatedAt) fail('missing generatedAt');
  const checkPaths = (value: unknown, where: string): void => {
    if (typeof value === 'string' && value.includes('\\')) fail(`backslash path in ${where}: ${value}`);
    if (Array.isArray(value)) {
      for (const v of value) checkPaths(v, where);
    } else if (value && typeof value === 'object') {
      const rec = value as Record<string, unknown>;
      if (typeof rec.path === 'string' && (rec.path as string).includes('\\')) {
        fail(`backslash path in ${where}: ${rec.path as string}`);
      }
      for (const v of Object.values(rec)) checkPaths(v, where);
    }
  };
  checkPaths(
    { files: inventory.files, imports: inventory.imports, routes: inventory.routes, findings: inventory.findings },
    'inventory',
  );
  const findings = inventory.findings as Array<Record<string, unknown>>;
  if (!Array.isArray(findings)) fail('findings is not an array');
  for (const f of findings) {
    if (f.autoAction !== 'NONE') fail(`finding ${String(f.id)} autoAction != NONE`);
    if (f.finalDisposition !== null && f.finalDisposition !== undefined) {
      fail(`finding ${String(f.id)} assigns a final disposition`);
    }
    const text = JSON.stringify(f);
    if (/\bKEEP\b|\bDELETE\b|\bMOVE\b|\bMERGE\b/.test(text) && !/CANDIDATE/.test(text)) {
      // Allow candidate wording only; hard dispositions are forbidden.
      if (/(finalDisposition|disposition)":"(KEEP|DELETE|MOVE|MERGE)/.test(text)) {
        fail(`finding ${String(f.id)} assigns a disposition`);
      }
    }
  }
}

function main(): void {
  const cwd = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const { repositoryRoot, backendRoot } = resolveRoots(cwd, args);
  const outDir = args['out-dir'] ? path.resolve(cwd, args['out-dir']) : path.join(backendRoot, 'docs', 'engineering');

  if (!fs.existsSync(path.join(backendRoot, 'src'))) {
    console.error(`[r8-scan] backend src root not found under ${backendRoot}`);
    process.exitCode = 2;
    return;
  }

  let result: ReturnType<typeof runScan>;
  try {
    result = runScan({
      ...DEFAULT_OPTIONS,
      repositoryRoot,
      backendRoot,
    });
  } catch (err) {
    console.error(`[r8-scan] SCANNER FAILURE: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
    return;
  }

  const git = gitMeta(backendRoot, repositoryRoot);
  result.model.scan.git = git;
  (result.model.scan as { repositoryRoot?: string }).repositoryRoot = result.model.scan.scope.repositoryRoot;

  const inventory = buildInventoryDocument(result.model);
  (inventory.scan as { git: unknown }).git = git;
  const graph = buildDependencyGraph(result.model);
  const routeMap = renderRouteMap(result.model);

  try {
    assertArtifactInvariants(inventory as unknown as Record<string, unknown>);
  } catch (err) {
    console.error(`[r8-scan] SCANNER FAILURE: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
    return;
  }

  try {
    fs.mkdirSync(outDir, { recursive: true });
    const invPath = path.join(outDir, '01_BACKEND_SYSTEM_INVENTORY.json');
    const graphPath = path.join(outDir, '02_BACKEND_DEPENDENCY_GRAPH.json');
    const mapPath = path.join(outDir, '03_BACKEND_RUNTIME_ROUTE_MAP.md');
    fs.writeFileSync(invPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
    fs.writeFileSync(graphPath, `${JSON.stringify(graph, null, 2)}\n`, 'utf8');
    fs.writeFileSync(mapPath, routeMap.endsWith('\n') ? routeMap : `${routeMap}\n`, 'utf8');
    // Re-parse to prove the artifacts are well-formed JSON / non-empty Markdown.
    JSON.parse(fs.readFileSync(invPath, 'utf8'));
    JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const md = fs.readFileSync(mapPath, 'utf8');
    if (!md.trim()) throw new Error('route map is empty');
  } catch (err) {
    console.error(`[r8-scan] SCANNER FAILURE: unable to write artifacts: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 2;
    return;
  }

  const s = inventory.summary;
  console.log(`[r8-scan] scanner=${SCANNER_VERSION} fingerprint=${inventory.scan.sourceFingerprint}`);
  console.log(
    `[r8-scan] files=${s.files} ts=${s.typescriptFiles} routes=${s.routeModules} mounts=${s.routeMounts} endpoints=${s.routeEndpoints} models=${s.prismaModels} unresolved=${s.unresolvedInternalImports} cycles=${s.cycles} findings=${s.findings}`,
  );
  console.log(`[r8-scan] artifacts written to ${outDir}`);
}

main();
