import {
  Task036EvidenceLedger,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function getEvidenceLedger(
  sessionId?: string
): Promise<Task036EvidenceLedger> {
  const ledger = task036Repository.getEvidenceLedger(sessionId);
  return ledger;
}

export function buildEvidenceLedger(sessionId: string): Task036EvidenceLedger {
  return task036Repository.getEvidenceLedger(sessionId);
}
