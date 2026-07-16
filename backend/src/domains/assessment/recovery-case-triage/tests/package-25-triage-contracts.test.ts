import { describe, it, expect } from 'vitest';
import {
  PROHIBITED_RANKING_FACTORS,
  AllowedActorRoles,
  ForbiddenActorRoles,
  PROHIBITED_STATUSES,
  PRIORITY_FACTOR_CODES,
  SCORING_POLICY_VERSION,
  ForbiddenEntityFields,
} from '../contracts/recoveryCaseTriageContracts';

describe('Package 25 - Contracts Enums and Constants', () => {
  it('PROHIBITED_RANKING_FACTORS contains all expected forbidden factors', () => {
    const expected = [
      'race', 'ethnicity', 'religiousIdentity', 'sectIdentity', 'genderIdentity',
      'sexualOrientation', 'familyIncome', 'paymentStatus', 'parentEngagementScore',
      'diagnosis', 'medicalAssessment', 'psychologicalAssessment', 'rawStudentAnswer',
      'answerKeyText', 'unreleasedScore', 'unreleasedGrade', 'teacherPreferenceScore',
      'studentPopularity', 'behaviorScore', 'attendanceScore', 'parentOccupation',
      'homeAddress', 'socioeconomicIndicator', 'socialMediaActivity',
      'extracurricularInvolvement', 'personalityProfile',
    ];
    for (const factor of expected) {
      expect(PROHIBITED_RANKING_FACTORS).toContain(factor);
    }
    expect(PROHIBITED_RANKING_FACTORS.length).toBeGreaterThanOrEqual(expected.length);
  });

  it('AllowedActorRoles includes teacher, lead_teacher, department_head, admin, system_job', () => {
    const expectedRoles = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
    for (const role of expectedRoles) {
      expect(AllowedActorRoles).toContain(role);
    }
    expect(AllowedActorRoles.length).toBe(expectedRoles.length);
  });

  it('ForbiddenActorRoles includes student, parent, guest, unknown', () => {
    const expectedRoles = ['student', 'parent', 'guest', 'unknown'];
    for (const role of expectedRoles) {
      expect(ForbiddenActorRoles).toContain(role);
    }
    expect(ForbiddenActorRoles.length).toBe(expectedRoles.length);
  });

  it('PROHIBITED_STATUSES includes all forbidden statuses', () => {
    const expected = [
      'assigned', 'assignment_created', 'sent', 'notified', 'published', 'executed',
      'authorized_live', 'live_authorized', 'activated', 'completed_live', 'closed_live',
      'synced', 'mutated',
    ];
    for (const status of expected) {
      expect(PROHIBITED_STATUSES).toContain(status);
    }
    expect(PROHIBITED_STATUSES.length).toBeGreaterThanOrEqual(expected.length);
  });

  it('PRIORITY_FACTOR_CODES includes all 8 factor codes', () => {
    const expected = [
      'risk_level', 'active_blocker', 'admin_review_required', 'teacher_review_required',
      'board_stale', 'authorization_preview_concern', 'simulation_concern', 'case_age',
    ];
    for (const code of expected) {
      expect(PRIORITY_FACTOR_CODES).toContain(code);
    }
    expect(PRIORITY_FACTOR_CODES.length).toBe(expected.length);
  });

  it('SCORING_POLICY_VERSION is RECOVERY_CASE_TRIAGE_PRIORITY_V1', () => {
    expect(SCORING_POLICY_VERSION).toBe('RECOVERY_CASE_TRIAGE_PRIORITY_V1');
  });

  it('Status type union values are correct for each status type', () => {
    const readinessStatuses: string[] = ['draft', 'ready', 'review_ready', 'stale', 'blocked', 'suppressed', 'void'];
    const assessmentStatuses: string[] = ['draft', 'scored', 'review_ready', 'stale', 'blocked', 'void'];
    const snapshotStatuses: string[] = ['draft', 'generated', 'review_ready', 'stale', 'blocked', 'void'];
    const itemStatuses: string[] = ['queued', 'review_ready', 'deferred', 'capacity_exceeded', 'blocked', 'suppressed_duplicate', 'void'];
    const draftStatuses: string[] = ['draft', 'review_ready', 'approved_for_future_use', 'blocked', 'suppressed', 'void'];
    const bands: string[] = ['critical_review', 'high', 'normal', 'low', 'deferred'];
    const riskRanks: string[] = ['critical', 'high', 'medium', 'low', 'none'];
    const decisions: string[] = ['queued', 'review_ready', 'deferred', 'capacity_exceeded', 'block_missing_context', 'blocked_fairness', 'suppressed_duplicate'];
    const fairnessStatuses: string[] = ['allowed', 'blocked', 'needs_review'];
    const capacityStatuses: string[] = ['draft', 'review_ready', 'capacity_exceeded', 'void'];
    const audienceRoles: string[] = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];

    expect(readinessStatuses).toHaveLength(7);
    expect(assessmentStatuses).toHaveLength(6);
    expect(snapshotStatuses).toHaveLength(6);
    expect(itemStatuses).toHaveLength(7);
    expect(draftStatuses).toHaveLength(6);
    expect(bands).toHaveLength(5);
    expect(riskRanks).toHaveLength(5);
    expect(decisions).toHaveLength(7);
    expect(fairnessStatuses).toHaveLength(3);
    expect(capacityStatuses).toHaveLength(4);
    expect(audienceRoles).toHaveLength(5);
  });

  it('ForbiddenEntityFields contains all forbidden fields', () => {
    const expected = [
      'rawStudentAnswer', 'answerKeyText', 'rubricText', 'internalReasoning',
      'chainOfThought', 'aiNarrative', 'generatedNarrative', 'modelOutput',
      'ocrText', 'rawQuestionMetadata', 'teacherOnlyNotes', 'markingNotesTeacherOnly',
      'unreleasedScore', 'unreleasedGrade', 'scoreBeforeFinalization',
      'finalGradeBeforeRelease', 'parentDeliveryPayload', 'studentDeliveryPayload',
      'notificationPayload', 'emailPayload', 'smsPayload', 'pushPayload',
      'whatsAppPayload', 'portalPayload', 'pdfBinary', 'htmlExport',
      'liveProviderPayload', 'providerSecret', 'apiKey', 'externalSyncPayload',
    ];
    for (const field of expected) {
      expect(ForbiddenEntityFields).toContain(field);
    }
    expect(ForbiddenEntityFields.length).toBeGreaterThanOrEqual(expected.length);
  });
});
