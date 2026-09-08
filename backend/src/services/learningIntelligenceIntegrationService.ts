// ─────────────────────────────────────────────────────────────
// Steadfast AI — R6 Minimal Canonical Learning Intelligence Snapshot
//
// Lightweight, self-contained read-only composition used ONLY by the
// production Study Plan route during the R6-A production-path stabilization.
//
// Canonical owners:
//   Curriculum KG                                     → curriculum target refs
//   Learning Evidence (event-store projection)        → durable evidence
//   Probabilistic Mastery contracts                   → canonical mastery when available
//   Revision (R5)                                     → revision queue
//   PracticeAttempt                                   → practice provenance
//   StudyPlan / StudyGoal                             → planning lifecycle
//
// Rules enforced here (R6-A/R6):
//   - Reads only; never mutates Evidence or Mastery.
//   - Bounded windows only (no unbounded history loads).
//   - Canonical mastery available → surface it; unavailable → report unavailable,
//     never substitute Progress.mastery or any legacy score.
//   - Deterministic, explainable priority with reason codes + confidence.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import prisma from '../lib/prisma';

type SafeString = string;

function safeString(value: unknown): SafeString {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: string): SafeString {
  return safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: unknown): SafeString | null {
  if (value instanceof Date) return value.toISOString();
  const text = safeString(value).trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Public read-only contract (R6-A production route needs this) ──

// One durable committed-evidence row in the bounded evidence window.
export type EvidenceWindowItem = {
  evidenceId: SafeString;
  sourceType: SafeString;
  outcome: SafeString;
  occurredAt: SafeString;
  topic: SafeString | null;
  subject: SafeString | null;
  usable: boolean;
};

// Canonical mastery view for one target. When canonical mastery is not
// available (process-local), available=false and no legacy score substitutes.
export type CanonicalMasteryView = {
  targetNodeId: SafeString;
  targetNodeType: 'learning_objective' | 'skill' | 'topic';
  probabilityOfMastery: number | null;
  confidence: number;
  evidenceCount: number;
  available: boolean;
  visibleLabel: SafeString | null;
  lastUpdatedAt: SafeString | null;
  lastEvidenceAt: SafeString | null;
  reason: SafeString;
};

export type LearningIntelligenceSnapshot = {
  learner: { learnerId: SafeString };
  school: { schoolId: SafeString | null };
  curriculumTarget: {
    curriculumVersionId: SafeString | null;
    objectiveId: SafeString | null;
    skillId: SafeString | null;
    topicId: SafeString | null;
    subject: SafeString | null;
  } | null;
  mastery: {
    available: boolean;
    states: CanonicalMasteryView[];
  };
  evidence: {
    recent: EvidenceWindowItem[];
    count: number;
    lastEvidenceAt: SafeString | null;
  };
  revision: {
    due: Array<{ id: SafeString; title: SafeString; subject: SafeString; topic: SafeString; reviewStatus: SafeString | null; dueAt: SafeString | null; struggleCount: number; successCount: number }>;
    needsAttention: Array<{ id: SafeString; title: SafeString; subject: SafeString; topic: SafeString; reviewStatus: SafeString | null; dueAt: SafeString | null; struggleCount: number; successCount: number }>;
    revisionItemRefs: SafeString[];
  };
  practice: {
    recent: Array<{ attemptId: SafeString; outcome: SafeString; subject: SafeString | null; topic: SafeString | null; createdAt: SafeString }>;
    practiceNeeded: boolean;
  };
  planning: {
    activeGoals: Array<{ planId: SafeString; goalId: SafeString; title: SafeString; status: SafeString; subject: SafeString | null; topic: SafeString | null }>;
  };
  prerequisites: Array<{ blockerTopicId: SafeString; topicLabel: SafeString; reasonCodes: SafeString[] }>;
  priority: Array<{ targetId: SafeString; targetType: SafeString; topic: SafeString; subject: SafeString | null; priority: number; score: number; reasonCodes: SafeString[]; confidence: number }>;
  generatedAt: SafeString;
};

export async function getLearningIntelligenceSnapshot(args: {
  learnerId: string;
  schoolId?: string | null;
  subject?: string | null;
}): Promise<LearningIntelligenceSnapshot> {
  const learnerId = safeString(args.learnerId).trim();
  const schoolId = safeString(args.schoolId).trim() || null;
  if (!learnerId) throw new Error('learnerId is required');

  const subjectFilter = normalizeKey(args.subject || '');

  // Curriculum target refs from the canonical curriculum tables only when useful.
  let curriculumTarget: LearningIntelligenceSnapshot['curriculumTarget'] = null;
  try {
    const [versionRow, topicRow, skillRow] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "id" FROM "CurriculumVersionRecord" ORDER BY "createdAt" DESC LIMIT 1`,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "id", "topic", "subject", "curriculumVersionId" FROM "CurriculumTopicRecord" WHERE "subject" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        args.subject || null,
      ),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "id", "skill", "curriculumVersionId" FROM "CurriculumSkillRecord" ORDER BY "createdAt" DESC LIMIT 1`,
      ),
    ]);

    const versionId = versionRow?.[0] ? safeString(versionRow[0].id) : null;
    const topic = topicRow?.[0] ? topicRow[0] : null;
    const skill = skillRow?.[0] ? skillRow[0] : null;

    if (versionId || topic || skill) {
      curriculumTarget = {
        curriculumVersionId: versionId,
        objectiveId: null,
        skillId: skill ? safeString(skill.id) : null,
        topicId: topic ? safeString(topic.id) : null,
        subject: topic ? safeString(topic.subject).trim() || null : null,
      };
    }
  } catch {
    // Canonical curriculum is best-effort for the R6-A production route.
    curriculumTarget = null;
  }

  // Durable canonical evidence: committed event-store projections for this learner.
  let evidenceWindow: LearningIntelligenceSnapshot['evidence']['recent'] = [];
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "committedEvidenceId", "sourceType", "outcome", "occurredAt", "topicId", "schoolId"
       FROM "LearningEvidenceCommittedProjection"
       WHERE "learnerId" = $1
       ORDER BY "occurredAt" DESC
       LIMIT 120`,
      learnerId,
    );
    evidenceWindow = rows.map((row) => ({
      evidenceId: safeString(row.committedEvidenceId),
      sourceType: safeString(row.sourceType),
      outcome: safeString(row.outcome) || 'unscored',
      occurredAt: toIso(row.occurredAt) || nowIso(),
      topic: safeString(row.topicId).trim() || null,
      subject: null,
      usable: true,
    }));
  } catch {
    evidenceWindow = [];
  }

  // Practice provenance (bounded, read-only).
  let practiceWindow: LearningIntelligenceSnapshot['practice']['recent'] = [];
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id", "outcome", "subject", "topic", "createdAt"
       FROM "PracticeAttempt"
       WHERE "studentId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 60`,
      learnerId,
    );
    practiceWindow = rows.map((row) => ({
      attemptId: safeString(row.id),
      outcome: safeString(row.outcome) || 'not_evaluated',
      subject: safeString(row.subject).trim() || null,
      topic: safeString(row.topic).trim() || null,
      createdAt: toIso(row.createdAt) || nowIso(),
    }));
  } catch {
    practiceWindow = [];
  }

  // Canonical mastery (when available) over best-effort curriculum targets.
  // R6-A does not attempt to recompute mastery here; it only surfaces canonical
  // mastery when the existing probabilistic mastery machinery is available and
  // durable. Otherwise it reports mastery unavailable and still prioritizes from
  // durable Evidence + Revision state.
  const masteryStates: CanonicalMasteryView[] = [];

  if (curriculumTarget?.skillId || curriculumTarget?.topicId) {
    try {
      // R7.2: read durable canonical mastery owner. Learning Intelligence is a
      // reader, never an owner; unavailable -> report unavailable, never
      // substitute Progress.mastery or any legacy score.
      const { canonicalMasteryRepository } = await import('./probabilisticMasteryRepository');
      const targets: Array<{ targetNodeId: string; targetNodeType: 'learning_objective' | 'skill' }> = [];
      if (curriculumTarget.skillId) targets.push({ targetNodeId: curriculumTarget.skillId, targetNodeType: 'skill' });
      // Canonical mastery is keyed by objective/skill nodes; topic-level nodes
      // do not carry canonical mastery state in the current repository.
      for (const target of targets) {
        const state = await canonicalMasteryRepository.readState({
          schoolId: schoolId || '',
          learnerId,
          targetNodeId: target.targetNodeId,
          targetNodeType: target.targetNodeType,
          curriculumVersionId: curriculumTarget.curriculumVersionId || '',
        });
        if (!state) continue;
        masteryStates.push({
          targetNodeId: safeString(state.targetNodeId),
          targetNodeType: target.targetNodeType,
          probabilityOfMastery: clamp(Number(state.probabilityOfMastery) || 0, 0, 1),
          confidence: clamp(Number(state.confidence) || 0, 0, 1),
          evidenceCount: Math.max(0, Number(state.evidenceCount) || 0),
          available: true,
          visibleLabel: safeString(state.visibleLabel).trim() || null,
          lastUpdatedAt: toIso(state.updatedAt) || null,
          lastEvidenceAt: toIso(state.lastEvidenceAt) || null,
          reason: 'canonical_mastery_state',
        });
      }
    } catch {
      // Probabilistic mastery machinery unavailable in this process/context.
      // Report mastery unavailable but keep durable evidence + revision as priority inputs.
    }
  }

  // Revision queue (R5 canonical).
  let revisionWindow: LearningIntelligenceSnapshot['revision'] = {
    due: [],
    needsAttention: [],
    revisionItemRefs: [],
  };
  try {
    const { fetchUserRevisionItems, getRevisionQueue } = await import('./revisionLearningService');
    const queue = await getRevisionQueue(learnerId, 24).catch(() => ({ dueNow: [], needsAttention: [] }));
    const items = await fetchUserRevisionItems(learnerId, 120).catch(() => []);
    const mapItem = (item: any) => ({
      id: safeString(item.id),
      title: safeString(item.title) || safeString(item.topic) || 'Revision item',
      subject: safeString(item.subject).trim() || 'General',
      topic: safeString(item.topic || item.subtopic || item.title).trim() || 'General',
      reviewStatus: safeString(item.reviewStatus).trim() || null,
      dueAt: toIso(item.nextReviewAt || item.dueAt),
      struggleCount: Math.max(0, Number(item.struggleCount || 0)),
      successCount: Math.max(0, Number(item.successCount || 0)),
    });

    const dueItems = ((queue as any)?.dueNow || []).map(mapItem);
    const attentionItems = ((queue as any)?.needsAttention || []).map(mapItem);
    revisionWindow = {
      due: subjectFilter ? dueItems.filter((i: any) => normalizeKey(i.subject) === subjectFilter || i.subject === 'General') : dueItems,
      needsAttention: subjectFilter ? attentionItems.filter((i: any) => normalizeKey(i.subject) === subjectFilter || i.subject === 'General') : attentionItems,
      revisionItemRefs: items.slice(0, 40).map((item: any) => safeString(item.id)).filter(Boolean),
    };
  } catch {
    revisionWindow = { due: [], needsAttention: [], revisionItemRefs: [] };
  }

  // Planning window.
  let activeGoals: LearningIntelligenceSnapshot['planning']['activeGoals'] = [];
  try {
    const { getStudyPlans, getStudyGoals } = await import('./studySupportService');
    const goals = await getStudyGoals(learnerId).catch(() => []);
    activeGoals = goals
      .filter((goal: any) => safeString(goal.status) !== 'completed')
      .slice(0, 12)
      .map((goal: any) => ({
        planId: safeString(goal.studyPlanId),
        goalId: safeString(goal.id),
        title: safeString(goal.title),
        status: safeString(goal.status),
        subject: safeString(goal.subject).trim() || null,
        topic: safeString(goal.topic).trim() || null,
      }));
  } catch {
    activeGoals = [];
  }

  // Prerequisite blockers over canonical curriculum when available.
  const prerequisites: LearningIntelligenceSnapshot['prerequisites'] = [];

  // Priority: deterministic bounded ranking over canonical inputs.
  const priority = computePriority({
    subjectFilter,
    evidenceWindow,
    practiceWindow,
    revisionWindow,
    masteryStates,
    activeGoals,
    curriculumTarget,
  });

  return {
    learner: { learnerId },
    school: { schoolId },
    curriculumTarget,
    mastery: { available: masteryStates.length > 0, states: masteryStates },
    evidence: {
      recent: evidenceWindow,
      count: evidenceWindow.length,
      lastEvidenceAt: evidenceWindow[0]?.occurredAt || null,
    },
    revision: revisionWindow,
    practice: {
      recent: practiceWindow,
      practiceNeeded: practiceWindow.length === 0 || evidenceWindow.some((item) => item.outcome === 'incorrect'),
    },
    planning: { activeGoals },
    prerequisites,
    priority,
    generatedAt: nowIso(),
  };
}

// ── Deterministic bounded priority (R6-A/R6) ──
// Do not load unbounded history. Use bounded windows + durable projections.
// O(n log n) over the bounded candidate set.

const PRIORITY_CANDIDATE_LIMIT = 12;

function computePriority(args: {
  subjectFilter: SafeString;
  evidenceWindow: LearningIntelligenceSnapshot['evidence']['recent'];
  practiceWindow: LearningIntelligenceSnapshot['practice']['recent'];
  revisionWindow: LearningIntelligenceSnapshot['revision'];
  masteryStates: LearningIntelligenceSnapshot['mastery']['states'];
  activeGoals: LearningIntelligenceSnapshot['planning']['activeGoals'];
  curriculumTarget: LearningIntelligenceSnapshot['curriculumTarget'];
}): LearningIntelligenceSnapshot['priority'] {
  const subjectFilter = args.subjectFilter;
  const candidates = new Map<
    string,
    {
      targetId: SafeString;
      targetType: SafeString;
      topic: SafeString;
      subject: SafeString | null;
      priority: number;
      reasonCodes: SafeString[];
    }
  >();

  const candidateTopicLabel = (label: string | null | undefined): SafeString => {
    const text = safeString(label || '').trim();
    if (!text) return 'General';
    return text;
  };

  // Canonical weak/due revision items first.
  for (const item of args.revisionWindow.needsAttention) {
    const key = normalizeKey(item.topic);
    if (subjectFilter && subjectFilter !== normalizeKey(item.subject) && item.subject !== 'General') continue;
    const existing = candidates.get(key);
    const score = Math.min(100, (existing?.priority || 0) + 12 + (item.struggleCount * 4));
    candidates.set(key, {
      targetId: item.id,
      targetType: 'revision_topic',
      topic: candidateTopicLabel(item.topic),
      subject: item.subject === 'General' ? null : item.subject,
      priority: score,
      reasonCodes: [...new Set([...(existing?.reasonCodes || []), 'revision_due', 'recent_incorrect_evidence'])].slice(0, 6),
    });
  }

  for (const item of args.revisionWindow.due) {
    const key = normalizeKey(item.topic);
    if (subjectFilter && subjectFilter !== normalizeKey(item.subject) && item.subject !== 'General') continue;
    const existing = candidates.get(key);
    const score = Math.min(100, (existing?.priority || 0) + 10);
    candidates.set(key, {
      targetId: item.id,
      targetType: 'revision_topic',
      topic: candidateTopicLabel(item.topic),
      subject: item.subject === 'General' ? null : item.subject,
      priority: score,
      reasonCodes: [...new Set([...(existing?.reasonCodes || []), 'revision_due'])].slice(0, 6),
    });
  }

  // Canonical negative/partial evidence.
  const evidenceByTopic = new Map<string, EvidenceWindowItem[]>();
  for (const item of args.evidenceWindow) {
    if (!item.usable) continue;
    const key = normalizeKey(item.topic || 'General');
    const bucket = evidenceByTopic.get(key) || [];
    bucket.push(item);
    evidenceByTopic.set(key, bucket);
  }

  for (const [topicKey, items] of evidenceByTopic.entries()) {
    const incorrectCount = items.filter((item) => item.outcome === 'incorrect').length;
    const partialCount = items.filter((item) => item.outcome === 'partial' || item.outcome === 'unscored').length;
    if (incorrectCount === 0 && partialCount === 0) continue;
    const existing = candidates.get(topicKey);
    const topicLabel = candidateTopicLabel(items.length > 0 ? items[0]?.topic : null);
    const topicSubject = items.length > 0 ? items[0]?.subject : null;
    const score = Math.min(100, (existing?.priority || 0) + Math.min(24, incorrectCount * 4 + partialCount * 2));
    candidates.set(topicKey, {
      targetId: existing?.targetId || topicKey,
      targetType: existing?.targetType || 'evidence_topic',
      topic: topicLabel,
      subject: existing?.subject ?? topicSubject,
      priority: score,
      reasonCodes: [...new Set([...(existing?.reasonCodes || []), incorrectCount > 0 ? 'recent_incorrect_evidence' : 'partial_evidence'])].slice(0, 6),
    });
  }

  // Canonical mastery state for known targets.
  for (const state of args.masteryStates) {
    const key = normalizeKey(state.targetNodeId);
    const existing = candidates.get(key);
    const lowMastery = state.available && (state.probabilityOfMastery ?? 0) < 0.5;
    const priorityDelta = lowMastery ? 6 : 0;
    if (priorityDelta === 0 && !existing) continue;
    candidates.set(key, {
      targetId: state.targetNodeId,
      targetType: state.targetNodeType,
      topic: candidateTopicLabel(state.targetNodeId),
      subject: existing?.subject || null,
      priority: Math.min(100, (existing?.priority || 0) + priorityDelta),
      reasonCodes: [...new Set([...(existing?.reasonCodes || []), lowMastery ? 'canonical_mastery_below_threshold' : 'canonical_mastery_weak'])].slice(0, 6),
    });
  }

  // Active study-plan goals are planning context, not academic truth.
  for (const goal of args.activeGoals) {
    const key = normalizeKey(goal.topic || goal.title);
    const existing = candidates.get(key);
    candidates.set(key, {
      targetId: goal.goalId,
      targetType: 'study_goal',
      topic: candidateTopicLabel(goal.topic || goal.title),
      subject: goal.subject || null,
      priority: Math.min(100, (existing?.priority || 0) + 2),
      reasonCodes: [...new Set([...(existing?.reasonCodes || []), 'active_goal'])].slice(0, 6),
    });
  }

  // Practice recency.
  if (args.practiceWindow.length === 0) {
    if (!candidates.has('general_practice')) {
      candidates.set('general_practice', {
        targetId: 'general_practice',
        targetType: 'practice_general',
        topic: 'General practice',
        subject: null,
        priority: 4,
        reasonCodes: ['practice_needed'],
      });
    }
  }

  return [...candidates.values()]
    .sort((a, b) => b.priority - a.priority || a.targetId.localeCompare(b.targetId))
    .slice(0, PRIORITY_CANDIDATE_LIMIT)
    .map(({ priority, ...rest }) => ({
      ...rest,
      priority,
      score: Number(clamp(priority, 0, 100).toFixed(1)),
      confidence: Number(clamp(priority / 100, 0.1, 0.99).toFixed(2)),
    }));
}

// ── Fingerprint helper shared by callers that need a stable logical request identity ──

export function learningIntelligenceRequestFingerprint(parts: Array<string | number | null | undefined>): SafeString {
  return createHash('sha256').update(parts.map((p) => safeString(p)).join('|')).digest('hex');
}
