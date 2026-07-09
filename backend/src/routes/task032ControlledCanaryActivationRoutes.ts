import { Router, Request, Response } from 'express';
import { loadTask031ProofForTask032 } from '../services/task032Task031ProofLoaderService';
import { runTask032CanaryEnvironmentGate } from '../services/task032CanaryEnvironmentGateService';
import { createTask032ApprovedSchoolCanaryConfig } from '../services/task032ApprovedSchoolCanaryConfigService';
import { evaluateTask032CanaryCohortEligibility } from '../services/task032CanaryCohortEligibilityService';
import { verifyTask032CanaryConsentAuthorization } from '../services/task032CanaryConsentAuthorizationService';
import { runTask032LiveStudentPrivacyBoundary } from '../services/task032LiveStudentPrivacyBoundaryService';
import { runTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';
import {
  createTask032CanaryActivationRecord,
  advanceTask032CanaryActivationState,
  getTask032CanaryActivationRecord,
  blockTask032CanaryActivation,
} from '../services/task032CanaryActivationStateMachineService';
import { runTask032CanaryActivationCommand } from '../services/task032CanaryActivationCommandService';
import { runTask032CanaryControlAction } from '../services/task032CanaryControlActionService';
import { runTask032CanaryHealthBudget } from '../services/task032CanaryHealthBudgetService';
import { verifyTask032CanaryIncidentBridge } from '../services/task032CanaryIncidentBridgeService';
import { createTask032CanaryMonitoringSnapshotPlaceholder } from '../services/task032CanaryMonitoringSnapshotService';
import { createTask032CanarySafeView, getTask032CanarySafeViewByActivationId } from '../services/task032CanaryViewService';
import { recordTask032CanaryEvidenceEvent, listTask032CanaryEvidenceEvents } from '../services/task032CanaryActivationEvidenceLedgerService';
import { getTask032CanaryActivationDiagnostics } from '../services/task032CanaryActivationDiagnosticsService';
import { generateTask032ControlledCanaryActivationReport } from '../services/task032CanaryActivationReportService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import {
  isTask032AdminOperatorRole,
  resolveTask032ActorRole,
  isTask032DeniedRealRole,
} from '../contracts/task032ControlledCanaryActivationContracts';

const router = Router();

function safeError(res: Response, status: number, message: string, reasonCodes: string[] = []) {
  res.status(status).json({ error: message, reasonCodes, safe: true });
}

// 1. Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    task: 'TASK-032',
    scope: 'controlled-canary-activation-runtime-backend',
    timestamp: new Date().toISOString(),
  });
});

// 2. Task 031 dependency check
router.post('/dependency/task031/check', async (_req: Request, res: Response) => {
  try {
    const result = await loadTask031ProofForTask032();
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Task 031 dependency check failed', ['DEPENDENCY_CHECK_FAILED']);
  }
});

// 3. Environment preflight
router.post('/environment/preflight', async (req: Request, res: Response) => {
  try {
    const { environmentType, activationMode, dataMode, sideEffectMode, productionDeploymentRequested = false, liveNotificationRequested = false, liveAiRequested = false, liveSchoolConnectorRequested = false, productionMutationRequested = false, canaryObservationRequested = false, rolloutRequested = false, schoolWideLaunchRequested = false, backendFreezeRequested = false } = req.body;
    const result = await runTask032CanaryEnvironmentGate({ environmentType, activationMode, dataMode, sideEffectMode, productionDeploymentRequested, liveNotificationRequested, liveAiRequested, liveSchoolConnectorRequested, productionMutationRequested, canaryObservationRequested, rolloutRequested, schoolWideLaunchRequested, backendFreezeRequested });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Environment preflight check failed', ['ENVIRONMENT_PREFLIGHT_FAILED']);
  }
});

// 4. Approved school canary config
router.post('/config/approved-school-canary', async (req: Request, res: Response) => {
  try {
    const { schoolId, approvedByRole } = req.body;
    const config = await createTask032ApprovedSchoolCanaryConfig({ schoolId, approvedByRole });
    res.json(config);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to create approved school canary config', ['CONFIG_CREATION_FAILED']);
  }
});

// 5. Cohort eligibility
router.post('/cohort/eligibility', async (req: Request, res: Response) => {
  try {
    const { schoolId, cohortId, actorRole, config } = req.body;
    const result = await evaluateTask032CanaryCohortEligibility({ schoolId, cohortId, actorRole, config });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Cohort eligibility check failed', ['COHORT_ELIGIBILITY_FAILED']);
  }
});

// 6. Consent authorization readiness
router.post('/consent-authorization/readiness', async (req: Request, res: Response) => {
  try {
    const { schoolId, config, actorRole } = req.body;
    const result = await verifyTask032CanaryConsentAuthorization({ schoolId, config, actorRole });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Consent authorization readiness check failed', ['CONSENT_AUTHORIZATION_FAILED']);
  }
});

// 7. Privacy boundary check
router.post('/privacy-boundary/check', async (req: Request, res: Response) => {
  try {
    const { schoolId, actorRole } = req.body;
    const result = await runTask032LiveStudentPrivacyBoundary({ schoolId, actorRole });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Privacy boundary check failed', ['PRIVACY_BOUNDARY_FAILED']);
  }
});

// 8. Runtime guard check
router.post('/runtime-guard/check', async (req: Request, res: Response) => {
  try {
    const { schoolId, actorRole, activationId } = req.body;
    const result = await runTask032CanaryRuntimeGuard({ schoolId, actorRole, activationId });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Runtime guard check failed', ['RUNTIME_GUARD_FAILED']);
  }
});

// 9. Create activation record
router.post('/activations', async (req: Request, res: Response) => {
  try {
    const { schoolId, configuredCohortSize } = req.body;
    const record = await createTask032CanaryActivationRecord({ schoolId, configuredCohortSize });
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to create activation record', ['ACTIVATION_CREATION_FAILED']);
  }
});

// 10. Get activation record
router.get('/activations/:activationId', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const record = await getTask032CanaryActivationRecord(activationId);
    if (!record) {
      return safeError(res, 404, 'Activation record not found', ['ACTIVATION_NOT_FOUND']);
    }
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve activation record', ['ACTIVATION_RETRIEVAL_FAILED']);
  }
});

// 11. Activate internal
router.post('/activations/:activationId/activate-internal', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId, actorRole, config, environmentInput } = req.body;
    const record = await runTask032CanaryActivationCommand({ schoolId, actorRole, config, environmentInput });
    res.json(record);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Internal activation command failed', ['ACTIVATE_INTERNAL_FAILED']);
  }
});

// 12. Control action
router.post('/activations/:activationId/control-action', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { action, actorRole, schoolId } = req.body;
    const result = await runTask032CanaryControlAction({ activationId, action, actorRole, schoolId });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Control action failed', ['CONTROL_ACTION_FAILED']);
  }
});

// 13. Health budget
router.post('/activations/:activationId/health-budget', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId } = req.body;
    const result = await runTask032CanaryHealthBudget({ activationId, schoolId });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Health budget check failed', ['HEALTH_BUDGET_FAILED']);
  }
});

// 14. Incident bridge
router.post('/activations/:activationId/incident-bridge', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { schoolId } = req.body;
    const result = await verifyTask032CanaryIncidentBridge({ activationId, schoolId });
    res.json(result);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Incident bridge verification failed', ['INCIDENT_BRIDGE_FAILED']);
  }
});

// 15. Monitoring snapshot placeholder
router.post('/activations/:activationId/monitoring-snapshot-placeholder', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const { safeSummary, reasonCodes } = req.body;
    const snapshot = await createTask032CanaryMonitoringSnapshotPlaceholder({ activationId, safeSummary, reasonCodes });
    res.json(snapshot);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Monitoring snapshot placeholder creation failed', ['SNAPSHOT_PLACEHOLDER_FAILED']);
  }
});

// 16. Safe view
router.get('/activations/:activationId/safe-view', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const view = await getTask032CanarySafeViewByActivationId(activationId);
    if (!view) {
      return safeError(res, 404, 'Safe view not found', ['SAFE_VIEW_NOT_FOUND']);
    }
    res.json(view);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve safe view', ['SAFE_VIEW_RETRIEVAL_FAILED']);
  }
});

// 17. Evidence ledger
router.get('/activations/:activationId/evidence', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const ledger = await listTask032CanaryEvidenceEvents(activationId);
    res.json(ledger);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve evidence ledger', ['EVIDENCE_LEDGER_FAILED']);
  }
});

// 18. Generate report
router.post('/activations/:activationId/report', async (req: Request, res: Response) => {
  try {
    const { activationId } = req.params;
    const report = await generateTask032ControlledCanaryActivationReport({ activationId });
    res.json(report);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to generate activation report', ['REPORT_GENERATION_FAILED']);
  }
});

// 19. Latest report
router.get('/reports/latest', async (_req: Request, res: Response) => {
  try {
    const report = await task032ControlledCanaryActivationRepository.getLatestReport();
    if (!report) {
      return safeError(res, 404, 'Latest report not found', ['REPORT_NOT_FOUND']);
    }
    res.json(report);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve latest report', ['LATEST_REPORT_FAILED']);
  }
});

// 20. Diagnostics
router.get('/diagnostics', async (req: Request, res: Response) => {
  try {
    const activationId = req.query.activationId as string | undefined;
    const diagnostics = await getTask032CanaryActivationDiagnostics({ activationId });
    res.json(diagnostics);
  } catch (err: any) {
    safeError(res, 500, err.message || 'Failed to retrieve diagnostics', ['DIAGNOSTICS_FAILED']);
  }
});

export default router;
