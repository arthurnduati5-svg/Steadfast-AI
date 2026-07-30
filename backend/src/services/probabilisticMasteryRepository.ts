import type { MasteryState, MasteryChangeLog, MasteryTarget } from './probabilisticMasteryContracts';

export interface MasteryRepository {
  saveState(state: MasteryState): void;
  readState(target: MasteryTarget): MasteryState | null;
  listStates(schoolId: string, learnerId: string): MasteryState[];
  saveChangeLog(log: MasteryChangeLog): void;
  listChangeLogs(schoolId: string, learnerId: string, targetNodeId: string): MasteryChangeLog[];
  hasEvidenceBeenApplied(evidenceId: string): boolean;
  recordEvidenceApplication(evidenceId: string, target: MasteryTarget): void;
  resetForTest(): void;
}

export class InMemoryMasteryRepository implements MasteryRepository {
  private states = new Map<string, MasteryState>();
  private changeLogs: MasteryChangeLog[] = [];
  private appliedEvidence = new Set<string>();

  private stateKey(target: MasteryTarget): string {
    return `${target.schoolId}:${target.learnerId}:${target.targetNodeId}:${target.curriculumVersionId}`;
  }

  saveState(state: MasteryState): void {
    this.states.set(this.stateKey(state), { ...state });
  }

  readState(target: MasteryTarget): MasteryState | null {
    const s = this.states.get(this.stateKey(target));
    return s ? { ...s } : null;
  }

  listStates(schoolId: string, learnerId: string): MasteryState[] {
    const prefix = `${schoolId}:${learnerId}:`;
    const result: MasteryState[] = [];
    for (const [key, state] of this.states) {
      if (key.startsWith(prefix)) {
        result.push({ ...state });
      }
    }
    return result;
  }

  saveChangeLog(log: MasteryChangeLog): void {
    this.changeLogs.push({ ...log, previousState: log.previousState ? { ...log.previousState } : null, newState: { ...log.newState } });
  }

  listChangeLogs(schoolId: string, learnerId: string, targetNodeId: string): MasteryChangeLog[] {
    return this.changeLogs.filter(
      l => l.schoolId === schoolId && l.learnerId === learnerId && l.targetNodeId === targetNodeId,
    ).map(l => ({
      ...l,
      previousState: l.previousState ? { ...l.previousState } : null,
      newState: { ...l.newState },
    }));
  }

  hasEvidenceBeenApplied(evidenceId: string): boolean {
    return this.appliedEvidence.has(evidenceId);
  }

  recordEvidenceApplication(evidenceId: string, _target: MasteryTarget): void {
    this.appliedEvidence.add(evidenceId);
  }

  resetForTest(): void {
    this.states.clear();
    this.changeLogs = [];
    this.appliedEvidence.clear();
  }
}
