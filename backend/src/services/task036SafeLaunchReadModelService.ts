import {
  Task036SafeLaunchReadModel,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function buildSafeLaunchReadModel(
  sessionId: string
): Promise<Task036SafeLaunchReadModel> {
  const session = task036Repository.getLaunchSession(sessionId);
  const environmentGate = task036Repository.getEnvironmentGate(sessionId);
  const launchWindow = task036Repository.getLaunchWindow(sessionId);
  const approval = task036Repository.getLaunchApproval(sessionId);
  const schoolScope = task036Repository.getSingleSchoolScope(sessionId);
  const privacy = task036Repository.getPrivacyBoundary(sessionId);
  const contentGov = task036Repository.getContentGovernance(sessionId);
  const socratic = task036Repository.getSocraticIntegrity(sessionId);
  const deen = task036Repository.getDeenBoundary(sessionId);
  const identity = task036Repository.getSchoolIdentity(sessionId);
  const crossSchool = task036Repository.getCrossSchoolDenial(sessionId);
  const runtime = task036Repository.getRuntimeMonitoring(sessionId);
  const health = task036Repository.getHealthBudget(sessionId);
  const incident = task036Repository.getIncidentReadiness(sessionId);

  const model: Task036SafeLaunchReadModel = {
    ok: true,
    sessionId,
    schoolId: session?.schoolId || '',
    status: session?.status || 'unknown',
    launchWindowResult: launchWindow || null,
    environmentGateResult: environmentGate || null,
    approvalResult: approval || null,
    singleSchoolScopeResult: schoolScope || null,
    privacyBoundaryResult: privacy || null,
    contentGovernanceResult: contentGov || null,
    socraticIntegrityResult: socratic || null,
    deenBoundaryResult: deen || null,
    schoolIdentityResult: identity || null,
    crossSchoolDenialResult: crossSchool || null,
    runtimeMonitoringResult: runtime || null,
    healthBudgetResult: health || null,
    incidentReadinessResult: incident || null,
    safeSummariesOnly: true,
    generatedAt: createTask036SafeTimestamp(),
  };

  task036Repository.saveSafeLaunchReadModel(sessionId, model);
  return model;
}
