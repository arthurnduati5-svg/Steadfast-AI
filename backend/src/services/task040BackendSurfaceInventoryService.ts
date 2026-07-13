import * as fs from 'fs';
import * as path from 'path';
import {
  Task040BackendSurfaceManifest,
  Task040BackendSurfaceRouteEntry,
  createTask040SafeTimestamp,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

const KNOWN_ROUTE_MOUNTS: Array<{ prefix: string; file: string; taskOwner: string; acceptedTaskId: string }> = [
  { prefix: '/api/task020/security-privacy-governance', file: 'task020SecurityPrivacyGovernanceRoutes.ts', taskOwner: 'Task 020', acceptedTaskId: '020' },
  { prefix: '/api/task021/school-integration', file: 'task021SchoolIntegrationRoutes.ts', taskOwner: 'Task 021', acceptedTaskId: '021' },
  { prefix: '/api/task022/curriculum-governance', file: 'task022CurriculumContentGovernanceRoutes.ts', taskOwner: 'Task 022', acceptedTaskId: '022' },
  { prefix: '/api/task023/deployment-readiness', file: 'task023DeploymentReadinessRoutes.ts', taskOwner: 'Task 023', acceptedTaskId: '023' },
  { prefix: '/api/task024/operations-readiness', file: 'task024OperationsReadinessRoutes.ts', taskOwner: 'Task 024', acceptedTaskId: '024' },
  { prefix: '/api/task025/pilot-readiness', file: 'task025ControlledPilotReadinessRoutes.ts', taskOwner: 'Task 025', acceptedTaskId: '025' },
  { prefix: '/api/task026/...', file: 'task026PilotExecutionRoutes.ts', taskOwner: 'Task 026', acceptedTaskId: '026' },
  { prefix: '/api/task027/pilot-expansion-governance', file: 'task027PilotExpansionGovernanceRoutes.ts', taskOwner: 'Task 027', acceptedTaskId: '027' },
  { prefix: '/api/task028/controlled-expansion-execution', file: 'task028ControlledExpansionExecutionRoutes.ts', taskOwner: 'Task 028', acceptedTaskId: '028' },
  { prefix: '/api/task029/expansion-operations', file: 'task029ExpansionOperationsRoutes.ts', taskOwner: 'Task 029', acceptedTaskId: '029' },
  { prefix: '/api/task030/controlled-staging-rehearsal', file: 'task030ControlledStagingRehearsalRoutes.ts', taskOwner: 'Task 030', acceptedTaskId: '030' },
  { prefix: '/api/task031/staging-smoke-canary-readiness', file: 'task031StagingSmokeCanaryReadinessRoutes.ts', taskOwner: 'Task 031', acceptedTaskId: '031' },
  { prefix: '/api/task032/controlled-canary-activation', file: 'task032ControlledCanaryActivationRoutes.ts', taskOwner: 'Task 032', acceptedTaskId: '032' },
  { prefix: '/api/task033/controlled-canary-observation', file: 'task033ControlledCanaryObservationRoutes.ts', taskOwner: 'Task 033', acceptedTaskId: '033' },
  { prefix: '/api/task034/controlled-limited-rollout', file: 'task034ControlledLimitedRolloutRoutes.ts', taskOwner: 'Task 034', acceptedTaskId: '034' },
  { prefix: '/api/task035/school-wide-readiness', file: 'task035SchoolWideReadinessRoutes.ts', taskOwner: 'Task 035', acceptedTaskId: '035' },
  { prefix: '/api/task036/live-school-launch', file: 'task036LiveSchoolLaunchRoutes.ts', taskOwner: 'Task 036', acceptedTaskId: '036' },
  { prefix: '/api/task040/backend-freeze', file: 'task040BackendFreezeRoutes.ts', taskOwner: 'Task 040', acceptedTaskId: '040' },
];

function detectRouteFilesInDir(): string[] {
  const dir = path.resolve(process.cwd(), 'backend/src/routes');
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
  } catch {
    return [];
  }
}

export function buildBackendSurfaceManifest(): Task040BackendSurfaceManifest {
  const routeFiles = detectRouteFilesInDir();
  const entries: Task040BackendSurfaceRouteEntry[] = [];

  for (const mount of KNOWN_ROUTE_MOUNTS) {
    const fileExists = routeFiles.includes(mount.file);
    entries.push({
      routePrefix: mount.prefix,
      routeFile: mount.file,
      mountedInIndex: fileExists,
      middlewareUsed: ['schoolAuthMiddleware', 'requireVerifiedSchoolContext'],
      requiresVerifiedSchoolContext: true,
      requiresRoleScope: true,
      safeReadOnly: mount.prefix.includes('health') || mount.prefix.includes('safe'),
      taskOwner: mount.taskOwner,
      acceptedTaskId: mount.acceptedTaskId,
      status: fileExists ? 'mounted' : 'file_not_found',
      notes: fileExists ? `Route file ${mount.file} exists in routes directory` : `Route file ${mount.file} not found`,
    });
  }

  for (const file of routeFiles) {
    const alreadyListed = entries.some(e => e.routeFile === file);
    if (!alreadyListed) {
      entries.push({
        routePrefix: `/api/copilot/${file.replace('.ts', '')}`,
        routeFile: file,
        mountedInIndex: true,
        middlewareUsed: ['schoolAuthMiddleware'],
        requiresVerifiedSchoolContext: false,
        requiresRoleScope: false,
        safeReadOnly: false,
        taskOwner: 'various',
        acceptedTaskId: 'various',
        status: 'mounted',
        notes: `Additional backend route file: ${file}`,
      });
    }
  }

  return {
    taskId: '040',
    routeEntries: entries,
    routeCount: entries.length,
    generatedAt: createTask040SafeTimestamp(),
  };
}

export function getBackendSurfaceManifest(): Task040BackendSurfaceManifest {
  const existing = task040Repository.getBackendSurfaceManifest();
  if (existing) return existing;
  const manifest = buildBackendSurfaceManifest();
  task040Repository.saveBackendSurfaceManifest(manifest);
  return manifest;
}
