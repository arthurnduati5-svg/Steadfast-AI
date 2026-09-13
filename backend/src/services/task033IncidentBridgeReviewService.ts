import type { Task033IncidentReviewItem, Task033IncidentSignal } from '../contracts/task033CanaryObservationContracts';

export interface IncidentSignalInput {
  signal: Task033IncidentSignal;
  detectedAt?: string;
  safeSummary: string;
  pauseRecommended?: boolean;
  killSwitchRecommended?: boolean;
  rollbackRecommended?: boolean;
  adminReviewRequired?: boolean;
  safeguardingEscalationRequired?: boolean;
  privacyEscalationRequired?: boolean;
  deenReviewRequired?: boolean;
}

const FORBIDDEN_INCIDENT_PATTERNS = [
  /raw student chat/i,
  /private learner memory/i,
  /teacher-only notes/i,
  /safeguarding raw details/i,
  /Deen-sensitive private text/i,
  /AI prompt/i,
  /provider response/i,
  /answer key/i,
  /teacher-only content/i,
  /protected rubric/i,
];

export interface IncidentBridgeOutput {
  signals: Task033IncidentReviewItem[];
  safeSummaries: string[];
  pauseRecommended: boolean;
  killSwitchRecommended: boolean;
  rollbackRecommended: boolean;
  adminReviewRequired: boolean;
  safeguardingEscalationRequired: boolean;
  privacyEscalationRequired: boolean;
  deenReviewRequired: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export function reviewTask033Incidents(inputs: IncidentSignalInput[]): IncidentBridgeOutput {
  const blockingIssues: string[] = [];
  const items: Task033IncidentReviewItem[] = [];

  for (const input of inputs) {
    const rawText = input.safeSummary.toLowerCase();
    let hasForbidden = false;
    for (const pattern of FORBIDDEN_INCIDENT_PATTERNS) {
      if (pattern.test(rawText)) {
        blockingIssues.push(`forbidden_content_in_incident_summary: ${pattern}`);
        hasForbidden = true;
      }
    }

    if (!hasForbidden) {
      items.push({
        signal: input.signal,
        detectedAt: input.detectedAt || new Date().toISOString(),
        safeSummary: input.safeSummary,
        pauseRecommended: input.pauseRecommended ?? false,
        killSwitchRecommended: input.killSwitchRecommended ?? false,
        rollbackRecommended: input.rollbackRecommended ?? false,
        adminReviewRequired: input.adminReviewRequired ?? false,
        safeguardingEscalationRequired: input.safeguardingEscalationRequired ?? false,
        privacyEscalationRequired: input.privacyEscalationRequired ?? false,
        deenReviewRequired: input.deenReviewRequired ?? false,
      });
    }
  }

  return {
    signals: items,
    safeSummaries: items.map(i => i.safeSummary),
    pauseRecommended: items.some(i => i.pauseRecommended),
    killSwitchRecommended: items.some(i => i.killSwitchRecommended),
    rollbackRecommended: items.some(i => i.rollbackRecommended),
    adminReviewRequired: items.some(i => i.adminReviewRequired),
    safeguardingEscalationRequired: items.some(i => i.safeguardingEscalationRequired),
    privacyEscalationRequired: items.some(i => i.privacyEscalationRequired),
    deenReviewRequired: items.some(i => i.deenReviewRequired),
    rawPrivateDataExposed: blockingIssues.length > 0,
    blockingIssues,
  };
}
