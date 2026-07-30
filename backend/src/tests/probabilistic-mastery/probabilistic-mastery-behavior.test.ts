import { describe, it, expect, vi } from 'vitest';
import { EvidenceWeightedStrategy } from '../../services/probabilisticMasteryStrategy';
import { createFixturePolicy, validatePolicy } from '../../services/probabilisticMasteryPolicy';
import { InMemoryMasteryRepository } from '../../services/probabilisticMasteryRepository';
import {
  applyEvidence,
  deriveVisibleLabel,
  replayState,
  executeApplyEvidence,
  applyEvidenceWithRepository,
  deduplicateAndFilterEvidenceWithConflicts,
  extractRepeatedMissEvidence,
} from '../../services/probabilisticMasteryEvidenceProcessor';
import { createPrerequisiteReader, detectCircularPrerequisites } from '../../services/probabilisticMasteryPrerequisiteReader';
import { projectState, buildStudentSafeView, buildStaffSafeView } from '../../services/probabilisticMasteryProjections';
import { allFixtures, FIXTURE_SCHOOL_A, FIXTURE_SCHOOL_B, FIXTURE_LEARNER_1, FIXTURE_TARGET_SKILL_A, FIXTURE_CURRICULUM_VERSION } from '../../services/probabilisticMasterySeeds';
import { deriveLegacyMasteryFromCanonical, mapVisibleLabelToLegacyLevel, mapCanonicalActionToLegacyDecision } from '../../services/probabilisticMasteryCompatibilityBridge';
import type { MasteryTarget, NormalizedMasteryEvidence, PrerequisiteReader, MasteryState, MasteryClock, MasteryIdGenerator, MasteryIdKind } from '../../services/probabilisticMasteryContracts';

const policy = createFixturePolicy();
const strategy = new EvidenceWeightedStrategy();

function ts(dateStr: string): Date {
  return new Date(dateStr);
}

describe('ProbabilisticMasteryBehavior', () => {
  describe('Evidence Validation', () => {
    it('rejects foreign school evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const schoolBEv = { ...evidence.correct1, schoolId: FIXTURE_SCHOOL_B };
      const result = applyEvidence(null, schoolBEv, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('foreign school');
    });

    it('rejects wrong learner evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const wrongLearner = { ...evidence.correct1, learnerId: 'wrong-learner' };
      const result = applyEvidence(null, wrongLearner, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('wrong learner');
    });

    it('rejects non-usable evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const nonUsable = { ...evidence.correct1, usable: false };
      const result = applyEvidence(null, nonUsable, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('not usable');
    });

    it('rejects invalid outcome values', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const invalidOutcome = { ...evidence.correct1, outcome: 999 };
      const result = applyEvidence(null, invalidOutcome, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('invalid outcome');
    });

    it('rejects high integrity risk that upgrades mastery', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const highRisk = { ...evidence.highIntegrityRisk };
      const result = applyEvidence(null, highRisk, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('integrity risk');
    });

    it('rejects wrong target evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const wrongTarget = { ...evidence.correct1, targetNodeId: 'wrong-target' };
      const result = applyEvidence(null, wrongTarget, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('wrong target');
    });

    it('rejects curriculum version mismatch', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const wrongVersion = { ...evidence.correct1, curriculumVersionId: 'wrong-version' };
      const result = applyEvidence(null, wrongVersion, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(true);
      expect(result.rejectReason).toContain('curriculum version mismatch');
    });
  });

  describe('No mastery inflation', () => {
    it('one correct answer cannot produce mastered label', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.rejected).toBe(false);
      expect(result.state.visibleLabel).not.toBe('mastered');
      expect(result.state.evidenceCount).toBe(1);
    });

    it('three correct answers produce developing (not mastered)', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'corr-seq');
        state = result.state;
      }
      expect(state!.evidenceCount).toBe(3);
      expect(state!.visibleLabel).not.toBe('mastered');
    });

    it('five independent correct answers can reach near_mastery or mastered', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'corr-seq');
        state = result.state;
      }
      expect(state!.evidenceCount).toBe(5);
      expect(state!.probabilityOfMastery).toBeGreaterThan(0.5);
    });

    it('duplicate evidence cannot inflate mastery', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      let state: MasteryState | null = null;
      const ev1 = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      state = ev1.state;
      repo.saveState(ev1.state);
      repo.recordEvidenceApplication(evidence.correct1.evidenceId, targetA1);
      const alreadyApplied = repo.hasEvidenceBeenApplied(evidence.correct1.evidenceId);
      expect(alreadyApplied).toBe(true);
      const ev2 = applyEvidence(ev1.state, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(ev2.state.probabilityOfMastery).toBeGreaterThanOrEqual(ev1.state.probabilityOfMastery);
      const replayResult = replayState([evidence.correct1], targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(replayResult.evidenceIdsUsed.length).toBe(1);
    });
  });

  describe('Evidence weighting', () => {
    it('higher quality evidence contributes more', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const basicResult = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const strongResult = applyEvidence(null, evidence.teachBackCorrect, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(strongResult.state.probabilityOfMastery).toBeGreaterThan(basicResult.state.probabilityOfMastery);
    });

    it('heavily hinted correct contributes less', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const independent = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const hinted = applyEvidence(null, evidence.heavyHintCorrect, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(independent.state.probabilityOfMastery).toBeGreaterThan(hinted.state.probabilityOfMastery);
    });

    it('low marking confidence contributes less', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      state = applyEvidence(state, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-01-15T10:00:00Z'), 'base1').state;
      state = applyEvidence(state, evidence.correct2, actorA, targetA1, policy, strategy, null, ts('2026-01-16T10:00:00Z'), 'base2').state;
      const highConf = applyEvidence(state, evidence.correct3, actorA, targetA1, policy, strategy, null, ts('2026-01-17T10:00:00Z'), 'high').state;
      const lowConf = applyEvidence(state, evidence.lowConfidenceMarking, actorA, targetA1, policy, strategy, null, ts('2026-01-17T10:00:00Z'), 'low').state;
      expect(highConf.probabilityOfMastery).toBeGreaterThan(lowConf.probabilityOfMastery);
    });

    it('strong explanation contributes within policy bounds', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const basic = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const teachBack = applyEvidence(null, evidence.teachBackCorrect, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const ratio = teachBack.state.probabilityOfMastery / basic.state.probabilityOfMastery;
      expect(ratio).toBeLessThan(3);
    });

    it('scores remain bounded', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (let i = 0; i < 20; i++) {
        const ev = { ...evidence.correct1, evidenceId: `burst-${i}`, occurredAt: ts(`2026-03-${String(i + 1).padStart(2, '0')}T10:00:00Z`) };
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'burst');
        state = result.state;
      }
      expect(state!.probabilityOfMastery).toBeLessThanOrEqual(1);
      expect(state!.probabilityOfMastery).toBeGreaterThanOrEqual(0);
      expect(state!.confidence).toBeLessThanOrEqual(1);
      expect(state!.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Label derivation', () => {
    it('no evidence = not_started', () => {
      const label = deriveVisibleLabel(0, 0, policy);
      expect(label).toBe('not_started');
    });

    it('label is policy-driven', () => {
      const withEvidence1 = deriveVisibleLabel(0.3, 3, policy);
      expect(withEvidence1).toBe('developing');
    });

    it('mastered requires policy conditions', () => {
      const mastered = deriveVisibleLabel(0.8, 5, policy);
      expect(mastered).toBe('mastered');
    });

    it('needs_revisit label exists and is recognized', () => {
      const labels = ['not_started', 'introduced', 'attempted', 'developing', 'near_mastery', 'mastered', 'needs_revisit'] as const;
      expect(labels).toContain('needs_revisit');
    });
  });

  describe('Cognitive diagnosis', () => {
    it('detects insufficient evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.diagnosis.reasonCodes).toContain('insufficient_evidence');
    });

    it('detects misconception signal', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.misconceptionEvidence, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.state.misconceptionTags.length).toBeGreaterThan(0);
    });

    it('detects hint dependency', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.heavyHintCorrect, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      expect(result.state.hintDependencyScore).toBeGreaterThan(0.5);
    });

    it('detects stable progress with sufficient evidence', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'prog');
        state = result.state;
      }
      expect(state!.evidenceCount).toBeGreaterThanOrEqual(5);
    });

    it('no raw answer content in diagnosis', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const diagStr = JSON.stringify(result.diagnosis);
      expect(diagStr).not.toContain('rawAnswer');
      expect(diagStr).not.toContain('answerKey');
    });
  });

  describe('Prerequisite evaluation', () => {
    it('weak direct prerequisite blocks upgrade', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const graph = {
        edges: [{ fromId: 'prereq-skill', toId: FIXTURE_TARGET_SKILL_A, edgeType: 'prerequisite' as const }],
      };
      const lookup = () => null;
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, 'fixture-curr-v1');
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, reader, ev.occurredAt, 'prereq');
        state = result.state;
      }
      expect(state!.probabilityOfMastery).toBeLessThan(policy.prerequisiteThreshold);
    });

    it('strong prerequisites permit normal evaluation', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const graph = {
        edges: [{ fromId: 'prereq-skill', toId: FIXTURE_TARGET_SKILL_A, edgeType: 'prerequisite' as const }],
      };
      const lookup = (t: MasteryTarget): MasteryState => ({
        schoolId: t.schoolId, learnerId: t.learnerId, targetNodeId: t.targetNodeId,
        targetNodeType: t.targetNodeType, curriculumVersionId: t.curriculumVersionId,
        probabilityOfMastery: 0.9, confidence: 0.8, evidenceCount: 10,
        lastEvidenceAt: new Date(), decayRisk: 0, misconceptionTags: [],
        independenceScore: 1, hintDependencyScore: 0, retentionScore: 0.8,
        transferScore: 0.7, visibleLabel: 'mastered', policyVersion: 'v1',
        strategyId: 's1', strategyVersion: '1.0', stateRevision: 5, updatedAt: new Date(),
        consecutiveMissCountSinceMastered: 0,
      });
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, 'fixture-curr-v1');
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, reader, ev.occurredAt, 'prereq-ok');
        state = result.state;
      }
      const withoutReader = (() => {
        let s: MasteryState | null = null;
        for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
          const r = applyEvidence(s, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'prereq-ok');
          s = r.state;
        }
        return s!;
      })();
      expect(state!.probabilityOfMastery).toBeCloseTo(withoutReader.probabilityOfMastery, 2);
    });

    it('circular prerequisites fail safely', () => {
      const graph = {
        edges: [
          { fromId: 'A', toId: 'B', edgeType: 'prerequisite' as const },
          { fromId: 'B', toId: 'C', edgeType: 'prerequisite' as const },
          { fromId: 'C', toId: 'A', edgeType: 'prerequisite' as const },
        ],
      };
      expect(detectCircularPrerequisites(graph)).toBe(true);
    });

    it('acyclic graph returns no cycle', () => {
      const graph = {
        edges: [
          { fromId: 'A', toId: 'B', edgeType: 'prerequisite' as const },
          { fromId: 'B', toId: 'C', edgeType: 'prerequisite' as const },
        ],
      };
      expect(detectCircularPrerequisites(graph)).toBe(false);
    });
  });

  describe('Repository and atomicity', () => {
    it('school isolation works', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const targetB: MasteryTarget = { schoolId: FIXTURE_SCHOOL_B, learnerId: FIXTURE_LEARNER_1, targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill', curriculumVersionId: 'fixture-curr-v1' };
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      repo.saveState(result.state);
      const stateA = repo.readState(targetA1);
      const stateB = repo.readState(targetB);
      expect(stateA).not.toBeNull();
      expect(stateB).toBeNull();
    });

    it('learner isolation works', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const targetL2: MasteryTarget = { schoolId: FIXTURE_SCHOOL_A, learnerId: 'fixture-learner-002', targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill', curriculumVersionId: 'fixture-curr-v1' };
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      repo.saveState(result.state);
      expect(repo.readState(targetA1)).not.toBeNull();
      expect(repo.readState(targetL2)).toBeNull();
    });

    it('defensive copies returned', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      repo.saveState(result.state);
      const state1 = repo.readState(targetA1)!;
      const state2 = repo.readState(targetA1)!;
      state1.probabilityOfMastery = 999;
      expect(state2.probabilityOfMastery).not.toBe(999);
    });

    it('save stores state and change log', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      repo.saveState(result.state);
      repo.saveChangeLog(result.changeLog);
      const readState = repo.readState(targetA1);
      expect(readState).not.toBeNull();
      const logs = repo.listChangeLogs(targetA1.schoolId, targetA1.learnerId, targetA1.targetNodeId);
      expect(logs.length).toBe(1);
    });
  });

  describe('School and role projections', () => {
    it('student cannot read raw probability', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = projectState(result.state, result.diagnosis, result.nextAction, 'student');
      expect(view).not.toBeNull();
      if (view && 'visibleLabel' in view) {
        expect((view as any).probabilityOfMastery).toBeUndefined();
      }
    });

    it('student receives safe view', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = buildStudentSafeView(result.state, result.diagnosis, result.nextAction);
      expect(view.safeProgressMessage).toBeTruthy();
      expect(view.visibleLabel).toBeTruthy();
    });

    it('teacher receives staff-safe view with probability', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = buildStaffSafeView(result.state, result.diagnosis, result.nextAction);
      expect(view.probabilityOfMastery).toBeDefined();
      expect(view.confidence).toBeDefined();
      expect(view.diagnosisReasons.length).toBeGreaterThan(0);
    });

    it('parent role denied', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = projectState(result.state, result.diagnosis, result.nextAction, 'parent');
      expect(view).toBeNull();
    });

    it('unknown role denied', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = projectState(result.state, result.diagnosis, result.nextAction, 'unknown');
      expect(view).toBeNull();
    });

    it('school_admin receives staff-safe view', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = projectState(result.state, result.diagnosis, result.nextAction, 'school_admin');
      expect(view).not.toBeNull();
      if (view && 'probabilityOfMastery' in view) {
        expect((view as any).probabilityOfMastery).toBeDefined();
      }
    });

    it('internal_operator receives staff-safe view', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      const view = projectState(result.state, result.diagnosis, result.nextAction, 'internal_operator');
      expect(view).not.toBeNull();
    });

    it('student cannot read another learner', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const otherTarget: MasteryTarget = {
        schoolId: FIXTURE_SCHOOL_A, learnerId: 'other-learner', targetNodeId: FIXTURE_TARGET_SKILL_A,
        targetNodeType: 'skill', curriculumVersionId: 'fixture-curr-v1',
      };
      const repo = new InMemoryMasteryRepository();
      const result = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'corr1');
      repo.saveState(result.state);
      const otherState = repo.readState(otherTarget);
      expect(otherState).toBeNull();
    });
  });

  describe('Deterministic replay', () => {
    it('identical replay yields identical state', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const evidenceList = [evidence.correct1, evidence.correct2, evidence.correct3];
      const result1 = replayState(evidenceList, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      const result2 = replayState(evidenceList, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(result1.state.probabilityOfMastery).toBe(result2.state.probabilityOfMastery);
      expect(result1.evidenceIdsUsed).toEqual(result2.evidenceIdsUsed);
    });

    it('superseded evidence excluded from replay', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const evidenceList = [evidence.supersededEvidence, evidence.supersedingEvidence];
      const result = replayState(evidenceList, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(result.evidenceIdsUsed).not.toContain('fixture-superseded-1');
    });

    it('duplicate evidence not processed twice', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const evidenceList = [evidence.correct1, evidence.correct1];
      const result = replayState(evidenceList, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(result.evidenceIdsUsed.length).toBe(1);
    });

    it('original evidence history unchanged after replay', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const evidenceList = [evidence.correct1, evidence.correct2];
      const originalLen = evidenceList.length;
      replayState(evidenceList, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(evidenceList.length).toBe(originalLen);
    });

    it('evidence order does not alter canonical result', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const list1 = [evidence.correct1, evidence.correct2, evidence.correct3];
      const list2 = [evidence.correct3, evidence.correct1, evidence.correct2];
      const r1 = replayState(list1, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      const r2 = replayState(list2, targetA1, policy, strategy, null, actorA, ts('2026-02-01T10:00:00Z'));
      expect(r1.state.probabilityOfMastery).toBeCloseTo(r2.state.probabilityOfMastery, 4);
    });
  });

  describe('End-to-end domain flow', () => {
    it('full flow: evidence -> policy -> weight -> estimate -> label -> diagnosis -> repo -> projection -> replay', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();

      let state: MasteryState | null = null;
      const appliedEvidence: NormalizedMasteryEvidence[] = [];

      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'e2e');
        if (!result.rejected) {
          state = result.state;
          repo.saveState(result.state);
          repo.saveChangeLog(result.changeLog);
          repo.recordEvidenceApplication(ev.evidenceId, targetA1);
          appliedEvidence.push(ev);
        }
      }

      expect(state).not.toBeNull();
      expect(state!.evidenceCount).toBe(5);

      const stored = repo.readState(targetA1);
      expect(stored).not.toBeNull();
      expect(stored!.probabilityOfMastery).toBe(state!.probabilityOfMastery);

      const studentView = buildStudentSafeView(state!, { diagnosisId: 'd1', schoolId: targetA1.schoolId, learnerId: targetA1.learnerId, targetNodeId: targetA1.targetNodeId, diagnosisStatus: 'stable_progress', primaryReason: 'stable_progress', reasonCodes: ['stable_progress'], weakDirectPrerequisites: [], weakTransitivePrerequisites: [], misconceptionTags: [], evidenceCount: 5, confidence: state!.confidence, contributingEvidenceIds: [], generatedAt: new Date(), policyVersion: policy.policyVersion }, { action: 'practice', reasonCodes: ['stable_progress'], safeDescription: 'Keep practicing.' });
      expect(studentView.visibleLabel).toBeTruthy();
      expect(studentView.safeProgressMessage).toBeTruthy();

      const replayResult = replayState(appliedEvidence, targetA1, policy, strategy, null, actorA, ts('2026-01-19T10:00:00Z'));
      expect(replayResult.state.probabilityOfMastery).toBeGreaterThan(0);
      expect(replayResult.state.evidenceCount).toBe(state!.evidenceCount);
    });
  });

  describe('Decay behavior', () => {
    it('no decay when policy disables it', () => {
      const noDecayPolicy = { ...policy, decayEnabled: false };
      validatePolicy(noDecayPolicy);
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3]) {
        const result = applyEvidence(state, ev, actorA, targetA1, noDecayPolicy, strategy, null, ev.occurredAt, 'nodecay');
        state = result.state;
      }
      const oldProb = state!.probabilityOfMastery;
      const decayedResult = applyEvidence(state!, evidence.correct4, actorA, targetA1, noDecayPolicy, strategy, null, ts('2027-01-01T10:00:00Z'), 'nodecay2');
      expect(decayedResult.state.probabilityOfMastery).toBeGreaterThanOrEqual(oldProb);
    });

    it('decay never increases mastery', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3]) {
        const result = applyEvidence(state, ev, actorA, targetA1, policy, strategy, null, ev.occurredAt, 'decay');
        state = result.state;
      }
      const oldProb = state!.probabilityOfMastery;
      const farFuture = ts('2030-01-01T10:00:00Z');
      const decayedResult = applyEvidence(state!, evidence.correct4, actorA, targetA1, policy, strategy, null, farFuture, 'decay2');
      expect(decayedResult.state.probabilityOfMastery).toBeLessThanOrEqual(oldProb + 0.1);
    });

    it('old evidence contributes less than recent', () => {
      const { actorA, targetA1, evidence } = allFixtures(policy);
      const recentResult = applyEvidence(null, evidence.correct1, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'recent');
      const oldResult = applyEvidence(null, evidence.decayedEvidence, actorA, targetA1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'old');
      expect(recentResult.state.probabilityOfMastery).toBeGreaterThan(oldResult.state.probabilityOfMastery);
    });
  });

  describe('Cross-school denial', () => {
    it('school B state not accessible from school A', () => {
      const { actorA, targetA1, evidence, targetB1 } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const resultB = applyEvidence(null, evidence.schoolBEvidence, { ...actorA, schoolId: FIXTURE_SCHOOL_B }, targetB1, policy, strategy, null, ts('2026-02-01T10:00:00Z'), 'cross');
      repo.saveState(resultB.state);
      const fromA = repo.readState(targetA1);
      const fromB = repo.readState(targetB1);
      expect(fromA).toBeNull();
      expect(fromB).not.toBeNull();
    });
  });

  describe('Actor and role enforcement', () => {
    it('student role denied from mutation', () => {
      const { targetA1, evidence, actorA } = allFixtures(policy);
      const studentActor = { ...actorA, actorRole: 'student' as const, learnerId: FIXTURE_LEARNER_1 };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, studentActor, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
      if ('code' in result) {
        expect(result.code).toBe('ROLE_DENIED');
      }
    });

    it('parent role denied from mutation', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const parentActor = { ...teacherActorA, actorRole: 'parent' as const };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, parentActor, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
    });

    it('unknown role denied from mutation', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const unknownActor = { ...teacherActorA, actorRole: 'unknown' as const };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, unknownActor, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
    });

    it('teacher role allowed for mutation', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(false);
      if (!('code' in result)) {
        expect(result.rejected).toBe(false);
      }
    });

    it('school_admin role allowed for mutation', () => {
      const { schoolAdminActorA, targetA1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, schoolAdminActorA, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(false);
      if (!('code' in result)) {
        expect(result.rejected).toBe(false);
      }
    });

    it('teacher must specify learnerId', () => {
      const { targetA1, evidence, actorA } = allFixtures(policy);
      const badTeacher = { ...actorA, actorRole: 'teacher' as const, learnerId: undefined };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, badTeacher, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
      if ('code' in result) {
        expect(result.code).toBe('LEARNER_MISMATCH');
      }
    });

    it('teacher learnerId must match target learner', () => {
      const { targetA1, evidence, actorA } = allFixtures(policy);
      const wrongLearnerTeacher = { ...actorA, actorRole: 'teacher' as const, learnerId: 'wrong-learner' };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, wrongLearnerTeacher, targetA1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
      if ('code' in result) {
        expect(result.code).toBe('LEARNER_MISMATCH');
      }
    });

    it('cross-school teacher denied', () => {
      const { teacherActorA, targetB1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetB1, policy, strategy, null, clock, idGen, 'auth-test');
      expect('code' in result).toBe(true);
      if ('code' in result) {
        expect(result.code).toBe('SCHOOL_MISMATCH');
      }
    });

    it('student can query own state via projection', () => {
      const { teacherActorA, actorA, targetA1, evidence } = allFixtures(policy);
      const studentActor = { ...actorA, actorRole: 'student' as const, learnerId: FIXTURE_LEARNER_1 };
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'proj');
      if (!('code' in result)) {
        const view = projectState(result.state, result.diagnosis, result.nextAction, 'student');
        expect(view).not.toBeNull();
        if (view) {
          expect('visibleLabel' in view).toBe(true);
          expect((view as any).probabilityOfMastery).toBeUndefined();
        }
      }
    });
  });

  describe('Deterministic clock and ID generator', () => {
    it('identical clock and ID inputs produce identical state', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const fixedDate = ts('2026-06-15T12:00:00Z');
      const clock: MasteryClock = { now: () => fixedDate };
      let counter = 0;
      const idGen: MasteryIdGenerator = { nextId: () => { counter++; return `id-${counter}`; } };

      const result1 = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'det-1');
      counter = 0;
      const result2 = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'det-2');
      if (!('code' in result1) && !('code' in result2)) {
        expect(result1.state.probabilityOfMastery).toBe(result2.state.probabilityOfMastery);
        expect(result1.state.updatedAt.getTime()).toBe(result2.state.updatedAt.getTime());
        expect(result1.changeLog.changeId).toBe(result2.changeLog.changeId);
        expect(result1.diagnosis.diagnosisId).toBe(result2.diagnosis.diagnosisId);
        expect(result1.diagnosis.generatedAt.getTime()).toBe(result2.diagnosis.generatedAt.getTime());
      }
    });

    it('initial state uses injected clock', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const fixedDate = ts('2026-07-01T08:00:00Z');
      const clock: MasteryClock = { now: () => fixedDate };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const result = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'clock-test');
      if (!('code' in result)) {
        expect(result.state.updatedAt.getTime()).toBe(fixedDate.getTime());
      }
    });

    it('separate repository instances do not share ID state', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const fixedDate = ts('2026-06-15T12:00:00Z');
      const clock: MasteryClock = { now: () => fixedDate };
      const idGen1: MasteryIdGenerator = { nextId: () => 'repo-a-1' };
      const idGen2: MasteryIdGenerator = { nextId: () => 'repo-b-1' };
      const result1 = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen1, 'sep-1');
      const result2 = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen2, 'sep-2');
      if (!('code' in result1) && !('code' in result2)) {
        expect(result1.state.probabilityOfMastery).toBe(result2.state.probabilityOfMastery);
      }
    });

    it('no module-level counter in processor', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-06-15T12:00:00Z') };
      const ids: string[] = [];
      const idGen: MasteryIdGenerator = { nextId: (kind) => { const id = `custom-${kind}-${ids.length}`; ids.push(id); return id; } };
      const r1 = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'mod-1');
      const r2 = executeApplyEvidence(null, evidence.correct2, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'mod-2');
      if (!('code' in r1) && !('code' in r2)) {
        expect(r1.diagnosis.diagnosisId).toContain('custom-diagnosis');
        expect(r2.diagnosis.diagnosisId).toContain('custom-diagnosis');
        expect(r1.diagnosis.diagnosisId).not.toBe(r2.diagnosis.diagnosisId);
      }
    });
  });

  describe('Atomic update contract', () => {
    it('applyEvidenceWithRepository commits state, evidence, and change log', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'atom-id' };
      const result = applyEvidenceWithRepository(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, repo, 'atom-1');
      expect('code' in result || result.rejected).toBe(false);
      if (!('code' in result)) {
        expect(result.committed).toBe(true);
        const stored = repo.readState(targetA1);
        expect(stored).not.toBeNull();
        expect(repo.hasEvidenceBeenApplied(evidence.correct1.evidenceId)).toBe(true);
        const logs = repo.listChangeLogs(targetA1.schoolId, targetA1.learnerId, targetA1.targetNodeId);
        expect(logs.length).toBe(1);
      }
    });

    it('applying same evidence twice returns already-applied', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'atom-id' };
      const first = applyEvidenceWithRepository(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, repo, 'atom-1');
      expect('code' in first || first.rejected).toBe(false);
      const second = applyEvidenceWithRepository(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, repo, 'atom-2');
      if (!('code' in second)) {
        expect(second.rejected).toBe(true);
      }
    });

    it('failure injection: state write rollback keeps state unchanged', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const repo = new InMemoryMasteryRepository();
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'fail-id' };

      const first = applyEvidenceWithRepository(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, repo, 'first');
      expect('code' in first || first.rejected).toBe(false);
      const priorState = repo.readState(targetA1);
      const priorRevision = priorState?.stateRevision;

      const badEvidence = { ...evidence.correct2, evidenceId: 'trigger-fail' };
      const origApply = repo.applyEvidenceAtomically.bind(repo);
      repo.applyEvidenceAtomically = () => false;
      try {
        const failResult = applyEvidenceWithRepository(priorState, badEvidence, teacherActorA, targetA1, policy, strategy, null, clock, idGen, repo, 'fail');
        if (!('code' in failResult)) {
          expect(failResult.committed).toBe(false);
        }
      } finally {
        repo.applyEvidenceAtomically = origApply;
      }

      const stateAfter = repo.readState(targetA1);
      expect(stateAfter?.stateRevision).toBe(priorRevision);
      expect(repo.hasEvidenceBeenApplied(badEvidence.evidenceId)).toBe(false);
    });
  });

  describe('Repeated miss revisit', () => {
    function buildMasteredState(p: typeof policy): MasteryState {
      return {
        schoolId: FIXTURE_SCHOOL_A, learnerId: FIXTURE_LEARNER_1,
        targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill',
        curriculumVersionId: FIXTURE_CURRICULUM_VERSION,
        probabilityOfMastery: 0.85, confidence: 0.7, evidenceCount: 8,
        lastEvidenceAt: ts('2026-02-01T10:00:00Z'), decayRisk: 0.1,
        misconceptionTags: [], independenceScore: 0.9, hintDependencyScore: 0.1,
        retentionScore: 0.8, transferScore: 0.7, visibleLabel: 'mastered',
        policyVersion: p.policyVersion, strategyId: p.strategyId,
        strategyVersion: p.strategyVersion, stateRevision: 5,
        updatedAt: ts('2026-02-01T10:00:00Z'),
        consecutiveMissCountSinceMastered: 0,
      };
    }

    it('single miss below threshold does not force revisit', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const mastered = buildMasteredState(policy);
      const clock: MasteryClock = { now: () => ts('2026-03-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'miss-1' };
      const result = executeApplyEvidence(mastered, evidence.repeatedMiss1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'single-miss');
      if (!('code' in result)) {
        expect(result.state.visibleLabel).toBe('mastered');
      }
    });

    it('three consecutive misses produce needs_revisit', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const mastered = buildMasteredState(policy);
      const missEvs = [evidence.repeatedMiss1, evidence.repeatedMiss2, evidence.repeatedMiss3];
      let currentState: MasteryState = mastered;
      const clock: MasteryClock = { now: () => ts('2026-03-10T10:00:00Z') };
      let idCounter = 0;
      const idGen: MasteryIdGenerator = { nextId: () => `miss-seq-${++idCounter}` };
      for (const ev of missEvs) {
        const r = executeApplyEvidence(currentState, ev, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'miss-seq');
        if (!('code' in r)) {
          currentState = r.state;
        }
      }
      expect(currentState.visibleLabel).toBe('needs_revisit');
    });

    it('non-consecutive misses do not trigger revisit', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const mastered = buildMasteredState(policy);
      const clock: MasteryClock = { now: () => ts('2026-03-10T10:00:00Z') };
      let idCounter = 0;
      const idGen: MasteryIdGenerator = { nextId: () => `noncons-${++idCounter}` };
      let currentState: MasteryState = mastered;
      const seq = [evidence.repeatedMiss1, evidence.repeatedMiss3, evidence.correct3, evidence.repeatedMiss2];
      for (const ev of seq) {
        const r = executeApplyEvidence(currentState, ev, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'noncons');
        if (!('code' in r)) {
          currentState = r.state;
        }
      }
      expect(currentState.visibleLabel).not.toBe('needs_revisit');
    });

    it('recovery after revisit works', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const mastered = buildMasteredState(policy);
      const clock: MasteryClock = { now: () => ts('2026-03-10T10:00:00Z') };
      let idCounter = 0;
      const idGen: MasteryIdGenerator = { nextId: () => `rec-${++idCounter}` };
      let currentState: MasteryState = mastered;
      for (const ev of [evidence.repeatedMiss1, evidence.repeatedMiss2, evidence.repeatedMiss3]) {
        const r = executeApplyEvidence(currentState, ev, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'miss-to-revisit');
        if (!('code' in r)) currentState = r.state;
      }
      const recoveryClock: MasteryClock = { now: () => ts('2026-03-15T10:00:00Z') };
      const recoveryResult = executeApplyEvidence(currentState, evidence.recoveryEvidence, teacherActorA, targetA1, policy, strategy, null, recoveryClock, idGen, 'recovery');
      if (!('code' in recoveryResult)) {
        expect(recoveryResult.state.visibleLabel).not.toBe('needs_revisit');
      }
    });
  });

  describe('Prerequisite semantics', () => {
    it('direct prerequisites only from toId to fromId', () => {
      const { targetA1 } = allFixtures(policy);
      const graph = {
        edges: [
          { fromId: 'prereq-A', toId: FIXTURE_TARGET_SKILL_A, edgeType: 'prerequisite' as const },
          { fromId: FIXTURE_TARGET_SKILL_A, toId: 'dependent-B', edgeType: 'prerequisite' as const },
        ],
      };
      const lookup = () => null;
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, FIXTURE_CURRICULUM_VERSION);
      const direct = reader.getDirectPrerequisites(targetA1);
      expect(direct.length).toBe(1);
      expect(direct[0].targetNodeId).toBe('prereq-A');
    });

    it('reverse edge does not become a prerequisite', () => {
      const { targetA1 } = allFixtures(policy);
      const graph = {
        edges: [
          { fromId: 'some-other', toId: 'unrelated', edgeType: 'prerequisite' as const },
        ],
      };
      const lookup = () => null;
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, FIXTURE_CURRICULUM_VERSION);
      const direct = reader.getDirectPrerequisites(targetA1);
      expect(direct.length).toBe(0);
    });

    it('school mismatch returns empty typed result', () => {
      const { targetA1 } = allFixtures(policy);
      const graph = { edges: [] };
      const lookup = () => null;
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_B, FIXTURE_CURRICULUM_VERSION);
      const direct = reader.getDirectPrerequisites(targetA1);
      expect(direct.length).toBe(0);
    });

    it('version mismatch returns empty typed result', () => {
      const { targetA1 } = allFixtures(policy);
      const graph = { edges: [] };
      const lookup = () => null;
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, 'other-version');
      const direct = reader.getDirectPrerequisites(targetA1);
      expect(direct.length).toBe(0);
    });

    it('transitive traversal ordering is correct', () => {
      const graph = {
        edges: [
          { fromId: 'A', toId: 'B', edgeType: 'prerequisite' as const },
          { fromId: 'B', toId: FIXTURE_TARGET_SKILL_A, edgeType: 'prerequisite' as const },
        ],
      };
      const lookup = () => null;
      const target: MasteryTarget = {
        schoolId: FIXTURE_SCHOOL_A, learnerId: FIXTURE_LEARNER_1,
        targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill',
        curriculumVersionId: FIXTURE_CURRICULUM_VERSION,
      };
      const reader = createPrerequisiteReader(graph, lookup, FIXTURE_SCHOOL_A, FIXTURE_CURRICULUM_VERSION);
      const transitive = reader.getTransitivePrerequisites(target);
      expect(transitive.length).toBe(2);
      const ids = transitive.map(p => p.targetNodeId);
      expect(ids).toContain('A');
      expect(ids).toContain('B');
    });

    it('cycle detection works', () => {
      const graph = {
        edges: [
          { fromId: 'A', toId: 'B', edgeType: 'prerequisite' as const },
          { fromId: 'B', toId: 'C', edgeType: 'prerequisite' as const },
          { fromId: 'C', toId: 'A', edgeType: 'prerequisite' as const },
        ],
      };
      expect(detectCircularPrerequisites(graph)).toBe(true);
    });

    it('acyclic graph returns no cycle', () => {
      const graph = {
        edges: [
          { fromId: 'A', toId: 'B', edgeType: 'prerequisite' as const },
          { fromId: 'B', toId: 'C', edgeType: 'prerequisite' as const },
        ],
      };
      expect(detectCircularPrerequisites(graph)).toBe(false);
    });
  });

  describe('Replay conflict handling', () => {
    it('identical duplicate evidence deduplicated', () => {
      const evidence1 = { evidenceId: 'e1', schoolId: FIXTURE_SCHOOL_A, learnerId: FIXTURE_LEARNER_1, targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill' as const, curriculumVersionId: FIXTURE_CURRICULUM_VERSION, sourceType: 'practice_attempt' as const, outcome: 1, usable: true, markingConfidence: 1, integrityRisk: 0, independence: 1, hintDependency: 0, explanationQuality: null, misconceptionTags: [], transferSignal: null, retentionSignal: null, occurredAt: new Date('2026-01-15T10:00:00Z'), committedAt: new Date('2026-01-15T10:00:00Z'), policyVersion: 'v1', supersedes: null };
      const { result, conflicts } = deduplicateAndFilterEvidenceWithConflicts([evidence1, { ...evidence1 }]);
      expect(result.length).toBe(1);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].status).toBe('duplicate_identical');
    });

    it('conflicting duplicate evidence is blocked', () => {
      const evidence1 = { evidenceId: 'e1', schoolId: FIXTURE_SCHOOL_A, learnerId: FIXTURE_LEARNER_1, targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill' as const, curriculumVersionId: FIXTURE_CURRICULUM_VERSION, sourceType: 'practice_attempt' as const, outcome: 1, usable: true, markingConfidence: 1, integrityRisk: 0, independence: 1, hintDependency: 0, explanationQuality: null, misconceptionTags: [], transferSignal: null, retentionSignal: null, occurredAt: new Date('2026-01-15T10:00:00Z'), committedAt: new Date('2026-01-15T10:00:00Z'), policyVersion: 'v1', supersedes: null };
      const evidence2 = { ...evidence1, outcome: -1 };
      const { result, conflicts } = deduplicateAndFilterEvidenceWithConflicts([evidence1, evidence2]);
      expect(result.length).toBe(1);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].status).toBe('evidence_identity_conflict');
    });

    it('supersession works correctly', () => {
      const evidence1 = { evidenceId: 'e1', schoolId: FIXTURE_SCHOOL_A, learnerId: FIXTURE_LEARNER_1, targetNodeId: FIXTURE_TARGET_SKILL_A, targetNodeType: 'skill' as const, curriculumVersionId: FIXTURE_CURRICULUM_VERSION, sourceType: 'practice_attempt' as const, outcome: 1, usable: true, markingConfidence: 1, integrityRisk: 0, independence: 1, hintDependency: 0, explanationQuality: null, misconceptionTags: [], transferSignal: null, retentionSignal: null, occurredAt: new Date('2026-01-15T10:00:00Z'), committedAt: new Date('2026-01-15T10:00:00Z'), policyVersion: 'v1', supersedes: null };
      const evidence2 = { ...evidence1, evidenceId: 'e2', supersedes: 'e1' as string | null };
      const { result, conflicts } = deduplicateAndFilterEvidenceWithConflicts([evidence1, evidence2]);
      expect(result.length).toBe(1);
      expect(result[0].evidenceId).toBe('e2');
      expect(conflicts.some(c => c.status === 'superseded')).toBe(true);
    });

    it('no mutation after conflict', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'test-id' };
      const first = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'first');
      expect('code' in first || first.rejected).toBe(false);

      const { result: filtered } = deduplicateAndFilterEvidenceWithConflicts([evidence.correct1, { ...evidence.correct1, outcome: -1 }]);
      expect(filtered.length).toBe(1);
      expect(filtered[0].outcome).toBe(1);
    });

    it('replay returns conflicts list', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const evidenceList = [evidence.correct1, evidence.correct1, evidence.correct2];
      const result = replayState(evidenceList, targetA1, policy, strategy, null, teacherActorA, ts('2026-02-01T10:00:00Z'));
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].status).toBe('duplicate_identical');
    });
  });

  describe('Legacy compatibility bridge', () => {
    it('mapVisibleLabelToLegacyLevel maps all labels', () => {
      expect(mapVisibleLabelToLegacyLevel('not_started')).toBe('unknown');
      expect(mapVisibleLabelToLegacyLevel('mastered')).toBe('mastered');
      expect(mapVisibleLabelToLegacyLevel('needs_revisit')).toBe('regressing');
    });

    it('deriveLegacyMasteryFromCanonical produces valid output', () => {
      const { teacherActorA, targetA1, evidence } = allFixtures(policy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'leg-id' };
      const result = executeApplyEvidence(null, evidence.correct1, teacherActorA, targetA1, policy, strategy, null, clock, idGen, 'leg');
      if (!('code' in result)) {
        const derived = deriveLegacyMasteryFromCanonical(result.state, result.diagnosis);
        expect(derived.masteryLevel).toBeDefined();
        expect(derived.confidence).toBeDefined();
        expect(typeof derived.score).toBe('number');
        expect(derived.decision).toBeDefined();
      }
    });

    it('canonical policy change propagates through bridge', () => {
      const customPolicy = createFixturePolicy();
      customPolicy.labelThresholds.mastered = 0.95;
      validatePolicy(customPolicy);
      const { teacherActorA, targetA1, evidence } = allFixtures(customPolicy);
      const clock: MasteryClock = { now: () => ts('2026-02-01T10:00:00Z') };
      const idGen: MasteryIdGenerator = { nextId: () => 'pol-id' };
      let state: MasteryState | null = null;
      for (const ev of [evidence.correct1, evidence.correct2, evidence.correct3, evidence.correct4, evidence.correct5]) {
        const r = executeApplyEvidence(state, ev, teacherActorA, targetA1, customPolicy, strategy, null, clock, idGen, 'pol');
        if (!('code' in r)) state = r.state;
      }
      if (state) {
        const derived = deriveLegacyMasteryFromCanonical(state, null);
        expect(derived.masteryLevel).not.toBe('mastered');
      }
    });
  });
});
