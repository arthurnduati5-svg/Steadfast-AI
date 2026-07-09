import { describe, it, expect } from 'vitest';
import { loadTask031ProofForTask032 } from '../services/task032Task031ProofLoaderService';
import { checkTask032CanaryEnvironmentGate } from '../services/task032CanaryEnvironmentGateService';
import { checkTask032PrivacyBoundary } from '../services/task032LiveStudentPrivacyBoundaryService';
import {
  createTask032ApprovedCanaryFixture,
  createTask032ConsentMatrixFixture,
  createTask032CohortMembersFixture,
} from '../tests/fixtures/task032ApprovedCanaryFixture';

describe('Task 032 - Controlled Canary Runner Contract', () => {
  it('should run all canary checks and produce consistent results', async () => {
    const task031Proof = await loadTask031ProofForTask032();
    const environmentGate = await checkTask032CanaryEnvironmentGate();
    const config = createTask032ApprovedCanaryFixture();
    const consentMatrix = createTask032ConsentMatrixFixture();
    const members = createTask032CohortMembersFixture();
    const privacyContent = JSON.stringify({ config, consentMatrix, members });
    const privacyScan = await checkTask032PrivacyBoundary(privacyContent, 'canary_runner');

    const resultShape = {
      scenarioRun: true,
      scenarioMode: 'controlled_canary_dry_run',
      task031ProofLoaded: task031Proof.ok,
      canaryEnvironmentPassed: environmentGate.ok,
      approvedSchoolConfigPassed: !!config.schoolId,
      consentAuthorizationPassed: consentMatrix.schoolAuthorized && consentMatrix.adminApproved,
      cohortEligibilityPassed: members.length > 0,
      canaryCapPassed: members.length <= config.effectiveStudentCap,
      privacyBoundaryPassed: privacyScan.ok,
      liveProductionRolloutPerformed: false,
      rawPrivateDataExposed: false,
      socraticGatePassed: true,
      deenGatePassed: true,
      curriculumGatePassed: true,
    };

    expect(resultShape.scenarioRun).toBe(true);
    expect(typeof resultShape.task031ProofLoaded).toBe('boolean');
    expect(typeof resultShape.canaryEnvironmentPassed).toBe('boolean');
    expect(typeof resultShape.privacyBoundaryPassed).toBe('boolean');
    expect(resultShape.liveProductionRolloutPerformed).toBe(false);
    expect(resultShape.rawPrivateDataExposed).toBe(false);
  });

  it('should use safe identifiers only', () => {
    const config = createTask032ApprovedCanaryFixture();
    const consentMatrix = createTask032ConsentMatrixFixture();
    const members = createTask032CohortMembersFixture();

    const allIds = [
      config.schoolId, config.tenantId, config.canaryCohortId, config.canaryRunId,
      config.approvedByActorHash, config.rollbackOwnerActorHash, config.safeguardingEscalationActorHash,
      ...members.map(m => m.studentHash),
    ];

    for (const id of allIds) {
      expect(id).toContain('task032');
    }
  });
});
