'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeftRight,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import type { RevisionFlashcard, RevisionItem, UpdateRevisionItemRequest } from '@/lib/types';
import {
  buildLearningSignalsSnapshot,
  type LearningSignalsSnapshot,
} from '@/lib/learning-signals';
import {
  buildStudyToolRecommendation,
  evaluateQuickCheckAnswer,
  evaluateTeachBackResponse,
  evaluateTransferResponse,
  type StudyQuickCheckQuestion,
  type StudyResponseEvaluation,
  type StudyTeachBackEvaluation,
  type StudyToolId,
  type StudyToolPurpose,
  type StudyToolRecommendationEntry,
} from '@/lib/study-tool-recommendation';

interface StudyToolsSectionProps {
  item: RevisionItem;
  existingFlashcards?: RevisionFlashcard[];
  onUpdateItem?: (item: RevisionItem, patch: UpdateRevisionItemRequest) => Promise<void> | void;
  onSaveStudentNote?: (item: RevisionItem, studentNote: string) => Promise<void> | void;
  onTogglePin?: (item: RevisionItem) => Promise<void> | void;
  viewportTargetId?: string | null;
  onViewportActiveChange?: (active: boolean) => void;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

const MASTERY_RANK: Record<'still_learning' | 'getting_better' | 'almost_there' | 'confident', number> = {
  still_learning: 0,
  getting_better: 1,
  almost_there: 2,
  confident: 3,
};

const DIRECT_SIGNAL_OPTIONS = [
  { value: '', label: 'Choose an optional note...' },
  { value: 'simpler_example', label: 'Need simpler example' },
  { value: 'compare_view', label: 'Need compare view' },
  { value: 'quick_test', label: 'Ready for quick test' },
  { value: 'still_confused', label: 'Still confused' },
] as const;

function mapOutcomeFromCorrectness(correctness: StudyResponseEvaluation['correctness']): 'correct' | 'partial' | 'struggled' {
  if (correctness === 'correct') return 'correct';
  if (correctness === 'partial') return 'partial';
  return 'struggled';
}

function mapTeachBackOutcome(correctness: StudyTeachBackEvaluation['correctness']): 'correct' | 'partial' | 'struggled' {
  if (correctness === 'strong') return 'correct';
  if (correctness === 'partial') return 'partial';
  return 'struggled';
}

function getPurposeLabel(purpose: StudyToolPurpose): string {
  if (purpose === 'recall') return 'Recall';
  if (purpose === 'visual') return 'Visual';
  if (purpose === 'understanding') return 'Understanding';
  return 'Practice';
}

export function StudyToolsSection({
  item,
  existingFlashcards = [],
  onUpdateItem,
  onSaveStudentNote,
  viewportTargetId,
  onViewportActiveChange,
}: StudyToolsSectionProps) {
  const recommendation = React.useMemo(
    () => buildStudyToolRecommendation({ item, existingFlashcards }),
    [item, existingFlashcards]
  );

  const [activeToolId, setActiveToolId] = React.useState<StudyToolId | null>(null);
  const [openedTools, setOpenedTools] = React.useState<Record<string, true>>({});

  const [flashcardOrder, setFlashcardOrder] = React.useState<number[]>([]);
  const [flashcardIndex, setFlashcardIndex] = React.useState(0);
  const [flashcardReveal, setFlashcardReveal] = React.useState(false);

  const [teachBackDraft, setTeachBackDraft] = React.useState('');
  const [teachBackResult, setTeachBackResult] = React.useState<StudyTeachBackEvaluation | null>(null);

  const [quickCheckIndex, setQuickCheckIndex] = React.useState(0);
  const [quickCheckDraft, setQuickCheckDraft] = React.useState('');
  const [quickCheckResults, setQuickCheckResults] = React.useState<Record<string, StudyResponseEvaluation>>({});
  const [isQuickCheckComplete, setIsQuickCheckComplete] = React.useState(false);

  const [transferDraft, setTransferDraft] = React.useState('');
  const [transferResult, setTransferResult] = React.useState<StudyResponseEvaluation | null>(null);

  const [completedTools, setCompletedTools] = React.useState<Record<string, true>>({});
  const [toolOpenedAtMs, setToolOpenedAtMs] = React.useState<Record<string, number>>({});
  const [quickDismissCount, setQuickDismissCount] = React.useState(0);
  const [responseWordSamples, setResponseWordSamples] = React.useState<number[]>([]);
  const [directSignalChoice, setDirectSignalChoice] = React.useState<string>('');
  const [savedDirectSignals, setSavedDirectSignals] = React.useState<string[]>([]);
  const [lastMeaningfulEvidenceAt, setLastMeaningfulEvidenceAt] = React.useState<string | null>(null);

  const [isSavingCoachSignal, setIsSavingCoachSignal] = React.useState(false);
  const [isSavingArtifact, setIsSavingArtifact] = React.useState(false);
  const [toolError, setToolError] = React.useState<string | null>(null);
  const [isViewportCasting, setIsViewportCasting] = React.useState(false);
  const workspaceViewportRef = React.useRef<HTMLElement | null>(null);
  const castTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const allTools = React.useMemo(() => {
    const seen = new Set<StudyToolId>();
    return [...recommendation.recommendedTools, ...recommendation.optionalTools].filter((tool) => {
      if (seen.has(tool.id)) return false;
      seen.add(tool.id);
      return true;
    });
  }, [recommendation.optionalTools, recommendation.recommendedTools]);

  const availableToolIds = React.useMemo(() => new Set(allTools.map((tool) => tool.id)), [allTools]);
  const recommendedToolIds = React.useMemo(
    () => new Set(recommendation.recommendedTools.map((tool) => tool.id)),
    [recommendation.recommendedTools]
  );
  const groupedTools = React.useMemo(
    () =>
      (['recall', 'visual', 'understanding', 'practice'] as StudyToolPurpose[])
        .map((purpose) => ({
          purpose,
          label: getPurposeLabel(purpose),
          tools: allTools.filter((tool) => tool.purpose === purpose),
        }))
        .filter((group) => group.tools.length > 0),
    [allTools]
  );

  const activeTool = React.useMemo(
    () => allTools.find((tool) => tool.id === activeToolId) || null,
    [activeToolId, allTools]
  );
  const openedToolIds = React.useMemo(
    () => Object.keys(openedTools) as StudyToolId[],
    [openedTools]
  );
  const completedToolIds = React.useMemo(
    () => Object.keys(completedTools) as StudyToolId[],
    [completedTools]
  );
  const savedArtifactToolIds = React.useMemo(() => {
    const studyToolsRecord = asRecord(asRecord(item.metadata)?.studyTools) || {};
    const savedArtifacts = asRecord(studyToolsRecord.savedArtifacts) || {};
    return Object.keys(savedArtifacts) as StudyToolId[];
  }, [item.metadata]);

  const flashcards = recommendation.generatedArtifacts.flashcards.cards;
  const quickCheckQuestions = recommendation.generatedArtifacts.quickCheck.questions;
  const activeQuickCheckQuestion: StudyQuickCheckQuestion | null =
    quickCheckQuestions[Math.min(quickCheckIndex, Math.max(quickCheckQuestions.length - 1, 0))] || null;
  const quickCheckResultList = React.useMemo(
    () => Object.values(quickCheckResults),
    [quickCheckResults]
  );
  const learningSignals = React.useMemo(
    () =>
      buildLearningSignalsSnapshot({
        item,
        runtime: {
          openedTools: openedToolIds,
          completedTools: completedToolIds,
          savedArtifacts: savedArtifactToolIds,
          quickCheckResults: quickCheckResultList,
          quickCheckCompleted: isQuickCheckComplete,
          teachBackResult,
          transferResult,
          responseWordSamples,
          quickDismissCount,
          directFeedbackSignals: savedDirectSignals,
          lastMeaningfulEvidenceAt,
        },
      }),
    [
      completedToolIds,
      isQuickCheckComplete,
      item,
      lastMeaningfulEvidenceAt,
      openedToolIds,
      quickCheckResultList,
      quickDismissCount,
      responseWordSamples,
      savedArtifactToolIds,
      savedDirectSignals,
      teachBackResult,
      transferResult,
    ]
  );
  const lastPersistedLearningSignalsRef = React.useRef<string>('');

  React.useEffect(() => {
    const defaultOrder = flashcards.map((_, index) => index);
    setFlashcardOrder(defaultOrder);
  }, [flashcards]);

  React.useEffect(() => {
    setActiveToolId(null);
    setOpenedTools({});
    setCompletedTools({});
    setToolOpenedAtMs({});
    setQuickDismissCount(0);
    setResponseWordSamples([]);
    setFlashcardIndex(0);
    setFlashcardReveal(false);
    setTeachBackDraft('');
    setTeachBackResult(null);
    setQuickCheckIndex(0);
    setQuickCheckDraft('');
    setQuickCheckResults({});
    setIsQuickCheckComplete(false);
    setTransferDraft('');
    setTransferResult(null);
    setDirectSignalChoice('');
    setSavedDirectSignals([]);
    setLastMeaningfulEvidenceAt(null);
    setIsSavingCoachSignal(false);
    setIsSavingArtifact(false);
    setToolError(null);
  }, [item.id]);

  React.useEffect(() => {
    if (!activeToolId) return;
    if (availableToolIds.has(activeToolId)) return;
    setActiveToolId(null);
  }, [activeToolId, availableToolIds]);

  React.useEffect(() => {
    lastPersistedLearningSignalsRef.current = '';
  }, [item.id]);

  React.useEffect(() => {
    return () => {
      if (castTimerRef.current) {
        clearTimeout(castTimerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    onViewportActiveChange?.(Boolean(activeToolId));
  }, [activeToolId, onViewportActiveChange]);

  React.useEffect(() => {
    return () => {
      onViewportActiveChange?.(false);
    };
  }, [onViewportActiveChange]);

  React.useEffect(() => {
    if (!activeToolId) return;
    workspaceViewportRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [activeToolId]);

  const persistStudyToolsPatch = React.useCallback(
    async (patch: Record<string, unknown>, extraPatch?: Partial<UpdateRevisionItemRequest>) => {
      if (!onUpdateItem) return;
      const metadataRecord = asRecord(item.metadata) || {};
      const studyToolsRecord = asRecord(metadataRecord.studyTools) || {};
      const nextStudyTools = {
        ...studyToolsRecord,
        ...patch,
      };
      await onUpdateItem(item, {
        ...extraPatch,
        metadataPatch: {
          studyTools: nextStudyTools,
        },
      });
    },
    [item, onUpdateItem]
  );

  const appendResponseSample = React.useCallback((draft: string) => {
    const words = draft
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    setResponseWordSamples((previous) => [...previous.slice(-7), words]);
  }, []);

  const markToolCompleted = React.useCallback((toolId: StudyToolId) => {
    setCompletedTools((previous) => ({ ...previous, [toolId]: true }));
  }, []);

  const buildRevisionPatchFromSignals = React.useCallback(
    (signals: LearningSignalsSnapshot): Partial<UpdateRevisionItemRequest> | undefined => {
      const patch: Partial<UpdateRevisionItemRequest> = {};
      const currentMastery = (item.mastery || 'still_learning') as
        | 'still_learning'
        | 'getting_better'
        | 'almost_there'
        | 'confident';
      const inferredMastery = signals.masteryLabel;
      const currentRank = MASTERY_RANK[currentMastery];
      const inferredRank = MASTERY_RANK[inferredMastery];

      if (signals.evidenceSummary.uncertainty === 'low' && Math.abs(inferredRank - currentRank) <= 1 && inferredRank !== currentRank) {
        patch.mastery = inferredMastery;
      }
      if (signals.revisitPriority === 'high' || signals.recoveryState === 'stuck' || signals.recoveryState === 'fragile') {
        patch.needsPractice = true;
      }
      return Object.keys(patch).length ? patch : undefined;
    },
    [item.mastery]
  );

  const persistLearningSignalsPatch = React.useCallback(
    async (signals: LearningSignalsSnapshot, extraPatch?: Partial<UpdateRevisionItemRequest>) => {
      if (!onUpdateItem) return;
      const inferredPatch = buildRevisionPatchFromSignals(signals);
      await persistStudyToolsPatch(
        {
          learningSignals: signals,
        },
        {
          ...(inferredPatch || {}),
          ...(extraPatch || {}),
        }
      );
    },
    [buildRevisionPatchFromSignals, onUpdateItem, persistStudyToolsPatch]
  );

  React.useEffect(() => {
    if (!onUpdateItem) return;
    const signature = JSON.stringify(learningSignals);
    if (lastPersistedLearningSignalsRef.current === signature) return;
    lastPersistedLearningSignalsRef.current = signature;
    void persistLearningSignalsPatch(learningSignals).catch(() => undefined);
  }, [learningSignals, onUpdateItem, persistLearningSignalsPatch]);

  const handleOpenTool = React.useCallback(
    (toolId: StudyToolId) => {
      if (!availableToolIds.has(toolId)) {
        setToolError('This tool is unavailable for this note right now.');
        return;
      }
      if (activeToolId && activeToolId !== toolId) {
        const openedAt = toolOpenedAtMs[activeToolId];
        if (openedAt && !completedTools[activeToolId] && Date.now() - openedAt <= 20000) {
          setQuickDismissCount((previous) => previous + 1);
        }
      }
      setToolError(null);
      setActiveToolId(toolId);
      setIsViewportCasting(true);
      if (castTimerRef.current) {
        clearTimeout(castTimerRef.current);
      }
      castTimerRef.current = setTimeout(() => {
        setIsViewportCasting(false);
      }, 560);
      setToolOpenedAtMs((previous) => (previous[toolId] ? previous : { ...previous, [toolId]: Date.now() }));
      setOpenedTools((previous) => {
        if (previous[toolId]) return previous;
        void api.revision
          .recordReviewEvent(item.id, {
            eventType: 'review_started',
            metadata: {
              surface: 'study_tools',
              action: 'open_tool',
              toolId,
              noteShape: recommendation.noteShape,
            },
          })
          .catch(() => undefined);
        return {
          ...previous,
          [toolId]: true,
        };
      });
    },
    [activeToolId, availableToolIds, completedTools, item.id, recommendation.noteShape, toolOpenedAtMs]
  );

  const handleSaveArtifact = React.useCallback(async () => {
    if (!activeTool || !onUpdateItem) return;
    setToolError(null);
    setIsSavingArtifact(true);
    try {
      const existingStudyTools = asRecord(asRecord(item.metadata)?.studyTools) || {};
      const existingSaved = asRecord(existingStudyTools.savedArtifacts) || {};
      const generated = recommendation.generatedArtifacts;
      const artifactSnapshot =
        activeTool.id === 'flashcards'
          ? { cards: generated.flashcards.cards.slice(0, 10) }
          : activeTool.id === 'concept_map'
          ? generated.conceptMap
          : activeTool.id === 'flow_diagram'
          ? generated.flowDiagram
          : activeTool.id === 'compare_table'
          ? generated.compareTable
          : activeTool.id === 'recall_sheet'
          ? generated.recallSheet
          : activeTool.id === 'teach_back'
          ? generated.teachBack
          : activeTool.id === 'quick_check'
          ? generated.quickCheck
          : generated.transferQuestion;

      const nextSaved = {
        ...existingSaved,
        [activeTool.id]: {
          toolId: activeTool.id,
          toolName: activeTool.name,
          savedAt: new Date().toISOString(),
          noteShape: recommendation.noteShape,
          reason: activeTool.reason,
          artifact: artifactSnapshot,
        },
      };

      await persistStudyToolsPatch({
        ...existingStudyTools,
        savedArtifacts: nextSaved,
        recommendation: {
          noteShape: recommendation.noteShape,
          recommended: recommendation.recommendedTools.map((tool) => tool.id),
          optional: recommendation.optionalTools.map((tool) => tool.id),
          updatedAt: new Date().toISOString(),
        },
      });
      markToolCompleted(activeTool.id);
      setLastMeaningfulEvidenceAt(new Date().toISOString());

      void api.revision
        .recordReviewEvent(item.id, {
          eventType: 'note_updated',
          outcome: 'completed',
          metadata: {
            surface: 'study_tools',
            action: 'save_artifact',
            toolId: activeTool.id,
          },
        })
        .catch(() => undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this study artifact right now.';
      setToolError(message);
    } finally {
      setIsSavingArtifact(false);
    }
  }, [activeTool, item.id, item.metadata, markToolCompleted, onUpdateItem, persistStudyToolsPatch, recommendation.noteShape, recommendation.optionalTools, recommendation.recommendedTools]);

  const runTeachBack = React.useCallback(async () => {
    const result = evaluateTeachBackResponse(teachBackDraft, recommendation.generatedArtifacts.teachBack);
    appendResponseSample(teachBackDraft);
    setTeachBackResult(result);
    markToolCompleted('teach_back');
    setLastMeaningfulEvidenceAt(new Date().toISOString());

    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'review_completed',
        outcome: mapTeachBackOutcome(result.correctness),
        metadata: {
          surface: 'study_tools',
          toolId: 'teach_back',
          score: result.score,
          clarity: result.clarity,
        },
      })
      .catch(() => undefined);

    if (onUpdateItem) {
      try {
        await persistStudyToolsPatch(
          {
            latestSignals: {
              teachBack: {
                score: result.score,
                clarity: result.clarity,
                correctness: result.correctness,
                missingIdea: result.missingIdea,
                misconception: result.misconception,
                updatedAt: new Date().toISOString(),
              },
            },
          },
          result.correctness === 'struggled' ? { needsPractice: true } : undefined
        );
      } catch {
        // keep UI responsive even if signal save fails
      }
    }
  }, [appendResponseSample, item.id, markToolCompleted, onUpdateItem, persistStudyToolsPatch, recommendation.generatedArtifacts.teachBack, teachBackDraft]);

  const submitQuickCheck = React.useCallback(async () => {
    if (!activeQuickCheckQuestion) return;
    const evaluation = evaluateQuickCheckAnswer(quickCheckDraft, activeQuickCheckQuestion);
    appendResponseSample(quickCheckDraft);

    setQuickCheckResults((previous) => ({
      ...previous,
      [activeQuickCheckQuestion.id]: evaluation,
    }));

    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'quiz_answered',
        outcome: mapOutcomeFromCorrectness(evaluation.correctness),
        metadata: {
          surface: 'study_tools',
          toolId: 'quick_check',
          questionId: activeQuickCheckQuestion.id,
          score: evaluation.score,
        },
      })
      .catch(() => undefined);

    const answeredCount = Object.keys(quickCheckResults).length + (quickCheckResults[activeQuickCheckQuestion.id] ? 0 : 1);
    const isFinal = answeredCount >= quickCheckQuestions.length;

    if (isFinal) {
      setIsQuickCheckComplete(true);
      setQuickCheckDraft('');
      markToolCompleted('quick_check');
      setLastMeaningfulEvidenceAt(new Date().toISOString());
      const aggregate = Object.values({
        ...quickCheckResults,
        [activeQuickCheckQuestion.id]: evaluation,
      });
      const average = aggregate.length
        ? Math.round(aggregate.reduce((sum, entry) => sum + entry.score, 0) / aggregate.length)
        : evaluation.score;

      if (onUpdateItem) {
        try {
          await persistStudyToolsPatch(
            {
              latestSignals: {
                quickCheck: {
                  averageScore: average,
                  answered: aggregate.length,
                  updatedAt: new Date().toISOString(),
                },
              },
            },
            average < 55 ? { needsPractice: true } : undefined
          );
        } catch {
          // no-op
        }
      }
      return;
    }

    setQuickCheckIndex((previous) => Math.min(previous + 1, quickCheckQuestions.length - 1));
    setQuickCheckDraft('');
  }, [activeQuickCheckQuestion, appendResponseSample, item.id, markToolCompleted, onUpdateItem, persistStudyToolsPatch, quickCheckDraft, quickCheckQuestions.length, quickCheckResults]);

  const runTransferCheck = React.useCallback(async () => {
    const evaluation = evaluateTransferResponse(transferDraft, recommendation.generatedArtifacts.transferQuestion);
    appendResponseSample(transferDraft);
    setTransferResult(evaluation);
    markToolCompleted('transfer_question');
    setLastMeaningfulEvidenceAt(new Date().toISOString());

    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'similar_question_practised',
        outcome: mapOutcomeFromCorrectness(evaluation.correctness),
        metadata: {
          surface: 'study_tools',
          toolId: 'transfer_question',
          score: evaluation.score,
        },
      })
      .catch(() => undefined);

    if (onUpdateItem) {
      try {
        await persistStudyToolsPatch(
          {
            latestSignals: {
              transferQuestion: {
                score: evaluation.score,
                correctness: evaluation.correctness,
                updatedAt: new Date().toISOString(),
              },
            },
          },
          evaluation.correctness === 'struggled' ? { needsPractice: true } : undefined
        );
      } catch {
        // no-op
      }
    }
  }, [appendResponseSample, item.id, markToolCompleted, onUpdateItem, persistStudyToolsPatch, recommendation.generatedArtifacts.transferQuestion, transferDraft]);

  const handleSaveCoachSignal = React.useCallback(async () => {
    if (!directSignalChoice) return;
    setToolError(null);
    setIsSavingCoachSignal(true);
    const signalText =
      directSignalChoice === 'simpler_example'
        ? 'Need a simpler example.'
        : directSignalChoice === 'compare_view'
          ? 'Need compare view.'
          : directSignalChoice === 'quick_test'
            ? 'Ready for a quick test.'
            : 'Still confused.';
    try {
      if (onSaveStudentNote) {
        await onSaveStudentNote(item, signalText);
      }
      setSavedDirectSignals((previous) => {
        if (previous.includes(signalText)) return previous;
        return [...previous.slice(-2), signalText];
      });
      setDirectSignalChoice('');
      setLastMeaningfulEvidenceAt(new Date().toISOString());
      void api.revision
        .recordReviewEvent(item.id, {
          eventType: 'note_updated',
          outcome: 'completed',
          metadata: {
            surface: 'study_tools',
            action: 'save_direct_signal',
            tier: 'tier3',
            signal: directSignalChoice,
          },
        })
        .catch(() => undefined);
      await persistStudyToolsPatch({
        directSignals: {
          recent: [...savedDirectSignals.slice(-2), signalText],
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this note right now.';
      setToolError(message);
    } finally {
      setIsSavingCoachSignal(false);
    }
  }, [directSignalChoice, item, onSaveStudentNote, persistStudyToolsPatch, savedDirectSignals]);

  const handleCloseWorkspace = React.useCallback(() => {
    if (activeToolId) {
      const openedAt = toolOpenedAtMs[activeToolId];
      if (openedAt && !completedTools[activeToolId] && Date.now() - openedAt <= 20000) {
        setQuickDismissCount((previous) => previous + 1);
      }
    }
    setActiveToolId(null);
  }, [activeToolId, completedTools, toolOpenedAtMs]);

  const selectedFlashcard = flashcardOrder.length
    ? flashcards[flashcardOrder[Math.min(flashcardIndex, Math.max(flashcardOrder.length - 1, 0))]]
    : flashcards[0] || null;

  const nextSupportCue = learningSignals.nextBestSupport.label;
  const shouldShowDirectFeedbackPrompt =
    learningSignals.askDirectFeedback &&
    savedDirectSignals.length === 0;

  const renderWorkspaceBody = () => {
    if (!activeTool) return null;

    if (activeTool.id === 'flashcards') {
      return (
        <div className="copilot-study-tool-pane space-y-3">
          {!flashcards.length || !selectedFlashcard ? (
            <div className="copilot-study-tool-empty">
              Add clearer note content to generate stronger flashcards for this topic.
            </div>
          ) : (
            <>
              <button
                type="button"
                className="copilot-study-flashcard"
                onClick={() => setFlashcardReveal((previous) => !previous)}
                aria-pressed={flashcardReveal}
              >
                <div className="copilot-study-flashcard-top">
                  <span className="copilot-revision-pill">
                    Card {Math.min(flashcardIndex + 1, flashcardOrder.length)} of {flashcardOrder.length}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                    {flashcardReveal ? 'Answer' : 'Prompt'}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold leading-7 text-[var(--copilot-text-primary)]">
                  {flashcardReveal ? selectedFlashcard.answer : selectedFlashcard.question}
                </p>
                {!flashcardReveal && selectedFlashcard.hint ? (
                  <p className="mt-3 text-xs text-[var(--copilot-text-secondary)]">Hint: {selectedFlashcard.hint}</p>
                ) : null}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    setFlashcardIndex((previous) =>
                      previous === 0 ? Math.max(flashcardOrder.length - 1, 0) : previous - 1
                    );
                    setFlashcardReveal(false);
                  }}
                  disabled={flashcardOrder.length <= 1}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setFlashcardReveal((previous) => !previous)}
                >
                  {flashcardReveal ? 'Show prompt' : 'Reveal answer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    setFlashcardOrder((previous) => {
                      const next = [...previous];
                      for (let index = next.length - 1; index > 0; index -= 1) {
                        const swapIndex = Math.floor(Math.random() * (index + 1));
                        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
                      }
                      return next;
                    });
                    setFlashcardIndex(0);
                    setFlashcardReveal(false);
                  }}
                  disabled={flashcardOrder.length <= 1}
                >
                  <Shuffle className="mr-1 h-3.5 w-3.5" />
                  Shuffle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => {
                    setFlashcardIndex((previous) =>
                      previous >= flashcardOrder.length - 1 ? 0 : previous + 1
                    );
                    setFlashcardReveal(false);
                  }}
                  disabled={flashcardOrder.length <= 1}
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTool.id === 'concept_map') {
      const map = recommendation.generatedArtifacts.conceptMap;
      return (
        <div className="copilot-study-tool-pane space-y-4">
          <div className="copilot-study-concept-core">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">Central idea</p>
            <p className="mt-2 text-lg font-semibold text-[var(--copilot-text-primary)]">{map.centralIdea}</p>
          </div>
          <div className="copilot-study-concept-grid">
            {map.branches.map((branch) => (
              <article key={branch.id} className="copilot-study-concept-branch">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{branch.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">{branch.summary}</p>
                <div className="mt-2 space-y-1">
                  {branch.subBranches.slice(0, 2).map((subBranch) => (
                    <p key={`${branch.id}-${subBranch}`} className="text-[11px] text-[var(--copilot-text-secondary)]">
                      - {subBranch}
                    </p>
                  ))}
                </div>
                {branch.misconception ? (
                  <p className="mt-2 text-[11px] text-rose-600">Misconception watch: {branch.misconception}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool.id === 'flow_diagram') {
      const flow = recommendation.generatedArtifacts.flowDiagram;
      return (
        <div className="copilot-study-tool-pane">
          <div className="copilot-study-flow-stack">
            {flow.steps.map((step) => (
              <article key={step.id} className="copilot-study-flow-step">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">{step.title}</p>
                <p className="mt-1 text-sm text-[var(--copilot-text-primary)]">{step.detail}</p>
                {step.mistakePoint ? (
                  <p className="mt-2 text-[11px] text-rose-600">Mistake point: {step.mistakePoint}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool.id === 'compare_table') {
      const compare = recommendation.generatedArtifacts.compareTable;
      return (
        <div className="copilot-study-tool-pane space-y-3">
          <div className="copilot-study-compare-head">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{compare.conceptA}</p>
            <ArrowLeftRight className="h-4 w-4 text-[var(--copilot-text-tertiary)]" />
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{compare.conceptB}</p>
          </div>
          <div className="copilot-study-compare-table">
            {compare.differences.map((difference) => (
              <div key={difference.aspect} className="copilot-study-compare-row">
                <p className="copilot-study-compare-aspect">{difference.aspect}</p>
                <p>{difference.a}</p>
                <p>{difference.b}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--copilot-text-secondary)]">{compare.memoryDistinction}</p>
        </div>
      );
    }

    if (activeTool.id === 'recall_sheet') {
      const recall = recommendation.generatedArtifacts.recallSheet;
      return (
        <div className="copilot-study-tool-pane copilot-study-recall-sheet">
          <div>
            <p className="copilot-study-sheet-label">What to remember</p>
            {recall.whatToRemember.map((line, index) => (
              <p key={`remember-${index}`} className="copilot-study-sheet-line">- {line}</p>
            ))}
          </div>
          <div>
            <p className="copilot-study-sheet-label">Common confusions</p>
            {recall.commonConfusions.map((line, index) => (
              <p key={`confusion-${index}`} className="copilot-study-sheet-line">- {line}</p>
            ))}
          </div>
          <div>
            <p className="copilot-study-sheet-label">Quick self-test</p>
            <p className="copilot-study-sheet-line">{recall.quickSelfTest}</p>
          </div>
          <div>
            <p className="copilot-study-sheet-label">Apply prompt</p>
            <p className="copilot-study-sheet-line">{recall.applyPrompt}</p>
          </div>
          <div>
            <p className="copilot-study-sheet-label">Memory hook</p>
            <p className="copilot-study-sheet-line">{recall.memoryHook}</p>
          </div>
        </div>
      );
    }

    if (activeTool.id === 'teach_back') {
      const teachBack = recommendation.generatedArtifacts.teachBack;
      return (
        <div className="copilot-study-tool-pane space-y-3">
          <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">{teachBack.prompt}</p>
          <Textarea
            value={teachBackDraft}
            onChange={(event) => setTeachBackDraft(event.target.value)}
            placeholder="Write your 2-line explanation here."
            className="min-h-[110px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="h-9 rounded-full px-4 text-sm"
              onClick={() => void runTeachBack()}
            >
              Evaluate explanation
            </Button>
          </div>
          {teachBackResult ? (
            <div className="copilot-study-feedback-box">
              <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{teachBackResult.feedback}</p>
              <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                Clarity: {teachBackResult.clarity} | Score: {teachBackResult.score}%
              </p>
              {teachBackResult.missingIdea ? (
                <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">{teachBackResult.missingIdea}</p>
              ) : null}
              {teachBackResult.misconception ? (
                <p className="mt-1 text-xs text-rose-600">{teachBackResult.misconception}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (activeTool.id === 'quick_check') {
      return (
        <div className="copilot-study-tool-pane space-y-3">
          {!activeQuickCheckQuestion ? (
            <div className="copilot-study-tool-empty">Quick Check is unavailable until this note has enough detail.</div>
          ) : isQuickCheckComplete ? (
            <div className="copilot-study-feedback-box">
              <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                Quick Check complete
              </p>
              <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                {Object.values(quickCheckResults).filter((entry) => entry.correctness === 'correct').length} strong,
                {' '}
                {Object.values(quickCheckResults).filter((entry) => entry.correctness !== 'correct').length} to revisit.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 h-8 rounded-full px-3 text-xs"
                onClick={() => {
                  setQuickCheckIndex(0);
                  setQuickCheckDraft('');
                  setQuickCheckResults({});
                  setIsQuickCheckComplete(false);
                }}
              >
                Retry Quick Check
              </Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--copilot-text-tertiary)]">
                Question {Math.min(quickCheckIndex + 1, quickCheckQuestions.length)} of {quickCheckQuestions.length}
              </p>
              <p className="text-sm font-medium text-[var(--copilot-text-primary)]">{activeQuickCheckQuestion.prompt}</p>
              <Textarea
                value={quickCheckDraft}
                onChange={(event) => setQuickCheckDraft(event.target.value)}
                placeholder="Write a short answer from memory."
                className="min-h-[96px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
              />
              <Button
                type="button"
                className="h-9 rounded-full px-4 text-sm"
                onClick={() => void submitQuickCheck()}
              >
                Submit answer
              </Button>
            </>
          )}
        </div>
      );
    }

    const transfer = recommendation.generatedArtifacts.transferQuestion;
    return (
      <div className="copilot-study-tool-pane space-y-3">
        <p className="text-sm text-[var(--copilot-text-secondary)]">{transfer.scenario}</p>
        <p className="text-sm font-medium text-[var(--copilot-text-primary)]">{transfer.prompt}</p>
        <Textarea
          value={transferDraft}
          onChange={(event) => setTransferDraft(event.target.value)}
          placeholder="Apply the idea in this new case."
          className="min-h-[110px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
        />
        <Button
          type="button"
          className="h-9 rounded-full px-4 text-sm"
          onClick={() => void runTransferCheck()}
        >
          Check transfer response
        </Button>
        {transferResult ? (
          <div className="copilot-study-feedback-box">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{transferResult.feedback}</p>
            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">Score: {transferResult.score}%</p>
            <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">Watch-out: {transfer.watchOut}</p>
          </div>
        ) : null}
      </div>
    );
  };

  const workspaceContent = activeTool ? (
    <StudyToolWorkspace
      viewportRef={workspaceViewportRef}
      activeTool={activeTool}
      isViewportCasting={isViewportCasting}
      onClose={handleCloseWorkspace}
      onSaveArtifact={() => void handleSaveArtifact()}
      isSavingArtifact={isSavingArtifact}
    >
      {renderWorkspaceBody()}
    </StudyToolWorkspace>
  ) : null;
  const viewportTargetNode =
    typeof document !== 'undefined' && viewportTargetId ? document.getElementById(viewportTargetId) : null;
  const workspacePortal = workspaceContent
    ? viewportTargetNode
      ? createPortal(workspaceContent, viewportTargetNode)
      : workspaceContent
    : null;

  return (
    <>
      <section className="copilot-study-tools-section space-y-3 rounded-[1.35rem] px-4 py-3.5">
        <StudyToolsHeader />

        <div className="copilot-study-tools-grid">
          <StudyToolSelectorPanel
            activeToolId={activeToolId}
            groupedTools={groupedTools}
            recommendedTools={recommendation.recommendedTools}
            recommendedToolIds={recommendedToolIds}
            onOpenTool={handleOpenTool}
          />
        </div>

        {activeTool || shouldShowDirectFeedbackPrompt ? (
          <StudyToolCoachingPanel
            onSaveCoachSignal={() => void handleSaveCoachSignal()}
            isSavingCoachSignal={isSavingCoachSignal}
            nextSupportCue={nextSupportCue}
            nextSupportReason={learningSignals.nextBestSupport.reason}
            nextSupportToolId={learningSignals.nextBestSupport.toolId}
            onOpenSuggestedTool={handleOpenTool}
            showDirectPrompt={shouldShowDirectFeedbackPrompt}
            directPromptQuestion={learningSignals.directFeedbackPrompt?.question || null}
            directSignalChoice={directSignalChoice}
            onDirectSignalChoiceChange={setDirectSignalChoice}
          />
        ) : null}

        {toolError ? (
          <p className="text-xs text-rose-600">{toolError}</p>
        ) : null}
      </section>
      {workspacePortal}
    </>
  );
}

function StudyToolsHeader() {
  return (
    <header className="copilot-study-tools-header">
      <p className="copilot-study-section-label">Study Tools</p>
    </header>
  );
}

function StudyToolSelectorPanel({
  activeToolId,
  groupedTools,
  recommendedTools,
  recommendedToolIds,
  onOpenTool,
}: {
  activeToolId: StudyToolId | null;
  groupedTools: Array<{
    purpose: StudyToolPurpose;
    label: string;
    tools: StudyToolRecommendationEntry[];
  }>;
  recommendedTools: StudyToolRecommendationEntry[];
  recommendedToolIds: Set<StudyToolId>;
  onOpenTool: (toolId: StudyToolId) => void;
}) {
  const [isAllToolsOpen, setIsAllToolsOpen] = React.useState(false);
  const [openPurpose, setOpenPurpose] = React.useState<StudyToolPurpose | null>(
    groupedTools[0]?.purpose || null
  );

  React.useEffect(() => {
    if (!activeToolId) return;
    const activeGroup = groupedTools.find((group) =>
      group.tools.some((tool) => tool.id === activeToolId)
    );
    if (!activeGroup) return;
    setIsAllToolsOpen(true);
    setOpenPurpose(activeGroup.purpose);
  }, [activeToolId, groupedTools]);

  return (
    <section className="copilot-study-selector-panel space-y-2">
      <p className="copilot-study-section-label">Recommended tools</p>

      <div className="copilot-study-recommended-list">
        {recommendedTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`copilot-study-purpose-tool copilot-study-recommended-item ${
              activeToolId === tool.id ? 'copilot-study-purpose-tool-active' : ''
            }`}
            onClick={() => onOpenTool(tool.id)}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--copilot-text-primary)]">{tool.name}</p>
              <p className="copilot-study-recommended-subline">{getPurposeLabel(tool.purpose)} tool</p>
            </div>
            <div className="shrink-0">
              <span className="copilot-study-recommend-badge">Recommended</span>
            </div>
          </button>
        ))}
      </div>

      <section className="copilot-study-all-tools-shell">
        <button
          type="button"
          className={`copilot-study-all-tools-toggle ${isAllToolsOpen ? 'copilot-study-all-tools-toggle-open' : ''}`}
          onClick={() => setIsAllToolsOpen((previous) => !previous)}
          aria-expanded={isAllToolsOpen}
        >
          <div>
            <p className="copilot-study-section-label">All tools</p>
          </div>
          <ChevronRight className={`h-4 w-4 transition-transform ${isAllToolsOpen ? 'rotate-90' : ''}`} />
        </button>

        {isAllToolsOpen ? (
          <div className="copilot-study-purpose-stack">
            {groupedTools.map((group) => {
              const isOpen = openPurpose === group.purpose;
              return (
                <section key={group.purpose} className="copilot-study-purpose-group">
                  <button
                    type="button"
                    className={`copilot-study-purpose-toggle ${isOpen ? 'copilot-study-purpose-toggle-open' : ''}`}
                    onClick={() =>
                      setOpenPurpose((previous) =>
                        previous === group.purpose ? null : group.purpose
                      )
                    }
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{group.label} tools</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="copilot-study-purpose-count">{group.tools.length}</span>
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="copilot-study-purpose-tools">
                      {group.tools.map((tool) => (
                        <button
                          key={tool.id}
                          type="button"
                          className={`copilot-study-purpose-tool ${activeToolId === tool.id ? 'copilot-study-purpose-tool-active' : ''}`}
                          onClick={() => onOpenTool(tool.id)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--copilot-text-primary)]">{tool.name}</p>
                            <p className="mt-0.5 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                              {getPurposeLabel(tool.purpose)}
                            </p>
                          </div>
                          {recommendedToolIds.has(tool.id) ? (
                            <span className="copilot-study-recommend-badge">Recommended</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : null}
      </section>
    </section>
  );
}

function StudyToolWorkspace({
  viewportRef,
  activeTool,
  isViewportCasting,
  onClose,
  onSaveArtifact,
  isSavingArtifact,
  children,
}: {
  viewportRef: React.Ref<HTMLElement>;
  activeTool: StudyToolRecommendationEntry | null;
  isViewportCasting: boolean;
  onClose: () => void;
  onSaveArtifact: () => void;
  isSavingArtifact: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      ref={viewportRef}
      className={`copilot-study-workspace ${
        activeTool ? 'copilot-study-workspace-active' : 'copilot-study-workspace-idle'
      } ${isViewportCasting ? 'copilot-study-workspace-casting' : ''}`}
      data-tool={activeTool?.id || 'idle'}
    >
      <StudyToolWorkspaceHeader
        activeTool={activeTool}
        onClose={onClose}
        onSaveArtifact={onSaveArtifact}
        isSavingArtifact={isSavingArtifact}
      />
      <div className="copilot-study-workspace-body">{children}</div>
    </section>
  );
}

function StudyToolWorkspaceHeader({
  activeTool,
  onClose,
  onSaveArtifact,
  isSavingArtifact,
}: {
  activeTool: StudyToolRecommendationEntry | null;
  onClose: () => void;
  onSaveArtifact: () => void;
  isSavingArtifact: boolean;
}) {
  return (
    <div className="copilot-study-workspace-header">
      <div>
        <p className="copilot-study-section-label">Note viewport</p>
        <h4 className="mt-1 text-base font-semibold text-[var(--copilot-text-primary)]">
          {activeTool ? activeTool.name : 'Tool output appears here'}
        </h4>
        <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
          {activeTool ? 'Answer in short blocks and keep moving.' : 'Open a tool to start.'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="copilot-study-viewport-live-pill">{activeTool ? 'Live' : 'Ready'}</span>
        {activeTool ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              onClick={onSaveArtifact}
              disabled={isSavingArtifact}
            >
              {isSavingArtifact ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Save artifact
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
              title="Close tool workspace"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StudyToolCoachingPanel({
  onSaveCoachSignal,
  isSavingCoachSignal,
  nextSupportCue,
  nextSupportReason,
  nextSupportToolId,
  onOpenSuggestedTool,
  showDirectPrompt,
  directPromptQuestion,
  directSignalChoice,
  onDirectSignalChoiceChange,
}: {
  onSaveCoachSignal: () => void;
  isSavingCoachSignal: boolean;
  nextSupportCue: string;
  nextSupportReason: string;
  nextSupportToolId: StudyToolId | null;
  onOpenSuggestedTool: (toolId: StudyToolId) => void;
  showDirectPrompt: boolean;
  directPromptQuestion: string | null;
  directSignalChoice: string;
  onDirectSignalChoiceChange: (value: string) => void;
}) {
  return (
    <section className="copilot-study-coaching-panel space-y-2.5">
      <p className="copilot-study-section-label">Learning progress</p>

      <div className="copilot-study-next-cue">
        <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">Try this next</p>
        <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-primary)]">{nextSupportCue}</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">{nextSupportReason}</p>
        {nextSupportToolId ? (
          <Button
            type="button"
            variant="outline"
            className="mt-2 h-7 rounded-full px-3 text-[11px]"
            onClick={() => onOpenSuggestedTool(nextSupportToolId)}
          >
            Open tool
          </Button>
        ) : null}
      </div>

      {showDirectPrompt ? (
        <div className="space-y-2 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-2.5">
          {directPromptQuestion ? (
            <p className="text-xs text-[var(--copilot-text-secondary)]">{directPromptQuestion}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={directSignalChoice}
              onChange={(event) => onDirectSignalChoiceChange(event.target.value)}
              className="copilot-study-selector flex-1"
              aria-label="Optional feedback note"
            >
              {DIRECT_SIGNAL_OPTIONS.map((option) => (
                <option key={option.value || 'empty'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              className="h-8 rounded-full px-4 text-xs"
              disabled={isSavingCoachSignal || !directSignalChoice}
              onClick={onSaveCoachSignal}
            >
              {isSavingCoachSignal ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Save note
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default StudyToolsSection;


