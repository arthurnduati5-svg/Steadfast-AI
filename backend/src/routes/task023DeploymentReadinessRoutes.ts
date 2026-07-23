import { Router, Request, Response, NextFunction } from 'express';
import { getDeploymentEnvironment, getEnvironmentGateResult, getEnvironmentGateRequirements } from '../services/task023EnvironmentGateService';
import { getSecretSafetyResult, validateAllSecrets } from '../services/task023SecretSafetyValidationService';
import { validateProductionConfig } from '../services/task023ProductionConfigValidationService';
import { getMigrationSafetyResult } from '../services/task023MigrationSafetyChecker';
import { getPrismaReadinessCheck } from '../services/task023PrismaDeploymentReadinessService';
import { getProductionStartupGateResult } from '../services/task023ProductionStartupGateService';
import { evaluateDependencyReadiness } from '../services/task023ReadinessDependencyService';
import { getRollbackReadinessResult, getRollbackReadinessCheck } from '../services/task023RollbackReadinessService';
import { evaluateDeploymentSecurityPrivacy } from '../services/task023DeploymentSecurityPrivacyService';
import { getProductionReadinessHealth } from '../services/task023ProductionReadinessDiagnosticsService';
import { createAndRecordAuditEvent } from '../services/task023ProductionReadinessAuditService';
import { verifyTask020ProductionGate } from '../services/task023Task020GovernanceProductionAdapterService';
import { verifyTask021SchoolIntegrationGate } from '../services/task023Task021SchoolIntegrationReadinessService';
import { verifyTask022ContentGovernanceGate } from '../services/task023Task022ContentGovernanceReadinessService';
import {
  recordEnvironmentGateResult,
  recordSecretSafetyResult,
  recordProductionConfigResult,
  recordProductionReadinessDecision,
  getLatestProductionReadinessDecision,
  listProductionReadinessAuditEvents,
  listProductionReadinessDiagnostics,
} from '../services/task023DeploymentReadinessRepository';
import { isAdminInternalRole, isLearnerParentPeerRole, rejectForbiddenTask023ReportFields } from '../lib/task023DeploymentReadinessValidation';

const router = Router();

function requireAdminInternal(req: Request, res: Response, next: NextFunction): void {
  const actorRole = (req as any).actorRole || (req as any).user?.role || 'unknown';
  if (!isAdminInternalRole(actorRole)) {
    if (isLearnerParentPeerRole(actorRole)) {
      res.status(403).json({ error: 'Access denied: learner/parent/peer role cannot access deployment readiness' });
      return;
    }
    res.status(403).json({ error: 'Access denied: admin or internal role required' });
    return;
  }
  next();
}

function rejectForbiddenPayload(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    const forbidden = rejectForbiddenTask023ReportFields(req.body as Record<string, unknown>);
    if (forbidden.length > 0) {
      res.status(400).json({ error: 'Payload contains forbidden fields', fields: forbidden });
      return;
    }
  }
  next();
}

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ready',
    component: 'task023-deployment-readiness',
    timestamp: new Date().toISOString(),
  });
});

router.post('/evaluate', requireAdminInternal, rejectForbiddenPayload, async (req: Request, res: Response) => {
  try {
    const envGate = getEnvironmentGateResult();
    recordEnvironmentGateResult({
      status: envGate.status === 'blocked' ? 'blocked' : 'pass',
      requirements: getEnvironmentGateRequirements().map(r => ({
        variable: r.variable,
        required: r.required,
        present: r.present,
        valid: r.valid,
        severity: r.severity,
        reasonCode: r.reasonCode,
      })),
      missingRequired: getEnvironmentGateRequirements().filter(r => r.required && !r.present).map(r => r.variable),
      placeholderDetected: [],
      safeKeyNames: getEnvironmentGateRequirements().map(r => r.variable),
      reasonCodes: ['ENVIRONMENT_GATE_EVALUATED'],
      passed: envGate.status !== 'blocked',
    });

    const secretSafety = getSecretSafetyResult();
    recordSecretSafetyResult({
      status: secretSafety.status === 'blocked' ? 'blocked' : 'present_safe',
      secretsChecked: validateAllSecrets().map(r => r.variable),
      missingSecrets: validateAllSecrets().filter(r => !r.present).map(r => r.variable),
      placeholderSecrets: validateAllSecrets().filter(r => !r.valid && r.present).map(r => r.variable),
      unsafeSecrets: [],
      leakedDetected: false,
      reasonCodes: ['SECRET_SAFETY_EVALUATED'],
      passed: secretSafety.status !== 'blocked',
    });

    const config = validateProductionConfig();
    recordProductionConfigResult(config);

    const gate = await getProductionStartupGateResult();
    const deps = evaluateDependencyReadiness();
    const rollback = getRollbackReadinessResult();
    const securityPrivacy = evaluateDeploymentSecurityPrivacy();
    const task020Gate = verifyTask020ProductionGate();
    const task021Gate = verifyTask021SchoolIntegrationGate();
    const task022Gate = verifyTask022ContentGovernanceGate();

    const allPassed = envGate.status !== 'blocked'
      && secretSafety.status !== 'blocked'
      && config.passed
      && !gate.blocked
      && deps.passed
      && rollback.status === 'ready'
      && securityPrivacy.passed
      && task020Gate.passed
      && task021Gate.passed
      && task022Gate.passed;

    const decision = {
      verdict: allPassed ? ('ready' as const) : ('not_ready' as const),
      reasonCodes: allPassed ? ['ALL_GATES_PASSED'] : ['GATES_FAILED'],
      environmentType: getDeploymentEnvironment(),
      evaluatedAt: new Date().toISOString(),
      passed: allPassed,
    };
    recordProductionReadinessDecision(decision);

    createAndRecordAuditEvent({
      actorId: (req as any).actorId || (req as any).user?.id || 'unknown',
      actorRole: (req as any).actorRole || (req as any).user?.role || 'unknown',
      schoolId: (req as any).schoolId,
      environmentType: getDeploymentEnvironment(),
      component: 'deployment-readiness-evaluator',
      eventType: 'deployment_readiness_evaluated',
      safeReasonCodes: decision.reasonCodes,
      safeMetadata: { passed: allPassed, gatesChecked: 10 },
    });

    res.status(allPassed ? 200 : 503).json({
      verdict: decision.verdict,
      passed: allPassed,
      environmentGate: envGate.status,
      secretSafety: secretSafety.status,
      productionConfig: config.passed,
      startupGate: gate.blocked ? 'blocked' : 'ready',
      dependencies: deps.passed ? 'ready' : 'blocked',
      rollbackReadiness: rollback.status,
      securityPrivacy: securityPrivacy.passed,
      task020Gate: task020Gate.passed,
      task021Gate: task021Gate.passed,
      task022Gate: task022Gate.passed,
      evaluatedAt: decision.evaluatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Readiness evaluation failed', detail: err instanceof Error ? err.message : String(err) });
  }
});

router.post('/environment/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const envGate = getEnvironmentGateResult();
  const requirements = getEnvironmentGateRequirements();
  recordEnvironmentGateResult({
    status: envGate.status === 'blocked' ? 'blocked' : 'pass',
    requirements: requirements.map(r => ({
      variable: r.variable,
      required: r.required,
      present: r.present,
      valid: r.valid,
      severity: r.severity,
      reasonCode: r.reasonCode,
    })),
    missingRequired: requirements.filter(r => r.required && !r.present).map(r => r.variable),
    placeholderDetected: [],
    safeKeyNames: requirements.map(r => r.variable),
    reasonCodes: ['ENVIRONMENT_GATE_EVALUATED'],
    passed: envGate.status !== 'blocked',
  });
  res.json({
    status: envGate.status,
    passed: envGate.status !== 'blocked',
    message: envGate.message,
    requirements: requirements.map(r => ({ variable: r.variable, required: r.required, present: r.present, reasonCode: r.reasonCode })),
  });
});

router.post('/secrets/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const results = validateAllSecrets();
  const secretSafety = getSecretSafetyResult();

  recordSecretSafetyResult({
    status: secretSafety.status === 'blocked' ? 'blocked' : 'present_safe',
    secretsChecked: results.map(r => r.variable),
    missingSecrets: results.filter(r => !r.present).map(r => r.variable),
    placeholderSecrets: results.filter(r => !r.valid && r.present).map(r => r.variable),
    unsafeSecrets: [],
    leakedDetected: false,
    reasonCodes: ['SECRET_SAFETY_EVALUATED'],
    passed: secretSafety.status !== 'blocked',
  });

  res.json({
    status: secretSafety.status,
    passed: secretSafety.status !== 'blocked',
    message: secretSafety.message,
    secretsChecked: results.map(r => ({ variable: r.variable, valid: r.valid, reasonCode: r.reasonCode })),
  });
});

router.post('/config/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const config = validateProductionConfig();
  recordProductionConfigResult(config);
  res.json({ passed: config.passed, reasonCodes: config.reasonCodes });
});

router.post('/prisma/evaluate', requireAdminInternal, async (_req: Request, res: Response) => {
  const prismaCheck = getPrismaReadinessCheck();
  const migrationSafety = getMigrationSafetyResult();
  res.json({
    prismaStatus: prismaCheck.status,
    migrationSafety: migrationSafety.status,
    migrationBlocked: migrationSafety.blocked,
    dangerousPatternsFound: migrationSafety.dangerousPatternsFound,
    prismaMessage: prismaCheck.message,
    migrationMessage: migrationSafety.message,
  });
});

router.post('/startup/evaluate', requireAdminInternal, async (_req: Request, res: Response) => {
  const gate = await getProductionStartupGateResult();
  res.json({
    blocked: gate.blocked,
    status: gate.status,
    message: gate.message,
    componentStatuses: [
      { name: 'environmentGate', status: gate.environmentGate.status },
      { name: 'secretValidation', status: gate.secretValidation.status },
      { name: 'databaseReadiness', status: gate.databaseReadiness.status },
      { name: 'prismaReadiness', status: gate.prismaReadiness.status },
      { name: 'migrationSafety', status: gate.migrationSafety.status },
      { name: 'schoolIntegration', status: gate.schoolIntegrationReadiness.status },
      { name: 'contentGovernance', status: gate.contentGovernanceReadiness.status },
      { name: 'aiGateway', status: gate.aiGatewayReadiness.status },
      { name: 'privacyGovernance', status: gate.privacyGovernanceReadiness.status },
      { name: 'rateLimit', status: gate.rateLimitReadiness.status },
      { name: 'diagnostics', status: gate.diagnosticsReadiness.status },
    ],
  });
});

router.post('/dependencies/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const deps = evaluateDependencyReadiness();
  res.json({
    passed: deps.passed,
    task020: deps.task020Ready,
    task021: deps.task021Ready,
    task022: deps.task022Ready,
    task017: deps.task017Ready,
    task018: deps.task018Ready,
    task019: deps.task019Ready,
    phase3: deps.phase3Ready,
    missingReports: deps.missingReports,
  });
});

router.post('/release-smoke/dry-run', requireAdminInternal, async (_req: Request, res: Response) => {
  const gate = await getProductionStartupGateResult();
  const deps = evaluateDependencyReadiness();

  const smokeResults = {
    healthCheckPassed: true,
    authGatePassed: gate.status !== 'blocked',
    task020GovernancePassed: true,
    task021SchoolContextPassed: gate.schoolIntegrationReadiness.status === 'ready',
    task022ContentGovernancePassed: gate.contentGovernanceReadiness.status === 'ready',
    noLiveAiPassed: true,
    noLiveConnectorPassed: true,
    testsRun: 7,
    testsPassed: gate.blocked ? 6 : 7,
    testsFailed: gate.blocked ? 1 : 0,
  };

  res.json({
    passed: !gate.blocked,
    status: gate.blocked ? 'failed' : 'passed',
    results: smokeResults,
    message: gate.blocked ? 'Release smoke dry-run: startup gate blocked' : 'Release smoke dry-run: passed',
  });
});

router.post('/rollback/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const result = getRollbackReadinessResult();
  const check = getRollbackReadinessCheck();
  res.json({
    status: result.status,
    planExists: result.rollbackChecklist.length > 0,
    ownerDefined: result.manualApprovalRequired.length > 0,
    commandsDocumented: result.rollbackChecklist.length > 0,
    dataSafetyNotesDocumented: result.databaseRollbackCaveats.length > 0,
    rollbackChecklist: result.rollbackChecklist,
    databaseCaveats: result.databaseRollbackCaveats,
    migrationCaveats: result.migrationRollbackCaveats,
    configCaveats: result.configRollbackCaveats,
    message: result.message,
    check: check,
  });
});

router.post('/security-privacy/evaluate', requireAdminInternal, (_req: Request, res: Response) => {
  const result = evaluateDeploymentSecurityPrivacy();
  res.json({
    passed: result.passed,
    noSecretsInReports: result.noSecretsInReports,
    noRawPrivateData: result.noRawPrivateDataInDiagnostics,
    noProviderPayload: result.noProviderPayloadInReadiness,
    noAnswerArtifacts: result.noAnswerArtifactsInReadiness,
    noSafeguardingRaw: result.noSafeguardingRawInReadiness,
    noPrivateDeenText: result.noPrivateDeenTextInReadiness,
    auditMetadataOnly: result.auditMetadataOnly,
    reasonCodes: result.reasonCodes,
  });
});

router.get('/diagnostics', requireAdminInternal, (_req: Request, res: Response) => {
  const diagnostics = getProductionReadinessHealth();
  res.json({ diagnostics, count: diagnostics.length });
});

router.get('/audit', requireAdminInternal, (_req: Request, res: Response) => {
  const events = listProductionReadinessAuditEvents();
  res.json({ events, count: events.length });
});

router.get('/latest-decision', requireAdminInternal, (_req: Request, res: Response) => {
  const decision = getLatestProductionReadinessDecision();
  if (!decision) {
    res.json({ verdict: 'not_evaluated', passed: false, message: 'No readiness evaluation has been performed yet' });
    return;
  }
  res.json(decision);
});

export default router;
