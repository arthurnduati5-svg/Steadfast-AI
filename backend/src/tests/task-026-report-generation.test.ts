import { describe, it, expect } from 'vitest';

describe('Task 026 Report Generation', () => {
  it('should have a verification script at scripts/verify-task026.ps1', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..', '..', '..');
    const scriptPath = path.join(rootDir, 'scripts', 'verify-task026.ps1');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should have a report generator at scripts/gen-task026-report.cjs', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..', '..', '..');
    const scriptPath = path.join(rootDir, 'scripts', 'gen-task026-report.cjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should have contracts file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const contractsPath = path.join(rootDir, 'contracts', 'task026PilotExecutionContracts.ts');
    expect(fs.existsSync(contractsPath)).toBe(true);
  });

  it('should have repository file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const repoPath = path.join(rootDir, 'repositories', 'task026PilotExecutionRepository.ts');
    expect(fs.existsSync(repoPath)).toBe(true);
  });

  it('should have state machine service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const smPath = path.join(rootDir, 'services', 'task026PilotExecutionStateMachine.ts');
    expect(fs.existsSync(smPath)).toBe(true);
  });

  it('should have runtime guard service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const guardPath = path.join(rootDir, 'services', 'task026PilotRuntimeGuardService.ts');
    expect(fs.existsSync(guardPath)).toBe(true);
  });

  it('should have routes file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const routesPath = path.join(rootDir, 'routes', 'task026PilotExecutionRoutes.ts');
    expect(fs.existsSync(routesPath)).toBe(true);
  });

  it('should have post-pilot review service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const reviewPath = path.join(rootDir, 'services', 'task026PostPilotReviewService.ts');
    expect(fs.existsSync(reviewPath)).toBe(true);
  });

  it('should have incident bridge service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const bridgePath = path.join(rootDir, 'services', 'task026PilotIncidentBridgeService.ts');
    expect(fs.existsSync(bridgePath)).toBe(true);
  });

  it('should have metric service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const metricPath = path.join(rootDir, 'services', 'task026PilotMetricService.ts');
    expect(fs.existsSync(metricPath)).toBe(true);
  });

  it('should have feedback service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const fbPath = path.join(rootDir, 'services', 'task026PilotFeedbackService.ts');
    expect(fs.existsSync(fbPath)).toBe(true);
  });

  it('should have safety signal service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const ssPath = path.join(rootDir, 'services', 'task026PilotSafetySignalService.ts');
    expect(fs.existsSync(ssPath)).toBe(true);
  });

  it('should have execution control service', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const ecPath = path.join(rootDir, 'services', 'task026PilotExecutionControlService.ts');
    expect(fs.existsSync(ecPath)).toBe(true);
  });

  it('should have routes registered in index.ts', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..');
    const indexPath = path.join(rootDir, 'index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('task026PilotExecutionRoutes');
  });

  it('should have Prisma schema models', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..', '..', '..');
    const schemaPath = path.join(rootDir, 'backend', 'prisma', 'schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    expect(content).toContain('model PilotExecutionRun');
    expect(content).toContain('model PilotExecutionEvent');
    expect(content).toContain('model PilotRuntimeMetricSnapshot');
    expect(content).toContain('model PilotFeedbackRecord');
    expect(content).toContain('model PilotSafetySignal');
    expect(content).toContain('model PilotPostPilotReview');
    expect(content).toContain('model PilotExecutionAuditRecord');
  });

  it('should have migration SQL file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '..', '..', '..');
    const migrationPath = path.join(
      rootDir,
      'backend', 'prisma', 'migrations', '20260628210001_task026_pilot_execution_runtime', 'migration.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
  });
});
