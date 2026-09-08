/**
 * R8-A Backend Engineering Scanner — artifact reporters.
 *
 * Pure deterministic renderers: inventory JSON and dependency-graph JSON are
 * derived from the normalized scan model, and the route map is Markdown.
 * No repository finding here is a destructive conclusion; every output that
 * cannot be proven statically is worded as a candidate.
 */
import type {
  BackendDependencyGraph,
  BackendSystemInventory,
  ScanModel,
} from './types';

export function buildInventoryDocument(model: ScanModel): BackendSystemInventory {
  // The scan model already carries the inventory shape; re-sort defensively.
  const sorted = {
    ...(model as unknown as BackendSystemInventory),
    files: [...model.files].sort((a, b) => a.path.localeCompare(b.path)),
    imports: [...model.imports].sort(
      (a, b) => a.path.localeCompare(b.path) || a.line - b.line,
    ),
    exports: [...model.exports].sort(
      (a, b) => a.path.localeCompare(b.path) || a.line - b.line,
    ),
  };
  return sorted;
}

export function buildDependencyGraph(model: ScanModel): BackendDependencyGraph {
  const nodes: BackendDependencyGraph['nodes'] = [];
  const edges: BackendDependencyGraph['edges'] = [];

  for (const f of model.files) {
    const isTs = /\.tsx?$/.test(f.path);
    if (!isTs && f.extension !== '.json' && f.extension !== '.prisma' && f.extension !== '.sql') continue;
    nodes.push({
      id: `file:${f.path}`,
      type: f.roleTags.includes('route') ? 'route' : 'source_file',
      path: f.path,
      roleTags: [...f.roleTags].sort(),
    });
  }

  for (const m of model.prisma.models) {
    nodes.push({ id: `model:${m.name}`, type: 'prisma_model', name: m.name });
  }

  const externalNames = new Set<string>();
  for (const im of model.imports) {
    if (im.resolution === 'external_package') externalNames.add(im.specifier.split('/').slice(0, 2).join('/'));
  }
  for (const dep of model.external.packageDependencies) externalNames.add(dep.name);
  for (const name of Array.from(externalNames).sort()) {
    nodes.push({ id: `pkg:${name}`, type: 'external_package', name });
  }

  const crossLane = new Set<string>();
  for (const im of model.imports) {
    if (im.resolution === 'cross_lane_internal' && im.resolvedPath) crossLane.add(im.resolvedPath);
  }
  for (const p of Array.from(crossLane).sort()) {
    nodes.push({ id: `xlan:${p}`, type: 'cross_lane_source', path: p });
  }

  for (const im of model.imports) {
    if (im.resolution === 'external_package') {
      const pkg = im.specifier.split('/').slice(0, 2).join('/');
      edges.push({
        from: `file:${im.path}`,
        to: `pkg:${pkg}`,
        type: 'uses_external_package',
        sourcePath: im.path,
        line: im.line,
      });
      continue;
    }
    if (!im.resolvedPath) continue;
    if (im.resolution === 'cross_lane_internal' && !model.files.some((f) => f.path === im.resolvedPath)) {
      edges.push({
        from: `file:${im.path}`,
        to: `xlan:${im.resolvedPath}`,
        type: im.importKind === 'dynamic' ? 'dynamic_import' : im.importKind === 'require' ? 'require' : im.importKind === 'export_from' ? 'exports_from' : 'imports',
        sourcePath: im.path,
        line: im.line,
      });
      continue;
    }
    edges.push({
      from: `file:${im.path}`,
      to: `file:${im.resolvedPath}`,
      type: im.importKind === 'dynamic' ? 'dynamic_import' : im.importKind === 'require' ? 'require' : im.importKind === 'export_from' ? 'exports_from' : 'imports',
      sourcePath: im.path,
      line: im.line,
    });
  }

  for (const m of model.routes.mounts) {
    if (m.importOrigin && model.files.some((f) => f.path === m.importOrigin)) {
      edges.push({
        from: `file:${m.path}`,
        to: `file:${m.importOrigin}`,
        type: 'mounts',
        sourcePath: m.path,
        line: m.line,
      });
    }
  }

  for (const pa of model.prisma.accesses) {
    if (!pa.model) continue;
    if (!model.prisma.models.some((m) => m.name === pa.model)) continue;
    edges.push({
      from: `file:${pa.path}`,
      to: `model:${pa.model}`,
      type: pa.readWrite === 'write' ? 'writes_prisma_model' : 'uses_prisma_model',
      sourcePath: pa.path,
      line: pa.line,
    });
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || (a.line ?? 0) - (b.line ?? 0));

  return {
    schemaVersion: '1.0',
    sourceFingerprint: model.scan.sourceFingerprint,
    nodes,
    edges,
    entrypoints: {
      runtime: [...model.reachability.runtimeEntrypoints].sort(),
      auxiliary: [...model.reachability.auxiliaryEntrypoints].sort(),
    },
    cycles: [...model.cycles].sort((a, b) => a.members.join(',').localeCompare(b.members.join(','))),
    unresolvedImports: model.imports
      .filter((i) => i.resolution === 'unresolved_internal')
      .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line),
    reachability: {
      reachable: [...model.reachability.reachableSourceFiles].sort(),
      unreachableCandidates: [...model.reachability.unreachableCandidates].sort(),
    },
  };
}

function mdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function renderRouteMap(model: ScanModel): string {
  const lines: string[] = [];
  lines.push('# Backend Runtime Route Map');
  lines.push('');
  lines.push('STATIC STRUCTURAL EVIDENCE — NOT RUNTIME EXECUTION PROOF');
  lines.push('');
  lines.push('Static route composition below is derived from TypeScript AST analysis.');
  lines.push('Effective paths are reported only when the mount and the endpoint are');
  lines.push('both statically resolvable. Anything else is listed as a candidate.');
  lines.push('');
  lines.push('## Baseline');
  lines.push('');
  lines.push(`- Scanner version: ${model.scan.scannerVersion}`);
  lines.push(`- Source fingerprint: ${model.scan.sourceFingerprint}`);
  lines.push(`- Generated at: ${model.scan.generatedAt}`);
  lines.push(`- Git branch: ${model.scan.git.branch ?? 'unknown'}`);
  lines.push(`- Git head: ${model.scan.git.head ?? 'unknown'}`);
  lines.push('');
  lines.push('## Direct Runtime Mounts');
  lines.push('');
  lines.push('mount path | router | source | middleware | line');
  lines.push('--- | --- | --- | --- | ---');
  const mounts = [...model.routes.mounts].sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
  if (mounts.length === 0) {
    lines.push('_none_');
  } else {
    for (const m of mounts) {
      lines.push(
        `${mdCell(m.mountPath || '/')} | ${mdCell(m.routerSymbol)} | ${mdCell(m.path)} | ${mdCell(m.middleware.join(', ') || '—')} | ${m.line}`,
      );
    }
  }
  lines.push('');
  lines.push('## Effective Endpoints');
  lines.push('');
  lines.push('method | effective path | route source | mount source | middleware');
  lines.push('--- | --- | --- | --- | ---');
  const effective = [...model.routes.effectiveRoutes].sort(
    (a, b) => a.effectivePath.localeCompare(b.effectivePath) || a.method.localeCompare(b.method),
  );
  if (effective.length === 0) {
    lines.push('_none statically resolvable_');
  } else {
    for (const e of effective) {
      lines.push(
        `${e.method} | ${mdCell(e.effectivePath)} | ${mdCell(`${e.routeSource}:${e.routeLine}`)} | ${mdCell(`${e.mountSource}:${e.mountLine}`)} | ${mdCell(e.middleware.join(', ') || '—')}`,
      );
    }
  }
  lines.push('');
  lines.push('## Factory / Composition Mounts');
  lines.push('');
  lines.push('mount | factory/router | source | resolution note');
  lines.push('--- | --- | --- | ---');
  const factory = mounts.filter((m) => m.resolution !== 'direct');
  if (factory.length === 0) {
    lines.push('_none_');
  } else {
    for (const m of factory) {
      lines.push(
        `${mdCell(m.mountPath || '/')} | ${mdCell(m.routerSymbol)} | ${mdCell(`${m.path}:${m.line}`)} | ${mdCell(m.resolution === 'factory' ? 'router factory call; effective endpoints not composed' : 'router origin unknown; effective endpoints not composed')}`,
      );
    }
  }
  lines.push('');
  lines.push('## Duplicate Exact Route Candidates');
  lines.push('');
  const dupes = model.duplicates.routeCandidates.filter((r) => r.kind === 'duplicate_effective_route');
  if (dupes.length === 0) {
    lines.push('_none_');
  } else {
    for (const d of dupes) {
      lines.push(`- \`${mdCell(d.key)}\``);
      for (const o of d.occurrences) lines.push(`  - ${mdCell(o.path)}:${o.line} (${mdCell(o.detail)})`);
    }
  }
  lines.push('');
  lines.push('## Shared Mount-Prefix Candidates');
  lines.push('');
  const shared = model.duplicates.routeCandidates.filter((r) => r.kind === 'shared_mount_prefix');
  if (shared.length === 0) {
    lines.push('_none_');
  } else {
    for (const s of shared) {
      lines.push(`- \`${mdCell(s.key)}\``);
      for (const o of s.occurrences) lines.push(`  - ${mdCell(o.path)}:${o.line} (${mdCell(o.detail)})`);
    }
  }
  lines.push('');
  lines.push('## Unmounted Route Candidates');
  lines.push('');
  if (model.reachability.unmountedRouteCandidates.length === 0) {
    lines.push('_none_');
  } else {
    for (const p of model.reachability.unmountedRouteCandidates) lines.push(`- ${mdCell(p)}`);
  }
  lines.push('');
  lines.push('## Unresolved Route Dependencies');
  lines.push('');
  if (model.routes.unresolvedCompositions.length === 0) {
    lines.push('_none_');
  } else {
    for (const u of model.routes.unresolvedCompositions) {
      lines.push(`- ${mdCell(u.mountPath || '/')} (${mdCell(u.routerSymbol)}) at ${mdCell(u.path)}:${u.line} — ${mdCell(u.reason)}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
