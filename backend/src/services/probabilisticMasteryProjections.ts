import type {
  MasteryState,
  CognitiveDiagnosis,
  NextBestAction,
  VisibleMasteryLabel,
  ActorRole,
} from './probabilisticMasteryContracts';

export interface StudentSafeMasteryView {
  targetNodeId: string;
  visibleLabel: VisibleMasteryLabel;
  safeProgressMessage: string;
  safePrerequisiteExplanation: string | null;
  safeNextAction: NextBestAction;
  lastUpdatedAt: Date | null;
}

export interface StaffSafeMasteryView {
  targetNodeId: string;
  visibleLabel: VisibleMasteryLabel;
  probabilityOfMastery: number;
  confidence: number;
  evidenceCount: number;
  safeEvidenceReferences: string[];
  diagnosisReasons: string[];
  weakDirectPrerequisiteIds: string[];
  weakTransitivePrerequisiteIds: string[];
  nextAction: NextBestAction;
}

function buildSafeProgressMessage(state: MasteryState): string {
  switch (state.visibleLabel) {
    case 'not_started':
      return 'You haven\'t started this topic yet.';
    case 'introduced':
      return 'You\'ve been introduced to this topic. Keep practicing!';
    case 'attempted':
      return 'You\'ve started working on this topic. Keep going!';
    case 'developing':
      return 'You\'re developing your understanding. You\'re making progress!';
    case 'near_mastery':
      return 'Almost there! A bit more practice and you\'ll have it.';
    case 'mastered':
      return 'Great job! You\'ve mastered this topic.';
    case 'needs_revisit':
      return 'This topic could use a review session.';
    default:
      return 'Keep learning!';
  }
}

export function buildStudentSafeView(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis,
  nextAction: NextBestAction,
): StudentSafeMasteryView {
  const safePrerequisiteExplanation: string | null = diagnosis.weakDirectPrerequisites.length > 0
    ? 'Some foundational topics need more practice before this one.'
    : null;

  return {
    targetNodeId: state.targetNodeId,
    visibleLabel: state.visibleLabel,
    safeProgressMessage: buildSafeProgressMessage(state),
    safePrerequisiteExplanation,
    safeNextAction: {
      action: nextAction.action,
      reasonCodes: nextAction.reasonCodes,
      safeDescription: nextAction.safeDescription,
    },
    lastUpdatedAt: state.updatedAt,
  };
}

export function buildStaffSafeView(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis,
  nextAction: NextBestAction,
): StaffSafeMasteryView {
  return {
    targetNodeId: state.targetNodeId,
    visibleLabel: state.visibleLabel,
    probabilityOfMastery: state.probabilityOfMastery,
    confidence: state.confidence,
    evidenceCount: state.evidenceCount,
    safeEvidenceReferences: diagnosis.contributingEvidenceIds,
    diagnosisReasons: diagnosis.reasonCodes,
    weakDirectPrerequisiteIds: diagnosis.weakDirectPrerequisites,
    weakTransitivePrerequisiteIds: diagnosis.weakTransitivePrerequisites,
    nextAction,
  };
}

export type ProjectionType = 'student' | 'teacher' | 'school_admin' | 'internal_operator';

export function projectState(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis,
  nextAction: NextBestAction,
  role: ActorRole,
): StudentSafeMasteryView | StaffSafeMasteryView | null {
  switch (role) {
    case 'student':
      return buildStudentSafeView(state, diagnosis, nextAction);
    case 'teacher':
    case 'school_admin':
    case 'internal_operator':
      return buildStaffSafeView(state, diagnosis, nextAction);
    case 'parent':
    case 'unknown':
    default:
      return null;
  }
}
