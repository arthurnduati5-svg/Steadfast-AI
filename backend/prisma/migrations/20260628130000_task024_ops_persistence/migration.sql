-- Create OpsIncident table for Task 024 operational incident tracking
CREATE TABLE "OpsIncident" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "source" TEXT,
    "safeTitle" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "redactionStatus" TEXT NOT NULL DEFAULT 'redacted',
    "reasonCodes" JSONB NOT NULL DEFAULT '[]',
    "affectedComponents" JSONB NOT NULL DEFAULT '[]',
    "recommendedOwnerRole" TEXT NOT NULL DEFAULT 'admin',
    "studentSafetyRelevant" BOOLEAN NOT NULL DEFAULT false,
    "privacyRelevant" BOOLEAN NOT NULL DEFAULT false,
    "deenGovernanceRelevant" BOOLEAN NOT NULL DEFAULT false,
    "metadataSafeJson" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classifiedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "investigatingAt" TIMESTAMP(3),
    "mitigatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "falsePositiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsIncident_pkey" PRIMARY KEY ("id")
);

-- Indexes for OpsIncident common lookup fields
CREATE INDEX "OpsIncident_schoolId_idx" ON "OpsIncident"("schoolId");
CREATE INDEX "OpsIncident_category_idx" ON "OpsIncident"("category");
CREATE INDEX "OpsIncident_severity_idx" ON "OpsIncident"("severity");
CREATE INDEX "OpsIncident_status_idx" ON "OpsIncident"("status");
CREATE INDEX "OpsIncident_detectedAt_idx" ON "OpsIncident"("detectedAt");

-- Create OpsIncidentAudit table for incident audit trail
CREATE TABLE "OpsIncidentAudit" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "schoolId" TEXT,
    "actorRole" TEXT NOT NULL DEFAULT 'unknown',
    "actorIdSafe" TEXT,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL DEFAULT 'open',
    "safeNote" TEXT,
    "metadataSafeJson" JSONB,
    "redactionStatus" TEXT NOT NULL DEFAULT 'redacted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "correlationId" TEXT,

    CONSTRAINT "OpsIncidentAudit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OpsIncidentAudit_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "OpsIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for OpsIncidentAudit common lookup fields
CREATE INDEX "OpsIncidentAudit_incidentId_idx" ON "OpsIncidentAudit"("incidentId");
CREATE INDEX "OpsIncidentAudit_schoolId_idx" ON "OpsIncidentAudit"("schoolId");
CREATE INDEX "OpsIncidentAudit_action_idx" ON "OpsIncidentAudit"("action");
CREATE INDEX "OpsIncidentAudit_createdAt_idx" ON "OpsIncidentAudit"("createdAt");

-- Create OpsMetricSnapshot table for operational metrics snapshots
CREATE TABLE "OpsMetricSnapshot" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "rateLimitCount" INTEGER NOT NULL DEFAULT 0,
    "p50LatencyMs" INTEGER,
    "p95LatencyMs" INTEGER,
    "p99LatencyMs" INTEGER,
    "statusCodeFamilyCounts" JSONB NOT NULL DEFAULT '{}',
    "routeFamilyCounts" JSONB NOT NULL DEFAULT '{}',
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "openIncidentCount" INTEGER NOT NULL DEFAULT 0,
    "databaseStatus" TEXT NOT NULL DEFAULT 'unknown',
    "redisStatus" TEXT,
    "aiProviderFailureCount" INTEGER NOT NULL DEFAULT 0,
    "backupStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastBackupAt" TIMESTAMP(3),
    "restoreDrillStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastRestoreDrillAt" TIMESTAMP(3),
    "metadataSafeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- Indexes for OpsMetricSnapshot common lookup fields
CREATE INDEX "OpsMetricSnapshot_schoolId_idx" ON "OpsMetricSnapshot"("schoolId");
CREATE INDEX "OpsMetricSnapshot_createdAt_idx" ON "OpsMetricSnapshot"("createdAt");

-- Create OpsBackupCheck table for backup readiness checks
CREATE TABLE "OpsBackupCheck" (
    "id" TEXT NOT NULL,
    "backupConfigured" BOOLEAN NOT NULL DEFAULT false,
    "backupProvider" TEXT NOT NULL DEFAULT 'unknown',
    "backupMode" TEXT NOT NULL DEFAULT 'local_drill',
    "lastBackupAt" TIMESTAMP(3),
    "lastBackupStatus" TEXT NOT NULL DEFAULT 'unknown',
    "backupAgeHours" INTEGER,
    "expectedBackupFrequencyHours" INTEGER,
    "safeSummary" TEXT NOT NULL,
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsBackupCheck_pkey" PRIMARY KEY ("id")
);

-- Index for OpsBackupCheck
CREATE INDEX "OpsBackupCheck_createdAt_idx" ON "OpsBackupCheck"("createdAt");

-- Create OpsRestoreDrill table for restore drill results
CREATE TABLE "OpsRestoreDrill" (
    "id" TEXT NOT NULL,
    "drillId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "backupArtifactRefSafe" TEXT NOT NULL,
    "checksum" TEXT,
    "restoreTargetSafe" TEXT NOT NULL,
    "integrityChecks" JSONB NOT NULL DEFAULT '[]',
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "safeSummary" TEXT NOT NULL,
    "destructiveCommandExecuted" BOOLEAN NOT NULL DEFAULT false,
    "realProductionDataOverwritten" BOOLEAN NOT NULL DEFAULT false,
    "metadataSafeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsRestoreDrill_pkey" PRIMARY KEY ("id")
);

-- Indexes for OpsRestoreDrill
CREATE INDEX "OpsRestoreDrill_drillId_idx" ON "OpsRestoreDrill"("drillId");
CREATE INDEX "OpsRestoreDrill_status_idx" ON "OpsRestoreDrill"("status");
CREATE INDEX "OpsRestoreDrill_createdAt_idx" ON "OpsRestoreDrill"("createdAt");

-- Create OpsReport table for operational reports
CREATE TABLE "OpsReport" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskName" TEXT NOT NULL,
    "reportKind" TEXT NOT NULL DEFAULT 'task-024',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "safeSummary" TEXT NOT NULL,
    "safeToStartNextTask" BOOLEAN NOT NULL DEFAULT false,
    "blockingIssues" JSONB NOT NULL DEFAULT '[]',
    "knownLimitations" JSONB NOT NULL DEFAULT '[]',
    "verificationSummary" JSONB NOT NULL DEFAULT '{}',
    "artifactPaths" JSONB NOT NULL DEFAULT '[]',
    "metadataSafeJson" JSONB,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsReport_pkey" PRIMARY KEY ("id")
);

-- Indexes for OpsReport
CREATE INDEX "OpsReport_taskId_idx" ON "OpsReport"("taskId");
CREATE INDEX "OpsReport_status_idx" ON "OpsReport"("status");
CREATE INDEX "OpsReport_generatedAt_idx" ON "OpsReport"("generatedAt");
