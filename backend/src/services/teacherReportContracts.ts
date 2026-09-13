// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Report Contracts v1 (Task 012)
// Safe teacher-facing summary contracts for learning dashboards,
// evidence API, role-scoped reporting, and low-workload insight.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionIdentity } from './teacherInterventionContracts';

// ═══════════════════════════════════════════════════════════════
// Report Types
// ═══════════════════════════════════════════════════════════════

export type TeacherReportType =
  | 'student_summary'
  | 'class_summary'
  | 'subject_summary'
  | 'topic_summary'
  | 'skill_summary'
  | 'intervention_ready_summary';

export type TeacherSummaryWindow =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'current_unit'
  | 'unknown';

export type TeacherReportVisibility =
  | 'teacher_safe'
  | 'school_admin_safe'
  | 'safeguarding_only';

// ═══════════════════════════════════════════════════════════════
// Request Context
// ═══════════════════════════════════════════════════════════════

export interface TeacherReportRequestContext {
  requestId: string;
  teacherId: string;
  schoolId: string;
  role: string;
  classId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Scope
// ═══════════════════════════════════════════════════════════════

export interface TeacherReportScope {
  schoolId: string;
  classId?: string;
  studentId?: string;
  subject?: string;
  topic?: string;
  skillId?: string;
  reportType: TeacherReportType;
  window: TeacherSummaryWindow;
}

export interface TeacherReportScopeDecision {
  allowed: boolean;
  reason: string;
  code: 'ok' | 'missing_teacher' | 'missing_school' | 'missing_student' | 'school_mismatch' | 'class_mismatch' | 'cross_student_denied' | 'role_forbidden' | 'unknown_role' | 'forbidden';
  classScopeNote?: string;
}

// ═══════════════════════════════════════════════════════════════
// Privacy
// ═══════════════════════════════════════════════════════════════

export interface TeacherReportPrivacyMetadata {
  privacyLevel: TeacherReportVisibility;
  redactionApplied: boolean;
  redactionReasons: string[];
  minimumNecessary: boolean;
  teacherSafe: boolean;
  safeguardingSeparated: boolean;
  deenSensitiveHandled: boolean;
}

export interface TeacherReportPrivacyDecision {
  safe: boolean;
  errors: string[];
  warnings: string[];
  metadata: TeacherReportPrivacyMetadata;
}

// ═══════════════════════════════════════════════════════════════
// Evidence
// ═══════════════════════════════════════════════════════════════

export type EvidenceSourceType =
  | 'practice_attempt'
  | 'learning_event'
  | 'mastery_snapshot'
  | 'misconception_signal'
  | 'spaced_review'
  | 'growth_proof'
  | 'growth_trend'
  | 'growth_weak_topic'
  | 'growth_mistake_pattern'
  | 'safe_memory_summary'
  | 'recommendation';

export interface TeacherSafeEvidenceCard {
  evidenceId: string;
  evidenceType: EvidenceSourceType;
  subject: string;
  topic: string;
  skillLabel: string;
  safeSummary: string;
  masterySignal: string;
  confidence: number;
  createdAt: string;
  sourceType: string;
  privacyLevel: TeacherReportVisibility;
}

export interface TeacherEvidenceDashboard {
  studentId: string;
  schoolId: string;
  classId?: string;
  evidenceCards: TeacherSafeEvidenceCard[];
  totalEvidenceCount: number;
  safeEvidenceCount: number;
  generatedAt: string;
  privacyMetadata: TeacherReportPrivacyMetadata;
}

// ═══════════════════════════════════════════════════════════════
// Student Summary
// ═══════════════════════════════════════════════════════════════

export type ProgressLabel =
  | 'needs_review'
  | 'developing'
  | 'recently_struggled'
  | 'improving'
  | 'secure'
  | 'ready_for_challenge'
  | 'support_recommended'
  | 'watch'
  | 'maintenance';

export interface TeacherSafeStudentSummary {
  studentId: string;
  schoolId: string;
  classId?: string;
  summaryWindow: TeacherSummaryWindow;
  overallProgressLabel: ProgressLabel;
  strengths: string[];
  needsReview: string[];
  recentImprovements: string[];
  revisionDue: TeacherSafeRevisionDueItem[];
  recommendedTeacherActions: TeacherNextActionRecommendation[];
  safeEvidenceCount: number;
  confidence: number;
  privacyMetadata: TeacherReportPrivacyMetadata;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Class Summary
// ═══════════════════════════════════════════════════════════════

export interface TeacherSafeClassSummary {
  schoolId: string;
  classId: string;
  summaryWindow: TeacherSummaryWindow;
  classProgressOverview: string;
  commonReviewNeeds: string[];
  commonStrengths: string[];
  studentsNeedingAcademicCheckIn: string[];
  studentsReadyForChallenge: string[];
  revisionDueSoon: TeacherSafeRevisionDueItem[];
  recommendedClassActions: TeacherNextActionRecommendation[];
  confidence: number;
  privacyMetadata: TeacherReportPrivacyMetadata;
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Revision Due Item
// ═══════════════════════════════════════════════════════════════

export interface TeacherSafeRevisionDueItem {
  studentId?: string;
  subject: string;
  topic: string;
  skillLabel: string;
  dueAt: string;
  intervalDays: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════
// Next Action Recommendation
// ═══════════════════════════════════════════════════════════════

export type TeacherNextActionType =
  | 'quick_check_in'
  | 'reteach_micro_concept'
  | 'assign_foundation_practice'
  | 'assign_similar_practice'
  | 'assign_challenge_practice'
  | 'review_revision_item'
  | 'recommend_peer_discussion'
  | 'recommend_teacher_explanation'
  | 'refer_to_scholar_or_deen_teacher'
  | 'refer_to_safeguarding_if_authorized_policy_requires'
  | 'no_action_needed';

export interface TeacherNextActionRecommendation {
  actionType: TeacherNextActionType;
  reason: string;
  safeEvidenceRefs: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  studentFacingSafeInstruction?: string;
  teacherOnlySafeNote?: string;
  confidence: number;
}

// ═══════════════════════════════════════════════════════════════
// Audit
// ═══════════════════════════════════════════════════════════════

export type TeacherReportAuditEventType =
  | 'teacher_report_generated'
  | 'teacher_report_scope_denied'
  | 'teacher_report_privacy_blocked'
  | 'teacher_report_forbidden_attempt';

export interface TeacherReportAuditRecord {
  eventId: string;
  actorId: string;
  actorRole: string;
  schoolId: string;
  classId?: string;
  studentId?: string;
  reportType: TeacherReportType;
  scopeDecision: TeacherReportScopeDecision;
  privacyDecision: TeacherReportPrivacyDecision;
  redactionApplied: boolean;
  minimumNecessary: boolean;
  generatedAt: string;
  requestId: string;
}

export interface TeacherReportAuditCreateInput {
  actorId: string;
  actorRole: string;
  schoolId: string;
  classId?: string;
  studentId?: string;
  reportType: TeacherReportType;
  scopeDecision: TeacherReportScopeDecision;
  privacyDecision: TeacherReportPrivacyDecision;
  redactionApplied: boolean;
  minimumNecessary: boolean;
  requestId: string;
}

// ═══════════════════════════════════════════════════════════════
// Response Metadata
// ═══════════════════════════════════════════════════════════════

export interface TeacherReportResponseMetadata {
  requestId: string;
  generatedAt: string;
  privacyMetadata: TeacherReportPrivacyMetadata;
  scopeDecision: TeacherReportScopeDecision;
}

// ═══════════════════════════════════════════════════════════════
// Action Recommendation Result
// ═══════════════════════════════════════════════════════════════

export interface TeacherActionRecommendationResult {
  studentId?: string;
  classId?: string;
  recommendations: TeacherNextActionRecommendation[];
  priorityOrder: 'urgent_first' | 'support_soon_first' | 'monitoring_first';
  generatedAt: string;
  privacyMetadata: TeacherReportPrivacyMetadata;
}

// ═══════════════════════════════════════════════════════════════
// Deen Safety
// ═══════════════════════════════════════════════════════════════

export type DeenSensitivityLevel = 'basic' | 'intermediate' | 'source_sensitive' | 'refer_to_scholar';

export interface DeenSafeEvidenceInfo {
  sensitivityLevel: DeenSensitivityLevel;
  safeProcessSummary: string;
  referralRecommended: boolean;
  referralReason?: string;
}

// ═══════════════════════════════════════════════════════════════
// Safeguarding
// ═══════════════════════════════════════════════════════════════

export interface SafeguardingBoundaryResult {
  ordinaryTeacherAccess: boolean;
  academicImpactSummary?: string;
  safeguardingRouted: boolean;
  teacherFacingSafeMessage?: string;
}

// ═══════════════════════════════════════════════════════════════
// Progress Label Helpers
// ═══════════════════════════════════════════════════════════════

export const SUPPORTIVE_LABELS: Record<string, ProgressLabel> = {
  needs_review: 'needs_review',
  developing: 'developing',
  recently_struggled: 'recently_struggled',
  improving: 'improving',
  secure: 'secure',
  ready_for_challenge: 'ready_for_challenge',
  support_recommended: 'support_recommended',
  watch: 'watch',
  maintenance: 'maintenance',
};

export const SHAMING_LABELS = [
  'weak student',
  'slow learner',
  'bad at math',
  'lazy',
  'failing',
  'poor performer',
  'problem student',
];
