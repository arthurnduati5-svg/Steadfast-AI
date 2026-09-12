-- R8-G.3A-D1: durable Tutor snapshots + Living Revision canonical records.
-- Additive only. Snapshots/history are later-retrieval state (NOT cache).
-- The revision graph is a DERIVED_VIEW (nodes + edges + due state); no
-- persistent graph model is created by design. openDedupeKey is a nullable
-- unique key: at most one OPEN due item per learner node, while completed
-- rows (NULL key) never block future revision cycles.

-- TutorStateSnapshotRecord
CREATE TABLE IF NOT EXISTS "TutorStateSnapshotRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "stateVersion" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reason" TEXT,
    "domainsIncluded" JSONB NOT NULL DEFAULT '[]',
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorStateSnapshotRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TutorStateSnapshotRecord_schoolId_studentId_createdAt_idx" ON "TutorStateSnapshotRecord"("schoolId", "studentId", "createdAt");

-- Phase3RevisionNodeRecord
CREATE TABLE IF NOT EXISTS "Phase3RevisionNodeRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,
    "nodeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "subjectId" TEXT,
    "topicId" TEXT,
    "skillId" TEXT,
    "objectiveId" TEXT,
    "safeTitle" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "learnerVisibleText" TEXT,
    "sourceAnchorTitle" TEXT,
    "approvedSourceRef" TEXT,
    "sourceTruth" JSONB NOT NULL,
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "safeReasonCodes" JSONB NOT NULL DEFAULT '[]',
    "connectionCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase3RevisionNodeRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Phase3RevisionNodeRecord_schoolId_studentId_idx" ON "Phase3RevisionNodeRecord"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "Phase3RevisionNodeRecord_schoolId_idx" ON "Phase3RevisionNodeRecord"("schoolId");

-- Phase3RevisionEdgeRecord
CREATE TABLE IF NOT EXISTS "Phase3RevisionEdgeRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,
    "edgeType" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "safeReasonCodes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phase3RevisionEdgeRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Phase3RevisionEdgeRecord_schoolId_studentId_idx" ON "Phase3RevisionEdgeRecord"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "Phase3RevisionEdgeRecord_sourceNodeId_idx" ON "Phase3RevisionEdgeRecord"("sourceNodeId");
CREATE INDEX IF NOT EXISTS "Phase3RevisionEdgeRecord_targetNodeId_idx" ON "Phase3RevisionEdgeRecord"("targetNodeId");

-- Phase3RevisionDueItemRecord
CREATE TABLE IF NOT EXISTS "Phase3RevisionDueItemRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "edgeId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "signalType" TEXT NOT NULL,
    "safeTitle" TEXT NOT NULL,
    "safeSummary" TEXT NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "sourceTruthStatus" TEXT NOT NULL,
    "objectiveId" TEXT,
    "topicId" TEXT,
    "skillId" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "openDedupeKey" TEXT,
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "safeReasonCodes" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase3RevisionDueItemRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Phase3RevisionDueItemRecord_openDedupeKey_key" ON "Phase3RevisionDueItemRecord"("openDedupeKey");
CREATE INDEX IF NOT EXISTS "Phase3RevisionDueItemRecord_schoolId_studentId_idx" ON "Phase3RevisionDueItemRecord"("schoolId", "studentId");
CREATE INDEX IF NOT EXISTS "Phase3RevisionDueItemRecord_schoolId_studentId_isCompleted_idx" ON "Phase3RevisionDueItemRecord"("schoolId", "studentId", "isCompleted");
CREATE INDEX IF NOT EXISTS "Phase3RevisionDueItemRecord_nodeId_idx" ON "Phase3RevisionDueItemRecord"("nodeId");

-- Phase3RevisionAuditRecord (append-only: no update/delete path exists in code)
CREATE TABLE IF NOT EXISTS "Phase3RevisionAuditRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "classId" TEXT,
    "nodeId" TEXT,
    "edgeId" TEXT,
    "objectiveId" TEXT,
    "topicId" TEXT,
    "skillId" TEXT,
    "eventType" TEXT NOT NULL,
    "safeReasonCodes" JSONB NOT NULL DEFAULT '[]',
    "safeEvidenceRefs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phase3RevisionAuditRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Phase3RevisionAuditRecord_schoolId_createdAt_idx" ON "Phase3RevisionAuditRecord"("schoolId", "createdAt");
