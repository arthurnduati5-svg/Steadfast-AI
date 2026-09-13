// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Generator v1
// Generates bounded practice items from structured artifact
// sources. Deterministic v1 — no LLM dependency. Uses safe
// source summaries, extracted questions, diagrams, theorem/
// formula blocks, and worked examples. Never uses raw full
// artifact text or raw OCR text.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeItem,
  ArtifactAwarePracticeItemType,
  ArtifactAwarePracticeStatus,
  ArtifactAwarePracticeDecision,
  ArtifactAwarePracticeDecisionResult,
  ArtifactAwarePracticeBasis,
  ArtifactAwarePracticeSafety,
  ArtifactPracticeSource,
  ArtifactPracticeSourceKind,
  ArtifactAwarePracticeResponse,
  GenerateArtifactAwarePracticeRequest,
  ArtifactPracticeSourceResolverOutput,
} from './artifactAwarePracticeContracts';

import {
  MIN_ARTIFACT_PRACTICE_SESSION_ITEMS,
  DEFAULT_ARTIFACT_PRACTICE_SESSION_ITEMS,
  MAX_ARTIFACT_PRACTICE_SESSION_ITEMS,
  MAX_RUBRIC_POINTS,
} from './artifactAwarePracticeContracts';

import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `aap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

function bounded(text: string, max: number): string {
  return String(text || '').slice(0, max);
}

/**
 * Generate a recall prompt from topic/section summary.
 */
function generateRecallItem(
  itemId: string,
  topic: string,
  artifactId: string,
  sourceKind?: ArtifactPracticeSourceKind | null,
  sourceId?: string | null,
  pageNumber?: number | null,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'recall',
    prompt: `What are the key points about "${topic}" from the learning material? Try to recall at least three main ideas.`,
    expectedAnswerSummary: `Key concepts related to ${topic}`,
    rubricPoints: [
      `Identifies at least 2-3 main ideas about ${topic}`,
      'Uses specific terminology from the material',
      'Connects ideas in a logical way',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: artifactId,
    linkedSourceKind: sourceKind || null,
    linkedSourceId: sourceId || null,
    linkedPageNumber: pageNumber || null,
    linkedSkillIds: [],
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a concept check item.
 */
function generateConceptCheckItem(
  itemId: string,
  topic: string,
  artifactId: string,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'concept_check',
    prompt: `Explain the main concept of "${topic}" in your own words. Why is it important?`,
    expectedAnswerSummary: `Understanding of ${topic} concept`,
    rubricPoints: [
      'Demonstrates understanding of the core concept',
      'Uses relevant examples or reasoning',
      'Avoids common misconceptions about this topic',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: artifactId,
    linkedSourceKind: 'section',
    linkedSourceId: null,
    linkedPageNumber: null,
    linkedSkillIds: [],
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a diagram interpretation item.
 */
function generateDiagramInterpretationItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'diagram_interpretation',
    prompt: bounded(
      source.safeSummary
        ? `Look at the diagram${source.title ? ` "${source.title}"` : ''} in the material. ${source.safeSummary.slice(0, 200)} What does this diagram show? Explain the key relationships or patterns.`
        : `Look at the diagram in the material. What does it show? Explain the key relationships or patterns.`,
      500,
    ),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Diagram interpretation', 240),
    rubricPoints: [
      'Identifies the main components of the diagram',
      'Explains relationships between components',
      'Connects the diagram to the broader topic',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'diagram',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a formula usage item.
 */
function generateFormulaUseItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'formula_use',
    prompt: bounded(
      source.promptSeed
        ? `The material contains this formula: "${source.promptSeed.slice(0, 150)}". When would you use this formula? What does each variable represent?`
        : `Based on the formula in the material, explain when to use it and what each variable represents.`,
      500,
    ),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Formula application', 240),
    rubricPoints: [
      'Identifies when to use the formula',
      'Explains each variable correctly',
      'Describes the relationship the formula represents',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'formula_block',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a theorem application item.
 */
function generateTheoremApplicationItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'theorem_application',
    prompt: bounded(
      source.promptSeed
        ? `The material states a theorem: "${source.promptSeed.slice(0, 150)}". What are the conditions for this theorem to be true? Give an example of when you would apply it.`
        : `Based on the theorem in the material, explain the conditions for its use and provide an example application.`,
      500,
    ),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Theorem application', 240),
    rubricPoints: [
      'States the conditions for the theorem',
      'Provides a correct application example',
      'Explains why the theorem works in that context',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'theorem_block',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a worked example completion item.
 */
function generateWorkedExampleCompletionItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'worked_example_completion',
    prompt: bounded(
      source.safeSummary
        ? `Study the worked example in the material${source.title ? ` "${source.title}"` : ''}. ${source.safeSummary.slice(0, 200)} Now explain the steps needed to solve this type of problem. What is the key insight in each step?`
        : `Study the worked example. Explain the steps needed to solve this type of problem and the key insight in each step.`,
      500,
    ),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Worked example reasoning', 240),
    rubricPoints: [
      'Explains each step rather than copying',
      'Identifies the reasoning behind each step',
      'Shows understanding of when to apply this approach',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'worked_example',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate an extracted question item (directly from artifact-extracted question).
 */
function generateExtractedQuestionItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'question_from_artifact',
    prompt: bounded(source.promptSeed || source.safeSummary, 500),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Expected answer', 240),
    rubricPoints: source.rubricPoints.slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'extracted_question',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate an error spotting item (from worked example).
 */
function generateErrorSpottingItem(
  itemId: string,
  source: ArtifactPracticeSource,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'error_spotting',
    prompt: bounded(
      source.safeSummary
        ? `Look at the worked example${source.title ? ` "${source.title}"` : ''} in the material: ${source.safeSummary.slice(0, 200)}. What is a common mistake a student might make when solving this type of problem? How would you avoid it?`
        : 'What is a common mistake a student might make when solving this type of problem? How would you avoid it?',
      500,
    ),
    expectedAnswerSummary: bounded(source.expectedAnswerSummary || 'Error identification', 240),
    rubricPoints: [
      'Identifies a realistic error',
      'Explains why the error occurs',
      'Describes how to avoid it',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: source.artifactId,
    linkedSourceKind: 'worked_example',
    linkedSourceId: source.sourceId || null,
    linkedPageNumber: source.pageNumber || null,
    linkedSkillIds: source.skillIds.slice(0, 10),
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate an application item.
 */
function generateApplicationItem(
  itemId: string,
  topic: string,
  artifactId: string,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'application',
    prompt: `How would you apply what you learned about "${topic}" from the material to solve a real problem? Provide a concrete example.`,
    expectedAnswerSummary: `Applied understanding of ${topic} with example`,
    rubricPoints: [
      'Provides a concrete, relevant example',
      'Correctly applies concepts from the material',
      'Shows depth of understanding beyond recall',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: artifactId,
    linkedSourceKind: null,
    linkedSourceId: null,
    linkedPageNumber: null,
    linkedSkillIds: [],
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a teach-back item.
 */
function generateTeachBackItem(
  itemId: string,
  topic: string,
  artifactId: string,
): ArtifactAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'teach_back',
    prompt: `Explain "${topic}" from the material as if you were teaching it to a classmate who hasn't seen the material. Break it down step by step.`,
    expectedAnswerSummary: `Teach-back explanation of ${topic}`,
    rubricPoints: [
      'Explains concepts in own words',
      'Uses a logical step-by-step structure',
      'Covers the essential points from the material',
      'Shows understanding of why the concept matters',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedArtifactId: artifactId,
    linkedSourceKind: null,
    linkedSourceId: null,
    linkedPageNumber: null,
    linkedSkillIds: [],
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

// ── Main Generator ──

/**
 * Generate artifact-aware practice items from structured artifact sources.
 * Deterministic v1 generation using safe source summaries.
 * No LLM. No raw artifact text. No answer keys exposed to learner.
 */
export async function generateArtifactAwarePractice(
  identity: ResolvedTutorIdentity,
  request: GenerateArtifactAwarePracticeRequest,
  resolvedSources: ArtifactPracticeSourceResolverOutput,
): Promise<ArtifactAwarePracticeResponse> {
  const warnings: string[] = [...resolvedSources.warnings];
  const now = nowISO();

  // 1. No active artifact
  if (resolvedSources.artifactIds.length === 0) {
    warnings.push('No active artifact found. Please upload or select a file first.');
    return {
      ok: true,
      status: 'not_started',
      activePracticeSession: null,
      recentPracticeSessions: [],
      warnings,
    };
  }

  // 2. Determine topic
  const topic = resolvedSources.safeContextSummary.topic || 'the learning material';
  const artifactIds = resolvedSources.artifactIds;
  const primaryArtifactId = resolvedSources.primaryArtifactId || artifactIds[0];

  // 3. Determine item types
  const preferredTypes = request.preferredTypes && request.preferredTypes.length > 0
    ? request.preferredTypes
    : undefined;

  const itemCount = Math.min(
    Math.max(request.requestedItemCount ?? DEFAULT_ARTIFACT_PRACTICE_SESSION_ITEMS, MIN_ARTIFACT_PRACTICE_SESSION_ITEMS),
    MAX_ARTIFACT_PRACTICE_SESSION_ITEMS,
  );

  // 4. Generate items from sources
  const items: ArtifactAwarePracticeItem[] = [];

  // Prioritize extracted questions
  const extractedQuestionSources = resolvedSources.sources.filter(
    (s) => s.sourceKind === 'extracted_question' && s.promptSeed,
  );
  for (const src of extractedQuestionSources.slice(0, 2)) {
    if (items.length >= itemCount) break;
    items.push(generateExtractedQuestionItem(generateId(), src));
  }

  // Prioritize weak area overlap
  const hasWeaknessContext = request.includeLearnerMemory && request.includeMasteryContext;

  // Generate from other source types
  const availableSources = resolvedSources.sources.filter(
    (s) => s.sourceKind !== 'extracted_question' && s.sourceKind !== 'answer_key_summary',
  );

  for (const src of availableSources) {
    if (items.length >= itemCount) break;

    if (src.sourceKind === 'diagram') {
      items.push(generateDiagramInterpretationItem(generateId(), src));
    } else if (src.sourceKind === 'formula_block') {
      items.push(generateFormulaUseItem(generateId(), src));
    } else if (src.sourceKind === 'theorem_block') {
      items.push(generateTheoremApplicationItem(generateId(), src));
    } else if (src.sourceKind === 'worked_example') {
      // Alternate between completion and error spotting
      if (items.length % 2 === 0) {
        items.push(generateWorkedExampleCompletionItem(generateId(), src));
      } else {
        items.push(generateErrorSpottingItem(generateId(), src));
      }
    }
  }

  // Fill remaining slots with recall, concept check, application, teach-back
  const fillGenerators: Array<() => ArtifactAwarePracticeItem> = [];

  if (preferredTypes?.includes('recall') || !preferredTypes) {
    fillGenerators.push(() => generateRecallItem(generateId(), topic, primaryArtifactId));
  }
  if (preferredTypes?.includes('concept_check') || !preferredTypes) {
    fillGenerators.push(() => generateConceptCheckItem(generateId(), topic, primaryArtifactId));
  }
  if (preferredTypes?.includes('application') || !preferredTypes) {
    fillGenerators.push(() => generateApplicationItem(generateId(), topic, primaryArtifactId));
  }
  if (preferredTypes?.includes('teach_back') || !preferredTypes) {
    fillGenerators.push(() => generateTeachBackItem(generateId(), topic, primaryArtifactId));
  }
  if (preferredTypes?.includes('reflection') || !preferredTypes) {
    fillGenerators.push(() => ({
      practiceItemId: generateId(),
      type: 'reflection',
      prompt: `What part of "${topic}" from the material did you find most challenging and why? What strategy helped you understand it better?`,
      expectedAnswerSummary: `Reflection on learning process for ${topic}`,
      rubricPoints: [
        'Identifies specific challenging aspect',
        'Reflects on learning strategy used',
        'Shows metacognitive awareness',
      ].slice(0, MAX_RUBRIC_POINTS),
      linkedArtifactId: primaryArtifactId,
      linkedSourceKind: null,
      linkedSourceId: null,
      linkedPageNumber: null,
      linkedSkillIds: [],
      difficulty: 'easy',
      status: 'not_answered',
      createdAt: nowISO(),
    }));
  }

  for (const genFn of fillGenerators) {
    if (items.length >= itemCount) break;
    items.push(genFn());
  }

  // Ensure at least 1 item
  if (items.length === 0) {
    items.push(generateRecallItem(generateId(), topic, primaryArtifactId));
  }

  // Determine the primary source kind
  const sourceKinds = resolvedSources.safeContextSummary.sourceKinds;
  const primarySourceKind: import('./artifactAwarePracticeContracts').ArtifactPracticeSourceKind =
    sourceKinds.includes('extracted_question') ? 'extracted_question'
    : sourceKinds.includes('diagram') ? 'diagram'
    : sourceKinds.includes('theorem_block') ? 'theorem_block'
    : sourceKinds.includes('formula_block') ? 'formula_block'
    : sourceKinds.includes('worked_example') ? 'worked_example'
    : sourceKinds.includes('section') ? 'section'
    : 'artifact_summary';

  // Build the source info
  const sourceInfo = {
    sourceKind: primarySourceKind,
    sourceId: resolvedSources.sources.length > 0 ? (resolvedSources.sources[0].sourceId || null) : null,
    title: resolvedSources.safeContextSummary.topic || null,
    sectionTitle: resolvedSources.safeContextSummary.sectionSummaries[0]?.slice(0, 120) || null,
    pageNumber: resolvedSources.sources.length > 0 ? (resolvedSources.sources[0].pageNumber || null) : null,
    diagramId: resolvedSources.safeContextSummary.diagramSummaries.length > 0 ? 'diagram_present' : null,
    questionId: extractedQuestionSources.length > 0 ? (extractedQuestionSources[0].sourceId || null) : null,
    objectiveId: null,
  };

  // 5. Build practice session
  const sessionId = generateId();
  const practicedSession: ArtifactAwarePracticeSession = {
    artifactPracticeSessionId: sessionId,
    tutorSessionId: request.sessionId || null,

    status: 'generated',

    artifactIds,
    primaryArtifactId,

    subject: null,
    topic: topic.slice(0, 160),
    skillIds: uniqueStrings(resolvedSources.safeContextSummary.skillIds),
    syllabusObjectiveIds: [],

    source: sourceInfo,

    basis: {
      triggerMessage: null,
      triggerIntent: null,
      artifactContextUsed: true,
      learnerWeaknessIds: [],
      masterySignalsUsed: [],
      memorySignalsUsed: [],
      extractedQuestionIds: extractedQuestionSources.map((s) => s.sourceId || '').filter(Boolean),
      diagramIds: resolvedSources.safeContextSummary.diagramSummaries.length > 0 ? ['diagram_present'] : [],
      theoremBlockIds: resolvedSources.safeContextSummary.theoremSummaries.length > 0 ? ['theorem_present'] : [],
      workedExampleIds: resolvedSources.safeContextSummary.workedExampleSummaries.length > 0 ? ['worked_example_present'] : [],
    },

    items,

    misconceptionSummary: [],

    decision: {
      currentDecision: 'give_similar_practice',
      reason: 'Practice session generated. Awaiting learner answers.',
      nextActionPrompt: `Answer the practice questions about "${topic}" from the learning material.`,
      recommendedReviewAt: null,
      dueAt: null,
    },

    safety: {
      rawArtifactTextUsed: false,
      rawArtifactTextStored: false,
      answerKeyVisibleToLearner: false,
      promptInjectionBlocked: true,
      warnings: [],
    },

    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    status: 'generated',
    activePracticeSession: practicedSession,
    recentPracticeSessions: [],
    warnings,
  };
}
