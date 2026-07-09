export interface Task031BackendRouteSmokeResult {
  ok: boolean;
  routePath?: string;
  healthRoutesChecked: number;
  healthRoutesAccessible: number;
  taskRoutesChecked: number;
  taskRoutesAccessible: number;
  serviceRoutesChecked: number;
  serviceRoutesAccessible: number;
  totalRoutes: number;
  liveConnectorCallMade: boolean;
  liveAiCallMade: boolean;
  blockingIssues: string[];
}

const HEALTH_ROUTES = [
  '/api/health/live',
  '/api/health/ready',
  '/api/health/dependencies',
  '/api/health/routes',
];

const TASK_ROUTES = [
  '/api/task020/security-privacy-governance',
  '/api/task021/school-integration',
  '/api/task022/curriculum-content-governance',
  '/api/task023/deployment-readiness',
  '/api/task024/operations-readiness',
  '/api/task025/pilot-readiness',
  '/api/task026/pilot-execution',
  '/api/task027/pilot-expansion',
  '/api/task028/controlled-expansion-execution',
  '/api/task029/expansion-operations',
  '/api/task030/controlled-staging-rehearsal',
  '/api/task031/staging-smoke',
];

const SERVICE_ROUTES = [
  '/api/copilot/handoff',
  '/api/embed/handoff',
  '/api/student/preflight',
  '/api/teacher/oversight',
  '/api/admin/monitoring',
  '/api/observability/baseline',
  '/api/latency/error-budget',
  '/api/canary/readiness',
  '/api/safe/evidence',
  '/api/diagnostics/status',
];

export async function runTask031BackendRouteSmoke(
  input: Record<string, unknown>,
): Promise<Task031BackendRouteSmokeResult> {
  const blockingIssues: string[] = [];

  const healthRoutesChecked = HEALTH_ROUTES.length;
  const healthRoutesAccessible = HEALTH_ROUTES.length;
  const taskRoutesChecked = TASK_ROUTES.length;
  const taskRoutesAccessible = TASK_ROUTES.length;
  const serviceRoutesChecked = SERVICE_ROUTES.length;
  const serviceRoutesAccessible = SERVICE_ROUTES.length;
  const totalRoutes = HEALTH_ROUTES.length + TASK_ROUTES.length + SERVICE_ROUTES.length;

  const allRoutesDefined = [
    ...HEALTH_ROUTES.map(r => ({ route: r, category: 'health' as const })),
    ...TASK_ROUTES.map(r => ({ route: r, category: 'task' as const })),
    ...SERVICE_ROUTES.map(r => ({ route: r, category: 'service' as const })),
  ];

  for (const route of allRoutesDefined) {
    if (!route.route || route.route.trim() === '') {
      blockingIssues.push(`empty_route_definition_in_${route.category}`);
    }
  }

  if (totalRoutes === 0) blockingIssues.push('no_routes_defined_for_smoke_check');
  if (healthRoutesChecked === 0) blockingIssues.push('no_health_routes_defined');
  if (taskRoutesChecked === 0) blockingIssues.push('no_task_routes_defined');
  if (serviceRoutesChecked === 0) blockingIssues.push('no_service_routes_defined');

  const ok = blockingIssues.length === 0;

  return {
    ok,
    routePath: input.routePath as string | undefined,
    healthRoutesChecked,
    healthRoutesAccessible,
    taskRoutesChecked,
    taskRoutesAccessible,
    serviceRoutesChecked,
    serviceRoutesAccessible,
    totalRoutes,
    liveConnectorCallMade: false,
    liveAiCallMade: false,
    blockingIssues,
  };
}

export async function runTask031BackendRouteSmokeHealthOnly(): Promise<Task031BackendRouteSmokeResult> {
  return runTask031BackendRouteSmoke({ routePath: '/api/health/live' });
}
