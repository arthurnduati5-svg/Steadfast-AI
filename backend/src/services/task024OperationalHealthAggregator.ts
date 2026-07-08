import { OperationalComponentStatus, OperationalHealthCheckResult } from '../contracts/task024OperationsContracts';
import { getBackendReadinessConfig } from '../config/backendEnv';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryRequire(modulePath: string): any | null {
  try {
    return require(modulePath);
  } catch {
    return null;
  }
}

function now(): string {
  return new Date().toISOString();
}

function makeComponent(
  component: string,
  status: OperationalComponentStatus,
  safeMessage: string,
  reasonCode?: string,
  durationMs?: number,
): OperationalHealthCheckResult {
  return {
    component,
    status,
    checkedAt: now(),
    safeMessage,
    reasonCode,
    durationMs,
  };
}

async function checkDatabase(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const config = getBackendReadinessConfig();
    if (!config.hasDatabaseUrl) {
      return makeComponent('database', 'unhealthy', 'DATABASE_URL is not configured', 'DATABASE_URL_MISSING', Date.now() - start);
    }
    return makeComponent('database', 'healthy', 'DATABASE_URL is configured', undefined, Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('database', 'unknown', `Database config check failed: ${msg.slice(0, 100)}`, 'CHECK_ERROR', Date.now() - start);
  }
}

async function checkPrisma(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const prisma = await import('../lib/prisma');
    const client = prisma.default || prisma;
    if (client) {
      return makeComponent('prisma', 'healthy', 'Prisma client is importable', undefined, Date.now() - start);
    }
    return makeComponent('prisma', 'degraded', 'Prisma client resolved but unexpected shape', 'PRISMA_UNEXPECTED', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('prisma', 'degraded', `Prisma client import failed: ${msg.slice(0, 100)}`, 'PRISMA_IMPORT_FAILED', Date.now() - start);
  }
}

async function checkAiGateway(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const config = getBackendReadinessConfig();
    const hasApiKey = config.hasOpenAiKey;
    const gatewayEndpointConfigured = !!(process.env.AI_GATEWAY_ENDPOINT || '').trim();
    const safeGatewayConfigured = gatewayEndpointConfigured || hasApiKey;

    if (!safeGatewayConfigured) {
      return makeComponent('ai_gateway', 'degraded', 'No AI provider key or gateway endpoint configured', 'AI_GATEWAY_NOT_CONFIGURED', Date.now() - start);
    }

    let serviceAvailable = false;
    try {
      const { ProviderHealthService } = await import('./aiGateway/providerHealthService');
      serviceAvailable = typeof ProviderHealthService === 'function';
    } catch {
      serviceAvailable = false;
    }

    if (serviceAvailable) {
      return makeComponent('ai_gateway', 'healthy', 'AI gateway configured and provider health service available', undefined, Date.now() - start);
    }

    return makeComponent('ai_gateway', 'degraded', 'AI gateway configured but provider health service not available', 'PROVIDER_HEALTH_SERVICE_MISSING', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('ai_gateway', 'unknown', `AI gateway check failed: ${msg.slice(0, 100)}`, 'CHECK_ERROR', Date.now() - start);
  }
}

async function checkSchoolIntegration(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const { verifySchoolContext } = await import('./task021SchoolContextVerificationService');
    const callable = typeof verifySchoolContext === 'function';
    if (callable) {
      return makeComponent('school_integration', 'healthy', 'School integration verification service is available', undefined, Date.now() - start);
    }
    return makeComponent('school_integration', 'degraded', 'School integration service loaded but verifySchoolContext not callable', 'SCHOOL_INTEGRATION_UNEXPECTED', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('school_integration', 'degraded', `School integration service not available: ${msg.slice(0, 100)}`, 'SCHOOL_INTEGRATION_UNAVAILABLE', Date.now() - start);
  }
}

async function checkContentGovernance(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const { contentGovernanceReadinessService } = await import('./contentGovernance/contentGovernanceReadinessService');
    if (contentGovernanceReadinessService && typeof contentGovernanceReadinessService === 'object') {
      return makeComponent('content_governance', 'healthy', 'Content governance readiness service is available', undefined, Date.now() - start);
    }
    return makeComponent('content_governance', 'degraded', 'Content governance service loaded but not in expected shape', 'CONTENT_GOVERNANCE_UNEXPECTED', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('content_governance', 'degraded', `Content governance service not available: ${msg.slice(0, 100)}`, 'CONTENT_GOVERNANCE_UNAVAILABLE', Date.now() - start);
  }
}

async function checkDeploymentReadiness(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const { getDeploymentReadinessReport } = await import('./task023DeploymentReadinessAggregator');
    const callable = typeof getDeploymentReadinessReport === 'function';
    if (callable) {
      return makeComponent('deployment_readiness', 'healthy', 'Deployment readiness aggregator is available', undefined, Date.now() - start);
    }
    return makeComponent('deployment_readiness', 'degraded', 'Deployment readiness module loaded but aggregator not callable', 'DEPLOYMENT_READINESS_UNEXPECTED', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('deployment_readiness', 'degraded', `Deployment readiness aggregator not available: ${msg.slice(0, 100)}`, 'DEPLOYMENT_READINESS_UNAVAILABLE', Date.now() - start);
  }
}

async function checkRateLimits(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const { rateLimitMiddleware, configureRouteRateLimit } = await import('../middleware/task019RateLimitMiddleware');
    const middlewareAvailable = typeof rateLimitMiddleware === 'function';
    const configurable = typeof configureRouteRateLimit === 'function';
    if (middlewareAvailable && configurable) {
      return makeComponent('rate_limits', 'healthy', 'Rate limit middleware and configuration are available', undefined, Date.now() - start);
    }
    return makeComponent('rate_limits', 'degraded', 'Rate limit middleware loaded but incomplete', 'RATE_LIMIT_INCOMPLETE', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('rate_limits', 'degraded', `Rate limit middleware not available: ${msg.slice(0, 100)}`, 'RATE_LIMIT_UNAVAILABLE', Date.now() - start);
  }
}

async function checkTelemetry(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const { startRequestTelemetry } = await import('./backendRequestTelemetryService');
    const callable = typeof startRequestTelemetry === 'function';
    if (callable) {
      return makeComponent('telemetry', 'healthy', 'Telemetry service is available', undefined, Date.now() - start);
    }
    return makeComponent('telemetry', 'degraded', 'Telemetry service loaded but startRequestTelemetry not callable', 'TELEMETRY_UNEXPECTED', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('telemetry', 'degraded', `Telemetry service not available: ${msg.slice(0, 100)}`, 'TELEMETRY_UNAVAILABLE', Date.now() - start);
  }
}

async function checkBackupReadiness(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const config = getBackendReadinessConfig();
    const hasDatabase = config.hasDatabaseUrl;

    if (!hasDatabase) {
      return makeComponent('backup_readiness', 'not_applicable', 'No database configured — backup readiness not applicable', 'NO_DATABASE', Date.now() - start);
    }

    const backupService = tryRequire('./task024BackupReadinessService');
    if (backupService && typeof backupService.checkBackupReadiness === 'function') {
      return makeComponent('backup_readiness', 'healthy', 'Backup readiness service (task024) is available', undefined, Date.now() - start);
    }

    const task023Service = tryRequire('./task023BackupReadinessService');
    if (task023Service && typeof task023Service.getBackupReadinessReport === 'function') {
      return makeComponent('backup_readiness', 'healthy', 'Backup readiness service (task023) is available', undefined, Date.now() - start);
    }

    return makeComponent('backup_readiness', 'degraded', 'Database configured but no backup readiness service found', 'BACKUP_SERVICE_MISSING', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('backup_readiness', 'unknown', `Backup readiness check failed: ${msg.slice(0, 100)}`, 'CHECK_ERROR', Date.now() - start);
  }
}

async function checkRestoreDrill(): Promise<OperationalHealthCheckResult> {
  const start = Date.now();
  try {
    const config = getBackendReadinessConfig();
    const hasDatabase = config.hasDatabaseUrl;

    if (!hasDatabase) {
      return makeComponent('restore_drill', 'not_applicable', 'No database configured — restore drill not applicable', 'NO_DATABASE', Date.now() - start);
    }

    const restoreService = tryRequire('./task024RestoreDrillService');
    if (restoreService && typeof restoreService.runRestoreDrill === 'function') {
      return makeComponent('restore_drill', 'healthy', 'Restore drill service (task024) is available', undefined, Date.now() - start);
    }

    return makeComponent('restore_drill', 'degraded', 'Database configured but no restore drill service found', 'RESTORE_DRILL_SERVICE_MISSING', Date.now() - start);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return makeComponent('restore_drill', 'unknown', `Restore drill check failed: ${msg.slice(0, 100)}`, 'CHECK_ERROR', Date.now() - start);
  }
}

function computeOverallStatus(components: OperationalHealthCheckResult[]): OperationalComponentStatus {
  const blocked = components.some(c => c.status === 'blocked');
  const unhealthy = components.some(c => c.status === 'unhealthy');
  const degraded = components.some(c => c.status === 'degraded');
  const unknown = components.some(c => c.status === 'unknown');
  const allHealthyOrNa = components.every(c => c.status === 'healthy' || c.status === 'not_applicable');

  if (blocked) return 'blocked';
  if (unhealthy) return 'unhealthy';
  if (degraded) return 'degraded';
  if (unknown) return 'unknown';
  if (allHealthyOrNa) return 'healthy';
  return 'degraded';
}

function collectCriticalFailures(components: OperationalHealthCheckResult[]): string[] {
  return components
    .filter(c => c.status === 'unhealthy' || c.status === 'blocked')
    .map(c => `${c.component}: ${c.safeMessage}`);
}

function collectWarnings(components: OperationalHealthCheckResult[]): string[] {
  return components
    .filter(c => c.status === 'degraded' || c.status === 'unknown')
    .map(c => `${c.component}: ${c.safeMessage}`);
}

function determineSafeNextActions(
  overallStatus: OperationalComponentStatus,
  components: OperationalHealthCheckResult[],
): string[] {
  const actions: string[] = [];
  const unhealthyComponents = components.filter(c => c.status === 'unhealthy' || c.status === 'blocked');
  const degradedComponents = components.filter(c => c.status === 'degraded');
  const unknownComponents = components.filter(c => c.status === 'unknown');

  if (unhealthyComponents.length > 0) {
    actions.push(`Resolve unhealthy components: ${unhealthyComponents.map(c => c.component).join(', ')}`);
  }
  if (degradedComponents.length > 0) {
    actions.push(`Review degraded components: ${degradedComponents.map(c => c.component).join(', ')}`);
  }
  if (unknownComponents.length > 0) {
    actions.push(`Investigate unknown components: ${unknownComponents.map(c => c.component).join(', ')}`);
  }
  if (overallStatus === 'healthy') {
    actions.push('All operational health checks passed.');
    actions.push('Continue monitoring operational health regularly.');
  } else {
    actions.push('Re-run operational health check after resolving issues.');
  }
  return actions;
}

export async function getOperationalHealth(requestId?: string): Promise<{
  overallStatus: OperationalComponentStatus;
  components: OperationalHealthCheckResult[];
  criticalFailures: string[];
  warnings: string[];
  safeNextActions: string[];
  timestamp: string;
  correlationId?: string;
}> {
  const componentChecks = await Promise.all([
    checkDatabase(),
    checkPrisma(),
    checkAiGateway(),
    checkSchoolIntegration(),
    checkContentGovernance(),
    checkDeploymentReadiness(),
    checkRateLimits(),
    checkTelemetry(),
    checkBackupReadiness(),
    checkRestoreDrill(),
  ]);

  const overallStatus = computeOverallStatus(componentChecks);
  const criticalFailures = collectCriticalFailures(componentChecks);
  const warnings = collectWarnings(componentChecks);
  const safeNextActions = determineSafeNextActions(overallStatus, componentChecks);

  return {
    overallStatus,
    components: componentChecks,
    criticalFailures,
    warnings,
    safeNextActions,
    timestamp: now(),
    correlationId: requestId,
  };
}
