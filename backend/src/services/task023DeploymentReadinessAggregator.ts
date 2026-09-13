import { DeploymentReadinessReport, DeploymentReadinessStatus, ReadinessCheckResult, EnvironmentVariableRequirement } from '../contracts/task023DeploymentReadinessContracts';
import { getDeploymentEnvironment, getEnvironmentGateRequirements, getEnvironmentGateResult } from './task023EnvironmentGateService';
import { getSecretSafetyResult } from './task023SecretSafetyValidationService';
import { getDatabaseReadinessCheck } from './task023DatabaseReadinessService';
import { getPrismaReadinessCheck } from './task023PrismaDeploymentReadinessService';
import { getMigrationSafetyCheck } from './task023MigrationSafetyChecker';
import { getMigrationPreflightResult } from './task023MigrationPreflightService';
import { getProductionStartupGateResult } from './task023ProductionStartupGateService';

export async function getDeploymentReadinessReport(correlationId?: string): Promise<DeploymentReadinessReport> {
  const env = getDeploymentEnvironment();
  const envSummary = getEnvironmentGateRequirements();
  const components: ReadinessCheckResult[] = [
    getEnvironmentGateResult(),
    getSecretSafetyResult(),
    await getDatabaseReadinessCheck(),
    getPrismaReadinessCheck(),
    getMigrationSafetyCheck(),
    await getMigrationPreflightResult(),
  ];

  const startupGate = await getProductionStartupGateResult();
  components.push(...[
    startupGate.environmentGate,
    startupGate.secretValidation,
    startupGate.databaseReadiness,
    startupGate.prismaReadiness,
    startupGate.migrationSafety,
    startupGate.schoolIntegrationReadiness,
    startupGate.contentGovernanceReadiness,
    startupGate.aiGatewayReadiness,
    startupGate.privacyGovernanceReadiness,
    startupGate.rateLimitReadiness,
    startupGate.diagnosticsReadiness,
  ].filter(c => !components.find(comp => comp.name === c.name)));

  const criticalFailures = components
    .filter(c => c.severity === 'critical')
    .map(c => `${c.name}: ${c.message}`);

  const warnings = components
    .filter(c => c.severity === 'warning')
    .map(c => `${c.name}: ${c.message}`);

  const blockedComponents = components.filter(c => c.status === 'blocked').length;
  const failedRequired = components.filter(c => c.status === 'not_ready' && c.required).length;

  let overallStatus: DeploymentReadinessStatus = 'ready';
  if (blockedComponents > 0 || failedRequired > 0) {
    overallStatus = 'blocked';
  } else if (criticalFailures.length > 0) {
    overallStatus = 'not_ready';
  } else if (warnings.length > 0) {
    overallStatus = 'degraded';
  }

  const safeNextActions: string[] = [];
  if (overallStatus !== 'ready') {
    if (criticalFailures.length > 0) {
      safeNextActions.push('Resolve all critical failures before deploying.');
    }
    if (warnings.length > 0) {
      safeNextActions.push('Review warnings and address if appropriate for production.');
    }
    safeNextActions.push('Run the production startup gate again after resolving issues.');
  } else {
    safeNextActions.push('System is ready for production release.');
    safeNextActions.push('Run release smoke tests before finalizing deployment.');
  }

  return {
    taskId: 'TASK-023',
    timestamp: new Date().toISOString(),
    environment: env,
    overallStatus,
    criticalFailures,
    warnings,
    safeNextActions,
    componentStatuses: components,
    environmentSummary: envSummary,
    correlationId,
  };
}
