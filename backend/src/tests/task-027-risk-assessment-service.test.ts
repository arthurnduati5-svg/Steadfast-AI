import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { assessExpansionRisk } from '../services/task027PilotExpansionRiskAssessmentService';
import { generateExpansionEvidencePack } from '../services/task027PilotExpansionEvidencePackService';
import { setupExpansionTestEnvironment } from './task-027-test-helper';

describe('Task 027 Risk Assessment Service', () => {
  beforeEach(async () => {
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should assess risk for valid proposal with evidence pack', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    await generateExpansionEvidencePack(proposalId);

    const result = await assessExpansionRisk(proposalId);
    expect(result.ok).toBe(true);
    expect(result.riskAssessmentId).toBeTruthy();
    expect(result.overallRiskLevel).toBeTruthy();
  });

  it('should fail without evidence pack', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    const result = await assessExpansionRisk(proposalId);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('evidence_pack_required');
  });

  it('should fail for non-existent proposal', async () => {
    const result = await assessExpansionRisk('nonexistent');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('proposal_not_found');
  });

  it('should compute risk levels for all categories', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    await generateExpansionEvidencePack(proposalId);

    const result = await assessExpansionRisk(proposalId);
    expect(result.ok).toBe(true);

    const assessment = await task027PilotExpansionRepository.getRiskAssessment(result.riskAssessmentId!);
    expect(assessment).toBeTruthy();
    const a = assessment as any;
    expect(a.overallRiskLevel).toBeTruthy();
    expect(a.privacyRiskLevel).toBeTruthy();
    expect(a.deenRiskLevel).toBeTruthy();
    expect(a.socraticRiskLevel).toBeTruthy();
    expect(a.curriculumRiskLevel).toBeTruthy();
    expect(a.operationsRiskLevel).toBeTruthy();
    expect(a.safeguardingRiskLevel).toBeTruthy();
  });

  it('should not leak private data in risk assessment', async () => {
    const { proposalId } = await setupExpansionTestEnvironment();
    await generateExpansionEvidencePack(proposalId);

    const result = await assessExpansionRisk(proposalId);
    expect(result.ok).toBe(true);

    const assessment = await task027PilotExpansionRepository.getRiskAssessment(result.riskAssessmentId!);
    const jsonStr = JSON.stringify(assessment);
    expect(jsonStr).not.toContain('Bearer ');
    expect(jsonStr).not.toContain('sk-');
  });
});
