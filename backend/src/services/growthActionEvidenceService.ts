import type {
  GrowthLearnerEvidenceSnapshot,
  WeakTopicSignal,
  MistakeSignal,
  MasterySignal,
  SupportSignal,
  RevisionSignal,
  ModeSummarySignal,
  ContentAvailability,
  DeenSensitivity,
} from '../contracts/growthActionContracts';

export interface EvidenceCollectionInput {
  studentId: string;
  schoolId: string;
  weakTopicSignals?: WeakTopicSignal[];
  mistakeSignals?: MistakeSignal[];
  masterySignals?: MasterySignal[];
  supportSignals?: SupportSignal[];
  revisionSignals?: RevisionSignal[];
  modeSummarySignals?: ModeSummarySignal[];
  contentAvailability?: ContentAvailability;
  deenSensitivity?: DeenSensitivity;
}

export function collectGrowthActionEvidence(input: EvidenceCollectionInput): GrowthLearnerEvidenceSnapshot {
  const weakTopicSignals = input.weakTopicSignals || [];
  const mistakeSignals = input.mistakeSignals || [];
  const masterySignals = input.masterySignals || [];
  const supportSignals = input.supportSignals || [];
  const revisionSignals = input.revisionSignals || [];
  const modeSummarySignals = input.modeSummarySignals || [];

  const totalSignals =
    weakTopicSignals.length +
    mistakeSignals.length +
    masterySignals.length +
    supportSignals.length +
    revisionSignals.length +
    modeSummarySignals.length;

  let stateQuality: 'no_data_yet' | 'partial' | 'sufficient' | 'rich';
  if (totalSignals === 0) {
    stateQuality = 'no_data_yet';
  } else if (totalSignals <= 2) {
    stateQuality = 'partial';
  } else if (totalSignals <= 5) {
    stateQuality = 'sufficient';
  } else {
    stateQuality = 'rich';
  }

  const safeEvidenceRefs: string[] = [];
  for (const s of revisionSignals) { if (s.itemId) safeEvidenceRefs.push(`revision:${s.itemId}`); }
  for (const s of weakTopicSignals) { if (s.topicId) safeEvidenceRefs.push(`weak-topic:${s.topicId}`); }
  for (const s of mistakeSignals) { if (s.patternKey) safeEvidenceRefs.push(`mistake:${s.patternKey}`); }

  const safeReasonCodes: string[] = [];
  if (stateQuality === 'no_data_yet') safeReasonCodes.push('insufficient_evidence');
  if (revisionSignals.length > 0) safeReasonCodes.push('evidence_fresh');

  const contentAvailability: ContentAvailability = input.contentAvailability || {
    available: false,
    gapDetected: false,
  };

  const deenSensitivity: DeenSensitivity = input.deenSensitivity || {
    detected: false,
    uncertain: false,
  };

  return {
    studentId: input.studentId,
    schoolId: input.schoolId,
    weakTopicSignals,
    mistakeSignals,
    masterySignals,
    supportSignals,
    revisionSignals,
    modeSummarySignals,
    contentAvailability,
    deenSensitivity,
    stateQuality,
    safeEvidenceRefs,
    safeReasonCodes,
  };
}
