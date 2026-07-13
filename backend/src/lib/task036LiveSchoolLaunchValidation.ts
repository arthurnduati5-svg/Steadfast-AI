import {
  Task036Task035DependencyProof,
  Task036LaunchEnvironmentGateInput,
  Task036LaunchEnvironmentGateResult,
  Task036LaunchWindowInput,
  Task036LaunchWindowResult,
  Task036LaunchApprovalInput,
  Task036LaunchApprovalResult,
  Task036SingleSchoolScopeInput,
  Task036SingleSchoolScopeResult,
  Task036LiveLaunchSessionInput,
  Task036LiveLaunchSessionRecord,
  Task036LaunchEventInput,
  Task036LaunchEventRecord,
  Task036RuntimeMonitoringResult,
  Task036HealthBudgetResult,
  Task036IncidentReadinessResult,
  Task036PauseControlResult,
  Task036RollbackControlResult,
  Task036KillSwitchControlResult,
  Task036PrivacyBoundaryResult,
  Task036ContentGovernanceResult,
  Task036SocraticIntegrityResult,
  Task036DeenBoundaryResult,
  Task036SchoolIdentityResult,
  Task036CrossSchoolDenialResult,
  Task036SafeLaunchReadModel,
  Task036FinalLaunchDecision,
  Task036LiveSchoolLaunchReport,
  TASK036_FORBIDDEN_OUTPUT_FIELDS,
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
  resolveTask036ActorRole,
  isTask036DeniedRole,
  isTask036LaunchOperatorRole,
  REQUIRED_APPROVAL_ROLES,
  TASK036_VALID_STATE_TRANSITIONS,
  TASK036_ALLOWED_ENVIRONMENT_TYPES,
  TASK036_ALLOWED_LAUNCH_MODES,
} from '../contracts/task036LiveSchoolLaunchContracts';

export function validateTask035DependencyProof(proof: Task036Task035DependencyProof): string[] {
  const errors: string[] = [];
  if (!proof.ok) errors.push('task035_dependency_proof_not_ok');
  if (!proof.handoffExists) errors.push('task035_handoff_not_found');
  if (!proof.reportExists) errors.push('task035_report_not_found');
  if (!proof.jsonReportExists) errors.push('task035_json_report_not_found');
  if (!proof.verdictIsAcceptedReadyYes) errors.push('task035_verdict_not_accepted_ready_yes');
  if (!proof.safeToStartTask036) errors.push('task035_safeToStartTask036_not_true');
  if (proof.safeToStartTask040) errors.push('task035_safeToStartTask040_should_be_false');
  if (!proof.remainingBlockersEmpty) errors.push('task035_remaining_blockers_not_empty');
  if (!proof.focusedTestsPassed) errors.push('task035_focused_tests_not_passed');
  if (!proof.continuityTestsPassed) errors.push('task035_continuity_tests_not_passed');
  if (!proof.routeContractsPassed) errors.push('task035_route_contracts_not_passed');
  if (!proof.roleSecurityTestsPassed) errors.push('task035_role_security_tests_not_passed');
  if (!proof.noSafetyTestsPassed) errors.push('task035_no_safety_tests_not_passed');
  if (!proof.verificationScriptPassed) errors.push('task035_verification_script_not_passed');
  if (!proof.typeScriptPassed) errors.push('task035_typescript_not_passed');
  if (!proof.backendBuildPassed) errors.push('task035_backend_build_not_passed');
  if (!proof.prismaValidatePassed) errors.push('task035_prisma_validate_not_passed');
  if (!proof.prismaGeneratePassed) errors.push('task035_prisma_generate_not_passed');
  if (!proof.noTask036InsideTask035) errors.push('task035_contained_task036_implementation');
  if (!proof.noTask040InsideTask035) errors.push('task035_contained_task040_implementation');
  if (!proof.noFrontendUiInsideTask035) errors.push('task035_contained_frontend_ui');
  if (!proof.noLiveLaunchInsideTask035) errors.push('task035_contained_live_launch');
  return errors;
}

export function validateLaunchEnvironmentGateInput(input: Task036LaunchEnvironmentGateInput): string[] {
  const errors: string[] = [];
  if (!TASK036_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType as any)) {
    errors.push('disallowed_environment_type');
  }
  if (!TASK036_ALLOWED_LAUNCH_MODES.includes(input.launchMode as any)) {
    errors.push('disallowed_launch_mode');
  }
  if (input.publicLaunchRequested) errors.push('public_launch_requested');
  if (input.multiSchoolScope) errors.push('multi_school_scope_enabled');
  if (input.marketingLaunchRequested) errors.push('marketing_launch_requested');
  if (input.paymentLaunchRequested) errors.push('payment_launch_requested');
  if (input.backendFreezeRequested) errors.push('backend_freeze_requested');
  if (input.frontendUiRequested) errors.push('frontend_ui_requested');
  if (input.liveAiExpansionRequested) errors.push('live_ai_expansion_requested');
  if (input.liveConnectorWriteExpansionRequested) errors.push('live_connector_write_expansion_requested');
  if (input.externalNotificationRequested) errors.push('external_notification_requested');
  if (input.productionDeploymentRequested) errors.push('production_deployment_requested');
  if (input.productionMutationRequested) errors.push('production_mutation_requested');
  if (!input.task035Accepted) errors.push('task035_not_accepted');
  if (!input.singleSchoolScope) errors.push('single_school_scope_not_set');
  return errors;
}

export function validateLaunchWindowInput(input: Task036LaunchWindowInput): string[] {
  const errors: string[] = [];
  if (!input.launchWindowId) errors.push('missing_launch_window_id');
  if (!input.schoolId) errors.push('missing_school_id');
  if (!input.tenantId) errors.push('missing_tenant_id');
  if (!input.approvedStartAt) errors.push('missing_approved_start_at');
  if (!input.approvedEndAt) errors.push('missing_approved_end_at');
  if (!input.approvalReferenceId) errors.push('missing_approval_reference_id');
  if (!input.rollbackPlanId) errors.push('missing_rollback_plan_id');
  if (!input.pausePlanId) errors.push('missing_pause_plan_id');
  if (!input.killSwitchId) errors.push('missing_kill_switch_id');
  if (!input.operatorId) errors.push('missing_operator_id');
  return errors;
}

export function validateLaunchWindowResult(result: Task036LaunchWindowResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('launch_window_not_ok');
  if (!result.passed) errors.push('launch_window_not_passed');
  if (result.isExpired) errors.push('launch_window_expired');
  if (result.isOpenEnded) errors.push('launch_window_open_ended');
  if (!result.isWithinApprovedTime) errors.push('launch_window_outside_approved_time');
  if (!result.hasRollbackPlan) errors.push('launch_window_no_rollback_plan');
  if (!result.hasPausePlan) errors.push('launch_window_no_pause_plan');
  if (!result.hasKillSwitch) errors.push('launch_window_no_kill_switch');
  return errors;
}

export function validateLaunchApprovalInput(input: Task036LaunchApprovalInput): string[] {
  const errors: string[] = [];
  if (!input.approvalId) errors.push('missing_approval_id');
  if (!input.sessionId) errors.push('missing_session_id');
  if (!input.schoolId) errors.push('missing_school_id');
  if (!input.tenantId) errors.push('missing_tenant_id');
  if (!input.approvedAt) errors.push('missing_approved_at');
  const role = resolveTask036ActorRole(input.role);
  if (isTask036DeniedRole(role)) errors.push('role_denied_approval_authority');
  if (input.approvalRefersToRawPrivateData) errors.push('approval_refers_to_raw_private_data');
  if (input.approvalRequestsPublicLaunch) errors.push('approval_requests_public_launch');
  if (input.approvalRequestsMultiSchoolLaunch) errors.push('approval_requests_multi_school_launch');
  if (input.approvalRequestsBackendFreeze) errors.push('approval_requests_backend_freeze');
  return errors;
}

export function validateLaunchApprovalResult(result: Task036LaunchApprovalResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('approval_not_ok');
  if (!result.passed) errors.push('approval_not_passed');
  if (!result.roleValid) errors.push('approval_role_invalid');
  if (!result.roleHasApprovalAuthority) errors.push('approval_role_no_authority');
  if (!result.withinSchoolScope) errors.push('approval_outside_school_scope');
  if (!result.noRawPrivateDataReference) errors.push('approval_has_raw_private_data');
  if (!result.noPublicLaunchRequest) errors.push('approval_requests_public_launch');
  if (!result.noMultiSchoolLaunchRequest) errors.push('approval_requests_multi_school_launch');
  if (!result.noBackendFreezeRequest) errors.push('approval_requests_backend_freeze');
  return errors;
}

export function validateSingleSchoolScopeInput(input: Task036SingleSchoolScopeInput): string[] {
  const errors: string[] = [];
  if (!input.schoolId) errors.push('missing_school_id');
  if (!input.tenantId) errors.push('missing_tenant_id');
  if (!input.approvedSchoolConfigExists) errors.push('no_approved_school_config');
  if (!input.approvedRosterSnapshotExists) errors.push('no_approved_roster_snapshot');
  if (!input.singleSchoolScope) errors.push('single_school_scope_not_set');
  if (input.multiSchoolScope) errors.push('multi_school_scope_enabled');
  if (!input.crossSchoolAccessDenied) errors.push('cross_school_access_not_denied');
  if (!input.publicSignupDisabled) errors.push('public_signup_not_disabled');
  if (!input.openRegistrationDisabled) errors.push('open_registration_not_disabled');
  if (!input.paymentFlowDisabled) errors.push('payment_flow_not_disabled');
  if (!input.marketingLaunchDisabled) errors.push('marketing_launch_not_disabled');
  return errors;
}

export function validateSingleSchoolScopeResult(result: Task036SingleSchoolScopeResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('single_school_scope_not_ok');
  if (!result.passed) errors.push('single_school_scope_not_passed');
  return errors;
}

export function validatePrivacyBoundaryResult(result: Task036PrivacyBoundaryResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('privacy_boundary_not_ok');
  if (!result.passed) errors.push('privacy_boundary_not_passed');
  if (result.rawStudentChatExposed) errors.push('raw_student_chat_exposed');
  if (result.rawAnswersExposed) errors.push('raw_answers_exposed');
  if (result.rawSafeguardingNotesExposed) errors.push('raw_safeguarding_notes_exposed');
  if (result.rawDeenTextExposed) errors.push('raw_deen_text_exposed');
  if (result.rawProviderPayloadExposed) errors.push('raw_provider_payload_exposed');
  if (result.parentContactExposed) errors.push('parent_contact_exposed');
  if (result.teacherPrivateNotesExposed) errors.push('teacher_private_notes_exposed');
  if (result.hiddenReasoningExposed) errors.push('hidden_reasoning_exposed');
  if (result.secretsExposed) errors.push('secrets_exposed');
  if (result.answerKeyExposed) errors.push('answer_key_exposed');
  if (result.markingSchemeExposed) errors.push('marking_scheme_exposed');
  return errors;
}

export function validateContentGovernanceResult(result: Task036ContentGovernanceResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('content_governance_not_ok');
  if (!result.passed) errors.push('content_governance_not_passed');
  if (!result.approvedSourceRequired) errors.push('approved_source_not_required');
  if (!result.unapprovedContentBlocked) errors.push('unapproved_content_not_blocked');
  if (!result.curriculumGatePassed) errors.push('curriculum_gate_not_passed');
  if (!result.teacherOnlyContentProtected) errors.push('teacher_only_content_not_protected');
  if (!result.noInventedTeachingClaim) errors.push('invented_teaching_claim_detected');
  return errors;
}

export function validateSocraticIntegrityResult(result: Task036SocraticIntegrityResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('socratic_integrity_not_ok');
  if (!result.passed) errors.push('socratic_integrity_not_passed');
  if (!result.socraticGuidancePreserved) errors.push('socratic_guidance_not_preserved');
  if (!result.noFinalAnswerBotBehavior) errors.push('final_answer_bot_behavior_detected');
  if (!result.cheatingPreventionPreserved) errors.push('cheating_prevention_not_preserved');
  if (!result.noHomeworkShortcut) errors.push('homework_shortcut_detected');
  return errors;
}

export function validateDeenBoundaryResult(result: Task036DeenBoundaryResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('deen_boundary_not_ok');
  if (!result.passed) errors.push('deen_boundary_not_passed');
  if (!result.noFatwaEngineMode) errors.push('fatwa_engine_mode_detected');
  if (!result.approvedDeenSourceRequired) errors.push('approved_deen_source_not_required');
  if (!result.teacherScholarReferralPreserved) errors.push('teacher_scholar_referral_not_preserved');
  if (!result.noPietyScoring) errors.push('piety_scoring_detected');
  if (!result.noUnsafeDeenAuthority) errors.push('unsafe_deen_authority_detected');
  if (!result.deenSensitiveTextProtected) errors.push('deen_sensitive_text_not_protected');
  return errors;
}

export function validateSchoolIdentityResult(result: Task036SchoolIdentityResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('school_identity_not_ok');
  if (!result.passed) errors.push('school_identity_not_passed');
  if (!result.schoolIdentityVerified) errors.push('school_identity_not_verified');
  if (!result.schoolContextVerified) errors.push('school_context_not_verified');
  if (!result.tenantMatchVerified) errors.push('tenant_mismatch');
  if (!result.sessionRequiresVerifiedIdentity) errors.push('session_identity_not_required');
  if (!result.memoryRequiresVerifiedIdentity) errors.push('memory_identity_not_required');
  if (!result.evidenceRequiresVerifiedIdentity) errors.push('evidence_identity_not_required');
  if (!result.aiCallRequiresVerifiedIdentity) errors.push('ai_call_identity_not_required');
  if (!result.actionRequiresVerifiedIdentity) errors.push('action_identity_not_required');
  return errors;
}

export function validateCrossSchoolDenialResult(result: Task036CrossSchoolDenialResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('cross_school_denial_not_ok');
  if (!result.passed) errors.push('cross_school_denial_not_passed');
  if (!result.crossSchoolAccessDenied) errors.push('cross_school_access_not_denied');
  if (!result.crossLearnerVisibilityDenied) errors.push('cross_learner_visibility_not_denied');
  if (!result.parentRawDetailDenied) errors.push('parent_raw_detail_not_denied');
  if (!result.unknownSchoolBlocked) errors.push('unknown_school_not_blocked');
  if (!result.tenantMismatchBlocked) errors.push('tenant_mismatch_not_blocked');
  return errors;
}

export function validateRuntimeMonitoringResult(result: Task036RuntimeMonitoringResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('runtime_monitoring_not_ok');
  const forbiddenFields = TASK036_FORBIDDEN_OUTPUT_FIELDS;
  const resultKeys = Object.keys(result);
  for (const field of forbiddenFields) {
    if (resultKeys.includes(field)) {
      errors.push(`forbidden_field_in_runtime_monitoring:${field}`);
    }
  }
  return errors;
}

export function validateHealthBudgetResult(result: Task036HealthBudgetResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('health_budget_not_ok');
  if (!result.healthBudgetPassed) errors.push('health_budget_not_passed');
  return errors;
}

export function validateIncidentReadinessResult(result: Task036IncidentReadinessResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('incident_readiness_not_ok');
  if (!result.incidentDetectionReady) errors.push('incident_detection_not_ready');
  if (!result.incidentClassificationReady) errors.push('incident_classification_not_ready');
  if (!result.incidentResponseReady) errors.push('incident_response_not_ready');
  if (!result.incidentEscalationReady) errors.push('incident_escalation_not_ready');
  if (!result.incidentAuditReady) errors.push('incident_audit_not_ready');
  if (!result.pausePlanReady) errors.push('pause_plan_not_ready');
  if (!result.rollbackPlanReady) errors.push('rollback_plan_not_ready');
  if (!result.killSwitchReady) errors.push('kill_switch_not_ready');
  return errors;
}

export function validatePauseControlResult(result: Task036PauseControlResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('pause_control_not_ok');
  if (!result.paused) errors.push('pause_not_executed');
  if (!result.auditPreserved) errors.push('pause_audit_not_preserved');
  if (result.externalNotificationSent) errors.push('pause_sent_external_notification');
  if (result.productionMutated) errors.push('pause_produced_mutation');
  return errors;
}

export function validateRollbackControlResult(result: Task036RollbackControlResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('rollback_control_not_ok');
  if (!result.rollbackRequested) errors.push('rollback_not_requested');
  if (!result.auditPreserved) errors.push('rollback_audit_not_preserved');
  if (result.destructiveDatabaseCommandsRun) errors.push('rollback_ran_destructive_db_commands');
  if (result.deploymentPerformed) errors.push('rollback_performed_deployment');
  if (result.externalServicesCalled) errors.push('rollback_called_external_services');
  return errors;
}

export function validateKillSwitchControlResult(result: Task036KillSwitchControlResult): string[] {
  const errors: string[] = [];
  if (!result.ok) errors.push('kill_switch_control_not_ok');
  if (!result.killSwitchEnabled) errors.push('kill_switch_not_enabled');
  if (!result.auditPreserved) errors.push('kill_switch_audit_not_preserved');
  if (result.dataDeleted) errors.push('kill_switch_deleted_data');
  if (result.externalServicesCalled) errors.push('kill_switch_called_external_services');
  return errors;
}

export function validateSafeLaunchReadModel(model: Task036SafeLaunchReadModel): string[] {
  const errors: string[] = [];
  if (!model.ok) errors.push('safe_launch_read_model_not_ok');
  if (!model.sessionId) errors.push('safe_launch_read_model_no_session_id');
  if (!model.safeSummariesOnly) errors.push('safe_launch_read_model_not_safe_summaries_only');
  return errors;
}

export function validateFinalLaunchDecision(decision: Task036FinalLaunchDecision): string[] {
  const errors: string[] = [];
  if (decision.safeToStartTask040 && decision.remainingBlockers.length > 0) {
    errors.push('safe_to_start_task040_true_with_blockers');
  }
  if (!decision.safeToStartTask040 && decision.finalDecision === 'TASK_036_PASS_SAFE_TO_START_TASK_040') {
    errors.push('final_decision_mismatch_safe_to_start');
  }
  return errors;
}

export function validateReportTruth(report: Task036LiveSchoolLaunchReport): string[] {
  const errors: string[] = [];
  if (report.safeToStartTask040 && report.remainingBlockers.length > 0) {
    errors.push('report_safe_to_start_true_with_blockers');
  }
  if (report.verdict === 'ACCEPTED_READY_YES' && report.remainingBlockers.length > 0) {
    errors.push('report_verdict_accepted_with_blockers');
  }
  if (report.verdict === 'ACCEPTED_READY_YES' && !report.safeToStartTask040) {
    errors.push('report_verdict_accepted_but_not_safe');
  }
  return errors;
}

export function validateForbiddenOutputFields(obj: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const field of TASK036_FORBIDDEN_OUTPUT_FIELDS) {
    if (field in obj && obj[field] !== undefined) {
      errors.push(`forbidden_field_present:${field}`);
    }
  }
  return errors;
}

export function validateForbiddenSideEffects(code: string): string[] {
  const errors: string[] = [];
  for (const pattern of TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS) {
    if (code.includes(pattern)) {
      errors.push(`forbidden_side_effect_pattern:${pattern}`);
    }
  }
  return errors;
}

export function validateFutureTaskBoundaries(code: string): string[] {
  const errors: string[] = [];
  for (const pattern of TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS) {
    if (code.includes(pattern)) {
      errors.push(`future_task_pattern_detected:${pattern}`);
    }
  }
  return errors;
}
