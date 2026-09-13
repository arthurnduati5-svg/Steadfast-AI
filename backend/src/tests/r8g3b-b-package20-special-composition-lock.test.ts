/**
 * R8-G.3B-B composition lock.
 *
 * Proves the R8-G.3B-B production composition of Package-20:
 *  - the six special Prisma repositories are fully implemented (no stubs);
 *  - the six special production services receive the shared preparation
 *    atomic store (Prisma resource + Prisma audit + Prisma idempotency);
 *  - verified school is passed to all six special GET-by-id routes;
 *  - the DryRun receipt list-by-queue-item cannot leak cross-school records;
 *  - Action Summary refresh uses an explicit whitelist;
 *  - Action Readiness composition is unchanged (R8-G.2 durable chain);
 *  - G.3B-A composition is unchanged (five families still Prisma + prep store);
 *  - zero production Package-20 in-memory resource construction remains;
 *  - no live execution integration exists.
 *
 * Pure non-DB proof: reads file contents only.
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

const SIX_SPECIAL_PRISMA_CLASSES = [
  'PrismaRecoveryOutcomeApprovalGateRepository',
  'PrismaRecoveryOutcomeMockActivationQueueRepository',
  'PrismaRecoveryOutcomeDryRunReceiptRepository',
  'PrismaRecoveryOutcomeRollbackPlanRepository',
  'PrismaRecoveryOutcomeSuppressionRuleRepository',
  'PrismaRecoveryOutcomeActionSummaryRepository',
];

const SIX_SPECIAL_SERVICE_CLASSES = [
  'RecoveryOutcomeApprovalGateService',
  'RecoveryOutcomeMockActivationQueueService',
  'RecoveryOutcomeDryRunReceiptService',
  'RecoveryOutcomeRollbackPlanService',
  'RecoveryOutcomeSuppressionRuleService',
  'RecoveryOutcomeActionSummaryService',
];

const FIVE_G3BA_PRISMA_CLASSES = [
  'PrismaRecoveryOutcomeActionBundleRepository',
  'PrismaRecoveryContinuationActionDraftRepository',
  'PrismaRecoveryIntensificationActionDraftRepository',
  'PrismaRecoveryPauseActionDraftRepository',
  'PrismaRecoveryClosureActionDraftRepository',
];

function classBody(content: string, cls: string): string {
  const classStart = content.indexOf(`export class ${cls}`);
  expect(classStart).toBeGreaterThan(-1);
  const nextExport = content.indexOf('export class', classStart + 1);
  return content.slice(classStart, nextExport === -1 ? content.length : nextExport);
}

describe('R8-G.3B-B Package-20 special-family composition lock', () => {
  it('route file and atomic store file exist', () => {
    expect(fs.existsSync(ROUTE_FILE)).toBe(true);
    expect(fs.existsSync(ATOMIC_STORE_FILE)).toBe(true);
  });

  it('six special Prisma repositories are fully implemented (no stub throws)', () => {
    const content = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    for (const cls of SIX_SPECIAL_PRISMA_CLASSES) {
      const body = classBody(content, cls);
      expect(body).not.toContain("throw new Error('Not implemented in stub')");
    }
  });

  it('no Package-20 resource repository stub remains anywhere in the file', () => {
    const content = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    expect(content).not.toContain("throw new Error('Not implemented in stub')");
  });

  it('atomic store covers the six special resource types with audit refs', () => {
    const content = fs.readFileSync(ATOMIC_STORE_FILE, 'utf-8');
    for (const resourceType of [
      'RecoveryOutcomeApprovalGate',
      'RecoveryOutcomeMockActivationQueueItem',
      'RecoveryOutcomeDryRunReceipt',
      'RecoveryOutcomeRollbackPlan',
      'RecoveryOutcomeSuppressionRule',
      'RecoveryOutcomeActionSummary',
    ]) {
      expect(content).toContain(`'${resourceType}'`);
    }
    for (const refField of [
      'approvalGateId',
      'mockActivationQueueItemId',
      'dryRunReceiptId',
      'rollbackPlanId',
      'suppressionRuleId',
      'actionSummaryId',
    ]) {
      expect(content).toContain(refField);
    }
  });

  it('six special services receive the preparation atomic store in production', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('createProductionSpecialService');
    expect(content).toContain('specialAtomicStore');
    // All six production services are constructed through the factory that
    // wires the atomic store as the final constructor argument.
    const constructions = [
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeApprovalGateRepository, RecoveryOutcomeApprovalGateService)',
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeMockActivationQueueRepository, RecoveryOutcomeMockActivationQueueService)',
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeDryRunReceiptRepository, RecoveryOutcomeDryRunReceiptService)',
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeRollbackPlanRepository, RecoveryOutcomeRollbackPlanService)',
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeSuppressionRuleRepository, RecoveryOutcomeSuppressionRuleService)',
      'createProductionSpecialService(prisma, PrismaRecoveryOutcomeActionSummaryRepository, RecoveryOutcomeActionSummaryService)',
    ];
    for (const fragment of constructions) {
      expect(content).toContain(fragment);
    }
    expect(content).toMatch(/new serviceClass\([\s\S]*?specialAtomicStore,\s*\)/);
  });

  it('verified school is passed to all six special GET-by-id routes', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    const scopedGets = [
      'approvalGateService.getApprovalGate(req.params.id, getVerifiedSchoolId(req))',
      'mockQueueService.getMockActivationQueueItem(req.params.id, getVerifiedSchoolId(req))',
      'dryRunService.getDryRunReceipt(req.params.id, getVerifiedSchoolId(req))',
      'rollbackService.getRollbackPlan(req.params.id, getVerifiedSchoolId(req))',
      'suppressionService.getSuppressionRule(req.params.id, getVerifiedSchoolId(req))',
      'summaryService.getActionSummary(req.params.id, getVerifiedSchoolId(req))',
    ];
    for (const fragment of scopedGets) {
      expect(content).toContain(fragment);
    }
  });

  it('DryRun receipt list-by-queue-item cannot leak cross-school records', () => {
    const routeContent = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(routeContent).toContain('dryRunService.listReceiptsForQueueItem(queueItemId as string, schoolId)');
    // The shared repository contract keeps listByQueueItemId(queueItemId)
    // without schoolId; the production service accepts verified schoolId and
    // filters returned receipts.
    const reposContent = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    expect(reposContent).toContain('async listByQueueItemId(queueItemId: string)');
    const serviceFile = path.join(
      BACKEND_ROOT,
      'src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeDryRunReceiptService.ts',
    );
    const serviceContent = fs.readFileSync(serviceFile, 'utf-8');
    expect(serviceContent).toContain('listReceiptsForQueueItem(queueItemId: string, schoolId?: string)');
    expect(serviceContent).toContain('records.filter(r => r.schoolId === schoolId)');
  });

  it('Action Summary refresh whitelist exists and is enforced', () => {
    const reposContent = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    expect(reposContent).toContain('ACTION_SUMMARY_REFRESH_WHITELIST');
    // The whitelist definition enumerates exactly the five projection fields
    // and nothing else — identity/ownership/status can never be refreshed.
    const whitelistStart = reposContent.indexOf('export const ACTION_SUMMARY_REFRESH_WHITELIST');
    expect(whitelistStart).toBeGreaterThan(-1);
    const whitelistEnd = reposContent.indexOf('] as const;', whitelistStart);
    expect(whitelistEnd).toBeGreaterThan(-1);
    const whitelistBody = reposContent.slice(whitelistStart, whitelistEnd);
    for (const field of ['safeSummary', 'actionCountsJson', 'topActionsJson', 'nextStepsJson', 'sourceRefsJson']) {
      expect(whitelistBody).toContain(`'${field}'`);
    }
    for (const forbidden of ['schoolId', 'createdByActorId', 'createdByRole', 'actionSummaryId', 'summaryStatus']) {
      expect(whitelistBody).not.toContain(`'${forbidden}'`);
    }
    const serviceFile = path.join(
      BACKEND_ROOT,
      'src/domains/assessment/recovery-outcome-action/services/recoveryOutcomeActionSummaryService.ts',
    );
    const serviceContent = fs.readFileSync(serviceFile, 'utf-8');
    expect(serviceContent).toContain('ACTION_SUMMARY_REFRESH_WHITELIST');
    expect(serviceContent).toContain('buildRefreshPatch');
    // The service patch builder only forwards whitelisted keys.
    const builderStart = serviceContent.indexOf('private buildRefreshPatch');
    const builderEnd = serviceContent.indexOf('async createActionSummary', builderStart);
    const builder = serviceContent.slice(builderStart, builderEnd);
    expect(builder).toContain('ACTION_SUMMARY_REFRESH_WHITELIST');
    expect(builder).not.toContain('schoolId');
    expect(builder).not.toContain('createdByActorId');
    expect(builder).not.toContain('createdByRole');
  });

  it('Action Readiness composition is unchanged (R8-G.2 durable chain intact)', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('createProductionReadinessService');
    expect(content).toContain('PrismaRecoveryOutcomeActionReadinessAtomicStore');
    expect(content).toContain('PrismaRecoveryOutcomeActionReadinessRepository');
  });

  it('G.3B-A composition unchanged (five families still Prisma + prep store)', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).toContain('createProductionBundleService');
    expect(content).toContain('createProductionDraftService');
    expect(content).toMatch(/new RecoveryOutcomeActionBundleService\([\s\S]*?bundleAtomicStore,\s*\)/);
    expect(content).toMatch(/new serviceClass\([\s\S]*?draftAtomicStore,\s*\)/);
    const reposContent = fs.readFileSync(PRISMA_REPOS_FILE, 'utf-8');
    for (const cls of FIVE_G3BA_PRISMA_CLASSES) {
      expect(classBody(reposContent, cls)).not.toContain("throw new Error('Not implemented in stub')");
    }
  });

  it('zero production Package-20 in-memory resource construction remains', () => {
    const content = fs.readFileSync(ROUTE_FILE, 'utf-8');
    expect(content).not.toContain('InMemoryRecoveryOutcome');
    expect(content).not.toContain('new InMemoryRecoveryOutcome');
  });

  it('no live execution integration exists in the six special services or route', () => {
    const routeContent = fs.readFileSync(ROUTE_FILE, 'utf-8');
    const liveMarkers = [
      'liveRecoveryActivation',
      'liveRecoveryCompletion',
      'liveRecoveryClosure',
      'liveRollbackExecution',
      'liveSuppressionEnforcement',
    ];
    for (const marker of liveMarkers) {
      expect(routeContent).not.toContain(marker);
    }
    for (const svc of SIX_SPECIAL_SERVICE_CLASSES) {
      const serviceFile = path.join(BACKEND_ROOT, 'src/domains/assessment/recovery-outcome-action/services', `${svc}.ts`);
      const serviceContent = fs.readFileSync(serviceFile, 'utf-8');
      for (const marker of liveMarkers) {
        expect(serviceContent).not.toContain(marker);
      }
    }
  });
});