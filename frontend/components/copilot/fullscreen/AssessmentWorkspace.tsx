
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Flag, Lightbulb, Pause, Play, SkipForward, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import api, { ApiError } from '@/lib/api';
import type {
  AssessmentFeedback,
  AssessmentModeType,
  AssessmentQuestion,
  AssessmentQuestionStyle,
  AssessmentResult,
  AssessmentReviewMode,
  AssessmentSessionSnapshot,
  AssessmentSessionStartRequest,
  AssessmentStrictness,
  AssessmentWorkspaceMode,
  FullscreenCopilotDestination,
} from '@/lib/types';

type AssessmentPreset = {
  id: string;
  title: string;
  description: string;
  payload: Partial<AssessmentSessionStartRequest>;
};

type QuestionDraft = {
  answerText?: string;
  selectedOptionId?: string | null;
  unsure?: boolean;
  flagForReview?: boolean;
};

interface AssessmentWorkspaceProps {
  workspaceMode: AssessmentWorkspaceMode;
  onDestinationChange: (destination: FullscreenCopilotDestination) => void;
}

const EXAM_PRESETS: AssessmentPreset[] = [
  {
    id: 'quick_drill',
    title: 'Quick Drill',
    description: '3 questions, immediate review, light support, untimed.',
    payload: {
      modeType: 'quick_drill',
      questionCount: 3,
      reviewMode: 'immediate',
      strictness: 'light_support',
      timedMinutes: null,
    },
  },
  {
    id: 'timed_practice',
    title: 'Timed Practice',
    description: '10 questions, strict exam, delayed block review, timed.',
    payload: {
      modeType: 'timed_practice',
      questionCount: 10,
      reviewMode: 'delayed_block',
      strictness: 'strict_exam',
      timedMinutes: 15,
    },
  },
  {
    id: 'mini_mock',
    title: 'Mini Mock',
    description: '20 questions, strict exam, post-mock review, timed.',
    payload: {
      modeType: 'mini_mock',
      questionCount: 20,
      reviewMode: 'post_mock',
      strictness: 'strict_exam',
      timedMinutes: 35,
    },
  },
  {
    id: 'weak_topic_drill',
    title: 'Weak-topic Drill',
    description: '6 questions, weak-topic targeting, immediate review, lightly timed.',
    payload: {
      modeType: 'weak_topic_drill',
      questionCount: 6,
      reviewMode: 'immediate',
      strictness: 'light_support',
      timedMinutes: 10,
    },
  },
];

const FOCUS_PRESETS: AssessmentPreset[] = [
  {
    id: 'focus_session',
    title: 'Focus Session',
    description: '4-6 questions, low-noise flow, light support, untimed by default.',
    payload: {
      modeType: 'focus_session',
      questionCount: 5,
      reviewMode: 'immediate',
      strictness: 'light_support',
      timedMinutes: null,
    },
  },
  {
    id: 'weak_topic_drill',
    title: 'Weak-topic Focus',
    description: 'Target weak areas with calm pacing and immediate correction.',
    payload: {
      modeType: 'weak_topic_drill',
      questionCount: 6,
      reviewMode: 'immediate',
      strictness: 'light_support',
      timedMinutes: 8,
    },
  },
];

function summarizeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const payloadMessage =
      error.payload &&
      typeof error.payload === 'object' &&
      'message' in (error.payload as Record<string, unknown>)
        ? String((error.payload as Record<string, unknown>).message || '').trim()
        : '';
    return payloadMessage || error.message || 'Request failed.';
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'Something went wrong. Please try again.';
}

function formatSeconds(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--:--';
  const safe = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function questionHelpMeta(question: AssessmentQuestion | null) {
  if (!question || !question.metadata || typeof question.metadata !== 'object') return '';
  const metadata = question.metadata as Record<string, unknown>;
  return String(metadata.whyNow || metadata.thingToNotice || metadata.bestFor || '').trim();
}

export function AssessmentWorkspace(props: AssessmentWorkspaceProps) {
  const presets = props.workspaceMode === 'focus' ? FOCUS_PRESETS : EXAM_PRESETS;
  const [snapshot, setSnapshot] = useState<AssessmentSessionSnapshot | null>(null);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [feedback, setFeedback] = useState<AssessmentFeedback | null>(null);
  const [hint, setHint] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, QuestionDraft>>({});
  const [liveRemainingSec, setLiveRemainingSec] = useState<number | null>(null);

  const [customSubject, setCustomSubject] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customModeType, setCustomModeType] = useState<AssessmentModeType>(
    props.workspaceMode === 'focus' ? 'focus_session' : 'quick_drill'
  );
  const [customQuestionCount, setCustomQuestionCount] = useState(
    props.workspaceMode === 'focus' ? '5' : '10'
  );
  const [customTimedMinutes, setCustomTimedMinutes] = useState('');
  const [customStyle, setCustomStyle] = useState<AssessmentQuestionStyle>('mixed');
  const [customStrictness, setCustomStrictness] = useState<AssessmentStrictness>(
    props.workspaceMode === 'focus' ? 'light_support' : 'strict_exam'
  );
  const [customReviewMode, setCustomReviewMode] = useState<AssessmentReviewMode>(
    props.workspaceMode === 'focus' ? 'immediate' : 'delayed_block'
  );

  const session = snapshot?.session || null;
  const question = snapshot?.currentQuestion || null;
  const currentDraft = question ? drafts[question.id] || {} : {};

  useEffect(() => {
    setSnapshot(null);
    setResults(null);
    setFeedback(null);
    setHint('');
    setErrorMessage('');
    setDrafts({});
    setLiveRemainingSec(null);
  }, [props.workspaceMode]);

  useEffect(() => {
    setLiveRemainingSec(snapshot?.timer.remainingSec ?? null);
  }, [snapshot?.session.id, snapshot?.timer.remainingSec]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || snapshot?.timer.durationSec == null) return;
    const timerId = window.setInterval(() => {
      setLiveRemainingSec((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [session?.id, session?.status, snapshot?.timer.durationSec]);

  const timerTone = useMemo(() => {
    if (snapshot?.timer.durationSec == null || liveRemainingSec == null) return 'normal' as const;
    const ratio = liveRemainingSec / Math.max(1, snapshot.timer.durationSec);
    if (liveRemainingSec <= 0 || ratio <= 0.05) return 'critical' as const;
    if (ratio <= 0.2) return 'warning' as const;
    return 'normal' as const;
  }, [liveRemainingSec, snapshot?.timer.durationSec]);

  const setCurrentDraft = (patch: Partial<QuestionDraft>) => {
    if (!question) return;
    setDrafts((prev) => ({ ...prev, [question.id]: { ...(prev[question.id] || {}), ...patch } }));
  };

  const run = async (task: () => Promise<void>) => {
    setIsBusy(true);
    setErrorMessage('');
    try {
      await task();
    } catch (error) {
      setErrorMessage(summarizeApiError(error));
    } finally {
      setIsBusy(false);
    }
  };

  const startSession = async (payload: Partial<AssessmentSessionStartRequest>) => {
    await run(async () => {
      const started = await api.startAssessmentSession({
        workspaceMode: props.workspaceMode,
        ...payload,
      });
      setSnapshot(started);
      setResults(null);
      setFeedback(null);
      setHint('');
      setDrafts({});
      if (started.resultsReady) {
        const resultPayload = await api.fetchAssessmentResults(started.session.id);
        setResults(resultPayload.results || null);
      }
    });
  };

  const resumeLast = async () => {
    await run(async () => {
      const resumed = await api.startAssessmentSession({
        workspaceMode: props.workspaceMode,
        resumeLatest: true,
        createIfNone: false,
      });
      setSnapshot(resumed);
      setResults(null);
      setFeedback(null);
      setHint('');
      if (resumed.resultsReady) {
        const resultPayload = await api.fetchAssessmentResults(resumed.session.id);
        setResults(resultPayload.results || null);
      }
    });
  };

  const refresh = async () => {
    if (!session) return;
    await run(async () => {
      const refreshed = await api.fetchAssessmentSession(session.id);
      setSnapshot(refreshed);
      if (refreshed.resultsReady) {
        const resultPayload = await api.fetchAssessmentResults(session.id);
        setResults(resultPayload.results || null);
      }
    });
  };

  const pauseOrResume = async () => {
    if (!session) return;
    await run(async () => {
      const updated =
        session.status === 'paused'
          ? await api.resumeAssessmentSession(session.id)
          : await api.pauseAssessmentSession(session.id);
      setSnapshot(updated);
    });
  };

  const navigate = async (
    direction: 'next' | 'previous' | 'jump' | 'unanswered' | 'review_flagged' | 'skip_current',
    options?: { targetIndex?: number; flagReason?: string }
  ) => {
    if (!session) return;
    await run(async () => {
      const response = await api.navigateAssessmentSession(session.id, {
        direction,
        targetIndex: options?.targetIndex,
        flagReason: options?.flagReason,
      });
      setSnapshot(response.snapshot);
      setFeedback(null);
      setHint('');
    });
  };

  const requestHint = async () => {
    if (!session || !question) return;
    await run(async () => {
      const response = await api.requestAssessmentHint(session.id, { questionId: question.id });
      setSnapshot(response.snapshot);
      setHint(response.hint);
      setFeedback(null);
    });
  };

  const submit = async () => {
    if (!session || !question) return;
    await run(async () => {
      const answerText = String(currentDraft.answerText || '').trim();
      const payload: {
        questionId: string;
        answer?: string | number | null;
        selectedOptionId?: string | null;
        workedSteps?: string | null;
        unsure?: boolean;
        flagForReview?: boolean;
      } = {
        questionId: question.id,
        unsure: Boolean(currentDraft.unsure),
        flagForReview: Boolean(currentDraft.flagForReview),
      };

      if (question.questionType === 'multiple_choice') {
        if (!currentDraft.selectedOptionId) throw new Error('Select one option before submitting.');
        payload.selectedOptionId = currentDraft.selectedOptionId;
      } else if (question.questionType === 'numeric') {
        if (!answerText) throw new Error('Enter a numeric answer before submitting.');
        const asNumber = Number(answerText);
        payload.answer = Number.isFinite(asNumber) ? asNumber : answerText;
      } else if (question.questionType === 'worked_response') {
        if (!answerText) throw new Error('Write at least one worked step.');
        payload.workedSteps = answerText;
      } else {
        if (!answerText) throw new Error('Write your answer before submitting.');
        payload.answer = answerText;
      }

      const response = await api.submitAssessmentAnswer(session.id, payload);
      setSnapshot(response.snapshot);
      setFeedback(response.feedback);
      setHint('');
      if (response.snapshot.resultsReady) {
        const resultPayload = await api.fetchAssessmentResults(session.id);
        setResults(resultPayload.results || null);
      }
    });
  };

  const finish = async () => {
    if (!session) return;
    await run(async () => {
      const finished = await api.finishAssessmentSession(session.id, { reason: 'manual_finish' });
      setSnapshot(finished.snapshot);
      setResults(finished.results);
      setFeedback(null);
      setHint('');
    });
  };

  const onNextMove = async (
    destination: FullscreenCopilotDestination,
    topic?: string | null,
    subject?: string | null
  ) => {
    if (destination === 'exam' || destination === 'focus') {
      props.onDestinationChange(destination);
      await startSession({
        workspaceMode: destination,
        modeType: destination === 'focus' ? 'focus_session' : 'quick_drill',
        topic: topic || null,
        subject: subject || null,
      });
      return;
    }
    props.onDestinationChange(destination);
  };

  const startCustom = async () => {
    const count = Number(customQuestionCount);
    const minutes = Number(customTimedMinutes);
    await startSession({
      workspaceMode: props.workspaceMode,
      modeType: customModeType,
      subject: customSubject.trim() || null,
      topic: customTopic.trim() || null,
      questionStyle: customStyle,
      strictness: customStrictness,
      reviewMode: customReviewMode,
      questionCount: Number.isFinite(count) ? count : null,
      timedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
    });
  };

  const isEntry = !snapshot;
  const timerClass =
    timerTone === 'critical'
      ? 'text-rose-200 border-rose-300/45 bg-rose-500/15'
      : timerTone === 'warning'
        ? 'text-amber-200 border-amber-300/45 bg-amber-500/15'
        : 'text-[var(--copilot-text-secondary)] border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]';

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-4 md:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
          <h2 className="text-xl font-semibold text-[var(--copilot-text-primary)]">
            {props.workspaceMode === 'exam' ? 'Exam session' : 'Focus session'}
          </h2>
        </div>

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-300/35 bg-rose-500/10 p-3 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {isEntry ? (
          <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
            <div className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
              <h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Quick Start Presets</h3>
              <div className="mt-3 grid gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] px-3 py-3 text-left transition-colors hover:bg-[var(--copilot-surface-muted)] motion-reduce:transition-none"
                    onClick={() => void startSession(preset.payload)}
                    disabled={isBusy}
                  >
                    <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{preset.title}</p>
                    <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{preset.description}</p>
                  </button>
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-3 w-full rounded-xl" onClick={() => void resumeLast()} disabled={isBusy}>
                Resume Last Session
              </Button>
            </div>

            <div className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
              <h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Custom Setup</h3>
              <div className="mt-3 grid gap-2">
                <Input value={customSubject} onChange={(event) => setCustomSubject(event.target.value)} placeholder="Subject (optional)" />
                <Input value={customTopic} onChange={(event) => setCustomTopic(event.target.value)} placeholder="Topic (optional)" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={customQuestionCount} onChange={(event) => setCustomQuestionCount(event.target.value)} placeholder="Questions" />
                  <Input value={customTimedMinutes} onChange={(event) => setCustomTimedMinutes(event.target.value)} placeholder="Timed minutes" />
                </div>
                <select className="h-10 rounded-md border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] px-2" value={customModeType} onChange={(event) => setCustomModeType(event.target.value as AssessmentModeType)}>
                  <option value="quick_drill">Quick Drill</option>
                  <option value="timed_practice">Timed Practice</option>
                  <option value="mini_mock">Mini Mock</option>
                  <option value="weak_topic_drill">Weak-topic Drill</option>
                  <option value="focus_session">Focus Session</option>
                </select>
                <select className="h-10 rounded-md border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] px-2" value={customStyle} onChange={(event) => setCustomStyle(event.target.value as AssessmentQuestionStyle)}>
                  <option value="mixed">Mixed</option>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="short_answer">Short answer</option>
                  <option value="numeric">Numeric</option>
                  <option value="worked_response">Worked response</option>
                </select>
                <select className="h-10 rounded-md border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] px-2" value={customStrictness} onChange={(event) => setCustomStrictness(event.target.value as AssessmentStrictness)}>
                  <option value="light_support">Light support</option>
                  <option value="strict_exam">Strict exam</option>
                  <option value="review_after_attempt">Review after attempt</option>
                </select>
                <select className="h-10 rounded-md border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] px-2" value={customReviewMode} onChange={(event) => setCustomReviewMode(event.target.value as AssessmentReviewMode)}>
                  <option value="immediate">Immediate</option>
                  <option value="delayed_block">Delayed block</option>
                  <option value="flag_and_review">Flag and review</option>
                  <option value="post_mock">Post mock</option>
                </select>
                <Button type="button" className="rounded-xl" onClick={() => void startCustom()} disabled={isBusy}>Start Custom Session</Button>
              </div>
            </div>
          </div>
        ) : null}

        {snapshot && session ? (
          <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
            <div className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{session.topic || session.subject || 'Assessment session'}</p>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold', timerClass)}>
                  <Timer className="h-3.5 w-3.5" />
                  {snapshot.timer.durationSec == null ? 'Untimed' : formatSeconds(liveRemainingSec)}
                </span>
              </div>
              <div className="mt-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] p-3">
                <div className="flex items-center justify-between text-xs text-[var(--copilot-text-secondary)]">
                  <span>Question {snapshot.progress.currentQuestionNumber} / {snapshot.progress.totalQuestions}</span>
                  <span>Answered {snapshot.progress.answeredCount} | Skipped {snapshot.progress.skippedCount} | Flagged {snapshot.progress.flaggedCount}</span>
                </div>
                <Progress value={Math.max(0, Math.min(100, snapshot.progress.progressPercent * 100))} className="mt-2 h-2" />
              </div>

              {question ? (
                <div className="mt-4 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">{question.questionType.replace(/_/g, ' ')}</p>
                  <p className="mt-2 text-sm text-[var(--copilot-text-primary)]">{question.prompt}</p>
                  {question.questionType === 'multiple_choice' ? (
                    <div className="mt-3 grid gap-2">
                      {(question.options || []).map((option) => (
                        <button key={option.id} type="button" className={cn('rounded-xl border px-3 py-2 text-left text-sm', currentDraft.selectedOptionId === option.id ? 'border-[var(--copilot-workspace-strong)] bg-[var(--copilot-workspace-strong)]/10 text-[var(--copilot-text-primary)]' : 'border-[var(--copilot-soft-line)] text-[var(--copilot-text-secondary)]')} onClick={() => setCurrentDraft({ selectedOptionId: option.id })}>
                          <span className="mr-2 font-semibold">{option.id}.</span>{option.label}
                        </button>
                      ))}
                    </div>
                  ) : question.questionType === 'numeric' ? (
                    <Input className="mt-3" value={currentDraft.answerText || ''} onChange={(event) => setCurrentDraft({ answerText: event.target.value })} placeholder="Numeric answer" />
                  ) : (
                    <Textarea className="mt-3" value={currentDraft.answerText || ''} onChange={(event) => setCurrentDraft({ answerText: event.target.value })} placeholder={question.questionType === 'worked_response' ? 'Show your working steps.' : 'Short answer'} rows={question.questionType === 'worked_response' ? 6 : 4} />
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void submit()} disabled={isBusy || session.status === 'paused'}><CheckCircle2 className="mr-1.5 h-4 w-4" />Submit</Button>
                    <Button type="button" variant="outline" onClick={() => void navigate('skip_current')} disabled={isBusy || session.status === 'paused'}><SkipForward className="mr-1.5 h-4 w-4" />Skip</Button>
                    <Button type="button" variant="outline" onClick={() => void setCurrentDraft({ flagForReview: !currentDraft.flagForReview })} disabled={isBusy || session.status === 'paused'}>
                      <Flag className="mr-1.5 h-4 w-4" />
                      {currentDraft.flagForReview || question.isFlagged ? 'Flagged for review' : 'Flag for review'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void setCurrentDraft({ unsure: !currentDraft.unsure })} disabled={isBusy || session.status === 'paused'}>
                      <AlertCircle className="mr-1.5 h-4 w-4" />
                      {currentDraft.unsure ? 'Unmark unsure' : 'Mark unsure'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void requestHint()} disabled={isBusy || session.status === 'paused' || !snapshot.policy.preSubmitHelpAllowed}><Lightbulb className="mr-1.5 h-4 w-4" />Hint</Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => void navigate('previous')} disabled={isBusy || session.status === 'paused'}>Previous</Button>
                    <Button type="button" variant="ghost" onClick={() => void navigate('next')} disabled={isBusy || session.status === 'paused'}>Next</Button>
                    <Button type="button" variant="ghost" onClick={() => void navigate('review_flagged')} disabled={isBusy || session.status === 'paused' || snapshot.progress.flaggedCount === 0}>Review flagged</Button>
                    <Button type="button" variant="ghost" onClick={() => void finish()} disabled={isBusy}>Finish</Button>
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">Support Drawer</h3>
                <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()} disabled={isBusy}>Refresh</Button>
              </div>
              <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">{session.strictness.replace(/_/g, ' ')} | {session.reviewMode.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">{questionHelpMeta(question) || 'Use one clear step at a time and keep your structure explicit.'}</p>
              {hint ? <div className="mt-3 rounded-xl border border-emerald-300/35 bg-emerald-500/10 p-3 text-sm text-emerald-100"><p className="font-semibold">Hint</p><p className="mt-1">{hint}</p></div> : null}
              {feedback ? <div className="mt-3 rounded-xl border border-sky-300/35 bg-sky-500/10 p-3 text-sm text-sky-100"><p className="font-semibold">{feedback.headline}</p><p className="mt-1">{feedback.explanation}</p><p className="mt-1 text-xs">Remember: {feedback.remember}</p>{feedback.handoff ? <Button type="button" variant="outline" className="mt-2 h-8 rounded-full border-sky-200/50 bg-transparent text-sky-50" onClick={() => void onNextMove(feedback.handoff!.destination, feedback.handoff!.topic, feedback.handoff!.subject)}>{feedback.handoff.label}</Button> : null}</div> : null}
              <div className="mt-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] p-3 text-xs text-[var(--copilot-text-secondary)]">Pending: {snapshot.review.pendingCount} | Flagged: {snapshot.review.flaggedCount}</div>
              <Button type="button" variant="outline" className="mt-3 w-full rounded-xl" onClick={() => void pauseOrResume()} disabled={isBusy}>{session.status === 'paused' ? <><Play className="mr-1.5 h-4 w-4" />Resume</> : <><Pause className="mr-1.5 h-4 w-4" />Pause</>}</Button>
            </aside>
          </div>
        ) : null}

        {results ? (
          <div className="rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">Session Results</p>
            <h3 className="text-xl font-semibold text-[var(--copilot-text-primary)]">{results.scorePercent}% scored</h3>
            <p className="text-sm text-[var(--copilot-text-secondary)]">Correct {results.correctCount} | Partial {results.partialCount} | Incorrect {results.incorrectCount}</p>
            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
              Time used: {typeof results.timeUsedSec === 'number' ? formatSeconds(results.timeUsedSec) : 'Not tracked'} | Weak-topic triggers: {results.weakTopicTriggers.length > 0 ? results.weakTopicTriggers.join(', ') : 'None'}
            </p>
            {results.topicBreakdown.length > 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">Topic Clusters</p>
                <div className="mt-2 space-y-1 text-xs text-[var(--copilot-text-secondary)]">
                  {results.topicBreakdown.slice(0, 4).map((cluster) => (
                    <p key={`${cluster.topic}:${cluster.subject || 'subjectless'}`}>
                      {cluster.topic} ({cluster.subject || 'general'}) - {cluster.correct}/{cluster.total} correct
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {results.mistakeClusters.length > 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-2)] p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">Mistake Patterns</p>
                <div className="mt-2 space-y-1 text-xs text-[var(--copilot-text-secondary)]">
                  {results.mistakeClusters.slice(0, 4).map((cluster) => (
                    <p key={`${cluster.pattern}:${cluster.topic || 'topicless'}`}>
                      {cluster.pattern} ({cluster.count}) {cluster.topic ? `- ${cluster.topic}` : ''}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => void startSession({ modeType: 'quick_drill' })} disabled={isBusy}>Start similar drill</Button>
              <Button type="button" onClick={() => void onNextMove(results.bestNextMove.destination, results.bestNextMove.topic, results.bestNextMove.subject)} disabled={isBusy}>{results.bestNextMove.label}</Button>
            </div>
            {results.followupPaths.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {results.followupPaths.slice(0, 4).map((pathOption, index) => (
                  <Button
                    key={`${pathOption.label}:${index}`}
                    type="button"
                    variant="outline"
                    onClick={() => void onNextMove(pathOption.destination, pathOption.topic, pathOption.subject)}
                    disabled={isBusy}
                  >
                    {pathOption.label}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {isBusy ? (
          <div className="flex items-center gap-2 text-xs text-[var(--copilot-text-secondary)]">
            <Clock3 className="h-4 w-4 animate-pulse" />
            Processing assessment action...
          </div>
        ) : null}
      </div>
    </section>
  );
}

