// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor Task Planner Service v1
// Converts a resolved intent into a safe, structured downstream
// tutor task with context boundaries and output expectations.
// ─────────────────────────────────────────────────────────────

import type {
  TutorIntent,
  TutorTaskPlan,
  TutorTaskKind,
  OutputExpectation,
  AllowedContext,
} from './intentResolverContracts';

export interface TaskPlannerInput {
  primaryIntent: TutorIntent;
  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  artifactIds: string[];
  artifactBlockIds: string[];
  videoId?: string | null;
  sourceIds: string[];
  practiceRecommendationIds: string[];
  memoryIds: string[];
  masteryIds: string[];
  hasLearnerAnswer: boolean;
  hasActiveArtifact: boolean;
  hasActiveTopic: boolean;
  hasPracticeRecommendations: boolean;
  hasReviewDue: boolean;
  hasVerifiedSources: boolean;
}

// ── TutorTaskPlannerService ──

export class TutorTaskPlannerService {
  /**
   * Plan a tutor task based on the resolved intent and available context.
   */
  planTutorTask(input: TaskPlannerInput): TutorTaskPlan {
    const {
      primaryIntent,
      subject,
      topic,
      skillIds,
      artifactIds,
      artifactBlockIds,
      videoId,
      sourceIds,
      practiceRecommendationIds,
      memoryIds,
      masteryIds,
      hasLearnerAnswer,
      hasActiveArtifact,
      hasActiveTopic,
      hasPracticeRecommendations,
      hasReviewDue,
      hasVerifiedSources,
    } = input;

    switch (primaryIntent) {
      case 'explain':
        return this._buildPlan({
          taskKind: 'explain_concept',
          outputExpectation: 'scaffolded_explanation',
          allowedContext: hasActiveTopic ? 'combined' : 'message_only',
          instruction: hasActiveTopic
            ? `Explain "${topic || subject || 'this topic'}" with a structured, scaffolded explanation. Start simple, then build depth. End with a comprehension check.`
            : 'The learner wants an explanation but no specific topic is active. Ask what they would like explained, then provide a scaffolded explanation.',
          forbiddenContext: hasActiveTopic ? [] : ['artifact_context', 'practice_mastery'],
        });

      case 'reteach':
        return this._buildPlan({
          taskKind: 'reteach_concept',
          outputExpectation: 'step_by_step',
          allowedContext: 'combined',
          instruction: hasActiveTopic
            ? `Reteach "${topic || subject}" from a different angle. Break it into smaller steps. Check understanding after each step. Use memory of recent mistakes to guide focus.`
            : 'Reteach the concept carefully. Use simple examples and check understanding at each step.',
          forbiddenContext: ['artifact_context'],
        });

      case 'simplify':
        return this._buildPlan({
          taskKind: 'simplify_explanation',
          outputExpectation: 'step_by_step',
          allowedContext: hasActiveTopic ? 'combined' : 'message_only',
          instruction: hasActiveTopic
            ? `Simplify the explanation of "${topic || subject}". Use plain language, shorter sentences, and one concrete example. Check if the learner wants to go deeper.`
            : 'Simplify your response. Use plain language and check if they want more detail.',
          forbiddenContext: [],
        });

      case 'practice':
        if (hasPracticeRecommendations) {
          return this._buildPlan({
            taskKind: 'select_or_generate_practice',
            outputExpectation: 'question_only',
            allowedContext: 'practice_mastery',
            instruction: 'Use the available next-practice recommendations to select an appropriate practice problem. Present it to the learner and guide them through the solution step by step. Do not give the answer immediately.',
            forbiddenContext: ['artifact_context'],
          });
        }
        return this._buildPlan({
          taskKind: 'select_or_generate_practice',
          outputExpectation: 'question_only',
          allowedContext: hasActiveTopic ? 'tutor_state' : 'message_only',
          instruction: hasActiveTopic
            ? `Generate a practice question on "${topic || subject}". Start with medium difficulty. Do not give the answer. Guide the learner step by step.`
            : 'No practice recommendations or topic available. Ask what topic they want to practice, then generate a practice question.',
          forbiddenContext: [],
        });

      case 'quiz':
        if (!hasActiveTopic && !hasPracticeRecommendations) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask what topic the learner would like to be quizzed on.',
            forbiddenContext: [],
          });
        }
        return this._buildPlan({
          taskKind: 'generate_quiz',
          outputExpectation: 'quiz',
          allowedContext: 'combined',
          instruction: `Generate a short quiz on "${topic || subject}". Include 3-5 questions. Let the learner answer each before providing feedback.`,
          forbiddenContext: [],
        });

      case 'review':
        if (hasReviewDue) {
          return this._buildPlan({
            taskKind: 'review_due_material',
            outputExpectation: 'question_only',
            allowedContext: 'practice_mastery',
            instruction: 'The learner has review due. Present the due material and check recall with 1-2 questions.',
            forbiddenContext: [],
          });
        }
        return this._buildPlan({
          taskKind: 'review_due_material',
          outputExpectation: 'general',
          allowedContext: hasActiveTopic ? 'combined' : 'message_only',
          instruction: hasActiveTopic
            ? `Review "${topic || subject}" with the learner. Summarize key points and ask what they remember.`
            : 'Ask what topic they want to review, then summarize key points and check recall.',
          forbiddenContext: [],
        });

      case 'revise':
        return this._buildPlan({
          taskKind: 'revision_plan',
          outputExpectation: 'revision_plan',
          allowedContext: 'combined',
          instruction: 'Create a short revision plan. Include key areas to focus on based on available context. Suggest 2-3 actionable steps.',
          forbiddenContext: [],
        });

      case 'check_answer':
        if (!hasLearnerAnswer) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask the learner to share their answer first before checking it.',
            forbiddenContext: [],
          });
        }
        return this._buildPlan({
          taskKind: 'evaluate_answer',
          outputExpectation: 'answer_check',
          allowedContext: 'combined',
          instruction: 'Evaluate the learner\'s answer. Point out what is correct first, then guide on what needs improvement. Do not give the full answer immediately — use hints.',
          forbiddenContext: [],
        });

      case 'artifact_help':
        if (!hasActiveArtifact) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask which file the learner wants help with, as no active file is attached.',
            forbiddenContext: ['artifact_context'],
          });
        }
        return this._buildPlan({
          taskKind: 'query_artifact',
          outputExpectation: 'general',
          allowedContext: 'artifact_context',
          instruction: 'Look up the active artifact. Answer the learner\'s question using the artifact content. Do not share answer keys directly. Use the artifact as context for teaching.',
          forbiddenContext: [],
        });

      case 'artifact_question_help':
        if (!hasActiveArtifact) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask which file or question the learner needs help with.',
            forbiddenContext: ['artifact_context'],
          });
        }
        return this._buildPlan({
          taskKind: 'explain_artifact_block',
          outputExpectation: 'scaffolded_explanation',
          allowedContext: 'artifact_context',
          instruction: 'Use the active artifact to identify the relevant block or question. Explain it step by step. Do not reveal answer keys directly.',
          forbiddenContext: [],
        });

      case 'source_verification':
        if (!hasVerifiedSources && input.sourceIds.length === 0) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask the learner to share the source or claim they want verified.',
            forbiddenContext: ['source_trust'],
          });
        }
        return this._buildPlan({
          taskKind: 'verify_sources',
          outputExpectation: 'source_verification',
          allowedContext: 'source_trust',
          instruction: 'Check the provided sources against available verified sources. Share confidence level and any concerns.',
          forbiddenContext: [],
        });

      case 'video_help':
        if (!videoId) {
          return this._buildPlan({
            taskKind: 'ask_clarifying_question',
            outputExpectation: 'clarification_question',
            allowedContext: 'message_only',
            instruction: 'Ask which video the learner needs help with.',
            forbiddenContext: ['video_context'],
          });
        }
        return this._buildPlan({
          taskKind: 'explain_video_context',
          outputExpectation: 'scaffolded_explanation',
          allowedContext: 'combined',
          instruction: 'Use the active video context to help the learner. Summarize the relevant part and clarify their confusion.',
          forbiddenContext: [],
        });

      case 'next_practice':
        return this._buildPlan({
          taskKind: 'recommend_next_practice',
          outputExpectation: 'question_only',
          allowedContext: 'practice_mastery',
          instruction: 'Use the next-practice recommendations to suggest what to practice next. Explain why this is a good next step.',
          forbiddenContext: [],
        });

      case 'progress_check':
        return this._buildPlan({
          taskKind: 'summarize_progress',
          outputExpectation: 'general',
          allowedContext: 'combined',
          instruction: 'Summarize the learner\'s progress. Mention recent practice results, mastered skills, and areas needing review. Keep it encouraging and specific.',
          forbiddenContext: [],
        });

      case 'study_plan':
        return this._buildPlan({
          taskKind: 'revision_plan',
          outputExpectation: 'revision_plan',
          allowedContext: 'combined',
          instruction: 'Help the learner create a study plan. Suggest a logical sequence of topics based on what they need to work on.',
          forbiddenContext: [],
        });

      case 'general_chat':
        return this._buildPlan({
          taskKind: 'general_response',
          outputExpectation: 'general',
          allowedContext: 'combined',
          instruction: 'Respond to the learner\'s message in a helpful, friendly way. Be concise and direct.',
          forbiddenContext: [],
        });

      case 'clarification_needed':
        return this._buildPlan({
          taskKind: 'ask_clarifying_question',
          outputExpectation: 'clarification_question',
          allowedContext: 'message_only',
          instruction: 'The learner\'s intent is unclear. Ask a clarification question to determine what they need.',
          forbiddenContext: ['artifact_context', 'practice_mastery', 'source_trust'],
        });

      case 'unsupported':
        return this._buildPlan({
          taskKind: 'general_response',
          outputExpectation: 'general',
          allowedContext: 'message_only',
          instruction: 'The learner\'s request is not supported by the current system. Respond helpfully and suggest alternative ways the tutor can assist.',
          forbiddenContext: ['artifact_context', 'practice_mastery', 'source_trust', 'learner_profile'],
        });

      case 'unsafe':
        return this._buildPlan({
          taskKind: 'refuse_or_redirect',
          outputExpectation: 'safe_refusal',
          allowedContext: 'message_only',
          instruction: 'The learner\'s request was flagged as potentially unsafe or inappropriate. Politely refuse and redirect to appropriate learning topics.',
          forbiddenContext: ['artifact_context', 'practice_mastery', 'source_trust', 'learner_profile', 'tutor_state'],
        });

      default:
        return this._buildPlan({
          taskKind: 'general_response',
          outputExpectation: 'general',
          allowedContext: 'message_only',
          instruction: 'Respond helpfully to the learner.',
          forbiddenContext: [],
        });
    }
  }

  /**
   * Build a TutorTaskPlan from partial fields.
   */
  private _buildPlan(fields: {
    taskKind: TutorTaskKind;
    outputExpectation: OutputExpectation;
    allowedContext: AllowedContext;
    instruction: string;
    forbiddenContext: string[];
  }): TutorTaskPlan {
    return {
      taskKind: fields.taskKind,
      subject: null,
      topic: null,
      skillIds: [],
      artifactIds: [],
      artifactBlockIds: [],
      videoId: null,
      sourceIds: [],
      practiceRecommendationIds: [],
      memoryIds: [],
      masteryIds: [],
      instruction: fields.instruction,
      allowedContext: fields.allowedContext,
      forbiddenContext: fields.forbiddenContext,
      outputExpectation: fields.outputExpectation,
    };
  }
}

// Singleton
export const tutorTaskPlannerService = new TutorTaskPlannerService();
