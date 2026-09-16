import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { FocusModeStepType, FocusModeStepStatus, FocusModeStage, FocusModeReasonCode } from '../contracts/focusModeContracts';
import { TUTOR_ACTION_TYPES, type TutorActionType } from '../contracts/tutorActionContracts';

const ACTION_TO_STEP_TYPE: Record<string, FocusModeStepType> = {
  ask_student_to_try_first: 'try_first',
  give_attention_hint: 'hint_attention',
  give_direction_hint: 'hint_direction',
  rephrase_question: 'rephrase',
  simplify_concept: 'rephrase',
  break_into_micro_step: 'smaller_step',
  give_micro_example: 'micro_example',
  repair_misconception: 'repair_misconception',
  ask_reflection_question: 'reflect',
  ask_teach_back: 'teach_back',
  ask_clarifying_question: 'micro_question',
  ask_next_question: 'micro_question',
  guided_completion: 'smaller_step',
  check_foundation: 'notice',
  check_readiness: 'notice',
  summarize_progress: 'summary',
  exit_mode_summary: 'exit',
};

export function mapTutorActionToStepType(action: TutorActionType): FocusModeStepType {
  return ACTION_TO_STEP_TYPE[action] || 'orient';
}

export async function createInitialStep(input: {
  focusSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  stage: string;
}) {
  return prisma.focusModeStepRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      focusSessionId: input.focusSessionId,
      modeSessionId: input.modeSessionId,
      stepKey: `step_initial`,
      stepType: 'orient',
      stage: input.stage,
      status: 'active',
      safeReasonCodesJson: ['focus_started'],
      safeEvidenceRefsJson: [],
    },
  });
}

export async function createStep(input: {
  focusSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  stepKey: string;
  stepType: string;
  stage: string;
  selectedTutorAction?: string;
  hintLevel?: string;
  supportLevel?: string;
  learnerNeedCategory?: string;
  attemptNumber?: number;
  reasonCodes?: string[];
}) {
  return prisma.focusModeStepRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      focusSessionId: input.focusSessionId,
      modeSessionId: input.modeSessionId,
      stepKey: input.stepKey,
      stepType: input.stepType,
      stage: input.stage,
      status: 'active',
      selectedTutorAction: input.selectedTutorAction || null,
      hintLevel: input.hintLevel || null,
      supportLevel: input.supportLevel || null,
      learnerNeedCategory: input.learnerNeedCategory || null,
      attemptNumber: input.attemptNumber || null,
      safeReasonCodesJson: input.reasonCodes || [],
      safeEvidenceRefsJson: [],
    },
  });
}

export async function getActiveStepForSession(focusSessionId: string) {
  return prisma.focusModeStepRecord.findFirst({
    where: { focusSessionId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getStepsForSession(focusSessionId: string) {
  return prisma.focusModeStepRecord.findMany({
    where: { focusSessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function completeStep(id: string) {
  return prisma.focusModeStepRecord.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  });
}

export async function completeActiveStepForSession(focusSessionId: string) {
  const active = await getActiveStepForSession(focusSessionId);
  if (active) {
    return completeStep(active.id);
  }
  return null;
}

export async function updateFocusSessionCurrentStepKey(focusSessionId: string, stepKey: string) {
  return prisma.focusModeSessionRecord.update({
    where: { id: focusSessionId },
    data: { currentStepKey: stepKey },
  });
}

export function serializeFocusStep(step: any) {
  return {
    id: step.id,
    focusSessionId: step.focusSessionId,
    modeSessionId: step.modeSessionId,
    stepKey: step.stepKey,
    stepType: step.stepType,
    stage: step.stage,
    status: step.status,
    selectedTutorAction: step.selectedTutorAction || undefined,
    hintLevel: step.hintLevel || undefined,
    supportLevel: step.supportLevel || undefined,
    learnerNeedCategory: step.learnerNeedCategory || undefined,
    attemptNumber: step.attemptNumber || undefined,
    safeReasonCodes: step.safeReasonCodesJson || [],
    safeEvidenceRefs: step.safeEvidenceRefsJson || [],
    createdAt: step.createdAt.toISOString(),
    completedAt: step.completedAt?.toISOString(),
  };
}
