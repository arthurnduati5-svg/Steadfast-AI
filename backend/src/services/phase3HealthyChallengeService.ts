import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3HealthyChallenge,
  Phase3HealthyChallengeType,
  Phase3HealthyChallengeStatus,
} from '../contracts/phase3PeerLearningContracts';

export function createHealthyChallenge(input: {
  schoolId: string;
  groupId?: string;
  teacherId?: string;
  classId?: string;
  challengeType: Phase3HealthyChallengeType;
  safeTitle: string;
  safeSummary: string;
  safeInstructions: string;
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  expiresAt?: string;
}): Phase3HealthyChallenge {
  return repo.upsertHealthyChallenge({
    ...input,
    challengeStatus: 'active',
  });
}

export function getHealthyChallenge(challengeId: string): Phase3HealthyChallenge | null {
  return repo.getHealthyChallenge(challengeId);
}

export function listHealthyChallengesForLearner(
  schoolId: string,
  studentId: string,
  groupId?: string,
): Phase3HealthyChallenge[] {
  if (groupId) {
    const challenges = repo.listHealthyChallengesForGroup(groupId);
    return challenges.filter(c => c.challengeStatus === 'active' || c.challengeStatus === 'paused');
  }
  return repo.listHealthyChallengesForSchool(schoolId).filter(
    c => c.challengeStatus === 'active' || c.challengeStatus === 'paused'
  );
}

export function listHealthyChallengesForTeacher(
  schoolId: string,
  teacherId: string,
  groupId?: string,
): Phase3HealthyChallenge[] {
  if (groupId) {
    return repo.listHealthyChallengesForGroup(groupId);
  }
  return repo.listHealthyChallengesForSchool(schoolId);
}

export function pauseHealthyChallenge(
  schoolId: string,
  challengeId: string,
): Phase3HealthyChallenge | null {
  const challenge = repo.getHealthyChallenge(challengeId);
  if (!challenge || challenge.schoolId !== schoolId) return null;
  return repo.upsertHealthyChallenge({
    ...challenge,
    challengeStatus: 'paused',
  });
}

export function completeHealthyChallenge(
  schoolId: string,
  challengeId: string,
): Phase3HealthyChallenge | null {
  const challenge = repo.getHealthyChallenge(challengeId);
  if (!challenge || challenge.schoolId !== schoolId) return null;
  return repo.upsertHealthyChallenge({
    ...challenge,
    challengeStatus: 'completed',
    completedAt: new Date().toISOString(),
  });
}

export function archiveHealthyChallenge(
  schoolId: string,
  challengeId: string,
): Phase3HealthyChallenge | null {
  const challenge = repo.getHealthyChallenge(challengeId);
  if (!challenge || challenge.schoolId !== schoolId) return null;
  return repo.upsertHealthyChallenge({
    ...challenge,
    challengeStatus: 'archived',
  });
}

export function buildHealthyChallengeSafeView(challenge: Phase3HealthyChallenge): any {
  return {
    challengeId: challenge.challengeId,
    schoolId: challenge.schoolId,
    groupId: challenge.groupId,
    teacherId: challenge.teacherId,
    classId: challenge.classId,
    challengeType: challenge.challengeType,
    challengeStatus: challenge.challengeStatus,
    safeTitle: challenge.safeTitle,
    safeSummary: challenge.safeSummary,
    safeInstructions: challenge.safeInstructions,
    safeEvidenceRefs: challenge.safeEvidenceRefs,
    sourceTruthStatus: challenge.sourceTruthStatus,
    createdAt: challenge.createdAt,
    updatedAt: challenge.updatedAt,
    expiresAt: challenge.expiresAt,
    completedAt: challenge.completedAt,
  };
}

export function dedupeHealthyChallenges(challenges: Phase3HealthyChallenge[]): Phase3HealthyChallenge[] {
  const seen = new Map<string, Phase3HealthyChallenge>();
  for (const c of challenges) {
    if (!seen.has(c.challengeId)) {
      seen.set(c.challengeId, c);
    }
  }
  return Array.from(seen.values());
}

export function rankHealthyChallenges(challenges: Phase3HealthyChallenge[]): Phase3HealthyChallenge[] {
  return challenges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
