import { logger } from '../utils/logger';
import type { SessionAuditRecord } from './studentLearningSessionContracts';

const recordedAudits: SessionAuditRecord[] = [];

export async function recordSessionAudit(audit: SessionAuditRecord): Promise<void> {
  recordedAudits.push(audit);
  logger.info(
    {
      sessionId: audit.sessionId,
      previousMode: audit.previousMode,
      nextMode: audit.nextMode,
      reasonCodes: audit.reasonCodes,
      deenSensitivityHandled: audit.deenSensitivityHandled,
      safeguardingBoundaryApplied: audit.safeguardingBoundaryApplied,
    },
    '[SessionAudit] Session transition recorded',
  );
}

export function getRecordedAudits(): SessionAuditRecord[] {
  return [...recordedAudits];
}

export function clearRecordedAudits(): void {
  recordedAudits.length = 0;
}
