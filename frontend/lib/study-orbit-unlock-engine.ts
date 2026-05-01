import type { StudyOrbitStage } from '@/lib/study-orbit-tracking';

export type StudyOrbitUnlockAction =
  | 'open_next'
  | 'quick_check'
  | 'teach_back'
  | 'keep_anchor'
  | 'transfer'
  | 'continue';

export interface StudyOrbitUnlockContext {
  stage: StudyOrbitStage;
  evidenceScore: number;
  confidenceScore: number;
  opens: number;
  quickChecks: number;
  teachBackChecks: number;
  reflections: number;
  strongChecks: number;
  closeChecks: number;
  keepCount: number;
  saveToRevisionCount: number;
  similarQuestionAttempts: number;
  nextTopic: string | null;
}

export interface StudyOrbitUnlockView {
  readiness: 'not_ready' | 'nearly_ready' | 'ready';
  title: string;
  guidance: string;
  whyLine: string;
  action: StudyOrbitUnlockAction;
  actionLabel: string;
}

function compactTopic(value: string | null | undefined): string {
  const normalized = String(value || '').trim();
  if (!normalized) return 'the next idea';
  return normalized.length <= 72 ? normalized : `${normalized.slice(0, 69).trimEnd()}...`;
}

export function buildStudyOrbitUnlockView(context: StudyOrbitUnlockContext): StudyOrbitUnlockView {
  const checks = context.quickChecks + context.teachBackChecks;
  const consolidation = context.keepCount + context.saveToRevisionCount;
  const hasQuality = context.strongChecks > 0 || context.closeChecks >= 2;
  const nextTopic = compactTopic(context.nextTopic);

  if (context.stage === 'ready_to_unlock') {
    return {
      readiness: 'ready',
      title: 'Unlock next',
      guidance: `You unlocked ${nextTopic}. Move forward when you are ready.`,
      whyLine: 'Momentum is highest right after you lock one clear explanation.',
      action: 'open_next',
      actionLabel: 'Open next step',
    };
  }

  if (checks === 0) {
    return {
      readiness: 'not_ready',
      title: 'Unlock next',
      guidance: 'Answer one quick check to unlock the next layer.',
      whyLine: `A first attempt gives the orbit enough evidence to sequence ${nextTopic} well.`,
      action: 'quick_check',
      actionLabel: 'Try quick check',
    };
  }

  if (context.reflections === 0) {
    return {
      readiness: 'not_ready',
      title: 'Unlock next',
      guidance: 'Explain why your answer works to unlock the next idea.',
      whyLine: 'Reflection turns recall into understanding and improves the next recommendation.',
      action: 'teach_back',
      actionLabel: 'Explain why',
    };
  }

  if (consolidation === 0) {
    return {
      readiness: 'nearly_ready',
      title: 'Unlock next',
      guidance: 'Keep this anchor to move forward confidently.',
      whyLine: 'Saving one anchor helps the next card build on stable memory.',
      action: 'keep_anchor',
      actionLabel: 'Keep anchor',
    };
  }

  if (context.similarQuestionAttempts === 0 && hasQuality) {
    return {
      readiness: 'nearly_ready',
      title: 'Unlock next',
      guidance: 'Try one transfer question to unlock the next idea.',
      whyLine: 'Transfer evidence confirms the concept works outside this exact example.',
      action: 'transfer',
      actionLabel: 'Try transfer',
    };
  }

  return {
    readiness: context.confidenceScore >= 58 || context.evidenceScore >= 56 ? 'nearly_ready' : 'not_ready',
    title: 'Unlock next',
    guidance: 'One more strong response will unlock the next step.',
    whyLine: `Staying with this card a little longer will make ${nextTopic} feel easier.`,
    action: 'continue',
    actionLabel: 'Keep going',
  };
}
