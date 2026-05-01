'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, BookOpenText, ListTodo, NotebookPen, TrendingUp, TriangleAlert, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type {
  FullscreenGrowthSection,
  GrowthActionIntent,
  GrowthActionPayload,
  GrowthActionPlan,
  GrowthActionFunnelSummary,
  GrowthDailyFeedItem,
  GrowthDailyFeedSnapshot,
  GrowthInlineActionType,
  GrowthInlineActionProgress,
  GrowthInlineActionRequest,
  GrowthWorkspaceMistakePattern,
  GrowthWorkspaceMasteryTrendsResponse,
  GrowthWorkspaceMistakeJournalResponse,
  GrowthWorkspaceOverviewResponse,
  GrowthWorkspaceStudyPlansResponse,
  GrowthWorkspaceWeakTopic,
  GrowthWorkspaceWeakTopicsResponse,
  MetacognitiveProfile,
  RevisionItem,
  RevisionMastery,
  RevisionOverview,
  StudyGoal,
  StudyPlan,
} from '@/lib/types';

type GrowthWorkspacePanelProps = {
  revisionOverview: RevisionOverview | null;
  metacognitiveProfile?: MetacognitiveProfile | null;
  activeSection: FullscreenGrowthSection;
  onSectionChange: (section: FullscreenGrowthSection) => void;
  onResolveGrowthAction?: (
    intent: GrowthActionIntent,
    payload?: GrowthActionPayload
  ) => Promise<GrowthActionPlan | null>;
  onExecuteGrowthActionPlan?: (
    plan: GrowthActionPlan
  ) => Promise<{ executed: boolean; reason?: string | null } | null> | { executed: boolean; reason?: string | null } | null;
};

type InlineActionRequest = GrowthInlineActionRequest & {
  revisionItem?: RevisionItem | null;
  dailyFeedItem?: GrowthDailyFeedItem | null;
  studyPlan?: StudyPlan | null;
  studyGoal?: StudyGoal | null;
  resolvedPlan?: GrowthActionPlan | null;
  onComplete?: (result: { evidenceScore?: number | null; notes?: string[] }) => void;
};

type RuntimeNotice = {
  tone: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

function uniqueRevisionItems(overview: RevisionOverview | null) {
  if (!overview) return [];
  const pool = [
    ...(overview.recentItems || []),
    ...(overview.ungroupedItems || []),
    ...(overview.pinnedItems || []),
    ...(overview.mistakeItems || []),
    ...(overview.needsPracticeItems || []),
    ...(overview.queuePreview?.dueNow || []),
    ...(overview.queuePreview?.needsAttention || []),
    ...(overview.queuePreview?.continuePractising || []),
    ...(overview.queuePreview?.newItems || []),
    ...(overview.queuePreview?.recentlyImproved || []),
    ...(overview.collections || []).flatMap((collection) => collection.previewItems || []),
  ];
  const map = new Map<string, RevisionItem>();
  pool.forEach((item) => {
    if (!item?.id || map.has(item.id)) return;
    map.set(item.id, item);
  });
  return [...map.values()];
}

function toMasteryText(mastery: RevisionMastery | null | undefined) {
  if (mastery === 'confident') return 'Confident';
  if (mastery === 'almost_there') return 'Almost there';
  if (mastery === 'getting_better') return 'Getting better';
  return 'Still learning';
}

function buildActionKey(request: GrowthInlineActionRequest) {
  return `${request.actionType}:${request.targetType}:${request.targetId}`;
}

const ACTION_INTENT_BY_TYPE: Record<GrowthInlineActionType, GrowthActionIntent> = {
  review_recap: 'review_recap',
  quiz: 'quiz_me',
  simpler_example: 'simpler_example',
  open_revision_inline: 'open_revision',
  work_on_this: 'practice_again',
  continue_plan: 'continue_plan',
  do_now: 'start_guided_session',
};

const ACTION_RUNTIME_COPY: Record<
  GrowthInlineActionType,
  {
    promptLabel: string;
    responsePlaceholder: string;
    submitLabel: string;
    minChars: number;
    scaffold: string[];
  }
> = {
  review_recap: {
    promptLabel: 'Recap check',
    responsePlaceholder: 'Summarize the key idea, then add one reason it matters.',
    submitLabel: 'Submit recap',
    minChars: 24,
    scaffold: ['What is the concept?', 'What is the key step?', 'Why does that step work?'],
  },
  quiz: {
    promptLabel: 'Quick quiz',
    responsePlaceholder: 'Answer in one or two lines and include your reasoning.',
    submitLabel: 'Submit answer',
    minChars: 18,
    scaffold: ['State your answer.', 'Explain your reasoning.', 'Check one likely mistake.'],
  },
  simpler_example: {
    promptLabel: 'Simpler-example transfer',
    responsePlaceholder: 'Write a simpler example, then link it back to the original topic.',
    submitLabel: 'Save example',
    minChars: 30,
    scaffold: ['Simpler version', 'Connection back to topic', 'One transfer check'],
  },
  open_revision_inline: {
    promptLabel: 'Revision anchor',
    responsePlaceholder: 'Write one focused revision note before opening full revision.',
    submitLabel: 'Save note',
    minChars: 20,
    scaffold: ['Main point', 'Common pitfall', 'Next review cue'],
  },
  work_on_this: {
    promptLabel: 'Repair loop',
    responsePlaceholder: 'Explain what went wrong and the corrected step.',
    submitLabel: 'Mark repaired',
    minChars: 24,
    scaffold: ['Why it went wrong', 'Correct step', 'One quick self-check'],
  },
  continue_plan: {
    promptLabel: 'Plan continuation',
    responsePlaceholder: 'Describe the next milestone and how you will verify it.',
    submitLabel: 'Update plan action',
    minChars: 20,
    scaffold: ['Next milestone', 'Time block', 'Evidence checkpoint'],
  },
  do_now: {
    promptLabel: 'Do-now execution',
    responsePlaceholder: 'Write the exact next move you will do now and the evidence you will capture.',
    submitLabel: 'Complete do-now',
    minChars: 20,
    scaffold: ['Immediate task', 'Expected output', 'How you will verify'],
  },
};

function toInlineIntent(actionType: GrowthInlineActionType): GrowthActionIntent {
  return ACTION_INTENT_BY_TYPE[actionType];
}

function mapGrowthPlanIntentToSection(intent: GrowthActionIntent): FullscreenGrowthSection {
  if (intent === 'continue_plan') return 'study_plans';
  if (intent === 'quiz_me' || intent === 'practice_again' || intent === 'similar_question') return 'daily_feed';
  if (intent === 'review_recap' || intent === 'view_worked_step') return 'weak_topics';
  return 'overview';
}

function useGrowthActionFramework() {
  const [activeAction, setActiveAction] = useState<InlineActionRequest | null>(null);
  const [progressByKey, setProgressByKey] = useState<Record<string, GrowthInlineActionProgress>>({});

  const openAction = (request: InlineActionRequest) => {
    const key = buildActionKey(request);
    setActiveAction(request);
    setProgressByKey((prev) => ({
      ...prev,
      [key]: {
        key,
        status: 'in_progress',
        completions: prev[key]?.completions || 0,
        startedAt: new Date().toISOString(),
        completedAt: prev[key]?.completedAt || null,
        evidenceScore: prev[key]?.evidenceScore ?? null,
        notes: prev[key]?.notes || [],
      },
    }));
  };

  const completeAction = (request: GrowthInlineActionRequest, payload?: { evidenceScore?: number | null; notes?: string[] }) => {
    const key = buildActionKey(request);
    setProgressByKey((prev) => ({
      ...prev,
      [key]: {
        key,
        status: 'completed',
        completions: (prev[key]?.completions || 0) + 1,
        startedAt: prev[key]?.startedAt || new Date().toISOString(),
        completedAt: new Date().toISOString(),
        evidenceScore: payload?.evidenceScore ?? prev[key]?.evidenceScore ?? null,
        notes: payload?.notes || prev[key]?.notes || [],
      },
    }));
  };

  return {
    activeAction,
    progressByKey,
    openAction,
    completeAction,
    closeAction: () => setActiveAction(null),
    getProgress: (request: GrowthInlineActionRequest) => progressByKey[buildActionKey(request)] || null,
  };
}

function buildLocalFeed(args: { dueNow: RevisionItem[]; weakTopic?: string | null; mistake?: RevisionItem | null }): GrowthDailyFeedSnapshot {
  const items: GrowthDailyFeedItem[] = [];
  if (args.dueNow[0]) {
    items.push({
      id: `local-due-${args.dueNow[0].id}`,
      type: 'due_now_recap',
      title: args.dueNow[0].title,
      subject: args.dueNow[0].subject || null,
      topic: args.dueNow[0].topic || args.dueNow[0].subtopic || null,
      reasonToday: 'Due-now timing from spaced revision queue.',
      estimatedMinutes: 6,
      nextActionLabel: 'Review recap',
      evidenceMode: 'short_reasoning',
      targetRevisionItemId: args.dueNow[0].id,
      status: 'pending',
    });
  }
  if (args.weakTopic) {
    items.push({
      id: `local-weak-${args.weakTopic.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'weak_topic_review',
      title: args.weakTopic,
      subject: null,
      topic: args.weakTopic,
      reasonToday: 'Recurring weak-topic pattern.',
      estimatedMinutes: 9,
      nextActionLabel: 'Work on this',
      evidenceMode: 'step_ordering',
      status: 'pending',
    });
  }
  if (args.mistake) {
    items.push({
      id: `local-mistake-${args.mistake.id}`,
      type: 'mistake_revisit',
      title: args.mistake.title,
      subject: args.mistake.subject || null,
      topic: args.mistake.topic || args.mistake.subtopic || null,
      reasonToday: 'Repeated mistake pattern requires repair.',
      estimatedMinutes: 7,
      nextActionLabel: 'Work on this',
      evidenceMode: 'why_wrong',
      targetRevisionItemId: args.mistake.id,
      status: 'pending',
    });
  }
  if (!items.length) {
    items.push({
      id: 'local-momentum-quick-cycle',
      type: 'momentum_item',
      title: 'Quick growth cycle',
      subject: 'General',
      topic: 'Mixed practice',
      reasonToday: 'No urgent weak signals detected, so run a short retention cycle.',
      estimatedMinutes: 5,
      nextActionLabel: 'Start now',
      evidenceMode: 'short_reasoning',
      status: 'pending',
    });
  }
  return {
    dateKey: new Date().toISOString().slice(0, 10),
    items: items.slice(0, 7),
    completedCount: 0,
    totalCount: items.length || 1,
    progressPercent: 0,
    integritySignals: {
      rapidGuessSignals: 0,
      lowEvidenceSignals: 0,
      averageResponseSec: null,
      recommendation: 'Use one reason sentence in each response for stronger evidence.',
    },
  };
}

function buildDemoGrowthBundle(args: {
  revisionItems: RevisionItem[];
  dueNow: RevisionItem[];
  weakTopics: string[];
  mistakeItems: RevisionItem[];
  studyPlans: StudyPlan[];
  studyGoals: StudyGoal[];
}): {
  overview: GrowthWorkspaceOverviewResponse;
  weakTopics: GrowthWorkspaceWeakTopicsResponse;
  mistakeJournal: GrowthWorkspaceMistakeJournalResponse;
  studyPlans: GrowthWorkspaceStudyPlansResponse;
  masteryTrends: GrowthWorkspaceMasteryTrendsResponse;
  dailyFeed: GrowthDailyFeedSnapshot;
  funnel: GrowthActionFunnelSummary;
} {
  const generatedAt = new Date().toISOString();
  const primaryWeakTopic = args.weakTopics[0] || args.revisionItems[0]?.topic || 'Core foundations';
  const primaryDue = args.dueNow[0] || args.revisionItems[0] || null;
  const primaryMistake = args.mistakeItems[0] || args.revisionItems.find((item) => item.isMistakeBased) || null;

  const weakTopicItems: GrowthWorkspaceWeakTopic[] = (args.weakTopics.length ? args.weakTopics : [primaryWeakTopic])
    .slice(0, 5)
    .map((topic, index) => {
      const linked =
        args.revisionItems.find((item) => String(item.topic || item.subtopic || '').toLowerCase().includes(topic.toLowerCase())) || null;
      const weaknessScore = linked?.reviewStatus === 'needs_attention' ? 72 : Math.max(48, 62 - index * 5);
      return {
        id: `demo-weak-${index + 1}`,
        userId: 'demo',
        subject: linked?.subject || 'General',
        topic,
        subtopic: linked?.subtopic || null,
        weaknessScore,
        microMasteryLabel: linked?.mastery || 'still_learning',
        status: weaknessScore >= 68 ? 'active' : weaknessScore >= 56 ? 'improving' : 'stable',
        weaknessReasonSummary: linked?.summary || 'Recent evidence suggests this concept still needs structured repetition.',
        triggers: ['Demo dataset', 'Recent attempts'],
        lastStruggledAt: linked?.updatedAt || generatedAt,
        lastReviewedAt: linked?.lastReviewedAt || linked?.updatedAt || generatedAt,
        nextReviewAt: linked?.nextReviewAt || null,
        linkedRevisionIds: linked?.id ? [linked.id] : [],
        linkedMediaIds: [],
        linkedMistakePatternIds: [],
        recommendedAction: 'Run recap -> worked step -> short transfer check.',
        createdAt: linked?.createdAt || generatedAt,
        updatedAt: linked?.updatedAt || generatedAt,
      };
    });

  const mistakePatterns: GrowthWorkspaceMistakePattern[] = (args.mistakeItems.length ? args.mistakeItems : args.revisionItems.slice(0, 4))
    .slice(0, 4)
    .map((item, index) => ({
      id: `demo-mistake-${index + 1}`,
      userId: 'demo',
      subject: item.subject || 'General',
      patternKey: `demo-pattern-${index + 1}`,
      title: item.topic || item.title,
      description: item.summary || 'Step-order confusion appears in related attempts.',
      examples: [item.summary || item.title].filter(Boolean),
      recurrenceScore: item.reviewStatus === 'needs_attention' ? 74 : 56 - index * 4,
      status:
        item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled'
          ? 'active'
          : item.recentOutcome === 'partial'
            ? 'improving'
            : 'resolved_recently',
      commonContext: `${item.subject || 'General'} -> ${item.topic || item.subtopic || item.title}`,
      fixReminder: 'Pause, restate the target step, then continue.',
      linkedTopics: [item.topic || item.subtopic || item.title].filter(Boolean),
      linkedRevisionIds: item.id ? [item.id] : [],
      lastSeenAt: item.updatedAt || generatedAt,
      lastImprovedAt: item.recentOutcome === 'completed' ? item.updatedAt || generatedAt : null,
      createdAt: item.createdAt || generatedAt,
      updatedAt: item.updatedAt || generatedAt,
    }));

  const planViews: GrowthWorkspaceStudyPlansResponse['plans'] = args.studyPlans.slice(0, 6).map((plan, index) => {
    const milestones = args.studyGoals.filter((goal) => goal.studyPlanId === plan.id);
    const completedCount = milestones.filter((goal) => goal.status === 'completed').length;
    const milestoneIndex = milestones.length ? completedCount : 0;
    const statusRaw = String((plan.metadata as Record<string, unknown> | null)?.lifecycle || 'active');
    const status: GrowthWorkspaceStudyPlansResponse['plans'][number]['status'] =
      statusRaw === 'paused' ? 'paused' : statusRaw === 'completed' ? 'completed' : statusRaw === 'stale' ? 'stale' : 'active';
    return {
      id: plan.id || `demo-plan-${index + 1}`,
      userId: plan.userId || 'demo',
      title: plan.title || `Demo plan ${index + 1}`,
      goal: plan.summary || plan.topic || 'Stabilize weak topic confidence',
      subject: plan.subject || null,
      targetTopics: [plan.topic || primaryWeakTopic].filter(Boolean),
      status,
      milestoneIndex,
      milestones: milestones.map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        dueAt: goal.dueAt || null,
      })),
      nextAction:
        milestones.find((goal) => goal.status !== 'completed')?.title ||
        'Generate one checkpoint and one transfer question.',
      progressSummary: `Progress: ${completedCount}/${Math.max(1, milestones.length)} milestones`,
      createdAt: plan.createdAt || generatedAt,
      updatedAt: plan.updatedAt || generatedAt,
      linkedPlan: plan,
    };
  });

  const subjectBuckets = Array.from(
    args.revisionItems.reduce((acc, item) => {
      const subject = String(item.subject || 'General').trim() || 'General';
      if (!acc.has(subject)) acc.set(subject, []);
      acc.get(subject)!.push(item);
      return acc;
    }, new Map<string, RevisionItem[]>())
  );

  const subjectTrends: GrowthWorkspaceMasteryTrendsResponse['subjectTrends'] = subjectBuckets.slice(0, 6).map(([subject, bucket]) => {
    const masteryScore =
      bucket.length > 0
        ? Math.round((bucket.filter((item) => item.mastery === 'almost_there' || item.mastery === 'confident').length / bucket.length) * 100)
        : 0;
    const delta = Math.round((bucket.filter((item) => item.recentOutcome === 'completed').length - bucket.filter((item) => item.recentOutcome === 'struggled').length) * 2);
    const status: GrowthWorkspaceMasteryTrendsResponse['subjectTrends'][number]['status'] =
      masteryScore >= 70 ? 'improving' : masteryScore >= 52 ? 'stable' : 'needs_support';
    return {
      subject,
      status,
      masteryScore,
      evidenceCount: Math.max(1, bucket.length),
      topicCount: Array.from(new Set(bucket.map((item) => item.topic || item.subtopic || item.title))).length,
      summary:
        status === 'improving'
          ? 'Confidence is increasing with consistent evidence.'
          : status === 'stable'
            ? 'Momentum is stable; keep short daily checks.'
            : 'Needs support with shorter, focused loops.',
      delta,
    };
  });

  const topicTrends: GrowthWorkspaceMasteryTrendsResponse['topicTrends'] = args.revisionItems.slice(0, 8).map((item) => {
    const confidenceScore = item.mastery === 'confident' ? 86 : item.mastery === 'almost_there' ? 72 : item.mastery === 'getting_better' ? 54 : 38;
    const status: GrowthWorkspaceMasteryTrendsResponse['topicTrends'][number]['status'] =
      confidenceScore >= 70 ? 'improving' : confidenceScore >= 55 ? 'stable' : 'needs_support';
    return {
      topic: item.topic || item.subtopic || item.title,
      subject: item.subject || 'General',
      subtopic: item.subtopic || null,
      status,
      microMasteryLabel: item.mastery || 'still_learning',
      confidenceScore,
      evidenceScore: item.recentOutcome === 'completed' ? 0.78 : item.recentOutcome === 'partial' ? 0.56 : 0.34,
      summary: item.summary || 'Demo trend: keep one transfer check active.',
      lastSeenAt: item.updatedAt || generatedAt,
    };
  });

  const dailyFeed = buildLocalFeed({
    dueNow: args.dueNow,
    weakTopic: primaryWeakTopic,
    mistake: primaryMistake,
  });

  const overview: GrowthWorkspaceOverviewResponse = {
    generatedAt,
    recommendedNextMove: {
      id: 'demo-next-move',
      userId: 'demo',
      type: primaryDue ? 'due_revision' : 'weak_topic_rescue',
      priorityScore: 88,
      sourceType: 'demo_runtime_bundle',
      title: primaryDue ? `Clear due-now: ${primaryDue.title}` : `Recover ${primaryWeakTopic}`,
      reason: primaryDue
        ? 'Due-now reviews are the fastest way to protect retention.'
        : 'This topic is showing repeated struggle signals and should be handled first.',
      primaryAction: {
        actionType: primaryDue ? 'review_recap' : 'rescue_weak_topic',
        label: primaryDue ? 'Review recap' : 'Rescue weak topic',
        destination: 'growth',
        targetId: primaryDue?.id || weakTopicItems[0]?.id || null,
        topic: primaryDue?.topic || primaryWeakTopic,
        subject: primaryDue?.subject || null,
        context: { source: 'demo_data' },
      },
      secondaryAction: null,
      linkedTopic: primaryDue?.topic || primaryWeakTopic,
      linkedRevisionId: primaryDue?.id || null,
      linkedMediaId: null,
      expiresAt: null,
      createdAt: generatedAt,
    },
    dueNowQueue: (args.dueNow.slice(0, 4).length ? args.dueNow.slice(0, 4) : args.revisionItems.slice(0, 2)).map((item, index) => ({
      id: `demo-due-${index + 1}`,
      userId: 'demo',
      type: 'due_revision',
      priorityScore: 80 - index * 6,
      sourceType: 'demo_due_queue',
      title: item.title,
      reason: 'Demo queue item generated for workspace testing.',
      primaryAction: {
        actionType: 'review_recap',
        label: 'Review recap',
        destination: 'growth',
        targetId: item.id,
        topic: item.topic || item.subtopic || null,
        subject: item.subject || null,
        context: { source: 'demo_data' },
      },
      secondaryAction: null,
      linkedTopic: item.topic || item.subtopic || null,
      linkedRevisionId: item.id,
      linkedMediaId: null,
      expiresAt: null,
      createdAt: generatedAt,
    })),
    recentlyImproved: args.revisionItems
      .filter((item) => item.recentOutcome === 'completed' || item.mastery === 'almost_there' || item.mastery === 'confident')
      .slice(0, 4)
      .map((item, index) => ({
        id: `demo-improved-${index + 1}`,
        title: item.title,
        summary: item.summary || 'Recent attempts suggest growing stability.',
        topic: item.topic || item.subtopic || null,
        subject: item.subject || null,
        evidence: ['demo_signal'],
        createdAt: item.updatedAt || generatedAt,
      })),
    weakPatternSpotlight: mistakePatterns.slice(0, 2),
    supportPatterns: [
      {
        id: 'demo-support-1',
        title: 'Reason-first responses',
        reason: 'Learner outcomes improve when a short why-sentence is included.',
        confidence: 0.72,
        evidence: ['daily_feed', 'revision_outcomes'],
      },
      {
        id: 'demo-support-2',
        title: 'Short transfer checks',
        reason: 'One transfer question after recap improves retention confidence.',
        confidence: 0.68,
        evidence: ['topic_trends'],
      },
    ],
    metrics: {
      dueNowCount: args.dueNow.length,
      weakTopicCount: weakTopicItems.length,
      activeMistakePatternCount: mistakePatterns.filter((item) => item.status === 'active').length,
      improvingCount:
        args.revisionItems.filter((item) => item.recentOutcome === 'completed').length +
        weakTopicItems.filter((item) => item.status === 'improving' || item.status === 'stable').length,
      plansInProgressCount: planViews.filter((plan) => plan.status !== 'paused' && plan.status !== 'completed').length,
      masteryCoveragePercent:
        args.revisionItems.length > 0
          ? Math.round(
              (args.revisionItems.filter((item) => item.mastery === 'almost_there' || item.mastery === 'confident').length /
                args.revisionItems.length) *
                100
            )
          : 0,
    },
  };

  const weakTopics: GrowthWorkspaceWeakTopicsResponse = {
    generatedAt,
    items: weakTopicItems,
    groups: {
      needsRescueNow: weakTopicItems.filter((item) => item.status === 'active').map((item) => item.id),
      stillUnstable: weakTopicItems.filter((item) => item.status === 'improving' && item.weaknessScore >= 58).map((item) => item.id),
      improvingSlowly: weakTopicItems.filter((item) => item.status === 'improving' && item.weaknessScore < 58).map((item) => item.id),
      recentlyStabilized: weakTopicItems.filter((item) => item.status === 'stable' || item.status === 'recovered').map((item) => item.id),
    },
  };

  const mistakeJournal: GrowthWorkspaceMistakeJournalResponse = {
    generatedAt,
    patterns: mistakePatterns,
    groups: {
      active: mistakePatterns.filter((item) => item.status === 'active').map((item) => item.id),
      improving: mistakePatterns.filter((item) => item.status === 'improving').map((item) => item.id),
      resolvedRecently: mistakePatterns.filter((item) => item.status === 'resolved_recently').map((item) => item.id),
    },
  };

  const studyPlans: GrowthWorkspaceStudyPlansResponse = {
    generatedAt,
    plans: planViews,
    recommendations: (planViews.slice(0, 2) as Array<GrowthWorkspaceStudyPlansResponse['plans'][number]>).map((plan, index) => ({
      id: `demo-plan-rec-${index + 1}`,
      userId: 'demo',
      type: 'continue_study_plan',
      priorityScore: 70 - index * 8,
      sourceType: 'demo_study_plan',
      title: `Continue ${plan.title}`,
      reason: plan.nextAction,
      primaryAction: {
        actionType: 'continue_study_plan',
        label: 'Continue plan',
        destination: 'growth',
        targetId: plan.id,
        topic: plan.targetTopics?.[0] || null,
        subject: plan.subject || null,
        context: { source: 'demo_data' },
      },
      secondaryAction: null,
      linkedTopic: plan.targetTopics?.[0] || null,
      linkedRevisionId: null,
      linkedMediaId: null,
      expiresAt: null,
      createdAt: generatedAt,
    })),
  };

  const masteryTrends: GrowthWorkspaceMasteryTrendsResponse = {
    generatedAt,
    overall: {
      status:
        subjectTrends.some((entry) => entry.status === 'needs_support')
          ? 'recovering'
          : subjectTrends.some((entry) => entry.status === 'improving')
            ? 'improving'
            : 'stable',
      summary: 'Demo mastery trend is synthesized from revision and queue signals for UI testing.',
      confidence: 0.62,
    },
    subjectTrends,
    topicTrends,
    masterySignals: topicTrends.slice(0, 10).map((entry, index) => ({
      id: `demo-mastery-signal-${index + 1}`,
      userId: 'demo',
      subject: entry.subject,
      topic: entry.topic,
      subtopic: entry.subtopic || null,
      signalType: 'demo_signal',
      confidenceScore: entry.confidenceScore,
      evidenceScore: entry.evidenceScore,
      sourceType: 'growth_workspace_demo',
      outcome: entry.status === 'improving' ? 'improved' : entry.status === 'stable' ? 'no_change' : 'struggled',
      createdAt: generatedAt,
    })),
  };

  const funnel: GrowthActionFunnelSummary = {
    periodLabel: 'Demo (21d)',
    totalOpened: 18,
    totalSubmitted: 14,
    totalCompleted: 11,
    openToSubmitRate: 14 / 18,
    submitToCompleteRate: 11 / 14,
    modules: [
      {
        actionType: 'review_recap',
        opened: 8,
        submitted: 6,
        completed: 5,
        openToSubmitRate: 0.75,
        submitToCompleteRate: 0.83,
        averageEvidenceScore: 0.66,
        estimatedMasteryLiftRate: 0.14,
      },
      {
        actionType: 'work_on_this',
        opened: 6,
        submitted: 5,
        completed: 4,
        openToSubmitRate: 0.83,
        submitToCompleteRate: 0.8,
        averageEvidenceScore: 0.62,
        estimatedMasteryLiftRate: 0.12,
      },
      {
        actionType: 'continue_plan',
        opened: 4,
        submitted: 3,
        completed: 2,
        openToSubmitRate: 0.75,
        submitToCompleteRate: 0.67,
        averageEvidenceScore: 0.58,
        estimatedMasteryLiftRate: 0.1,
      },
    ],
    topImprovingModules: [
      {
        actionType: 'review_recap',
        opened: 8,
        submitted: 6,
        completed: 5,
        openToSubmitRate: 0.75,
        submitToCompleteRate: 0.83,
        averageEvidenceScore: 0.66,
        estimatedMasteryLiftRate: 0.14,
      },
      {
        actionType: 'work_on_this',
        opened: 6,
        submitted: 5,
        completed: 4,
        openToSubmitRate: 0.83,
        submitToCompleteRate: 0.8,
        averageEvidenceScore: 0.62,
        estimatedMasteryLiftRate: 0.12,
      },
    ],
  };

  return {
    overview,
    weakTopics,
    mistakeJournal,
    studyPlans,
    masteryTrends,
    dailyFeed,
    funnel,
  };
}

function isGrowthOverviewResponse(
  snapshot: GrowthWorkspaceOverviewResponse | null | undefined
): snapshot is GrowthWorkspaceOverviewResponse {
  const candidate = snapshot as Partial<GrowthWorkspaceOverviewResponse> | null | undefined;
  return Boolean(
    candidate?.metrics &&
      Array.isArray(candidate.dueNowQueue) &&
      Array.isArray(candidate.recentlyImproved) &&
      Array.isArray(candidate.weakPatternSpotlight) &&
      Array.isArray(candidate.supportPatterns)
  );
}

function isGrowthWeakTopicsResponse(
  snapshot: GrowthWorkspaceWeakTopicsResponse | null | undefined
): snapshot is GrowthWorkspaceWeakTopicsResponse {
  const candidate = snapshot as Partial<GrowthWorkspaceWeakTopicsResponse> | null | undefined;
  return Boolean(
    Array.isArray(candidate?.items) &&
      candidate?.groups &&
      Array.isArray(candidate.groups.needsRescueNow) &&
      Array.isArray(candidate.groups.stillUnstable) &&
      Array.isArray(candidate.groups.improvingSlowly) &&
      Array.isArray(candidate.groups.recentlyStabilized)
  );
}

function isGrowthMistakeJournalResponse(
  snapshot: GrowthWorkspaceMistakeJournalResponse | null | undefined
): snapshot is GrowthWorkspaceMistakeJournalResponse {
  const candidate = snapshot as Partial<GrowthWorkspaceMistakeJournalResponse> | null | undefined;
  return Boolean(
    Array.isArray(candidate?.patterns) &&
      candidate?.groups &&
      Array.isArray(candidate.groups.active) &&
      Array.isArray(candidate.groups.improving) &&
      Array.isArray(candidate.groups.resolvedRecently)
  );
}

function isGrowthStudyPlansResponse(
  snapshot: GrowthWorkspaceStudyPlansResponse | null | undefined
): snapshot is GrowthWorkspaceStudyPlansResponse {
  const candidate = snapshot as Partial<GrowthWorkspaceStudyPlansResponse> | null | undefined;
  return Boolean(Array.isArray(candidate?.plans) && Array.isArray(candidate?.recommendations));
}

function isGrowthMasteryTrendsResponse(
  snapshot: GrowthWorkspaceMasteryTrendsResponse | null | undefined
): snapshot is GrowthWorkspaceMasteryTrendsResponse {
  const candidate = snapshot as Partial<GrowthWorkspaceMasteryTrendsResponse> | null | undefined;
  return Boolean(
    candidate?.overall &&
      Array.isArray(candidate.subjectTrends) &&
      Array.isArray(candidate.topicTrends) &&
      Array.isArray(candidate.masterySignals)
  );
}

function isGrowthDailyFeedSnapshot(
  snapshot: GrowthDailyFeedSnapshot | null | undefined
): snapshot is GrowthDailyFeedSnapshot {
  const candidate = snapshot as Partial<GrowthDailyFeedSnapshot> | null | undefined;
  return Boolean(Array.isArray(candidate?.items));
}

function isGrowthActionFunnelSummary(
  summary: GrowthActionFunnelSummary | null | undefined
): summary is GrowthActionFunnelSummary {
  const candidate = summary as Partial<GrowthActionFunnelSummary> | null | undefined;
  return Boolean(Array.isArray(candidate?.modules) && Array.isArray(candidate?.topImprovingModules));
}

export function GrowthWorkspacePanel(props: GrowthWorkspacePanelProps) {
  const revisionItems = useMemo(() => uniqueRevisionItems(props.revisionOverview), [props.revisionOverview]);
  const dueNow = props.revisionOverview?.queuePreview?.dueNow || [];
  const improved = props.revisionOverview?.queuePreview?.recentlyImproved || [];
  const weakTopics = useMemo(
    () =>
      Array.from(
        new Set(
          revisionItems
            .filter((item) => item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled' || item.isMistakeBased)
            .map((item) => String(item.topic || item.subtopic || '').trim())
            .filter(Boolean)
            .concat((props.metacognitiveProfile?.recurringErrorPatterns || []).map((item) => String(item || '').trim()).filter(Boolean))
        )
      ).slice(0, 10),
    [props.metacognitiveProfile?.recurringErrorPatterns, revisionItems]
  );
  const mistakeItems = useMemo(
    () =>
      (props.revisionOverview?.mistakeItems?.length ? props.revisionOverview.mistakeItems : revisionItems.filter((item) => item.isMistakeBased)).slice(0, 12),
    [props.revisionOverview?.mistakeItems, revisionItems]
  );

  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [dailyFeed, setDailyFeed] = useState<GrowthDailyFeedSnapshot | null>(null);
  const [growthFunnel, setGrowthFunnel] = useState<GrowthActionFunnelSummary | null>(null);
  const [overviewSnapshot, setOverviewSnapshot] = useState<GrowthWorkspaceOverviewResponse | null>(null);
  const [weakTopicsSnapshot, setWeakTopicsSnapshot] = useState<GrowthWorkspaceWeakTopicsResponse | null>(null);
  const [mistakeJournalSnapshot, setMistakeJournalSnapshot] = useState<GrowthWorkspaceMistakeJournalResponse | null>(null);
  const [studyPlansSnapshot, setStudyPlansSnapshot] = useState<GrowthWorkspaceStudyPlansResponse | null>(null);
  const [masteryTrendsSnapshot, setMasteryTrendsSnapshot] = useState<GrowthWorkspaceMasteryTrendsResponse | null>(null);
  const [growthLoading, setGrowthLoading] = useState<boolean>(true);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [runtimeResponseDraft, setRuntimeResponseDraft] = useState('');
  const [planGoalDraft, setPlanGoalDraft] = useState('');
  const [newMilestoneByPlan, setNewMilestoneByPlan] = useState<Record<string, string>>({});
  const [planSummaryDraft, setPlanSummaryDraft] = useState('');
  const [runtimeNotice, setRuntimeNotice] = useState<RuntimeNotice | null>(null);
  const [busyActionKeys, setBusyActionKeys] = useState<Record<string, boolean>>({});
  const [resolvedActionPlans, setResolvedActionPlans] = useState<Record<string, GrowthActionPlan | null>>({});
  const [resolvingActionKey, setResolvingActionKey] = useState<string | null>(null);
  const [, setUsingDemoData] = useState<boolean>(false);
  const runtime = useGrowthActionFramework();

  const setActionBusy = useCallback((key: string, value: boolean) => {
    setBusyActionKeys((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const runActionWithGuard = useCallback(
    async <T,>(
      key: string,
      run: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        fallback?: () => void;
      }
    ): Promise<T | null> => {
      setActionBusy(key, true);
      setRuntimeNotice(null);
      try {
        const result = await run();
        if (options?.successMessage) {
          setRuntimeNotice({
            tone: 'success',
            message: options.successMessage,
          });
        }
        return result;
      } catch {
        options?.fallback?.();
        if (options?.errorMessage) {
          setRuntimeNotice({
            tone: 'warning',
            message: options.errorMessage,
          });
        }
        return null;
      } finally {
        setActionBusy(key, false);
      }
    },
    [setActionBusy]
  );

  const stats = useMemo(() => {
    const masteryCounts = {
      still_learning: revisionItems.filter((item) => item.mastery === 'still_learning' || !item.mastery).length,
      getting_better: revisionItems.filter((item) => item.mastery === 'getting_better').length,
      almost_there: revisionItems.filter((item) => item.mastery === 'almost_there').length,
      confident: revisionItems.filter((item) => item.mastery === 'confident').length,
    };
    const masteryKnownTotal = masteryCounts.still_learning + masteryCounts.getting_better + masteryCounts.almost_there + masteryCounts.confident;
    const fallback = {
      dueNow: dueNow.length || Number(props.revisionOverview?.totalDueCount || 0),
      weakTopics: weakTopics.length,
      activeMistakes: mistakeItems.filter((item) => item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled').length,
      improving: improved.length + revisionItems.filter((item) => item.mastery === 'getting_better').length,
      plansInProgress: studyPlans.filter((plan) => String((plan.metadata as Record<string, unknown> | null)?.lifecycle || 'active') !== 'paused').length,
      masteryCoverage: masteryKnownTotal > 0 ? Math.round(((masteryCounts.almost_there + masteryCounts.confident) / masteryKnownTotal) * 100) : 0,
      masteryCounts,
    };
    if (!overviewSnapshot?.metrics) return fallback;
    return {
      ...fallback,
      dueNow: overviewSnapshot.metrics.dueNowCount,
      weakTopics: overviewSnapshot.metrics.weakTopicCount,
      activeMistakes: overviewSnapshot.metrics.activeMistakePatternCount,
      improving: overviewSnapshot.metrics.improvingCount,
      plansInProgress: overviewSnapshot.metrics.plansInProgressCount,
      masteryCoverage: overviewSnapshot.metrics.masteryCoveragePercent,
    };
  }, [dueNow.length, improved.length, mistakeItems, overviewSnapshot, props.revisionOverview?.totalDueCount, revisionItems, studyPlans, weakTopics.length]);

  useEffect(() => {
    void (async () => {
      setGrowthLoading(true);
      setGrowthError(null);
      try {
        const [overviewData, weakTopicsData, mistakeJournalData, growthPlansData, masteryTrendsData, plansData, goalsData, feed, funnel] = await Promise.all([
          api.growth.getOverview().catch(() => null),
          api.growth.getWeakTopics().catch(() => null),
          api.growth.getMistakeJournal().catch(() => null),
          api.growth.getStudyPlans().catch(() => null),
          api.growth.getMasteryTrends().catch(() => null),
          api.study.getPlans(),
          api.study.getGoals(),
          api.growth.getDailyFeed(),
          api.growth.getActionFunnel(21).catch(() => null),
        ]);
        const validatedOverview = isGrowthOverviewResponse(overviewData) ? overviewData : null;
        const validatedWeakTopics = isGrowthWeakTopicsResponse(weakTopicsData) ? weakTopicsData : null;
        const validatedMistakeJournal = isGrowthMistakeJournalResponse(mistakeJournalData) ? mistakeJournalData : null;
        const validatedGrowthPlans = isGrowthStudyPlansResponse(growthPlansData) ? growthPlansData : null;
        const validatedMasteryTrends = isGrowthMasteryTrendsResponse(masteryTrendsData) ? masteryTrendsData : null;
        const validatedFeed = isGrowthDailyFeedSnapshot(feed) ? feed : null;
        const validatedFunnel = isGrowthActionFunnelSummary(funnel) ? funnel : null;
        setOverviewSnapshot(validatedOverview);
        setWeakTopicsSnapshot(validatedWeakTopics);
        setMistakeJournalSnapshot(validatedMistakeJournal);
        setStudyPlansSnapshot(validatedGrowthPlans);
        setMasteryTrendsSnapshot(validatedMasteryTrends);
        setStudyPlans(plansData.plans || []);
        setStudyGoals(goalsData.goals || []);
        const weakTopicLead = validatedWeakTopics?.items?.[0]?.topic || weakTopics[0] || null;
        setDailyFeed(
          validatedFeed?.items?.length
            ? validatedFeed
            : buildLocalFeed({ dueNow, weakTopic: weakTopicLead, mistake: mistakeItems[0] || null })
        );
        if (validatedFunnel) setGrowthFunnel(validatedFunnel);
        const demoBundle = buildDemoGrowthBundle({
          revisionItems,
          dueNow,
          weakTopics,
          mistakeItems,
          studyPlans: plansData.plans || [],
          studyGoals: goalsData.goals || [],
        });
        const needsDemoFallback =
          !validatedOverview ||
          !validatedWeakTopics ||
          !validatedMistakeJournal ||
          !validatedGrowthPlans ||
          !validatedMasteryTrends ||
          !validatedFeed?.items?.length ||
          !validatedFunnel;
        if (needsDemoFallback) {
          setOverviewSnapshot(validatedOverview || demoBundle.overview);
          setWeakTopicsSnapshot(validatedWeakTopics || demoBundle.weakTopics);
          setMistakeJournalSnapshot(validatedMistakeJournal || demoBundle.mistakeJournal);
          setStudyPlansSnapshot(validatedGrowthPlans || demoBundle.studyPlans);
          setMasteryTrendsSnapshot(validatedMasteryTrends || demoBundle.masteryTrends);
          setDailyFeed(validatedFeed?.items?.length ? validatedFeed : demoBundle.dailyFeed);
          setGrowthFunnel(validatedFunnel || demoBundle.funnel);
          setUsingDemoData(true);
        } else {
          setUsingDemoData(false);
        }
      } catch (error) {
        setGrowthError(error instanceof Error ? error.message : 'Failed to load growth intelligence.');
        const demoBundle = buildDemoGrowthBundle({
          revisionItems,
          dueNow,
          weakTopics,
          mistakeItems,
          studyPlans,
          studyGoals,
        });
        setOverviewSnapshot(demoBundle.overview);
        setWeakTopicsSnapshot(demoBundle.weakTopics);
        setMistakeJournalSnapshot(demoBundle.mistakeJournal);
        setStudyPlansSnapshot(demoBundle.studyPlans);
        setMasteryTrendsSnapshot(demoBundle.masteryTrends);
        setDailyFeed(demoBundle.dailyFeed);
        setGrowthFunnel(demoBundle.funnel);
        setUsingDemoData(true);
      } finally {
        setGrowthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setPlanSummaryDraft(runtime.activeAction?.studyPlan?.summary || '');
  }, [runtime.activeAction?.studyPlan?.id, runtime.activeAction?.studyPlan?.summary]);

  useEffect(() => {
    if (dailyFeed?.items?.length) return;
    setDailyFeed(buildLocalFeed({ dueNow, weakTopic: weakTopics[0] || null, mistake: mistakeItems[0] || null }));
  }, [dailyFeed?.items?.length, dueNow, weakTopics, mistakeItems]);

  const sections: Array<{ id: FullscreenGrowthSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'weak_topics', label: 'Weak topics', icon: TriangleAlert },
    { id: 'mistake_journal', label: 'Mistake journal', icon: NotebookPen },
    { id: 'daily_feed', label: 'Daily feed', icon: ListTodo },
    { id: 'study_plans', label: 'Study plans', icon: Workflow },
    { id: 'mastery_trends', label: 'Mastery trends', icon: TrendingUp },
  ];

  const refreshGrowthFunnel = () => {
    void api.growth
      .getActionFunnel(21)
      .then((summary) => {
        if (isGrowthActionFunnelSummary(summary)) setGrowthFunnel(summary);
      })
      .catch(() => undefined);
  };

  const refreshGrowthIntelligence = () => {
    void Promise.all([
      api.growth.getOverview().catch(() => null),
      api.growth.getWeakTopics().catch(() => null),
      api.growth.getMistakeJournal().catch(() => null),
      api.growth.getStudyPlans().catch(() => null),
      api.growth.getMasteryTrends().catch(() => null),
      api.growth.getDailyFeed().catch(() => null),
    ]).then(([overviewData, weakData, mistakeData, plansData, masteryData, feedData]) => {
      const demoBundle = buildDemoGrowthBundle({
        revisionItems,
        dueNow,
        weakTopics,
        mistakeItems,
        studyPlans,
        studyGoals,
      });
      if (isGrowthOverviewResponse(overviewData)) setOverviewSnapshot(overviewData);
      else setOverviewSnapshot(demoBundle.overview);
      if (isGrowthWeakTopicsResponse(weakData)) setWeakTopicsSnapshot(weakData);
      else setWeakTopicsSnapshot(demoBundle.weakTopics);
      if (isGrowthMistakeJournalResponse(mistakeData)) setMistakeJournalSnapshot(mistakeData);
      else setMistakeJournalSnapshot(demoBundle.mistakeJournal);
      if (isGrowthStudyPlansResponse(plansData)) setStudyPlansSnapshot(plansData);
      else setStudyPlansSnapshot(demoBundle.studyPlans);
      if (isGrowthMasteryTrendsResponse(masteryData)) setMasteryTrendsSnapshot(masteryData);
      else setMasteryTrendsSnapshot(demoBundle.masteryTrends);
      if (isGrowthDailyFeedSnapshot(feedData) && feedData.items.length) setDailyFeed(feedData);
      else setDailyFeed(demoBundle.dailyFeed);
      setUsingDemoData(
        !isGrowthOverviewResponse(overviewData) ||
          !isGrowthWeakTopicsResponse(weakData) ||
          !isGrowthMistakeJournalResponse(mistakeData) ||
          !isGrowthStudyPlansResponse(plansData) ||
          !isGrowthMasteryTrendsResponse(masteryData) ||
          !isGrowthDailyFeedSnapshot(feedData) ||
          !feedData.items.length
      );
    }).catch(() => undefined);
  };

  const trackGrowthConversion = (
    stage: 'opened' | 'submitted' | 'completed',
    request: InlineActionRequest,
    payload?: { evidenceScore?: number | null; responseText?: string; responseTimeSec?: number | null; outcome?: string | null }
  ) => {
    const eventType =
      stage === 'opened'
        ? 'growth_action_opened'
        : stage === 'submitted'
          ? 'growth_action_submitted'
          : 'growth_action_completed';
    void api.quality.recordLearningEffectEvent({
      eventType,
      subject: request.subject || request.revisionItem?.subject || request.dailyFeedItem?.subject || null,
      topic: request.topic || request.revisionItem?.topic || request.dailyFeedItem?.topic || null,
      revisionItemId: request.revisionItem?.id || request.dailyFeedItem?.targetRevisionItemId || null,
      outcome: payload?.outcome || null,
      metadata: {
        surface: 'growth_workspace_inline',
        stage,
        actionType: request.actionType,
        targetType: request.targetType,
        targetId: request.targetId,
        renderMode: request.renderMode,
        dailyFeedItemType: request.dailyFeedItem?.type || null,
        evidenceScore: payload?.evidenceScore ?? null,
        responseLength: payload?.responseText ? payload.responseText.length : 0,
        responseTimeSec: payload?.responseTimeSec ?? null,
      },
    }).catch(() => undefined);
  };

  const resolveInlineActionPlan = useCallback(
    async (request: InlineActionRequest): Promise<GrowthActionPlan | null> => {
      const intent = toInlineIntent(request.actionType);
      const payload: GrowthActionPayload = {
        topic: request.topic || request.revisionItem?.topic || request.dailyFeedItem?.topic || null,
        subject: request.subject || request.revisionItem?.subject || request.dailyFeedItem?.subject || null,
        title: request.title || request.revisionItem?.title || request.dailyFeedItem?.title || null,
        itemId: request.revisionItem?.id || request.dailyFeedItem?.targetRevisionItemId || null,
      };
      if (props.onResolveGrowthAction) {
        return props.onResolveGrowthAction(intent, payload);
      }
      try {
        const response = await api.growth.resolveAction({
          intent,
          topic: payload.topic || null,
          subject: payload.subject || null,
          title: payload.title || null,
          itemId: payload.itemId || null,
        });
        return response?.actionPlan || null;
      } catch {
        return null;
      }
    },
    [props.onResolveGrowthAction]
  );

  const resolveAndStoreActionPlan = useCallback(
    async (request: InlineActionRequest): Promise<GrowthActionPlan | null> => {
      const key = buildActionKey(request);
      setResolvingActionKey(key);
      try {
        const resolved = await resolveInlineActionPlan(request);
        setResolvedActionPlans((prev) => ({
          ...prev,
          [key]: resolved,
        }));
        return resolved;
      } finally {
        setResolvingActionKey((prev) => (prev === key ? null : prev));
      }
    },
    [resolveInlineActionPlan]
  );

  const openInline = (request: InlineActionRequest) => {
    runtime.openAction(request);
    setRuntimeResponseDraft('');
    setRuntimeNotice(null);
    trackGrowthConversion('opened', request);
    refreshGrowthFunnel();
    void resolveAndStoreActionPlan(request);
    if (request.dailyFeedItem) {
      void api.growth.recordDailyFeedInteraction(request.dailyFeedItem.id, {
        action: 'open',
        itemType: request.dailyFeedItem.type,
      }).catch(() => undefined);
    }
  };

  const completeInline = async () => {
    if (!runtime.activeAction) return;
    const active = runtime.activeAction;
    const actionCopy = ACTION_RUNTIME_COPY[active.actionType];
    const start = runtime.getProgress(active)?.startedAt;
    const elapsed = start ? Math.max(1, Math.round((Date.now() - new Date(start).getTime()) / 1000)) : null;
    const text =
      runtimeResponseDraft.trim() ||
      `Completed ${actionCopy.promptLabel.toLowerCase()} for ${active.topic || active.title || 'current focus'}.`;
    const score = Math.max(
      0.08,
      Math.min(1, (text.length >= Math.max(24, actionCopy.minChars) ? 0.58 : 0.28) + (/\b(because|therefore|reason|first|then)\b/i.test(text) ? 0.24 : 0))
    );
    const completionOutcome = score >= 0.68 ? 'improved' : score >= 0.48 ? 'no_change' : 'struggled';

    trackGrowthConversion('submitted', active, {
      evidenceScore: score,
      responseText: text,
      responseTimeSec: elapsed,
    });

    runtime.completeAction(active, { evidenceScore: score, notes: [text || 'Completed inline action'] });
    active.onComplete?.({ evidenceScore: score, notes: [text || 'Completed inline action'] });

    trackGrowthConversion('completed', active, {
      evidenceScore: score,
      responseText: text,
      responseTimeSec: elapsed,
      outcome: completionOutcome,
    });

    const activeKey = buildActionKey(active);
    await runActionWithGuard(
      `runtime:${activeKey}:complete`,
      async () => {
        if (active.dailyFeedItem) {
          await api.growth.recordDailyFeedInteraction(active.dailyFeedItem.id, {
            action: 'submit',
            itemType: active.dailyFeedItem.type,
            responseText: text || null,
            responseTimeSec: elapsed,
          });
          const completeResponse = await api.growth.recordDailyFeedInteraction(active.dailyFeedItem.id, {
            action: 'complete',
            itemType: active.dailyFeedItem.type,
            responseText: text || null,
            responseTimeSec: elapsed,
          });
          setDailyFeed(completeResponse.snapshot);
        } else if (dailyFeed?.items?.length) {
          setDailyFeed({
            ...dailyFeed,
            items: dailyFeed.items.map((item) =>
              item.id === active.targetId
                ? {
                    ...item,
                    status: 'completed',
                  }
                : item
            ),
            completedCount: Math.min(dailyFeed.totalCount, (dailyFeed.completedCount || 0) + 1),
            progressPercent: Math.min(100, Math.round((((dailyFeed.completedCount || 0) + 1) / Math.max(1, dailyFeed.totalCount)) * 100)),
          });
        }
        return true;
      },
      {
        successMessage: 'Action completed and growth signals updated.',
        errorMessage: 'Action completed locally. Online sync will retry automatically.',
      }
    );

    refreshGrowthFunnel();
    refreshGrowthIntelligence();
    setRuntimeResponseDraft('');
  };

  const executeResolvedAction = async () => {
    if (!runtime.activeAction || !activeRuntimeKey) return;
    const active = runtime.activeAction;
    let plan = activeRuntimePlan;
    if (!plan) {
      plan = await resolveAndStoreActionPlan(active);
    }
    if (!plan) {
      setRuntimeNotice({
        tone: 'warning',
        message: 'Could not resolve this action route yet. Try again shortly.',
      });
      return;
    }

    if (!props.onExecuteGrowthActionPlan) {
      if (plan.destination === 'growth') {
        const section = mapGrowthPlanIntentToSection(plan.intent);
        props.onSectionChange(section);
        setRuntimeNotice({
          tone: 'success',
          message: `Stayed in Growth and opened ${section.replace(/_/g, ' ')}.`,
        });
        return;
      }
      setRuntimeNotice({
        tone: 'info',
        message: `Resolved destination is ${plan.destination}. Execution bridge is not mounted in this context.`,
      });
      return;
    }

    const result = await runActionWithGuard(
      `runtime:${activeRuntimeKey}:execute`,
      async () => props.onExecuteGrowthActionPlan!(plan!),
      {
        errorMessage: 'Could not open resolved destination right now.',
      }
    );
    if (!result) return;
    setRuntimeNotice({
      tone: result.executed ? 'success' : 'warning',
      message: result.reason || (result.executed ? 'Resolved destination opened.' : 'Resolved destination did not execute.'),
    });
  };

  const topPlan = studyPlans[0] || null;
  const planGoals = topPlan ? studyGoals.filter((goal) => goal.studyPlanId === topPlan.id) : [];
  const weakPrimary = weakTopicsSnapshot?.items?.[0]?.topic || weakTopics[0] || null;

  const openQuickCycleAction = (source: string) => {
    openInline({
      actionType: 'do_now',
      targetType: 'mastery_bucket',
      targetId: `quick-cycle-${source}`,
      renderMode: 'split_view',
      subject: 'General',
      topic: weakPrimary || 'Mixed practice',
      title: 'Quick growth cycle',
      helperText: 'Do one recap, one reason, and one short transfer check entirely in this page.',
    });
  };

  const openDailyItem = (item: GrowthDailyFeedItem) => {
    const linkedItem =
      (item.targetRevisionItemId
        ? revisionItems.find((entry) => entry.id === item.targetRevisionItemId) || null
        : null) ||
      (item.topic
        ? revisionItems.find((entry) => String(entry.topic || '').toLowerCase().includes(String(item.topic || '').toLowerCase())) || null
        : null);
    const actionType: GrowthInlineActionRequest['actionType'] =
      item.type === 'due_now_recap'
        ? 'review_recap'
        : item.type === 'plan_milestone'
          ? 'continue_plan'
          : item.type === 'mistake_revisit'
            ? 'work_on_this'
            : item.type === 'weak_topic_review'
              ? 'work_on_this'
              : 'quiz';
    openInline({
      actionType,
      targetType: 'daily_feed_item',
      targetId: item.id,
      renderMode: 'split_view',
      subject: item.subject || linkedItem?.subject || null,
      topic: item.topic || linkedItem?.topic || null,
      title: item.title,
      helperText: item.reasonToday,
      dailyFeedItem: item,
      revisionItem: linkedItem,
      studyPlan: item.targetStudyPlanId ? studyPlans.find((plan) => plan.id === item.targetStudyPlanId) || null : null,
      studyGoal: item.targetStudyGoalId ? studyGoals.find((goal) => goal.id === item.targetStudyGoalId) || null : null,
    });
  };

  const openHeroCandidateAction = () => {
    if (!heroCandidate) {
      openQuickCycleAction('overview-hero');
      return;
    }
    if (heroCandidate.source === 'due_now') {
      const dueEntry = dueNowLane.find((entry) => entry.id === heroCandidate.targetId);
      if (dueEntry) {
        openInline({
          actionType: 'do_now',
          targetType: 'daily_feed_item',
          targetId: dueEntry.id,
          renderMode: 'split_view',
          title: dueEntry.title,
          subject: dueEntry.primaryAction.subject || null,
          topic: dueEntry.primaryAction.topic || null,
          helperText: dueEntry.reason,
        });
        return;
      }
    }
    if (heroCandidate.source === 'weak_topic') {
      const weakItem = weakTopicItems.find((entry) => entry.id === heroCandidate.targetId);
      if (weakItem) {
        openInline({
          actionType: weakItem.status === 'active' ? 'work_on_this' : 'review_recap',
          targetType: 'weak_topic',
          targetId: weakItem.id,
          renderMode: 'split_view',
          title: weakItem.topic,
          subject: weakItem.subject || null,
          topic: weakItem.topic,
          helperText: weakItem.weaknessReasonSummary,
        });
        return;
      }
    }
    if (heroCandidate.source === 'mistake_pattern') {
      const pattern = groupedMistakes.active.find((entry) => entry.id === heroCandidate.targetId);
      if (pattern) {
        openInline({
          actionType: 'work_on_this',
          targetType: 'mistake_entry',
          targetId: pattern.id,
          renderMode: 'split_view',
          title: pattern.title,
          subject: pattern.subject || null,
          topic: pattern.linkedTopics?.[0] || null,
          helperText: pattern.fixReminder,
        });
        return;
      }
    }
    if (heroCandidate.source === 'plan') {
      const plan = studyPlans.find((entry) => entry.id === heroCandidate.targetId) || null;
      if (plan) {
        const nextGoal = studyGoals.find((goal) => goal.studyPlanId === plan.id && goal.status !== 'completed') || null;
        openInline({
          actionType: 'continue_plan',
          targetType: 'study_plan',
          targetId: plan.id,
          renderMode: 'split_view',
          title: plan.title,
          subject: plan.subject || null,
          topic: plan.topic || null,
          studyPlan: plan,
          studyGoal: nextGoal,
        });
        return;
      }
    }
    if (heroCandidate.source === 'saved_item') {
      const item = revisionItems.find((entry) => entry.id === heroCandidate.targetId) || null;
      if (item) {
        openInline({
          actionType: 'review_recap',
          targetType: 'revision_item',
          targetId: item.id,
          renderMode: 'split_view',
          title: item.title,
          subject: item.subject || null,
          topic: item.topic || item.subtopic || null,
          helperText: item.summary,
          revisionItem: item,
        });
        return;
      }
    }
    if (dailyFeed?.items?.[0]) {
      openDailyItem(dailyFeed.items[0]);
      return;
    }
    openQuickCycleAction('overview-hero-fallback');
  };

  const weakTopicItems: GrowthWorkspaceWeakTopic[] = useMemo(() => {
    if (weakTopicsSnapshot?.items?.length) return weakTopicsSnapshot.items;
    return (weakTopics.length ? weakTopics : ['General recovery loop']).map((topic, index) => {
      const linked = revisionItems.find((item) => String(item.topic || '').toLowerCase().includes(topic.toLowerCase())) || null;
      return {
        id: `fallback-weak-${index}`,
        userId: 'local',
        subject: linked?.subject || 'General',
        topic,
        subtopic: linked?.subtopic || null,
        weaknessScore: linked?.reviewStatus === 'needs_attention' ? 72 : 48,
        microMasteryLabel: linked?.mastery || 'still_learning',
        status: linked?.reviewStatus === 'needs_attention' ? 'active' : 'improving',
        weaknessReasonSummary: 'Heuristic fallback while growth snapshot is loading.',
        triggers: ['Recent struggle signals'],
        lastStruggledAt: linked?.updatedAt || null,
        lastReviewedAt: linked?.lastReviewedAt || linked?.updatedAt || null,
        nextReviewAt: linked?.nextReviewAt || null,
        linkedRevisionIds: linked?.id ? [linked.id] : [],
        linkedMediaIds: [],
        linkedMistakePatternIds: [],
        recommendedAction: 'Review one recap, then do one short transfer check.',
        createdAt: linked?.createdAt || new Date().toISOString(),
        updatedAt: linked?.updatedAt || new Date().toISOString(),
      };
    });
  }, [revisionItems, weakTopics, weakTopicsSnapshot?.items]);

  const mistakePatterns = useMemo(() => {
    if (mistakeJournalSnapshot?.patterns?.length) return mistakeJournalSnapshot.patterns;
    return mistakeItems.map((item, index) => ({
      id: `fallback-mistake-${item.id || index}`,
      userId: 'local',
      subject: item.subject || 'General',
      patternKey: `fallback-${item.id}`,
      title: item.topic || item.title,
      description: item.summary || 'Repeated misconception pattern.',
      examples: [item.summary].filter(Boolean) as string[],
      recurrenceScore: item.reviewStatus === 'needs_attention' ? 72 : 48,
      status:
        item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled'
          ? 'active'
          : item.recentOutcome === 'partial'
            ? 'improving'
            : 'resolved_recently',
      commonContext: `${item.subject || 'General'} -> ${item.topic || item.subtopic || item.title}`,
      fixReminder: 'Pause and check the weak step before continuing.',
      linkedTopics: [item.topic || item.subtopic || item.title].filter(Boolean),
      linkedRevisionIds: item.id ? [item.id] : [],
      lastSeenAt: item.updatedAt || null,
      lastImprovedAt: item.recentOutcome === 'completed' ? item.updatedAt : null,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }));
  }, [mistakeItems, mistakeJournalSnapshot?.patterns]);

  const groupedMistakes = {
    active: mistakePatterns.filter((item) => item.status === 'active'),
    improving: mistakePatterns.filter((item) => item.status === 'improving'),
    resolved: mistakePatterns.filter((item) => item.status === 'resolved_recently'),
  };
  const weakTopicGroups = useMemo(
    () => [
      {
        key: 'needsRescueNow',
        label: 'Needs rescue now',
        description: 'Most fragile signals that should be repaired first.',
        ids: weakTopicsSnapshot?.groups?.needsRescueNow || weakTopicItems.filter((item) => item.status === 'active').map((item) => item.id),
      },
      {
        key: 'stillUnstable',
        label: 'Still unstable',
        description: 'Early gains exist, but these topics can still slip under pressure.',
        ids:
          weakTopicsSnapshot?.groups?.stillUnstable ||
          weakTopicItems.filter((item) => item.status === 'improving' && item.weaknessScore >= 58).map((item) => item.id),
      },
      {
        key: 'improvingSlowly',
        label: 'Improving slowly',
        description: 'Progress is visible, but this lane still needs deliberate repetition.',
        ids:
          weakTopicsSnapshot?.groups?.improvingSlowly ||
          weakTopicItems.filter((item) => item.status === 'improving' && item.weaknessScore < 58).map((item) => item.id),
      },
      {
        key: 'recentlyStabilized',
        label: 'Recently stabilized',
        description: 'Keep a light check so recently recovered topics stay secure.',
        ids:
          weakTopicsSnapshot?.groups?.recentlyStabilized ||
          weakTopicItems.filter((item) => item.status === 'stable' || item.status === 'recovered').map((item) => item.id),
      },
    ],
    [weakTopicItems, weakTopicsSnapshot?.groups]
  );
  const activeRuntimeKey = runtime.activeAction ? buildActionKey(runtime.activeAction) : null;
  const activeRuntimePlan = activeRuntimeKey ? resolvedActionPlans[activeRuntimeKey] : null;
  const activeRuntimeCopy = runtime.activeAction ? ACTION_RUNTIME_COPY[runtime.activeAction.actionType] : null;
  const recentRuntimeProgress = useMemo(
    () =>
      Object.values(runtime.progressByKey)
        .sort((a, b) => {
          const bDate = new Date(b.completedAt || b.startedAt || 0).getTime();
          const aDate = new Date(a.completedAt || a.startedAt || 0).getTime();
          return bDate - aDate;
        })
        .slice(0, 6),
    [runtime.progressByKey]
  );

  const recommendedNextTitle =
    overviewSnapshot?.recommendedNextMove?.title ||
    (stats.dueNow > 0 ? 'Clear due-now queue first' : weakPrimary ? `Recover ${weakPrimary}` : 'Run one growth cycle');
  const recommendedNextReason =
    overviewSnapshot?.recommendedNextMove?.reason ||
    (stats.dueNow > 0 ? 'Start with the oldest due recap, then run one transfer check.' : 'Use recap + simpler example + one short reasoning check.');
  const rawDueNowLane = overviewSnapshot?.dueNowQueue || [];
  const dueNowLane = useMemo(() => {
    const grouped = new Map<string, GrowthWorkspaceOverviewResponse['dueNowQueue'][number]>();
    rawDueNowLane.forEach((entry) => {
      const key = `${String(entry.linkedTopic || entry.primaryAction?.topic || entry.title || '').toLowerCase()}::${String(entry.primaryAction?.actionType || '').toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, entry);
      }
    });
    return [...grouped.values()]
      .sort((a, b) => Number(b.priorityScore || 0) - Number(a.priorityScore || 0))
      .slice(0, 4);
  }, [rawDueNowLane]);
  const improvingLane = (overviewSnapshot?.recentlyImproved || []).slice(0, 2);
  const weakSpotlightLane = (overviewSnapshot?.weakPatternSpotlight || []).slice(0, 1);
  const supportPatternLane = (overviewSnapshot?.supportPatterns || []).slice(0, 1);
  const planRecommendations = (studyPlansSnapshot?.recommendations || []).slice(0, 3);
  const rankedHeroCandidates = useMemo(() => {
    const candidates: Array<{
      id: string;
      title: string;
      reason: string;
      support: string;
      priority: number;
      source: 'overview' | 'due_now' | 'weak_topic' | 'mistake_pattern' | 'plan' | 'saved_item';
      subject?: string | null;
      topic?: string | null;
      targetId?: string | null;
    }> = [];

    if (overviewSnapshot?.recommendedNextMove) {
      candidates.push({
        id: overviewSnapshot.recommendedNextMove.id,
        title: overviewSnapshot.recommendedNextMove.title,
        reason: overviewSnapshot.recommendedNextMove.reason,
        support: 'Chosen from your strongest current signals.',
        priority: Number(overviewSnapshot.recommendedNextMove.priorityScore || 0) + 40,
        source: 'overview',
        subject: overviewSnapshot.recommendedNextMove.primaryAction.subject || null,
        topic: overviewSnapshot.recommendedNextMove.primaryAction.topic || null,
        targetId: overviewSnapshot.recommendedNextMove.id,
      });
    }

    dueNowLane.forEach((entry, index) => {
      candidates.push({
        id: `due-${entry.id}`,
        title: entry.title,
        reason: entry.reason,
        support: 'Due-now review prevents future friction and protects recall.',
        priority: Number(entry.priorityScore || 0) + (20 - index * 2),
        source: 'due_now',
        subject: entry.primaryAction.subject || null,
        topic: entry.primaryAction.topic || null,
        targetId: entry.id,
      });
    });

    weakTopicItems
      .filter((entry) => entry.status === 'active' || entry.status === 'improving')
      .slice(0, 2)
      .forEach((entry, index) => {
        candidates.push({
          id: `weak-${entry.id}`,
          title: entry.topic,
          reason: entry.weaknessReasonSummary,
          support: 'Rescuing this now strengthens continuity for related topics.',
          priority: Math.round(entry.weaknessScore) + (entry.status === 'active' ? 24 : 12) - index * 2,
          source: 'weak_topic',
          subject: entry.subject || null,
          topic: entry.topic,
          targetId: entry.id,
        });
      });

    groupedMistakes.active.slice(0, 2).forEach((entry, index) => {
      candidates.push({
        id: `mistake-${entry.id}`,
        title: entry.title,
        reason: entry.description || 'Recurring repair pattern.',
        support: 'Fixing this pattern improves confidence and reduces repeated slips.',
        priority: Math.round(entry.recurrenceScore || 0) + 18 - index * 2,
        source: 'mistake_pattern',
        subject: entry.subject || null,
        topic: entry.linkedTopics?.[0] || entry.title,
        targetId: entry.id,
      });
    });

    studyPlans.slice(0, 2).forEach((plan, index) => {
      const nextGoal = studyGoals.find((goal) => goal.studyPlanId === plan.id && goal.status !== 'completed');
      if (!nextGoal) return;
      candidates.push({
        id: `plan-${plan.id}`,
        title: plan.title,
        reason: `Continue with: ${nextGoal.title}`,
        support: 'Maintaining roadmap continuity lowers restart friction later.',
        priority: 54 - index * 3,
        source: 'plan',
        subject: plan.subject || null,
        topic: plan.topic || null,
        targetId: plan.id,
      });
    });

    revisionItems
      .filter((item) => !item.lastReviewedAt && (item.needsPractice || item.reviewStatus === 'needs_attention'))
      .slice(0, 2)
      .forEach((item, index) => {
        candidates.push({
          id: `saved-${item.id}`,
          title: item.title,
          reason: item.summary || 'Saved item still needs first reinforcement.',
          support: 'Reviewing a saved weak signal now makes later study easier.',
          priority: 48 - index * 2,
          source: 'saved_item',
          subject: item.subject || null,
          topic: item.topic || item.subtopic || null,
          targetId: item.id,
        });
      });

    const deduped = new Map<string, (typeof candidates)[number]>();
    candidates
      .sort((a, b) => b.priority - a.priority)
      .forEach((entry) => {
        const key = `${entry.source}:${String(entry.topic || entry.title).toLowerCase()}`;
        if (!deduped.has(key)) deduped.set(key, entry);
      });
    return [...deduped.values()].sort((a, b) => b.priority - a.priority);
  }, [dueNowLane, groupedMistakes.active, overviewSnapshot?.recommendedNextMove, revisionItems, studyGoals, studyPlans, weakTopicItems]);
  const heroCandidate = rankedHeroCandidates[0] || null;
  const heroTitle = heroCandidate?.title || recommendedNextTitle;
  const heroReason = heroCandidate?.reason || recommendedNextReason;
  const heroCueLabel =
    heroCandidate?.source === 'due_now'
      ? 'Due now'
      : heroCandidate?.source === 'weak_topic'
        ? 'Weak-topic rescue'
        : heroCandidate?.source === 'mistake_pattern'
          ? 'Pattern repair'
          : heroCandidate?.source === 'plan'
            ? 'Roadmap continuity'
            : heroCandidate?.source === 'saved_item'
              ? 'Saved weak signal'
              : 'Recommended';
  const heroEffortHint =
    heroCandidate?.source === 'plan'
      ? 'About 12 minutes'
      : heroCandidate?.source === 'mistake_pattern'
        ? 'About 8 minutes'
        : heroCandidate?.source === 'weak_topic'
          ? 'About 9 minutes'
          : heroCandidate?.source === 'due_now'
            ? 'About 6 minutes'
            : 'Short focused cycle';
  const sequencedDailyItems = useMemo(() => {
    const orderedTypes: GrowthDailyFeedItem['type'][] = [
      'due_now_recap',
      'weak_topic_review',
      'similar_practice',
      'mistake_revisit',
      'plan_milestone',
      'momentum_item',
      'media_recap_boost',
    ];
    const items = dailyFeed?.items || [];
    const pending = items.filter((entry) => entry.status !== 'completed');
    const completed = items.filter((entry) => entry.status === 'completed');
    const sequencedPending = orderedTypes.flatMap((type) => pending.filter((entry) => entry.type === type));
    return [...sequencedPending, ...completed].slice(0, 7);
  }, [dailyFeed?.items]);
  const feedMinutes = sequencedDailyItems.reduce((sum, item) => sum + Math.max(1, item.estimatedMinutes || 0), 0);
  const firstFeedItem = sequencedDailyItems[0] || null;
  const followupFeedItems = sequencedDailyItems.slice(1);
  const completedAllFeedItems = Boolean(dailyFeed && dailyFeed.totalCount > 0 && dailyFeed.completedCount >= dailyFeed.totalCount);
  const interpretedSubjectTrends = useMemo(
    () =>
      masteryTrendsSnapshot?.subjectTrends?.length
        ? masteryTrendsSnapshot.subjectTrends.map((entry) => ({
            subject: entry.subject,
            confidenceRatio: Math.round(entry.masteryScore),
            summary: entry.summary,
            delta: entry.delta,
            topics: [`${entry.topicCount} topics`],
          }))
        : Array.from(new Set(revisionItems.map((item) => String(item.subject || 'General').trim() || 'General'))).map((subject) => {
            const bucket = revisionItems.filter((item) => String(item.subject || 'General').trim() === subject);
            const confidenceRatio =
              bucket.length > 0
                ? Math.round((bucket.filter((item) => item.mastery === 'almost_there' || item.mastery === 'confident').length / bucket.length) * 100)
                : 0;
            return {
              subject,
              confidenceRatio,
              summary: null,
              delta: null,
              topics: Array.from(new Set(bucket.map((item) => item.topic || item.subtopic || item.title))).slice(0, 3),
            };
          }),
    [masteryTrendsSnapshot?.subjectTrends, revisionItems]
  );
  const masterySupportInsight = useMemo(() => {
    if (!interpretedSubjectTrends.length) return null;
    const weakest = [...interpretedSubjectTrends].sort((a, b) => a.confidenceRatio - b.confidenceRatio)[0];
    if (weakest.confidenceRatio >= 70) {
      return {
        title: 'Momentum is broadly stable',
        summary: 'Keep one short retrieval cycle in each subject to protect what is working.',
      };
    }
    return {
      title: `${weakest.subject} needs targeted support`,
      summary: `Run short recap + one transfer question in ${weakest.subject} to stabilize fragile mastery signals.`,
    };
  }, [interpretedSubjectTrends]);

  return (
    <div className="copilot-workspace-scroll">
      <div className="copilot-workspace-container copilot-growth-layout space-y-3">
        <section className="copilot-workspace-panel copilot-growth-shell p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--copilot-text-primary)] md:text-2xl">
                Steadfast learning intelligence
              </h2>
              {growthLoading ? <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">Refreshing your growth guidance...</p> : null}
              {growthError ? <p className="mt-2 text-xs text-amber-300">{growthError}</p> : null}
            </div>
            <div className="flex w-full flex-wrap gap-2 xl:w-auto">
              <Button type="button" variant="outline" className="copilot-control-nav h-9 rounded-full px-4 text-sm" onClick={() => props.onSectionChange('daily_feed')}>
                Open today&apos;s sequence
              </Button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => props.onSectionChange(section.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                    props.activeSection === section.id
                      ? 'copilot-selection-chip-active'
                      : 'border-[var(--copilot-soft-line)] text-[var(--copilot-text-secondary)] hover:bg-[var(--copilot-hover-surface)]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-3">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={props.activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {props.activeSection === 'overview' ? (
                <>
                <section className="copilot-next-move-panel copilot-growth-overview-hero px-5 py-5">
                    <div>
                      <div>
                        <h3 className="text-2xl font-semibold text-[var(--copilot-text-primary)]">{heroTitle}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{heroReason}</p>
                        <p className="mt-2 text-xs text-[var(--copilot-text-secondary)]">{heroCueLabel} · {heroEffortHint}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button type="button" className="copilot-control-commit h-10 rounded-full px-4 text-sm" onClick={() => openHeroCandidateAction()}>
                            Start this now
                          </Button>
                          <Button type="button" variant="outline" className="copilot-control-nav h-10 rounded-full px-4 text-sm" onClick={() => props.onSectionChange('daily_feed')}>
                            Open today&apos;s playlist
                          </Button>
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="copilot-growth-card-grid">
                    <article className="copilot-workspace-panel p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Due now</p>
                        <span className="copilot-revision-pill">{dueNowLane.length}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {dueNowLane.map((entry) => (
                          <article key={entry.id} className="copilot-growth-lane-item">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{entry.title}</p>
                                <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{entry.reason}</p>
                                <p className="mt-1 text-[11px] text-[var(--copilot-text-tertiary)]">
                                  {(entry.primaryAction?.actionType?.replace(/_/g, ' ') || 'due revision') + ' - high usefulness now'}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 rounded-full px-3 text-[11px]"
                                onClick={() =>
                                  openInline({
                                    actionType: 'do_now',
                                    targetType: 'daily_feed_item',
                                    targetId: entry.id,
                                    renderMode: 'split_view',
                                    title: entry.title,
                                    subject: entry.primaryAction.subject || null,
                                    topic: entry.primaryAction.topic || null,
                                    helperText: entry.reason,
                                  })
                                }
                              >
                                Review now
                              </Button>
                            </div>
                          </article>
                        ))}
                        {!overviewSnapshot?.dueNowQueue?.length ? (
                          <p className="text-xs text-[var(--copilot-text-secondary)]">No due items yet. Complete one short feed step and this lane will auto-fill.</p>
                        ) : null}
                      </div>
                    </article>
                    <article className="copilot-workspace-panel p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Recently improving</p>
                        <span className="copilot-revision-pill">{improvingLane.length}</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {improvingLane.map((entry) => (
                          <div key={entry.id} className="copilot-growth-lane-item">
                            <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{entry.title}</p>
                            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{entry.summary}</p>
                          </div>
                        ))}
                        {!overviewSnapshot?.recentlyImproved?.length ? (
                          <p className="text-xs text-[var(--copilot-text-secondary)]">Your improvement highlights will appear after a few completed cycles.</p>
                        ) : null}
                      </div>
                    </article>
                  </section>
                  <section className="copilot-growth-card-grid">
                    <article className="copilot-workspace-panel p-4">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Weak pattern spotlight</p>
                      <div className="mt-3 space-y-2">
                        {weakSpotlightLane.map((entry) => (
                          <div key={entry.id} className="copilot-growth-lane-item">
                            <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{entry.title}</p>
                            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">What to remember: {entry.fixReminder}</p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 h-7 rounded-full px-3 text-[11px]"
                              onClick={() =>
                                openInline({
                                  actionType: 'work_on_this',
                                  targetType: 'mistake_entry',
                                  targetId: entry.id,
                                  renderMode: 'split_view',
                                  title: entry.title,
                                  subject: entry.subject || null,
                                  topic: entry.linkedTopics?.[0] || null,
                                  helperText: entry.fixReminder,
                                })
                              }
                            >
                              Fix this now
                            </Button>
                          </div>
                        ))}
                        {!overviewSnapshot?.weakPatternSpotlight?.length ? (
                          <p className="text-xs text-[var(--copilot-text-secondary)]">No recurring mistake pattern is currently dominant.</p>
                        ) : null}
                      </div>
                    </article>
                    <article className="copilot-workspace-panel p-4">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">What helps you learn best right now</p>
                      <div className="mt-3 space-y-2">
                        {supportPatternLane.map((entry) => (
                          <div key={entry.id} className="copilot-growth-lane-item">
                            <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{entry.title}</p>
                            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{entry.reason}</p>
                            <Button type="button" variant="outline" className="mt-2 h-7 rounded-full px-3 text-[11px]" onClick={() => props.onSectionChange('daily_feed')}>
                              Use this in today&apos;s sequence
                            </Button>
                          </div>
                        ))}
                        {!overviewSnapshot?.supportPatterns?.length ? (
                          <p className="text-xs text-[var(--copilot-text-secondary)]">Support insights will appear as Steadfast learns what helps you most.</p>
                        ) : null}
                      </div>
                    </article>
                  </section>
                </>
              ) : null}

              {props.activeSection === 'weak_topics' ? (
                <section className="copilot-workspace-panel copilot-growth-surface-weak p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><BookOpenText className="h-4.5 w-4.5 text-[var(--copilot-workspace-strong)]" /><h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Weak topics recovery center</h3></div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => {
                        const urgent = weakTopicItems.find((item) => item.status === 'active') || weakTopicItems[0] || null;
                        if (!urgent) {
                          openQuickCycleAction('weak-topics-header');
                          return;
                        }
                        openInline({
                          actionType: urgent.status === 'active' ? 'work_on_this' : 'review_recap',
                          targetType: 'weak_topic',
                          targetId: urgent.id,
                          renderMode: 'split_view',
                          subject: urgent.subject || null,
                          topic: urgent.topic,
                          title: urgent.topic,
                          helperText: urgent.weaknessReasonSummary,
                        });
                      }}
                    >
                      Start guided recovery
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-[var(--copilot-text-secondary)]">
                    Already grouped by urgency and stability so you can begin recovery without extra planning.
                  </p>
                  {weakTopicItems.length ? (
                    weakTopicGroups.map((group) => (
                      <div key={group.key} className={cn('mt-4', group.key === 'recentlyStabilized' ? 'copilot-growth-group-stable' : '')}>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{group.label}</p>
                          <span className="copilot-revision-pill">{group.ids.length}</span>
                        </div>
                        {group.description ? <p className="mb-2 text-xs text-[var(--copilot-text-secondary)]">{group.description}</p> : null}
                        <div className="copilot-growth-card-grid">
                          {group.ids.length ? (
                            group.ids.map((id) => {
                              const weakItem = weakTopicItems.find((entry) => entry.id === id);
                              if (!weakItem) return null;
                              const linked =
                                (weakItem.linkedRevisionIds?.[0]
                                  ? revisionItems.find((entry) => entry.id === weakItem.linkedRevisionIds[0]) || null
                                  : null) ||
                                revisionItems.find((entry) => String(entry.topic || '').toLowerCase().includes(weakItem.topic.toLowerCase())) ||
                                null;
                              return (
                                <article
                                  key={weakItem.id}
                                  className={cn(
                                    'space-y-2',
                                    group.key === 'needsRescueNow'
                                      ? 'copilot-growth-recovery-card copilot-growth-recovery-card-urgent'
                                      : group.key === 'stillUnstable'
                                        ? 'copilot-growth-recovery-card copilot-growth-recovery-card-unstable'
                                        : group.key === 'improvingSlowly'
                                          ? 'copilot-growth-recovery-card copilot-growth-recovery-card-improving'
                                          : 'copilot-growth-recovery-row'
                                  )}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">{weakItem.subject || linked?.subject || 'General'}</p>
                                  <p className="text-base font-semibold text-[var(--copilot-text-primary)]">{weakItem.topic}</p>
                                  <p className="text-xs text-[var(--copilot-text-secondary)]">{weakItem.weaknessReasonSummary}</p>
                                  <p className="text-xs text-[var(--copilot-text-secondary)]">Current mastery: {toMasteryText(weakItem.microMasteryLabel || linked?.mastery || null)}</p>
                                  <p className="text-xs text-[var(--copilot-text-secondary)]">Recommended path: {weakItem.recommendedAction}</p>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      type="button"
                                      className="h-8 rounded-full px-3 text-xs"
                                      onClick={() =>
                                        openInline({
                                          actionType: weakItem.status === 'active' ? 'work_on_this' : weakItem.status === 'improving' ? 'quiz' : 'review_recap',
                                          targetType: 'weak_topic',
                                          targetId: weakItem.id,
                                          renderMode: 'split_view',
                                          subject: weakItem.subject || linked?.subject || null,
                                          topic: weakItem.topic,
                                          title: weakItem.topic,
                                          helperText: weakItem.weaknessReasonSummary,
                                          revisionItem: linked,
                                        })
                                      }
                                    >
                                      {weakItem.status === 'active' ? 'Rescue now' : weakItem.status === 'improving' ? 'Quiz me' : 'Review lightly'}
                                    </Button>
                                  </div>
                                </article>
                              );
                            })
                          ) : (
                            <article className="copilot-sidebar-card space-y-2">
                              <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Nothing in this lane right now</p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">Steadfast will repopulate this lane as new learning signals appear.</p>
                            </article>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <article className="copilot-sidebar-card mt-4 space-y-2">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No urgent weak topics right now</p>
                      <p className="text-xs text-[var(--copilot-text-secondary)]">Keep one light retrieval check in your daily feed to stay stable.</p>
                    </article>
                  )}
                </section>
              ) : null}

              {props.activeSection === 'mistake_journal' ? (
                <section className="copilot-workspace-panel copilot-growth-surface-mistakes p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><NotebookPen className="h-4.5 w-4.5 text-[var(--copilot-workspace-strong)]" /><h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Mistake journal repair studio</h3></div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => {
                        const activePattern = groupedMistakes.active[0] || groupedMistakes.improving[0] || null;
                        if (!activePattern) {
                          openQuickCycleAction('mistake-header');
                          return;
                        }
                        openInline({
                          actionType: 'work_on_this',
                          targetType: 'mistake_entry',
                          targetId: activePattern.id,
                          renderMode: 'split_view',
                          subject: activePattern.subject || null,
                          topic: activePattern.linkedTopics?.[0] || null,
                          title: activePattern.title,
                          helperText: activePattern.fixReminder,
                        });
                      }}
                    >
                      Start pattern repair
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-[var(--copilot-text-secondary)]">
                    Repeated slips are grouped into repair patterns so you can fix root causes calmly.
                  </p>
                  {(['active', 'improving', 'resolved'] as const).map((group) => {
                    const isActive = group === 'active';
                    const isImproving = group === 'improving';
                    const heading = isActive ? 'Active patterns' : isImproving ? 'Improving' : 'Resolved recently';
                    return (
                    <div key={group} className={cn('mt-4', isActive ? 'copilot-growth-mistake-group-active' : isImproving ? 'copilot-growth-mistake-group-improving' : 'copilot-growth-mistake-group-resolved')}>
                      <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{heading}</p><span className="copilot-revision-pill">{groupedMistakes[group].length}</span></div>
                      <div className="copilot-growth-card-grid">
                        {groupedMistakes[group].length ? (
                          groupedMistakes[group].slice(0, isActive ? 6 : isImproving ? 4 : 3).map((item) => (
                            <article key={item.id} className={cn('space-y-2', isActive ? 'copilot-growth-repair-card copilot-growth-repair-card-active' : isImproving ? 'copilot-growth-repair-card copilot-growth-repair-card-improving' : 'copilot-growth-repair-row')}>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">{item.subject || 'General'}</p>
                              <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">What usually goes wrong: {item.description || 'Concept/process slip'}</p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">Where this appears: {item.commonContext}</p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">Remember: {item.fixReminder}</p>
                              <Button
                                type="button"
                                className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                                onClick={() =>
                                  openInline({
                                    actionType: 'work_on_this',
                                    targetType: 'mistake_entry',
                                    targetId: item.id,
                                    renderMode: 'split_view',
                                    subject: item.subject || null,
                                    topic: item.linkedTopics?.[0] || null,
                                    title: item.title,
                                    helperText: 'Repair sequence: why it happened, the corrected step, one quick check.',
                                    revisionItem:
                                      (item.linkedRevisionIds?.[0]
                                        ? revisionItems.find((entry) => entry.id === item.linkedRevisionIds[0]) || null
                                        : null) || null,
                                  })
                                }
                              >
                                {isActive ? 'Fix this pattern' : isImproving ? 'Review fix' : 'Reinforce once'}
                              </Button>
                            </article>
                          ))
                        ) : (
                          <article className="copilot-sidebar-card space-y-2">
                            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No patterns in this lane yet</p>
                            <p className="text-xs text-[var(--copilot-text-secondary)]">Start one quick repair step and Steadfast will keep tracking this lane.</p>
                            <Button
                              type="button"
                              className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                              onClick={() => openQuickCycleAction(`mistake-${group}`)}
                            >
                              Start quick repair
                            </Button>
                          </article>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </section>
              ) : null}

              {props.activeSection === 'daily_feed' ? (
                <section className="copilot-workspace-panel copilot-growth-surface-feed p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><ListTodo className="h-4.5 w-4.5 text-[var(--copilot-workspace-strong)]" /><h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Today&apos;s study playlist</h3></div><span className="copilot-revision-pill">{dailyFeed?.progressPercent || 0}%</span></div>
                  <p className="mt-2 text-sm text-[var(--copilot-text-secondary)]">
                    Built for today: {sequencedDailyItems.length} focused steps, about {feedMinutes} minutes.
                  </p>
                  <p className="mt-1 text-sm text-[var(--copilot-text-secondary)]">{dailyFeed?.integritySignals?.recommendation}</p>
                  <div className="mt-4 space-y-3">
                    {(dailyFeed?.items || []).length ? (
                      <>
                        {firstFeedItem ? (
                          <article className={cn('copilot-growth-feed-hero', firstFeedItem.status === 'completed' ? 'opacity-70' : '')}>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Best first step</p>
                                <p className="mt-1 text-base font-semibold text-[var(--copilot-text-primary)]">{firstFeedItem.title}</p>
                                <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">Why now: {firstFeedItem.reasonToday}</p>
                                <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{firstFeedItem.estimatedMinutes} min - {firstFeedItem.evidenceMode.replace(/_/g, ' ')}</p>
                              </div>
                              <Button type="button" className="copilot-control-commit h-8 rounded-full px-3 text-xs" onClick={() => openDailyItem(firstFeedItem)}>
                                {firstFeedItem.status === 'completed' ? 'Repeat once' : firstFeedItem.nextActionLabel}
                              </Button>
                            </div>
                          </article>
                        ) : null}
                        <div className="space-y-2">
                          {followupFeedItems.map((item, index) => (
                            <article
                              key={item.id}
                              className={cn(
                                index < 2 ? 'copilot-growth-feed-card' : 'copilot-growth-feed-row',
                                item.status === 'completed' ? 'opacity-70' : ''
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Step {index + 2}</p>
                                  <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                                  <p className="text-xs text-[var(--copilot-text-secondary)]">Why now: {item.reasonToday}</p>
                                  <p className="text-xs text-[var(--copilot-text-secondary)]">{item.estimatedMinutes} min - {item.evidenceMode.replace(/_/g, ' ')}</p>
                                </div>
                                <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => openDailyItem(item)}>
                                  {item.status === 'completed' ? 'Repeat once' : item.nextActionLabel}
                                </Button>
                              </div>
                            </article>
                          ))}
                        </div>
                        {completedAllFeedItems ? (
                          <article className="copilot-growth-feed-momentum">
                            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Done for now</p>
                            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">You cleared today&apos;s sequence. Keep one short retrieval tomorrow to hold momentum.</p>
                          </article>
                        ) : null}
                      </>
                    ) : (
                      <article className="copilot-sidebar-card space-y-2">
                        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Daily queue is warming up</p>
                        <p className="text-xs text-[var(--copilot-text-secondary)]">Start one quick cycle and this playlist will organize itself.</p>
                        <Button type="button" className="h-8 rounded-full px-3 text-xs" onClick={() => openQuickCycleAction('daily-feed')}>
                          Start one quick cycle
                        </Button>
                      </article>
                    )}
                  </div>
                </section>
              ) : null}

              {props.activeSection === 'study_plans' ? (
                <section className="copilot-workspace-panel copilot-growth-surface-plans p-5">
                  <div className="flex items-center gap-2"><Workflow className="h-4.5 w-4.5 text-[var(--copilot-workspace-strong)]" /><h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">AI-built study roadmaps</h3></div>
                  <p className="mt-2 text-sm text-[var(--copilot-text-secondary)]">Start or resume quickly. Steadfast keeps milestones sequenced and current.</p>
                  {topPlan ? (
                    <article className="copilot-growth-plan-hero mt-3">
                      <p className="copilot-workspace-eyebrow">Resume path</p>
                      <p className="mt-2 text-lg font-semibold text-[var(--copilot-text-primary)]">{topPlan.title}</p>
                      <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{topPlan.summary || topPlan.topic || 'Roadmap focus'}</p>
                      <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                        {planGoals.find((goal) => goal.status !== 'completed')?.title || 'All milestones complete. Keep one light retrieval cycle active.'}
                      </p>
                      <Button
                        type="button"
                        className="mt-3 h-8 rounded-full px-3 text-xs"
                        onClick={() =>
                          openInline({
                            actionType: 'continue_plan',
                            targetType: 'study_plan',
                            targetId: topPlan.id,
                            renderMode: 'split_view',
                            title: topPlan.title,
                            subject: topPlan.subject || null,
                            topic: topPlan.topic || null,
                            studyPlan: topPlan,
                            studyGoal: planGoals.find((goal) => goal.status !== 'completed') || null,
                          })
                        }
                      >
                        Resume roadmap
                      </Button>
                    </article>
                  ) : null}
                  {planRecommendations.length ? (
                    <div className="mt-3 copilot-growth-card-grid-compact">
                      {planRecommendations.map((entry) => (
                        <article key={entry.id} className="copilot-growth-plan-suggestion">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Suggested roadmap</p>
                          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{entry.title}</p>
                          <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{entry.reason}</p>
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-3 h-8 rounded-full px-3 text-xs"
                            onClick={() =>
                              openInline({
                                actionType: 'continue_plan',
                                targetType: 'study_goal',
                                targetId: entry.id,
                                renderMode: 'split_view',
                                title: entry.title,
                                subject: entry.primaryAction.subject || null,
                                topic: entry.primaryAction.topic || null,
                                helperText: entry.reason,
                              })
                            }
                          >
                            Start suggested roadmap
                          </Button>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 copilot-growth-card-grid">
                    {studyPlans.length ? (
                      studyPlans.map((plan) => {
                        const growthPlanView = studyPlansSnapshot?.plans?.find((entry) => entry.id === plan.id) || null;
                        const goals = studyGoals.filter((goal) => goal.studyPlanId === plan.id);
                        const completed = goals.filter((goal) => goal.status === 'completed').length;
                        const lifecycle = String((plan.metadata as Record<string, unknown> | null)?.lifecycle || 'active');
                        const nextGoal = goals.find((goal) => goal.status !== 'completed') || null;
                        const milestoneDraft = newMilestoneByPlan[plan.id] || '';
                        return (
                            <article key={plan.id} className="copilot-growth-plan-card space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{plan.title}</p>
                                <span className="copilot-revision-pill">{lifecycle === 'paused' ? 'paused' : 'active'}</span>
                              </div>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">{plan.summary || 'Summary will appear as you progress.'}</p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">
                                {growthPlanView?.progressSummary || `Milestones complete: ${completed}/${Math.max(1, goals.length)}`}
                              </p>
                              <p className="text-xs text-[var(--copilot-text-secondary)]">{growthPlanView?.nextAction || `Next step: ${nextGoal?.title || 'All milestones complete'}`}</p>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" className="h-8 rounded-full px-3 text-xs" onClick={() => openInline({ actionType: 'continue_plan', targetType: 'study_plan', targetId: plan.id, renderMode: 'split_view', title: plan.title, subject: plan.subject || null, topic: plan.topic || null, studyPlan: plan, studyGoal: nextGoal })}>Resume plan</Button>
                              {nextGoal ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 rounded-full px-3 text-xs"
                                  disabled={Boolean(busyActionKeys[`plan:complete-goal:${nextGoal.id}`])}
                                  onClick={() =>
                                    void runActionWithGuard(
                                      `plan:complete-goal:${nextGoal.id}`,
                                      async () => {
                                        const result = await api.study.completeGoal(nextGoal.id);
                                        setStudyGoals((prev) => prev.map((entry) => (entry.id === result.goal.id ? result.goal : entry)));
                                        refreshGrowthIntelligence();
                                        return result;
                                      },
                                      {
                                        successMessage: 'Milestone completed.',
                                        errorMessage: 'Could not complete this milestone yet.',
                                      }
                                    )
                                  }
                                >
                                  {busyActionKeys[`plan:complete-goal:${nextGoal.id}`] ? 'Completing...' : 'Mark next step complete'}
                                </Button>
                              ) : null}
                            </div>
                            <details className="rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                              <summary className="cursor-pointer text-xs font-semibold text-[var(--copilot-text-secondary)]">Plan controls</summary>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Button
                                type="button"
                                variant="outline"
                                className="h-8 rounded-full px-3 text-xs"
                                disabled={Boolean(busyActionKeys[`plan:lifecycle:${plan.id}`])}
                                onClick={() =>
                                  void runActionWithGuard(
                                    `plan:lifecycle:${plan.id}`,
                                    async () => {
                                      const result = await (lifecycle === 'paused' ? api.study.resumePlan(plan.id) : api.study.pausePlan(plan.id));
                                      setStudyPlans((prev) => prev.map((entry) => entry.id === result.plan.id ? result.plan : entry));
                                      refreshGrowthIntelligence();
                                      return result;
                                    },
                                    {
                                      successMessage: lifecycle === 'paused' ? 'Plan resumed.' : 'Plan paused.',
                                      errorMessage: 'Could not update plan lifecycle. Local workspace is unchanged.',
                                    }
                                  )
                                }
                              >
                                {busyActionKeys[`plan:lifecycle:${plan.id}`] ? 'Updating...' : lifecycle === 'paused' ? 'Resume' : 'Pause'}
                              </Button>
                            <div className="flex gap-2">
                              <Input
                                value={milestoneDraft}
                                onChange={(event) =>
                                  setNewMilestoneByPlan((prev) => ({
                                    ...prev,
                                    [plan.id]: event.target.value,
                                  }))
                                }
                                placeholder="Add next milestone"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                className="h-8 rounded-full px-3 text-xs"
                                disabled={Boolean(busyActionKeys[`plan:add-milestone:${plan.id}`])}
                                onClick={() =>
                                  void runActionWithGuard(
                                    `plan:add-milestone:${plan.id}`,
                                    async () => {
                                      const result = await api.study.createPlanGoal(plan.id, {
                                        title: milestoneDraft || 'New milestone',
                                        goalType: 'practise_topic',
                                        targetCount: 1,
                                        subject: plan.subject || null,
                                        topic: plan.topic || null,
                                      });
                                      setStudyGoals((prev) => [result.goal, ...prev]);
                                      setNewMilestoneByPlan((prev) => ({ ...prev, [plan.id]: '' }));
                                      refreshGrowthIntelligence();
                                      return result;
                                    },
                                    {
                                      successMessage: 'Milestone added.',
                                      errorMessage: 'Could not add milestone right now.',
                                    }
                                  )
                                }
                              >
                                {busyActionKeys[`plan:add-milestone:${plan.id}`] ? 'Adding...' : 'Add milestone'}
                              </Button>
                            </div>
                              </div>
                            </details>
                          </article>
                        );
                      })
                    ) : (
                      <article className="copilot-sidebar-card space-y-2">
                        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">No plans yet</p>
                        <p className="text-xs text-[var(--copilot-text-secondary)]">Steadfast can generate a roadmap from one goal and keep milestones updated for you.</p>
                        <p className="text-xs text-[var(--copilot-text-secondary)]">Use the compact generator below to create your first roadmap in one step.</p>
                      </article>
                    )}
                  </div>
                  <details className="mt-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--copilot-text-secondary)]">Generate a plan from your goal</summary>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <Input placeholder="Goal (required)" value={planGoalDraft} onChange={(event) => setPlanGoalDraft(event.target.value)} />
                      <Button
                        type="button"
                        className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                        disabled={Boolean(busyActionKeys['plan:generate'])}
                        onClick={() =>
                          void runActionWithGuard(
                            'plan:generate',
                            async () => {
                              const result = await api.study.generatePlan({ goal: planGoalDraft || 'Weekly stability', scope: 'weekly' });
                              setStudyPlans((prev) => [result.plan, ...prev]);
                              setStudyGoals((prev) => [...result.goals, ...prev]);
                              setPlanGoalDraft('');
                              refreshGrowthIntelligence();
                              return result;
                            },
                            {
                              successMessage: 'Adaptive plan generated.',
                              errorMessage: 'Plan generation failed. Demo data remains available for testing.',
                            }
                          )
                        }
                      >
                        {busyActionKeys['plan:generate'] ? 'Generating...' : 'Generate plan'}
                      </Button>
                    </div>
                  </details>
                </section>
              ) : null}

              {props.activeSection === 'mastery_trends' ? (
                <section className="copilot-workspace-panel copilot-growth-surface-trends p-5">
                  <div className="flex items-center gap-2"><TrendingUp className="h-4.5 w-4.5 text-[var(--copilot-workspace-strong)]" /><h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">Mastery trends</h3></div>
                  {masteryTrendsSnapshot ? (
                    <article className="copilot-growth-trend-hero mt-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Overall movement</p>
                        <span className="copilot-revision-pill">{masteryTrendsSnapshot.overall.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm text-[var(--copilot-text-secondary)]">{masteryTrendsSnapshot.overall.summary}</p>
                    </article>
                  ) : null}
                  <article className="mt-4 copilot-growth-trend-band">
                    <div className="grid gap-2 md:grid-cols-4">
                      {[{ label: 'Still learning', value: stats.masteryCounts.still_learning, key: 'still_learning' }, { label: 'Getting better', value: stats.masteryCounts.getting_better, key: 'getting_better' }, { label: 'Almost there', value: stats.masteryCounts.almost_there, key: 'almost_there' }, { label: 'Confident', value: stats.masteryCounts.confident, key: 'confident' }].map((entry) => (
                        <div key={entry.label} className="copilot-workspace-stat px-3 py-3 text-left">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">{entry.label}</p>
                          <p className="mt-2 text-xl font-semibold text-[var(--copilot-text-primary)]">{entry.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() =>
                          openInline({
                            actionType: 'do_now',
                            targetType: 'mastery_bucket',
                            targetId: 'still_learning',
                            renderMode: 'split_view',
                            title: 'Still learning',
                            helperText: 'Open weakest mastery band for targeted support.',
                          })
                        }
                      >
                        Review support lane
                      </Button>
                    </div>
                  </article>
                  <div className="mt-4 copilot-growth-card-grid">
                    {interpretedSubjectTrends.map((entry) => (
                      <article key={entry.subject} className="copilot-growth-trend-card space-y-2">
                        <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{entry.subject}</p><span className="copilot-revision-pill">{entry.confidenceRatio}% stable</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--copilot-surface-muted)]"><div className="h-full rounded-full bg-[var(--copilot-accent-primary)]" style={{ width: `${Math.max(4, entry.confidenceRatio)}%` }} /></div>
                        <p className="text-xs text-[var(--copilot-text-secondary)]">
                          {entry.summary || `Topics: ${entry.topics.join(', ')}`}
                        </p>
                        {entry.delta != null ? <p className="text-xs text-[var(--copilot-text-secondary)]">Recent movement: {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}</p> : null}
                      </article>
                    ))}
                  </div>
                  {masterySupportInsight ? (
                    <article className="copilot-workspace-panel mt-3 p-4">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{masterySupportInsight.title}</p>
                      <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">{masterySupportInsight.summary}</p>
                    </article>
                  ) : null}
                  {masteryTrendsSnapshot?.topicTrends?.length ? (
                    <article className="copilot-workspace-panel mt-3 p-4">
                      <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Topic notes</p>
                      <div className="mt-2 space-y-2">
                        {masteryTrendsSnapshot.topicTrends.slice(0, 4).map((entry) => (
                          <div key={`${entry.subject}-${entry.topic}`} className="copilot-growth-trend-row">
                            <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{entry.topic}</p>
                            <p className="mt-0.5 text-xs text-[var(--copilot-text-secondary)]">{entry.summary}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ) : null}
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {runtime.activeAction || runtimeNotice ? (
            <section className={cn('copilot-workspace-panel p-4 md:p-5', runtime.activeAction ? 'copilot-growth-action-dock sticky bottom-3 z-20' : '')}>
              <p className="copilot-workspace-eyebrow">Action dock</p>
              <h3 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">{runtime.activeAction?.title || 'Action update'}</h3>
              {runtimeNotice ? (
                <p
                  className={cn(
                    'mt-2 text-xs',
                    runtimeNotice.tone === 'success'
                      ? 'text-emerald-300'
                      : runtimeNotice.tone === 'warning'
                        ? 'text-amber-300'
                        : runtimeNotice.tone === 'error'
                          ? 'text-rose-300'
                          : 'text-[var(--copilot-text-secondary)]'
                  )}
                >
                  {runtimeNotice.message}
                </p>
              ) : null}
              {!runtime.activeAction && runtimeNotice ? (
                <div className="mt-3">
                  <Button type="button" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => setRuntimeNotice(null)}>
                    Dismiss
                  </Button>
                </div>
              ) : null}
              {runtime.activeAction ? (
                <div className="mt-4 space-y-3">
                <article className="copilot-sidebar-card space-y-3">
                  <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">{runtime.activeAction.subject || 'General'} {runtime.activeAction.topic ? ` - ${runtime.activeAction.topic}` : ''}</p>
                  <p className="text-xs text-[var(--copilot-text-secondary)]">{runtime.activeAction.helperText || 'Complete this step and Steadfast will update your guidance.'}</p>
                  {resolvingActionKey === activeRuntimeKey ? (
                    <p className="text-xs text-[var(--copilot-text-secondary)]">Preparing your next step...</p>
                  ) : null}
                  {activeRuntimePlan ? (
                    <div className="rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Next destination</p>
                      <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                        {activeRuntimePlan.destination}
                        {activeRuntimePlan.mediaMode ? ` -> ${activeRuntimePlan.mediaMode}` : ''}
                        {activeRuntimePlan.prompt ? ` | ${activeRuntimePlan.prompt}` : ''}
                      </p>
                    </div>
                  ) : null}
                  {activeRuntimeCopy ? (
                    <div className="space-y-2 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                      <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">{activeRuntimeCopy.promptLabel}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeRuntimeCopy.scaffold.map((hint) => (
                          <span key={hint} className="copilot-revision-pill">{hint}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <Input
                    value={runtimeResponseDraft}
                    onChange={(event) => setRuntimeResponseDraft(event.target.value)}
                    placeholder={activeRuntimeCopy?.responsePlaceholder || 'Write your response or reasoning...'}
                  />
                  <p className="text-[11px] text-[var(--copilot-text-secondary)]">
                    Length: {runtimeResponseDraft.trim().length} chars
                    {activeRuntimeCopy ? ` | target ${activeRuntimeCopy.minChars}+ chars` : ''}
                  </p>
                  {runtime.activeAction.actionType === 'continue_plan' && runtime.activeAction.studyPlan ? (
                    <div className="space-y-2 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                      <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">Plan summary</p>
                      <Input
                        value={planSummaryDraft}
                        onChange={(event) => setPlanSummaryDraft(event.target.value)}
                        placeholder="Update plan summary"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-3 text-xs"
                        disabled={Boolean(busyActionKeys[`plan:summary:${runtime.activeAction.studyPlan.id}`])}
                        onClick={() =>
                          void runActionWithGuard(
                            `plan:summary:${runtime.activeAction!.studyPlan!.id}`,
                            async () => {
                              const result = await api.study.updatePlan(runtime.activeAction!.studyPlan!.id, { summary: planSummaryDraft || null });
                              setStudyPlans((prev) => prev.map((entry) => (entry.id === result.plan.id ? result.plan : entry)));
                              setStudyGoals((prev) => {
                                const retained = prev.filter((entry) => entry.studyPlanId !== result.plan.id);
                                return [...retained, ...result.goals];
                              });
                              refreshGrowthIntelligence();
                              return result;
                            },
                            {
                              successMessage: 'Plan summary saved.',
                              errorMessage: 'Could not save plan summary right now.',
                            }
                          )
                        }
                      >
                        {busyActionKeys[`plan:summary:${runtime.activeAction.studyPlan.id}`] ? 'Saving...' : 'Save summary'}
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                      disabled={Boolean(activeRuntimeKey && busyActionKeys[`runtime:${activeRuntimeKey}:complete`])}
                      onClick={() => void completeInline()}
                    >
                      {activeRuntimeKey && busyActionKeys[`runtime:${activeRuntimeKey}:complete`]
                        ? 'Completing...'
                        : activeRuntimeCopy?.submitLabel || 'Complete action'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      disabled={Boolean(activeRuntimeKey && (busyActionKeys[`runtime:${activeRuntimeKey}:execute`] || resolvingActionKey === activeRuntimeKey))}
                      onClick={() => void executeResolvedAction()}
                    >
                      {activeRuntimeKey && busyActionKeys[`runtime:${activeRuntimeKey}:execute`]
                        ? 'Opening...'
                        : resolvingActionKey === activeRuntimeKey
                          ? 'Resolving...'
                          : activeRuntimePlan
                            ? 'Open next step'
                            : 'Prepare next step'}
                    </Button>
                    <Button type="button" variant="outline" className="copilot-control-nav h-8 rounded-full px-3 text-xs" onClick={() => runtime.closeAction()}>Close</Button>
                  </div>
                  <p className="text-xs text-[var(--copilot-text-secondary)]">
                    Progress: {runtime.getProgress(runtime.activeAction)?.status || 'in_progress'} - completions {runtime.getProgress(runtime.activeAction)?.completions || 0}
                  </p>
                </article>
                {growthFunnel || recentRuntimeProgress.length ? (
                  <details className="rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--copilot-text-secondary)]">Learning signal details</summary>
                    <div className="mt-2 space-y-2">
                      {growthFunnel ? (
                        <article className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Action flow</p>
                            <span className="copilot-revision-pill">{growthFunnel.periodLabel}</span>
                          </div>
                          <p className="text-xs text-[var(--copilot-text-secondary)]">
                            Open to submit: {Math.round(growthFunnel.openToSubmitRate * 100)}% | Submit to complete: {Math.round(growthFunnel.submitToCompleteRate * 100)}%
                          </p>
                        </article>
                      ) : null}
                      {recentRuntimeProgress.length ? (
                        <article className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Recent runtime actions</p>
                          {recentRuntimeProgress.map((entry) => (
                            <div key={entry.key} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-[var(--copilot-text-secondary)]">{entry.key.replace(/:/g, ' -> ')}</span>
                              <span className="copilot-revision-pill">{entry.status}</span>
                            </div>
                          ))}
                        </article>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
