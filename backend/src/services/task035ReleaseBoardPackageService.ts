import { Task035ReleaseBoardPackage, Task035FinalDecision } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035Task034ProofStatus } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035SchoolBoundaryConfig } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035FullSchoolSimulationResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035ProductionSafeEnvironmentGateResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035StaffReleaseBoardResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035StudentSafeNoticeResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035TeacherAdminReadinessResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035RuntimeGuardSimulationResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035HealthCapacityBudgetResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035RollbackReadinessResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035PrivacyReviewResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035SocraticIntegrityReviewResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035DeenGovernanceReviewResult } from '../contracts/task035SchoolWideReadinessContracts';
import { Task035CurriculumSourceReviewResult } from '../contracts/task035SchoolWideReadinessContracts';

export interface ReleaseBoardPackageInput {
  task034Proof: Task035Task034ProofStatus;
  schoolBoundary: Task035SchoolBoundaryConfig;
  simulation: Task035FullSchoolSimulationResult;
  envGate: Task035ProductionSafeEnvironmentGateResult;
  staffReleaseBoard: Task035StaffReleaseBoardResult;
  studentNotice: Task035StudentSafeNoticeResult;
  teacherAdmin: Task035TeacherAdminReadinessResult;
  runtimeGuard: Task035RuntimeGuardSimulationResult;
  healthBudget: Task035HealthCapacityBudgetResult;
  rollback: Task035RollbackReadinessResult;
  privacyReview: Task035PrivacyReviewResult;
  socraticReview: Task035SocraticIntegrityReviewResult;
  deenReview: Task035DeenGovernanceReviewResult;
  curriculumReview: Task035CurriculumSourceReviewResult;
}

export function generateReleaseBoardPackage(input: ReleaseBoardPackageInput): Task035ReleaseBoardPackage {
  const blockingIssues: string[] = [
    ...input.task034Proof.blockingIssues,
    ...input.schoolBoundary.blockingIssues,
    ...input.simulation.blockingIssues,
    ...input.envGate.blockingIssues,
    ...input.staffReleaseBoard.blockingIssues,
    ...input.studentNotice.blockingIssues,
    ...input.teacherAdmin.blockingIssues,
    ...input.runtimeGuard.blockingIssues,
    ...input.healthBudget.blockingIssues,
    ...input.rollback.blockingIssues,
    ...input.privacyReview.blockingIssues,
    ...input.socraticReview.blockingIssues,
    ...input.deenReview.blockingIssues,
    ...input.curriculumReview.blockingIssues,
  ];

  const safeToStartTask036 =
    input.task034Proof.ok &&
    input.schoolBoundary.ok &&
    input.simulation.ok &&
    input.envGate.ok &&
    input.staffReleaseBoard.ok &&
    input.studentNotice.ok &&
    input.teacherAdmin.ok &&
    input.runtimeGuard.ok &&
    input.healthBudget.ok &&
    input.rollback.ok &&
    input.privacyReview.ok &&
    input.socraticReview.ok &&
    input.deenReview.ok &&
    input.curriculumReview.ok &&
    !input.simulation.liveActivationPerformed &&
    !input.simulation.publicActivationPerformed &&
    !input.simulation.multiSchoolActivationPerformed &&
    !input.envGate.rawDatabaseUrlExposed &&
    blockingIssues.length === 0;

  const finalDecision: Task035FinalDecision = safeToStartTask036
    ? 'TASK_035_PASS_SAFE_TO_START_TASK_036'
    : 'TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036';

  const package_: Task035ReleaseBoardPackage = {
    task034ProofSummary: input.task034Proof as unknown as Record<string, unknown>,
    schoolBoundarySummary: input.schoolBoundary as unknown as Record<string, unknown>,
    fullSchoolSimulationSummary: input.simulation as unknown as Record<string, unknown>,
    productionSafeEnvironmentGate: input.envGate as unknown as Record<string, unknown>,
    staffReleaseBoardSummary: input.staffReleaseBoard as unknown as Record<string, unknown>,
    studentSafeNoticeSummary: input.studentNotice as unknown as Record<string, unknown>,
    teacherAdminReadinessSummary: input.teacherAdmin as unknown as Record<string, unknown>,
    runtimeGuardSimulationSummary: input.runtimeGuard as unknown as Record<string, unknown>,
    healthCapacityBudgetSummary: input.healthBudget as unknown as Record<string, unknown>,
    rollbackKillSwitchSummary: input.rollback as unknown as Record<string, unknown>,
    privacyReviewSummary: input.privacyReview as unknown as Record<string, unknown>,
    socraticReviewSummary: input.socraticReview as unknown as Record<string, unknown>,
    deenReviewSummary: input.deenReview as unknown as Record<string, unknown>,
    curriculumSourceReviewSummary: input.curriculumReview as unknown as Record<string, unknown>,
    blockingIssues,
    knownLimitations: [
      'No public launch, multi-school rollout, payment flow, marketing launch, or uncontrolled live 100% activation was performed. Task 035 intentionally proves governed full-school readiness simulation and release-board readiness only. This does not affect safeToStartTask036 because Task 036 will handle the next approved release step only if Task 035 earns it.',
    ],
    safeToStartTask036,
    finalDecision,
    generatedAt: new Date().toISOString(),
  };

  console.log(`[Task035 ReleaseBoardPackage] Package generated. safeToStartTask036: ${safeToStartTask036}`);

  return package_;
}
