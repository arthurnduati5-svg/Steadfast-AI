import {
  Task029OperationsDashboard,
  Task029OperationsPermissionResult,
  Task029ControlActionPreflightResult,
  Task029ControlActionResult,
  Task029LearnerOwnStatus,
  Task029InterventionQueueOperationsSummary,
  Task029IncidentOperationsSummary,
  Task029RollbackCommandResult,
  Task029SafeAuditTimeline,
  Task029EvidenceSummary,
  Task029CompletionReviewSummary,
  Task029OperationsDiagnostics,
  Task029OperationsReport,
} from '../contracts/task029ExpansionOperationsContracts';

export class Task029ExpansionOperationsRepository {
  private dashboards = new Map<string, Task029OperationsDashboard>();
  private permissionDecisions = new Map<string, Task029OperationsPermissionResult[]>();
  private controlActionPreflights = new Map<string, Task029ControlActionPreflightResult[]>();
  private controlActionResults = new Map<string, Task029ControlActionResult[]>();
  private learnerOwnStatusViews = new Map<string, Task029LearnerOwnStatus[]>();
  private interventionOperationsViews = new Map<string, Task029InterventionQueueOperationsSummary[]>();
  private incidentOperationsViews = new Map<string, Task029IncidentOperationsSummary[]>();
  private rollbackCommandResults = new Map<string, Task029RollbackCommandResult[]>();
  private auditTimelineViews = new Map<string, Task029SafeAuditTimeline[]>();
  private evidenceSummaryViews = new Map<string, Task029EvidenceSummary[]>();
  private completionReviewSummaryViews = new Map<string, Task029CompletionReviewSummary[]>();
  private operationsDiagnostics = new Map<string, Task029OperationsDiagnostics[]>();
  private operationsReports: Task029OperationsReport[] = [];
  private operationsAuditEvents: { schoolId: string; actorId: string; actorRole: string; eventType: string; safeSummary: string; }[] = [];

  async recordOperationsDashboardSnapshot(snapshot: Task029OperationsDashboard): Promise<void> {
    this.dashboards.set(snapshot.schoolId, snapshot);
  }

  async getLatestOperationsDashboardSnapshot(schoolId: string): Promise<Task029OperationsDashboard | null> {
    return this.dashboards.get(schoolId) ?? null;
  }

  async recordPermissionDecision(decision: Task029OperationsPermissionResult): Promise<void> {
    const key = decision.role;
    const existing = this.permissionDecisions.get(key) ?? [];
    existing.push(decision);
    this.permissionDecisions.set(key, existing);
  }

  async listPermissionDecisions(schoolId: string): Promise<Task029OperationsPermissionResult[]> {
    const results: Task029OperationsPermissionResult[] = [];
    for (const decisions of this.permissionDecisions.values()) {
      for (const d of decisions) {
        if (d.permissions.length > 0 || d.role) {
          results.push(d);
        }
      }
    }
    return results;
  }

  async recordControlActionPreflight(preflight: Task029ControlActionPreflightResult): Promise<void> {
    const key = `${preflight.action}_${Date.now()}`;
    const existing = this.controlActionPreflights.get(key) ?? [];
    existing.push(preflight);
    this.controlActionPreflights.set(key, existing);
  }

  async listControlActionPreflights(schoolId: string, expansionRunId: string): Promise<Task029ControlActionPreflightResult[]> {
    const results: Task029ControlActionPreflightResult[] = [];
    for (const preflights of this.controlActionPreflights.values()) {
      for (const p of preflights) {
        if (p.action || p.ok !== undefined) {
          results.push(p);
        }
      }
    }
    return results;
  }

  async recordControlActionResult(result: Task029ControlActionResult): Promise<void> {
    const key = `${result.action}_${Date.now()}`;
    const existing = this.controlActionResults.get(key) ?? [];
    existing.push(result);
    this.controlActionResults.set(key, existing);
  }

  async listControlActionResults(schoolId: string, expansionRunId: string): Promise<Task029ControlActionResult[]> {
    const results: Task029ControlActionResult[] = [];
    for (const actionResults of this.controlActionResults.values()) {
      for (const r of actionResults) {
        if (r.action || r.ok !== undefined) {
          results.push(r);
        }
      }
    }
    return results;
  }

  async recordLearnerOwnStatusView(view: Task029LearnerOwnStatus): Promise<void> {
    const key = view.learnerSafeRef;
    const existing = this.learnerOwnStatusViews.get(key) ?? [];
    existing.push(view);
    this.learnerOwnStatusViews.set(key, existing);
  }

  async listLearnerOwnStatusViews(learnerSafeRef: string): Promise<Task029LearnerOwnStatus[]> {
    return this.learnerOwnStatusViews.get(learnerSafeRef) ?? [];
  }

  async recordInterventionOperationsView(view: Task029InterventionQueueOperationsSummary): Promise<void> {
    const key = `${view.queueItemId}_${Date.now()}`;
    const existing = this.interventionOperationsViews.get(key) ?? [];
    existing.push(view);
    this.interventionOperationsViews.set(key, existing);
  }

  async listInterventionOperationsViews(schoolId: string, expansionRunId: string): Promise<Task029InterventionQueueOperationsSummary[]> {
    const results: Task029InterventionQueueOperationsSummary[] = [];
    for (const views of this.interventionOperationsViews.values()) {
      for (const v of views) {
        if (v.queueItemId || v.reasonCode) {
          results.push(v);
        }
      }
    }
    return results;
  }

  async recordIncidentOperationsView(view: Task029IncidentOperationsSummary): Promise<void> {
    const key = `${view.incidentId}_${Date.now()}`;
    const existing = this.incidentOperationsViews.get(key) ?? [];
    existing.push(view);
    this.incidentOperationsViews.set(key, existing);
  }

  async listIncidentOperationsViews(schoolId: string, expansionRunId: string): Promise<Task029IncidentOperationsSummary[]> {
    const results: Task029IncidentOperationsSummary[] = [];
    for (const views of this.incidentOperationsViews.values()) {
      for (const v of views) {
        if (v.incidentId || v.severity) {
          results.push(v);
        }
      }
    }
    return results;
  }

  async recordRollbackCommandResult(result: Task029RollbackCommandResult): Promise<void> {
    const key = result.rollbackId;
    const existing = this.rollbackCommandResults.get(key) ?? [];
    existing.push(result);
    this.rollbackCommandResults.set(key, existing);
  }

  async listRollbackCommandResults(expansionRunId: string): Promise<Task029RollbackCommandResult[]> {
    const results: Task029RollbackCommandResult[] = [];
    for (const rollbacks of this.rollbackCommandResults.values()) {
      for (const r of rollbacks) {
        if (r.rollbackId || r.ok !== undefined) {
          results.push(r);
        }
      }
    }
    return results;
  }

  async recordAuditTimelineView(view: Task029SafeAuditTimeline): Promise<void> {
    const key = view.expansionRunId;
    const existing = this.auditTimelineViews.get(key) ?? [];
    existing.push(view);
    this.auditTimelineViews.set(key, existing);
  }

  async listAuditTimelineViews(expansionRunId: string): Promise<Task029SafeAuditTimeline[]> {
    return this.auditTimelineViews.get(expansionRunId) ?? [];
  }

  async recordEvidenceSummaryView(view: Task029EvidenceSummary): Promise<void> {
    const key = view.evidenceEventCount.toString() + view.safeLatestEventAt;
    const existing = this.evidenceSummaryViews.get(key) ?? [];
    existing.push(view);
    this.evidenceSummaryViews.set(key, existing);
  }

  async listEvidenceSummaryViews(expansionRunId: string): Promise<Task029EvidenceSummary[]> {
    const results: Task029EvidenceSummary[] = [];
    for (const views of this.evidenceSummaryViews.values()) {
      for (const v of views) {
        if (v.evidenceEventCount >= 0 || v.safeEvidenceCategories) {
          results.push(v);
        }
      }
    }
    return results;
  }

  async recordCompletionReviewSummaryView(view: Task029CompletionReviewSummary): Promise<void> {
    const key = view.safeSummary.slice(0, 40) + Date.now();
    const existing = this.completionReviewSummaryViews.get(key) ?? [];
    existing.push(view);
    this.completionReviewSummaryViews.set(key, existing);
  }

  async listCompletionReviewSummaryViews(expansionRunId: string): Promise<Task029CompletionReviewSummary[]> {
    const results: Task029CompletionReviewSummary[] = [];
    for (const views of this.completionReviewSummaryViews.values()) {
      for (const v of views) {
        if (v.safeToStartTask029 !== undefined || v.safeSummary) {
          results.push(v);
        }
      }
    }
    return results;
  }

  async recordOperationsDiagnostics(diag: Task029OperationsDiagnostics): Promise<void> {
    const key = diag.task028ProofStatus + Date.now();
    const existing = this.operationsDiagnostics.get(key) ?? [];
    existing.push(diag);
    this.operationsDiagnostics.set(key, existing);
  }

  async listOperationsDiagnostics(schoolId: string): Promise<Task029OperationsDiagnostics[]> {
    const results: Task029OperationsDiagnostics[] = [];
    for (const diags of this.operationsDiagnostics.values()) {
      for (const d of diags) {
        if (d.task028ProofStatus || d.routeMountStatus) {
          results.push(d);
        }
      }
    }
    return results;
  }

  async recordOperationsReport(report: Task029OperationsReport): Promise<void> {
    this.operationsReports.push(report);
  }

  async listOperationsReports(): Promise<Task029OperationsReport[]> {
    return [...this.operationsReports];
  }

  async recordOperationsAuditEvent(event: { schoolId: string; actorId: string; actorRole: string; eventType: string; safeSummary: string; }): Promise<void> {
    this.operationsAuditEvents.push(event);
  }

  async listOperationsAuditEvents(schoolId: string): Promise<any[]> {
    return this.operationsAuditEvents.filter(e => e.schoolId === schoolId);
  }

  async clearTask029StoresForTests(): Promise<void> {
    this.dashboards.clear();
    this.permissionDecisions.clear();
    this.controlActionPreflights.clear();
    this.controlActionResults.clear();
    this.learnerOwnStatusViews.clear();
    this.interventionOperationsViews.clear();
    this.incidentOperationsViews.clear();
    this.rollbackCommandResults.clear();
    this.auditTimelineViews.clear();
    this.evidenceSummaryViews.clear();
    this.completionReviewSummaryViews.clear();
    this.operationsDiagnostics.clear();
    this.operationsReports = [];
    this.operationsAuditEvents = [];
  }
}

export const task029ExpansionOperationsRepository = new Task029ExpansionOperationsRepository();
