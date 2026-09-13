// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner-Safe Intervention Response Builder v1
// Builds learner-facing intervention views.
// Learner can see: supportive instruction, topic/skill, due date,
//   next step, practice/reflection/video/artifact action.
// Learner must NOT see: teacher private notes, risk labels,
//   priority if shame-inducing, class comparisons, other students.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionAssignment,
  TeacherInterventionSafeLearnerView,
} from './teacherInterventionContracts';

/**
 * Build a learner-safe view of an intervention assignment.
 * Strips all teacher-only fields and sensitive information.
 */
export function buildLearnerSafeInterventionView(
  assignment: TeacherInterventionAssignment,
): TeacherInterventionSafeLearnerView {
  const nextStep = determineNextStep(assignment);

  // Use a safe, encouraging instruction if none provided
  const learnerInstruction = assignment.learnerFacingInstruction || buildDefaultInstruction(assignment);

  return {
    interventionId: assignment.interventionId,
    actionType: assignment.actionType,
    status: assignment.status,
    subject: assignment.subject,
    topic: assignment.topic,
    skillLabel: assignment.skillLabel,
    learnerFacingInstruction: learnerInstruction,
    dueAt: assignment.dueAt,
    nextStep,
    warnings: assignment.warnings.filter(
      (w) => !w.includes('risk') && !w.includes('shame') && !w.includes('comparison')
    ).slice(0, 3),
  };
}

/**
 * Determine the next step the learner should take.
 */
function determineNextStep(assignment: TeacherInterventionAssignment): string {
  switch (assignment.actionType) {
    case 'reteach_topic':
      return 'Your teacher has suggested revisiting this topic with a different approach.';
    case 'assign_foundation_practice':
      return 'Practice some foundational questions to strengthen your understanding.';
    case 'assign_similar_practice':
      return 'Try similar practice questions to reinforce what you have learned.';
    case 'assign_challenge_practice':
      return 'Ready for a challenge? Try these more advanced questions.';
    case 'teacher_check_in':
      return 'Your teacher will check in with you soon to see how you are doing.';
    case 'recommend_alternative_video':
      return 'Try watching a different video to see the topic explained in a new way.';
    case 'review_artifact_question':
      return 'Review the questions in your study material with your teacher\'s guidance.';
    case 'assign_reflection':
      return 'Take a moment to reflect on what you have learned so far.';
    case 'manual_teacher_note':
      return 'Your teacher has left you a note.';
    default:
      return 'Follow the instructions from your teacher.';
  }
}

/**
 * Build a default encouraging instruction when none is provided.
 */
function buildDefaultInstruction(assignment: TeacherInterventionAssignment): string {
  switch (assignment.actionType) {
    case 'reteach_topic':
      return `Let's look at ${assignment.topic || 'this topic'} from a different angle. You've got this!`;
    case 'assign_foundation_practice':
      return `Let's build a stronger foundation in ${assignment.topic || 'this area'}. Take your time!`;
    case 'assign_similar_practice':
      return `More practice will help make ${assignment.topic || 'this'} click. Keep going!`;
    case 'assign_challenge_practice':
      return `You're ready for a challenge in ${assignment.topic || 'this topic'}! Let's see what you can do.`;
    case 'teacher_check_in':
      return 'Your teacher wants to check in and see how things are going.';
    case 'recommend_alternative_video':
      return `Let's try a different video on ${assignment.topic || 'this topic'} — sometimes a new explanation makes all the difference.`;
    case 'review_artifact_question':
      return 'Take a moment to review the questions in your study material.';
    case 'assign_reflection':
      return 'Take a moment to think about what you have learned. What makes sense? What is still tricky?';
    default:
      return 'Keep up the great work! Your teacher believes in you.';
  }
}
