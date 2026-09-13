/**
 * R8-G.3B-A composition lock.
 *
 * Proves the production composition of Package-20:
 *  - Action Readiness composition is unchanged (R8-G.2 durable chain);
 *  - the five target families are wired Prisma resource + Prisma audit +
 *    Prisma idempotency + the shared preparation atomic store;
 *  - the six R8-G.3B-B families remain in-memory;
 *  - no production memory fallback exists for the five target families.
 *
 * The lock FAILS if any of the five families is later wired back to memory.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const ROUTE_FILE = path.join(BACKEND_ROOT, 'src/routes/recoveryOutcomeAction.ts');
const PRISMA_REPOS_FILE = path.join(
  BACKEND_ROOT,
  'src/domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionRepositories.ts',
);
const ATOMIC_STORE_FILE = path.join(
  BACKEND_ROOT,
  'src/domains/assessment/recovery-outcome-action/repositories/prismaRecoveryOutcomeActionPreparationAtomicStore.ts',
);

const FIVE_TARGET_PRISMA_CLASSES = [
  'PrismaRecoveryOutcomeActionBundleRepository',
  'PrismaRecoveryContinuationActionDraftRepository',
  'PrismaRecoveryIntensificationActionDraftRepository',
  'PrismaRecoveryPauseActionDraftRepository',
  'PrismaRecoveryClosureActionDraftRepository',
];

const SIX_G3BB_INMEMORY_CLASSES = [
  'InMemoryRecoveryOutcomeApprovalGateRepository',
  'InMemoryRecoveryOutcomeMockActivationQueueRepository',
  'InMemoryRecoveryOutcomeDryRunReceiptRepository',
  'InMemoryRecoveryOutcomeRollbackPlanRepository',
  'InMemoryRecoveryOutcomeSuppressionRuleRepository',
  'InMemoryRecoveryOutcomeActionSummaryRepository',
];

describe('R8-G.3B-A Package-20 draft-family composition lock', () => {
  it('route file exists', () => {
    expect(fs.existsSync(ROUTE_FILE)).toBe(true);
  });

  it('imports all five target Prisma repositories', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    for (const cls of FIVE_TARGET_PRISMA_CLASSES) {
      expect(content).toContain(cls);
    }
  });

  it('imports the shared Package-20 preparation atomic store', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('PrismaRecoveryOutcomeActionPreparationAtomicStore');
    expect(fs.existsSync(ATOMIC_STORE_FILE)).toBe(true);
  });

  it('does NOT construct any in-memory repository for the five target families', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    const forbidden = [
      'new InMemoryRecoveryOutcomeActionBundleRepository()',
      'new InMemoryRecoveryContinuationActionDraftRepository()',
      'new InMemoryRecoveryIntensificationActionDraftRepository()',
      'new InMemoryRecoveryPauseActionDraftRepository()',
      'new InMemoryRecoveryClosureActionDraftRepository()',
    ];
    for (const fragment of forbidden) {
      expect(content).not.toContain(fragment);
    }
  });

  it('does NOT import the in-memory classes of the five target families', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    const forbidden = [
      'InMemoryRecoveryOutcomeActionBundleRepository,',
      'InMemoryRecoveryContinuationActionDraftRepository,',
      'InMemoryRecoveryIntensificationActionDraftRepository,',
      'InMemoryRecoveryPauseActionDraftRepository,',
      'InMemoryRecoveryClosureActionDraftRepository,',
    ];
    for (const fragment of forbidden) {
      expect(content).not.toContain(fragment);
    }
  });

  it('keeps the six R8-G.3B-B families in-memory', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    for (const cls of SIX_G3BB_INMEMORY_CLASSES) {
      expect(content).toContain(`new ${cls}()`);
    }
  });

  it('leaves the six R8-G.3B-B Prisma stubs untouched (still throwing stubs)', () => {
    const content = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    const g3bbClasses = [
      'PrismaRecoveryOutcomeApprovalGateRepository',
      'PrismaRecoveryOutcomeMockActivationQueueRepository',
      'PrismaRecoveryOutcomeDryRunReceiptRepository',
      'PrismaRecoveryOutcomeRollbackPlanRepository',
      'PrismaRecoveryOutcomeSuppressionRuleRepository',
      'PrismaRecoveryOutcomeActionSummaryRepository',
    ];
    for (const cls of g3bbClasses) {
      const classStart = content.indexOf(`export class ${cls}`);
      expect(classStart).toBeGreaterThan(-1);
      const classBody = content.slice(classStart, content.indexOf('export class', classStart + 1));
      expect(classBody).toContain("throw new Error('Not implemented in stub')");
    }
  });

  it('five target Prisma repository classes contain no stub throws', () => {
    const content = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    for (const cls of FIVE_TARGET_PRISMA_CLASSES) {
      const classStart = content.indexOf(`export class ${cls}`);
      expect(classStart).toBeGreaterThan(-1);
      const nextExport = content.indexOf('export class', classStart + 1);
      const classBody = content.slice(classStart, nextExport === -1 ? content.length : nextExport);
      expect(classBody).not.toContain("throw new Error('Not implemented in stub')");
    }
  });

  it('five-family mutations receive the atomic store (services constructed with 5th argument)', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('bundleAtomicStore');
    expect(content).toContain('draftAtomicStore');
    // All five production services are constructed through the two factory
    // helpers that wire the atomic store as the final constructor argument.
    expect(content).toContain('createProductionBundleService');
    expect(content).toContain('createProductionDraftService');
    const serviceClasses = [
      'RecoveryOutcomeActionBundleService',
      'RecoveryContinuationActionDraftService',
      'RecoveryIntensificationActionDraftService',
      'RecoveryPauseActionDraftService',
      'RecoveryClosureActionDraftService',
    ];
    for (const cls of serviceClasses) {
      expect(content).toContain(cls);
    }
    // The bundle factory passes bundleAtomicStore as its 5th argument and the
    // draft factory passes draftAtomicStore as its 5th argument.
    expect(content).toMatch(/new RecoveryOutcomeActionBundleService\([\s\S]*?bundleAtomicStore,\s*\)/);
    expect(content).toMatch(/new serviceClass\([\s\S]*?draftAtomicStore,\s*\)/);
  });

  it('Action Readiness composition is unchanged (R8-G.2 durable chain intact)', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('createProductionReadinessService');
    expect(content).toContain('PrismaRecoveryOutcomeActionReadinessAtomicStore');
    expect(content).toContain('PrismaRecoveryOutcomeActionReadinessRepository');
  });

  it('tenant-scoped ID reads pass verified school to the five family GET-by-id routes', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    const scopedGets = [
      "bundleService.getActionBundle(req.params.id, getVerifiedSchoolId(req))",
      "continuationDraftService.getActionDraft(req.params.id, getVerifiedSchoolId(req))",
      "intensificationDraftService.getActionDraft(req.params.id, getVerifiedSchoolId(req))",
      "pauseDraftService.getActionDraft(req.params.id, getVerifiedSchoolId(req))",
      "closureDraftService.getActionDraft(req.params.id, getVerifiedSchoolId(req))",
    ];
    for (const fragment of scopedGets) {
      expect(content).toContain(fragment);
    }
  });

  it('no memory fallback variable remains for the five target families', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).not.toContain('const bundleRepo = new InMemory');
    expect(content).not.toContain('const continuationDraftRepo = new InMemory');
    expect(content).not.toContain('const intensificationDraftRepo = new InMemory');
    expect(content).not.toContain('const pauseDraftRepo = new InMemory');
    expect(content).not.toContain('const closureDraftRepo = new InMemory');
  });
});
