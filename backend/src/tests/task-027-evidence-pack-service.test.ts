import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { generateExpansionEvidencePack } from '../services/task027PilotExpansionEvidencePackService';
import { setupExpansionTestEnvironment } from './task-027-test-helper';

describe('Task 027 Evidence Pack Service', () => {
  beforeEach(async () => {
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should generate evidence pack for valid proposal', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const result = await generateExpansionEvidencePack(proposalId);

    expect(result.ok).toBe(true);
    expect(result.evidencePackId).toBeTruthy();
  });

  it('should fail for non-existent proposal', async () => {
    const result = await generateExpansionEvidencePack('nonexistent');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_found');
  });

  it('should include all evidence categories', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const result = await generateExpansionEvidencePack(proposalId);
    expect(result.ok).toBe(true);

    const pack = await task027PilotExpansionRepository.getEvidencePack(result.evidencePackId!);
    expect(pack).toBeTruthy();
    const p = pack as any;
    expect(p.learningQualityEvidence).toBeTruthy();
    expect(p.socraticEvidence).toBeTruthy();
    expect(p.deenEvidence).toBeTruthy();
    expect(p.privacyEvidence).toBeTruthy();
    expect(p.curriculumEvidence).toBeTruthy();
    expect(p.operationsEvidence).toBeTruthy();
    expect(p.feedbackEvidence).toBeTruthy();
    expect(p.incidentEvidence).toBeTruthy();
    expect(p.rollbackEvidence).toBeTruthy();
  });

  it('should not leak private data in evidence pack', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const result = await generateExpansionEvidencePack(proposalId);
    expect(result.ok).toBe(true);

    const pack = await task027PilotExpansionRepository.getEvidencePack(result.evidencePackId!);
    const jsonStr = JSON.stringify(pack);
    expect(jsonStr).not.toContain('Bearer ');
    expect(jsonStr).not.toContain('postgres://');
    expect(jsonStr).not.toContain('postgresql://');
    expect(jsonStr).not.toContain('authorization');
    expect(jsonStr).not.toContain('rawChat');
    expect(jsonStr).not.toContain('raw_chat');
    // sk- false positive from task-027 artifact path; use more specific checks
    expect(jsonStr).not.toContain('sk-proj-');
  });
});
