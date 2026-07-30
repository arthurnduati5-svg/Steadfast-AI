import type { MasteryState, MasteryChangeLog, MasteryTarget } from './probabilisticMasteryContracts';

export interface AtomicUpdate {
  state: MasteryState;
  changeLog: MasteryChangeLog;
  evidenceId: string;
}

export interface MasteryRepository {
  saveState(state: MasteryState): void;
  readState(target: MasteryTarget): MasteryState | null;
  listStates(schoolId: string, learnerId: string): MasteryState[];
  saveChangeLog(log: MasteryChangeLog): void;
  listChangeLogs(schoolId: string, learnerId: string, targetNodeId: string): MasteryChangeLog[];
  hasEvidenceBeenApplied(evidenceId: string): boolean;
  recordEvidenceApplication(evidenceId: string, target: MasteryTarget): void;
  resetForTest(): void;
  applyEvidenceAtomically(update: AtomicUpdate): boolean;
  getAtomicSnapshot(target: MasteryTarget): {
    state: MasteryState | null;
    evidenceSeen: boolean;
  };
}

export class InMemoryMasteryRepository implements MasteryRepository {
  private states = new Map<string, MasteryState>();
  private changeLogs: MasteryChangeLog[] = [];
  private appliedEvidence = new Set<string>();

  private stateKey(target: { schoolId: string; learnerId: string; targetNodeId: string; curriculumVersionId: string }): string {
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

  getAtomicSnapshot(target: MasteryTarget): { state: MasteryState | null; evidenceSeen: boolean } {
    return {
      state: this.readState(target),
      evidenceSeen: this.appliedEvidence.has(target.targetNodeId),
    };
  }

  applyEvidenceAtomically(update: AtomicUpdate): boolean {
    const key = this.stateKey(update.state);
    const priorState = this.states.get(key) ? { ...this.states.get(key)! } : null;
    const priorLogLength = this.changeLogs.length;
    const priorEvidenceSnapshot = new Set(this.appliedEvidence);

    try {
      this.states.set(key, { ...update.state });

      this.changeLogs.push({
        ...update.changeLog,
        previousState: update.changeLog.previousState ? { ...update.changeLog.previousState } : null,
        newState: { ...update.changeLog.newState },
      });

      this.appliedEvidence.add(update.evidenceId);
      return true;
    } catch {
      if (priorState) {
        this.states.set(key, priorState);
      } else {
        this.states.delete(key);
      }
      while (this.changeLogs.length > priorLogLength) {
        this.changeLogs.pop();
      }
      this.appliedEvidence.clear();
      for (const eid of priorEvidenceSnapshot) {
        this.appliedEvidence.add(eid);
      }
      return false;
    }
  }
}
