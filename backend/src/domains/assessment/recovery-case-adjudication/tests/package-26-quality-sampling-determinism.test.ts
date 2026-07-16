import { describe, it, expect } from 'vitest';
import { RecoveryCaseQualitySampleService } from '../services/recoveryCaseQualitySampleService';
import { InMemoryQualitySampleRepository, InMemoryAdjudicationAuditRepository } from '../repositories/inMemoryRecoveryCaseAdjudicationRepositories';
import type { RecoveryCaseQualitySamplingInput } from '../contracts/recoveryCaseQualitySampleContracts';

describe('Package 26 - Quality Sampling Determinism', () => {
  const service = new RecoveryCaseQualitySampleService(
    new InMemoryQualitySampleRepository(),
    new InMemoryAdjudicationAuditRepository(),
  );

  function makeInput(overrides: Partial<RecoveryCaseQualitySamplingInput> = {}): RecoveryCaseQualitySamplingInput {
    return {
      schoolId: 'school-1',
      queueItemId: 'queue-item-42',
      priorityBand: 'normal',
      sampleBasisPoints: 5000,
      policyVersion: 'RECOVERY_CASE_ADJUDICATION_QUALITY_V1',
      ...overrides,
    };
  }

  it('same input produces same bucket', () => {
    const a = service.calculateQualitySample(makeInput());
    const b = service.calculateQualitySample(makeInput());
    expect(a.bucket).toBe(b.bucket);
  });

  it('same input produces same selected result', () => {
    const a = service.calculateQualitySample(makeInput());
    const b = service.calculateQualitySample(makeInput());
    expect(a.selected).toBe(b.selected);
  });

  it('critical_review priority band is ALWAYS selected regardless of basis points', () => {
    const result0 = service.calculateQualitySample(makeInput({ priorityBand: 'critical_review', sampleBasisPoints: 0 }));
    expect(result0.selected).toBe(true);

    const result1 = service.calculateQualitySample(makeInput({ priorityBand: 'critical_review', sampleBasisPoints: 1 }));
    expect(result1.selected).toBe(true);

    const result5000 = service.calculateQualitySample(makeInput({ priorityBand: 'critical_review', sampleBasisPoints: 5000 }));
    expect(result5000.selected).toBe(true);

    const result10000 = service.calculateQualitySample(makeInput({ priorityBand: 'critical_review', sampleBasisPoints: 10000 }));
    expect(result10000.selected).toBe(true);
  });

  it('0 basis points selects NO non-critical case', () => {
    const bands = ['high', 'normal', 'low', 'deferred'];
    for (const band of bands) {
      const result = service.calculateQualitySample(makeInput({ priorityBand: band, sampleBasisPoints: 0 }));
      expect(result.selected).toBe(false);
    }
  });

  it('10000 basis points selects ALL cases', () => {
    const bands = ['high', 'normal', 'low', 'deferred'];
    for (const band of bands) {
      const result = service.calculateQualitySample(makeInput({ priorityBand: band, sampleBasisPoints: 10000 }));
      expect(result.selected).toBe(true);
    }
  });

  it('negative basis points are rejected', () => {
    expect(() => service.calculateQualitySample(makeInput({ sampleBasisPoints: -1 }))).toThrow();
  });

  it('basis points > 10000 are rejected', () => {
    expect(() => service.calculateQualitySample(makeInput({ sampleBasisPoints: 10001 }))).toThrow();
  });

  it('non-integer basis points are rejected', () => {
    expect(() => service.calculateQualitySample(makeInput({ sampleBasisPoints: 500.5 }))).toThrow();
  });

  it('quality sample does not mutate queue order', () => {
    const input = makeInput();
    const before = { ...input };
    service.calculateQualitySample(input);
    expect(input.queueItemId).toBe(before.queueItemId);
    expect(input.schoolId).toBe(before.schoolId);
    expect(input.policyVersion).toBe(before.policyVersion);
    expect(input.sampleBasisPoints).toBe(before.sampleBasisPoints);
  });

  it('different queue items produce different buckets', () => {
    const resultA = service.calculateQualitySample(makeInput({ queueItemId: 'queue-item-1' }));
    const resultB = service.calculateQualitySample(makeInput({ queueItemId: 'queue-item-2' }));
    expect(resultA.bucket).not.toBe(resultB.bucket);
  });

  it('seed format is `${schoolId}:${queueItemId}:${policyVersion}`', () => {
    const result = service.calculateQualitySample(makeInput({
      schoolId: 'sch-99',
      queueItemId: 'qi-77',
      policyVersion: 'POLICY_V2',
    }));
    expect(result.seed).toBe('sch-99:qi-77:POLICY_V2');
  });

  it('different schools produce different results for same queue item', () => {
    const resultA = service.calculateQualitySample(makeInput({ schoolId: 'school-x', queueItemId: 'qi-1' }));
    const resultB = service.calculateQualitySample(makeInput({ schoolId: 'school-y', queueItemId: 'qi-1' }));
    expect(resultA.seed).not.toBe(resultB.seed);
    expect(resultA.bucket).not.toBe(resultB.bucket);
  });
});
