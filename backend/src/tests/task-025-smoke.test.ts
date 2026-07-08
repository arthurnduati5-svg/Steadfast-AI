import { describe, it, expect } from 'vitest';
import { checkDataPrivacyReadiness } from '../services/task025DataPrivacyReadinessService';
import { checkTask024Dependency } from '../services/task025Task024DependencyService';
import { checkSupportOperationsReadiness } from '../services/task025SupportOperationsReadinessService';
import { checkMonitoringGateReadiness } from '../services/task025MonitoringGateReadinessService';
import { checkPauseRollbackReadiness } from '../services/task025PauseRollbackReadinessService';
import { checkSafeguardingEscalationReadiness } from '../services/task025SafeguardingEscalationReadinessService';
import { checkParentCommunicationReadiness } from '../services/task025ParentCommunicationReadinessService';
import { checkAdminAcceptance } from '../services/task025SchoolAdminAcceptanceReadinessService';
import { validateTeacherWorkflow } from '../services/task025TeacherWorkflowValidationService';
import { evaluateCandidateCohortReadiness } from '../services/task025CandidateCohortReadinessService';
import { evaluateStakeholderReadiness } from '../services/task025StakeholderReadinessService';
import { evaluatePilotScope } from '../services/task025PilotScopeGateService';
import { checkPilotEligibility } from '../services/task025PilotEligibilityPolicyService';

const safeInput = {
  dataClassificationApplied: true,
  roleMatrixApplied: true,
  retentionExportDeleteFoundationNotBypassed: true,
  aiEgressGuardNotBypassed: true,
  rawLearnerDataBlocked: true,
  parentDataBlocked: true,
  safeguardingRawBlocked: true,
  privateDeenTextBlocked: true,
  hiddenReasoningBlocked: true,
  answerArtifactsBlocked: true,
};

describe('Task025Smoke', () => {
  it('checkDataPrivacyReadiness exists and returns expected shape', async () => {
    const result = await checkDataPrivacyReadiness(safeInput);
    expect(result).toHaveProperty('privacyStatus');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('safeSummary');
    expect(result).toHaveProperty('safeBlockers');
    expect(Array.isArray(result.safeBlockers)).toBe(true);
  });

  it('checkTask024Dependency exists and returns expected shape', async () => {
    const result = await checkTask024Dependency({
      task024MonitoringReady: true,
      task024IncidentDrillDryRunAvailable: true,
      task024BackupRestoreDryRunAvailable: true,
      task024OperationalPrivacyScanAvailable: true,
      task024PauseSignalPathDefined: true,
      task024RollbackSignalPathDefined: true,
      task024ReadinessDiagnosticsSafe: true,
      task024CommitPresent: true,
    });
    expect(result).toHaveProperty('dependencyMet');
    expect(result).toHaveProperty('task024Status');
  });

  it('checkSupportOperationsReadiness returns expected shape', async () => {
    const result = await checkSupportOperationsReadiness({
      supportOwnerAssigned: true,
      incidentOwnerAssigned: true,
      supportScheduleDefined: true,
      incidentResponseTimeDefined: true,
      communicationChainDefined: true,
    });
    expect(result).toHaveProperty('supportStatus');
    expect(result).toHaveProperty('riskLevel');
  });

  it('checkMonitoringGateReadiness returns expected shape', async () => {
    const result = await checkMonitoringGateReadiness({
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      operationalPrivacyScanAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
      readinessDiagnosticsSafeMetadataOnly: true,
    });
    expect(result).toHaveProperty('monitoringStatus');
    expect(result).toHaveProperty('safeBlockers');
  });

  it('checkPauseRollbackReadiness returns expected shape', async () => {
    const result = await checkPauseRollbackReadiness({
      pauseOwnerExists: true,
      rollbackOwnerExists: true,
      pauseCriteriaDefined: true,
      rollbackCriteriaDefined: true,
      incidentSeverityMappingExists: true,
      communicationChainExistsAsMetadata: true,
      noActualRollbackExecuted: true,
      noDeploymentCommandExists: true,
    });
    expect(result).toHaveProperty('pauseRollbackStatus');
    expect(result).toHaveProperty('noActualRollbackExecuted');
  });

  it('checkSafeguardingEscalationReadiness returns expected shape', async () => {
    const result = await checkSafeguardingEscalationReadiness({
      safeguardingOwnerExists: true,
      escalationRouteDefined: true,
      seriousRiskDisclosureMinimal: true,
      rawNotesNeverExposed: true,
      humanReviewPathExists: true,
      auditEventCreated: true,
    });
    expect(result).toHaveProperty('safeguardingStatus');
    expect(result).toHaveProperty('escalationRouteDefined');
  });

  it('checkParentCommunicationReadiness returns expected shape', async () => {
    const result = await checkParentCommunicationReadiness({
      templatesReady: true,
      noRawLearnerDataInTemplates: true,
      noUnsupportedClaims: true,
      noReligiousAuthorityOverclaim: true,
      noAiExaggeration: true,
      noGuaranteeOfOutcomes: true,
      clearPilotExplanation: true,
      clearSupportPath: true,
      clearSchoolContactPath: true,
      clearPrivacySummary: true,
      clearOptOutPathDefined: true,
    });
    expect(result).toHaveProperty('parentCommunicationStatus');
    expect(result.clearOptOutPathDefined).toBe(true);
  });

  it('checkAdminAcceptance returns expected shape', async () => {
    const result = await checkAdminAcceptance({
      adminOwner: 'admin-1',
      pilotOwnerAssigned: true,
      pilotPurposeDefined: true,
      pilotScopeDefined: true,
      pilotDatesDefined: true,
      escalationOwnerAssigned: true,
      pauseOwnerAssigned: true,
      rollbackOwnerAssigned: true,
      supportOwnerAssigned: true,
      privacyOwnerAssigned: true,
      incidentOwnerAssigned: true,
    });
    expect(result).toHaveProperty('adminAcceptanceStatus');
    expect(result).toHaveProperty('adminOwner');
  });

  it('validateTeacherWorkflow returns expected shape', async () => {
    const result = await validateTeacherWorkflow({
      teacherCount: 2,
      validatedTeachers: 2,
      allTeachersUnderstandScope: true,
      escalationPathKnown: true,
      privacyBoundaryUnderstood: true,
    });
    expect(result).toHaveProperty('teacherWorkflowStatus');
    expect(result.validatedTeachers).toBe(2);
  });

  it('evaluateCandidateCohortReadiness returns expected shape', async () => {
    const result = await evaluateCandidateCohortReadiness({
      schoolId: 's-1',
      cohortId: 'c-1',
      cohortSize: 20,
      teacherOwner: 't-1',
      supportOwner: 'so-1',
      sourceApprovedCurriculumContext: true,
      safeLearningContextAvailable: true,
    });
    expect(result).toHaveProperty('cohortStatus');
    expect(result).toHaveProperty('readinessScore');
    expect(typeof result.readinessScore).toBe('number');
  });

  it('evaluateStakeholderReadiness returns expected shape', async () => {
    const result = await evaluateStakeholderReadiness({
      schoolId: 's-1',
      teacherIds: ['t-1', 't-2'],
      adminIds: ['a-1'],
      supportStaffIds: ['s-1'],
      safeguardingOwnerId: 'so-1',
    });
    expect(result).toHaveProperty('stakeholderStatus');
    expect(result.teacherCount).toBeGreaterThanOrEqual(2);
  });

  it('evaluatePilotScope returns expected shape', async () => {
    const result = await evaluatePilotScope({
      schoolId: 's-1',
      pilotPurpose: 'Controlled pilot for Cambridge year 7',
      cohortSize: 20,
      pilotDurationWeeks: 12,
      teacherCoverageAvailable: true,
      adminOwner: 'a-1',
      supportOwner: 'so-1',
      monitoringOwner: 'm-1',
      pauseOwner: 'p-1',
      rollbackOwner: 'r-1',
      safeguardingEscalationPathDefined: true,
      parentCommunicationMaterialPrepared: true,
      deenSourceReferralPathDefined: true,
      curriculumSourceGovernanceReady: true,
      privacyGovernanceReady: true,
      operationsMonitoringReady: true,
    });
    expect(result).toHaveProperty('scopeStatus');
    expect(result).toHaveProperty('task026SafeToStart');
  });

  it('checkPilotEligibility returns expected shape', async () => {
    const result = await checkPilotEligibility({
      schoolId: 's-1',
      schoolVerified: true,
      pilotScopeEvaluated: true,
      cohortReadinessEvaluated: true,
      teacherWorkflowValidated: true,
      adminAcceptanceChecked: true,
      parentCommunicationChecked: true,
      safeguardingChecked: true,
      monitoringGateChecked: true,
      pauseRollbackChecked: true,
      dataPrivacyChecked: true,
      task020ContinuityPassed: true,
      task021ContinuityPassed: true,
      task022ContinuityPassed: true,
      task023ContinuityPassed: true,
      task024ContinuityPassed: true,
    });
    expect(result).toHaveProperty('eligible');
    expect(result).toHaveProperty('riskLevel');
  });
});
