// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Action Policy v1
// Validates action types, required fields, default priorities.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionActionType,
  TeacherInterventionPriority,
  TeacherInterventionCreateRequest,
} from './teacherInterventionContracts';

export interface ActionPolicyResult {
  valid: boolean;
  actionType: TeacherInterventionActionType;
  priority: TeacherInterventionPriority;
  warnings: string[];
  errors: string[];
}

const SUPPORTED_ACTIONS: TeacherInterventionActionType[] = [
  'reteach_topic',
  'assign_foundation_practice',
  'assign_similar_practice',
  'assign_challenge_practice',
  'teacher_check_in',
  'recommend_alternative_video',
  'review_artifact_question',
  'assign_reflection',
  'manual_teacher_note',
  'dismiss_recommendation',
];

/**
 * Validate an intervention action request.
 */
export function validateInterventionAction(request: TeacherInterventionCreateRequest): ActionPolicyResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const actionType = request.actionType;

  // Check action is supported
  if (!SUPPORTED_ACTIONS.includes(actionType)) {
    errors.push(`Unsupported action type: ${actionType}. Supported: ${SUPPORTED_ACTIONS.join(', ')}`);
  }

  // Teacher reason is always required
  if (!request.teacherReason || request.teacherReason.trim().length === 0) {
    errors.push('Teacher reason is required for all interventions.');
  }

  // Check safety: prevent unsafe learner instruction
  if (request.learnerFacingInstruction) {
    const lower = request.learnerFacingInstruction.toLowerCase();
    if (lower.includes('you failed') || lower.includes('you are bad') || lower.includes('you are stupid')) {
      errors.push('Learner-facing instruction must be supportive and safe.');
    }
  }

  // Action-specific requirements
  switch (actionType) {
    case 'reteach_topic':
      if (!request.topic && !request.skillId) {
        errors.push('reteach_topic requires topic or skillId.');
      }
      break;
    case 'assign_foundation_practice':
      if (!request.topic && !request.skillId) {
        errors.push('assign_foundation_practice requires topic or skillId.');
      }
      break;
    case 'assign_similar_practice':
      if (!request.topic && !request.skillId) {
        errors.push('assign_similar_practice requires topic or skillId.');
      }
      break;
    case 'assign_challenge_practice':
      if (!request.topic && !request.skillId) {
        errors.push('assign_challenge_practice requires topic or skillId.');
      }
      break;
    case 'teacher_check_in':
      // teacherReason is already required
      break;
    case 'recommend_alternative_video':
      if (!request.topic && !request.skillId) {
        errors.push('recommend_alternative_video requires topic or skillId.');
      }
      break;
    case 'review_artifact_question':
      if (!request.artifactId && !request.questionId) {
        errors.push('review_artifact_question requires artifactId or questionId.');
      }
      break;
    case 'assign_reflection':
      if (!request.topic && !request.artifactId && !request.videoId && !request.watchSessionId) {
        errors.push('assign_reflection requires topic, artifactId, videoId, or watchSessionId.');
      }
      break;
    case 'manual_teacher_note':
      if (!request.teacherPrivateNote || request.teacherPrivateNote.trim().length === 0) {
        warnings.push('manual_teacher_note should include teacherPrivateNote.');
      }
      break;
    case 'dismiss_recommendation':
      // No specific requirements beyond teacher reason
      break;
  }

  // Prevent learner-visible manual note without explicit learner instruction
  if (actionType === 'manual_teacher_note' && !request.learnerFacingInstruction) {
    warnings.push('Manual teacher note without learner-facing instruction — note is teacher-private only.');
  }

  // Determine priority
  const defaultPriority: Record<TeacherInterventionActionType, TeacherInterventionPriority> = {
    reteach_topic: 'high',
    assign_foundation_practice: 'medium',
    assign_similar_practice: 'medium',
    assign_challenge_practice: 'low',
    teacher_check_in: 'medium',
    recommend_alternative_video: 'low',
    review_artifact_question: 'medium',
    assign_reflection: 'low',
    manual_teacher_note: 'low',
    dismiss_recommendation: 'low',
  };
  const priority = request.priority || defaultPriority[actionType] || 'medium';

  return {
    valid: errors.length === 0,
    actionType,
    priority,
    warnings,
    errors,
  };
}
