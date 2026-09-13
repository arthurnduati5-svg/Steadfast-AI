import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type { Phase3HealthyChallengeParticipation } from '../contracts/phase3PeerLearningContracts';

export function joinHealthyChallenge(
  schoolId: string,
  studentId: string,
  challengeId: string,
  groupId?: string,
): Phase3HealthyChallengeParticipation {
  const challenge = repo.getHealthyChallenge(challengeId);
  const totalSteps = challenge ? 1 : 1;
  const existing = repo.listHealthyChallengeParticipationForLearner(schoolId, studentId)
    .find(p => p.challengeId === challengeId);
  if (existing) return existing;
  return repo.upsertHealthyChallengeParticipation({
    challengeId,
    schoolId,
    groupId,
    studentId,
    stepsCompleted: 0,
    totalSteps,
    safeEvidenceRefs: [],
  });
}

export function completeHealthyChallengeStep(
  schoolId: string,
  studentId: string,
  challengeId: string,
  stepCount: number = 1,
): Phase3HealthyChallengeParticipation | null {
  const participations = repo.listHealthyChallengeParticipationForLearner(schoolId, studentId)
    .filter(p => p.challengeId === challengeId);
  if (participations.length === 0) return null;
  const participation = participations[0];
  const newSteps = participation.stepsCompleted + stepCount;
  const total = participation.totalSteps;
  repo.updateHealthyChallengeParticipationStatus(participation.participationId, newSteps, total);
  return repo.getHealthyChallengeParticipation(participation.participationId);
}

export function getHealthyChallengeParticipation(participationId: string): Phase3HealthyChallengeParticipation | null {
  return repo.getHealthyChallengeParticipation(participationId);
}

export function listChallengeParticipationForLearner(
  schoolId: string,
  studentId: string,
): Phase3HealthyChallengeParticipation[] {
  return repo.listHealthyChallengeParticipationForLearner(schoolId, studentId);
}

export function listChallengeParticipationForTeacher(
  schoolId: string,
  challengeId: string,
): Phase3HealthyChallengeParticipation[] {
  return repo.listHealthyChallengeParticipationForChallenge(challengeId)
    .filter(p => p.schoolId === schoolId);
}

export function buildChallengeParticipationSafeView(participation: Phase3HealthyChallengeParticipation): any {
  return {
    participationId: participation.participationId,
    challengeId: participation.challengeId,
    schoolId: participation.schoolId,
    groupId: participation.groupId,
    studentId: participation.studentId,
    stepsCompleted: participation.stepsCompleted,
    totalSteps: participation.totalSteps,
    safeEvidenceRefs: participation.safeEvidenceRefs,
    joinedAt: participation.joinedAt,
    completedAt: participation.completedAt,
    updatedAt: participation.updatedAt,
  };
}

export function dedupeChallengeParticipation(
  participations: Phase3HealthyChallengeParticipation[],
): Phase3HealthyChallengeParticipation[] {
  const seen = new Map<string, Phase3HealthyChallengeParticipation>();
  for (const p of participations) {
    if (!seen.has(p.participationId)) {
      seen.set(p.participationId, p);
    }
  }
  return Array.from(seen.values());
}

export function rankChallengeParticipation(
  participations: Phase3HealthyChallengeParticipation[],
): Phase3HealthyChallengeParticipation[] {
  return participations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
