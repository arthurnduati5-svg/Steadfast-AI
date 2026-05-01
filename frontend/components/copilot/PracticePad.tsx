'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Eraser,
  Lightbulb,
  Loader2,
  Maximize2,
  Minimize2,
  MousePointer2,
  PenLine,
  Plus,
  Redo2,
  Rows3,
  Save,
  SendHorizontal,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type {
  MetacognitiveProfile,
  MetacognitivePrompt,
  MetacognitiveStateSnapshot,
  PracticePadCheckStepRequest,
  PracticePadCheckStepResponse,
  PracticePadReflectionPayload,
  PracticePadStepFocus,
  PracticePadSupportChoice,
  TutorActionRequest,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  MetacognitivePromptCard,
  type MetacognitiveChoicePayload,
} from './MetacognitivePromptCard';
import { getStroke } from 'perfect-freehand';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        value?: string;
        placeholder?: string;
        class?: string;
        'virtual-keyboard-mode'?: string;
      };
    }
  }
}

export interface PracticePadContext {
  prompt?: string | null;
  topic?: string | null;
  subject?: string | null;
  sourceMessageId?: string | null;
  reflectionPrompt?: MetacognitivePrompt | null;
}

interface PracticePadProps {
  studentName: string;
  sessionId?: string | null;
  context?: PracticePadContext | null;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  metacognitiveProfile?: MetacognitiveProfile | null;
  onCheckStep: (payload: PracticePadCheckStepRequest) => Promise<PracticePadCheckStepResponse>;
  onRecordReflection?: (payload: MetacognitiveChoicePayload) => Promise<void> | void;
  onContinueInChat?: (payload: { message: string; tutorAction: TutorActionRequest }) => void;
  onSaveWorking?: (payload: {
    content: string;
    selectedStep?: string | null;
    topic?: string | null;
    subject?: string | null;
    sourceMessageId?: string | null;
  }) => void;
  onClose: () => void;
  className?: string;
}

const supportOptions: Array<{ value: PracticePadSupportChoice; label: string }> = [
  { value: 'retry_first', label: 'Retry first' },
  { value: 'hint', label: 'Small hint' },
  { value: 'example', label: 'Worked example' },
  { value: 'break_down', label: 'Break it down' },
];

type PracticePadTool = 'pen' | 'eraser' | 'type' | 'select';

type PadPoint = {
  x: number;
  y: number;
  pressure?: number;
};

type PadStroke = {
  id: string;
  tool: 'pen' | 'eraser';
  points: PadPoint[];
  width: number;
};

type PadHistoryEntry =
  | { kind: 'stroke'; stroke: PadStroke }
  | { kind: 'typed_step'; text: string }
  | {
      kind: 'clear';
      snapshot: {
        strokes: PadStroke[];
        typedSteps: string[];
        selectedStepIndex: number | null;
      };
    };

type MathFieldElement = HTMLElement & {
  value?: string;
  setOptions?: (options: Record<string, unknown>) => void;
  getValue?: (format?: string) => string;
};

const PEN_WIDTH = 2.2;
const ERASER_WIDTH = 18;
const MATH_STEP_PREFIX = '[math]';

const isMathStep = (step: string) => step.startsWith(MATH_STEP_PREFIX);
const stripMathStepPrefix = (step: string) =>
  isMathStep(step) ? step.slice(MATH_STEP_PREFIX.length).trim() : step.trim();

const createStrokeId = () => `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const cloneStrokes = (strokes: PadStroke[]): PadStroke[] =>
  strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));

const getMasteryChip = (profile?: MetacognitiveProfile | null) => {
  if (profile?.selfCorrectionTrend === 'improving') {
    return { label: 'Getting better', classes: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (profile?.selfCorrectionTrend === 'steady') {
    return {
      label: 'Almost there',
      classes:
        'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]',
    };
  }
  if (profile?.selfCorrectionTrend === 'needs_support') {
    return { label: 'Still learning', classes: 'border-amber-200 bg-amber-50 text-amber-700' };
  }
  return null;
};

const buildHiddenTutorPrompt = (
  action: TutorActionRequest['id'],
  selectedStep: string,
  topicLabel: string
) => {
  if (action === 'hint') {
    return selectedStep
      ? `Give one short hint only for this step: "${selectedStep}".`
      : `Give one short hint only for ${topicLabel || 'this topic'}.`;
  }
  if (action === 'breakdown') {
    return selectedStep
      ? `Break this step into short clear moves: "${selectedStep}".`
      : `Break this into short clear moves for ${topicLabel || 'this topic'}.`;
  }
  if (action === 'practice') {
    return selectedStep
      ? `Give one similar practice question for this skill: "${selectedStep}". Do not solve it.`
      : `Give one similar practice question for ${topicLabel || 'this topic'}. Do not solve it.`;
  }
  if (action === 'summarize') {
    return selectedStep
      ? `Summarize this step for revision: "${selectedStep}".`
      : 'Summarize this into concise revision notes.';
  }
  return 'Continue from Practice Pad with one short Socratic next step.';
};

const drawStrokePath = (ctx: CanvasRenderingContext2D, stroke: PadStroke) => {
  if (stroke.points.length === 0) return;

  ctx.save();
  if (stroke.tool === 'eraser') {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let index = 1; index < stroke.points.length; index += 1) {
      ctx.lineTo(stroke.points[index].x, stroke.points[index].y);
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  const strokeOutline = getStroke(
    stroke.points.map((point) => [point.x, point.y, point.pressure ?? 0.5]),
    {
      size: stroke.width * 3.6,
      thinning: 0.62,
      smoothing: 0.72,
      streamline: 0.38,
      simulatePressure: true,
      last: true,
    }
  );

  if (strokeOutline.length > 0) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(strokeOutline[0][0], strokeOutline[0][1]);
    for (let index = 1; index < strokeOutline.length; index += 1) {
      ctx.lineTo(strokeOutline[index][0], strokeOutline[index][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
};

export function PracticePad({
  studentName,
  sessionId,
  context,
  metacognitiveState,
  metacognitiveProfile,
  onCheckStep,
  onRecordReflection,
  onContinueInChat,
  onSaveWorking,
  onClose,
  className,
}: PracticePadProps) {
  const [activeTool, setActiveTool] = useState<PracticePadTool>('pen');
  const [typedSteps, setTypedSteps] = useState<string[]>([]);
  const [typedDraft, setTypedDraft] = useState('');
  const [typedDraftMode, setTypedDraftMode] = useState<'math' | 'text'>('math');
  const [typedMathDraft, setTypedMathDraft] = useState('');
  const [isMathLiveReady, setIsMathLiveReady] = useState(false);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [strokes, setStrokes] = useState<PadStroke[]>([]);
  const [history, setHistory] = useState<PadHistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<PadHistoryEntry[]>([]);
  const [supportChoice, setSupportChoice] = useState<PracticePadSupportChoice>('retry_first');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<PracticePadCheckStepResponse | null>(null);

  const workSurfaceRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mathFieldRef = useRef<MathFieldElement | null>(null);
  const drawingStrokeRef = useRef<PadStroke | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const strokesRef = useRef<PadStroke[]>([]);
  const typedStepsRef = useRef<string[]>([]);
  const selectedStepIndexRef = useRef<number | null>(null);

  const preferredSupports = useMemo(
    () => (Array.isArray(metacognitiveProfile?.preferredSupportPatterns) ? metacognitiveProfile.preferredSupportPatterns : []),
    [metacognitiveProfile?.preferredSupportPatterns]
  );

  const helperPrompt = context?.reflectionPrompt || result?.reflectionPrompt || null;
  const topicLabel = String(context?.topic || context?.subject || '').trim();
  const promptPreview = String(context?.prompt || '').trim();
  const selectedStepRaw = selectedStepIndex !== null ? typedSteps[selectedStepIndex] || '' : '';
  const selectedStep = stripMathStepPrefix(selectedStepRaw);
  const masteryChip = getMasteryChip(metacognitiveProfile);
  const hasWorking =
    typedSteps.length > 0 ||
    Boolean(typedDraft.trim()) ||
    Boolean(typedMathDraft.trim()) ||
    strokes.length > 0;

  const compiledWorkingText = useMemo(() => {
    const lines = typedSteps.map((step, index) => {
      if (isMathStep(step)) {
        return `Step ${index + 1} (equation): ${stripMathStepPrefix(step)}`;
      }
      return `Step ${index + 1}: ${step}`;
    });
    if (typedDraft.trim()) {
      lines.push(`Draft step: ${typedDraft.trim()}`);
    }
    if (typedMathDraft.trim()) {
      lines.push(`Draft equation: ${typedMathDraft.trim()}`);
    }
    if (strokes.length > 0) {
      lines.push(`[Handwritten working attached: ${strokes.length} stroke${strokes.length === 1 ? '' : 's'}]`);
    }
    return lines.join('\n');
  }, [strokes.length, typedDraft, typedMathDraft, typedSteps]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    typedStepsRef.current = typedSteps;
  }, [typedSteps]);

  useEffect(() => {
    selectedStepIndexRef.current = selectedStepIndex;
  }, [selectedStepIndex]);

  useEffect(() => {
    let cancelled = false;
    import('mathlive')
      .then(() => {
        if (!cancelled) setIsMathLiveReady(true);
      })
      .catch((error) => {
        console.warn('[PracticePad] MathLive failed to load, using text input fallback.', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMathLiveReady) return;
    const mathField = mathFieldRef.current;
    if (!mathField) return;

    mathField.setAttribute('virtual-keyboard-mode', 'manual');
    mathField.setAttribute('smart-mode', 'on');
    mathField.setAttribute('math-virtual-keyboard-policy', 'manual');
    mathField.setAttribute('letter-shape-style', 'french');
    if (typeof mathField.setOptions === 'function') {
      mathField.setOptions({
        smartMode: true,
        virtualKeyboardMode: 'manual',
        defaultMode: 'math',
      });
    }

    const handleMathInput = () => {
      const nextValue =
        typeof mathField.getValue === 'function'
          ? String(mathField.getValue('latex') || '')
          : String(mathField.value || '');
      setTypedMathDraft((prev) => (prev === nextValue ? prev : nextValue));
    };

    mathField.addEventListener('input', handleMathInput);
    return () => {
      mathField.removeEventListener('input', handleMathInput);
    };
  }, [isMathLiveReady]);

  useEffect(() => {
    if (!isMathLiveReady) return;
    const mathField = mathFieldRef.current;
    if (!mathField) return;
    if ((mathField.value || '') !== typedMathDraft) {
      mathField.value = typedMathDraft;
    }
  }, [isMathLiveReady, typedMathDraft]);

  const pushHistory = useCallback((entry: PadHistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
    setRedoHistory([]);
  }, []);

  const redrawCanvas = useCallback((nextStrokes: PadStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nextStrokes.forEach((stroke) => drawStrokePath(ctx, stroke));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = workSurfaceRef.current;
    if (!canvas || !surface) return;

    const resizeCanvas = () => {
      const rect = surface.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redrawCanvas(strokesRef.current);
    };

    resizeCanvas();
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(surface);
    return () => observer.disconnect();
  }, [redrawCanvas]);

  useEffect(() => {
    redrawCanvas(strokes);
  }, [redrawCanvas, strokes]);

  const getPointFromEvent = useCallback((event: React.PointerEvent<HTMLCanvasElement>): PadPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: Number.isFinite(event.pressure) && event.pressure > 0 ? event.pressure : 0.5,
    };
  }, []);

  const handleCanvasPointerDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pen' && activeTool !== 'eraser') return;
    if (pointerIdRef.current !== null) return;
    const point = getPointFromEvent(event);
    if (!point) return;

    pointerIdRef.current = event.pointerId;
    drawingStrokeRef.current = {
      id: createStrokeId(),
      tool: activeTool,
      width: activeTool === 'eraser' ? ERASER_WIDTH : PEN_WIDTH,
      points: [point],
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [activeTool, getPointFromEvent]);

  const handleCanvasPointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;
    const draft = drawingStrokeRef.current;
    if (!draft) return;
    const point = getPointFromEvent(event);
    if (!point) return;

    draft.points.push(point);
    redrawCanvas([...strokesRef.current, draft]);
  }, [getPointFromEvent, redrawCanvas]);

  const finalizeStroke = useCallback((event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event && pointerIdRef.current !== event.pointerId) return;
    const draft = drawingStrokeRef.current;
    if (!draft) return;
    if (draft.points.length === 1) {
      draft.points.push({ ...draft.points[0] });
    }
    setStrokes((prev) => [...prev, draft]);
    pushHistory({ kind: 'stroke', stroke: draft });
    drawingStrokeRef.current = null;
    pointerIdRef.current = null;
    if (event) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, [pushHistory]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      setRedoHistory((redo) => [...redo, entry]);

      if (entry.kind === 'stroke') {
        setStrokes((current) => current.slice(0, -1));
      } else if (entry.kind === 'typed_step') {
        const removingIndex = typedStepsRef.current.length - 1;
        setTypedSteps((current) => current.slice(0, -1));
        setSelectedStepIndex((current) => (current !== null && current >= removingIndex ? null : current));
      } else {
        setStrokes(cloneStrokes(entry.snapshot.strokes));
        setTypedSteps([...entry.snapshot.typedSteps]);
        setSelectedStepIndex(entry.snapshot.selectedStepIndex);
      }

      return prev.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoHistory((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      setHistory((historyPrev) => [...historyPrev, entry]);

      if (entry.kind === 'stroke') {
        setStrokes((current) => [...current, entry.stroke]);
      } else if (entry.kind === 'typed_step') {
        const nextIndex = typedStepsRef.current.length;
        setTypedSteps((current) => [...current, entry.text]);
        setSelectedStepIndex(nextIndex);
      } else {
        setStrokes([]);
        setTypedSteps([]);
        setSelectedStepIndex(null);
      }

      return prev.slice(0, -1);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    if (!hasWorking || isSubmitting) return;
    if (!window.confirm('Clear all current working from the pad?')) return;

    pushHistory({
      kind: 'clear',
      snapshot: {
        strokes: cloneStrokes(strokesRef.current),
        typedSteps: [...typedStepsRef.current],
        selectedStepIndex: selectedStepIndexRef.current,
      },
    });
    setStrokes([]);
    setTypedSteps([]);
    setTypedDraft('');
    setTypedMathDraft('');
    const mathField = mathFieldRef.current;
    if (mathField && 'value' in mathField) {
      mathField.value = '';
    }
    setSelectedStepIndex(null);
    setResult(null);
  }, [hasWorking, isSubmitting, pushHistory]);

  const commitTypedStep = useCallback(() => {
    const rawStep = typedDraftMode === 'math' ? typedMathDraft.trim() : typedDraft.trim();
    const step = typedDraftMode === 'math' ? `${MATH_STEP_PREFIX}${rawStep}` : rawStep;
    if (!step) return;
    const nextIndex = typedStepsRef.current.length;
    setTypedSteps((prev) => [...prev, step]);
    setTypedDraft('');
    setTypedMathDraft('');
    const mathField = mathFieldRef.current;
    if (mathField && 'value' in mathField) {
      mathField.value = '';
    }
    setSelectedStepIndex(nextIndex);
    pushHistory({ kind: 'typed_step', text: step });
  }, [pushHistory, typedDraft, typedDraftMode, typedMathDraft]);

  const buildContinuePayload = useCallback((): { message: string; tutorAction: TutorActionRequest } | null => {
    if (!onContinueInChat || !result) return null;

    const parts: string[] = [];
    if (promptPreview) parts.push(`Problem prompt:\n${promptPreview}`);
    if (topicLabel) parts.push(`Topic focus:\n${topicLabel}`);
    parts.push(`Student working:\n${compiledWorkingText.trim().slice(0, 2200)}`);
    if (selectedStep.trim()) {
      parts.push(`Step the student wants checked:\n${selectedStep.trim().slice(0, 600)}`);
    }
    parts.push(`Practice Pad feedback:\n${String(result.feedback || '').trim().slice(0, 900)}`);
    if (result.diagnosis) parts.push(`Likely issue:\n${String(result.diagnosis).trim().slice(0, 500)}`);
    parts.push(`Next move:\n${String(result.nextStep || '').trim().slice(0, 500)}`);

    const tutorAction: TutorActionRequest = {
      id: 'ask',
      sourceMessageId: context?.sourceMessageId || undefined,
      selectedText: selectedStep.trim() ? selectedStep.trim().slice(0, 900) : undefined,
      sourceText: parts.join('\n\n').slice(0, 3000),
      invokedFrom: 'composer',
      inputOrigin: 'text',
      composerIntent: 'practice_pad_followup',
    };

    return {
      message: 'Continue from Practice Pad. Ask me one short question for the next step, then wait for my attempt.',
      tutorAction,
    };
  }, [compiledWorkingText, context?.sourceMessageId, onContinueInChat, promptPreview, result, selectedStep, topicLabel]);

  const runTutorAction = useCallback((actionId: TutorActionRequest['id']) => {
    if (!onContinueInChat) return;
    const normalizedWorking = compiledWorkingText.trim();
    if (!normalizedWorking) return;

    const tutorAction: TutorActionRequest = {
      id: actionId,
      sourceMessageId: context?.sourceMessageId || undefined,
      sourceText: normalizedWorking.slice(0, 3000),
      selectedText: selectedStep.trim() ? selectedStep.trim().slice(0, 900) : undefined,
      invokedFrom: 'composer',
      inputOrigin: 'text',
      composerIntent: 'practice_pad_followup',
    };

    onContinueInChat({
      message: buildHiddenTutorPrompt(actionId, selectedStep.trim(), topicLabel),
      tutorAction,
    });
  }, [compiledWorkingText, context?.sourceMessageId, onContinueInChat, selectedStep, topicLabel]);

  const handleSubmitWorking = useCallback(async () => {
    if (!hasWorking || isSubmitting) return;
    const normalizedWorking = compiledWorkingText.trim();
    if (!normalizedWorking) return;

    const stepFocus: PracticePadStepFocus = selectedStep.trim()
      ? 'selected_step'
      : activeTool === 'select'
        ? 'stuck_point'
        : 'checking_work';

    const reflection: PracticePadReflectionPayload = {
      ...metacognitiveState,
      studentReflectionNote: metacognitiveState?.studentReflectionNote || null,
      whatTryingToDo: promptPreview || null,
      leastSureStep: selectedStep.trim() || null,
      supportChoice,
    };

    setIsSubmitting(true);
    try {
      const nextResult = await onCheckStep({
        sessionId: sessionId || null,
        prompt: promptPreview || null,
        workText: normalizedWorking,
        selectedStep: selectedStep.trim() || null,
        topic: context?.topic || null,
        subject: context?.subject || null,
        supportChoice,
        stepFocus,
        reflection,
        sourceMessageId: context?.sourceMessageId || null,
      });
      setResult(nextResult);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    activeTool,
    compiledWorkingText,
    context?.sourceMessageId,
    context?.subject,
    context?.topic,
    hasWorking,
    isSubmitting,
    metacognitiveState,
    onCheckStep,
    promptPreview,
    selectedStep,
    sessionId,
    supportChoice,
  ]);

  const toolButtonClass = useCallback((tool: PracticePadTool) =>
    cn(
      'h-10 w-10 rounded-2xl border transition-all',
      activeTool === tool
        ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft-hover)] text-[var(--copilot-accent-text)] shadow-sm'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
    ), [activeTool]);

  const renderSupportRail = useCallback(() => (
    <div className="flex h-full min-h-0 flex-col rounded-3xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
      <div className="space-y-1 border-b border-slate-200/70 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Support</p>
        <p className="text-sm text-slate-700">
          {selectedStep.trim()
            ? 'Selected step active. Choose one action or submit your working.'
            : 'Pick one support move, then continue solving.'}
        </p>
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {selectedStep.trim() ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Selected step</p>
            <p className="mt-1 text-sm text-slate-800">{selectedStep}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Support style</p>
          <div className="flex flex-wrap gap-2">
            {supportOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSupportChoice(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  supportChoice === option.value
                    ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft-hover)] text-[var(--copilot-accent-text)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Step actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => runTutorAction('hint')} disabled={!hasWorking}>
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
              Hint
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => runTutorAction('breakdown')} disabled={!hasWorking}>
              <Rows3 className="mr-1.5 h-3.5 w-3.5" />
              Break down
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => runTutorAction('practice')} disabled={!hasWorking}>
              Similar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => {
                if (!onSaveWorking) return;
                onSaveWorking({
                  content: compiledWorkingText,
                  selectedStep: selectedStep.trim() || null,
                  topic: context?.topic || null,
                  subject: context?.subject || null,
                  sourceMessageId: context?.sourceMessageId || null,
                });
              }}
              disabled={!hasWorking}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>

        {result ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Feedback</p>
              <p className="mt-1 text-sm text-slate-800">{result.feedback}</p>
            </div>
            {result.diagnosis ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Likely issue</p>
                <p className="mt-1 text-sm text-slate-700">{result.diagnosis}</p>
              </div>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Next move</p>
              <p className="mt-1 text-sm text-slate-700">{result.nextStep}</p>
            </div>
            {onContinueInChat ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-xl border-[var(--copilot-accent-border)] bg-white text-slate-800 hover:border-[var(--copilot-accent-border)]"
                  onClick={() => {
                    const payload = buildContinuePayload();
                    if (!payload) return;
                  onContinueInChat(payload);
                }}
              >
                Continue in Study Chat
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700">
            {hasWorking
              ? 'Submit your working when you want guidance.'
              : 'Start solving in the work surface, then submit when you are ready.'}
          </div>
        )}

        {helperPrompt ? (
          <MetacognitivePromptCard
            prompt={helperPrompt}
            compact
            busy={isSubmitting}
            onChoose={(payload) => onRecordReflection?.(payload)}
          />
        ) : null}
      </div>

      <Button
        type="button"
        onClick={handleSubmitWorking}
        disabled={isSubmitting || !hasWorking}
        className="mt-3 h-10 rounded-xl"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-2 h-4 w-4" />}
        Submit working
      </Button>
    </div>
  ), [
    buildContinuePayload,
    compiledWorkingText,
    context?.sourceMessageId,
    context?.subject,
    context?.topic,
    hasWorking,
    helperPrompt,
    isSubmitting,
    onContinueInChat,
    onRecordReflection,
    onSaveWorking,
    result,
    runTutorAction,
    selectedStep,
    supportChoice,
  ]);

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-[var(--sf-cream-bg)]', className)}>
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3.5 sm:px-5">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Practice Pad</p>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">Show your working, {studentName}</h2>
            {masteryChip ? (
              <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-medium', masteryChip.classes)}>
                {masteryChip.label}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            {topicLabel ? `${topicLabel} - ` : ''}Show your working and get help one step at a time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden rounded-full lg:inline-flex"
            onClick={() => setIsFocusMode((prev) => !prev)}
          >
            {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <div
          className={cn(
            'grid h-full min-h-0 gap-3',
            isFocusMode
              ? 'lg:grid-cols-[64px_minmax(0,1fr)]'
              : 'lg:grid-cols-[64px_minmax(0,1fr)_minmax(280px,320px)]'
          )}
        >
          <div className="hidden h-full min-h-0 flex-col items-center gap-2 rounded-3xl border border-slate-200/80 bg-white/85 p-2 shadow-sm lg:flex">
            <button type="button" className={toolButtonClass('pen')} title="Pen" onClick={() => setActiveTool('pen')}>
              <PenLine className="mx-auto h-4 w-4" />
            </button>
            <button type="button" className={toolButtonClass('eraser')} title="Eraser" onClick={() => setActiveTool('eraser')}>
              <Eraser className="mx-auto h-4 w-4" />
            </button>
            <button type="button" className={toolButtonClass('type')} title="Type" onClick={() => setActiveTool('type')}>
              <Type className="mx-auto h-4 w-4" />
            </button>
            <button type="button" className={toolButtonClass('select')} title="Select" onClick={() => setActiveTool('select')}>
              <MousePointer2 className="mx-auto h-4 w-4" />
            </button>
            <div className="my-1 h-px w-9 bg-slate-200" />
            <button
              type="button"
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              title="Undo"
              onClick={handleUndo}
              disabled={history.length === 0}
            >
              <Undo2 className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
              title="Redo"
              onClick={handleRedo}
              disabled={redoHistory.length === 0}
            >
              <Redo2 className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
              title="Clear"
              onClick={handleClearAll}
              disabled={!hasWorking || isSubmitting}
            >
              <Trash2 className="mx-auto h-4 w-4" />
            </button>
            <div className="mt-auto w-full">
              <Button
                type="button"
                onClick={handleSubmitWorking}
                disabled={isSubmitting || !hasWorking}
                className="h-10 w-full rounded-2xl px-2 text-xs"
              >
                {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-1.5 h-4 w-4" />}
                Submit working
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            {promptPreview ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-2.5 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold text-slate-900">Current prompt:</span> {promptPreview}
              </div>
            ) : null}

            <div
              ref={workSurfaceRef}
              className="relative min-h-[320px] flex-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.08) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  'absolute inset-0 h-full w-full touch-none',
                  activeTool === 'pen' || activeTool === 'eraser' ? 'cursor-crosshair' : 'pointer-events-none'
                )}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={finalizeStroke}
                onPointerCancel={finalizeStroke}
              />

              <div className="relative z-10 flex h-full min-h-0 flex-col p-4 sm:p-5">
                {!hasWorking ? (
                  <div className="pointer-events-none mb-3 rounded-2xl border border-dashed border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-500">
                    Write your steps here. Use Pen for rough work, Type for clean equations, then Submit working.
                  </div>
                ) : null}

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {typedSteps.map((step, index) => {
                      const isSelected = index === selectedStepIndex;
                      const mathStep = isMathStep(step);
                      const stepDisplay = stripMathStepPrefix(step);
                      return (
                        <button
                          key={`step-${index}`}
                          type="button"
                          onClick={() => {
                            if (activeTool !== 'select') return;
                            setSelectedStepIndex(index);
                          }}
                          className={cn(
                            'w-full rounded-2xl border px-3 py-2 text-left transition',
                            isSelected
                              ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-slate-900'
                              : 'border-slate-200 bg-white/80 text-slate-700',
                            activeTool === 'select' ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'
                          )}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Step {index + 1}{mathStep ? ' · Equation' : ''}
                          </p>
                          {mathStep ? (
                            <p className="mt-1 overflow-x-auto rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 font-mono text-sm text-slate-900">
                              {stepDisplay}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm">{stepDisplay}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeTool === 'type' || typedDraft.trim().length > 0 || typedMathDraft.trim().length > 0 ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Type a step</p>
                      <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                            typedDraftMode === 'math'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                          onClick={() => setTypedDraftMode('math')}
                        >
                          Equation
                        </button>
                        <button
                          type="button"
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] font-medium transition',
                            typedDraftMode === 'text'
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                          onClick={() => setTypedDraftMode('text')}
                        >
                          Text
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      {typedDraftMode === 'math' ? (
                        isMathLiveReady ? (
                          <div className="practice-pad-math-input-wrap flex h-10 flex-1 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm focus-within:border-[var(--copilot-accent-border)]">
                            {/* eslint-disable-next-line react/no-unknown-property */}
                            <math-field
                              ref={(node) => {
                                mathFieldRef.current = node as MathFieldElement | null;
                              }}
                              className="w-full practice-pad-math-field"
                              placeholder="Type equation here"
                              virtual-keyboard-mode="manual"
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                  event.preventDefault();
                                  commitTypedStep();
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <input
                            value={typedMathDraft}
                            onChange={(event) => setTypedMathDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                commitTypedStep();
                              }
                            }}
                            placeholder="Loading equation input... type LaTeX for now."
                            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-mono outline-none focus:border-[var(--copilot-accent-border)]"
                          />
                        )
                      ) : (
                        <input
                          value={typedDraft}
                          onChange={(event) => setTypedDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              commitTypedStep();
                            }
                          }}
                          placeholder="Type one clear step, then press Enter."
                          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--copilot-accent-border)]"
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl"
                        onClick={commitTypedStep}
                        disabled={typedDraftMode === 'math' ? !typedMathDraft.trim() : !typedDraft.trim()}
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {isSubmitting ? (
                <div className="pointer-events-none absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-[var(--copilot-accent-border)] bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--copilot-accent-text)]" />
                  Reviewing your working...
                </div>
              ) : null}
            </div>

            {preferredSupports.length > 0 ? (
              <div className="hidden items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/75 px-3 py-2 text-xs text-slate-600 lg:flex">
                <span className="font-medium text-slate-700">What usually helps:</span>
                {preferredSupports.slice(0, 4).map((pattern) => (
                  <span key={pattern} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px]">
                    {pattern.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {!isFocusMode ? (
            <div className="hidden min-h-0 lg:flex">{renderSupportRail()}</div>
          ) : null}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="relative flex items-center justify-between gap-1.5">
          <button type="button" className={toolButtonClass('pen')} onClick={() => setActiveTool('pen')} title="Pen">
            <PenLine className="mx-auto h-4 w-4" />
          </button>
          <button type="button" className={toolButtonClass('eraser')} onClick={() => setActiveTool('eraser')} title="Eraser">
            <Eraser className="mx-auto h-4 w-4" />
          </button>
          <button type="button" className={toolButtonClass('type')} onClick={() => setActiveTool('type')} title="Type">
            <Type className="mx-auto h-4 w-4" />
          </button>
          <button type="button" className={toolButtonClass('select')} onClick={() => setActiveTool('select')} title="Select">
            <MousePointer2 className="mx-auto h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-10 w-10 rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
            onClick={handleUndo}
            disabled={history.length === 0}
            title="Undo"
          >
            <Undo2 className="mx-auto h-4 w-4" />
          </button>
          <Button type="button" className="h-10 rounded-2xl px-3.5" onClick={handleSubmitWorking} disabled={isSubmitting || !hasWorking}>
            {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <SendHorizontal className="mr-1.5 h-4 w-4" />}
            Submit working
          </Button>
          <button
            type="button"
            className={cn(
              'h-10 w-10 rounded-2xl border transition',
              isMobileMoreOpen
                ? 'border-slate-300 bg-slate-100 text-slate-900'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            )}
            onClick={() => setIsMobileMoreOpen((prev) => !prev)}
            title="More tools"
          >
            <Rows3 className="mx-auto h-4 w-4" />
          </button>

          {isMobileMoreOpen ? (
            <div className="absolute bottom-[3.2rem] right-0 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              <button
                type="button"
                className="flex h-9 w-full items-center rounded-xl px-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  handleRedo();
                }}
                disabled={redoHistory.length === 0}
              >
                <Redo2 className="mr-2 h-4 w-4" />
                Redo
              </button>
              <button
                type="button"
                className="flex h-9 w-full items-center rounded-xl px-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  handleClearAll();
                }}
                disabled={!hasWorking}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all
              </button>
              <button
                type="button"
                className="flex h-9 w-full items-center rounded-xl px-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsFocusMode((prev) => !prev);
                }}
              >
                {isFocusMode ? <Minimize2 className="mr-2 h-4 w-4" /> : <Maximize2 className="mr-2 h-4 w-4" />}
                {isFocusMode ? 'Exit focus mode' : 'Focus mode'}
              </button>
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="mt-1 flex h-9 w-full items-center rounded-xl px-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setIsMobileMoreOpen(false)}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Open support
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[78vh] rounded-t-3xl border">
                  <SheetHeader>
                    <SheetTitle>Practice support</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 h-[calc(100%-2.5rem)] min-h-0">{renderSupportRail()}</div>
                </SheetContent>
              </Sheet>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
