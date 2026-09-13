import type { DataFreshnessState, FreshnessStatus } from '../contracts/dataFreshnessContracts';
import { getFreshnessThreshold, AGING_FACTOR } from '../contracts/dataFreshnessContracts';
import type { LearnerDataSourceKind } from '../contracts/learnerDataReliabilityContracts';

export function evaluateDataFreshness(input: {
  observedAt?: string | Date | null;
  storedAt?: string | Date | null;
  staleAfterMs?: number;
  now?: string | Date;
  sourceKind?: LearnerDataSourceKind;
}): DataFreshnessState {
  const now = input.now ? new Date(input.now) : new Date();
  const checkedAt = now.toISOString();

  const refDateStr = input.observedAt || input.storedAt;
  if (!refDateStr) {
    return { status: 'unknown', checkedAt };
  }

  let refDate: Date;
  try {
    refDate = new Date(refDateStr);
  } catch {
    return { status: 'unknown', checkedAt };
  }

  if (isNaN(refDate.getTime())) {
    return { status: 'unknown', checkedAt };
  }

  const nowMs = now.getTime();
  const refMs = refDate.getTime();

  if (refMs > nowMs + 1000) {
    return { status: 'unknown', checkedAt, ageMs: 0, staleAfterMs: 0 };
  }

  const ageMs = nowMs - refMs;
  const staleThreshold = input.staleAfterMs ?? (
    input.sourceKind ? getFreshnessThreshold(input.sourceKind) : 7 * 24 * 60 * 60 * 1000
  );

  let status: FreshnessStatus;
  if (ageMs < staleThreshold * AGING_FACTOR) {
    status = 'fresh';
  } else if (ageMs < staleThreshold) {
    status = 'aging';
  } else {
    status = 'stale';
  }

  return {
    status,
    ageMs,
    staleAfterMs: staleThreshold,
    checkedAt,
  };
}

export function chooseMostRecentEvidence<T extends { observedAt?: string; storedAt?: string }>(
  items: T[]
): T | null {
  if (!items || items.length === 0) return null;

  return items.reduce((best, current) => {
    const bestDate = best.observedAt || best.storedAt;
    const currentDate = current.observedAt || current.storedAt;

    if (!currentDate) return best;
    if (!bestDate) return current;

    try {
      return new Date(currentDate).getTime() > new Date(bestDate).getTime() ? current : best;
    } catch {
      return best;
    }
  }, items[0]);
}

export function isStale(freshness: DataFreshnessState): boolean {
  return freshness.status === 'stale';
}

export function isFresh(freshness: DataFreshnessState): boolean {
  return freshness.status === 'fresh';
}
