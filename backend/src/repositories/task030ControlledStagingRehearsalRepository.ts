import {
  Task030Task029DependencyProof,
  Task030StagingEnvironmentGateResult,
  Task030SyntheticSchoolFixture,
  Task030SyntheticCohortFixture,
  Task030RoleTokenMatrix,
  Task030RehearsalRun,
  Task030RehearsalStageResult,
  Task030AdminOperatorJourneyResult,
  Task030TeacherJourneyResult,
  Task030StudentJourneyResult,
  Task030UnknownRoleDenialResult,
  Task030OperationsConsoleRehearsalResult,
  Task030ControlActionRehearsalResult,
  Task030RollbackDrillResult,
  Task030StaffTrainingPack,
  Task030SafeEvidenceEvent,
  Task030DiagnosticsResult,
  Task030ControlledStagingReport,
} from '../contracts/task030ControlledStagingRehearsalContracts';

export class Task030ControlledStagingRehearsalRepository {
  private task029Proofs: Map<string, Task030Task029DependencyProof> = new Map();
  private environmentGates: Task030StagingEnvironmentGateResult[] = [];
  private schoolFixtures: Map<string, Task030SyntheticSchoolFixture> = new Map();
  private roleTokenMatrices: Map<string, Task030RoleTokenMatrix> = new Map();
  private rehearsalRuns: Map<string, Task030RehearsalRun> = new Map();
  private stageResults: Map<string, Task030RehearsalStageResult[]> = new Map();
  private adminOperatorJourneys: Task030AdminOperatorJourneyResult[] = [];
  private teacherJourneys: Task030TeacherJourneyResult[] = [];
  private studentJourneys: Task030StudentJourneyResult[] = [];
  private unknownRoleDenials: Task030UnknownRoleDenialResult[] = [];
  private operationsConsoleRehearsals: Task030OperationsConsoleRehearsalResult[] = [];
  private controlActionRehearsals: Task030ControlActionRehearsalResult[] = [];
  private rollbackDrills: Task030RollbackDrillResult[] = [];
  private staffTrainingPacks: Task030StaffTrainingPack[] = [];
  private evidenceEvents: Task030SafeEvidenceEvent[] = [];
  private diagnosticsResults: Task030DiagnosticsResult[] = [];
  private reports: Task030ControlledStagingReport[] = [];

  private proofIdCounter = 0;

  async recordTask029DependencyProof(proof: Task030Task029DependencyProof): Promise<void> {
    const id = `proof_${++this.proofIdCounter}`;
    this.task029Proofs.set(id, proof);
  }

  async getLatestTask029DependencyProof(): Promise<Task030Task029DependencyProof | null> {
    const entries = Array.from(this.task029Proofs.entries());
    if (entries.length === 0) return null;
    const lastEntry = entries[entries.length - 1];
    return lastEntry[1];
  }

  async recordEnvironmentGate(result: Task030StagingEnvironmentGateResult): Promise<void> {
    this.environmentGates.push(result);
  }

  async listEnvironmentGates(): Promise<Task030StagingEnvironmentGateResult[]> {
    return [...this.environmentGates];
  }

  async recordSyntheticSchoolFixture(fixture: Task030SyntheticSchoolFixture): Promise<void> {
    this.schoolFixtures.set(fixture.schoolId, fixture);
  }

  async getSyntheticSchoolFixture(fixtureId: string): Promise<Task030SyntheticSchoolFixture | null> {
    return this.schoolFixtures.get(fixtureId) ?? null;
  }

  async listSyntheticSchoolFixtures(): Promise<Task030SyntheticSchoolFixture[]> {
    return Array.from(this.schoolFixtures.values());
  }

  async recordRoleTokenMatrix(matrix: Task030RoleTokenMatrix): Promise<void> {
    this.roleTokenMatrices.set(matrix.matrixId, matrix);
  }

  async getRoleTokenMatrix(matrixId: string): Promise<Task030RoleTokenMatrix | null> {
    return this.roleTokenMatrices.get(matrixId) ?? null;
  }

  async createRehearsalRun(run: Task030RehearsalRun): Promise<void> {
    this.rehearsalRuns.set(run.runId, run);
  }

  async getRehearsalRun(runId: string): Promise<Task030RehearsalRun | null> {
    return this.rehearsalRuns.get(runId) ?? null;
  }

  async updateRehearsalRun(runId: string, patch: Partial<Task030RehearsalRun>): Promise<void> {
    const existing = this.rehearsalRuns.get(runId);
    if (!existing) return;
    this.rehearsalRuns.set(runId, { ...existing, ...patch, updatedAt: new Date().toISOString() });
  }

  async listRehearsalRuns(): Promise<Task030RehearsalRun[]> {
    return Array.from(this.rehearsalRuns.values());
  }

  async recordStageResult(runId: string, stage: Task030RehearsalStageResult): Promise<void> {
    const results = this.stageResults.get(runId) ?? [];
    results.push(stage);
    this.stageResults.set(runId, results);
  }

  async listStageResults(runId: string): Promise<Task030RehearsalStageResult[]> {
    return this.stageResults.get(runId) ?? [];
  }

  async recordAdminOperatorJourney(result: Task030AdminOperatorJourneyResult): Promise<void> {
    this.adminOperatorJourneys.push(result);
  }

  async recordTeacherJourney(result: Task030TeacherJourneyResult): Promise<void> {
    this.teacherJourneys.push(result);
  }

  async recordStudentJourney(result: Task030StudentJourneyResult): Promise<void> {
    this.studentJourneys.push(result);
  }

  async recordUnknownRoleDenial(result: Task030UnknownRoleDenialResult): Promise<void> {
    this.unknownRoleDenials.push(result);
  }

  async recordOperationsConsoleRehearsal(result: Task030OperationsConsoleRehearsalResult): Promise<void> {
    this.operationsConsoleRehearsals.push(result);
  }

  async recordControlActionRehearsal(result: Task030ControlActionRehearsalResult): Promise<void> {
    this.controlActionRehearsals.push(result);
  }

  async recordRollbackDrill(result: Task030RollbackDrillResult): Promise<void> {
    this.rollbackDrills.push(result);
  }

  async recordStaffTrainingPack(pack: Task030StaffTrainingPack): Promise<void> {
    this.staffTrainingPacks.push(pack);
  }

  async recordEvidenceEvent(event: Task030SafeEvidenceEvent): Promise<void> {
    this.evidenceEvents.push(event);
  }

  async listEvidenceEvents(runId: string): Promise<Task030SafeEvidenceEvent[]> {
    return this.evidenceEvents.filter(e => e.runId === runId);
  }

  async recordDiagnostics(result: Task030DiagnosticsResult): Promise<void> {
    this.diagnosticsResults.push(result);
  }

  async listDiagnostics(): Promise<Task030DiagnosticsResult[]> {
    return [...this.diagnosticsResults];
  }

  async recordReport(report: Task030ControlledStagingReport): Promise<void> {
    this.reports.push(report);
  }

  async listReports(): Promise<Task030ControlledStagingReport[]> {
    return [...this.reports];
  }

  async getLatestReport(): Promise<Task030ControlledStagingReport | null> {
    if (this.reports.length === 0) return null;
    return this.reports[this.reports.length - 1];
  }

  async clearTask030StoresForTests(): Promise<void> {
    this.task029Proofs.clear();
    this.environmentGates = [];
    this.schoolFixtures.clear();
    this.roleTokenMatrices.clear();
    this.rehearsalRuns.clear();
    this.stageResults.clear();
    this.adminOperatorJourneys = [];
    this.teacherJourneys = [];
    this.studentJourneys = [];
    this.unknownRoleDenials = [];
    this.operationsConsoleRehearsals = [];
    this.controlActionRehearsals = [];
    this.rollbackDrills = [];
    this.staffTrainingPacks = [];
    this.evidenceEvents = [];
    this.diagnosticsResults = [];
    this.reports = [];
    this.proofIdCounter = 0;
  }
}

export const task030ControlledStagingRehearsalRepository = new Task030ControlledStagingRehearsalRepository();
