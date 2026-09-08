// R7.3 — real-process driver around existing production Mastery services.
// Not a fake implementation: every action calls the actual production function
// (practice / revision / daily-objective / canonical read) against the real
// Prisma-backed canonicalMasteryRepository. One action per OS process.
process.env.DATABASE_URL = process.env.R73_DATABASE_URL as string;
process.env.DIRECT_URL = process.env.R73_DATABASE_URL as string;
process.env.NODE_ENV = 'test';
process.env.R4_USE_PRISMA = 'true';

type Args = Record<string, string>;

function parseArgs(pairs: string[]): Args {
  const out: Args = {};
  for (const p of pairs) {
    const eq = p.indexOf('=');
    if (eq > 0) out[p.slice(0, eq)] = p.slice(eq + 1);
  }
  return out;
}

function emit(obj: unknown): void {
  process.stdout.write(`R73_RESULT:${JSON.stringify(obj)}\n`);
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function disconnect(): Promise<void> {
  try {
    const mod = await import('./lib/prisma');
    await mod.default.$disconnect();
  } catch {
    // best effort
  }
}

async function main(): Promise<void> {
  const [action, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  const pid = process.pid;
  try {
    if (action === 'practice') {
      const { applyPracticeEvidenceToCanonicalMastery } = await import(
        './services/practiceMasteryCanonicalApply'
      );
      const res = await applyPracticeEvidenceToCanonicalMastery({
        schoolId: a.schoolId,
        learnerId: a.learnerId,
        committedEvidenceId: a.committedEvidenceId,
        targetNodeId: a.targetNodeId,
        targetNodeType: (a.targetNodeType as 'skill' | 'learning_objective') ?? 'skill',
        curriculumVersionId: a.curriculumVersionId,
        outcome: 1,
        usable: true,
        markingConfidence: 0.9,
        integrityRisk: 0.1,
        independence: 0.9,
        hintDependency: 0.1,
        sourceType: 'practice_attempt',
      });
      emit({ pid, action, ok: true, applied: res.applied, evidenceId: a.committedEvidenceId });
    } else if (action === 'revision') {
      const { applyRevisionEvidenceToCanonicalMastery } = await import(
        './services/revisionCanonicalLearningService'
      );
      const res = await applyRevisionEvidenceToCanonicalMastery({
        schoolId: a.schoolId,
        learnerId: a.learnerId,
        committedEvidenceId: a.committedEvidenceId,
        targetNodeId: a.targetNodeId,
        targetNodeType: (a.targetNodeType as 'skill' | 'learning_objective') ?? 'skill',
        curriculumVersionId: a.curriculumVersionId,
        outcome: 1,
        usable: true,
        markingConfidence: 0.9,
        integrityRisk: 0.1,
        independence: 0.9,
        hintDependency: 0.1,
        sourceType: 'revision_recall',
      });
      emit({ pid, action, ok: true, applied: res.applied, evidenceId: a.committedEvidenceId });
    } else if (action === 'daily') {
      const { phase3ObjectiveMasteryService } = await import(
        './services/phase3ObjectiveMasteryService'
      );
      const res = await phase3ObjectiveMasteryService.updateObjectiveMasteryFromEvidence({
        objectiveId: a.objectiveId,
        schoolId: a.schoolId,
        learnerId: a.learnerId,
        topicId: a.topicId,
        evidenceStrength: 'strong',
        hintUsed: false,
        reasonCodes: ['strong_recent_evidence'],
        evidenceId: a.evidenceId,
      });
      emit({
        pid,
        action,
        ok: true,
        applied: res.changed,
        changed: res.changed,
        evidenceId: a.evidenceId,
        newStatus: res.newStatus,
      });
    } else if (action === 'read') {
      const { canonicalMasteryRepository } = await import(
        './services/probabilisticMasteryRepository'
      );
      const state = await canonicalMasteryRepository.readState({
        schoolId: a.schoolId,
        learnerId: a.learnerId,
        targetNodeId: a.targetNodeId,
        targetNodeType: a.targetNodeType as 'skill' | 'learning_objective',
        curriculumVersionId: a.curriculumVersionId,
      });
      emit({
        pid,
        action,
        ok: true,
        exists: state !== null,
        stateRevision: state?.stateRevision ?? null,
        evidenceCount: state?.evidenceCount ?? null,
        probabilityOfMastery: state?.probabilityOfMastery ?? null,
        visibleLabel: state?.visibleLabel ?? null,
        schoolId: a.schoolId,
        learnerId: a.learnerId,
        targetNodeId: a.targetNodeId,
        targetNodeType: a.targetNodeType,
        curriculumVersionId: a.curriculumVersionId,
      });
    } else {
      emit({ pid, action: action ?? null, ok: false, error: `unknown action: ${action}` });
      process.exitCode = 2;
    }
  } catch (e) {
    const msg = errMessage(e);
    // Expected safe domain rejections under concurrency: the contender did not
    // mutate, the process exits normally, and the outcome is machine-readable.
    const safeDuplicate = msg.includes('evidence already applied');
    const safeConflict = msg.includes('atomic commit failed');
    if (safeDuplicate || safeConflict) {
      emit({
        pid,
        action: action ?? null,
        ok: true,
        applied: false,
        idempotent: safeDuplicate,
        conflict: safeConflict,
        error: msg,
        evidenceId: a.committedEvidenceId ?? a.evidenceId ?? null,
      });
    } else {
      emit({ pid, action: action ?? null, ok: false, applied: false, error: msg });
    }
  } finally {
    await disconnect();
  }
}

void main();
