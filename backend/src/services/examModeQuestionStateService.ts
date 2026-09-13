import prisma from '../lib/prisma';

export interface CreateQuestionStateInput {
  examSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  questionFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}

export async function createQuestionState(input: CreateQuestionStateInput) {
  return prisma.examModeQuestionStateRecord.create({
    data: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      examSessionId: input.examSessionId,
      modeSessionId: input.modeSessionId,
      questionKey: input.questionKey,
      questionIndex: input.questionIndex,
      questionRef: input.questionRef || null,
      questionFingerprint: input.questionFingerprint || null,
      topicId: input.topicId || null,
      skillId: input.skillId || null,
      difficultyBucket: input.difficultyBucket || null,
      status: 'not_started',
      attemptNumber: 0,
      safeReasonCodesJson: input.safeReasonCodes || [],
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });
}

export async function getCurrentQuestionState(examSessionId: string, questionIndex: number) {
  return prisma.examModeQuestionStateRecord.findFirst({
    where: { examSessionId, questionIndex },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuestionStateByKey(examSessionId: string, questionKey: string) {
  return prisma.examModeQuestionStateRecord.findFirst({
    where: { examSessionId, questionKey },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAllQuestionStates(examSessionId: string) {
  return prisma.examModeQuestionStateRecord.findMany({
    where: { examSessionId },
    orderBy: { questionIndex: 'asc' },
  });
}

export async function updateQuestionStatus(
  id: string,
  status: string,
  extra?: {
    answerQuality?: string;
    isCorrect?: boolean;
    mistakeCategory?: string;
    confidenceBucket?: string;
    timeSpentBucket?: string;
    scoreBucket?: string;
    selectedTutorAction?: string;
    hintLevel?: string;
    safeReasonCodes?: string[];
    safeEvidenceRefs?: string[];
  },
) {
  const data: any = { status };
  if (extra) {
    if (extra.answerQuality !== undefined) data.answerQuality = extra.answerQuality;
    if (extra.isCorrect !== undefined) data.isCorrect = extra.isCorrect;
    if (extra.mistakeCategory !== undefined) data.mistakeCategory = extra.mistakeCategory;
    if (extra.confidenceBucket !== undefined) data.confidenceBucket = extra.confidenceBucket;
    if (extra.timeSpentBucket !== undefined) data.timeSpentBucket = extra.timeSpentBucket;
    if (extra.scoreBucket !== undefined) data.scoreBucket = extra.scoreBucket;
    if (extra.selectedTutorAction !== undefined) data.selectedTutorAction = extra.selectedTutorAction;
    if (extra.hintLevel !== undefined) data.hintLevel = extra.hintLevel;
    if (extra.safeReasonCodes !== undefined) data.safeReasonCodesJson = extra.safeReasonCodes;
    if (extra.safeEvidenceRefs !== undefined) data.safeEvidenceRefsJson = extra.safeEvidenceRefs;
  }
  if (['attempted', 'completed', 'skipped'].includes(status)) {
    data.completedAt = new Date();
  }
  return prisma.examModeQuestionStateRecord.update({
    where: { id },
    data,
  });
}

export async function markQuestionActive(examSessionId: string, questionIndex: number) {
  const state = await getCurrentQuestionState(examSessionId, questionIndex);
  if (state) {
    return updateQuestionStatus(state.id, 'active');
  }
  return null;
}

export async function markQuestionAttempted(examSessionId: string, questionIndex: number, attemptNumber: number) {
  const state = await getCurrentQuestionState(examSessionId, questionIndex);
  if (state) {
    return updateQuestionStatus(state.id, 'attempted', {});
  }
  return null;
}

export async function flagQuestion(id: string) {
  return updateQuestionStatus(id, 'flagged');
}

export async function skipQuestion(id: string) {
  return updateQuestionStatus(id, 'skipped');
}

export async function completeQuestion(id: string) {
  return updateQuestionStatus(id, 'completed');
}

export async function createQuestionStatesBatch(
  examSessionId: string,
  modeSessionId: string,
  schoolId: string,
  studentId: string,
  count: number,
  startIndex = 0,
) {
  const results = [];
  for (let i = 0; i < count; i++) {
    const q = await createQuestionState({
      examSessionId,
      modeSessionId,
      schoolId,
      studentId,
      questionKey: `q_${startIndex + i}`,
      questionIndex: startIndex + i,
    });
    results.push(q);
  }
  return results;
}

export function serializeQuestionState(state: any) {
  return {
    id: state.id,
    examSessionId: state.examSessionId,
    modeSessionId: state.modeSessionId,
    questionKey: state.questionKey,
    questionIndex: state.questionIndex,
    questionRef: state.questionRef || undefined,
    questionFingerprint: state.questionFingerprint || undefined,
    topicId: state.topicId || undefined,
    skillId: state.skillId || undefined,
    difficultyBucket: state.difficultyBucket || undefined,
    status: state.status,
    attemptNumber: state.attemptNumber,
    answerQuality: state.answerQuality || undefined,
    isCorrect: state.isCorrect ?? undefined,
    mistakeCategory: state.mistakeCategory || undefined,
    confidenceBucket: state.confidenceBucket || undefined,
    timeSpentBucket: state.timeSpentBucket || undefined,
    scoreBucket: state.scoreBucket || undefined,
    selectedTutorAction: state.selectedTutorAction || undefined,
    hintLevel: state.hintLevel || undefined,
    safeReasonCodes: state.safeReasonCodesJson || [],
    safeEvidenceRefs: state.safeEvidenceRefsJson || [],
    createdAt: state.createdAt.toISOString(),
    updatedAt: state.updatedAt.toISOString(),
    completedAt: state.completedAt?.toISOString(),
  };
}
