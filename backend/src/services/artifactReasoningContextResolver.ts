// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Reasoning Context Resolver v2
// Collects active artifact, tutor state, session, learner message,
// structured blocks, questions, safe summary, mastery, memory,
// and practice context for artifact-aware reasoning.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningRequest,
  ArtifactReasoningContext,
} from './artifactReasoningContracts';
import { structuredArtifactRepository } from './artifactStructuredRepository';
import { artifactSafeSummaryService } from './artifactSafeSummaryService';

export class ArtifactReasoningContextResolver {
  /**
   * Resolve the full artifact reasoning context from a request.
   */
  async resolveContext(request: ArtifactReasoningRequest): Promise<ArtifactReasoningContext> {
    const warnings: string[] = [];

    // Validate studentId
    if (!request.studentId || !request.studentId.trim()) {
      return {
        studentId: '',
        safeView: null,
        blocks: [],
        questions: [],
        topicMappings: [],
        learnerMessage: request.learnerMessage || '',
        isValid: false,
        warnings: ['Missing studentId — cannot resolve artifact reasoning context.'],
      };
    }

    // If no artifactId, return empty valid context
    if (!request.artifactId) {
      return {
        studentId: request.studentId,
        schoolId: request.schoolId || null,
        sessionId: request.sessionId || null,
        artifactId: null,
        safeView: null,
        blocks: [],
        questions: [],
        topicMappings: [],
        activeQuestionId: request.activeQuestionId || null,
        activeBlockId: request.activeBlockId || null,
        referencedQuestionNumber: request.referencedQuestionNumber || null,
        referencedSection: request.referencedSection || null,
        referencedPage: request.referencedPage || null,
        referencedTopic: request.referencedTopic || null,
        learningMode: request.learningMode || null,
        answerText: request.answerText || null,
        learnerMessage: request.learnerMessage,
        isValid: true,
        warnings: ['No active artifact — artifact reasoning unavailable.'],
      };
    }

    // Load structured artifact data
    const scope = {
      artifactId: request.artifactId,
      studentId: request.studentId,
      schoolId: request.schoolId || null,
    };

    const artifact = await structuredArtifactRepository.getStructuredArtifact(scope);
    if (!artifact) {
      return {
        studentId: request.studentId,
        schoolId: request.schoolId || null,
        sessionId: request.sessionId || null,
        artifactId: request.artifactId,
        safeView: null,
        blocks: [],
        questions: [],
        topicMappings: [],
        activeQuestionId: request.activeQuestionId || null,
        activeBlockId: request.activeBlockId || null,
        referencedQuestionNumber: request.referencedQuestionNumber || null,
        referencedSection: request.referencedSection || null,
        referencedPage: request.referencedPage || null,
        referencedTopic: request.referencedTopic || null,
        learningMode: request.learningMode || null,
        answerText: request.answerText || null,
        learnerMessage: request.learnerMessage,
        isValid: true,
        warnings: [`Structured artifact not found for artifactId=${request.artifactId}.`],
      };
    }

    // Load blocks and questions
    const blocks = await structuredArtifactRepository.listArtifactBlocks(scope, {});
    const questions = await structuredArtifactRepository.listArtifactQuestions(scope, {});

    // Filter to learner-visible only — also exclude answer key blocks
    const learnerVisibleBlocks = blocks.filter(
      (b) =>
        (b.visibility === 'learner_visible' || b.visibility === 'teacher_visible') &&
        b.blockType !== 'answer_key',
    );
    const learnerVisibleQuestions = questions.filter(
      (q) => q.learnerCanSeeAnswer && (q.questionType as string) !== 'answer_key',
    );

    // Build safe view
    const safeView = artifactSafeSummaryService.buildSafeSummary(
      artifact,
      learnerVisibleBlocks,
      learnerVisibleQuestions,
      artifact.topicMappings,
    );

    if (artifact.parserWarnings.length > 0) {
      warnings.push(...artifact.parserWarnings.slice(0, 5));
    }
    if (artifact.safetyFlags.length > 0) {
      warnings.push(`Safety flags: ${artifact.safetyFlags.join(', ')}`);
    }

    return {
      studentId: request.studentId,
      schoolId: request.schoolId || null,
      sessionId: request.sessionId || null,
      artifactId: request.artifactId,
      safeView,
      blocks: learnerVisibleBlocks,
      questions: learnerVisibleQuestions,
      topicMappings: artifact.topicMappings,
      activeQuestionId: request.activeQuestionId || null,
      activeBlockId: request.activeBlockId || null,
      referencedQuestionNumber: request.referencedQuestionNumber || null,
      referencedSection: request.referencedSection || null,
      referencedPage: request.referencedPage || null,
      referencedTopic: request.referencedTopic || null,
      learningMode: request.learningMode || null,
      answerText: request.answerText || null,
      learnerMessage: request.learnerMessage,
      isValid: true,
      warnings,
    };
  }
}

export const artifactReasoningContextResolver = new ArtifactReasoningContextResolver();
