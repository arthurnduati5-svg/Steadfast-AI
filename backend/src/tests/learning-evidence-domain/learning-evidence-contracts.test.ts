import { describe, it, expect } from 'vitest';
import {
  EvidenceEventType,
  EvidenceCandidateState,
  EvidenceSourceType,
  EvidenceOutcome,
  EvidenceIndependence,
  EvidenceMode,
  isValidTransition,
  VALID_TRANSITIONS,
} from '../../domains/learning-evidence/contracts/learningEvidenceEventStoreContracts';
import {
  EVIDENCE_ERROR_CODES,
  EvidenceCommand,
} from '../../domains/learning-evidence/contracts/learningEvidenceCommandContracts';
import {
  FORBIDDEN_PAYLOAD_KEYS,
  hasForbiddenKeys,
} from '../../domains/learning-evidence/contracts/learningEvidencePrivacyContracts';

describe('Learning Evidence Event Store Contracts', () => {
  it('VALID_TRANSITIONS covers all states', () => {
    const states: EvidenceCandidateState[] = ['candidate', 'validating', 'ineligible', 'review_required', 'usable', 'committed', 'superseded', 'retained'];
    for (const s of states) {
      expect(VALID_TRANSITIONS[s]).toBeDefined();
    }
  });

  it('isValidTransition allows valid paths', () => {
    expect(isValidTransition('candidate', 'validating')).toBe(true);
    expect(isValidTransition('validating', 'ineligible')).toBe(true);
    expect(isValidTransition('validating', 'review_required')).toBe(true);
    expect(isValidTransition('validating', 'usable')).toBe(true);
    expect(isValidTransition('usable', 'committed')).toBe(true);
    expect(isValidTransition('committed', 'superseded')).toBe(true);
    expect(isValidTransition('committed', 'retained')).toBe(true);
  });

  it('isValidTransition rejects invalid paths', () => {
    expect(isValidTransition('candidate', 'committed')).toBe(false);
    expect(isValidTransition('validating', 'candidate')).toBe(false);
    expect(isValidTransition('committed', 'usable')).toBe(false);
    expect(isValidTransition('ineligible', 'candidate')).toBe(false);
    expect(isValidTransition('superseded', 'committed')).toBe(false);
  });

  it('isValidTransition rejects unknown states', () => {
    expect(isValidTransition('candidate' as EvidenceCandidateState, 'unknown' as EvidenceCandidateState)).toBe(false);
    expect(isValidTransition('unknown' as EvidenceCandidateState, 'committed' as EvidenceCandidateState)).toBe(false);
  });

  it('EVIDENCE_ERROR_CODES has expected keys', () => {
    const codes = Object.values(EVIDENCE_ERROR_CODES);
    expect(codes).toContain('EVIDENCE_SCHOOL_CONTEXT_REQUIRED');
    expect(codes).toContain('EVIDENCE_INVALID_TRANSITION');
    expect(codes).toContain('EVIDENCE_NOT_FOUND');
    expect(codes).toContain('EVIDENCE_STREAM_CONCURRENCY_CONFLICT');
  });

  it('FORBIDDEN_PAYLOAD_KEYS has known keys', () => {
    expect(FORBIDDEN_PAYLOAD_KEYS).toContain('rawChat');
    expect(FORBIDDEN_PAYLOAD_KEYS).toContain('answerKey');
  });

  it('hasForbiddenKeys returns empty array for safe object', () => {
    expect(hasForbiddenKeys({ outcome: 'correct', safe: true })).toEqual([]);
  });

  it('hasForbiddenKeys finds forbidden keys at top level', () => {
    const result = hasForbiddenKeys({ rawChat: 'test', outcome: 'correct' });
    expect(result).toContain('rawChat');
  });

  it('hasForbiddenKeys finds forbidden keys nested', () => {
    const result = hasForbiddenKeys({ nested: { answerKey: 'secret' } });
    expect(result.length).toBeGreaterThan(0);
  });
});
