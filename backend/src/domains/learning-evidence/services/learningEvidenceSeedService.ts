import type { LearningEvidenceEventStoreRepository } from '../repositories/learningEvidenceEventStoreRepository';
import { LearningEvidencePrivacyGuard } from './learningEvidencePrivacyGuard';
import { LearningEvidenceCommandService } from './learningEvidenceCommandService';
import type { CreateEvidenceCandidateCommand, StartEvidenceValidationCommand, MarkEvidenceUsableCommand, CommitLearningEvidenceCommand, SupersedeLearningEvidenceCommand, RetainLearningEvidenceCommand, RequireEvidenceReviewCommand, CreateEvidenceCandidateResult } from '../contracts/learningEvidenceCommandContracts';
import type { EvidenceOutcome, EvidenceIndependence, EvidenceMode, ConfidenceState, IntegrityState, FinalizationState, EvidenceSourceType } from '../contracts/learningEvidenceEventStoreContracts';

function makeActor(schoolId: string, actorId: string, actorRole: string, learnerId: string) {
  return {
    schoolId,
    actorId,
    actorRole,
    learnerId,
    requestId: `seed-${Date.now()}`,
    correlationId: `seed-${Date.now()}`,
  };
}

export class LearningEvidenceSeedService {
  constructor(
    private commandService: LearningEvidenceCommandService,
    private repo: LearningEvidenceEventStoreRepository,
  ) {}

  async seedAll(schoolId: string, learnerId: string): Promise<{ results: Array<{ label: string; success: boolean }> }> {
    const results: Array<{ label: string; success: boolean }> = [];
    const actorId = `seed-actor-${schoolId}`;
    let scenarioIndex = 0;

    const run = async (label: string, fn: (lid: string) => Promise<void>) => {
      const lid = `${learnerId}-s${scenarioIndex++}`;
      try {
        await fn(lid);
        results.push({ label, success: true });
      } catch (err) {
        results.push({ label, success: false });
      }
    };

    await run('1. Independent correct recall', async (lid) => {
      await this.createAndValidateCandidate(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'independent',
        evidenceMode: 'recall',
        confidenceState: 'high',
        integrityState: 'clear',
        finalizationState: 'final',
        sourceType: 'practice_attempt',
      });
    });

    await run('2. Correct after heavy hints', async (lid) => {
      await this.createAndValidateCandidate(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'heavily_supported',
        evidenceMode: 'procedure',
        confidenceState: 'medium',
        integrityState: 'clear',
        finalizationState: 'final',
        sourceType: 'practice_attempt',
      });
    });

    await run('3. Partial with misconception', async (lid) => {
      await this.createCandidateOnly(schoolId, lid, actorId, 'teacher', {
        outcome: 'partially_correct',
        independence: 'light_hint',
        evidenceMode: 'application',
        confidenceState: 'low',
        integrityState: 'clear',
        finalizationState: 'provisional',
        sourceType: 'practice_attempt',
        misconceptionTags: ['procedure_gap'],
      });
    });

    await run('4. Skipped objective check', async (lid) => {
      await this.createCandidateOnly(schoolId, lid, actorId, 'teacher', {
        outcome: 'skipped',
        independence: 'unknown',
        evidenceMode: 'recall',
        confidenceState: 'unknown',
        integrityState: 'clear',
        finalizationState: 'not_applicable',
        sourceType: 'daily_objective_check',
      });
    });

    await run('5. Teach-back strong', async (lid) => {
      await this.commitFullFlow(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'independent',
        evidenceMode: 'teach_back',
        confidenceState: 'high',
        integrityState: 'clear',
        finalizationState: 'final',
        sourceType: 'teach_back',
      });
    });

    await run('6. Reflection insufficient', async (lid) => {
      await this.createCandidateOnly(schoolId, lid, actorId, 'teacher', {
        outcome: 'incomplete',
        independence: 'guided',
        evidenceMode: 'reflection',
        confidenceState: 'low',
        integrityState: 'clear',
        finalizationState: 'provisional',
        sourceType: 'reflection',
      });
    });

    await run('7. Provisional assessment result', async (lid) => {
      await this.createCandidateOnly(schoolId, lid, actorId, 'teacher', {
        outcome: 'unscored',
        independence: 'independent',
        evidenceMode: 'application',
        confidenceState: 'medium',
        integrityState: 'clear',
        finalizationState: 'provisional',
        sourceType: 'assessment_result',
      });
    });

    await run('8. Final assessment result', async (lid) => {
      await this.commitFullFlow(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'independent',
        evidenceMode: 'application',
        confidenceState: 'high',
        integrityState: 'clear',
        finalizationState: 'final',
        sourceType: 'assessment_result',
      });
    });

    await run('9. Integrity review required', async (lid) => {
      const cid = await this.createCandidate(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'independent',
        evidenceMode: 'recall',
        confidenceState: 'high',
        integrityState: 'review_required',
        finalizationState: 'provisional',
        sourceType: 'practice_attempt',
      });
      const startCmd: StartEvidenceValidationCommand = {
        commandType: 'StartEvidenceValidation',
        commandId: `seed-${Date.now()}`,
        actor: makeActor(schoolId, actorId, 'teacher', lid),
        learnerId: lid,
        evidenceCandidateId: cid,
        expectedStreamSequence: 1,
        idempotencyKey: `seed-review-${cid}`,
        requestHash: 'seed',
        reasonCodes: ['integrity_check'],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: `seed-${Date.now()}`,
      };
      await this.commandService.execute(startCmd);
      const reviewCmd: RequireEvidenceReviewCommand = {
        commandType: 'RequireEvidenceReview',
        commandId: `seed-${Date.now()}`,
        actor: makeActor(schoolId, actorId, 'teacher', lid),
        learnerId: lid,
        evidenceCandidateId: cid,
        expectedStreamSequence: 2,
        idempotencyKey: `seed-review-req-${cid}`,
        requestHash: 'seed',
        reasonCodes: ['integrity_flag'],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: `seed-${Date.now()}`,
      };
      await this.commandService.execute(reviewCmd);
    });

    await run('10. Teacher observation', async (lid) => {
      await this.commitFullFlow(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct',
        independence: 'teacher_assisted',
        evidenceMode: 'observation',
        confidenceState: 'high',
        integrityState: 'clear',
        finalizationState: 'final',
        sourceType: 'teacher_observation',
      });
    });

    await run('11. Cross-school (different school context)', async (lid) => {
      await this.commandService.execute({
        commandType: 'CreateEvidenceCandidate',
        commandId: `seed-${Date.now()}`,
        actor: makeActor('other-school', actorId, 'student', lid),
        learnerId: lid,
        expectedStreamSequence: 0,
        idempotencyKey: `seed-cross-${Date.now()}`,
        requestHash: 'seed',
        reasonCodes: [],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: `seed-${Date.now()}`,
        sourceLineage: {
          sourceType: 'practice_attempt', sourceRecordId: 'cross-school-test', sourceVersion: '1.0',
          schoolId: 'other-school', learnerId: lid, occurredAt: new Date().toISOString(),
          outcome: 'correct', integrityState: 'clear', finalizationState: 'final', policyVersion: '1.0',
        },
        safePayload: {
          outcome: 'correct', independence: 'independent', evidenceMode: 'recall',
          confidenceState: 'high', integrityState: 'clear', finalizationState: 'final',
          sourceVersion: '1.0', eligibilityReasonCodes: [],
        },
      });
    });

    await run('12. Duplicate idempotent command', async (lid) => {
      const createCmd: CreateEvidenceCandidateCommand = {
        commandType: 'CreateEvidenceCandidate',
        commandId: `seed-${Date.now()}`,
        actor: makeActor(schoolId, actorId, 'teacher', lid),
        learnerId: lid,
        expectedStreamSequence: 0,
        idempotencyKey: `seed-dup-test-${lid}`,
        requestHash: 'seed-dup-hash',
        reasonCodes: [],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: `seed-${Date.now()}`,
        sourceLineage: {
          sourceType: 'practice_attempt', sourceRecordId: 'dup-test', sourceVersion: '1.0',
          schoolId, learnerId: lid, occurredAt: new Date().toISOString(),
          outcome: 'correct', integrityState: 'clear', finalizationState: 'final', policyVersion: '1.0',
        },
        safePayload: {
          outcome: 'correct', independence: 'independent', evidenceMode: 'recall',
          confidenceState: 'high', integrityState: 'clear', finalizationState: 'final',
          sourceVersion: '1.0', eligibilityReasonCodes: [],
        },
      };
      const first = await this.commandService.execute(createCmd);
      if (!first.success) throw new Error('First create failed');
      const second = await this.commandService.execute({ ...createCmd, commandId: `seed-dup-${Date.now()}` });
      if (!second.success) throw new Error('Second (idempotent) create failed');
    });

    await run('13. Superseded evidence', async (lid) => {
      const cid = await this.commitFullFlow(schoolId, lid, actorId, 'teacher', {
        outcome: 'correct', independence: 'independent', evidenceMode: 'recall',
        confidenceState: 'high', integrityState: 'clear', finalizationState: 'final',
        sourceType: 'practice_attempt',
      });
      const events = await this.repo.getEventsForLearner(schoolId, lid);
      const commitEvent = events.find(e => e.eventType === 'EVIDENCE_COMMITTED' && e.evidenceCandidateId === cid);
      if (!commitEvent?.committedEvidenceId) throw new Error('No committed evidence found');
      const committedProjection = await this.repo.getCommittedProjection(schoolId, commitEvent.committedEvidenceId);
      if (!committedProjection) throw new Error('No committed projection found');

      const newLid = `${lid}-replacement`;
      const newCid = await this.commitFullFlow(schoolId, newLid, actorId, 'teacher', {
        outcome: 'correct', independence: 'independent', evidenceMode: 'recall',
        confidenceState: 'high', integrityState: 'clear', finalizationState: 'final',
        sourceType: 'practice_attempt',
      });
      const cmd: SupersedeLearningEvidenceCommand = {
        commandType: 'SupersedeLearningEvidence',
        commandId: `seed-${Date.now()}`,
        actor: makeActor(schoolId, actorId, 'school_admin', lid),
        learnerId: lid,
        committedEvidenceId: committedProjection.committedEvidenceId,
        replacementEvidenceCandidateId: newCid,
        expectedStreamSequence: committedProjection.latestSequence,
        idempotencyKey: `seed-supersede-${Date.now()}`,
        requestHash: 'seed',
        reasonCodes: ['evidence_replaced'],
        policyVersion: '1.0',
        occurredAt: new Date().toISOString(),
        correlationId: `seed-${Date.now()}`,
      };
      await this.commandService.execute(cmd);
    });

    return { results };
  }

  private async createCandidate(
    schoolId: string,
    learnerId: string,
    actorId: string,
    actorRole: string,
    opts: {
      outcome: EvidenceOutcome;
      independence: EvidenceIndependence;
      evidenceMode: EvidenceMode;
      confidenceState: ConfidenceState;
      integrityState: IntegrityState;
      finalizationState: FinalizationState;
      sourceType: EvidenceSourceType;
      misconceptionTags?: string[];
    },
  ): Promise<string> {
    const cmd: CreateEvidenceCandidateCommand = {
      commandType: 'CreateEvidenceCandidate',
      commandId: `seed-${Date.now()}`,
      actor: makeActor(schoolId, actorId, actorRole, learnerId),
      learnerId,
      expectedStreamSequence: 0,
      idempotencyKey: `seed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requestHash: 'seed',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: `seed-${Date.now()}`,
      sourceLineage: {
        sourceType: opts.sourceType,
        sourceRecordId: `seed-${Date.now()}`,
        sourceVersion: '1.0',
        schoolId,
        learnerId,
        occurredAt: new Date().toISOString(),
        outcome: opts.outcome,
        integrityState: opts.integrityState,
        finalizationState: opts.finalizationState,
        policyVersion: '1.0',
      },
      safePayload: {
        outcome: opts.outcome,
        independence: opts.independence,
        evidenceMode: opts.evidenceMode,
        confidenceState: opts.confidenceState,
        integrityState: opts.integrityState,
        finalizationState: opts.finalizationState,
        sourceVersion: '1.0',
        eligibilityReasonCodes: [],
        misconceptionTags: opts.misconceptionTags,
      },
    };
    const result = await this.commandService.execute(cmd);
    if (!result.success || !result.data) throw new Error(`Seed create failed: ${JSON.stringify(result.error)}`);
    return (result.data as CreateEvidenceCandidateResult).evidenceCandidateId;
  }

  private async createCandidateOnly(
    schoolId: string,
    learnerId: string,
    actorId: string,
    actorRole: string,
    opts: {
      outcome: EvidenceOutcome;
      independence: EvidenceIndependence;
      evidenceMode: EvidenceMode;
      confidenceState: ConfidenceState;
      integrityState: IntegrityState;
      finalizationState: FinalizationState;
      sourceType: EvidenceSourceType;
      misconceptionTags?: string[];
    },
  ): Promise<string> {
    return this.createCandidate(schoolId, learnerId, actorId, actorRole, opts);
  }

  private async createAndValidateCandidate(
    schoolId: string,
    learnerId: string,
    actorId: string,
    actorRole: string,
    opts: {
      outcome: EvidenceOutcome;
      independence: EvidenceIndependence;
      evidenceMode: EvidenceMode;
      confidenceState: ConfidenceState;
      integrityState: IntegrityState;
      finalizationState: FinalizationState;
      sourceType: EvidenceSourceType;
    },
  ): Promise<string> {
    const cid = await this.createCandidate(schoolId, learnerId, actorId, actorRole, opts);
    const validateCmd: StartEvidenceValidationCommand = {
      commandType: 'StartEvidenceValidation',
      commandId: `seed-${Date.now()}`,
      actor: makeActor(schoolId, actorId, actorRole, learnerId),
      learnerId,
      evidenceCandidateId: cid,
      expectedStreamSequence: 1,
      idempotencyKey: `seed-val-${cid}`,
      requestHash: 'seed',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: `seed-${Date.now()}`,
    };
    await this.commandService.execute(validateCmd);
    return cid;
  }

  private async commitFullFlow(
    schoolId: string,
    learnerId: string,
    actorId: string,
    actorRole: string,
    opts: {
      outcome: EvidenceOutcome;
      independence: EvidenceIndependence;
      evidenceMode: EvidenceMode;
      confidenceState: ConfidenceState;
      integrityState: IntegrityState;
      finalizationState: FinalizationState;
      sourceType: EvidenceSourceType;
    },
  ): Promise<string> {
    let cid = await this.createCandidate(schoolId, learnerId, actorId, actorRole, opts);
    const validateCmd: StartEvidenceValidationCommand = {
      commandType: 'StartEvidenceValidation',
      commandId: `seed-${Date.now()}`,
      actor: makeActor(schoolId, actorId, actorRole, learnerId),
      learnerId,
      evidenceCandidateId: cid,
      expectedStreamSequence: 1,
      idempotencyKey: `seed-val-${cid}`,
      requestHash: 'seed',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: `seed-${Date.now()}`,
    };
    let result = await this.commandService.execute(validateCmd);
    const usableCmd: MarkEvidenceUsableCommand = {
      commandType: 'MarkEvidenceUsable',
      commandId: `seed-${Date.now()}`,
      actor: makeActor(schoolId, actorId, actorRole, learnerId),
      learnerId,
      evidenceCandidateId: cid,
      expectedStreamSequence: 2,
      idempotencyKey: `seed-usable-${cid}`,
      requestHash: 'seed',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: `seed-${Date.now()}`,
    };
    result = await this.commandService.execute(usableCmd);
    if (result.error) {
      throw new Error(`usable failed: ${JSON.stringify(result.error)}`);
    }
    const commitCmd: CommitLearningEvidenceCommand = {
      commandType: 'CommitLearningEvidence',
      commandId: `seed-${Date.now()}`,
      actor: makeActor(schoolId, actorId, actorRole, learnerId),
      learnerId,
      evidenceCandidateId: cid,
      expectedStreamSequence: 3,
      idempotencyKey: `seed-commit-${cid}`,
      requestHash: 'seed',
      reasonCodes: [],
      policyVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId: `seed-${Date.now()}`,
    };
    result = await this.commandService.execute(commitCmd);
    if (result.error) {
      throw new Error(`commit failed: ${JSON.stringify(result.error)}`);
    }
    return cid;
  }
}
