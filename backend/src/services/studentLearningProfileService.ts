import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { calculateMasteryScore, aggregateSkillMastery } from './masteryAggregationService';
import { detectWeakTopics, detectImprovingTopics } from './weakTopicDetectionService';
import { aggregateMistakePatterns } from './mistakePatternAggregationService';
import { inferHelpfulSupportPatterns } from './supportPatternInferenceService';
import { collectSafeEvidenceForStudent, buildSafeEvidenceRefs } from './learningProfileEvidenceService';
import { rejectRawProfileInput } from './learningProfilePrivacyGuard';
import { resolveProfileAccess } from './learningProfileAccessPolicy';
import {
  serializeStudentLearningProfile,
  serializeStudentProfileForStudent,
  serializeStudentProfileForTeacher,
  serializeStudentProfileForAdmin,
  serializeSkillMasterySnapshot,
  serializeWeakTopic,
  serializeMistakePattern,
  serializeSupportPattern,
  serializeAcademicMemory,
  buildEmptySafeProfileResponse,
  buildEmptyMasteryPathwayResponse,
  buildEmptyAcademicMemoryResponse,
} from './learningProfileResponseBuilder';
import type {
  StudentLearningProfileResponse,
  SubjectProfileResponse,
  SkillMasterySnapshotResponse,
  MasteryPathwayResponse,
  WeakTopicResponse,
  MasteryLevel,
  ProfileReasonCode,
  ProfileRecommendedAction,
  SupportPatternType,
  WeakTopicStatus,
} from '../contracts/studentLearningProfileContracts';

export async function getStudentLearningProfile(
  schoolId: string,
  studentId: string,
): Promise<StudentLearningProfileResponse> {
  // Check existing snapshot first
  const existing = await prisma.studentLearningProfileSnapshot.findUnique({
    where: { schoolId_studentId: { schoolId, studentId } },
  });

  if (existing && existing.status !== 'stale') {
    return serializeStudentLearningProfile({
      status: existing.status as any,
      profileVersion: existing.profileVersion,
      subjects: (existing.subjectSummariesJson as any) || [],
      overallStrengthSignals: [],
      overallWeaknessSignals: [],
      recentGrowthSignals: [],
      supportPatternSummary: (existing.supportPatternsJson as any) || [],
      recommendedNextActions: (existing.recommendedActionsJson as any) || [],
      safeEvidenceRefs: (existing.safeEvidenceRefsJson as any) || [],
      confidenceScore: existing.confidenceScore,
      lastUpdatedAt: existing.updatedAt,
    });
  }

  // Build fresh
  return buildStudentLearningProfileSnapshot(schoolId, studentId);
}

export async function refreshStudentLearningProfile(
  schoolId: string,
  studentId: string,
  subjectId?: string,
  topicId?: string,
  forceRecompute = false,
): Promise<StudentLearningProfileResponse> {
  // Validate input
  const check = rejectRawProfileInput({ subjectId, topicId, forceRecompute } as any);
  if (!check.valid) {
    throw new Error(`Forbidden field: ${check.detectedKey}`);
  }

  return buildStudentLearningProfileSnapshot(schoolId, studentId, subjectId, topicId, forceRecompute);
}

export async function buildStudentLearningProfileSnapshot(
  schoolId: string,
  studentId: string,
  subjectId?: string,
  topicId?: string,
  forceRecompute = false,
): Promise<StudentLearningProfileResponse> {
  const evidence = await collectSafeEvidenceForStudent(schoolId, studentId);
  const { signals, attempts, hintEvents, exitSummaries, skillSnapshots } = evidence;

  const totalEvents = signals.length + attempts.length + hintEvents.length + exitSummaries.length;

  if (totalEvents === 0) {
    return buildEmptySafeProfileResponse();
  }

  // Build subject profiles
  const subjectMap = new Map<string, {
    attempts: typeof attempts;
    signals: typeof signals;
    skills: typeof skillSnapshots;
  }>();

  for (const s of signals) {
    if (!s.subjectId) continue;
    if (subjectId && s.subjectId !== subjectId) continue;
    const entry = subjectMap.get(s.subjectId) || { attempts: [], signals: [], skills: [] };
    entry.signals.push(s);
    subjectMap.set(s.subjectId, entry);
  }
  for (const a of attempts) {
    if (!a.subjectId) continue;
    if (subjectId && a.subjectId !== subjectId) continue;
    const entry = subjectMap.get(a.subjectId) || { attempts: [], signals: [], skills: [] };
    entry.attempts.push(a);
    subjectMap.set(a.subjectId, entry);
  }
  for (const sk of skillSnapshots) {
    if (subjectId && sk.subject !== subjectId) continue;
    const entry = subjectMap.get(sk.subject) || { attempts: [], signals: [], skills: [] };
    entry.skills.push(sk);
    subjectMap.set(sk.subject, entry);
  }

  const subjects: SubjectProfileResponse[] = [];
  for (const [subjId, data] of subjectMap) {
    const correctCount = data.attempts.filter(a => a.isCorrect === true).length;
    const totalAttempts = data.attempts.length;
    const masteryScore = calculateMasteryScore({
      attemptCount: totalAttempts,
      correctCount,
      partialCount: data.attempts.filter(a => a.answerQuality === 'partially_correct').length,
      incorrectCount: data.attempts.filter(a => a.isCorrect === false).length,
      hintCount: data.attempts.filter(a => a.usedHint === true).length,
      stuckCount: data.signals.filter(s => ['stuck_detected', 'repeated_mistake_detected'].includes(s.signalType)).length,
      recoveryCount: data.signals.filter(s => s.signalType === 'recovery_detected').length,
      teachBackSuccessCount: data.signals.filter(s => s.signalType === 'teach_back_submitted').length,
      repeatedMistakeCount: data.signals.filter(s => s.signalType === 'repeated_mistake_detected').length,
      misconceptionCount: data.signals.filter(s => s.signalType === 'mistake_detected').length,
      lastAttemptAt: data.attempts.length > 0 ? data.attempts[data.attempts.length - 1].createdAt : null,
      lastCorrectAt: data.attempts.filter(a => a.isCorrect === true).slice(-1)[0]?.createdAt || null,
    });

    const strongTopics = new Set(data.skills.filter(sk => sk.level === 'secure' || sk.level === 'strong').map(sk => sk.topic));
    const weakTopics = new Set(data.skills.filter(sk => sk.level === 'emerging' || sk.level === 'not_started').map(sk => sk.topic));
    const developingTopics = new Set(data.skills.filter(sk => sk.level === 'developing').map(sk => sk.topic));

    subjects.push({
      subjectId: subjId,
      masteryLevel: masteryScore.masteryLevel,
      confidenceScore: Math.round(masteryScore.confidenceScore * 100) / 100,
      strongTopicCount: strongTopics.size,
      weakTopicCount: weakTopics.size,
      developingTopicCount: developingTopics.size,
      recentActivityCount: totalAttempts,
      recommendedNextTopic: null,
      safeEvidenceRefs: data.signals.slice(0, 3).map(s => s.id),
    });
  }

  // Detect weak topics
  const weakTopics = await detectWeakTopics(schoolId, studentId, subjectId);
  const improvingTopics = await detectImprovingTopics(schoolId, studentId, subjectId);

  // Detect mistake patterns
  const mistakePatterns = await aggregateMistakePatterns(schoolId, studentId, subjectId);

  // Support patterns
  const supportPatterns = await inferHelpfulSupportPatterns(schoolId, studentId);

  const refs = buildSafeEvidenceRefs(signals, attempts, hintEvents);

  // Overall strength/weakness signals
  const strengthSignals = signals.filter(s =>
    ['recovery_detected', 'step_successful', 'teach_back_submitted', 'reflection_detected', 'readiness_check_submitted'].includes(s.signalType)
  ).map(s => s.signalType);
  const weaknessSignals = signals.filter(s =>
    ['stuck_detected', 'mistake_detected', 'repeated_mistake_detected'].includes(s.signalType)
  ).map(s => s.signalType);

  const growthSignals = signals.filter(s =>
    s.signalType === 'recovery_detected' || s.signalType === 'step_successful'
  ).map(s => s.signalType);

  // Recommended next actions
  const recommendedActions: any[] = [];
  if (weakTopics.length > 0) {
    recommendedActions.push({
      action: 'review_topic' as ProfileRecommendedAction,
      reasonCodes: ['low_confidence' as ProfileReasonCode],
      priority: 1,
      topicId: weakTopics[0].topicId,
    });
  }
  if (improvingTopics.length > 0) {
    recommendedActions.push({
      action: 'practice_more' as ProfileRecommendedAction,
      reasonCodes: ['improving_trend' as ProfileReasonCode],
      priority: 2,
      topicId: improvingTopics[0].topicId,
    });
  }
  if (strengthSignals.length > 3) {
    recommendedActions.push({
      action: 'move_to_next_topic' as ProfileRecommendedAction,
      reasonCodes: ['strong_evidence' as ProfileReasonCode],
      priority: 3,
    });
  }

  // Persist snapshot
  const totalCorrect = attempts.filter(a => a.isCorrect === true).length;
  const totalAttemptsAll = attempts.length;
  const confidenceScoreVal = totalAttemptsAll > 0
    ? Math.min(0.15 + (totalAttemptsAll / 20) * 0.3 + (totalCorrect / Math.max(totalAttemptsAll, 1)) * 0.3 + (signals.length / 50) * 0.25, 1)
    : 0;

  try {
    const toJson = (val: any) => JSON.parse(JSON.stringify(val)) as any;
    await prisma.studentLearningProfileSnapshot.upsert({
      where: { schoolId_studentId: { schoolId, studentId } },
      update: {
        profileVersion: { increment: 1 },
        status: 'active',
        profileJson: toJson({}),
        subjectSummariesJson: toJson(subjects),
        topicSummariesJson: toJson([]),
        supportPatternsJson: toJson(supportPatterns.map(sp => serializeSupportPattern(sp))),
        recommendedActionsJson: toJson(recommendedActions),
        safeEvidenceRefsJson: toJson(refs),
        privacyLevel: 'student_only',
        confidenceScore: confidenceScoreVal,
        generatedFromEventCount: totalEvents,
        lastEvidenceAt: new Date(),
      },
      create: {
        id: randomUUID(),
        schoolId,
        studentId,
        profileVersion: 1,
        status: 'active',
        profileJson: toJson({}),
        subjectSummariesJson: toJson(subjects),
        topicSummariesJson: toJson([]),
        supportPatternsJson: toJson(supportPatterns.map(sp => serializeSupportPattern(sp))),
        recommendedActionsJson: toJson(recommendedActions),
        safeEvidenceRefsJson: toJson(refs),
        privacyLevel: 'student_only',
        confidenceScore: confidenceScoreVal,
        generatedFromEventCount: totalEvents,
        lastEvidenceAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch {
    // Non-critical persistence failure - return computed result anyway
  }

  return serializeStudentLearningProfile({
    status: 'active',
    profileVersion: 1,
    subjects,
    overallStrengthSignals: [...new Set(strengthSignals)],
    overallWeaknessSignals: [...new Set(weaknessSignals)],
    recentGrowthSignals: [...new Set(growthSignals)],
    supportPatternSummary: supportPatterns.map(sp => serializeSupportPattern(sp)),
    recommendedNextActions: recommendedActions,
    safeEvidenceRefs: refs.map(r => r.id),
    confidenceScore: confidenceScoreVal,
    lastUpdatedAt: new Date(),
  });
}

export async function getStudentProfileForStudentView(
  schoolId: string,
  studentId: string,
): Promise<StudentLearningProfileResponse> {
  const profile = await getStudentLearningProfile(schoolId, studentId);
  return serializeStudentProfileForStudent(profile);
}

export async function getStudentProfileForTeacherView(
  schoolId: string,
  studentId: string,
): Promise<StudentLearningProfileResponse> {
  const profile = await getStudentLearningProfile(schoolId, studentId);
  return serializeStudentProfileForTeacher(profile);
}

export async function getStudentProfileForAdminView(
  schoolId: string,
  studentId: string,
): Promise<StudentLearningProfileResponse> {
  const profile = await getStudentLearningProfile(schoolId, studentId);
  return serializeStudentProfileForAdmin(profile);
}

export async function getMasteryPathway(
  schoolId: string,
  studentId: string,
  subjectId?: string,
): Promise<MasteryPathwayResponse> {
  const where: any = { schoolId, studentId };
  if (subjectId) where.subject = subjectId;

  const snapshots = await prisma.skillMasterySnapshot.findMany({ where });

  if (snapshots.length === 0) {
    return buildEmptyMasteryPathwayResponse();
  }

  const strong: SkillMasterySnapshotResponse[] = [];
  const developing: SkillMasterySnapshotResponse[] = [];
  const weak: SkillMasterySnapshotResponse[] = [];

  for (const sn of snapshots) {
    const serialized = serializeSkillMasterySnapshot({
      skillId: sn.skillId,
      skillLabel: sn.skillLabel,
      subjectId: sn.subject,
      topicId: sn.topic,
      masteryLevel: sn.level as MasteryLevel,
      masteryStatus: sn.status as any,
      confidenceScore: sn.confidenceScore,
      evidenceCount: sn.evidenceCount,
      attemptCount: sn.attemptCount,
      correctCount: sn.correctCount,
      partialCount: sn.partialCount,
      incorrectCount: sn.incorrectCount,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      misconceptionCount: sn.misconceptionCount,
      lastObservedAt: sn.updatedAt,
      lastCorrectAt: sn.lastCorrectAt,
      lastIncorrectAt: sn.lastIncorrectAt,
      nextReviewAt: sn.nextReviewAt,
      safeEvidenceRefs: [],
    });

    if (sn.level === 'secure' || sn.level === 'strong') strong.push(serialized);
    else if (sn.level === 'emerging' || sn.level === 'not_started') weak.push(serialized);
    else developing.push(serialized);
  }

  const recommendedNextSkill = weak.length > 0 ? weak[0]
    : developing.length > 0 ? developing[0]
    : strong.length > 0 ? strong[0]
    : null;

  return {
    strongSkills: strong,
    developingSkills: developing,
    weakSkills: weak,
    recommendedNextSkill,
    whyThisNextReasonCodes: recommendedNextSkill
      ? (weak.length > 0 ? ['low_confidence'] as ProfileReasonCode[] : ['improving_trend'] as ProfileReasonCode[])
      : [],
    safeEvidenceRefs: [],
  };
}

export async function getWeakTopics(
  schoolId: string,
  studentId: string,
  subjectId?: string,
): Promise<WeakTopicResponse[]> {
  const weakTopics = await detectWeakTopics(schoolId, studentId, subjectId);
  return weakTopics.map(wt => serializeWeakTopic(wt));
}

export async function getAcademicMemory(
  schoolId: string,
  studentId: string,
): Promise<ReturnType<typeof serializeAcademicMemory>> {
  const evidence = await collectSafeEvidenceForStudent(schoolId, studentId);
  const { signals, attempts } = evidence;

  if (signals.length === 0 && attempts.length === 0) {
    return buildEmptyAcademicMemoryResponse();
  }

  const strengthPatterns = [...new Set(
    signals.filter(s =>
      ['recovery_detected', 'step_successful', 'teach_back_submitted', 'reflection_detected'].includes(s.signalType)
    ).map(s => s.signalType)
  )];

  const weaknessPatterns = [...new Set(
    signals.filter(s =>
      ['stuck_detected', 'mistake_detected', 'repeated_mistake_detected'].includes(s.signalType)
    ).map(s => s.signalType)
  )];

  const supportPatterns = await inferHelpfulSupportPatterns(schoolId, studentId);

  const revisionNeeds: string[] = [];
  const weakTopics = await detectWeakTopics(schoolId, studentId);
  if (weakTopics.length > 0) {
    revisionNeeds.push(...weakTopics.slice(0, 3).map(wt => `review_topic:${wt.topicId}`));
  }

  return serializeAcademicMemory({
    strengthPatterns,
    weaknessPatterns,
    supportPatterns: supportPatterns.map(sp => serializeSupportPattern(sp)),
    revisionNeeds,
    safeEvidenceRefs: signals.slice(0, 5).map(s => s.id),
  });
}
