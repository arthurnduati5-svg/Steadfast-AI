import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { TeachBackModePromptState } from '../contracts/teachBackModeContracts';

export async function createPromptState(data: {
  teachBackSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  questionRef?: string;
  contentFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
}) {
  return prisma.teachBackModePromptStateRecord.create({
    data: {
      id: randomUUID(),
      schoolId: data.schoolId,
      studentId: data.studentId,
      teachBackSessionId: data.teachBackSessionId,
      modeSessionId: data.modeSessionId,
      promptKey: data.promptKey,
      promptIndex: data.promptIndex,
      promptRef: data.promptRef || null,
      questionRef: data.questionRef || null,
      contentFingerprint: data.contentFingerprint || null,
      topicId: data.topicId || null,
      skillId: data.skillId || null,
      difficultyBucket: data.difficultyBucket || null,
      status: 'not_started',
      attemptNumber: 0,
      safeReasonCodesJson: [],
      safeEvidenceRefsJson: [],
      updatedAt: new Date(),
    },
  });
}

export async function createPromptStatesBatch(
  teachBackSessionId: string,
  modeSessionId: string,
  schoolId: string,
  studentId: string,
  promptCount: number,
) {
  const states = [];
  const now = new Date();
  for (let i = 0; i < promptCount; i++) {
    states.push({
      id: randomUUID(),
      schoolId,
      studentId,
      teachBackSessionId,
      modeSessionId,
      promptKey: `p_${i}`,
      promptIndex: i,
      status: 'not_started' as const,
      attemptNumber: 0,
      safeReasonCodesJson: [],
      safeEvidenceRefsJson: [],
      updatedAt: now,
    });
  }
  if (states.length > 0) {
    await prisma.teachBackModePromptStateRecord.createMany({ data: states });
  }
}

export async function getCurrentPromptState(teachBackSessionId: string, promptIndex: number) {
  return prisma.teachBackModePromptStateRecord.findFirst({
    where: { teachBackSessionId, promptIndex },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPromptStateByKey(teachBackSessionId: string, promptKey: string) {
  return prisma.teachBackModePromptStateRecord.findFirst({
    where: { teachBackSessionId, promptKey },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markPromptActive(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'active' },
  });
}

export async function markPromptExplained(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'explained' },
  });
}

export async function markPromptFeedbackReady(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'feedback_ready' },
  });
}

export async function markPromptRetryRequested(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'retry_requested' },
  });
}

export async function markPromptReflectionReady(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'reflection_ready' },
  });
}

export async function skipPrompt(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'skipped', completedAt: new Date() },
  });
}

export async function completePrompt(id: string) {
  return prisma.teachBackModePromptStateRecord.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  });
}

export async function updatePromptState(
  id: string,
  data: {
    explanationQuality?: string;
    conceptCoverageBucket?: string;
    clarityBucket?: string;
    confidenceBucket?: string;
    misconceptionSignal?: string;
    supportNeed?: string;
    masterySignal?: string;
    readinessSignal?: string;
    selectedTutorAction?: string;
    hintLevel?: string;
    attemptNumber?: number;
    safeReasonCodesJson?: string[];
    safeEvidenceRefsJson?: string[];
  },
) {
  const updateData: any = {};
  if (data.explanationQuality !== undefined) updateData.explanationQuality = data.explanationQuality;
  if (data.conceptCoverageBucket !== undefined) updateData.conceptCoverageBucket = data.conceptCoverageBucket;
  if (data.clarityBucket !== undefined) updateData.clarityBucket = data.clarityBucket;
  if (data.confidenceBucket !== undefined) updateData.confidenceBucket = data.confidenceBucket;
  if (data.misconceptionSignal !== undefined) updateData.misconceptionSignal = data.misconceptionSignal;
  if (data.supportNeed !== undefined) updateData.supportNeed = data.supportNeed;
  if (data.masterySignal !== undefined) updateData.masterySignal = data.masterySignal;
  if (data.readinessSignal !== undefined) updateData.readinessSignal = data.readinessSignal;
  if (data.selectedTutorAction !== undefined) updateData.selectedTutorAction = data.selectedTutorAction;
  if (data.hintLevel !== undefined) updateData.hintLevel = data.hintLevel;
  if (data.attemptNumber !== undefined) updateData.attemptNumber = data.attemptNumber;
  if (data.safeReasonCodesJson !== undefined) updateData.safeReasonCodesJson = data.safeReasonCodesJson;
  if (data.safeEvidenceRefsJson !== undefined) updateData.safeEvidenceRefsJson = data.safeEvidenceRefsJson;
  return prisma.teachBackModePromptStateRecord.update({ where: { id }, data: updateData });
}

export function serializePromptState(state: any): TeachBackModePromptState {
  return {
    id: state.id,
    teachBackSessionId: state.teachBackSessionId,
    modeSessionId: state.modeSessionId,
    promptKey: state.promptKey,
    promptIndex: state.promptIndex,
    promptRef: state.promptRef || undefined,
    questionRef: state.questionRef || undefined,
    contentFingerprint: state.contentFingerprint || undefined,
    topicId: state.topicId || undefined,
    skillId: state.skillId || undefined,
    difficultyBucket: state.difficultyBucket || undefined,
    status: state.status,
    attemptNumber: state.attemptNumber,
    explanationQuality: state.explanationQuality || undefined,
    conceptCoverageBucket: state.conceptCoverageBucket || undefined,
    clarityBucket: state.clarityBucket || undefined,
    confidenceBucket: state.confidenceBucket || undefined,
    misconceptionSignal: state.misconceptionSignal || undefined,
    supportNeed: state.supportNeed || undefined,
    masterySignal: state.masterySignal || undefined,
    readinessSignal: state.readinessSignal || undefined,
    selectedTutorAction: state.selectedTutorAction || undefined,
    hintLevel: state.hintLevel || undefined,
    safeReasonCodes: Array.isArray(state.safeReasonCodesJson) ? state.safeReasonCodesJson : [],
    safeEvidenceRefs: Array.isArray(state.safeEvidenceRefsJson) ? state.safeEvidenceRefsJson : [],
    createdAt: state.createdAt instanceof Date ? state.createdAt.toISOString() : String(state.createdAt),
    updatedAt: state.updatedAt instanceof Date ? state.updatedAt.toISOString() : String(state.updatedAt),
    completedAt: state.completedAt instanceof Date ? state.completedAt.toISOString() : undefined,
  };
}
