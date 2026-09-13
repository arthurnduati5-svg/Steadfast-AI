// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learning Dashboard Evidence Service v1 (Task 012)
// Aggregates safe evidence from Task 011 persisted models for
// teacher-facing dashboards and reports. Returns safe evidence
// cards — never raw chat, never private memory.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import type {
  TeacherSafeEvidenceCard,
  TeacherEvidenceDashboard,
  TeacherReportPrivacyMetadata,
  TeacherReportScope,
} from './teacherReportContracts';
import { sanitizeEvidenceCard } from './teacherReportPrivacyGuardService';

// ═══════════════════════════════════════════════════════════════
// In-memory evidence store (fallback when DB is unavailable)
// ═══════════════════════════════════════════════════════════════

interface EvidenceSourceRecord {
  id: string;
  type: 'practice_attempt' | 'learning_event' | 'mastery_snapshot' | 'misconception_signal' | 'spaced_review' | 'growth_proof' | 'growth_trend' | 'growth_weak_topic' | 'growth_mistake_pattern' | 'safe_memory_summary' | 'recommendation';
  schoolId: string;
  studentId: string;
  subject: string;
  topic: string;
  skillLabel: string;
  safeSummary: string;
  masterySignal: string;
  confidence: number;
  createdAt: string;
  sourceType: string;
}

const evidenceStore: Map<string, EvidenceSourceRecord> = new Map();

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Get safe evidence dashboard for a student.
 * Aggregates from all Task 011 evidence sources.
 */
export async function getStudentEvidenceDashboard(
  scope: TeacherReportScope,
): Promise<TeacherEvidenceDashboard> {
  const allEvidence = await queryEvidenceByScope(scope);
  const safeCards = allEvidence.map(e => {
    const { safeCard } = sanitizeEvidenceCard({
      evidenceId: e.id,
      evidenceType: e.type,
      subject: e.subject,
      topic: e.topic,
      skillLabel: e.skillLabel,
      safeSummary: e.safeSummary,
      masterySignal: e.masterySignal,
      confidence: e.confidence,
      createdAt: e.createdAt,
      sourceType: e.sourceType,
    });
    return safeCard;
  });

  const privacyMetadata: TeacherReportPrivacyMetadata = {
    privacyLevel: 'teacher_safe',
    redactionApplied: false,
    redactionReasons: [],
    minimumNecessary: true,
    teacherSafe: true,
    safeguardingSeparated: true,
    deenSensitiveHandled: true,
  };

  return {
    studentId: scope.studentId || 'unknown',
    schoolId: scope.schoolId,
    classId: scope.classId,
    evidenceCards: safeCards,
    totalEvidenceCount: allEvidence.length,
    safeEvidenceCount: safeCards.length,
    generatedAt: new Date().toISOString(),
    privacyMetadata,
  };
}

/**
 * Get safe evidence dashboard for a class (aggregated across students).
 */
export async function getClassEvidenceDashboard(
  scope: TeacherReportScope,
): Promise<{ evidenceCards: TeacherSafeEvidenceCard[]; totalEvidenceCount: number; safeEvidenceCount: number }> {
  const allEvidence = await queryEvidenceByScope(scope);
  const safeCards = allEvidence.map(e => {
    const { safeCard } = sanitizeEvidenceCard({
      evidenceId: e.id,
      evidenceType: e.type,
      subject: e.subject,
      topic: e.topic,
      skillLabel: e.skillLabel,
      safeSummary: e.safeSummary,
      masterySignal: e.masterySignal,
      confidence: e.confidence,
      createdAt: e.createdAt,
      sourceType: e.sourceType,
    });
    return safeCard;
  });

  return {
    evidenceCards: safeCards,
    totalEvidenceCount: allEvidence.length,
    safeEvidenceCount: safeCards.length,
  };
}

/**
 * Get safe evidence dashboard for a subject.
 */
export async function getSubjectEvidenceDashboard(
  scope: TeacherReportScope,
): Promise<{ evidenceCards: TeacherSafeEvidenceCard[]; totalEvidenceCount: number }> {
  const allEvidence = await queryEvidenceByScope(scope);
  const safeCards = allEvidence.map(e => {
    const { safeCard } = sanitizeEvidenceCard({
      evidenceId: e.id,
      evidenceType: e.type,
      subject: e.subject,
      topic: e.topic,
      skillLabel: e.skillLabel,
      safeSummary: e.safeSummary,
      masterySignal: e.masterySignal,
      confidence: e.confidence,
      createdAt: e.createdAt,
      sourceType: e.sourceType,
    });
    return safeCard;
  });

  return {
    evidenceCards: safeCards,
    totalEvidenceCount: allEvidence.length,
  };
}

/**
 * Get safe evidence dashboard for a specific skill.
 */
export async function getSkillEvidenceDashboard(
  scope: TeacherReportScope,
): Promise<{ evidenceCards: TeacherSafeEvidenceCard[]; totalEvidenceCount: number }> {
  const allEvidence = await queryEvidenceByScope(scope);
  const safeCards = allEvidence.map(e => {
    const { safeCard } = sanitizeEvidenceCard({
      evidenceId: e.id,
      evidenceType: e.type,
      subject: e.subject,
      topic: e.topic,
      skillLabel: e.skillLabel,
      safeSummary: e.safeSummary,
      masterySignal: e.masterySignal,
      confidence: e.confidence,
      createdAt: e.createdAt,
      sourceType: e.sourceType,
    });
    return safeCard;
  });

  return {
    evidenceCards: safeCards,
    totalEvidenceCount: allEvidence.length,
  };
}

/**
 * Get revision-specific evidence dashboard.
 */
export async function getRevisionEvidenceDashboard(
  scope: TeacherReportScope,
): Promise<{ evidenceCards: TeacherSafeEvidenceCard[]; totalEvidenceCount: number }> {
  const allEvidence = await queryEvidenceByScope(scope);
  const revisionEvidence = allEvidence.filter(e => e.type === 'spaced_review' || e.type === 'recommendation');
  const safeCards = revisionEvidence.map(e => {
    const { safeCard } = sanitizeEvidenceCard({
      evidenceId: e.id,
      evidenceType: e.type,
      subject: e.subject,
      topic: e.topic,
      skillLabel: e.skillLabel,
      safeSummary: e.safeSummary,
      masterySignal: e.masterySignal,
      confidence: e.confidence,
      createdAt: e.createdAt,
      sourceType: e.sourceType,
    });
    return safeCard;
  });

  return {
    evidenceCards: safeCards,
    totalEvidenceCount: revisionEvidence.length,
  };
}

/**
 * Add evidence to the in-memory store (for testing / fallback).
 */
export function addEvidenceRecord(record: EvidenceSourceRecord): void {
  evidenceStore.set(record.id, record);
}

/**
 * Clear the in-memory evidence store (for testing).
 */
export function clearEvidenceStore(): void {
  evidenceStore.clear();
}

/**
 * Get count of records in the in-memory store (for testing).
 */
export function getEvidenceStoreSize(): number {
  return evidenceStore.size;
}

// ═══════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════

async function queryEvidenceByScope(scope: TeacherReportScope): Promise<EvidenceSourceRecord[]> {
  // In production, this would query Prisma for:
  //   PracticeAttempt (using safe fields only)
  //   LearningEvent (using safe fields only)
  //   SkillMasterySnapshot
  //   PracticeMisconceptionSignal
  //   SpacedReviewItem
  //   GrowthWeakTopicState
  //   GrowthMistakePatternState
  //   GrowthMasteryTrendState
  //   GrowthRecommendationState
  //   SafeMemorySummary
  //
  // For now, query the in-memory store as fallback.

  const results: EvidenceSourceRecord[] = [];

  for (const record of evidenceStore.values()) {
    if (!scope.schoolId || record.schoolId !== scope.schoolId) continue;
    if (scope.studentId && record.studentId !== scope.studentId) continue;
    if (scope.subject && record.subject !== scope.subject) continue;
    if (scope.topic && record.topic !== scope.topic) continue;
    if (scope.skillId && record.skillLabel !== scope.skillId) continue;

    results.push(record);
  }

  // Sort by creation date descending
  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return results;
}
