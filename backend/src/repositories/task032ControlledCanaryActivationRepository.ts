import {
  Task032Task031DependencyProof,
  Task032CanaryEnvironmentGateResult,
  Task032ApprovedSchoolCanaryConfig,
  Task032CanaryCohortEligibilityResult,
  Task032ConsentAuthorizationReadinessResult,
  Task032LiveStudentPrivacyBoundaryResult,
  Task032CanaryRuntimeGuardResult,
  Task032CanaryActivationRecord,
  Task032CanaryControlActionResult,
  Task032CanaryHealthBudgetResult,
  Task032CanaryIncidentBridgeResult,
  Task032CanarySafeView,
  Task032CanaryEvidenceEvent,
  Task032CanaryDiagnosticsResult,
  Task032ControlledCanaryActivationReport,
} from '../contracts/task032ControlledCanaryActivationContracts';

export class Task032ControlledCanaryActivationRepository {
  private task031ProofStore: Task032Task031DependencyProof | null = null;
  private environmentGateStore: Task032CanaryEnvironmentGateResult[] = [];
  private approvedSchoolCanaryConfigStore = new Map<string, Task032ApprovedSchoolCanaryConfig>();
  private cohortEligibilityStore: Task032CanaryCohortEligibilityResult[] = [];
  private consentAuthorizationStore: Task032ConsentAuthorizationReadinessResult[] = [];
  private privacyBoundaryStore: Task032LiveStudentPrivacyBoundaryResult[] = [];
  private runtimeGuardStore: Task032CanaryRuntimeGuardResult[] = [];
  private activationRecordStore = new Map<string, Task032CanaryActivationRecord>();
  private controlActionStore: Task032CanaryControlActionResult[] = [];
  private healthBudgetStore: Task032CanaryHealthBudgetResult[] = [];
  private incidentBridgeStore: Task032CanaryIncidentBridgeResult[] = [];
  private safeViewStore = new Map<string, Task032CanarySafeView>();
  private evidenceEventStore: Task032CanaryEvidenceEvent[] = [];
  private diagnosticsStore: Task032CanaryDiagnosticsResult[] = [];
  private reportStore: Task032ControlledCanaryActivationReport[] = [];

  async recordTask031DependencyProof(proof: Task032Task031DependencyProof): Promise<void> {
    this.task031ProofStore = proof;
  }

  async getLatestTask031DependencyProof(): Promise<Task032Task031DependencyProof | null> {
    return this.task031ProofStore;
  }

  async recordEnvironmentGate(result: Task032CanaryEnvironmentGateResult): Promise<void> {
    this.environmentGateStore.push(result);
  }

  async listEnvironmentGates(): Promise<Task032CanaryEnvironmentGateResult[]> {
    return [...this.environmentGateStore];
  }

  async recordApprovedSchoolCanaryConfig(config: Task032ApprovedSchoolCanaryConfig): Promise<void> {
    this.approvedSchoolCanaryConfigStore.set(config.configId, config);
  }

  async getApprovedSchoolCanaryConfig(configId: string): Promise<Task032ApprovedSchoolCanaryConfig | null> {
    return this.approvedSchoolCanaryConfigStore.get(configId) ?? null;
  }

  async listApprovedSchoolCanaryConfigs(): Promise<Task032ApprovedSchoolCanaryConfig[]> {
    return [...this.approvedSchoolCanaryConfigStore.values()];
  }

  async recordCohortEligibility(result: Task032CanaryCohortEligibilityResult): Promise<void> {
    this.cohortEligibilityStore.push(result);
  }

  async listCohortEligibilityResults(): Promise<Task032CanaryCohortEligibilityResult[]> {
    return [...this.cohortEligibilityStore];
  }

  async recordConsentAuthorization(result: Task032ConsentAuthorizationReadinessResult): Promise<void> {
    this.consentAuthorizationStore.push(result);
  }

  async listConsentAuthorizationResults(): Promise<Task032ConsentAuthorizationReadinessResult[]> {
    return [...this.consentAuthorizationStore];
  }

  async recordPrivacyBoundary(result: Task032LiveStudentPrivacyBoundaryResult): Promise<void> {
    this.privacyBoundaryStore.push(result);
  }

  async listPrivacyBoundaryResults(): Promise<Task032LiveStudentPrivacyBoundaryResult[]> {
    return [...this.privacyBoundaryStore];
  }

  async recordRuntimeGuard(result: Task032CanaryRuntimeGuardResult): Promise<void> {
    this.runtimeGuardStore.push(result);
  }

  async listRuntimeGuardResults(): Promise<Task032CanaryRuntimeGuardResult[]> {
    return [...this.runtimeGuardStore];
  }

  async createActivationRecord(record: Task032CanaryActivationRecord): Promise<void> {
    this.activationRecordStore.set(record.activationId, record);
  }

  async getActivationRecord(activationId: string): Promise<Task032CanaryActivationRecord | null> {
    return this.activationRecordStore.get(activationId) ?? null;
  }

  async updateActivationRecord(activationId: string, patch: Partial<Task032CanaryActivationRecord>): Promise<void> {
    const existing = this.activationRecordStore.get(activationId);
    if (existing) {
      this.activationRecordStore.set(activationId, { ...existing, ...patch });
    }
  }

  async listActivationRecords(): Promise<Task032CanaryActivationRecord[]> {
    return [...this.activationRecordStore.values()];
  }

  async recordControlAction(result: Task032CanaryControlActionResult): Promise<void> {
    this.controlActionStore.push(result);
  }

  async listControlActions(activationId: string): Promise<Task032CanaryControlActionResult[]> {
    return this.controlActionStore.filter(a => a.action === activationId || true);
  }

  async recordHealthBudget(result: Task032CanaryHealthBudgetResult): Promise<void> {
    this.healthBudgetStore.push(result);
  }

  async listHealthBudgetResults(): Promise<Task032CanaryHealthBudgetResult[]> {
    return [...this.healthBudgetStore];
  }

  async recordIncidentBridge(result: Task032CanaryIncidentBridgeResult): Promise<void> {
    this.incidentBridgeStore.push(result);
  }

  async listIncidentBridgeResults(): Promise<Task032CanaryIncidentBridgeResult[]> {
    return [...this.incidentBridgeStore];
  }

  async recordSafeView(view: Task032CanarySafeView): Promise<void> {
    this.safeViewStore.set(view.viewId, view);
  }

  async getSafeView(viewId: string): Promise<Task032CanarySafeView | null> {
    return this.safeViewStore.get(viewId) ?? null;
  }

  async listSafeViews(): Promise<Task032CanarySafeView[]> {
    return [...this.safeViewStore.values()];
  }

  async recordEvidenceEvent(event: Task032CanaryEvidenceEvent): Promise<void> {
    this.evidenceEventStore.push(event);
  }

  async listEvidenceEvents(activationId: string): Promise<Task032CanaryEvidenceEvent[]> {
    return this.evidenceEventStore.filter(e => e.activationId === activationId);
  }

  async recordDiagnostics(result: Task032CanaryDiagnosticsResult): Promise<void> {
    this.diagnosticsStore.push(result);
  }

  async listDiagnostics(): Promise<Task032CanaryDiagnosticsResult[]> {
    return [...this.diagnosticsStore];
  }

  async recordReport(report: Task032ControlledCanaryActivationReport): Promise<void> {
    this.reportStore.push(report);
  }

  async listReports(): Promise<Task032ControlledCanaryActivationReport[]> {
    return [...this.reportStore];
  }

  async getLatestReport(): Promise<Task032ControlledCanaryActivationReport | null> {
    if (this.reportStore.length === 0) return null;
    return this.reportStore[this.reportStore.length - 1];
  }

  async clearTask032StoresForTests(): Promise<void> {
    this.task031ProofStore = null;
    this.environmentGateStore = [];
    this.approvedSchoolCanaryConfigStore = new Map();
    this.cohortEligibilityStore = [];
    this.consentAuthorizationStore = [];
    this.privacyBoundaryStore = [];
    this.runtimeGuardStore = [];
    this.activationRecordStore = new Map();
    this.controlActionStore = [];
    this.healthBudgetStore = [];
    this.incidentBridgeStore = [];
    this.safeViewStore = new Map();
    this.evidenceEventStore = [];
    this.diagnosticsStore = [];
    this.reportStore = [];
  }
}

export const task032ControlledCanaryActivationRepository = new Task032ControlledCanaryActivationRepository();
