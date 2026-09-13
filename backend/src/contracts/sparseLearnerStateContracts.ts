import type { LearnerDataTruthState } from './learnerDataReliabilityContracts';

export type SparseLearnerState = {
  studentIdHash: string;
  schoolIdHash?: string;
  hasLearnerMemory: boolean;
  hasTutorState: boolean;
  hasMasteryEvidence: boolean;
  hasPracticeAttempts: boolean;
  hasRevisionItems: boolean;
  hasArtifactSignals: boolean;
  hasVideoSignals: boolean;
  hasTeacherSafeSignals: boolean;
  truthState: LearnerDataTruthState;
  safeReason: string;
};
