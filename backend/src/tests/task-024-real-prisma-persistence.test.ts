import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from './__generated__/prisma-test-client';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const TEST_DB_REL = 'task-024-persistence-test.sqlite';
const SCHEMA_PATH = path.resolve(__dirname, '../../prisma/schema.test.sqlite.prisma');
const DB_PATH = path.resolve(__dirname, '../../prisma', TEST_DB_REL);

let prisma: PrismaClient;

beforeAll(() => {
  process.env.TASK024_REQUIRE_REAL_PRISMA = '1';

  const dbUrl = `file:${DB_PATH.replace(/\\/g, '/')}`;
  process.env.TEST_DATABASE_URL = dbUrl;

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  execSync(
    `npx prisma db push --schema "${SCHEMA_PATH}" --accept-data-loss --skip-generate`,
    { cwd: path.resolve(__dirname, '../..'), env: { ...process.env, TEST_DATABASE_URL: dbUrl }, stdio: 'pipe', timeout: 30000 }
  );

  prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
  try {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  } catch { /* ignore cleanup errors */ }
});

describe('Task 024 Real Prisma Persistence — Strict Mode', () => {

  it('strict mode flag is set', () => {
    expect(process.env.TASK024_REQUIRE_REAL_PRISMA).toBe('1');
  });

  let testIncidentId: string;
  let testDrillId: string;

  it('creates OpsIncident and fresh Prisma read finds it by id', async () => {
    const created = await prisma.opsIncident.create({
      data: {
        schoolId: 'school_task024_test',
        category: 'system_outage',
        severity: 'critical',
        status: 'open',
        source: 'task024_test',
        safeTitle: 'Task 024 synthetic persistence test',
        safeSummary: 'Synthetic safe operational record for persistence verification',
        reasonCodes: '["test_persistence"]',
        affectedComponents: '["test_framework"]',
        recommendedOwnerRole: 'admin',
        studentSafetyRelevant: false,
        privacyRelevant: false,
        deenGovernanceRelevant: false,
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.safeTitle).toBe('Task 024 synthetic persistence test');
    expect(created.schoolId).toBe('school_task024_test');
    expect(created.status).toBe('open');
    testIncidentId = created.id;

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const found = await freshPrisma.opsIncident.findUnique({ where: { id: testIncidentId } });
      expect(found).not.toBeNull();
      expect(found!.id).toBe(testIncidentId);
      expect(found!.safeTitle).toBe('Task 024 synthetic persistence test');
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('creates OpsIncidentAudit and fresh Prisma read finds it by incidentId', async () => {
    expect(testIncidentId).toBeTruthy();
    const created = await prisma.opsIncidentAudit.create({
      data: {
        incident: { connect: { id: testIncidentId } },
        schoolId: 'school_task024_test',
        actorRole: 'test_runner',
        actorIdSafe: 'actor_hash_task024_test',
        action: 'test_persistence',
        previousStatus: 'open',
        newStatus: 'investigating',
        safeNote: 'Test audit for persistence proof',
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
        redactionStatus: 'redacted',
        requestId: 'req_task024_test',
        correlationId: 'corr_task024_test',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.incidentId).toBe(testIncidentId);

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const records = await freshPrisma.opsIncidentAudit.findMany({
        where: { incidentId: testIncidentId },
      });
      expect(records.length).toBeGreaterThanOrEqual(1);
      const match = records.find((r) => r.action === 'test_persistence');
      expect(match).toBeDefined();
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('creates OpsMetricSnapshot and fresh Prisma read finds it by id', async () => {
    const created = await prisma.opsMetricSnapshot.create({
      data: {
        schoolId: 'school_task024_test',
        requestCount: 100,
        errorCount: 2,
        rateLimitCount: 1,
        p50LatencyMs: 45,
        p95LatencyMs: 120,
        p99LatencyMs: 300,
        statusCodeFamilyCounts: '{"2xx":85,"4xx":12,"5xx":3}',
        routeFamilyCounts: '{"/api/chat":60,"/api/practice":40}',
        incidentCount: 1,
        openIncidentCount: 1,
        databaseStatus: 'healthy',
        aiProviderFailureCount: 0,
        backupStatus: 'unknown',
        restoreDrillStatus: 'unknown',
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const found = await freshPrisma.opsMetricSnapshot.findUnique({ where: { id: created.id } });
      expect(found).not.toBeNull();
      expect(found!.requestCount).toBe(100);
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('creates OpsBackupCheck and fresh Prisma read finds it by id', async () => {
    const created = await prisma.opsBackupCheck.create({
      data: {
        backupConfigured: true,
        backupProvider: 'local_drill',
        backupMode: 'local_drill',
        lastBackupStatus: 'unknown',
        safeSummary: 'Test backup check for persistence proof',
        blockingIssues: '[]',
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const found = await freshPrisma.opsBackupCheck.findUnique({ where: { id: created.id } });
      expect(found).not.toBeNull();
      expect(found!.backupConfigured).toBe(true);
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('creates OpsRestoreDrill and fresh Prisma read finds it by drillId', async () => {
    testDrillId = `drill_task024_test_${Date.now()}`;
    const created = await prisma.opsRestoreDrill.create({
      data: {
        drillId: testDrillId,
        status: 'completed',
        backupArtifactRefSafe: 'test_backup_artifact_001',
        checksum: 'abc123checksum',
        restoreTargetSafe: 'test_restore_target',
        integrityChecks: '["checksum_match","row_count_match"]',
        blockingIssues: '[]',
        safeSummary: 'Test restore drill for persistence proof',
        destructiveCommandExecuted: false,
        realProductionDataOverwritten: false,
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.drillId).toBe(testDrillId);

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const found = await freshPrisma.opsRestoreDrill.findFirst({
        where: { drillId: testDrillId },
      });
      expect(found).not.toBeNull();
      expect(found!.drillId).toBe(testDrillId);
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('creates OpsReport and fresh Prisma read finds it by id', async () => {
    const created = await prisma.opsReport.create({
      data: {
        taskId: '024',
        taskName: 'Production Monitoring and Operational Hardening',
        reportKind: 'task-024',
        status: 'verified',
        safeSummary: 'Test OpsReport for persistence proof',
        safeToStartNextTask: false,
        blockingIssues: '["Must pass persistence proof first"]',
        knownLimitations: '["Test run"]',
        verificationSummary: '{"persistenceTestRun":true,"fallbackUsed":false}',
        artifactPaths: '["docs/ops/task-024/task-024-ops-report.json"]',
        metadataSafeJson: '{"test":true,"containsPrivateData":false}',
      },
    });

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();

    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const found = await freshPrisma.opsReport.findUnique({ where: { id: created.id } });
      expect(found).not.toBeNull();
      expect(found!.taskId).toBe('024');
      expect(found!.safeToStartNextTask).toBe(false);
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('fresh repository instance can read previously written records', async () => {
    expect(testIncidentId).toBeTruthy();
    const freshPrisma = new PrismaClient({
      datasources: { db: { url: `file:${DB_PATH.replace(/\\/g, '/')}` } },
    });
    try {
      const incident = await freshPrisma.opsIncident.findUnique({ where: { id: testIncidentId } });
      expect(incident).not.toBeNull();
      expect(incident!.safeTitle).toBe('Task 024 synthetic persistence test');

      if (testDrillId) {
        const drill = await freshPrisma.opsRestoreDrill.findFirst({ where: { drillId: testDrillId } });
        expect(drill).not.toBeNull();
      }

      const audits = await freshPrisma.opsIncidentAudit.findMany({ where: { incidentId: testIncidentId } });
      expect(audits.length).toBeGreaterThanOrEqual(1);
    } finally {
      await freshPrisma.$disconnect();
    }
  });
});
