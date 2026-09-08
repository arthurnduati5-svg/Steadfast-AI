/**
 * R8-A Backend Engineering Scanner — core analysis engine.
 *
 * Deterministic: all output ordering is derived from sorted repository content,
 * never from filesystem traversal order. Repository findings are evidence;
 * they never cause a scanner failure.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as ts from 'typescript';
import type {
  AICallRecord,
  BackendSystemInventory,
  ComponentRecord,
  DeclarationRecord,
  DuplicateComponentRecord,
  DuplicateDeclarationRecord,
  DuplicateRouteRecord,
  DuplicateStateOwnerRecord,
  EffectiveRouteRecord,
  ExternalDependencyRecord,
  ExternalProviderRecord,
  FileRecord,
  FindingEvidence,
  FindingRecord,
  ImportRecord,
  PrismaAccessRecord,
  PrismaModelRecord,
  RawSqlRecord,
  RoleTag,
  RouteEndpointRecord,
  RouteMountRecord,
  RuntimeCollectionRecord,
  RuntimeDdlRecord,
  RuntimeReachability,
  ScanModel,
  TestRecord,
  UnboundedQueryRecord,
} from './types';

export const SCANNER_VERSION = '1.0.0';

export interface ScannerOptions {
  repositoryRoot: string;
  backendRoot: string;
  includedRoots: string[];
  excludedPatterns: string[];
  largeFileLines: number;
  largeFileBytes: number;
}

export const DEFAULT_OPTIONS: ScannerOptions = {
  repositoryRoot: '',
  backendRoot: '',
  includedRoots: ['src', 'prisma'],
  excludedPatterns: ['node_modules', 'dist', '.git', 'docs/engineering'],
  largeFileLines: 800,
  largeFileBytes: 50000,
};

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'all', 'use'] as const;
const PRISMA_RW_OPS: Record<string, 'read' | 'write'> = {
  findUnique: 'read', findUniqueOrThrow: 'read', findFirst: 'read', findFirstOrThrow: 'read',
  findMany: 'read', count: 'read', aggregate: 'read', groupBy: 'read',
  create: 'write', createMany: 'write', createManyAndReturn: 'write',
  update: 'write', updateMany: 'write', upsert: 'write',
  delete: 'write', deleteMany: 'write',
};

function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

function stableId(parts: Array<string | number>): string {
  return 'f-' + sha256(parts.join('|')).slice(0, 12);
}

/** Deterministic short structural fingerprint for declaration text. */
function declarationFingerprint(text: string): string {
  const normalized = text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return sha256(normalized).slice(0, 16);
}

// ---------------------------------------------------------------------------
// File enumeration
// ---------------------------------------------------------------------------

function listFilesRecursive(root: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) listFilesRecursive(full, out);
    else if (entry.isFile()) out.push(full);
  }
}

export function enumerateFiles(opts: ScannerOptions): string[] {
  const all: string[] = [];
  for (const included of opts.includedRoots) {
    const abs = path.join(opts.backendRoot, included);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      listFilesRecursive(abs, all);
    } else if (fs.existsSync(abs)) {
      all.push(abs);
    }
  }
  const excluded = opts.excludedPatterns.map((p) => p.split(path.sep).join('/'));
  const files = all
    .map((f) => toPosix(path.relative(opts.backendRoot, f)))
    .filter((rel) => {
      if (rel.includes('..')) return false;
      return !excluded.some((ex) => rel === ex || rel.startsWith(ex + '/'));
    });
  return Array.from(new Set(files)).sort();
}

// ---------------------------------------------------------------------------
// Path role tagging
// ---------------------------------------------------------------------------

const SERVICE_RE = /(^|\/)(services?|service)\//;
const REPO_RE = /(^|\/)(repositories?|repos?)\//;
const CONTRACT_RE = /(^|\/)(contracts?|schemas?|zod)\//;
const ROUTE_RE = /(^|\/)(routes?|routers?)\/|(Route|Routes|Router)\.tsx?$/;
const MIDDLEWARE_RE = /(^|\/)middleware\//;
const WORKER_RE = /worker|\.worker\./;
const SCRIPT_RE = /(^|\/)scripts?\//;
const TEST_FILE_RE = /\.(test|spec)\.[jt]sx?$/;
const PROOF_FILE_RE = /(^|\/)(r[1-9][a-z]?)[-._a-zA-Z0-9]*\.(test|worker|proof|ts)\.[jt]sx?$|task-?0?\d+[-._a-zA-Z0-9]*\.(test|proof)/i;
const TASK_NUM_RE = /task-?0?\d+/i;
const MILESTONE_WORKER_RE = /r[1-9][a-z]?-.*worker/i;

function classifyPath(rel: string): RoleTag[] {
  const tags = new Set<RoleTag>();
  if (rel === 'src/index.ts') tags.add('runtime_entrypoint');
  if (rel.startsWith('prisma/') && rel.endsWith('.prisma')) tags.add('prisma_schema');
  if (rel.startsWith('prisma/migrations/') && rel.endsWith('.sql')) tags.add('migration');
  if (TEST_FILE_RE.test(rel)) tags.add('test');
  if (PROOF_FILE_RE.test(rel) || TASK_NUM_RE.test(rel) || MILESTONE_WORKER_RE.test(rel)) tags.add('proof_candidate');
  if (ROUTE_RE.test(rel)) tags.add('route');
  if (SERVICE_RE.test(rel)) tags.add('service');
  if (REPO_RE.test(rel)) tags.add('repository');
  if (CONTRACT_RE.test(rel)) tags.add('contract');
  if (MIDDLEWARE_RE.test(rel)) tags.add('middleware');
  if (WORKER_RE.test(rel)) tags.add('worker');
  if (SCRIPT_RE.test(rel)) tags.add('script');
  if (rel.startsWith('src/domains/')) tags.add('domain');
  if (rel.endsWith('.ts') || rel.endsWith('.tsx')) tags.add('runtime_source');
  return Array.from(tags).sort() as RoleTag[];
}

// ---------------------------------------------------------------------------
// Prisma schema parsing (no Prisma dependency)
// ---------------------------------------------------------------------------

export function parsePrismaSchema(content: string): PrismaModelRecord[] {
  const lines = content.split(/\r?\n/);
  const models: PrismaModelRecord[] = [];
  let current: PrismaModelRecord | null = null;
  lines.forEach((raw, i) => {
    const line = raw.trim();
    const modelMatch = /^(model|enum)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/.exec(line);
    if (modelMatch && modelMatch[1] === 'model') {
      current = { name: modelMatch[2], line: i + 1, fields: [], modelAttributes: [] };
      models.push(current);
      return;
    }
    if (modelMatch && modelMatch[1] === 'enum') {
      current = null;
      return;
    }
    if (current) {
      if (line === '}') {
        current = null;
        return;
      }
      if (!line || line.startsWith('//') || line.startsWith('@@')) {
        const attrMatch = /^@@(\w+)\s*\(?(.*?)\)?\s*$/.exec(line);
        if (attrMatch && attrMatch[1] !== '') {
          (current as PrismaModelRecord).modelAttributes.push({
            name: '@@' + attrMatch[1],
            value: attrMatch[2],
            line: i + 1,
          });
        }
        return;
      }
      const fieldMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s+([A-Za-z_][A-Za-z0-9_]*\[\??]?|\??[A-Za-z_][A-Za-z0-9_]*)\s*(.*)$/.exec(line);
      if (fieldMatch) {
        let type = fieldMatch[2];
        let list = false;
        let optional = false;
        if (type.endsWith('[]')) { list = true; type = type.slice(0, -2); }
        if (type.endsWith('?')) { optional = true; type = type.slice(0, -1); }
        const attributes = (fieldMatch[3].match(/@\w+(\([^)]*\))?/g) ?? []).map((a) => a);
        (current as PrismaModelRecord).fields.push({
          name: fieldMatch[1],
          type,
          optional,
          list,
          attributes,
        });
      }
    }
  });
  return models;
}

// ---------------------------------------------------------------------------
// Main scan
// ---------------------------------------------------------------------------

interface SourceAnalysis {
  imports: ImportRecord[];
  declarations: DeclarationRecord[];
  endpoints: RouteEndpointRecord[];
  mounts: RouteMountRecord[];
  prismaAccesses: PrismaAccessRecord[];
  rawSql: RawSqlRecord[];
  runtimeDdl: RuntimeDdlRecord[];
  unbounded: UnboundedQueryRecord[];
  mapSets: RuntimeCollectionRecord[];
  cacheCandidates: RuntimeCollectionRecord[];
  catchSignals: Array<{ path: string; line: number; kind: 'silent' | 'broad'; confidence: 'high' | 'medium' | 'low' }>;
  aiCalls: AICallRecord[];
  testSignals: string[];
  legacySignals: string[];
  externalProviderImports: ExternalProviderRecord[];
}

function lineOf(node: ts.Node, source: ts.SourceFile): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

function excerptOf(node: ts.Node, source: ts.SourceFile, max = 90): string {
  const text = source.text.slice(node.getStart(source), node.getEnd());
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export function analyzeSourceFile(
  absPath: string,
  relPath: string,
  content: string,
  resolver: (spec: string, fromFile: string) => { resolution: ImportRecord['resolution']; resolvedPath: string | null },
): SourceAnalysis {
  const source = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const imports: ImportRecord[] = [];
  const declarations: DeclarationRecord[] = [];
  const endpoints: RouteEndpointRecord[] = [];
  const mounts: RouteMountRecord[] = [];
  const prismaAccesses: PrismaAccessRecord[] = [];
  const rawSql: RawSqlRecord[] = [];
  const runtimeDdl: RuntimeDdlRecord[] = [];
  const unbounded: UnboundedQueryRecord[] = [];
  const mapSets: RuntimeCollectionRecord[] = [];
  const cacheCandidates: RuntimeCollectionRecord[] = [];
  const catchSignals: SourceAnalysis['catchSignals'] = [];
  const aiCalls: AICallRecord[] = [];
  const testSignals: string[] = [];
  const legacySignals: string[] = [];
  const externalProviderImports: ExternalProviderRecord[] = [];

  const PROVIDERS = ['openai', '@pinecone-database/pinecone', 'redis', 'ioredis', 'axios', 'node-fetch'];
  const CACHE_SIGNALS = /cache|ttl|expires|memo|inflight|store|singleton/i;
  const DDL_RE = /\b(CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+(UNIQUE\s+)?INDEX|DROP\s+INDEX|TRUNCATE)\b/i;
  const RAW_TABLE_RE = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+"?([A-Za-z_][A-Za-z0-9_]*)"?/gi;    const recordImport = (specifier: string, node: ts.Node, kind: ImportRecord['importKind']) => {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
      const col = source.getLineAndCharacterOfPosition(node.getStart(source)).character + 1;
      let symbol: string | undefined;
      if (ts.isImportDeclaration(node) && node.importClause && node.importClause.name) {
        symbol = node.importClause.name.text;
      }
    let resolution: ImportRecord['resolution'];
    let resolvedPath: string | null = null;
    if (kind === 'non_literal_dynamic') {
      resolution = 'dynamic_unknown';
    } else {
      const r = resolver(specifier, relPath);
      resolution = r.resolution;
      resolvedPath = r.resolvedPath;
    }
    imports.push({
      path: relPath,
      line,
      column: col,
      symbol,
      excerpt: specifier.length > 120 ? specifier.slice(0, 120) + '…' : specifier,
      specifier,
      importKind: kind,
      resolution,
      resolvedPath,
    });
  };

  const visit = (node: ts.Node): void => {
    // ---- imports ----
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      recordImport((node.moduleSpecifier as ts.StringLiteral).text, node, 'static');
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      recordImport((node.moduleSpecifier as ts.StringLiteral).text, node, 'export_from');
    } else if (ts.isCallExpression(node)) {
      const exprText = node.expression.getText(source);
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        recordImport((node.arguments[0] as ts.StringLiteral).text, node, 'dynamic');
      } else if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        recordImport('<non-literal>', node, 'non_literal_dynamic');
      } else if (exprText === 'require' && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
        recordImport((node.arguments[0] as ts.StringLiteral).text, node, 'require');
      }
    }

    // ---- declarations ----
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)) {
      if (node.name) {
        const kind = ts.isInterfaceDeclaration(node) ? 'interface'
          : ts.isTypeAliasDeclaration(node) ? 'type'
          : ts.isEnumDeclaration(node) ? 'enum' : 'class';
        declarations.push({
          path: relPath, line: lineOf(node, source),
          symbol: node.name.text, kind, exported: hasExportModifier(node),
          fingerprint: declarationFingerprint(node.getText(source)),
        });
      }
    } else if (ts.isFunctionDeclaration(node) && node.name && hasExportModifier(node)) {
      declarations.push({
        path: relPath, line: lineOf(node, source),
        symbol: node.name.text, kind: 'function', exported: true,
        fingerprint: declarationFingerprint(node.getText(source)),
      });
    } else if (ts.isVariableStatement(node) && hasExportModifier(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          declarations.push({
            path: relPath, line: lineOf(node, source),
            symbol: decl.name.text, kind: 'const', exported: true,
            fingerprint: declarationFingerprint(node.getText(source)),
          });
        }
      }
    }

    // ---- Express routes ----
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let sym: string | null = null;
      let method: string | null = null;
      if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.name)) {
        const lower = expr.name.text.toLowerCase();
        if ((HTTP_METHODS as readonly string[]).includes(lower)) {
          method = lower;
          if (ts.isIdentifier(expr.expression)) sym = expr.expression.text;
        }
      }
      if (sym && method) {
        const line = lineOf(node, source);
        const firstArg = node.arguments[0];
        const localPath = firstArg && ts.isStringLiteral(firstArg) ? firstArg.text : '<dynamic>';
        const middleware = node.arguments.slice(1)
          .map((a) => (ts.isIdentifier(a) ? a.text : ts.isPropertyAccessExpression(a) ? a.getText(source) : null))
          .filter((x): x is string => !!x);
        if (method === 'use') {
          // Composition mount: app.use(...) or router.use(...).
          // First string-literal argument is the mount path (may be absent -> '').
          const mountPath = localPath === '<dynamic>' ? '' : localPath;
          const routerArgs = node.arguments.slice(mountPath !== '' || (firstArg && ts.isStringLiteral(firstArg)) ? 1 : 0).filter(
            (a) => ts.isIdentifier(a) || (ts.isCallExpression(a) && /Router\s*\(\s*\)$/.test(a.expression.getText(source))),
          );
          for (const routerArg of routerArgs) {
            const routerSymbol = ts.isIdentifier(routerArg) ? routerArg.text : (routerArg as ts.CallExpression).expression.getText(source);
            const isFactory = !ts.isIdentifier(routerArg);
            let importOrigin: string | null = null;
            const imported = imports.find((im) => im.symbol === routerSymbol || im.specifier.endsWith('/' + routerSymbol));
            if (imported) importOrigin = imported.resolvedPath;
            mounts.push({
              path: relPath, line, mountPath,
              routerSymbol, middleware, importOrigin,
              resolution: isFactory ? 'factory' : importOrigin ? 'direct' : 'unknown',
            });
          }
          // A bare use() with no identifiable router argument still records composition evidence.
          if (routerArgs.length === 0 && (mountPath !== '' || node.arguments.length > 0)) {
            mounts.push({
              path: relPath, line, mountPath,
              routerSymbol: '<unknown>', middleware, importOrigin: null,
              resolution: 'unknown',
            });
          }
        } else {
          endpoints.push({ path: relPath, line, routerSymbol: sym, method, localPath, middleware });
        }
      }
    }

    // ---- Prisma access ----
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.name)) {
      const op = node.name.text;
      if (op in PRISMA_RW_OPS) {
        const obj = node.expression;
        let clientSymbol: string | null = null;
        let model: string | null = null;
        // forms: client.model.op(...)  OR  (prisma as any).model.op
        if (ts.isPropertyAccessExpression(obj) && ts.isIdentifier(obj.name)) {
          model = obj.name.text;
          const base = obj.expression;
          if (ts.isIdentifier(base)) clientSymbol = base.text;
          else if (ts.isAsExpression(base) && ts.isIdentifier((base.expression as ts.Node))) clientSymbol = (base.expression as ts.Identifier).text;
        }
        if (clientSymbol && model && !model.startsWith('$')) {
          const line = lineOf(node, source);
          const lowerClient = clientSymbol.toLowerCase();
          if (lowerClient.includes('prisma') || lowerClient.includes('tx') || lowerClient.includes('db')) {
            const layerSignal = relPath.includes('repositor') ? 'repository'
              : relPath.includes('service') ? 'service'
              : relPath.includes('route') ? 'route' : 'other';
            prismaAccesses.push({
              path: relPath, line, clientSymbol, model, operation: op,
              readWrite: PRISMA_RW_OPS[op], layerSignal,
            });
            // Unbounded findMany: no argument object or no take/cursor
            if (op === 'findMany') {
              const call = findParentCall(node, source);
              if (call) {
                const arg = call.arguments[0];
                const noArg = call.arguments.length === 0;
                const emptyObj = arg && ts.isObjectLiteralExpression(arg) && arg.properties.length === 0;
                const noTake = arg && ts.isObjectLiteralExpression(arg) && !arg.properties.some((p) => {
                  const nm = ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) ? p.name.getText(source) : null;
                  return nm === 'take' || nm === 'cursor';
                });
                if (noArg || emptyObj || noTake) {
                  unbounded.push({ path: relPath, line, model, operation: 'findMany', confidence: noArg || emptyObj ? 'high' : 'medium' });
                }
              }
            }
          }
        }
      }
      // raw SQL
      if (['$queryRaw', '$queryRawUnsafe', '$executeRaw', '$executeRawUnsafe'].includes(op)) {
        const line = lineOf(node, source);
        const call = findParentCall(node, source);
        let firstArgText = call && call.arguments.length > 0 ? call.arguments[0].getText(source) : '';
        if (!firstArgText) {
          // Tagged-template form: prisma.$queryRaw`SELECT ... FROM t`
          let cur: ts.Node | undefined = node.parent;
          while (cur) {
            if (ts.isTaggedTemplateExpression(cur)) {
              firstArgText = cur.template.getText(source);
              break;
            }
            if (ts.isCallExpression(cur)) break;
            cur = cur.parent;
          }
        }
        const unsafe = op.endsWith('Unsafe');
        const tables: string[] = [];
        let m: RegExpExecArray | null;
        RAW_TABLE_RE.lastIndex = 0;
        while ((m = RAW_TABLE_RE.exec(firstArgText)) !== null) {
          if (!tables.includes(m[1])) tables.push(m[1]);
          if (tables.length >= 5) break;
        }
        const kindMatch = /\b(SELECT|INSERT|UPDATE|DELETE)\b/i.exec(firstArgText);
        rawSql.push({
          path: relPath, line, api: op,
          queryKind: kindMatch ? kindMatch[1].toUpperCase() : null,
          tables, unsafe,
        });
        // Unbounded raw select
        if (kindMatch && kindMatch[1].toUpperCase() === 'SELECT' && !/\bLIMIT\b|\bCOUNT\s*\(/i.test(firstArgText)) {
          unbounded.push({ path: relPath, line, model: tables[0] ?? null, operation: 'raw_select', confidence: 'low' });
        }
        // DDL in runtime source
        const ddlMatch = DDL_RE.exec(firstArgText);
        if (ddlMatch) {
          runtimeDdl.push({ path: relPath, line, operation: ddlMatch[0].toUpperCase().replace(/\s+/g, ' '), excerpt: firstArgText.slice(0, 90) });
        }
      }
    }

    // ---- DDL in template literals / string literals ----
    if (ts.isTemplateLiteral(node) || ts.isStringLiteralLike(node)) {
      const text = node.getText(source);
      const ddl = DDL_RE.exec(text);
      if (ddl) {
        const line = lineOf(node, source);
        runtimeDdl.push({ path: relPath, line, operation: ddl[0].toUpperCase().replace(/\s+/g, ' '), excerpt: text.slice(1, 91) });
      }
    }

    // ---- Map/Set ----
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && (node.expression.text === 'Map' || node.expression.text === 'Set')) {
      const line = lineOf(node, source);
      let symbol = '<anonymous>';
      let scope: RuntimeCollectionRecord['scope'] = 'unknown';
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
        symbol = parent.name.text;
        let anc: ts.Node = parent.parent;
        while (anc) {
          if (ts.isSourceFile(anc)) { scope = 'module'; break; }
          if (ts.isClassDeclaration(anc) || ts.isClassExpression(anc)) { scope = 'class'; break; }
          if (ts.isFunctionDeclaration(anc) || ts.isFunctionExpression(anc) || ts.isArrowFunction(anc) || ts.isMethodDeclaration(anc)) { scope = 'function'; break; }
          anc = anc.parent;
        }
      } else if (ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) {
        const nm = (parent as ts.PropertyAssignment).name ?? (parent as ts.PropertyDeclaration).name;
        if (nm && ts.isIdentifier(nm)) {
          symbol = nm.text;
          let anc: ts.Node = parent.parent;
          while (anc) {
            if (ts.isSourceFile(anc)) { scope = 'module'; break; }
            if (ts.isClassDeclaration(anc) || ts.isClassExpression(anc)) { scope = 'class'; break; }
            if (ts.isFunctionDeclaration(anc) || ts.isFunctionExpression(anc) || ts.isArrowFunction(anc) || ts.isMethodDeclaration(anc)) { scope = 'function'; break; }
            anc = anc.parent;
          }
        }
      }
      const rec: RuntimeCollectionRecord = {
        path: relPath, line, symbol, scope, collectionType: node.expression.text as 'Map' | 'Set',
        cacheSignal: CACHE_SIGNALS.test(symbol) || CACHE_SIGNALS.test(relPath) ? (symbol.match(CACHE_SIGNALS)?.[0] ?? 'context') : null,
      };
      mapSets.push(rec);
      if (rec.cacheSignal) cacheCandidates.push(rec);
    }

    // ---- catch clauses ----
    if (ts.isCatchClause(node)) {
      const line = lineOf(node, source);
      const block = node.block;
      const hasContent = block.statements.length > 0;
      if (!hasContent) {
        catchSignals.push({ path: relPath, line, kind: 'silent', confidence: 'high' });
      } else {
        const text = block.getText(source);
        const rethrows = /throw\b/.test(text);
        const logs = /console\.|logger\.|log\.|logError|reportError|telemetry|winston|pino/i.test(text);
        const responds = /status\(|sendStatus\(|json\(|send\(|res\./.test(text);
        if (!rethrows && !logs && !responds) {
          catchSignals.push({ path: relPath, line, kind: 'broad', confidence: 'medium' });
        }
      }
    }

    // ---- AI call shapes ----
    if (ts.isCallExpression(node)) {
      const text = node.expression.getText(source);
      if (/completions?\.create|chat\.completions|embeddings\.create|responses\.create|generateContent/i.test(text)) {
        const line = lineOf(node, source);
        aiCalls.push({ path: relPath, line, symbol: text, excerpt: excerptOf(node, source) });
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(source);

  // legacy/compat signals in comments and identifiers
  const LEGACY_RE = /\blegacy\b|\bcompat(ibility)?\b|\bdeprecated\b|\bfallback\b|\bv1\b|\bv2\b/i;
  const lines = content.split(/\r?\n/);
  lines.forEach((ln, i) => {
    if (LEGACY_RE.test(ln)) {
      const sig = (ln.match(LEGACY_RE)?.[0] ?? 'legacy').toLowerCase();
      if (!legacySignals.some((s) => s.startsWith(`${sig}:`))) {
        legacySignals.push(`${sig}:${relPath}:${i + 1}`);
      }
    }
  });

  // external provider imports
  for (const im of imports) {
    const spec = im.specifier;
    const provider = PROVIDERS.find((p) => spec === p || spec.startsWith(p + '/'));
    if (provider) {
      externalProviderImports.push({ path: relPath, line: im.line, provider, specifier: spec });
    }
  }

  // test/proof signals
  if (TEST_FILE_RE.test(relPath)) testSignals.push('test_file_suffix');
  if (TASK_NUM_RE.test(relPath)) testSignals.push('task_numbered_path');
  if (MILESTONE_WORKER_RE.test(relPath)) testSignals.push('milestone_worker_path');
  if (/(^|\/)r[1-9][a-z]?[-._]/i.test(relPath)) testSignals.push('milestone_prefixed_path');

  return {
    imports, declarations, endpoints, mounts, prismaAccesses, rawSql, runtimeDdl,
    unbounded, mapSets, cacheCandidates, catchSignals, aiCalls, testSignals,
    legacySignals, externalProviderImports,
  };
}

function findParentCall(node: ts.Node, _source: ts.SourceFile): ts.CallExpression | null {
  let cur: ts.Node | undefined = node.parent;
  while (cur) {
    if (ts.isCallExpression(cur)) return cur;
    cur = cur.parent;
  }
  return null;
}

function hasExportModifier(node: ts.Node): boolean {
  const mods = (node as { modifiers?: ts.NodeArray<ts.Modifier> }).modifiers;
  return !!mods && mods.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

// ---------------------------------------------------------------------------
// Module resolution
// ---------------------------------------------------------------------------

export function createResolver(
  opts: ScannerOptions,
  compilerOptions: ts.CompilerOptions,
  existingFiles: Set<string>,
): (spec: string, fromFile: string) => { resolution: ImportRecord['resolution']; resolvedPath: string | null } {
  const CROSS_LANE_SPEC_RE = /^@\/|(?:^|\/)\.\.\/AI\/|(?:^|\/)AI\//;
  return (spec: string, fromFile: string) => {
    if (!spec.startsWith('.') && !spec.startsWith('@/')) {
      return { resolution: 'external_package', resolvedPath: null };
    }
    // Use TS module resolution against the backend compiler options.
    const containingFile = path.join(opts.backendRoot, fromFile);
    const resolved = ts.resolveModuleName(spec, containingFile, compilerOptions, ts.sys);
    const resolvedPath = resolved.resolvedModule ? toPosix(path.relative(opts.backendRoot, resolved.resolvedModule.resolvedFileName)) : null;
    const looksCrossLane = (p: string | null): boolean => {
      if (!p) return CROSS_LANE_SPEC_RE.test(spec);
      const n = p.replace(/\\/g, '/');
      return n.startsWith('../') || n.includes('/AI/') || n.startsWith('AI/') || CROSS_LANE_SPEC_RE.test(spec);
    };
    if (resolvedPath && existingFiles.has(resolvedPath)) {
      const resolution: ImportRecord['resolution'] = looksCrossLane(resolvedPath) ? 'cross_lane_internal' : 'internal_backend';
      return { resolution, resolvedPath };
    }
    if (resolved.resolvedModule) {
      // resolves outside the scanned set (e.g. declaration/dist or a lane we do not scan)
      const resolution: ImportRecord['resolution'] = looksCrossLane(resolvedPath) ? 'cross_lane_internal' : 'internal_backend';
      return { resolution, resolvedPath };
    }
    return { resolution: 'unresolved_internal', resolvedPath: null };
  };
}

// ---------------------------------------------------------------------------
// Reachability + cycles
// ---------------------------------------------------------------------------

export function computeReachability(
  files: FileRecord[],
  imports: ImportRecord[],
  runtimeEntrypoints: string[],
  auxiliaryEntrypoints: string[],
): { reachable: string[]; unreachableCandidates: string[]; unmountedRouteCandidates: string[] } {
  const adj = new Map<string, Set<string>>();
  for (const im of imports) {
    if (!im.resolvedPath) continue;
    if (!adj.has(im.path)) adj.set(im.path, new Set());
    adj.get(im.path)!.add(im.resolvedPath);
  }
  const roots = [...runtimeEntrypoints, ...auxiliaryEntrypoints].filter((f) => files.some((x) => x.path === f));
  const seen = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const cur = queue.shift()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const next of adj.get(cur) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  const sourceFiles = files.filter((f) => f.path.startsWith('src/') && f.path.endsWith('.ts'));
  const reachable = Array.from(seen).sort();
  const unreachableCandidates = sourceFiles.map((f) => f.path).filter((p) => !seen.has(p)).sort();
  // routes never mounted: route files not reachable AND not imported by a mountable file
  const unmountedRouteCandidates = files
    .filter((f) => f.roleTags.includes('route') && !seen.has(f.path))
    .map((f) => f.path)
    .sort();
  return { reachable, unreachableCandidates, unmountedRouteCandidates };
}

export function computeCycles(paths: string[], imports: ImportRecord[]): Array<{ id: string; members: string[] }> {
  // Deterministic Kosaraju SCC over static internal edges.
  const nodes = Array.from(new Set(paths)).sort();
  const inSet = new Set(nodes);
  const adj = new Map<string, string[]>();
  const radj = new Map<string, string[]>();
  for (const n of nodes) { adj.set(n, []); radj.set(n, []); }
  const edgeKeys = new Set<string>();
  for (const im of imports) {
    if (!im.resolvedPath || !inSet.has(im.path) || !inSet.has(im.resolvedPath)) continue;
    if (im.importKind === 'dynamic') continue; // dynamic edges do not force init order
    if (im.path === im.resolvedPath) continue; // self-import is not a module cycle
    const key = im.path + '\0' + im.resolvedPath;
    if (edgeKeys.has(key)) continue;
    edgeKeys.add(key);
    adj.get(im.path)!.push(im.resolvedPath);
    radj.get(im.resolvedPath)!.push(im.path);
  }
  for (const n of nodes) { adj.get(n)!.sort(); radj.get(n)!.sort(); }
  // First pass: finishing order (iterative DFS).
  const visited = new Set<string>();
  const order: string[] = [];
  for (const start of nodes) {
    if (visited.has(start)) continue;
    const stack: Array<{ node: string; idx: number }> = [{ node: start, idx: 0 }];
    visited.add(start);
    while (stack.length) {
      const top = stack[stack.length - 1];
      const neighbors = adj.get(top.node)!;
      if (top.idx < neighbors.length) {
        const w = neighbors[top.idx];
        top.idx += 1;
        if (!visited.has(w)) {
          visited.add(w);
          stack.push({ node: w, idx: 0 });
        }
      } else {
        order.push(top.node);
        stack.pop();
      }
    }
  }
  // Second pass on the transpose graph.
  const assigned = new Set<string>();
  const cycles: Array<{ id: string; members: string[] }> = [];
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const start = order[i];
    if (assigned.has(start)) continue;
    const members: string[] = [];
    const stack = [start];
    assigned.add(start);
    while (stack.length) {
      const cur = stack.pop()!;
      members.push(cur);
      for (const w of radj.get(cur)!) {
        if (!assigned.has(w)) {
          assigned.add(w);
          stack.push(w);
        }
      }
    }
    if (members.length > 1) {
      members.sort();
      cycles.push({ id: stableId(['cycle', ...members]), members });
    }
  }
  cycles.sort((a, b) => a.members.join(',').localeCompare(b.members.join(',')));
  return cycles;
}

// ---------------------------------------------------------------------------
// Duplicate analysis
// ---------------------------------------------------------------------------

const NORMALIZE_TOKENS = [
  /task\d+/gi, /r\d[a-z]?/gi, /v\d+/gi, /legacy/gi, /compat(ibility)?/gi, /durable/gi,
  /inmemory/gi, /prisma/gi, /postgres/gi, /service/gi, /repository/gi,
];

export function normalizeComponentName(name: string): string {
  let n = name;
  for (const re of NORMALIZE_TOKENS) n = n.replace(re, '');
  return n.toLowerCase().replace(/[^a-z]/g, '');
}

export function computeDuplicates(
  declarations: DeclarationRecord[],
  services: ComponentRecord[],
  repositories: ComponentRecord[],
  mounts: RouteMountRecord[],
  endpoints: RouteEndpointRecord[],
  effectiveRoutes: EffectiveRouteRecord[],
  mapSets: RuntimeCollectionRecord[],
): {
  declarationCandidates: DuplicateDeclarationRecord[];
  serviceCandidates: DuplicateComponentRecord[];
  repositoryCandidates: DuplicateComponentRecord[];
  routeCandidates: DuplicateRouteRecord[];
  stateOwnerCandidates: DuplicateStateOwnerRecord[];
} {
  // duplicate declarations
  const declByName = new Map<string, DeclarationRecord[]>();
  for (const d of declarations) {
    if (!(d.kind === 'interface' || d.kind === 'type')) continue;
    const key = d.symbol;
    const arr = declByName.get(key) ?? [];
    arr.push(d);
    declByName.set(key, arr);
  }
  const declarationCandidates: DuplicateDeclarationRecord[] = [];
  for (const [name, list] of Array.from(declByName.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (list.length < 2) continue;
    const byFp = new Map<string, DeclarationRecord[]>();
    for (const d of list) {
      const arr = byFp.get(d.fingerprint) ?? [];
      arr.push(d);
      byFp.set(d.fingerprint, arr);
    }
    const fps = Array.from(byFp.keys()).sort();
    const sameFingerprint = fps.length === 1;
    for (const fp of fps) {
      const occ = byFp.get(fp)!;
      declarationCandidates.push({
        name,
        kind: list[0].kind,
        sameFingerprint,
        fingerprint: fp,
        occurrences: occ.map((o) => ({ path: o.path, line: o.line })).sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
      });
    }
  }
  declarationCandidates.sort((a, b) => a.name.localeCompare(b.name) || a.fingerprint.localeCompare(b.fingerprint));

  // duplicate components
  const groupComponents = (list: ComponentRecord[]): DuplicateComponentRecord[] => {
    const byKey = new Map<string, { names: Set<string>; paths: Set<string>; symbols: Set<string> }>();
    for (const c of list) {
      const key = normalizeComponentName(path.basename(c.path).replace(/\.[jt]sx?$/, ''));
      if (!key) continue;
      const g = byKey.get(key) ?? { names: new Set(), paths: new Set(), symbols: new Set() };
      g.names.add(path.basename(c.path).replace(/\.[jt]sx?$/, ''));
      g.paths.add(c.path);
      for (const e of c.exports) g.symbols.add(e);
      byKey.set(key, g);
    }
    const out: DuplicateComponentRecord[] = [];
    for (const [key, g] of Array.from(byKey.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const originalNames = Array.from(g.names).sort();
      const paths = Array.from(g.paths).sort();
      // distinct original names with same normalized key and multiple files
      const distinctNames = new Set(originalNames.map((n) => n.toLowerCase()));
      if (paths.length >= 2 && originalNames.length >= 2 && distinctNames.size >= 1) {
        out.push({
          normalizedKey: key,
          originalNames,
          confidence: 'low',
          reason: 'same normalized component name after removing structural tokens (task#, r#, v#, legacy, compat, durable, inmemory, prisma, postgres, service, repository)',
          paths,
        });
      }
    }
    return out;
  };
  const serviceCandidates = groupComponents(services);
  const repositoryCandidates = groupComponents(repositories);

  // duplicate routes
  const routeCandidates: DuplicateRouteRecord[] = [];
  const byExact = new Map<string, EffectiveRouteRecord[]>();
  for (const er of effectiveRoutes) {
    const key = `${er.method.toUpperCase()} ${er.effectivePath}`;
    const arr = byExact.get(key) ?? [];
    arr.push(er);
    byExact.set(key, arr);
  }
  for (const [key, list] of Array.from(byExact.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const owners = new Set(list.map((e) => e.routeSource));
    if (owners.size > 1) {
      routeCandidates.push({
        kind: 'duplicate_effective_route',
        key,
        occurrences: list
          .map((e) => ({ path: e.routeSource, line: e.routeLine, detail: `mounted via ${e.mountSource}:${e.mountLine}` }))
          .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
      });
    }
  }
  const byPrefix = new Map<string, RouteMountRecord[]>();
  for (const m of mounts) {
    const prefix = m.mountPath.split('/').filter(Boolean).slice(0, 2).join('/');
    if (!prefix) continue;
    const arr = byPrefix.get(prefix) ?? [];
    arr.push(m);
    byPrefix.set(prefix, arr);
  }
  for (const [prefix, list] of Array.from(byPrefix.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    const routers = new Set(list.map((m) => m.routerSymbol));
    if (routers.size > 1 && list.length > 1) {
      routeCandidates.push({
        kind: 'shared_mount_prefix',
        key: '/' + prefix,
        occurrences: list
          .map((m) => ({ path: m.path, line: m.line, detail: `router ${m.routerSymbol} at ${m.mountPath}` }))
          .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
      });
    }
  }
  routeCandidates.sort((a, b) => a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key));

  // state owners: module-scope maps with same normalized symbol
  const stateOwnerCandidates: DuplicateStateOwnerRecord[] = [];
  const moduleMaps = mapSets.filter((m) => m.scope === 'module');
  const bySym = new Map<string, RuntimeCollectionRecord[]>();
  for (const m of moduleMaps) {
    const key = m.symbol.toLowerCase();
    const arr = bySym.get(key) ?? [];
    arr.push(m);
    bySym.set(key, arr);
  }
  for (const [key, list] of Array.from(bySym.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    if (list.length < 2) continue;
    const paths = list.map((m) => m.path).sort();
    if (new Set(paths).size > 1) {
      stateOwnerCandidates.push({
        normalizedKey: key,
        originalSymbols: Array.from(new Set(list.map((m) => m.symbol))).sort(),
        paths,
        reason: 'module-scope mutable collection with the same symbol name in multiple files',
      });
    }
  }
  stateOwnerCandidates.sort((a, b) => a.normalizedKey.localeCompare(b.normalizedKey));

  return { declarationCandidates, serviceCandidates, repositoryCandidates, routeCandidates, stateOwnerCandidates };
}

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

export function buildFindings(model: Omit<ScanModel, 'findings'>): FindingRecord[] {
  const findings: FindingRecord[] = [];
  const add = (
    code: string,
    category: FindingRecord['category'],
    severity: FindingRecord['severity'],
    confidence: FindingRecord['confidence'],
    message: string,
    evidence: FindingEvidence[],
    relatedPaths: string[],
  ) => {
    findings.push({
      id: stableId([code, ...evidence.map((e) => `${e.path}:${e.line}:${e.symbol ?? ''}`)]),
      code,
      category, severity, confidence, message,
      evidence: evidence.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
      relatedPaths: Array.from(new Set(relatedPaths)).sort(),
      finalDisposition: null,
      autoAction: 'NONE',
    });
  };

  // unresolved imports
  for (const im of model.imports.filter((i) => i.resolution === 'unresolved_internal')) {
    add('UNRESOLVED_INTERNAL_IMPORT', 'dependency', 'error', 'high',
      `Internal import '${im.specifier}' cannot be resolved`,
      [{ path: im.path, line: im.line, column: im.column, excerpt: im.specifier }], [im.path]);
  }
  // non-literal dynamic
  for (const im of model.imports.filter((i) => i.importKind === 'non_literal_dynamic')) {
    add('NON_LITERAL_DYNAMIC_DEPENDENCY', 'dependency', 'warning', 'medium',
      'Non-literal dynamic import/require reduces static reachability confidence',
      [{ path: im.path, line: im.line, column: im.column }], [im.path]);
  }
  // cycles
  for (const cy of model.cycles) {
    add('DEPENDENCY_CYCLE', 'dependency', 'warning', 'high',
      `Dependency cycle among ${cy.members.length} modules`,
      cy.members.slice(0, 5).map((p) => ({ path: p, line: 1 })), cy.members);
  }
  // unmounted routes
  for (const p of model.reachability.unmountedRouteCandidates) {
    add('UNMOUNTED_ROUTE_CANDIDATE', 'routing', 'info', 'medium',
      'Route file is not statically reachable from any runtime entrypoint',
      [{ path: p, line: 1 }], [p]);
  }
  // duplicate effective routes
  for (const rc of model.duplicates.routeCandidates) {
    if (rc.kind === 'duplicate_effective_route') {
      add('DUPLICATE_EFFECTIVE_ROUTE', 'routing', 'warning', 'high',
        `Exact duplicate effective route: ${rc.key}`,
        rc.occurrences.map((o) => ({ path: o.path, line: o.line, excerpt: o.detail })), rc.occurrences.map((o) => o.path));
    } else {
      add('SHARED_MOUNT_PREFIX_CANDIDATE', 'routing', 'info', 'medium',
        `Multiple routers share mount prefix ${rc.key}`,
        rc.occurrences.map((o) => ({ path: o.path, line: o.line, excerpt: o.detail })), rc.occurrences.map((o) => o.path));
    }
  }
  // large modules
  for (const f of model.files) {
    if (f.lines > model.scan.heuristics.largeFileLines || f.bytes > model.scan.heuristics.largeFileBytes) {
      add('LARGE_MODULE', 'organization', 'info', 'high',
        `Large file: ${f.lines} lines, ${f.bytes} bytes`,
        [{ path: f.path, line: 1 }], [f.path]);
    }
  }
  // module-scope Map/Set
  for (const ms of model.runtimeState.mapSetAllocations.filter((m) => m.scope === 'module')) {
    add('MODULE_SCOPE_MAP_SET', 'runtime_state', 'warning', 'high',
      `Module-scope mutable ${ms.collectionType} '${ms.symbol}' is potential process state`,
      [{ path: ms.path, line: ms.line, symbol: ms.symbol }], [ms.path]);
  }
  // direct prisma access
  for (const pa of model.prisma.accesses.filter((a) => a.layerSignal !== 'repository')) {
    add('DIRECT_PRISMA_ACCESS_CANDIDATE', 'persistence', 'info', 'medium',
      `Direct Prisma ${pa.operation} on ${pa.model} outside repository layer (${pa.layerSignal})`,
      [{ path: pa.path, line: pa.line, symbol: pa.clientSymbol }], [pa.path]);
  }
  // multiple writers
  for (const g of model.prisma.modelWriterGroups) {
    if (new Set(g.writers.map((w) => w.path)).size > 1) {
      add('MULTIPLE_MODEL_WRITERS_CANDIDATE', 'persistence', 'warning', 'medium',
        `Model ${g.model} is mutated from multiple files`,
        g.writers.map((w) => ({ path: w.path, line: w.line, symbol: w.symbol })), g.writers.map((w) => w.path));
    }
  }
  // raw SQL
  for (const rs of model.prisma.rawSql) {
    add(rs.unsafe ? 'UNSAFE_RAW_SQL_USAGE' : 'RAW_SQL_USAGE', 'persistence',
      rs.unsafe ? 'warning' : 'info', rs.unsafe ? 'high' : 'medium',
      `${rs.api} usage${rs.tables.length ? ' on ' + rs.tables.join(', ') : ''}`,
      [{ path: rs.path, line: rs.line }], [rs.path]);
  }
  // runtime DDL
  for (const ddl of model.prisma.runtimeDdlCandidates) {
    add('DDL_IN_RUNTIME_SOURCE', 'persistence', 'warning', 'high',
      `Runtime DDL candidate: ${ddl.operation}`,
      [{ path: ddl.path, line: ddl.line, excerpt: ddl.excerpt }], [ddl.path]);
  }
  // unbounded queries
  for (const uq of model.prisma.unboundedQueryCandidates) {
    add(uq.operation === 'raw_select' ? 'UNBOUNDED_RAW_SELECT_CANDIDATE' : 'UNBOUNDED_PRISMA_QUERY_CANDIDATE',
      'scale', 'info', uq.confidence,
      `${uq.operation} without take/cursor/limit bound on ${uq.model ?? 'unknown'}`,
      [{ path: uq.path, line: uq.line }], [uq.path]);
  }
  // catches
  for (const cs of model.catchSignals) {
    add(cs.kind === 'silent' ? 'SILENT_CATCH' : 'BROAD_OR_SWALLOWED_CATCH_CANDIDATE',
      'failure_handling', cs.kind === 'silent' ? 'warning' : 'info', cs.confidence,
      cs.kind === 'silent' ? 'Empty catch block swallows errors' : 'Catch block neither rethrows, logs, nor responds',
      [{ path: cs.path, line: cs.line }], [cs.path]);
  }
  // duplicate declarations
  for (const dc of model.duplicates.declarationCandidates) {
    add('DUPLICATE_DECLARATION_CANDIDATE', 'duplication', 'info', dc.sameFingerprint ? 'medium' : 'low',
      `Type '${dc.name}' declared in ${dc.occurrences.length} files (${dc.sameFingerprint ? 'same' : 'different'} fingerprint)`,
      dc.occurrences.map((o) => ({ path: o.path, line: o.line })), dc.occurrences.map((o) => o.path));
  }
  // duplicate services/repos
  for (const sc of model.duplicates.serviceCandidates) {
    add('DUPLICATE_SERVICE_CANDIDATE', 'duplication', 'info', 'low',
      `Services grouped under normalized name '${sc.normalizedKey}': ${sc.originalNames.join(', ')}`,
      sc.paths.map((p) => ({ path: p, line: 1 })), sc.paths);
  }
  for (const rc of model.duplicates.repositoryCandidates) {
    add('DUPLICATE_REPOSITORY_CANDIDATE', 'duplication', 'info', 'low',
      `Repositories grouped under normalized name '${rc.normalizedKey}': ${rc.originalNames.join(', ')}`,
      rc.paths.map((p) => ({ path: p, line: 1 })), rc.paths);
  }
  // proof/test pollution
  const polluted = model.files.filter((f) => f.roleTags.includes('test') || f.roleTags.includes('proof_candidate'));
  const inRuntimeRoot = polluted.filter((f) => f.path.startsWith('src/') && !f.path.startsWith('src/tests/') && !f.path.startsWith('src/test-utils/'));
  for (const f of inRuntimeRoot) {
    add('PROOF_OR_TEST_IN_RUNTIME_ROOT_CANDIDATE', 'organization', 'info', f.roleTags.includes('test') ? 'high' : 'medium',
      `Test/proof artifact inside production source root: ${f.classificationSignals.join(', ') || 'path signal'}`,
      [{ path: f.path, line: 1 }], [f.path]);
  }
  // legacy
  for (const f of model.files) {
    const sig = f.classificationSignals.filter((s) => s.startsWith('legacy_signal:'));
    if (sig.length > 0) {
      add('LEGACY_OR_COMPATIBILITY_CANDIDATE', 'organization', 'info', 'low',
        `Legacy/compatibility signals in path or content`,
        [{ path: f.path, line: 1, excerpt: sig[0] }], [f.path]);
    }
  }
  // unreachable
  for (const p of model.reachability.unreachableCandidates) {
    add('UNREACHABLE_SOURCE_CANDIDATE', 'reachability', 'info', 'low',
      'Source file not statically reachable from any runtime/auxiliary entrypoint',
      [{ path: p, line: 1 }], [p]);
  }
  // external providers
  for (const pi of model.external.providerImports) {
    add('EXTERNAL_PROVIDER_USAGE', 'external_dependency', 'info', 'high',
      `External provider import: ${pi.provider}`,
      [{ path: pi.path, line: pi.line, excerpt: pi.specifier }], [pi.path]);
  }
  // AI calls
  for (const ai of model.external.aiCallCandidates) {
    add('AI_CALL_CANDIDATE', 'external_dependency', 'info', 'medium',
      `AI completion/embedding call shape: ${ai.symbol}`,
      [{ path: ai.path, line: ai.line, excerpt: ai.excerpt }], [ai.path]);
  }

  findings.sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
  return findings;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface ScanResult {
  model: ScanModel;
  inventory: BackendSystemInventory;
}

export function runScan(opts: ScannerOptions): ScanResult {
  // Read compiler options from the existing backend tsconfig (parsed, not
  // hard-coded) so TypeScript module resolution uses real enum values.
  const tsconfigPath = path.join(opts.backendRoot, 'tsconfig.json');
  let compilerOptions: ts.CompilerOptions = { module: ts.ModuleKind.CommonJS, moduleResolution: ts.ModuleResolutionKind.Node10, target: ts.ScriptTarget.ES2020, esModuleInterop: true };
  if (fs.existsSync(tsconfigPath)) {
    try {
      const raw = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      if (!raw.error) {
        const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, opts.backendRoot);
        if (!parsed.errors.some((e) => e.category === ts.DiagnosticCategory.Error)) {
          compilerOptions = parsed.options;
        }
      }
    } catch { /* fall back to defaults: resolution degrades, scan continues */ }
  }

  const relFiles = enumerateFiles(opts);
  // Always include backend root manifests: package.json + tsconfig*.json.
  try {
    const rootEntries = fs.readdirSync(opts.backendRoot);
    for (const entry of rootEntries.sort()) {
      if (entry === 'package.json' || /^tsconfig.*\.json$/.test(entry)) {
        const rel = toPosix(entry);
        if (!relFiles.includes(rel)) relFiles.push(rel);
      }
    }
    relFiles.sort();
  } catch { /* backend root unreadable: enumerateFiles result stands */ }
  const existingFiles = new Set(relFiles);
  const resolver = createResolver(opts, compilerOptions, existingFiles);

  const files: FileRecord[] = [];
  const imports: ImportRecord[] = [];
  const declarations: DeclarationRecord[] = [];
  const endpoints: RouteEndpointRecord[] = [];
  const mounts: RouteMountRecord[] = [];
  const prismaAccesses: PrismaAccessRecord[] = [];
  const rawSql: RawSqlRecord[] = [];
  const runtimeDdl: RuntimeDdlRecord[] = [];
  const unbounded: UnboundedQueryRecord[] = [];
  const mapSets: RuntimeCollectionRecord[] = [];
  const cacheCandidates: RuntimeCollectionRecord[] = [];
  const catchSignals: ScanModel['catchSignals'] = [];
  const aiCalls: AICallRecord[] = [];
  const tests: TestRecord[] = [];
  const providerImports: ExternalProviderRecord[] = [];
  const legacyFiles = new Map<string, string[]>();

  const tsFiles = relFiles.filter((f) => /\.tsx?$/.test(f));

  for (const rel of relFiles) {
    const abs = path.join(opts.backendRoot, rel);
    const stat = fs.statSync(abs);
    const content = fs.readFileSync(abs, 'utf8');
    const roleTags = classifyPath(rel);
    const classificationSignals: string[] = [];
    if (stat.size > opts.largeFileBytes) classificationSignals.push(`large_bytes:${stat.size}`);
    if (content.split(/\r?\n/).length > opts.largeFileLines) classificationSignals.push(`large_lines:${content.split(/\r?\n/).length}`);

    let sourceAnalysis: SourceAnalysis | null = null;
    if (/\.tsx?$/.test(rel)) {
      try {
        sourceAnalysis = analyzeSourceFile(abs, rel, content, resolver);
      } catch {
        sourceAnalysis = null; // parse failure of one file must not kill the scan
      }
    }

    if (sourceAnalysis) {
      imports.push(...sourceAnalysis.imports);
      declarations.push(...sourceAnalysis.declarations);
      endpoints.push(...sourceAnalysis.endpoints);
      mounts.push(...sourceAnalysis.mounts);
      prismaAccesses.push(...sourceAnalysis.prismaAccesses);
      rawSql.push(...sourceAnalysis.rawSql);
      runtimeDdl.push(...sourceAnalysis.runtimeDdl);
      unbounded.push(...sourceAnalysis.unbounded);
      mapSets.push(...sourceAnalysis.mapSets);
      cacheCandidates.push(...sourceAnalysis.cacheCandidates);
      catchSignals.push(...sourceAnalysis.catchSignals);
      aiCalls.push(...sourceAnalysis.aiCalls);
      providerImports.push(...sourceAnalysis.externalProviderImports);
      if (sourceAnalysis.testSignals.length > 0 && (roleTags.includes('test') || roleTags.includes('proof_candidate'))) {
        tests.push({ path: rel, line: 1, kind: roleTags.includes('test') ? 'test_file' : 'proof_candidate', signals: sourceAnalysis.testSignals });
      }
      if (sourceAnalysis.legacySignals.length > 0) {
        classificationSignals.push(`legacy_signal:${sourceAnalysis.legacySignals[0]}`);
        legacyFiles.set(rel, sourceAnalysis.legacySignals);
      }
    }

    files.push({
      path: rel,
      extension: path.extname(rel),
      bytes: stat.size,
      lines: content.split(/\r?\n/).length,
      sha256: sha256(content),
      roleTags,
      runtimeReachability: 'unknown',
      classificationSignals: classificationSignals.sort(),
    });
  }

  // entrypoints
  const runtimeEntrypoints = ['src/index.ts'].filter((p) => existingFiles.has(p));
  const auxiliaryEntrypoints: string[] = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(opts.backendRoot, 'package.json'), 'utf8'));
    for (const [name, cmd] of Object.entries((pkg.scripts ?? {}) as Record<string, string>)) {
      void name;
      const m = /(?:^|[\s"'])((?:src|\.{1,2})\/[A-Za-z0-9_\-/.]+\.[mc]?tsx?)/g.exec(cmd);
      if (m && existingFiles.has(toPosix(m[1]))) auxiliaryEntrypoints.push(toPosix(m[1]));
      const workerMatch = /(?:worker|fork|spawn)\s*\(\s*['"]([^'"]+\.[jt]s)['"]/g.exec(cmd);
      if (workerMatch) {
        const w = toPosix(workerMatch[1].replace(/^\.?\//, ''));
        if (existingFiles.has(w)) auxiliaryEntrypoints.push(w);
      }
    }
  } catch { /* no package.json: fine */ }
  for (const rel of relFiles) {
    if (MILESTONE_WORKER_RE.test(rel) && rel.endsWith('.worker.ts') && !auxiliaryEntrypoints.includes(rel)) {
      auxiliaryEntrypoints.push(rel);
    }
  }

  // prisma schema + migrations
  let schemaPath: string | null = null;
  let prismaModels: PrismaModelRecord[] = [];
  const schemaFile = relFiles.find((f) => f.startsWith('prisma/') && f.endsWith('.prisma') && !f.includes('test')) ?? null;
  if (schemaFile) {
    schemaPath = schemaFile;
    try {
      prismaModels = parsePrismaSchema(fs.readFileSync(path.join(opts.backendRoot, schemaFile), 'utf8'));
    } catch { /* parser must not kill the scan */ }
  }

  // route composition
  const effectiveRoutes: EffectiveRouteRecord[] = [];
  const unresolvedCompositions: ScanModel['routes']['unresolvedCompositions'] = [];
  const routerFileBySymbol = new Map<string, string>();
  for (const m of mounts) {
    if (m.importOrigin) routerFileBySymbol.set(m.routerSymbol, m.importOrigin);
  }
  const endpointsByFile = new Map<string, RouteEndpointRecord[]>();
  for (const e of endpoints) {
    const arr = endpointsByFile.get(e.path) ?? [];
    arr.push(e);
    endpointsByFile.set(e.path, arr);
  }
  for (const m of mounts.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line)) {
    const routeFile = m.importOrigin;
    if (!routeFile || !endpointsByFile.has(routeFile)) {
      if (m.resolution === 'direct' && m.mountPath && !m.importOrigin) {
        unresolvedCompositions.push({ path: m.path, line: m.line, mountPath: m.mountPath, routerSymbol: m.routerSymbol, reason: 'router import origin not statically resolvable' });
      }
      continue;
    }
    for (const e of endpointsByFile.get(routeFile)!.sort((a, b) => a.line - b.line)) {
      if (e.routerSymbol !== m.routerSymbol) continue;
      const local = e.localPath === '<dynamic>' ? null : e.localPath;
      if (local === null) {
        unresolvedCompositions.push({ path: m.path, line: m.line, mountPath: m.mountPath, routerSymbol: m.routerSymbol, reason: 'endpoint path is dynamic' });
        continue;
      }
      const joined = (m.mountPath.replace(/\/$/, '') + '/' + local.replace(/^\//, '')).replace(/\/{2,}/g, '/');
      effectiveRoutes.push({
        method: e.method.toUpperCase(),
        effectivePath: joined === '' ? '/' : joined,
        routeSource: e.path,
        routeLine: e.line,
        mountSource: m.path,
        mountLine: m.line,
        middleware: [...m.middleware, ...e.middleware],
      });
    }
  }
  effectiveRoutes.sort((a, b) => a.effectivePath.localeCompare(b.effectivePath) || a.method.localeCompare(b.method) || a.routeSource.localeCompare(b.routeSource));

  // reachability & cycles
  const reach = computeReachability(files, imports, runtimeEntrypoints, auxiliaryEntrypoints);
  for (const f of files) {
    if (f.path.startsWith('src/') && f.path.endsWith('.ts')) {
      f.runtimeReachability = reach.reachable.includes(f.path) ? 'reachable' : 'unreachable_candidate';
    }
  }
  const cycles = computeCycles(files.map((f) => f.path), imports);

  // model writer groups
  const writesByModel = new Map<string, PrismaAccessRecord[]>();
  for (const pa of prismaAccesses.filter((p) => p.readWrite === 'write')) {
    const arr = writesByModel.get(pa.model) ?? [];
    arr.push(pa);
    writesByModel.set(pa.model, arr);
  }
  const modelWriterGroups = Array.from(writesByModel.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([model, list]) => ({
      model,
      writers: list
        .map((w) => ({ path: w.path, symbol: w.clientSymbol, line: w.line }))
        .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
    }));

  // duplicates
  const services: ComponentRecord[] = [];
  const repositories: ComponentRecord[] = [];
  const contracts: ComponentRecord[] = [];
  const declsByFile = new Map<string, DeclarationRecord[]>();
  for (const d of declarations) {
    const arr = declsByFile.get(d.path) ?? [];
    arr.push(d);
    declsByFile.set(d.path, arr);
  }
  for (const f of files) {
    const exp = (declsByFile.get(f.path) ?? []).filter((d) => d.exported).map((d) => d.symbol).sort();
    const mk = (symbol: string): ComponentRecord => ({ path: f.path, symbol, line: (declsByFile.get(f.path) ?? [])[0]?.line ?? 1, roleTags: f.roleTags, exports: exp });
    if (f.roleTags.includes('service')) {
      const sym = path.basename(f.path).replace(/\.[jt]sx?$/, '');
      services.push(mk(sym));
    }
    if (f.roleTags.includes('repository')) repositories.push(mk(path.basename(f.path).replace(/\.[jt]sx?$/, '')));
    if (f.roleTags.includes('contract')) contracts.push(mk(path.basename(f.path).replace(/\.[jt]sx?$/, '')));
  }
  services.sort((a, b) => a.path.localeCompare(b.path));
  repositories.sort((a, b) => a.path.localeCompare(b.path));
  contracts.sort((a, b) => a.path.localeCompare(b.path));

  const duplicates = computeDuplicates(declarations, services, repositories, mounts, endpoints, effectiveRoutes, mapSets);

  // external dependencies from package.json
  const packageDependencies: ExternalDependencyRecord[] = [];
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(opts.backendRoot, 'package.json'), 'utf8'));
    for (const [name, version] of Object.entries((pkg.dependencies ?? {}) as Record<string, string>)) {
      packageDependencies.push({ name, kind: 'dependency', version });
    }
    for (const [name, version] of Object.entries((pkg.devDependencies ?? {}) as Record<string, string>)) {
      packageDependencies.push({ name, kind: 'devDependency', version });
    }
  } catch { /* fine */ }
  packageDependencies.sort((a, b) => a.name.localeCompare(b.name));

  // source fingerprint: stable sorted file hashes
  const fingerprintInput = files
    .map((f) => `${f.path}:${f.sha256}`)
    .sort()
    .join('\n');
  const sourceFingerprint = 'sf-' + sha256(fingerprintInput);

  const sortImports = (arr: ImportRecord[]) => arr.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.specifier.localeCompare(b.specifier));
  sortImports(imports);
  declarations.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.symbol.localeCompare(b.symbol));
  endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  mounts.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  prismaAccesses.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  rawSql.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  runtimeDdl.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  unbounded.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  mapSets.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  cacheCandidates.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  catchSignals.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  aiCalls.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  tests.sort((a, b) => a.path.localeCompare(b.path));
  providerImports.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);

  const findingsBase = {
    schemaVersion: '1.0' as const,
    scan: {
      scannerVersion: SCANNER_VERSION,
      generatedAt: new Date().toISOString(),
      sourceFingerprint,
      git: { branch: null as string | null, head: null as string | null },
      scope: {
        repositoryRoot: toPosix(opts.repositoryRoot),
        backendRoot: toPosix(opts.backendRoot),
        includedRoots: opts.includedRoots,
        excludedPatterns: opts.excludedPatterns,
      },
      heuristics: { largeFileLines: opts.largeFileLines, largeFileBytes: opts.largeFileBytes },
    },
    summary: {
      files: files.length,
      typescriptFiles: tsFiles.length,
      testFiles: files.filter((f) => f.roleTags.includes('test')).length,
      routeModules: files.filter((f) => f.roleTags.includes('route')).length,
      routeMounts: mounts.length,
      routeEndpoints: endpoints.length,
      services: services.length,
      repositories: repositories.length,
      contracts: contracts.length,
      prismaModels: prismaModels.length,
      unresolvedInternalImports: imports.filter((i) => i.resolution === 'unresolved_internal').length,
      cycles: cycles.length,
      findings: 0,
    },
    files,
    imports,
    exports: declarations,
    components: { services, repositories, contracts },
    routes: {
      mounts: mounts.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
      endpoints,
      effectiveRoutes,
      unresolvedCompositions: unresolvedCompositions.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
    },
    prisma: {
      schemaPath,
      models: prismaModels,
      accesses: prismaAccesses,
      rawSql,
      runtimeDdlCandidates: runtimeDdl,
      unboundedQueryCandidates: unbounded,
      modelWriterGroups,
    },
    runtimeState: { mapSetAllocations: mapSets, cacheCandidates },
    external: { packageDependencies, providerImports, aiCallCandidates: aiCalls },
    tests,
    catchSignals,
    cycles,
    reachability: {
      runtimeEntrypoints,
      auxiliaryEntrypoints: Array.from(new Set(auxiliaryEntrypoints)).sort(),
      reachableSourceFiles: reach.reachable,
      unreachableCandidates: reach.unreachableCandidates,
      unmountedRouteCandidates: reach.unmountedRouteCandidates,
    },
    duplicates,
  };
  const findings = buildFindings(findingsBase as unknown as Omit<ScanModel, 'findings'>);
  findingsBase.summary.findings = findings.length;

  const model: ScanModel = { ...findingsBase, findings };
  return { model, inventory: model as unknown as BackendSystemInventory };
}
