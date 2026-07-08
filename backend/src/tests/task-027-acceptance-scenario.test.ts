import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { runAcceptanceScenario } from '../services/task027PilotExpansionAcceptanceScenarioService';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 027 Acceptance Scenario', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK027_REQUIRE_REAL_PRISMA;
  });

  it('should run full acceptance scenario and pass all gates', async () => {
    const result = await runAcceptanceScenario();
    expect(result.scenarioRun).toBe(true);
    expect(result.proposalCreated).toBe(true);
    expect(result.evidencePackGenerated).toBe(true);
    expect(result.riskAssessmentGenerated).toBe(true);
    expect(result.requiredReviewsApproved).toBe(true);
    expect(result.decisionServiceExecuted).toBe(true);
    expect(result.decisionApproved).toBe(true);
    expect(result.cohortChangePrepared).toBe(true);
    expect(result.safeToExpand).toBe(true);
    expect(result.safeToStartTask028).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.rawPrivateDataUsed).toBe(false);
    expect(result.liveProductionExpansionPerformed).toBe(false);
  });

  it('should write acceptance scenario result to JSON', async () => {
    const result = await runAcceptanceScenario();
    const logDir = path.resolve(process.cwd(), 'logs', 'task-027');
    fs.mkdirSync(logDir, { recursive: true });
    const jsonPath = path.join(logDir, 'acceptance-scenario-result.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    expect(fs.existsSync(jsonPath)).toBe(true);
    const read = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(read.safeToStartTask028).toBe(true);
    expect(read.scenarioRun).toBe(true);
  });
});
