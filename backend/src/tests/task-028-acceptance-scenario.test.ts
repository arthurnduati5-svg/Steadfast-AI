import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { runExpansionExecutionAcceptanceScenario } from '../services/task028ExpansionExecutionAcceptanceScenarioService';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 028 Acceptance Scenario', () => {
  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should run full acceptance scenario and pass all gates', async () => {
    const result = await runExpansionExecutionAcceptanceScenario();

    expect(result.scenarioRun).toBe(true);
    expect(result.executionRunCreated).toBe(true);
    expect(result.executionPreflightPassed).toBe(true);
    expect(result.stageOneActivated).toBe(true);
    expect(result.expandedParticipantsActivated).toBe(true);
    expect(result.runtimeGuardAllowedInScope).toBe(true);
    expect(result.runtimeGuardBlockedOutOfScope).toBe(true);
    expect(result.aiBeforeGuardBlocked).toBe(true);
    expect(result.memoryBeforeGuardBlocked).toBe(true);
    expect(result.evidenceBeforeGuardBlocked).toBe(true);
    expect(result.healthSnapshotGenerated).toBe(true);
    expect(result.oversightQueueVerified).toBe(true);
    expect(result.pauseBlocksAccess).toBe(true);
    expect(result.rollbackBlocksAccess).toBe(true);
    expect(result.completionReviewGenerated).toBe(true);

    expect(result.blockingIssues).toHaveLength(0);
    expect(result.rawPrivateDataUsed).toBe(false);
    expect(result.liveProductionExpansionPerformed).toBe(false);
    expect(result.safeToStartTask029).toBe(true);
  });

  it('should write acceptance scenario result to JSON', async () => {
    const result = await runExpansionExecutionAcceptanceScenario();
    const logDir = path.resolve(process.cwd(), 'logs', 'task-028');
    fs.mkdirSync(logDir, { recursive: true });
    const jsonPath = path.join(logDir, 'acceptance-scenario-result.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    expect(fs.existsSync(jsonPath)).toBe(true);
    const read = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    expect(read.safeToStartTask029).toBe(true);
    expect(read.scenarioRun).toBe(true);
  });
});
