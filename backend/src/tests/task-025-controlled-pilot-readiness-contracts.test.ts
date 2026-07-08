import { describe, it, expect } from 'vitest';

import {
  TASK025_PILOT_READINESS_ACTOR_ROLES,
  TASK025_PILOT_READINESS_DECISIONS,
  TASK025_PILOT_READINESS_STATUSES,
  TASK025_PILOT_SCOPE_STATUSES,
  TASK025_COHORT_READINESS_STATUSES,
  TASK025_STAKEHOLDER_READINESS_STATUSES,
  TASK025_TEACHER_WORKFLOW_STATUSES,
  TASK025_ADMIN_ACCEPTANCE_STATUSES,
  TASK025_PARENT_COMMUNICATION_STATUSES,
  TASK025_SAFEGUARDING_READINESS_STATUSES,
  TASK025_MONITORING_READINESS_STATUSES,
  TASK025_PAUSE_ROLLBACK_STATUSES,
  TASK025_RISK_LEVELS,
  TASK025_BLOCKER_TYPES,
  TASK025_AUDIT_EVENTS,
  TASK025_FORBIDDEN_FIELDS,
} from '../contracts/task025ControlledPilotReadinessContracts';

import type {
  Task025PilotReadinessActorRole,
  Task025PilotReadinessDecision,
  Task025PilotReadinessStatus,
  Task025PilotScopeStatus,
  Task025CohortReadinessStatus,
  Task025StakeholderReadinessStatus,
  Task025TeacherWorkflowStatus,
  Task025AdminAcceptanceStatus,
  Task025ParentCommunicationStatus,
  Task025SafeguardingReadinessStatus,
  Task025MonitoringReadinessStatus,
  Task025PauseRollbackStatus,
  Task025RiskLevel,
  Task025BlockerType,
  Task025AuditEvent,
  Task025ForbiddenField,
  Task025PilotReadinessContext,
  Task025PilotScopeInput,
  Task025PilotScopeAssessment,
  Task025CandidateCohortInput,
  Task025CandidateCohortReadiness,
  Task025StakeholderReadinessInput,
  Task025TeacherWorkflowValidation,
  Task025AdminAcceptanceReadiness,
  Task025ParentCommunicationReadiness,
  Task025SafeguardingEscalationReadiness,
  Task025SupportOperationsReadiness,
  Task025MonitoringGateReadiness,
  Task025PauseRollbackReadiness,
  Task025DataPrivacyReadiness,
  Task025ReadinessBlocker,
  Task025ReadinessDecision,
  Task025ReadinessDiagnostics,
  Task025ReadinessAuditEvent,
  Task025SafeReadinessReport,
} from '../contracts/task025ControlledPilotReadinessContracts';

describe('TASK025_PILOT_READINESS_ACTOR_ROLES', () => {
  it('should have exactly 4 roles', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toHaveLength(4);
  });

  it('should contain school_admin', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('school_admin');
  });

  it('should contain system_admin', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('system_admin');
  });

  it('should contain internal_operator', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('internal_operator');
  });

  it('should contain authorized_pilot_coordinator', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toContain('authorized_pilot_coordinator');
  });

  it('should not contain unexpected roles', () => {
    expect(TASK025_PILOT_READINESS_ACTOR_ROLES).toEqual([
      'school_admin',
      'system_admin',
      'internal_operator',
      'authorized_pilot_coordinator',
    ]);
  });
});

describe('TASK025_PILOT_READINESS_DECISIONS', () => {
  it('should have exactly 3 decisions', () => {
    expect(TASK025_PILOT_READINESS_DECISIONS).toHaveLength(3);
  });

  it('should contain ready_to_start_task026', () => {
    expect(TASK025_PILOT_READINESS_DECISIONS).toContain('ready_to_start_task026');
  });

  it('should contain not_ready', () => {
    expect(TASK025_PILOT_READINESS_DECISIONS).toContain('not_ready');
  });

  it('should contain manual_review_required', () => {
    expect(TASK025_PILOT_READINESS_DECISIONS).toContain('manual_review_required');
  });
});

describe('TASK025_PILOT_READINESS_STATUSES', () => {
  it('should have exactly 5 statuses', () => {
    expect(TASK025_PILOT_READINESS_STATUSES).toHaveLength(5);
  });

  it('should contain pending, in_review, ready, not_ready, blocked', () => {
    expect(TASK025_PILOT_READINESS_STATUSES).toEqual([
      'pending',
      'in_review',
      'ready',
      'not_ready',
      'blocked',
    ]);
  });
});

describe('TASK025_PILOT_SCOPE_STATUSES', () => {
  it('should have exactly 4 scope statuses', () => {
    expect(TASK025_PILOT_SCOPE_STATUSES).toHaveLength(4);
  });

  it('should contain scope_defined, scope_approved, scope_blocked, scope_pending_review', () => {
    expect(TASK025_PILOT_SCOPE_STATUSES).toEqual([
      'scope_defined',
      'scope_approved',
      'scope_blocked',
      'scope_pending_review',
    ]);
  });
});

describe('TASK025_COHORT_READINESS_STATUSES', () => {
  it('should have exactly 4 cohort statuses', () => {
    expect(TASK025_COHORT_READINESS_STATUSES).toHaveLength(4);
  });

  it('should contain cohort_pending, cohort_ready, cohort_blocked, cohort_manual_review', () => {
    expect(TASK025_COHORT_READINESS_STATUSES).toEqual([
      'cohort_pending',
      'cohort_ready',
      'cohort_blocked',
      'cohort_manual_review',
    ]);
  });
});

describe('TASK025_STAKEHOLDER_READINESS_STATUSES', () => {
  it('should have exactly 3 stakeholder statuses', () => {
    expect(TASK025_STAKEHOLDER_READINESS_STATUSES).toHaveLength(3);
  });

  it('should contain stakeholder_pending, stakeholder_ready, stakeholder_blocked', () => {
    expect(TASK025_STAKEHOLDER_READINESS_STATUSES).toEqual([
      'stakeholder_pending',
      'stakeholder_ready',
      'stakeholder_blocked',
    ]);
  });
});

describe('TASK025_TEACHER_WORKFLOW_STATUSES', () => {
  it('should have exactly 3 teacher workflow statuses', () => {
    expect(TASK025_TEACHER_WORKFLOW_STATUSES).toHaveLength(3);
  });

  it('should contain teacher_workflow_pending, teacher_workflow_validated, teacher_workflow_blocked', () => {
    expect(TASK025_TEACHER_WORKFLOW_STATUSES).toEqual([
      'teacher_workflow_pending',
      'teacher_workflow_validated',
      'teacher_workflow_blocked',
    ]);
  });
});

describe('TASK025_ADMIN_ACCEPTANCE_STATUSES', () => {
  it('should have exactly 3 admin acceptance statuses', () => {
    expect(TASK025_ADMIN_ACCEPTANCE_STATUSES).toHaveLength(3);
  });

  it('should contain admin_acceptance_pending, admin_acceptance_confirmed, admin_acceptance_blocked', () => {
    expect(TASK025_ADMIN_ACCEPTANCE_STATUSES).toEqual([
      'admin_acceptance_pending',
      'admin_acceptance_confirmed',
      'admin_acceptance_blocked',
    ]);
  });
});

describe('TASK025_PARENT_COMMUNICATION_STATUSES', () => {
  it('should have exactly 3 parent communication statuses', () => {
    expect(TASK025_PARENT_COMMUNICATION_STATUSES).toHaveLength(3);
  });

  it('should contain parent_communication_pending, parent_communication_ready, parent_communication_blocked', () => {
    expect(TASK025_PARENT_COMMUNICATION_STATUSES).toEqual([
      'parent_communication_pending',
      'parent_communication_ready',
      'parent_communication_blocked',
    ]);
  });
});

describe('TASK025_SAFEGUARDING_READINESS_STATUSES', () => {
  it('should have exactly 3 safeguarding statuses', () => {
    expect(TASK025_SAFEGUARDING_READINESS_STATUSES).toHaveLength(3);
  });

  it('should contain safeguarding_pending, safeguarding_ready, safeguarding_blocked', () => {
    expect(TASK025_SAFEGUARDING_READINESS_STATUSES).toEqual([
      'safeguarding_pending',
      'safeguarding_ready',
      'safeguarding_blocked',
    ]);
  });
});

describe('TASK025_MONITORING_READINESS_STATUSES', () => {
  it('should have exactly 3 monitoring statuses', () => {
    expect(TASK025_MONITORING_READINESS_STATUSES).toHaveLength(3);
  });

  it('should contain monitoring_pending, monitoring_ready, monitoring_blocked', () => {
    expect(TASK025_MONITORING_READINESS_STATUSES).toEqual([
      'monitoring_pending',
      'monitoring_ready',
      'monitoring_blocked',
    ]);
  });
});

describe('TASK025_PAUSE_ROLLBACK_STATUSES', () => {
  it('should have exactly 3 pause/rollback statuses', () => {
    expect(TASK025_PAUSE_ROLLBACK_STATUSES).toHaveLength(3);
  });

  it('should contain pause_rollback_pending, pause_rollback_ready, pause_rollback_blocked', () => {
    expect(TASK025_PAUSE_ROLLBACK_STATUSES).toEqual([
      'pause_rollback_pending',
      'pause_rollback_ready',
      'pause_rollback_blocked',
    ]);
  });
});

describe('TASK025_RISK_LEVELS', () => {
  it('should have exactly 4 risk levels', () => {
    expect(TASK025_RISK_LEVELS).toHaveLength(4);
  });

  it('should contain low, medium, high, critical', () => {
    expect(TASK025_RISK_LEVELS).toEqual(['low', 'medium', 'high', 'critical']);
  });
});

describe('TASK025_BLOCKER_TYPES', () => {
  it('should have exactly 15 blocker types', () => {
    expect(TASK025_BLOCKER_TYPES).toHaveLength(15);
  });

  it('should contain all expected blocker types', () => {
    expect(TASK025_BLOCKER_TYPES).toEqual([
      'school_identity',
      'pilot_scope',
      'cohort_readiness',
      'teacher_workflow',
      'admin_acceptance',
      'parent_communication',
      'safeguarding_escalation',
      'support_operations',
      'monitoring_gate',
      'pause_rollback',
      'data_privacy',
      'governance_continuity',
      'content_governance',
      'deployment_readiness',
      'operations_readiness',
    ]);
  });
});

describe('TASK025_AUDIT_EVENTS', () => {
  it('should have exactly 15 audit events', () => {
    expect(TASK025_AUDIT_EVENTS).toHaveLength(15);
  });

  it('should contain all expected audit events', () => {
    expect(TASK025_AUDIT_EVENTS).toEqual([
      'readiness_check_run',
      'scope_evaluated',
      'cohort_readiness_checked',
      'teacher_workflow_validated',
      'admin_acceptance_checked',
      'parent_communication_checked',
      'safeguarding_escalation_checked',
      'support_operations_checked',
      'monitoring_gate_checked',
      'pause_rollback_checked',
      'data_privacy_checked',
      'decision_evaluated',
      'report_generated',
      'diagnostics_viewed',
      'audit_viewed',
    ]);
  });
});

describe('TASK025_FORBIDDEN_FIELDS', () => {
  it('should have exactly 34 forbidden fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toHaveLength(34);
  });

  it('should include raw student data fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'rawStudentData',
        'rawLearnerData',
        'rawParentData',
        'rawTeacherData',
      ]),
    );
  });

  it('should include safeguarding raw fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'rawSafeguardingNote',
        'rawSafeguardingCase',
        'safeguardingRaw',
      ]),
    );
  });

  it('should include deen sensitive fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'privateDeenText',
        'deenSensitiveRaw',
      ]),
    );
  });

  it('should include raw chat and message fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'rawChat',
        'rawMessage',
        'rawStudentAnswer',
        'rawStudentWork',
      ]),
    );
  });

  it('should include answer-related fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'answerKey',
        'correctAnswer',
        'modelAnswer',
        'markingScheme',
      ]),
    );
  });

  it('should include teacher-only content fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'teacherOnlyContent',
        'teacherOnlyNote',
      ]),
    );
  });

  it('should include provider and reasoning fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'providerPrompt',
        'providerResponse',
        'rawProviderResponse',
        'chainOfThought',
        'hiddenReasoning',
        'scratchpad',
      ]),
    );
  });

  it('should include raw notification and contact fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'rawNotificationPayload',
        'rawEmailBody',
        'rawSmsBody',
        'parentPhone',
        'parentEmail',
        'studentPhone',
        'studentEmail',
      ]),
    );
  });

  it('should include live activation and invitation fields', () => {
    expect(TASK025_FORBIDDEN_FIELDS).toEqual(
      expect.arrayContaining([
        'livePilotActivation',
        'liveInvitationSend',
      ]),
    );
  });
});

describe('Interface type structure checks', () => {
  it('Task025PilotReadinessContext has correct required fields', () => {
    const ctx: Task025PilotReadinessContext = {
      schoolId: 'school-1',
      actorId: 'user-1',
      actorRole: 'school_admin',
      requestId: 'req-1',
      verifiedSchoolIdentity: true,
      timestamp: '2026-07-08T00:00:00Z',
    };
    expect(ctx.schoolId).toBe('school-1');
    expect(ctx.actorRole).toBe('school_admin');
    expect(ctx.verifiedSchoolIdentity).toBe(true);
    expect(ctx.timestamp).toBe('2026-07-08T00:00:00Z');
  });

  it('Task025PilotScopeInput includes all expected governance readiness fields', () => {
    const input: Task025PilotScopeInput = {
      schoolId: 'school-1',
      pilotPurpose: 'Test pilot',
      cohortSize: 50,
      pilotDurationWeeks: 12,
      teacherCoverageAvailable: true,
      adminOwner: 'admin-1',
      supportOwner: 'support-1',
      monitoringOwner: 'monitor-1',
      pauseOwner: 'pause-1',
      rollbackOwner: 'rollback-1',
      safeguardingEscalationPathDefined: true,
      parentCommunicationMaterialPrepared: true,
      deenSourceReferralPathDefined: true,
      curriculumSourceGovernanceReady: true,
      privacyGovernanceReady: true,
      operationsMonitoringReady: true,
    };
    expect(input.cohortSize).toBeGreaterThan(0);
    expect(input.pilotDurationWeeks).toBeGreaterThanOrEqual(1);
    expect(input.safeguardingEscalationPathDefined).toBe(true);
    expect(input.privacyGovernanceReady).toBe(true);
  });

  it('Task025PilotScopeAssessment uses correct status and risk types', () => {
    const assessment: Task025PilotScopeAssessment = {
      scopeStatus: 'scope_approved',
      riskLevel: 'medium',
      safeSummary: 'Scope approved with medium risk',
      safeBlockers: [],
      task026SafeToStart: true,
    };
    expect(TASK025_PILOT_SCOPE_STATUSES).toContain(assessment.scopeStatus);
    expect(TASK025_RISK_LEVELS).toContain(assessment.riskLevel);
    expect(assessment.task026SafeToStart).toBe(true);
    expect(assessment.safeBlockers).toHaveLength(0);
  });

  it('Task025CandidateCohortReadiness has readiness score between 0 and 1', () => {
    const readiness: Task025CandidateCohortReadiness = {
      cohortStatus: 'cohort_ready',
      recommendedCohortType: 'standard',
      readinessScore: 0.85,
      riskLevel: 'low',
      safeSummary: 'Cohort is ready',
      safeBlockers: [],
      manualReviewRequired: false,
    };
    expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
    expect(readiness.readinessScore).toBeLessThanOrEqual(1);
    expect(TASK025_COHORT_READINESS_STATUSES).toContain(readiness.cohortStatus);
    expect(typeof readiness.manualReviewRequired).toBe('boolean');
  });

  it('Task025TeacherWorkflowValidation tracks teacher counts', () => {
    const validation: Task025TeacherWorkflowValidation = {
      teacherWorkflowStatus: 'teacher_workflow_validated',
      safeSummary: 'All teachers validated',
      safeBlockers: [],
      teacherCount: 10,
      validatedTeachers: 10,
    };
    expect(validation.validatedTeachers).toBeLessThanOrEqual(validation.teacherCount);
    expect(TASK025_TEACHER_WORKFLOW_STATUSES).toContain(validation.teacherWorkflowStatus);
  });

  it('Task025AdminAcceptanceReadiness has required admin fields', () => {
    const acceptance: Task025AdminAcceptanceReadiness = {
      adminAcceptanceStatus: 'admin_acceptance_confirmed',
      safeSummary: 'Admin confirmed',
      safeBlockers: [],
      adminOwner: 'admin-1',
      approvalNotes: 'Approved for pilot',
    };
    expect(TASK025_ADMIN_ACCEPTANCE_STATUSES).toContain(acceptance.adminAcceptanceStatus);
    expect(typeof acceptance.adminOwner).toBe('string');
    expect(typeof acceptance.approvalNotes).toBe('string');
  });

  it('Task025ParentCommunicationReadiness includes privacy and opt-out flags', () => {
    const comms: Task025ParentCommunicationReadiness = {
      parentCommunicationStatus: 'parent_communication_ready',
      safeSummary: 'Parent materials ready',
      safeBlockers: [],
      templatesReady: true,
      privacySummaryIncluded: true,
      optOutPathDefined: true,
    };
    expect(TASK025_PARENT_COMMUNICATION_STATUSES).toContain(comms.parentCommunicationStatus);
    expect(comms.templatesReady).toBe(true);
    expect(comms.optOutPathDefined).toBe(true);
  });

  it('Task025SafeguardingEscalationReadiness includes safeguarding gates', () => {
    const saf: Task025SafeguardingEscalationReadiness = {
      safeguardingStatus: 'safeguarding_ready',
      safeSummary: 'Safeguarding ready',
      safeBlockers: [],
      safeguardingOwnerExists: true,
      escalationRouteDefined: true,
      humanReviewPathExists: true,
    };
    expect(TASK025_SAFEGUARDING_READINESS_STATUSES).toContain(saf.safeguardingStatus);
    expect(saf.escalationRouteDefined).toBe(true);
    expect(saf.humanReviewPathExists).toBe(true);
  });

  it('Task025SupportOperationsReadiness ensures support owners assigned', () => {
    const support: Task025SupportOperationsReadiness = {
      supportStatus: 'stakeholder_ready',
      safeSummary: 'Support ready',
      safeBlockers: [],
      supportOwnerAssigned: true,
      incidentOwnerAssigned: true,
    };
    expect(TASK025_STAKEHOLDER_READINESS_STATUSES).toContain(support.supportStatus);
    expect(support.supportOwnerAssigned).toBe(true);
    expect(support.incidentOwnerAssigned).toBe(true);
  });

  it('Task025MonitoringGateReadiness includes drill and signal paths', () => {
    const mon: Task025MonitoringGateReadiness = {
      monitoringStatus: 'monitoring_ready',
      safeSummary: 'Monitoring ready',
      safeBlockers: [],
      task024MonitoringReady: true,
      incidentDrillAvailable: true,
      backupRestoreDrillAvailable: true,
      pauseSignalPathDefined: true,
      rollbackSignalPathDefined: true,
    };
    expect(TASK025_MONITORING_READINESS_STATUSES).toContain(mon.monitoringStatus);
    expect(mon.incidentDrillAvailable).toBe(true);
    expect(mon.pauseSignalPathDefined).toBe(true);
  });

  it('Task025PauseRollbackReadiness requires pause and rollback owners', () => {
    const pr: Task025PauseRollbackReadiness = {
      pauseRollbackStatus: 'pause_rollback_ready',
      safeSummary: 'Pause/rollback ready',
      safeBlockers: [],
      pauseOwnerExists: true,
      rollbackOwnerExists: true,
      pauseCriteriaDefined: true,
      rollbackCriteriaDefined: true,
      incidentSeverityMappingExists: true,
    };
    expect(TASK025_PAUSE_ROLLBACK_STATUSES).toContain(pr.pauseRollbackStatus);
    expect(pr.pauseOwnerExists).toBe(true);
    expect(pr.rollbackOwnerExists).toBe(true);
    expect(pr.incidentSeverityMappingExists).toBe(true);
  });

  it('Task025DataPrivacyReadiness ensures privacy foundations not bypassed', () => {
    const privacy: Task025DataPrivacyReadiness = {
      privacyStatus: 'stakeholder_ready',
      safeSummary: 'Privacy ready',
      safeBlockers: [],
      dataClassificationApplied: true,
      roleMatrixApplied: true,
      retentionExportDeleteFoundationNotBypassed: true,
      aiEgressGuardNotBypassed: true,
    };
    expect(TASK025_STAKEHOLDER_READINESS_STATUSES).toContain(privacy.privacyStatus);
    expect(privacy.dataClassificationApplied).toBe(true);
    expect(privacy.retentionExportDeleteFoundationNotBypassed).toBe(true);
    expect(privacy.aiEgressGuardNotBypassed).toBe(true);
  });

  it('Task025ReadinessBlocker uses valid severity values', () => {
    const blocker: Task025ReadinessBlocker = {
      type: 'school_identity',
      severity: 'high',
      safeDescription: 'School identity not verified',
      requiredAction: 'Verify school identity',
    };
    expect(TASK025_BLOCKER_TYPES).toContain(blocker.type);
    expect(['high', 'medium', 'low']).toContain(blocker.severity);
    expect(typeof blocker.safeDescription).toBe('string');
    expect(typeof blocker.requiredAction).toBe('string');
  });

  it('Task025ReadinessDecision references valid decision enum values', () => {
    const decision: Task025ReadinessDecision = {
      decision: 'ready_to_start_task026',
      riskLevel: 'low',
      safeSummary: 'Ready to proceed',
      safeBlockers: [],
      requiredActions: [],
      task026SafeToStart: true,
      createdAt: '2026-07-08T00:00:00Z',
      auditRef: 'audit-1',
    };
    expect(TASK025_PILOT_READINESS_DECISIONS).toContain(decision.decision);
    expect(TASK025_RISK_LEVELS).toContain(decision.riskLevel);
    expect(decision.task026SafeToStart).toBe(true);
  });

  it('Task025ReadinessDiagnostics captures all gate statuses', () => {
    const diagnostics: Task025ReadinessDiagnostics = {
      schoolId: 'school-1',
      schoolVerified: true,
      scopeGatePassed: true,
      cohortReadinessPassed: true,
      teacherWorkflowPassed: true,
      adminAcceptancePassed: true,
      parentCommunicationPassed: true,
      safeguardingPassed: true,
      supportOperationsPassed: true,
      monitoringGatePassed: true,
      pauseRollbackPassed: true,
      dataPrivacyPassed: true,
      task020ContinuityPassed: true,
      task021ContinuityPassed: true,
      task022ContinuityPassed: true,
      task023ContinuityPassed: true,
      task024ContinuityPassed: true,
      overallDecision: 'ready_to_start_task026',
      blockingBlockerCount: 0,
      warningCount: 2,
      safeSummary: 'All gates passed',
    };
    expect(TASK025_PILOT_READINESS_DECISIONS).toContain(diagnostics.overallDecision);
    expect(diagnostics.blockingBlockerCount).toBeGreaterThanOrEqual(0);
    expect(diagnostics.warningCount).toBeGreaterThanOrEqual(0);
    expect(diagnostics.scopeGatePassed).toBe(true);
    expect(diagnostics.safeguardingPassed).toBe(true);
    expect(diagnostics.dataPrivacyPassed).toBe(true);
  });

  it('Task025ReadinessAuditEvent ensures valid event type', () => {
    const event: Task025ReadinessAuditEvent = {
      id: 'event-1',
      schoolId: 'school-1',
      actorRole: 'school_admin',
      eventType: 'readiness_check_run',
      safeSummary: 'Readiness check performed',
      createdAt: '2026-07-08T00:00:00Z',
      requestId: 'req-1',
    };
    expect(TASK025_AUDIT_EVENTS).toContain(event.eventType);
    expect(typeof event.safeSummary).toBe('string');
    expect(event.requestId).toBeTruthy();
  });

  it('Task025SafeReadinessReport includes task026SafeToStart flag', () => {
    const report: Task025SafeReadinessReport = {
      taskId: 'task025',
      reportGeneratedAt: '2026-07-08T00:00:00Z',
      schoolId: 'school-1',
      schoolVerified: true,
      scopeGateStatus: 'scope_approved',
      cohortReadinessStatus: 'cohort_ready',
      teacherWorkflowStatus: 'teacher_workflow_validated',
      adminAcceptanceStatus: 'admin_acceptance_confirmed',
      parentCommunicationStatus: 'parent_communication_ready',
      safeguardingStatus: 'safeguarding_ready',
      supportOperationsStatus: 'stakeholder_ready',
      monitoringGateStatus: 'monitoring_ready',
      pauseRollbackStatus: 'pause_rollback_ready',
      dataPrivacyStatus: 'stakeholder_ready',
      overallDecision: 'ready_to_start_task026',
      blockingBlockerCount: 0,
      safeSummary: 'Pilot is ready to start',
      requiredActions: [],
      task026SafeToStart: true,
    };
    expect(report.task026SafeToStart).toBe(true);
    expect(report.schoolVerified).toBe(true);
    expect(report.requiredActions).toEqual([]);
    expect(report.taskId).toBe('task025');
  });
});
