import type {
  GrowthActionWhyThisNextCode,
  GrowthActionPriorityBucket,
  GrowthActionConfidenceBucket,
  GrowthActionDestination,
  GrowthActionPlan,
  GrowthLearnerEvidenceSnapshot,
} from '../contracts/growthActionContracts';
import type { LearnerState } from './growthActionLearnerStateService';
import { v4 as uuidv4 } from 'uuid';

export interface WhyThisNextInput {
  evidence: GrowthLearnerEvidenceSnapshot;
  learnerState: LearnerState;
  actionPlan: GrowthActionPlan;
}

export interface WhyThisNextOutput {
  id: string;
  schoolId: string;
  studentId: string;
  whyThisNextCode: GrowthActionWhyThisNextCode;
  priorityBucket: GrowthActionPriorityBucket;
  confidenceBucket: GrowthActionConfidenceBucket;
  studentSafeReason: string;
  teacherSafeReason?: string;
  evidenceSummary: Record<string, unknown>;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export function generateWhyThisNext(input: WhyThisNextInput): WhyThisNextOutput {
  const { evidence, learnerState, actionPlan } = input;
  const code = actionPlan.whyThisNextCode;
  const now = new Date().toISOString();

  const { studentSafeReason, teacherSafeReason } = buildSafeReasons(code, evidence, learnerState);

  const evidenceSummary: Record<string, unknown> = {
    stateQuality: evidence.stateQuality,
    weakTopicCount: evidence.weakTopicSignals.length,
    mistakeCount: evidence.mistakeSignals.length,
    revisionCount: evidence.revisionSignals.length,
    masteryStatus: learnerState.masteryState.status,
    contentAvailable: evidence.contentAvailability.available,
    deenUncertain: evidence.deenSensitivity.uncertain,
  };

  return {
    id: uuidv4(),
    schoolId: evidence.schoolId,
    studentId: evidence.studentId,
    whyThisNextCode: code,
    priorityBucket: actionPlan.priorityBucket,
    confidenceBucket: actionPlan.confidenceBucket,
    studentSafeReason,
    teacherSafeReason,
    evidenceSummary,
    safeReasonCodes: actionPlan.safeReasonCodes,
    safeEvidenceRefs: actionPlan.safeEvidenceRefs,
    createdAt: now,
  };
}

function buildSafeReasons(
  code: GrowthActionWhyThisNextCode,
  evidence: GrowthLearnerEvidenceSnapshot,
  learnerState: LearnerState,
): { studentSafeReason: string; teacherSafeReason?: string } {
  switch (code) {
    case 'due_revision_item':
      return {
        studentSafeReason: 'You have a due revision item that is ready to revisit.',
        teacherSafeReason: `Learner has ${evidence.revisionSignals.length} due revision items.`,
      };
    case 'weak_topic_detected':
    case 'low_mastery':
      return {
        studentSafeReason: 'This topic still has weak recall signals, so a short quiz check is the best next step.',
        teacherSafeReason: `Learner has ${evidence.weakTopicSignals.length} weak topic(s) and low mastery signals.`,
      };
    case 'teach_back_explanation_needed':
      return {
        studentSafeReason: 'Your explanation signal is unclear, so Teach-Back Mode can help you prove the idea in your own words.',
        teacherSafeReason: 'Learner explanation signal was unclear in previous teach-back session.',
      };
    case 'focus_deep_repair_needed':
    case 'repeated_stuck_signal':
      return {
        studentSafeReason: 'You were repeatedly stuck on one concept, so Focus Mode is the safest next step.',
        teacherSafeReason: `Learner has ${evidence.mistakeSignals.length} repeated mistake pattern(s).`,
      };
    case 'mistake_pattern_detected':
      return {
        studentSafeReason: 'A mistake pattern was noticed. Focus Mode can help repair it.',
        teacherSafeReason: `Mistake pattern detected with recurrence score.`,
      };
    case 'quiz_recall_needed':
      return {
        studentSafeReason: 'A short quiz can help check what you remember.',
        teacherSafeReason: 'Quiz recall check recommended based on weak recall signals.',
      };
    case 'exam_review_needed':
      return {
        studentSafeReason: 'Exam review mode can help you prepare by practising past topics.',
        teacherSafeReason: 'Exam review recommended based on exam mode summary.',
      };
    case 'spaced_review_due':
      return {
        studentSafeReason: 'A spaced review item is due. Revisiting it now helps long-term memory.',
        teacherSafeReason: 'Spaced review triggered for revision queue items.',
      };
    case 'content_gap_detected':
      return {
        studentSafeReason: 'I do not have approved content for this target yet, so I cannot safely teach from it.',
        teacherSafeReason: 'Content gap detected — no approved source available for requested target.',
      };
    case 'deen_uncertainty_detected':
      return {
        studentSafeReason: 'This looks Deen-sensitive and needs an approved source or teacher guidance before continuing.',
        teacherSafeReason: 'Deen sensitivity detected — requires approved source or scholar referral.',
      };
    case 'answer_key_request_blocked':
      return {
        studentSafeReason: 'I cannot provide answer keys. Let us work through the problem together.',
        teacherSafeReason: 'Answer key request blocked.',
      };
    case 'model_answer_request_blocked':
      return {
        studentSafeReason: 'I cannot provide model answers. Let us work through the problem together.',
        teacherSafeReason: 'Model answer request blocked.',
      };
    case 'unsafe_request_blocked':
      return {
        studentSafeReason: 'This request cannot be processed. Let us focus on your learning.',
        teacherSafeReason: 'Unsafe request blocked by routing policy.',
      };
    case 'insufficient_evidence':
      return {
        studentSafeReason: 'I do not have enough safe learning evidence yet. Start with a short learning or revision session.',
        teacherSafeReason: 'Insufficient learning evidence for learner.',
      };
    case 'teacher_assigned_priority':
      return {
        studentSafeReason: 'Your teacher has assigned a priority item.',
        teacherSafeReason: 'Teacher-assigned priority item due.',
      };
    case 'strong_mastery_ready_for_challenge':
      return {
        studentSafeReason: 'You have strong mastery. A revision check can help confirm readiness.',
        teacherSafeReason: 'Learner shows strong mastery signals — ready for challenge.',
      };
    case 'partial_mastery':
      return {
        studentSafeReason: 'You have partial mastery. Revisiting this topic can strengthen it.',
        teacherSafeReason: 'Partial mastery detected — revision recommended.',
      };
    case 'high_hint_dependency':
      return {
        studentSafeReason: 'You have been using hints frequently. Focus Mode can help build independence.',
        teacherSafeReason: 'High hint dependency detected.',
      };
    case 'recovery_after_struggle':
      return {
        studentSafeReason: 'Good recovery after a tough problem. A quick review can help solidify.',
        teacherSafeReason: 'Recovery after struggle — revision recommended for consolidation.',
      };
    case 'student_choice_requested':
      return {
        studentSafeReason: 'Continuing with your requested destination.',
        teacherSafeReason: 'Student-requested destination.',
      };
    default:
      return {
        studentSafeReason: 'Based on your learning evidence, this is the recommended next step.',
        teacherSafeReason: 'Default recommendation based on available evidence.',
      };
  }
}
