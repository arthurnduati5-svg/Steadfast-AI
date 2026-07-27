// Curriculum Knowledge Graph — Version Lifecycle Service

import type { CurriculumGraphVersionStatus, CurriculumGraphError } from '../contracts/CurriculumGraphContracts';
import { CurriculumGraphErrorCodes } from '../contracts/CurriculumGraphContracts';

const validTransitions: Record<CurriculumGraphVersionStatus, CurriculumGraphVersionStatus[]> = {
  draft: ['under_review'],
  under_review: ['draft', 'approved'],
  approved: ['active', 'archived'],
  active: ['superseded'],
  superseded: ['archived'],
  archived: [],
};

export class CurriculumGraphVersionLifecycleService {
  canTransition(from: CurriculumGraphVersionStatus, to: CurriculumGraphVersionStatus): boolean {
    return validTransitions[from]?.includes(to) ?? false;
  }

  enforceTransition(
    from: CurriculumGraphVersionStatus,
    to: CurriculumGraphVersionStatus,
    requestId: string,
    correlationId: string,
  ): CurriculumGraphError | null {
    if (!this.canTransition(from, to)) {
      return {
        code: CurriculumGraphErrorCodes.INVALID_LIFECYCLE_TRANSITION,
        studentSafeMessage: 'This version status cannot be changed in the requested way.',
        internalMessage: `Cannot transition from ${from} to ${to}.`,
        requestId,
        correlationId,
        retryable: false,
        reasonCodes: ['invalid_lifecycle_transition', `from_${from}`, `to_${to}`],
      };
    }
    return null;
  }

  isEditable(status: CurriculumGraphVersionStatus): boolean {
    return status === 'draft';
  }

  isImmutable(status: CurriculumGraphVersionStatus): boolean {
    return !this.isEditable(status);
  }
}
