/**
 * Backend Route Contract Service
 *
 * Verifies critical backend routes are discoverable and mounted.
 * Uses filesystem inspection — no server startup required.
 */

import fs from 'fs';
import path from 'path';

const ROUTES_DIR = path.resolve(__dirname, '../routes');

export interface BackendRouteContract {
  id: string;
  file: string;
  exists: boolean;
  methods: string[];
  risk: 'low' | 'medium' | 'high';
  warnings: string[];
}

export interface BackendRouteContractReport {
  ok: boolean;
  routes: BackendRouteContract[];
  failures: string[];
  warnings: string[];
}

// Critical routes that must exist for production
const CRITICAL_ROUTES = [
  { id: 'liveChat', file: 'liveChat.ts', methods: ['POST'], risk: 'high' as const },
  { id: 'chatPipeline', file: 'chatPipeline.ts', methods: ['POST', 'GET'], risk: 'high' as const },
  { id: 'tutorStateEndpoint', file: 'tutorStateEndpoint.ts', methods: ['GET', 'POST', 'PATCH'], risk: 'high' as const },
  { id: 'tutorState', file: 'tutorState.ts', methods: ['GET', 'POST', 'PATCH'], risk: 'medium' as const },
  { id: 'ai', file: 'ai.ts', methods: ['POST', 'GET'], risk: 'high' as const },
  { id: 'health', file: null, methods: ['GET'], risk: 'low' as const }, // health is in index.ts
];

const IMPORTANT_ROUTES = [
  { id: 'artifactAwarePractice', file: 'artifactAwarePractice.ts', methods: ['GET', 'POST'], risk: 'medium' as const },
  { id: 'videoAwarePractice', file: 'videoAwarePractice.ts', methods: ['GET', 'POST'], risk: 'medium' as const },
  { id: 'videoRecommendations', file: 'videoRecommendations.ts', methods: ['GET'], risk: 'medium' as const },
  { id: 'learnerMemory', file: 'learnerMemory.ts', methods: ['GET', 'POST'], risk: 'medium' as const },
  { id: 'practiceMastery', file: 'practiceMastery.ts', methods: ['GET', 'POST'], risk: 'medium' as const },
  { id: 'intentResolver', file: 'intentResolver.ts', methods: ['POST'], risk: 'medium' as const },
  { id: 'profile', file: 'profile.ts', methods: ['GET', 'PATCH'], risk: 'medium' as const },
  { id: 'readiness', file: 'readiness.ts', methods: ['GET'], risk: 'low' as const },
];

function checkRouteFile(filename: string | null): boolean {
  if (!filename) return true; // health is embedded in index.ts
  const filePath = path.join(ROUTES_DIR, filename);
  return fs.existsSync(filePath);
}

export function verifyBackendRouteContracts(): BackendRouteContractReport {
  const failures: string[] = [];
  const warnings: string[] = [];
  const routes: BackendRouteContract[] = [];

  // Check critical routes
  for (const route of CRITICAL_ROUTES) {
    const exists = checkRouteFile(route.file);
    const routeWarnings: string[] = [];

    if (!exists && route.file) {
      routeWarnings.push(`Route file ${route.file} not found`);
      if (route.risk === 'high') {
        failures.push(`CRITICAL_ROUTE_MISSING: ${route.id} (${route.file})`);
      } else {
        warnings.push(`Route file missing: ${route.id} (${route.file})`);
      }
    }

    routes.push({
      id: route.id,
      file: route.file || '(embedded in index.ts)',
      exists,
      methods: route.methods,
      risk: route.risk,
      warnings: routeWarnings,
    });
  }

  // Check important routes
  for (const route of IMPORTANT_ROUTES) {
    const exists = checkRouteFile(route.file);
    const routeWarnings: string[] = [];

    if (!exists) {
      routeWarnings.push(`Route file ${route.file} not found`);
      warnings.push(`Important route missing: ${route.id} (${route.file})`);
    }

    routes.push({
      id: route.id,
      file: route.file || '',
      exists,
      methods: route.methods,
      risk: route.risk,
      warnings: routeWarnings,
    });
  }

  return {
    ok: failures.length === 0,
    routes,
    failures,
    warnings,
  };
}

export function getBackendRouteSummary(): {
  totalRoutes: number;
  criticalPresent: number;
  importantPresent: number;
  missingCritical: string[];
  missingImportant: string[];
} {
  const report = verifyBackendRouteContracts();
  const criticalRoutes = report.routes.filter((r) => r.risk === 'high' || r.risk === 'medium');
  const missingCritical = report.failures.map((f) => f.replace('CRITICAL_ROUTE_MISSING: ', ''));
  const missingImportant = report.warnings
    .filter((w) => w.startsWith('Important route missing'))
    .map((w) => w.replace('Important route missing: ', ''));

  return {
    totalRoutes: report.routes.length,
    criticalPresent: criticalRoutes.filter((r) => r.exists).length,
    importantPresent: report.routes.filter((r) => r.risk === 'low' && r.exists).length,
    missingCritical,
    missingImportant,
  };
}
