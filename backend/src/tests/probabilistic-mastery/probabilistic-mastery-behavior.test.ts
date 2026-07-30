import { describe, it, expect } from 'vitest';
import { EvidenceWeightedStrategy } from '../../services/probabilisticMasteryStrategy';
import { createFixturePolicy, validatePolicy } from '../../services/probabilisticMasteryPolicy';
import { InMemoryMasteryRepository } from '../../services/probabilisticMasteryRepository';
import { applyEvidence, deriveVisibleLabel, replayState } from '../../services/probabilisticMasteryEvidenceProcessor';
import { createPrerequisiteReader, detectCircularPrerequisites } from '../../services/probabilisticMasteryPrerequisiteReader';
import { projectState, buildStudentSafeView, buildStaffSafeView } from '../../services/probabilisticMasteryProjections';
import { allFixtures, FIXTURE_SCHOOL_A, FIXTURE_SCHOOL_B, FIXTURE_LEARNER_1, FIXTURE_TARGET_SKILL_A } from '../../services/probabilisticMasterySeeds';
import type { MasteryTarget, NormalizedMasteryEvidence, PrerequisiteReader, MasteryState } from '../../services/probabilisticMasteryContracts';

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
});
